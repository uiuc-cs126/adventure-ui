import React from "react";
import { GameStatus, Error, Server } from "types/adventure";
import Api from "utils/api";
import { ProgressBar, Overlay, Intent, Classes, Text, H1, ButtonGroup, Button, H3 } from "@blueprintjs/core";
import classNames from "classnames";
import Message, { TIMEOUT_ERROR, TIMEOUT_SUCCESS } from 'utils/Message';

import 'styles/Game.css';
import { RouteComponentProps, Redirect } from "react-router";

enum GameState {
  PING,
  IN_PROGRESS,
  REQUEST_FAILED,
  REDIRECTING,
  LOADING_INSTANCE,
};

enum PingStatus {
  SENDING,
  FAILED,
  SUCCEEDED,
  WARNING,
};

interface Props extends RouteComponentProps<any> {
  id: number | null;
  server: Server;
  gameStatus: GameStatus | null;
}

type State = {
  gameStatus: GameStatus | null;
  pingStatus: PingStatus;
  gameState: GameState;
  errorMessage: string | null;
  directionIdx: number | null;
  redirectId: number | null;
};

const CLASSES = classNames(
  Classes.CARD,
  Classes.ELEVATION_4,
  'ping-overlay',
);



class Game extends React.Component<Props, State> {
  api: Api;

  constructor(props: Props) {
    super(props);

    const { id, server } = props;
    this.api = new Api({
      id,
      server,
    });

    const { gameStatus } = props;
    this.state = {
      gameStatus,
      gameState: id !== null ? GameState.LOADING_INSTANCE : GameState.PING,
      pingStatus: PingStatus.SENDING,
      errorMessage: null,
      directionIdx: null,
      redirectId: null,
    };
  }

  /**
   * Attempts to create a new game.
   */
  tryCreateGame = async () => {
    const { url } = this.props.server;

    let gameStatus = null;
    try {
      gameStatus = await this.api.createGame({ url });
    } catch (error) {
      const { message } = error as Error;
      Message.show({
        timeout: TIMEOUT_ERROR,
        message: `POST /create failed: ${message}`,
        icon: 'error',
        intent: Intent.DANGER,
      });
      return this.setState({
        gameState: GameState.REQUEST_FAILED,
        errorMessage: 'Failed to create game',
      });
    }

    const { id } = gameStatus;
    Message.show({
      timeout: TIMEOUT_SUCCESS,
      message: 'POST /create succeeded!',
      icon: 'tick',
      intent: Intent.SUCCESS,
    });
    return this.setState({
      gameState: GameState.REDIRECTING,
      redirectId: id,
    });
  };

  /**
   * Attempts to delete the current game.
   */
  tryDeleteGame = async () => {
    try {
      await this.api.deleteGame();
    } catch (error) {
      const { message } = error as Error;
      Message.show({
        timeout: TIMEOUT_ERROR,
        message: `DELETE /instance/:id failed: ${message}`,
        icon: 'error',
        intent: Intent.DANGER,
      });
      return this.setState({
        gameState: GameState.REQUEST_FAILED,
        errorMessage: 'Failed to delete game',
      });
    }

    Message.show({
      timeout: TIMEOUT_SUCCESS,
      message: 'DELETE /create succeeded!',
      icon: 'tick',
      intent: Intent.SUCCESS,
    });
  };

  /**
   * Attempts to ping the server.
   */
  tryPing = async () => {
    let text = null;
    try {
      text = await this.api.ping();
    } catch (error) {
      const { message } = error as Error;
      Message.show({
        timeout: TIMEOUT_ERROR,
        message: `GET /ping failed: ${message}`,
        icon: 'error',
        intent: Intent.DANGER,
      });
      return this.setState({
        pingStatus: PingStatus.FAILED,
        errorMessage: 'Could not ping the server',
      });
    }

    if (text !== 'pong') {
      Message.show({
        timeout: TIMEOUT_ERROR,
        message: `GET /ping returned '${text}' instead of 'pong'`,
        icon: 'warning-sign',
        intent: Intent.WARNING,
      });
      return this.setState({
        pingStatus: PingStatus.WARNING,
        errorMessage: 'Server ping not set up correctly',
      });
    }

    Message.show({
      timeout: TIMEOUT_SUCCESS,
      message: 'GET /ping succeeded!',
      icon: 'tick',
      intent: Intent.SUCCESS,
    });
    return this.setState(
      { pingStatus: PingStatus.SUCCEEDED },
      () => this.tryCreateGame(),
    );
  };

  tryLoadInstance = async () => {
    let { gameStatus } = this.state;
    if (gameStatus !== null) return this.setState({
      gameStatus,
      gameState: GameState.IN_PROGRESS,
      directionIdx: null,
    });

    try {
      gameStatus = await this.api.getGame();
    } catch (error) {
      const { message } = error as Error;
      Message.show({
        timeout: TIMEOUT_ERROR,
        message: `GET /instance/:id failed: ${message}`,
        icon: 'error',
        intent: Intent.DANGER,
      });
      return this.setState({
        gameState: GameState.REQUEST_FAILED,
        errorMessage: 'Could not load game',
      });
    }

    Message.show({
      timeout: TIMEOUT_SUCCESS,
      message: 'GET /instance/:id succeeded!',
      icon: 'tick',
      intent: Intent.SUCCESS,
    });
    return this.setState({
      gameState: GameState.IN_PROGRESS,
      gameStatus,
      directionIdx: null,
    });
  };

  tryGoInDirection = async () => {
    const { directionIdx, gameStatus } = this.state;
    const direction = gameStatus!.currentRoom.directions[directionIdx!].directionName;

    let newGameStatus = null;
    try {
      newGameStatus = await this.api.goInDirection({ direction });
    } catch (error) {
      const { message } = error as Error;
      Message.show({
        timeout: TIMEOUT_ERROR,
        message: `POST /go failed: ${message}`,
        icon: 'error',
        intent: Intent.DANGER,
      });
      return this.setState({
        gameState: GameState.REQUEST_FAILED,
        errorMessage: 'Could not change rooms',
      });
    }

    Message.show({
      timeout: TIMEOUT_SUCCESS,
      message: 'POST /go succeeded!',
      icon: 'tick',
      intent: Intent.SUCCESS,
    });
    return this.setState({
      gameState: GameState.IN_PROGRESS,
      gameStatus: newGameStatus,
      directionIdx: null,
    });
  };

  componentDidMount = () => {
    const { gameState } = this.state;

    switch (gameState) {
      case GameState.PING: return this.tryPing();
      case GameState.LOADING_INSTANCE: return this.tryLoadInstance();
    }
  };

  directionClicked = (idx: number) => {
    const { directionIdx } = this.state;

    // The user already clicked a button.
    if (directionIdx !== null) return;

    return this.setState(
      { directionIdx: idx },
      () => this.tryGoInDirection(),
    );
  };

  newGameClicked = () => {
    const { gameState } = this.state;
    // The user already clicked this button.
    if (gameState === GameState.REDIRECTING) return;

    return this.setState(
      { gameState: GameState.REDIRECTING, redirectId: null },
      () => this.tryDeleteGame(),
    );
  };

  renderRedirecting = () => {
    const { redirectId, gameStatus } = this.state;
    const { location } = this.props;
    if (redirectId === null) {
      return (
        <Redirect to={{
          pathname: '/',
          search: location.search,
        }} />
      );
    }
    return (
      <Redirect to={{
        pathname: `/instance/${redirectId}`,
        search: location.search,
        state: { gameStatus },
      }} />
    );
  };

  renderLoadingInstance = () => (
    <Overlay className={Classes.OVERLAY_CONTAINER} isOpen>
      <div className={CLASSES}>
        <p>Loading game ...</p>
        <ProgressBar intent={Intent.NONE} />
      </div>
    </Overlay>
  );

  renderRequestFailed = () => {
    const { errorMessage } = this.state;
    return (
      <Overlay className={Classes.OVERLAY_CONTAINER} isOpen>
        <div className={CLASSES}>
          <p>{errorMessage}</p>
          <ProgressBar intent={Intent.DANGER} />
        </div>
      </Overlay>
    );
  };

  renderPing = () => {
    const { pingStatus, errorMessage } = this.state;
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
  };

  renderInProgress = () => {
    const { gameStatus, directionIdx } = this.state;
    const { currentRoom, isOver } = gameStatus!;
    return (
      <div>
        <H1>Adventure v1</H1>
        <Text>
          <b>Location</b>:&nbsp;
          {currentRoom.name}
        </Text>
        <Text>
          <b>Description</b>:&nbsp;
          {currentRoom.description}
        </Text>
        <ButtonGroup minimal vertical>{
          currentRoom.directions.map(({ directionName }, idx) => (
            <Button
              className='direction-button'
              key={idx}
              disabled={directionIdx !== null}
              active={directionIdx === idx}
              intent={directionIdx === idx ? Intent.SUCCESS : Intent.NONE}
              onClick={() => this.directionClicked(idx)}
            >
              {`go ${directionName}`}
            </Button>
        ))
        }
        </ButtonGroup>
        {isOver &&
          <div>
            <H3>You won!</H3>
            <Button
              className='direction-button'
              onClick={() => this.newGameClicked()}
            >
              New Game
            </Button>
          </div>
        }</div>
    );
  };

  render = () => {
    const { gameState } = this.state;

    switch (gameState) {
      case GameState.REDIRECTING: return this.renderRedirecting();
      case GameState.LOADING_INSTANCE: return this.renderLoadingInstance();
      case GameState.REQUEST_FAILED: return this.renderRequestFailed();
      case GameState.PING: return this.renderPing();
      case GameState.IN_PROGRESS: return this.renderInProgress();
    }

    return null;
  };
}

export default Game;