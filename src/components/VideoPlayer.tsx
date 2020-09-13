import React from "react";
import ReactPlayer from "react-player";
import {Button} from "@blueprintjs/core";
import 'styles/Game.css';

type Props = {
    videoUrl: string;
}

type State = {
    videoPlaying: boolean;
}

class VideoPlayer extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            videoPlaying: false,
        }
    }

    playAudio = () => {
        const { videoPlaying } = this.state;

        this.setState({
            videoPlaying: !videoPlaying,
        })
    };

    render = () => {
        const { videoPlaying } = this.state;
        const { videoUrl } = this.props;

        return (
            <div id="video-player">
                <Button className='direction-button' onClick={this.playAudio} id='video-play'>
                   {videoPlaying && 'Pause sound'}
                   {!videoPlaying && 'Play sound'} 
                </Button>
                <ReactPlayer id='room-video' url={videoUrl} playing={videoPlaying}/>
            </div>
        )
      };
}

export default VideoPlayer;