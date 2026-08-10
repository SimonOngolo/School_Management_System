// bff/rabbitmq.js
const amqplib = require('amqplib');

async function connectRabbit(url) {
  try {
    const conn = await amqplib.connect(url || process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
    const channel = await conn.createChannel();
    return { conn, channel };
  } catch (e) {
    console.error('Failed to connect to RabbitMQ', e);
    return null;
  }
}

async function publish(url, queue, message) {
  const r = await connectRabbit(url);
  if (!r) return false;
  const { conn, channel } = r;
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
  setTimeout(() => conn.close(), 500);
  return true;
}

module.exports = { connectRabbit, publish };
