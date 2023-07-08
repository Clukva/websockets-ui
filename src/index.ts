import { httpServer } from "./http_server/server";
import "./http_server/ws";

const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);
