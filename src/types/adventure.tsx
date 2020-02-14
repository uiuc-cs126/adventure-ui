/* Responses. */
export type Error = {
  message: string;
};

export type GameStatus = {
  id: number;
  currentRoom: Room;
  isOver: boolean;
};

/* Requests. */
export type Go = {
  direction: string;
};

export type AddMarkers = {
  markers: string[];
};

export type NewGame = {
  url: string;
};

/* Miscellaneous. */
export type Room = {
  name: string;
  description: string;
  directions: Direction[];
  markers: string[];
};

export type Direction = {
  directionName: string;
  room: string;
};

export type Server = {
  host: string;
  port: string;
  url: string;
};