import { CronJob } from 'cron';  // Directly import CronJob
import https from 'https';
import { IncomingMessage } from 'http';

const job = new CronJob(
    "*/14 * * * *", 
    () => {
        https.get(process.env.API_URL as string, (res: IncomingMessage) => {
            if (res.statusCode === 200) {
                console.log("GET request sent successfully");
            } else {
                console.log("GET request failed with status code:", res.statusCode);
            }
        }).on('error', (e) => {
            console.error("Error while sending request", e.message);
        });
    },
    null,
    true,
    'UTC'
);

export default job;