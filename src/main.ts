import { startServer } from "./sever";
import { connect } from "./config/typeorm";
import { useContainer } from "typeorm";
import { startCron } from "./config/cronjob";

async function main() {
  connect();
  const port: number = 4000;
  //tuve que cambiar el puerto de 4000 a 4001 porque ya estaba en uso preguntar como se soluciona esto. Despues paso lo mismo y lo pase a 4002. Despues otra vez, y volvi a 4000
  const app = await startServer();
  startCron();
  app.listen(port);
  console.log("App running on port", port);
}

main();
