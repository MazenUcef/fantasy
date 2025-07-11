import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    mongoose: {
        url: process.env.MONGO_URL as string,
        options: {
            autoIndex: true,
        },
    },
    rabbitmq: {
        url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
        queues: {
            teamCreation: 'team_creation'
        }
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    initialBudget: 5_000_000, // $5M initial budget
};

export default config;