import React from "react";
import { GameStatus } from "types/adventure";
import Api from "utils/api";

type Props = {
  id: number | null;
};

type State = {
  gameStatus: GameStatus | null;
};

class Game extends React.Component<Props, State> {
  api: Api;

  constructor(props: Props) {
    super(props);
    this.api = new Api();

    this.state = {
      gameStatus: null,
    }
  }

  componentDidMount() {
    this.api.ping().then(console.log).catch(console.error);
  }

  render() {
    return <h1>hi</h1>
  }
}

export default Game;