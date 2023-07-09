import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";

interface Player {
  name: string;
  password: string;
}

const players: Player[] = [];

function sendMessage(client: WebSocket, message: object) {
  client.send(JSON.stringify(message));
}
const checkPlayer = (nam: string): boolean => {
  return players.some((player) => player.name === nam);
};

export const wsserver = new WebSocket.Server({
  port: 3000,
});

wsserver.on("connection", (ws: WebSocket) => {
  console.log("Connection");

  ws.on("message", (message: string) => {
    console.log(`Received message ${message}`);

    const { type, data, id } = JSON.parse(message);
    let { name, password } = JSON.parse(data);
    console.log(data, name, password);

    if (type === "reg") {
      console.log(players);
      if (checkPlayer(name)) {
        const index = players.findIndex((player) => player.name === name);
        const responce = {
          type: "reg",
          data: JSON.stringify({
            name: name,
            index: index,
            error: true,
            errorText: "Player name already exists",
          }),
          id: 0,
        };

        sendMessage(ws, responce);
        console.log("Player name already exists");
        console.log(responce);

        return;
      } else {
        players.push(JSON.parse(data));

        const responce = {
          type: "reg",
          data: JSON.stringify({
            name: name,
            index: uuidv4(),
            error: "false",
            errorText: "",
          }),
          id: 0,
        };
        sendMessage(ws, responce);
        console.log("Player created");
      }
    }
  });
});
