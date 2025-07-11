import amqp, { Channel, Connection } from 'amqplib';
import config from '../config/config';

const connect = async (): Promise<Channel> => {
    try {
        console.log('[RabbitMQ] Connecting...');
        const connection = await amqp.connect(config.rabbitmq.url);

        const channel = await connection.createChannel();
        console.log('[RabbitMQ] Channel created');

        connection.on('close', () => {
            console.error('[RabbitMQ] Connection closed. Reconnecting...');
            setTimeout(() => connect(), 5000);
        });

        connection.on('error', (err) => {
            console.error('[RabbitMQ] Connection error:', err);
        });

        console.log('[RabbitMQ] Connected successfully');
        return channel;
    } catch (error) {
        console.error('[RabbitMQ] Connection error:', error);
        throw error;
    }
};

const publish = async (queue: string, message: any): Promise<void> => {
    const ch = await connect();
    await ch.assertQueue(queue, { durable: true });
    console.log(`[RabbitMQ] Queue "${queue}" asserted`);

    const payload = JSON.stringify(message);
    ch.sendToQueue(queue, Buffer.from(payload), { persistent: true });
    console.log(`[RabbitMQ] Message published to "${queue}":`, payload);
};

const consume = async (queue: string, callback: (msg: any) => Promise<void>): Promise<void> => {
    const ch = await connect();
    await ch.assertQueue(queue, { durable: true });
    console.log(`[RabbitMQ] Queue "${queue}" asserted for consumption`);

    ch.prefetch(1);
    ch.consume(queue, async (msg) => {
        if (!msg) return;

        const payload = msg.content.toString();
        console.log(`[RabbitMQ] Message received from "${queue}":`, payload);

        try {
            const content = JSON.parse(payload);
            await callback(content);
            ch.ack(msg);
            console.log(`[RabbitMQ] Message acknowledged from "${queue}"`);
        } catch (error) {
            console.error(`[RabbitMQ] Error processing message from "${queue}":`, error);
            ch.nack(msg, false, false); // discard
            console.warn(`[RabbitMQ] Message discarded from "${queue}"`);
        }
    });

    console.log(`[RabbitMQ] Consumer set for queue "${queue}"`);
};

export default { connect, publish, consume };
