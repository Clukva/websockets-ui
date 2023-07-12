export interface Player {
  name: string;
  password: string;
  id: string;
  wins: number;
}
export interface RoomUser {
  name?: string;
  index: number;
}

export interface RoomData {
  roomId: number;
  roomUsers: RoomUser[];
}
