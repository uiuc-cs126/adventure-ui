/* Responses. */
export type Error = {
  message: string;
};

export type CommandResult = {
  id: number;
  message: string;
  state: object;
  commandOptions: object;
}

/* Requests. */
export type Go = {
  direction: string;
};

export type AddItems = {
  items: string[];
};

export type NewGame = {
  url: string;
};

/* Miscellaneous. */
export type Room = {
  name: string;
  description: string;
  directions: Direction[];
  items: string[];
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