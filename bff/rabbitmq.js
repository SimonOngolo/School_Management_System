// bff/rabbitmq.js
const amqplib = require('amqplib');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectRabbit(url, opts = {}) {
  const rabbitUrl = url || process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  const maxAttempts = Number(opts.retries ?? 5);
  const baseDelay = Number(opts.baseDelayMs ?? 1000);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt > 1) console.log(`RabbitMQ: retry attempt ${attempt}/${maxAttempts} connecting to ${rabbitUrl}`);
      const conn = await amqplib.connect(rabbitUrl);
      const channel = await conn.createChannel();
      return { conn, channel };
    } catch (e) {
      const isLast = attempt === maxAttempts;
      console.error(`Failed to connect to RabbitMQ (attempt ${attempt}):`, e && e.message ? e.message : e);
      if (isLast) break;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      // jitter: +/- 20%
      const jitter = Math.floor(delay * 0.2 * (Math.random() * 2 - 1));
      const wait = Math.max(250, delay + jitter);
      console.log(`Waiting ${wait}ms before next RabbitMQ connect attempt`);
      await sleep(wait);
    }
  }

  return null;
}

async function publish(url, queue, message) {
  const r = await connectRabbit(url, { retries: 1, baseDelayMs: 200 });
  if (!r) return false;
  const { conn, channel } = r;
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
  setTimeout(() => conn.close(), 500);
  return true;
}

module.exports = { connectRabbit, publish };
