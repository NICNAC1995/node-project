import { startServer } from "./sever";
import { connect } from "./config/typeorm";
import { startCron } from "./config/cronjob";

async function main() {
  connect();
  const port: number = 4000;
  const app = await startServer();
  startCron();
  app.listen(port);
  console.log("App running on port", port);
}

main();
