import WebSocket from "ws";
/* import { v4 as uuidv4 } from "uuid";
 */ import dotenv from "dotenv";
import { httpServer } from "./server";

dotenv.config();

interface Player {
  id: number;
  name: string;
  password: string;
}

/* const playerId = uuidv4();
 */ const players: Player[] = [];

function sendMessage(client: WebSocket, message: object) {
  client.send(JSON.stringify(message));
}

export const wsserver = new WebSocket.Server({
  port: 3000,
});

wsserver.on("connection", (ws: WebSocket) => {
  console.log("Connection");

  ws.on("message", (message: string) => {
    console.log(`Received message ${message}`);

    const { type, data, id } = JSON.parse(message);
    const { name, password } = data;

    if (type === "reg") {
      const isNotNewPlayer = players.find((player) => player.name === name);
      if (isNotNewPlayer) {
        const response = {
          type: "reg",
          data: {
            name,
            index: "",
            error: true,
            errorText: "Player name already exists",
          },
          id: 0,
        };
        sendMessage(ws, response);
        return;
      }

      /*       const playerId = uuidv4();
       */ const newPlayer: Player = {
        id: 0,
        name,
        password,
      };
      players.push(newPlayer);
    }
    const response = {
      type: "reg",
      data: {
        name,
        index: 0,
        error: false,
        errorText: "",
      },
      id: 0,
    };
    sendMessage(ws, response);
  });
});
