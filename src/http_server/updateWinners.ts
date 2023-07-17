import { sendMessage } from "./ws";
import WebSocket from "ws";

export const updateWinners = (
  userSocket: WebSocket,
  name: string,
  wins: number
) => {
  const responseUpdateWinners = {
    type: "update_winners",
    data: JSON.stringify([
      {
        name: name,
        wins: wins,
      },
    ]),
    id: 0,
  };
  sendMessage(userSocket, responseUpdateWinners);
};
