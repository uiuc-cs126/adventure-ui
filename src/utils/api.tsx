import { Server, NewGame, GameStatus, Error, AddMarkers, Go } from 'types/adventure';


export type ApiParams = {
  id: number | null;
  server: Server;
};

export default class Api {
  id: number | null;
  server: Server;
  endpoint: string;

  constructor(params: ApiParams) {
    const { id, server } = params;
    this.id = id !== undefined ? id : null;
    this.server = server;

    const { host, port } = server;
    this.endpoint = `http://${host}:${port}/adventure/v1`;
  }

  async ping() {
    const response = await fetch(`${this.endpoint}/ping`, {
      method: 'GET',
    });

    return response.text();
  }

  async handleGameStatusResponse(response: Response) {
    if (response.status === 400) {
      const error: Error = await response.json();
      throw error;
    }

    if (response.status !== 200) {
      const error: Error = { message: `${response.status}-${response.statusText}` };
      throw error;
    }
    const gameStatus: GameStatus = await response.json();

    // Validation.
    if (gameStatus.id === undefined) throw { message: `'id' field is not in response` } as Error;
    if (gameStatus.isOver === undefined) throw { message: `'isOver' field is not in response` } as Error;
    if (gameStatus.currentRoom === undefined) throw { message: `'currentRoom' field is not in response` } as Error;
    if (gameStatus.currentRoom.description === undefined) throw { message: `'currentRoom.description' field is not in response` } as Error;
    if (gameStatus.currentRoom.name === undefined) throw { message: `'currentRoom.name' field is not in response` } as Error;
    if (gameStatus.currentRoom.directions === undefined) throw { message: `'currentRoom.directions' field is not in response` } as Error;
    if (!Array.isArray(gameStatus.currentRoom.directions)) throw { message: `'currentRoom.directions' field is not an array` } as Error;

    gameStatus.currentRoom.directions.forEach((direction, idx) => {
      if (direction === undefined) throw { message: `'currentRoom.directions[${idx}]' field is undefined` } as Error;
      if (direction.directionName === undefined) throw { message: `'currentRoom.directions[${idx}].directionName' field is undefined` } as Error;
      if (direction.room === undefined) throw { message: `'currentRoom.directions[${idx}].room' field is undefined` } as Error;
    });

    this.id = gameStatus.id;
    return gameStatus;
  }

  async createGame(request: NewGame) {
    const response = await fetch(`${this.endpoint}/create`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return this.handleGameStatusResponse(response);
  }

  async getGame() {
    if (this.id === null) throw { message: 'no id set' } as Error;

    const response = await fetch(`${this.endpoint}/instance/${this.id}`, {
      method: 'GET',
    });

    return this.handleGameStatusResponse(response);
  }

  async deleteGame() {
    if (this.id === null) throw { message: 'no id set' } as Error;

    const response = await fetch(`${this.endpoint}/instance/${this.id}`, {
      method: 'DELETE',
    });

    if (response.status === 400) {
      const error: Error = await response.json();
      throw error;
    }

    if (response.status !== 200) {
      const error: Error = { message: `${response.status}-${response.statusText}` };
      throw error;
    }
  }

  async addMarkers(request: AddMarkers) {
    if (this.id === null) throw { message: 'no id set' } as Error;

    const response = await fetch(`${this.endpoint}/instance/${this.id}/markers`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return this.handleGameStatusResponse(response);
  }

  async deleteMarker({ marker }: { marker: string }) {
    if (this.id === null) throw { message: 'no id set' } as Error;

    const response = await fetch(`${this.endpoint}/instance/${this.id}/marker/${marker}`, {
      method: 'DELETE',
    });

    return this.handleGameStatusResponse(response);
  }

  async goInDirection(request: Go) {
    if (this.id === null) throw { message: 'no id set' } as Error;

    const response = await fetch(`${this.endpoint}/instance/${this.id}/go`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return this.handleGameStatusResponse(response);
  }
}