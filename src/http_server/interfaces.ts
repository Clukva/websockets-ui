export interface Player {
  name: string;
  password: string;
  id: string;
  wins: number;
  ships: boolean;
}
export interface RoomUser {
  name?: string;
  index: number;
}

export interface RoomData {
  roomId: number;
  roomUsers: RoomUser[];
}

export interface Hits {
  currentPlayerIndex: number;
  currentShip?: currentShip[];
}

interface currentShip {
  type?: string;
  position?: Position[];
}

export interface Position {
  x: number;
  y: number;
}

export interface arrShip {
  position: { x: number; y: number };
  direction: boolean;
  type: "string";
  length: number;
}
