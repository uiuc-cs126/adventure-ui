import React from "react";
import { CommandResult, Error, Server } from "types/adventure";
import Api from "utils/api";
import { ProgressBar, Overlay, Intent, Classes, Text, H1, ButtonGroup, Button, FormGroup, InputGroup } from "@blueprintjs/core";
import classNames from "classnames";
import Message, { TIMEOUT_ERROR, TIMEOUT_SUCCESS } from 'utils/Message';

import 'styles/Game.css';
import { RouteComponentProps, Redirect } from "react-router";
import StateTable from 'components/StateTable';
import VideoPlayer from 'components/VideoPlayer';
import LeaderboardTable from "./LeaderboardTable";

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
  commandResult: CommandResult | null;
}

type State = {
  commandResult: CommandResult | null;
  pingStatus: PingStatus;
  gameState: GameState;
  errorMessage: string | null;
  commandName: string | null;
  commandValue: string | null;
  redirectId: number | null;
  playerName: string;
  leaderboardVisible: boolean;
  leaderboardEntries: [string, number][];
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

    const { commandResult } = props;
    this.state = {
      commandResult,
      gameState: id !== null ? GameState.LOADING_INSTANCE : GameState.PING,
      pingStatus: PingStatus.SENDING,
      errorMessage: null,
      commandName: null,
      commandValue: null,
      redirectId: null,
      playerName: "Anonymous",
      leaderboardVisible: false,
      leaderboardEntries: [],
    };
  }

  /**
   * Attempts to create a new game.
   */
  tryCreateGame = async () => {
    let commandResult = null;
    try {
      commandResult = await this.api.createGame();
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

    const { id } = commandResult;
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
    let { commandResult } = this.state;
    if (commandResult !== null) return this.setState({
      commandResult,
      gameState: GameState.IN_PROGRESS,
      commandName: null,
      commandValue: null,
    });

    try {
      commandResult = await this.api.getGame();
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
      commandResult,
      commandName: null,
      commandValue: null,
    });
  };

  tryPerformCommand = async () => {
    const { commandName, commandValue, playerName } = this.state;

    if (commandName === null || commandValue === null) {
      return this.setState({
        gameState: GameState.REQUEST_FAILED,
        errorMessage: 'Could not complete command',
      });
    }

    let newCommandResult = null;
    try {
      newCommandResult = await this.api.performCommand({ commandName, commandValue, playerName });
    } catch (error) {
      const { message } = error as Error;
      Message.show({
        timeout: TIMEOUT_ERROR,
        message: `POST /command failed: ${message}`,
        icon: 'error',
        intent: Intent.DANGER,
      });
      return this.setState({
        gameState: GameState.REQUEST_FAILED,
        errorMessage: `Could not ${commandName}`,
      });
    }

    Message.show({
      timeout: TIMEOUT_SUCCESS,
      message: `POST /command succeeded!`,
      icon: 'tick',
      intent: Intent.SUCCESS,
    });
    return this.setState({
      gameState: GameState.IN_PROGRESS,
      commandResult: newCommandResult,
      commandName: null,
      commandValue: null,
    });
  }

  componentDidMount = () => {
    const { gameState } = this.state;

    switch (gameState) {
      case GameState.PING: return this.tryPing();
      case GameState.LOADING_INSTANCE: return this.tryLoadInstance();
    }
  };

  setPlayerName = (e: any) => {
    this.setState({
      playerName: e.target.value || "Anonymous"
    })
  }

  commandClicked = (command: string, commandVal: string) => {
    const { commandName } = this.state;

    // The user already clicked a button.
    if (commandName !== null) return;

    return this.setState(
      {
        commandName: command,
        commandValue: commandVal,
      },
      () => this.tryPerformCommand(),
    );
  };

  toggleLeaderboard = async () => {
    let leaderboardEntries: [string, number][] = [];
    if (!this.state.leaderboardVisible) {
      try {
        leaderboardEntries = await this.api.fetchLeaderboard();
      } catch (error) {
        Message.show({
          timeout: TIMEOUT_ERROR,
          message: `POST /leaderboard failed: ${error.message}`,
          icon: 'error',
          intent: Intent.DANGER,
        });
      }

    }
    this.setState({
      leaderboardVisible: !this.state.leaderboardVisible,
      leaderboardEntries
    })
  }

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
    const { redirectId, commandResult } = this.state;
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
        state: { commandResult },
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
    const { commandResult, commandName, commandValue, leaderboardEntries } = this.state;
    const { imageUrl, videoUrl, message, commandOptions, state } = commandResult!;
    const commandKeys = Array.from(Object.keys(commandOptions));

    const leaderboardCardClasses = classNames(
      Classes.CARD,
      Classes.ELEVATION_4,
      "leaderboard-overlay"
    );

    return (
      <div className='in-progress'>
        <div id='title'>
          <H1>Adventure v2.0</H1>
        </div>
        <div id='media-container'>
          {imageUrl && <img id='room-image' src={imageUrl} alt="new" />}
        </div>
        <div id='description' className="message">
          <Text>
            <b>Message</b>:&nbsp;
            <span style={{whiteSpace: "pre"}}>{message}</span>
          </Text>
        </div>
        {/* <FormGroup
          className="player-name"
          label="Player Name"
          labelFor="player-name-input"
        >
          <InputGroup id="player-name-input" placeholder="Anonymous" onChange={this.setPlayerName} />
          <Button onClick={this.toggleLeaderboard} className="direction-button" intent={Intent.NONE} id="leaderboard-button">
            Show Leaderboard
          </Button>
        </FormGroup> */}

        {/* <Overlay isOpen={this.state.leaderboardVisible} onClose={this.toggleLeaderboard} >
          <div className={leaderboardCardClasses}>
            <h1>Leaderboard</h1>
            <LeaderboardTable leaderboardEntries={leaderboardEntries} />
            <Button id="leaderboard-close-button"
              onClick={this.toggleLeaderboard} intent={Intent.DANGER} className="direction-button">Close</Button>
          </div>
        </Overlay> */}
        <div id='commands'>
          {
            commandKeys.map(command => {
              // @ts-ignore
              const commandValues = commandOptions[command];

              return (commandValues && <ButtonGroup minimal vertical>{
                // @ts-ignore
                commandValues.map((value, i) => (
                  <Button
                    className='direction-button'
                    key={`${command} ${value} ${i}`}
                    disabled={commandName !== null}
                    active={command === commandName && value === commandValue}
                    intent={(command === commandName && value === commandValue) ? Intent.SUCCESS : Intent.NONE}
                    onClick={() => this.commandClicked(command, value)}
                  >
                    {`${command} ${value}`}
                  </Button>
                ))
              }
              </ButtonGroup>)
            })
          }
        </div>
        {state && <StateTable stateMap={state} />}
        {videoUrl && <VideoPlayer videoUrl={videoUrl} />}
      </div>
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
  };
}

export default Game;