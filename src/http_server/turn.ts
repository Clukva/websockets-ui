import { sendMessage } from "./ws";
import WebSocket from "ws";

export const turn = (userSocket: WebSocket, index: number) => {
  const responseTurn = {
    type: "turn",
    data: {
      currentPlayer: index,
    },
    id: 0,
  };
  sendMessage(userSocket, responseTurn);
};
