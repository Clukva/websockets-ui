import { sendMessage } from "./ws";
import WebSocket from "ws";
import { Hits } from "./interfaces";

export function checkEmptyHits(
  hits: Hits[],
  currentPlayerIndex: number
): boolean {
  const hitsForPlayer = hits.filter(
    (hit) => hit.currentPlayerIndex === currentPlayerIndex
  );
  return hitsForPlayer.every(
    (hit) => hit.currentShip?.every((ship) => ship.position?.length === 0)
  );
}

export const finish = (userSocket: WebSocket, index: number) => {
  const responseFinish = {
    type: "finish",
    data: JSON.stringify({
      winPlayer: index,
    }),
    id: 0,
  };
  sendMessage(userSocket, responseFinish);
};
