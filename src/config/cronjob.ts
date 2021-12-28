import cron from "node-cron";
import { sendEmailJob } from "./mailer";

export const startCron = () => {
  console.log("Cron job running...");
  cron.schedule("0 9 * * mon", async function () {
    console.log("Sending email");
    await sendEmailJob();
  });
};
