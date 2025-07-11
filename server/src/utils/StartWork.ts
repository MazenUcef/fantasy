import config from "../config/config";
import { createTeamForUser } from "../controllers/TeamController";
import RabbitMQ from "./RabbitMQ";


const startTeamWorker = async () => {
    try {
        await RabbitMQ.consume(
            config.rabbitmq.queues.teamCreation,
            async (msg: { userId: string, email: string, teamName: string }) => {
                console.log(`Creating team "${msg.teamName}" for user ${msg.email}`)
                await createTeamForUser(msg.userId, msg.teamName);
            }
        );
        console.log('Team creation worker started');
    } catch (error) {
        console.error('Failed to start team worker:', error);
        process.exit(1);
    }
};

export default startTeamWorker;