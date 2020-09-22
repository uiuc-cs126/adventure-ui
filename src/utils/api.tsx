/* eslint-disable no-throw-literal */
import { Server, CommandResult, Error, Command } from 'types/adventure';

const isMissing = (e: any) => e === undefined || e === null;

export type ApiParams = {
  id: number | null;
  server: Server;
};

interface Leaderboard {
  [name: string]: number
}

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

  async createGame() {
    const response = await fetch(`${this.endpoint}/create`, {
      method: 'POST',
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

  async fetchLeaderboard() {
    const response = await fetch(`${this.endpoint}/leaderboard/`, {
      method: 'GET',
    });

    const leaderboard: Leaderboard = await response.json();
    return Object.entries(leaderboard);
  }
}