/* eslint-disable no-throw-literal */
import { Server, NewGame, CommandResult, Error, AddItems, Go, Command } from 'types/adventure';


const isMissing = (e: any) => e === undefined || e === null;

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
    this.endpoint = `https://${host}:${port}/adventure/v1`;
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
    const commandResult: CommandResult = await response.json();

    // Validation.
    if (isMissing(commandResult.id)) throw { message: `'id' field is not in response` } as Error;
    if (isMissing(commandResult.message)) throw { message: `'message' field is not in response` } as Error;
    if (isMissing(commandResult.state)) throw { message: `'state' field is not in response` } as Error;
    if (isMissing(commandResult.commandOptions)) throw { message: `'commandOptions' field is not in response` } as Error;

    this.id = commandResult.id;
    return commandResult;
  }

  async createGame(request: NewGame) {
    const requestBody = JSON.stringify(request)
    const contentLength = requestBody.length
    const response = await fetch(`${this.endpoint}/create`, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json',
        'Content-Length': contentLength.toString(),
      },
      body: requestBody,
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

  async performCommand(request: Command) {
    if (this.id === null) throw { message: 'no id set' } as Error;

    const response = await fetch(`${this.endpoint}/instance/${this.id}/command/`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return this.handleGameStatusResponse(response);
  }

  async addItems(request: AddItems) {
    if (this.id === null) throw { message: 'no id set' } as Error;

    const response = await fetch(`${this.endpoint}/instance/${this.id}/items`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return this.handleGameStatusResponse(response);
  }

  async deleteItem({ item }: { item: string }) {
    if (this.id === null) throw { message: 'no id set' } as Error;

    const response = await fetch(`${this.endpoint}/instance/${this.id}/item/${item}`, {
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