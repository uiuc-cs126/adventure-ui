/* Responses. */
export type Error = {
  message: string;
};

export type CommandResult = {
  id: number;
  imageUrl: string;
  videoUrl: string;
  message: string;
  state: object;
  commandOptions: object;
}

/* Requests. */
export type NewGame = {
  url: string;
};

export type Command = {
  commandName: string;
  commandValue: string;
}

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