
# Welcome to Akkadu Modules!

## Description

The goal of this repository is to provide information on how to integrate Akkadu streaming into your platform


## Getting Started


### Getting configuration variables

In order to run this streaming test you need to get certain authentication and room variables, you can
ask these from your Akkadu Team contact or send an email to techforce@akkadu-team.com
with heading: "request:streaming-integration <-name-of-your-company->"

### Running the server

Note: since we are connecting to our Chinese endpoit by default, 
it's best to use this testing page without a VPN

run
```
yarn install
```

run
```
yarn start
```


### Receiving audio

head over to localhost:3000

You should see a simple buttom. Clicking that button will start subscibing to our interpreter stream.
The code for this can be found at

```
./server/views/receiver.ejs
```


In order to hear anyhthing you need to be:

### Broadcasting Audio 

For this testing setup you can head over to

http://localhost:3000/broadcaster

In order to broadcast audio we need three pieces of information
- username 
- password
- room

In future releases we will introduce a token based authentication, for POC purposes
this is not implemented yet.

On the broadcaster.ejs I've hard coded these variables which you can use for now for testing.
To start streaming just click "Toggle Stream!"

## Using the SDK

Functionalities are exposed through the @akkadu/akkadu-rtc package.

**This can only be installed with proper npm permission, we have provided you with a token in .npmrc**

### Audience (Receiver)


#### Importing

As you can see in the receiver.ejs file we are passing a configuration into the streamer.
For the scope of this test you can continue to use the same roomName as used in "Getting Started"

```
import Akkadu from '@akkadu/akkadu-rtc'

async function initAkkadu() {
  
  const config = {
    roomName: undefined // see "Getting configuration variables" 
  }
  const akkaduRTC = new Akkadu(config)
  // Importing of sub-modules is dynamic and depends on the environment. Since we only want to load the things we need this to be async
  streamer = await akkaduRTC.init() // you can also use "initReceiver"
}
```

#### Usage

The streamer exposes one simple functionality for now, this is the toggle function.
It simply toggles the stream on and off when called.

```
/*
 * @description toggles audio on and off
 * @returns {void}
 */
streamer.toggle()
```


### Interpreter (Broadcasting)

As you can see in the broadcaster.ejs file we are passing a configuration into the streamer.
For the scope of this test you can continue to use the same roomName and login details
provided in broadcaster.ejs

```
import Akkadu from '@akkadu/akkadu-rtc'

async function initAkkadu() {
  // see "Getting configuration variables" 
  const config = { roomName: undefined }
  const username = undefined
  const password = undefined
  const akkaduRTC = new Akkadu(config)
  streamer = await akkaduRTC.initBroadcaster(username, password)
}
```

#### Usage

The streamer exposes one simple functionality for now, this is the toggle function.
It simply toggles the stream on and off when called.

```
/*
 * @description toggles audio on and off
 * @returns {void}
 */
streamer.toggle()
```



#### Authentication
As previously mentioned the necessary @akkadu/akkadu-rtc is served behind the token
found in .npmrc.


#### Future features

- [ ] Create external dev auth solution for packages
- [ ] Create external dev auth solution for APIs
- [ ] Create system for adding external domains to CORS configuration on API server
- [ ] Allow configuration to be passed into akkadu-rtc