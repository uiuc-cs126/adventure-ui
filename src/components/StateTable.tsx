import React from "react";
import 'styles/Game.css';

type Props = {
    stateMap: object;
}

class StateTable extends React.Component<Props, any> {
    render = () => {
        const { stateMap } = this.props;
        const stateKeys = Object.keys(stateMap); 

        return stateKeys.length > 0 && (
            <div id="state-table">
                <table>
                <tr>
                    <th>Key</th>
                    <th>Value</th>
                </tr>
                {
                    stateKeys.map((stateKey) => {
                    return (<tr>
                        <th>{stateKey}</th>
                        <th>{
                        // @ts-ignore
                        stateMap[stateKey]
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