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
  position?: Position[];
}
interface Position {
  x: number;
  y: number;
}
