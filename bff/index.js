require('dotenv').config();

const express = require('express');
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { connectRabbit } = require('./rabbitmq');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;
const API_URL = process.env.API_URL || 'http://localhost:3002';
const BULLETIN_URL = process.env.BULLETIN_URL || 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Simple token issuer (dev only)
app.post('/auth/token', (req, res) => {
  const { user } = req.body;
  if (!user) return res.status(400).json({ error: 'user required in body' });
  const token = jwt.sign({ user }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Example aggregated endpoint
app.get('/student/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [apiRes, bulletinRes] = await Promise.all([
      axios.get(`${API_URL}/api/students/${id}`).catch(() => ({ data: null })),
      axios.get(`${BULLETIN_URL}/bulletins/student/${id}`).catch(() => ({ data: null }))
    ]);
    res.json({ student: apiRes.data, bulletins: bulletinRes.data });
  } catch (err) {
    res.status(500).json({ error: 'aggregation error', details: err.message });
  }
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
});

// Connect to RabbitMQ and listen for events to broadcast via socket.io
async function start() {
  const skipRabbit = (process.env.SKIP_RABBITMQ || '').toLowerCase() === 'true';
  if (skipRabbit) {
    console.log('SKIP_RABBITMQ is set — skipping RabbitMQ connection');
    server.listen(PORT, () => console.log(`BFF listening on ${PORT}`));
    return;
  }

  const rabbitUrl = process.env.RABBITMQ_URL;
  if (!rabbitUrl) {
    console.warn('RABBITMQ_URL not set — attempting default connect, set SKIP_RABBITMQ=true to skip');
  }

  try {
    const rabbit = await connectRabbit(rabbitUrl);
    if (rabbit) {
      const { channel } = rabbit;
      const q = 'school.events';
      await channel.assertQueue(q, { durable: true });
      channel.consume(q, (msg) => {
        if (msg) {
          try {
            const event = JSON.parse(msg.content.toString());
            io.emit(event.type, event.payload);
            channel.ack(msg);
          } catch (e) {
            console.error('failed to process message', e);
            channel.nack(msg, false, false);
          }
        }
      });
      console.log('Connected to RabbitMQ and consuming queue:', q);
    } else {
      console.warn('connectRabbit returned null — continuing without RabbitMQ');
    }
  } catch (e) {
    console.error('Failed to connect to RabbitMQ (continuing without it):', e && e.message ? e.message : e);
  }

  server.listen(PORT, () => console.log(`BFF listening on ${PORT}`));
}

start().catch((e) => {
  console.error('Failed to start BFF', e);
  process.exit(1);
});
