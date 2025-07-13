import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';
import config from '../config/config';

type MessageContent = Record<string, unknown> | unknown[];

let channel: Channel | null = null;

const getChannel = async (): Promise<Channel> => {
    if (channel) return channel;
    channel = await connect();
    return channel;
};

const connect = async (): Promise<Channel> => {
    try {
        console.log('[RabbitMQ] Connecting...');
        const connection = await amqp.connect(config.rabbitmq.url);

        const channel: Channel = await connection.createChannel();
        console.log('[RabbitMQ] Channel created');

        connection.on('close', () => {
            console.error('[RabbitMQ] Connection closed. Reconnecting...');
            setTimeout(() => connect(), 5000);
        });

        connection.on('error', (err: Error) => {
            console.error('[RabbitMQ] Connection error:', err);
        });

        console.log('[RabbitMQ] Connected successfully');
        return channel;
    } catch (error: unknown) {
        console.error('[RabbitMQ] Connection error:', error);
        throw error;
    }
};

const publish = async <T extends MessageContent>(queue: string, message: T): Promise<boolean> => {
    try {
        const ch = await getChannel();
        await ch.assertQueue(queue, { durable: true });
        const payload: string = JSON.stringify(message);
        const success = ch.sendToQueue(queue, Buffer.from(payload), { persistent: true });
        if (!success) {
            console.error(`[RabbitMQ] Failed to publish to ${queue}`);
            return false;
        }
        console.log(`[RabbitMQ] Published to ${queue}`);
        return true;
    } catch (error) {
        console.error(`[RabbitMQ] Publish error to ${queue}:`, error);
        return false;
    }
};


const consume = async <T extends MessageContent>(
    queue: string,
    callback: (msg: T) => Promise<void>
): Promise<void> => {
    const ch: Channel = await connect();
    await ch.assertQueue(queue, { durable: true });
    console.log(`[RabbitMQ] Queue "${queue}" asserted for consumption`);

    ch.prefetch(1);
    ch.consume(queue, async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        const payload: string = msg.content.toString();
        console.log(`[RabbitMQ] Message received from "${queue}":`, payload);

        try {
            const content: T = JSON.parse(payload);
            await callback(content);
            ch.ack(msg);
            console.log(`[RabbitMQ] Message acknowledged from "${queue}"`);
        } catch (error: unknown) {
            console.error(`[RabbitMQ] Error processing message from "${queue}":`, error);
            ch.nack(msg, false, false); // discard
            console.warn(`[RabbitMQ] Message discarded from "${queue}"`);
        }
    });

    console.log(`[RabbitMQ] Consumer set for queue "${queue}"`);
};

export default { connect, publish, consume };