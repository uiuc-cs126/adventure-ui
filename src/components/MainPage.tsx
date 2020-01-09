import React from 'react';
import { BrowserRouter as Router, Route, RouteComponentProps } from 'react-router-dom';
import dotenv from 'dotenv';

import Game from 'components/Game';


dotenv.config();

interface MatchParams {
  id: string;
};

interface Props extends RouteComponentProps<MatchParams> { };

const MainPage = () => (
  <Router>
    <Route exact path='/instance/:id' render={(props: Props) => {
      const id = Number.parseInt(props.match.params.id, 10);
      return <Game {...props} id={id} />
    }} />
    <Route path='/' render={props => <Game {...props} id={null} />} />
  </Router>
);

export default MainPage;