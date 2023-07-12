import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";

interface Player {
  name: string;
  password: string;
  id: string;
  wins: number;
}
interface RoomUser {
  name?: string;
  index: number;
}

interface RoomData {
  roomId: number;
  roomUsers: RoomUser[];
}

const players: Player[] = [];
const rooms: RoomData[] = [];
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
    const { type, data, id } = JSON.parse(message);

    if (type === "reg") {
      let { name, password } = JSON.parse(data);
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
      }
      if (rooms.length > 0) {
        const responsePlayer = {
          type: "update_room",
          data: JSON.stringify(
            rooms.filter((room) => room.roomUsers.length !== 2)
          ),
          id: 0,
        };
        sendMessage(ws, responsePlayer);
      }
    }

    if (type === "create_room") {
      const playerIndex = waitingList.indexOf(ws);
      const playerId = connectionIds.get(ws);
      const playerName = players.find((player) => player.id === playerId)?.name;
      const hasCreatedRoom = rooms.some((room) =>
        room.roomUsers.some((user) => user.name === playerName)
      );
      if (!hasCreatedRoom) {
        const roomUser: RoomUser = {
          name: playerName,
          index: playerIndex,
        };

        const roomData: RoomData = {
          roomId: rooms.length,
          roomUsers: [roomUser],
        };

        rooms.push(roomData);

        waitingList.forEach((player) => {
          const responsePlayer = {
            type: "update_room",
            data: JSON.stringify(
              rooms.filter((room) => room.roomUsers.length !== 2)
            ),
            id: 0,
          };
          sendMessage(player, responsePlayer);
        });
      }
    }
    if (type === "add_user_to_room") {
      const { indexRoom } = JSON.parse(data);

      const playerId = connectionIds.get(ws);
      const playerName = players.find((player) => player.id === playerId)?.name;
      rooms[indexRoom].roomUsers.push();

      if (indexRoom !== -1) {
        const playerIndex = waitingList.indexOf(ws);
        const roomUser: RoomUser = {
          name: playerName,
          index: playerIndex,
        };
        rooms[indexRoom].roomUsers.push(roomUser);

        rooms[indexRoom].roomUsers.forEach((user) => {
          const userSocket = waitingList[user.index];
          if (userSocket) {
            const responseCreateGame = {
              type: "create_game",
              data: JSON.stringify({
                idGame: 11,
                idPlayer: 11,
              }),
              id: 0,
            };
            sendMessage(userSocket, responseCreateGame);
          }
        });

        waitingList.forEach((player) => {
          const responsePlayer = {
            type: "update_room",
            data: JSON.stringify(
              rooms.filter((room) => room.roomUsers.length !== 2)
            ),
            id: 0,
          };
          sendMessage(player, responsePlayer);
        });
      }
    }
  });
});
