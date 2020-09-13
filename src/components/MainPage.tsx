import React from 'react';
import { HashRouter as Router, Route, RouteComponentProps } from 'react-router-dom';
import dotenv from 'dotenv';
import queryString from 'query-string';

import Game from 'components/Game';
import { Server } from 'types/adventure';


dotenv.config();

const { REACT_APP_HOST = 'localhost', REACT_APP_PORT = 8080 } = process.env;
const SIEBEL_JSON = 'https://courses.grainger.illinois.edu/cs126/sp2020/resources/siebel.json';

interface MatchParams {
  id: string;
};

interface Props extends RouteComponentProps<MatchParams> { };

const parseQueryParams = (params: string) => {
  const {
    host = REACT_APP_HOST,
    port = REACT_APP_PORT,
    url = SIEBEL_JSON,
  } = queryString.parse(params);

  return { host, port, url } as Server;
};

const MainPage = () => (
  <Router>
    <Route exact path='/instance/:id' render={(props: Props) => {
      const id = Number.parseInt(props.match.params.id, 10);
      const server = parseQueryParams(props.location.search);
      const { commandResult = null } = props.location.state || { };
      return <Game {...props} id={id} server={server} commandResult={commandResult} />;
    }} />
    <Route exact path={['/', '/#', '', '/#/']} render={props => {
      const server = parseQueryParams(props.location.search);
      return <Game {...props} id={null} server={server} commandResult={null} />;
    }} />
  </Router>
);

export default MainPage;