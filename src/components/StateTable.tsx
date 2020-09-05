import React from "react";
import 'styles/Game.css';

type Props = {
    stateMap: object;
}

class StateTable extends React.Component<Props, any> {
    render = () => {
        const { stateMap } = this.props;
        const stateKeys = Object.keys(stateMap); 

        return (
            <div id="state-table">
                <table>
                {
                    stateKeys.map((stateKey) => {
                    return (<tr>
                        <th>{stateKey}</th>
                        <th>{
                        // @ts-ignore
                        state[stateKey]
                        }</th>
                    </tr>)
                    })
                }
                </table>
            </div>
        )
      };
}

export default StateTable;