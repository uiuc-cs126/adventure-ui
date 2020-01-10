import React from "react";
import { GameStatus, Error, Server } from "types/adventure";
import Api from "utils/api";
import { ProgressBar, Overlay, Intent, Classes } from "@blueprintjs/core";
import classNames from "classnames";
import Message, { TIMEOUT } from 'utils/Message';

import 'styles/Game.css';

enum GameState {
  PING,
  IN_PROGRESS,
  GAME_OVER,
};

enum PingStatus {
  SENDING,
  FAILED,
  SUCCEEDED,
  WARNING,
};

type Props = {
  id: number | null;
  server: Server;
};

type State = {
  gameStatus: GameStatus | null;
  pingStatus: PingStatus;
  gameState: GameState;
  errorMessage: string | null;
};

const CLASSES = classNames(
  Classes.CARD,
  Classes.ELEVATION_4,
  'ping-overlay',
);

const SIEBEL_JSON = 'https://courses.engr.illinois.edu/cs126/sp2019/adventure/siebel.json';

/**
 * There are 3 states:
 *   1. `/ping` doesn't return `pong`
 *   2. Game hasn't started
 *   3. Game in progress
 *   4. Game over
 */
class Game extends React.Component<Props, State> {
  api: Api;

  constructor(props: Props) {
    super(props);

    const { id, server } = props;
    this.api = new Api({
      id,
      server,
    });

    this.state = {
      gameStatus: null,
      gameState: GameState.PING,
      pingStatus: PingStatus.SENDING,
      errorMessage: null,
    };
  }

  pingSucceeded() {
    this.setState({
      pingStatus: PingStatus.SUCCEEDED,
    }, () => {
      const { id } = this.props;

      if (id === null) {
        return this.api.createGame({ url: SIEBEL_JSON })
          .then(gameStatus => {
            Message.show({
              timeout: TIMEOUT,
              message: '/create succeeded!',
              icon: 'tick',
              intent: Intent.SUCCESS,
            });
            this.setState({
              gameState: GameState.IN_PROGRESS,
              gameStatus,
            });
          })
          .catch((error: Error) => Message.show({
            timeout: TIMEOUT,
            message: `/create failed: ${error.message}`,
            icon: 'error',
            intent: Intent.DANGER,
          }));
      }
    });
  }

  componentDidMount() {
    this.api.ping()
      .then(text => {
        if (text === 'pong') {
          this.pingSucceeded();
          return;
        }

        Message.show({
          timeout: TIMEOUT,
          message: `/ping returned '${text}' instead of 'pong'`,
          icon: 'warning-sign',
          intent: Intent.WARNING,
        });
        this.setState({
          pingStatus: PingStatus.WARNING,
          errorMessage: 'Server ping not set up correctly',
        });
      })
      .catch(error => {
        Message.show({
          timeout: TIMEOUT,
          message: '/ping failed',
          icon: 'error',
          intent: Intent.DANGER,
        });
        this.setState({
          pingStatus: PingStatus.FAILED,
          errorMessage: 'Could not ping the server',
        });
      });
  }

  render() {
    const { gameState, errorMessage, pingStatus } = this.state;

    if (gameState === GameState.PING) {
      const message = {
        [PingStatus.SENDING]: 'Sending ping ...',
        [PingStatus.FAILED]: errorMessage,
        [PingStatus.WARNING]: errorMessage,
        [PingStatus.SUCCEEDED]: 'Pong received!',
      }[pingStatus];
      const intent = {
        [PingStatus.SENDING]: Intent.NONE,
        [PingStatus.FAILED]: Intent.DANGER,
        [PingStatus.WARNING]: Intent.WARNING,
        [PingStatus.SUCCEEDED]: Intent.SUCCESS,
      }[pingStatus];
      return (
        <Overlay className={Classes.OVERLAY_CONTAINER} isOpen>
          <div className={CLASSES}>
            <p>{message}</p>
            <ProgressBar intent={intent} />
          </div>
        </Overlay>
      );
    }

    return <p>hi</p>;
  }
}

export default Game;