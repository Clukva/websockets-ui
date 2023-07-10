import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";

interface Player {
  name: string;
  password: string;
  id: string;
  wins: number;
}
interface Room {
  players: [player1: string, player2?: string];
  id: number;
}

const players: Player[] = [];
const rooms: Room[] = [];
const waitingList: WebSocket[] = [];
const connectionIds: Map<WebSocket, string> = new Map();

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
        const index = players.findIndex(
          (player, password) =>
            player.name === name && +player.password === password
        );
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
        players.push({
          name: name,
          password: password,
          id: uuidv4(),
          wins: 0,
        });

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

        waitingList.push(ws);
        connectionIds.set(ws, players[players.length - 1].id);
        console.log("Player created");
        console.log(waitingList);
      }
    }

    if (type === "create_room") {
      const playerIndex = waitingList.indexOf(ws);
      const playerId = connectionIds.get(ws);
      const playerName = players.find((player) => player.id === playerId)?.name;

      waitingList.forEach((player) => {
        const responsePlayer = {
          type: "update_room",
          data: JSON.stringify([
            {
              roomId: 6666,
              roomUsers: [
                {
                  name: playerName,
                  index: playerIndex,
                },
              ],
            },
          ]),
          id: 0,
        };
        sendMessage(player, responsePlayer);
      });
    }
    if (type === "add_user_to_room") {
      const indexRoom = 6666;

      const responseAddToRoom = {
        type: "add_user_to_room",
        data: JSON.stringify({
          indexRoom: indexRoom,
        }),
        id: 0,
      };

      sendMessage(ws, responseAddToRoom);

      const playerIndex = waitingList.indexOf(ws);
      const playerId = connectionIds.get(ws);
      const playerName = players.find((player) => player.id === playerId)?.name;

      waitingList.forEach((player) => {
        const responsePlayer = {
          type: "update_room",
          data: JSON.stringify([
            {
              roomId: 6666,
              roomUsers: [
                {
                  name: playerName,
                  index: playerIndex,
                },
              ],
            },
          ]),
          id: 0,
        };
        sendMessage(player, responsePlayer);
      });
    }
  });
});
