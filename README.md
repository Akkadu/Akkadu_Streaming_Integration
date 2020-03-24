
# Welcome to Akkadu Modules!

## Description

The goal of this repository is to provide information on how to integrate Akkadu streaming into your platform


## Getting Started

### Audience integration


#### Testing

##### Receiving audio

run

```
yarn install
```

run and head over to localhost:3000
```
yarn start
```


You should see a simple buttom. Clicking that button will start subscibing to our interpreter stream.
The code for this can be found at

```
./server/views/main.ejs
```


In order to hear anyhthing you need to be:

##### Broadcasting Audio 

For this testing setup you can head over to

[china link](https://app.akkadu.cn/broadcast/interpreter?e=rwbb)

or 

[global link](https://app.akkadu.com/broadcast/interpreter?e=rwbb)

and login with details:

- username: akkaduinterpreter1@outlook.com
- password: Interpreter1

to broadcast audio click on the green "Start Turn" button. The green bar on the bottom should start moving.
Remember to allow microphone permissions!



#### Using the SDK



##### Importing

Functionalities are exposed through the @akkadu/akkadu-rtc package.

**This can only be installed with proper npm permission, we have provided you with a token in .npmrc**

As you can see in the main.ejs file we are passing a configuration into the streamer.
For the scope of this test you can continue to use the same roomName and the login details
provided in the previous step.

```
import Akkadu from '@akkadu/akkadu-rtc'

async function initAkkadu() {
  
  const config = {
    roomName:'rwbb' // this is an event identifier.
  }
  const akkaduRTC = new Akkadu(config)
  // Importing of sub-modules is dynamic and depends on the environment. Since we only want to load the things we need
  // this initialization async
  streamer = await akkaduRTC.init()
}
```

##### Usage

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