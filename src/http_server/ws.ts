import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";

interface Player {
  name: string;
  password: string;
}
interface Room {
  players: [player1: string, player2?: string];
  id: number;
}

const players: Player[] = [];
const rooms: Room[] = [];

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

    if (type === "reg") {
      let { name, password } = JSON.parse(data);
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

        return;
      } else {
        players.push(JSON.parse(data));

        const responce = {
          type: "reg",
          data: JSON.stringify({
            name: name,
            index: uuidv4(),
            error: false,
            errorText: "Player already registred",
          }),
          id: 0,
        };
        sendMessage(ws, responce);
        console.log("Player created");
      }
    }

    if (type === "create_room") {
      if (rooms.length > 1 && rooms[rooms.length - 1].players.length < 2) {
        const responce = {
          type: "add_user_to_room",
          data: JSON.stringify({
            indexRoom: rooms.length - 1,
          }),
          id: 0,
        };
        sendMessage(ws, responce);
        rooms[rooms.length - 1].players.push(name);
      } else {
        rooms.push({
          players: [name],
          id: rooms.length,
        });
        const responce = {
          type: "add_user_to_room",
          data: JSON.stringify({
            indexRoom: rooms.length - 1,
          }),
          id: 0,
        };
        sendMessage(ws, responce);
      }
      console.log(rooms);
    }
  });
});
