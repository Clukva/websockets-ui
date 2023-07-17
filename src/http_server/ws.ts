import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import {
  Player,
  RoomUser,
  RoomData,
  Hits,
  Position,
  СurrentShip,
  arrShip,
} from "./interfaces";
import { turn } from "./turn";
import { updateWinners } from "./updateWinners";

import { finish, checkEmptyHits } from "./finish";

const winners: [string, number][] = [];
const firstTurn: number[] = [];
const players: Player[] = [];
const rooms: RoomData[] = [];
const waitingList: WebSocket[] = [];
const connectionIds: Map<WebSocket, string> = new Map();
const availableHits: Hits[] = [];

export function sendMessage(client: WebSocket, message: object) {
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
        const responce = {
          type: "reg",
          data: JSON.stringify({
            name: name,
            index: players.length - 1,
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
          ships: false,
        });

        const responce = {
          type: "reg",
          data: JSON.stringify({
            name: name,
            index: players.length - 1,
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

      if (indexRoom !== -1) {
        const playerIndex = waitingList.indexOf(ws);
        const roomUser: RoomUser = {
          name: playerName,
          index: playerIndex,
        };

        const isItAlreadyInRoom = () =>
          !rooms.some((room) =>
            room.roomUsers.some((user) => user.name === playerName)
          );

        if (isItAlreadyInRoom()) {
          rooms[indexRoom].roomUsers.push(roomUser);

          rooms[indexRoom].roomUsers.forEach((user, index) => {
            const userSocket = waitingList[user.index];

            if (userSocket) {
              const responseCreateGame = {
                type: "create_game",
                data: JSON.stringify({
                  idGame: indexRoom,
                  idPlayer: index === 0 ? 0 : 1,
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
    }

    if (type === "add_ships") {
      const playerId = connectionIds.get(ws);
      const { gameId, ships, indexPlayer } = JSON.parse(data);
      const playerName = players.find((player) => player.id === playerId)?.name;
      firstTurn.push(indexPlayer);

      const currentPlayer = players.find(
        (player) => player.name === playerName
      );
      if (currentPlayer) {
        currentPlayer.ships = true;
      }

      const roomIndex = rooms.findIndex((room) =>
        room.roomUsers.some((user) => user.name === playerName)
      );

      const room = rooms[roomIndex];
      const playerss = room.roomUsers;

      if (playerss.length !== 2) {
        return;
      }

      const allPlayersReady = playerss.every(
        (player) => players.find((p) => p.name === player.name)?.ships
      );

      if (allPlayersReady) {
        playerss.forEach((player) => {
          const userSocket = waitingList[player.index];
          if (userSocket) {
            const responseStartGame = {
              type: "start_game",
              data: JSON.stringify({
                ships: ships,
                currentPlayerIndex: player.index,
              }),
              id: 0,
            };
            sendMessage(userSocket, responseStartGame);
            turn(waitingList[player.index], firstTurn[0]);
          }
        });
      }

      const playerIndex = players.findIndex(
        (player) => player.name === playerName
      );
      let arrHits: СurrentShip[] = [];
      let arrPosition: Position[] = [];

      ships.forEach((ship: arrShip) => {
        if (ship.length > 0 && ship.direction === false) {
          for (let i = 0; i < ship.length; i++) {
            arrPosition.push({ x: ship.position.x + i, y: ship.position.y });
          }
        } else if (ship.length > 0 && ship.direction === true) {
          for (let i = 0; i < ship.length; i++) {
            arrPosition.push({ x: ship.position.x, y: ship.position.y + i });
          }
        }
        arrHits.push({
          type: ship.type,
          position: [...arrPosition],
        });
        arrPosition = [];
      });
      availableHits.push({
        currentPlayerIndex: playerIndex,
        currentShip: [...arrHits],
      });
      arrHits = [];
    }

    if (type === "attack") {
      const { gameId, x, y, indexPlayer } = JSON.parse(data);

      const roomIndex = Number(gameId);

      const returnStatusField = (x: number, y: number, indexPlayer: number) => {
        const nextPlayerIndex = (indexPlayer + 1) % 2;
        console.log(indexPlayer, nextPlayerIndex);

        const hit = availableHits.find(
          (hit) =>
            hit.currentPlayerIndex === nextPlayerIndex &&
            hit.currentShip?.some(
              (ship) => ship.position?.some((pos) => pos.x === x && pos.y === y)
            )
        );

        if (hit) {
          const ship = hit.currentShip?.find(
            (ship) => ship.position?.some((pos) => pos.x === x && pos.y === y)
          );

          if (ship && ship.position!.length > 1) {
            const hitIndex = availableHits.findIndex(
              (hit) =>
                hit.currentPlayerIndex === nextPlayerIndex &&
                hit.currentShip?.some(
                  (ship) =>
                    ship.position?.some((pos) => pos.x === x && pos.y === y)
                )
            );

            if (hitIndex !== -1) {
              const hit = availableHits[hitIndex];

              if (hit.currentShip !== undefined) {
                const shipIndex = hit.currentShip.findIndex(
                  (ship) =>
                    ship.position?.some((pos) => pos.x === x && pos.y === y)
                );

                if (shipIndex !== -1) {
                  const ship = hit.currentShip[shipIndex];

                  if (ship.position !== undefined) {
                    const positionIndex = ship.position.findIndex(
                      (pos) => pos.x === x && pos.y === y
                    );

                    if (positionIndex !== -1) {
                      ship.position.splice(positionIndex, 1);

                      if (ship.position.length === 0) {
                        hit.currentShip.splice(shipIndex, 1);

                        if (hit.currentShip.length === 0) {
                          availableHits.splice(hitIndex, 1);
                        }

                        return "shot";
                      }
                    }
                  }
                }
              }
            }

            return "shot";
          } else if (ship && ship.position!.length === 1) {
            return "killed";
          }
        }

        return "miss";
      };

      let stratusfield = returnStatusField(x, y, indexPlayer);

      const responseAttack = {
        type: "attack",
        data: JSON.stringify({
          position: {
            x: x,
            y: y,
          },
          currentPlayer: indexPlayer,
          status: stratusfield,
        }),
        id: 0,
      };

      if (
        roomIndex !== undefined &&
        roomIndex >= 0 &&
        roomIndex < rooms.length
      ) {
        const room = rooms[roomIndex];
        const playersInRoom = room.roomUsers;

        const currentPlayerIndex = playersInRoom.findIndex(
          (player) => player.index === indexPlayer
        );

        const nextPlayer = (currentPlayerIndex + 1) % playersInRoom.length;

        const sendAttackToPlayer = (player: RoomUser) => {
          const userSocket = waitingList[player.index];
          if (userSocket) {
            sendMessage(userSocket, responseAttack);
          }
        };

        playersInRoom.forEach((player: RoomUser) => {
          sendAttackToPlayer(player);
          const userSocket = waitingList[player.index];
          const nextPlayerIndex = playersInRoom[nextPlayer].index;
          turn(userSocket, nextPlayerIndex);
        });

        if (checkEmptyHits(availableHits, indexPlayer)) {
          finish(ws, indexPlayer);
          const currentPlayerName = playersInRoom.find(
            (p) => p.index === indexPlayer
          )?.name;
          if (currentPlayerName) {
            let currentPlayer = winners.find(
              (win) => win[0] === currentPlayerName
            );
            if (currentPlayer) {
              currentPlayer[1] = Number(currentPlayer[1]) + 1;
            } else {
              currentPlayer = [currentPlayerName, 1];
              winners.push(currentPlayer);
            }
            updateWinners(ws, currentPlayerName, currentPlayer[1]);
          }
        }

        const nextPlayerIndex = playersInRoom[nextPlayer].index;
        const userSocketNext = waitingList[nextPlayerIndex];
        turn(userSocketNext, nextPlayerIndex);
      }
    }
  });
});
