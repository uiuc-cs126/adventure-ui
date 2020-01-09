import { NewGame, GameStatus, Error, AddMarkers, Go } from 'types/adventure';

const { REACT_APP_HOST = 'localhost', REACT_APP_PORT = 9000 } = process.env;
const ENDPOINT = `http://${REACT_APP_HOST}:${REACT_APP_PORT}/adventure/v1`;


export default class Api {
  id: number | null;

  constructor(obj?: { id: number }) {
    this.id = obj !== undefined ? obj.id : null;
  }

  async ping() {
    const response = await fetch(`${ENDPOINT}/ping`, {
      method: 'GET',
    });

    return response.text();
  }

  async handleGameStatusResponse(response: Response) {
    const gameStatus: GameStatus = await response.json();

    this.id = gameStatus.id;
    return gameStatus;
  }

  async createGame(request: NewGame) {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return this.handleGameStatusResponse(response);
  }

  async getGame() {
    if (this.id === null) throw Error('no id set');

    const response = await fetch(`${ENDPOINT}/instance/${this.id}`, {
      method: 'GET',
    });

    return this.handleGameStatusResponse(response);
  }

  async deleteGame() {
    if (this.id === null) throw Error('no id set');

    const response = await fetch(`${ENDPOINT}/instance/${this.id}`, {
      method: 'DELETE',
    });
  }

  async addMarkers(request: AddMarkers) {
    if (this.id === null) throw Error('no id set');

    const response = await fetch(`${ENDPOINT}/instance/${this.id}/markers`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });

    return this.handleGameStatusResponse(response);
  }

  async deleteMarker({ marker }: { marker: string }) {
    if (this.id === null) throw Error('no id set');

    const response = await fetch(`${ENDPOINT}/instance/${this.id}/marker/${marker}`, {
      method: 'DELETE',
    });

    return this.handleGameStatusResponse(response);
  }

  async goInDirection(request: Go) {
    if (this.id === null) throw Error('no id set');

    const response = await fetch(`${ENDPOINT}/instance/${this.id}/go`, {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return this.handleGameStatusResponse(response);
  }
}