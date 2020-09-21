import React from "react";
import 'styles/Game.css';

type Props = {
    leaderboardEntries: [[string, number]];
}

class LeaderboardTable extends React.Component<Props, any> {
    render = () => {
        const { leaderboardEntries } = this.props;

        return leaderboardEntries.length > 0 && (
            <div id="leaderboard-table">
                <table>
                <tr>
                    <th>Name</th>
                    <th>Score</th>
                </tr>
                {
                    leaderboardEntries.map(([name, score]) => {
                    return (<tr>
                        <th>{name}</th>
                        <th>{score}</th>
                    </tr>)
                    })
                }
                </table>
            </div>
        )
      };
}

export default LeaderboardTable;