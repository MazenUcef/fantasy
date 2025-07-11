import config from "../config/config";
import { createTeamForUser } from "../controllers/TeamController";
import RabbitMQ from "./RabbitMQ";



const startTeamWorker = async () => {
    let retryCount = 0;
    const MAX_RETRIES = 5;

    while (retryCount < MAX_RETRIES) {
        try {
            await RabbitMQ.consume(
                config.rabbitmq.queues.teamCreation,
                async (msg: { userId: string, email: string }) => {
                    try {
                        console.log(`Creating team for user ${msg.email}`);
                        await createTeamForUser(msg.userId);
                    } catch (error) {
                        console.error(`Failed to create team for ${msg.email}:`, error);
                        throw error;
                    }
                }
            );
            console.log('Team creation worker started');
            return;
        } catch (error) {
            retryCount++;
            console.error(`Worker start failed (attempt ${retryCount}):`, error);
            if (retryCount < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
            }
        }
    }

    console.error('Failed to start team worker after maximum retries');
    process.exit(1);
};

export default startTeamWorker;