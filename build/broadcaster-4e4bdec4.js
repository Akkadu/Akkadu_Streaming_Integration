import { v as validate } from './index-1a7f038e.js';
import { D as DetectRTC, R as RTCConsumer, r as rtcError } from './index-e6b8f354.js';

function validateConfig(params) {
  const constraints = {
    produceVideo:{
      presence:false,
      type:'boolean'
    },
    produceAudio:{
      presence:false,
      type:'boolean'
    },
    produceScreen:{
      presence:false,
      type:'boolean'
    }
  };
  const notValid = validate(params, constraints);
  if (notValid) {
    throw new Error(JSON.stringify(notValid))
  }
}

// mock detectRTC because it is not supported in JSDOM
DetectRTC.hasWebcam = true;
DetectRTC.hasMicrophone = true;
DetectRTC.isWebRTCSupported = true;
DetectRTC.load = callback => callback();

// allow localstorage to overwrite config vars
const { AEC,AGC,ANS } = localStorage;

/**
 * @see https://docs.agora.io/en/Video/API%20Reference/web/interfaces/agorartc.streamspec.html#audioprocessing
 */
const defaultProducerConfig = {
  produceVideo:false,
  produceScreen: false,
  produceAudio:true,
  AEC:false, // Acoustic Echo Cancellation, see #252 issue on webapp for the reasoning of disabling this
  AGC:true, // Audio Gain Control
  ANS:true, // Automatic Noise Supression
  micListenTimeout: 5000,
  audioProfile:'music_standard',
  outgoingStream: undefined,
  publishing: false,
  publishUnMuted: false
};

class RTCProducer extends RTCConsumer {

  constructor(config) {
    const { stream = {} } = config || {};
    super({ stream });
    validateConfig(stream);
    // we only initialize producerConfig once in RTCConsumer, here we just extend
    this.producerConfig = defaultProducerConfig;
    this.producerConfig.produceAudio = typeof stream.produceAudio === 'boolean' ?  stream.produceAudio : defaultProducerConfig.produceAudio;
    this.producerConfig.produceVideo = typeof stream.produceVideo === 'boolean' ?  stream.produceVideo : defaultProducerConfig.produceVideo;
    this.producerConfig.produceScreen = typeof stream.produceScreen === 'boolean' ?  stream.produceScreen : defaultProducerConfig.produceScreen;
    this.producerConfig.AEC = AEC || typeof stream.AEC === 'boolean'  ?  stream.AEC : defaultProducerConfig.AEC;
    this.producerConfig.AGC = AGC || typeof stream.AGC === 'boolean' ?  stream.AGC : defaultProducerConfig.AGC;
    this.producerConfig.ANS = ANS || typeof stream.ANS === 'boolean' ?  stream.ANS : defaultProducerConfig.ANS;
    this.producerConfig.micListenTimeout = stream.micListenTimeout || defaultProducerConfig.micListenTimeout;
    this.producerConfig.audioProfile = stream.audioProfile || defaultProducerConfig.audioProfile;
  }

  createStream() {
    // errors in this will be reported through client.on('error')
    // through stream base
    const producerConfig = {
      streamID:this.baseConfig.auth.uid,
      // you can also generate and pass a stream into audio/video
      audio: this.producerConfig.produceAudio,
      video: this.producerConfig.produceVideo, 
      screen: this.producerConfig.produceScreen,
      audioProcessing:{
        AEC:this.producerConfig.AEC,
        AGC:this.producerConfig.AGC,
        ANS:this.producerConfig.ANS
      }
    };
    this.log('debug','Initializing stream with config: ',producerConfig);
    const stream = this.AgoraRTC.createStream(producerConfig);
    // we detect if we get any audio from microphone in a set amount of time
    // if we do not we emit an error. This is cleared in reportvolume
    this.micListenTimeout = setTimeout(() => {
      this.emitter.emit('producer:no-rec-sound',{});
    }, this.producerConfig.micListenTimeout);
    this.producerConfig.outgoingStream = stream;
    return stream
  }
	
  // eslint-disable-next-line class-methods-use-this
  initStream(stream) {
    return new Promise((resolve,reject) => {
      stream.setAudioProfile(this.producerConfig.audioProfile);
      stream.init(() => {
        return resolve()
      }, (err) => {
        const error = rtcError(err,'initStream');
        reject(error);
      });
    })
  }

  createAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = AudioContext ? new AudioContext() : false;
    if (!this.audioContext) {
      this.log('warn','Audiocontext is not defined, unable to analyse outgoing streams');
    }
  }
  
  analyzeStream(agoraStream) {
    // The passed stream is a Agora stream type, which includes a mediastream 
    if (!this.audioContext && this.volumeLoopId) {
      return
    }
    const mediaStreamSource = this.audioContext.createMediaStreamSource(agoraStream.stream);
    // Create a new volume meter and connect it.
    this.volumeMeter = createAudioMeter(this.audioContext);
    mediaStreamSource.connect(this.volumeMeter);
    this.reportVolume();
  }

  stopAnalyzeStream() {
    window.cancelAnimationFrame(this.volumeLoopId);
    this.volumeLoopId = false;
    this.volumeMeter.shutdown();
  }

  reportVolume() {
    const { volume } = this.volumeMeter;
    if (this.micListenTimeout && volume > 0) {
      clearTimeout(this.micListenTimeout);
    }
    const clipping = this.volumeMeter.checkClipping();
    this.emitter.emit('producer:sound-level',{ volume, clipping, muted:!this.producerConfig.publishUnMuted });
    this.volumeLoopId = window.requestAnimationFrame(() => {
      this.reportVolume(); // loop itself
    });
  }

  getProducerConfig() {
    return { 
      produceAudio: this.producerConfig.produceAudio,
      produceVideo: this.producerConfig.produceVideo,
      produceScreen: this.producerConfig.produceScreen,
      AEC: this.producerConfig.AEC,
      AGC: this.producerConfig.AGC,
      ANS: this.producerConfig.ANS,
      publishing: this.producerConfig.publishing,
      publishUnMuted: this.producerConfig.publishUnMuted
    }
  }

  async updateStream(config = {}) {
    // you need to initialze a stream before you can update it
    if (!this.producerConfig.outgoingStream) {
      return
    }
    this.log('debug', 'Updating stream with config', config);
    this.producerConfig.produceAudio = typeof config.produceAudio === 'boolean' ?  config.produceAudio : this.producerConfig.produceAudio;
    this.producerConfig.produceVideo = typeof config.produceVideo === 'boolean' ?  config.produceVideo : this.producerConfig.produceVideo;
    this.producerConfig.produceScreen = typeof config.produceScreen === 'boolean' ?  config.produceScreen : this.producerConfig.produceScreen;
    this.producerConfig.AEC = typeof config.AEC === 'boolean'  ?  config.AEC : this.producerConfig.AEC;
    this.producerConfig.AGC = typeof config.AGC === 'boolean' ?  config.AGC : this.producerConfig.AGC;
    this.producerConfig.ANS = typeof config.ANS === 'boolean' ?  config.ANS : this.producerConfig.ANS;
    // TODO: from agora rtc 3.1.0 stream-unpublished event is supported, use here
    if (this.producerConfig.outgoingStream) {
      await this.unpublishStream();
    }
    // just in case the callbacks from unpublishing do not resolve immediately
    setTimeout(() => {
      this.publishStream();
    },1000);
  }

  async publishStream() {
    if (!this.audioContext) {
      this.createAudioContext();
    }
    if (this.producerConfig.publishing) {
      return this.log('debug','Already publishing, return')
    }
    await this.clientInitialized;
    const stream = this.createStream();
    await this.initStream(stream);
    this.analyzeStream(stream);
    this.producerConfig.publishing = true;
    this.producerConfig.publishUnMuted = true;
    this.client.publish(stream, (err) => {
      if (err) {
        const error = rtcError(err,'publishStream');
        this.emitter.emit('error',error);
      }
    });
    this.emitter.emit('producer:publish', this.getProducerConfig());
  }

  async unpublishStream() {
    if (!this.producerConfig.publishing) {
      return this.log('debug','Already not publishing, return')
    }
    if (!this.producerConfig.outgoingStream) {
      return this.log('warm','No outgoing stream to unpublish!')
    }
    this.log('debug','Unpublishing', this.producerConfig.outgoingStream);
    await this.clientInitialized;
    this.stopAnalyzeStream();
    // the callback runs only on failure. We can't wrap it
    // inside a conditional promise
    this.client.unpublish(this.producerConfig.outgoingStream, (err) => {
      if (err) {
        if (err === 'STREAM_NOT_YET_publishing') {
          return
        }
        const error = rtcError(err,'unpublishStream');
        this.emitter.emit('error',error);
      }
    });
    this.producerConfig.outgoingStream.close();
    this.producerConfig.outgoingStream = null;
    this.producerConfig.publishing = false;
    this.producerConfig.publishUnMuted = false;
    this.emitter.emit('producer:unpublish', this.getProducerConfig());
  }

  async mutePublish() {
    if (!this.producerConfig.publishUnMuted) {
      return this.log('debug','Stream is already muted')
    }
    if (!this.producerConfig.outgoingStream) {
      return this.log('warn','No outgoing stream to mute')
    }
    this.log('debug','Muting outgoing stream');
    await this.clientInitialized;
    if (this.producerConfig.produceAudio) {
      this.producerConfig.outgoingStream.muteAudio();
    }
    if (this.producerConfig.produceVideo || this.producerConfig.produceScreen) {
      this.producerConfig.outgoingStream.muteVideo();
    }
    this.producerConfig.publishUnMuted = false;
    this.emitter.emit('producer:mute');
  }

 
  async unmuteOrPublish() {
    if (this.producerConfig.publishUnMuted) {
      return this.log('debug','Stream is already unmuted')
    }
    await this.clientInitialized;
    this.log('debug','UnMuting outgoing stream');
    this.producerConfig.publishUnMuted = true;
    // if we are not publishing yet we just start publishing
    if (!this.producerConfig.outgoingStream) {
      this.log('debug','Nothing to unmute publishing!');
      return this.publishStream()
    }
    if (this.producerConfig.produceAudio) {
      this.producerConfig.outgoingStream.unmuteAudio();
    }
    if (this.producerConfig.produceVideo) {
      this.producerConfig.outgoingStream.unmuteVideo();
    }
    this.emitter.emit('producer:unmute');
  }
}


/*
Applying only the code below this line
The MIT License (MIT)
Copyright (c) 2014 Chris Wilson
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*
Usage:
audioNode = createAudioMeter(audioContext,clipLevel,averaging,clipLag);
audioContext: the AudioContext you're using.
clipLevel: the level (0 to 1) that you would consider "clipping".
   Defaults to 0.98.
averaging: how "smoothed" you would like the meter to be over time.
   Should be between 0 and less than 1.  Defaults to 0.95.
clipLag: how long you would like the "clipping" indicator to show
   after clipping has occured, in milliseconds.  Defaults to 750ms.
Access the clipping through node.checkClipping(); use node.shutdown to get rid of it.
*/

function createAudioMeter(audioContext) {
  const processor = audioContext.createScriptProcessor(512);
  processor.onaudioprocess = volumeAudioProcess;
  processor.clipping = false;
  processor.lastClip = 0;
  processor.volume = 0;
  processor.clipLevel = 0.98;
  processor.averaging = 0.95;
  processor.clipLag = 750;

  // this will have no effect, since we don't copy the input to the output,
  // but works around a current Chrome bug.
  processor.connect(audioContext.destination);

  // eslint-disable-next-line func-names
  processor.checkClipping = function() {
    if (!this.clipping) {
      return false
    }
    if ((this.lastClip + this.clipLag) < window.performance.now()) {
      this.clipping = false;
    }
    return this.clipping
  };

  // eslint-disable-next-line func-names
  processor.shutdown = function() {
    this.disconnect();
    this.onaudioprocess = null;
  };

  return processor
}

function volumeAudioProcess( event ) {
  const buf = event.inputBuffer.getChannelData(0);
  const bufLength = buf.length;
  let sum = 0;
  let x;

  // Do a root-mean-square on the samples: sum up the squares...
  for (let i = 0; i < bufLength; i++) {
    x = buf[i];
    if (Math.abs(x) >= this.clipLevel) {
      this.clipping = true;
      this.lastClip = window.performance.now();
    }
    sum += x * x;
  }

  // ... then take the square root of the sum.
  const rms =  Math.sqrt(sum / bufLength);

  // Now smooth this out with the averaging factor applied
  // to the previous sample - take the max here because we
  // want "fast attack, slow release."
  this.volume = Math.max(rms, this.volume * this.averaging);
}

function validateConfig$1(interpreterConfig, streamConfig) {
  if (streamConfig.userType !== 'host') {
    throw new Error(`Invalid usertype ${streamConfig.userType} for interpreter. Make sure you are logged in and properly assigned for this event`)
  }
  const constraints = {
    socket:{
      presence:true,
      type:'object'
    },
    turnTimeout:{
      presence:false,
      type:'number'
    },
    floorLang:{
      presence:true,
      type:'string'
    },
    interpretLang:{
      presence:true,
      type:'string'
    }
  };
  const notValid = validate(interpreterConfig, constraints);
  if (notValid) {
    throw new Error(JSON.stringify(notValid))
  }
}

const defaultInterpreterConfig = {
  turnTimeout : 15 * 60 * 1000,
};

class InterpreterStreamer extends RTCProducer {
  constructor(config) {
    const { interpreter = {}, stream = {} } = config || {};
    super({ stream });
    this.interpreterConfig =  { ...defaultInterpreterConfig, ...interpreter };
    validateConfig$1(this.interpreterConfig, stream);
    this.socket = this.interpreterConfig.socket;
    this.initSocketListeners();
    this.interpreterSubscribe();
  }

  takeOver(message) {
    return new Promise((resolve,reject) => {
      const { reason = 'takeOver', time } = message || {};
      const timeNow = time || Date.now();
      const sendTime = timeNow + this.interpreterConfig.turnTimeout;
      this.socket.emit('takeOver', { time:sendTime, reason }, (err, response) => {
        if (err) {
          const error = rtcError(err,'takeOver(socket)');
          this.emitter.emit('error',error);
          reject(error);
        }
        else {
          this.emitter.emit('interpreter:take-over', { time:sendTime, reason });
          resolve(response);
        }
      });
    })
  }

  async requestChange() {
    this.socket.emit('requestChange',{});
    this.emitter.emit('interpreter:request-change');
  }

  async startTurn({ time }) {
    try {
      await this.unmuteOrPublish();
      this.stopLanguage(this.interpreterConfig.interpretLang);
      this.playLanguage(this.interpreterConfig.floorLang);
      this.emitter.emit('interpreter:start-turn', { time } );
    }
    catch (err) {
      const error = rtcError(err,'startTurn');
      this.emitter.emit('error',error);
    }
  }

  async endTurn({ time, reason = 'takeOver' }) {
    try {
      await this.mutePublish();
      this.stopLanguage(this.interpreterConfig.floorLang);
      this.playLanguage(this.interpreterConfig.interpretLang);
      this.emitter.emit('interpreter:end-turn', { time, reason } );
    }
    catch (err) {
      const error = rtcError(err,'endTurn');
      this.emitter.emit('error',error);
    }
  }
  
  async handleSocketStartTurn({ time }) {
    // we are in the process of starting streaming, return
    // this is necessary because this method might be called tens of times
    if (this.starTurnPromise instanceof Promise) {
      return this.socket.emit('turnStarted',{})
    }
    
    try {
      this.startTurnPromise = this.startTurn({ time });
      await this.startTurnPromise;
      this.socket.emit('turnStarted',{});
      this.startTurnPromise = undefined;
    }
    catch (err) {
      const error = rtcError(err,'handleSocketStartTurn');
      this.emitter.emit('error',error);
      this.startTurnPromise = undefined;
    }
  }

  async handleSocketEndTurn({ time, reason = 'takeOver' }) {
    // we are in the process of ending streaming, return
    // this is necessary because this method might be called tens of times
    if (this.endTurnPromise instanceof Promise) {
      return this.socket.emit('turnEnded',{})
    }
    try {
      this.endTurnPromise = this.endTurn({ time, reason });
      await this.endTurnPromise;
      this.socket.emit('turnEnded',{});
      this.endTurnPromise = undefined;
    }
    catch (err) {
      const error = rtcError(err,'handleSocketEndTurn');
      this.emitter.emit('error',error);
      this.startTurnPromise = undefined;
    }    
  }
  

  initSocketListeners() {
    this.socket.on('changeRequested', () => {
      this.emitter.emit('interpreter:change-requested');
    });

    // start turn
    this.socket.on('startTurn', (message) => {
      this.log('debug','Received Socket Start Turn');
      this.handleSocketStartTurn(message);
    });

    // end turn
    this.socket.on('endTurn', (message) => {
      this.log('debug','Received Socket End Turn');
      this.handleSocketEndTurn(message);
    });

    this.socket.on('error',(err) => {
      const error = rtcError(err,'socket');
      this.emitter.emit('error',error);
    });
  }

  async interpreterSubscribe() {
    const { floorLang, interpretLang } = this.interpreterConfig;
    await this.clientInitialized;
    this.subscribeToLanguage({ language:floorLang, autoPlay:false });
    this.subscribeToLanguage({ language:interpretLang, autoPlay:false });
  }

}

class AkkaduBroadcaster extends InterpreterStreamer {
  constructor(config) {
    const { stream = {}, interpreter } = config || {};
    super({ stream, interpreter }); 
    this.broadcasterConfig = { publishing:false };
  }

  /**
   * @description Toggles the stream on and off
   */
  toggle() {
    if (this.broadcasterConfig.publishing) {
      this.unpublishStream();
      this.broadcasterConfig.publishing = false;
    }
    else {
      this.publishStream();
      this.broadcasterConfig.publishing = true;
    }
  }
}

export default AkkaduBroadcaster;
