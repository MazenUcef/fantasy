import express, { Request, Response, Application, NextFunction } from 'express';
import "dotenv/config";
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import connectDB from './config/database';
import job from './config/cron';
import authRoutes from './routes/AuthRoutes'
import transferRoutes from './routes/TransferRoutes'
import teamRoutes from './routes/TeamRoutes'
import startTeamWorker from './utils/StartWork';


const app: Application = express();

job.start()

if (!process.env.MONGO_URL) {
    throw new Error('MONGO_URL environment variable is not defined');
};

if (!process.env.PORT) {
    throw new Error('PORT environment variable is not defined');
};


// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(helmet());

// Replace your current CORS config with this:
const corsOptions = {
    origin: "https://fantasy-1-77hv.onrender.com",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));



// Health Check
app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ message: "Server is very healthy" })
})

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});


interface CustomError extends Error {
    statusCode?: number;
}

app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        statusCode,
        message
    });
});


app.use('/api/auth', authRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/team', teamRoutes);

// Start server only after DB connection
const startServer = async (): Promise<void> => {
    try {
        await connectDB();
        await startTeamWorker()
        const port = process.env.PORT || 5000
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        })
    } catch (error) {
        console.error('Failed to start server:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
};


startServer();