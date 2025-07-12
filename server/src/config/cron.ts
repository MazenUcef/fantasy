import { CronJob } from "cron";
import { IncomingMessage } from "http";
import https from 'https';


const job = new CronJob(
    "*/14 * * * *",
    function () {
        https.get(process.env.API_URL as string, (res: IncomingMessage) => {
            if (res.statusCode === 200) {
                console.log("GET request sent successfully");
            } else {
                console.log("GET request failed with status code:", res.statusCode);
            }
        }).on('error', (e) => {
            console.error("Error while checking server health", e.message);
        });
    },
    null,
    true,
    'UTC'
);
export default job;