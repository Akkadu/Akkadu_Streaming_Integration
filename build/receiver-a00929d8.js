import './index-1a7f038e.js';
import { R as RTCConsumer } from './index-e6b8f354.js';

function validateConfig(streamConfig, receiverConfig) {
  if (streamConfig.userType !== 'audience') {
    throw new Error(`Invalid usertype ${streamConfig.userType} for audience`)
  }
  if (!receiverConfig.language) {
    throw new Error('language must be defined!')
  }
}

class AkkaduReceiver extends RTCConsumer {
  constructor({ receiver, stream }) {
    super({ stream }); 
    this.receiverConfig = receiver;
    this.receiverConfig.playing = false;
    validateConfig(stream, receiver);
  }

  /**
   * @description Toggles the stream on and off
   */
  toggle() {
    if (this.receiverConfig.playing) {
      this.unsubscribeFromLanguage(this.receiverConfig.language);
      this.receiverConfig.playing = false;
    }
    else {
      this.subscribeToLanguage({ language:this.receiverConfig.language, autoPlay:true });
      this.receiverConfig.playing = true;
    }
  }
}

export default AkkaduReceiver;
