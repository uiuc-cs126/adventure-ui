import React from 'react';
import { BrowserRouter as Router, Route, RouteComponentProps } from 'react-router-dom';
import dotenv from 'dotenv';
import queryString from 'query-string';

import Game from 'components/Game';
import { Server, GameStatus } from 'types/adventure';


dotenv.config();

const { REACT_APP_HOST = '0.0.0.0', REACT_APP_PORT = 8080 } = process.env;

interface MatchParams {
  id: string;
};

interface Props extends RouteComponentProps<MatchParams> { };

const parseQueryParams = (params: string) => {
  const {
    host = REACT_APP_HOST,
    port = REACT_APP_PORT,
  } = queryString.parse(params);

  return { host, port } as Server;
};

const MainPage = () => (
  <Router basename='/adventure'>
    <Route exact path='/instance/:id' render={(props: Props) => {
      const id = Number.parseInt(props.match.params.id, 10);
      const server = parseQueryParams(props.location.search);
      const { gameStatus = null } = props.location.state || { };
      return <Game {...props} id={id} server={server} gameStatus={gameStatus} />;
    }} />
    <Route exact path='/' render={props => {
      const server = parseQueryParams(props.location.search);
      return <Game {...props} id={null} server={server} gameStatus={null} />;
    }} />
  </Router>
);

export default MainPage;