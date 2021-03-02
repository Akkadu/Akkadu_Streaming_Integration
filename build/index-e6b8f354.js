import { c as createCommonjsModule, a as commonjsGlobal, v as validate, g as getBrowserInfo, i as importanceDebounce } from './index-1a7f038e.js';

var domain;

// This constructor is used to store event handlers. Instantiating this is
// faster than explicitly calling `Object.create(null)` to get a "clean" empty
// object (tested with v8 v4.9).
function EventHandlers() {}
EventHandlers.prototype = Object.create(null);

function EventEmitter() {
  EventEmitter.init.call(this);
}

// nodejs oddity
// require('events') === require('events').EventEmitter
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.usingDomains = false;

EventEmitter.prototype.domain = undefined;
EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

EventEmitter.init = function() {
  this.domain = null;
  if (EventEmitter.usingDomains) {
    // if there is an active domain, then attach to it.
    if (domain.active ) ;
  }

  if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
    this._events = new EventHandlers();
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events, domain;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  domain = this.domain;

  // If there is no 'error' event listener then throw.
  if (doError) {
    er = arguments[1];
    if (domain) {
      if (!er)
        er = new Error('Uncaught, unspecified "error" event');
      er.domainEmitter = this;
      er.domain = domain;
      er.domainThrown = false;
      domain.emit('error', er);
    } else if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
    // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
    // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = new EventHandlers();
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] = prepend ? [listener, existing] :
                                          [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
                            existing.length + ' ' + type + ' listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        emitWarning(w);
      }
    }
  }

  return target;
}
function emitWarning(e) {
  typeof console.warn === 'function' ? console.warn(e) : console.log(e);
}
EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function _onceWrap(target, type, listener) {
  var fired = false;
  function g() {
    target.removeListener(type, g);
    if (!fired) {
      fired = true;
      listener.apply(target, arguments);
    }
  }
  g.listener = listener;
  return g;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || (list.listener && list.listener === listener)) {
        if (--this._eventsCount === 0)
          this._events = new EventHandlers();
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length; i-- > 0;) {
          if (list[i] === listener ||
              (list[i].listener && list[i].listener === listener)) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (list.length === 1) {
          list[0] = undefined;
          if (--this._eventsCount === 0) {
            this._events = new EventHandlers();
            return this;
          } else {
            delete events[type];
          }
        } else {
          spliceOne(list, position);
        }

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = new EventHandlers();
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = new EventHandlers();
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        for (var i = 0, key; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = new EventHandlers();
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        do {
          this.removeListener(type, listeners[listeners.length - 1]);
        } while (listeners[0]);
      }

      return this;
    };

EventEmitter.prototype.listeners = function listeners(type) {
  var evlistener;
  var ret;
  var events = this._events;

  if (!events)
    ret = [];
  else {
    evlistener = events[type];
    if (!evlistener)
      ret = [];
    else if (typeof evlistener === 'function')
      ret = [evlistener.listener || evlistener];
    else
      ret = unwrapListeners(evlistener);
  }

  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, i) {
  var copy = new Array(i);
  while (i--)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

/**
 * @description extends the error object to include a message before the error.
 * Can be used for instance to indicate where error was called from.
 * On desktop debugging this is not mostly needed, but on mobile devices
 * seeing where error originated is often difficult. As of now this does
 * not preserve error type, but this could be maybe added in the future
 * with a prototype extension
 * @param {Error} err
 * @param {{}|String} message
 */
function extendError(err,message) {
  try {
    if (err instanceof Error) {
      const newError = new Error(`${message}:${err.message}`);
      newError.stack = err.stack;
      newError.code = err.code;
      newError.syscall = err.syscall;
      return newError
    }
    return new Error(`${message}:${JSON.stringify(err)}`)
  }
  catch (error) {
    console.warn('Unable to extend error at Akkadu-RTC, returning original. Source: ', message);
    console.warn(error);
    return err
  }
}

/**
 * @description extends the a message object or string to include a message
 * before the original message. Can be used for instance to indicate
 * where message was called from. Useful to extend messages from external libraries
 * @param {{}|String} message
 * @param {{}|String} header
 */
function extendMessage(message,header) {
  try {
    return `${header}:${JSON.stringify(message)}`
  }
  catch (error) {
    console.warn('Unable to extend message at Akkadu-RTC, returning original. Source: ', message);
    console.warn(error);
    return message
  }
}

function reloadWindow(timeout = 1000) {
  setTimeout(() => {
    window.location.reload();
  },timeout);
}

/**
 * @description intelligently react to errors emitted from RTC related functions if we are
 * unable to detect issues and react to them on load time
 */
function rtcError(err, message) {
  const error = extendError(err,message); 
  if (error && error.message && error.message.match(/RTCPeerConnection/)) {
    if (localStorage) {
      localStorage.forceRTCFallback = true;
      reloadWindow();
    }
  }
  return error
}

var DetectRTC = createCommonjsModule(function (module) {

// Last Updated On: 2020-03-23 2:31:22 AM UTC

// ________________
// DetectRTC v1.4.0

// Open-Sourced: https://github.com/muaz-khan/DetectRTC

// --------------------------------------------------
// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
// --------------------------------------------------

(function() {

    var browserFakeUserAgent = 'Fake/5.0 (FakeOS) AppleWebKit/123 (KHTML, like Gecko) Fake/12.3.4567.89 Fake/123.45';

    var isNodejs = typeof process === 'object' && typeof process.versions === 'object' && process.versions.node && /*node-process*/ !process.browser;
    if (isNodejs) {
        var version = process.versions.node.toString().replace('v', '');
        browserFakeUserAgent = 'Nodejs/' + version + ' (NodeOS) AppleWebKit/' + version + ' (KHTML, like Gecko) Nodejs/' + version + ' Nodejs/' + version;
    }

    (function(that) {
        if (typeof window !== 'undefined') {
            return;
        }

        if (typeof window === 'undefined' && typeof commonjsGlobal !== 'undefined') {
            commonjsGlobal.navigator = {
                userAgent: browserFakeUserAgent,
                getUserMedia: function() {}
            };

            /*global window:true */
            that.window = commonjsGlobal;
        }

        if (typeof location === 'undefined') {
            /*global location:true */
            that.location = {
                protocol: 'file:',
                href: '',
                hash: ''
            };
        }

        if (typeof screen === 'undefined') {
            /*global screen:true */
            that.screen = {
                width: 0,
                height: 0
            };
        }
    })(typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : window);

    /*global navigator:true */
    var navigator = window.navigator;

    if (typeof navigator !== 'undefined') {
        if (typeof navigator.webkitGetUserMedia !== 'undefined') {
            navigator.getUserMedia = navigator.webkitGetUserMedia;
        }

        if (typeof navigator.mozGetUserMedia !== 'undefined') {
            navigator.getUserMedia = navigator.mozGetUserMedia;
        }
    } else {
        navigator = {
            getUserMedia: function() {},
            userAgent: browserFakeUserAgent
        };
    }

    var isMobileDevice = !!(/Android|webOS|iPhone|iPad|iPod|BB10|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(navigator.userAgent || ''));

    var isEdge = navigator.userAgent.indexOf('Edge') !== -1 && (!!navigator.msSaveOrOpenBlob || !!navigator.msSaveBlob);

    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1 && ('netscape' in window) && / rv:/.test(navigator.userAgent);
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    var isChrome = !!window.chrome && !isOpera;
    var isIE = typeof document !== 'undefined' && !!document.documentMode && !isEdge;

    // this one can also be used:
    // https://www.websocket.org/js/stuff.js (DetectBrowser.js)

    function getBrowserInfo() {
        var nVer = navigator.appVersion;
        var nAgt = navigator.userAgent;
        var browserName = navigator.appName;
        var fullVersion = '' + parseFloat(navigator.appVersion);
        var majorVersion = parseInt(navigator.appVersion, 10);
        var nameOffset, verOffset, ix;

        // In Opera, the true version is after 'Opera' or after 'Version'
        if (isOpera) {
            browserName = 'Opera';
            try {
                fullVersion = navigator.userAgent.split('OPR/')[1].split(' ')[0];
                majorVersion = fullVersion.split('.')[0];
            } catch (e) {
                fullVersion = '0.0.0.0';
                majorVersion = 0;
            }
        }
        // In MSIE version <=10, the true version is after 'MSIE' in userAgent
        // In IE 11, look for the string after 'rv:'
        else if (isIE) {
            verOffset = nAgt.indexOf('rv:');
            if (verOffset > 0) { //IE 11
                fullVersion = nAgt.substring(verOffset + 3);
            } else { //IE 10 or earlier
                verOffset = nAgt.indexOf('MSIE');
                fullVersion = nAgt.substring(verOffset + 5);
            }
            browserName = 'IE';
        }
        // In Chrome, the true version is after 'Chrome' 
        else if (isChrome) {
            verOffset = nAgt.indexOf('Chrome');
            browserName = 'Chrome';
            fullVersion = nAgt.substring(verOffset + 7);
        }
        // In Safari, the true version is after 'Safari' or after 'Version' 
        else if (isSafari) {
            // both and safri and chrome has same userAgent
            if (nAgt.indexOf('CriOS') !== -1) {
                verOffset = nAgt.indexOf('CriOS');
                browserName = 'Chrome';
                fullVersion = nAgt.substring(verOffset + 6);
            } else if (nAgt.indexOf('FxiOS') !== -1) {
                verOffset = nAgt.indexOf('FxiOS');
                browserName = 'Firefox';
                fullVersion = nAgt.substring(verOffset + 6);
            } else {
                verOffset = nAgt.indexOf('Safari');

                browserName = 'Safari';
                fullVersion = nAgt.substring(verOffset + 7);

                if ((verOffset = nAgt.indexOf('Version')) !== -1) {
                    fullVersion = nAgt.substring(verOffset + 8);
                }

                if (navigator.userAgent.indexOf('Version/') !== -1) {
                    fullVersion = navigator.userAgent.split('Version/')[1].split(' ')[0];
                }
            }
        }
        // In Firefox, the true version is after 'Firefox' 
        else if (isFirefox) {
            verOffset = nAgt.indexOf('Firefox');
            browserName = 'Firefox';
            fullVersion = nAgt.substring(verOffset + 8);
        }

        // In most other browsers, 'name/version' is at the end of userAgent 
        else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
            browserName = nAgt.substring(nameOffset, verOffset);
            fullVersion = nAgt.substring(verOffset + 1);

            if (browserName.toLowerCase() === browserName.toUpperCase()) {
                browserName = navigator.appName;
            }
        }

        if (isEdge) {
            browserName = 'Edge';
            fullVersion = navigator.userAgent.split('Edge/')[1];
            // fullVersion = parseInt(navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)[2], 10).toString();
        }

        // trim the fullVersion string at semicolon/space/bracket if present
        if ((ix = fullVersion.search(/[; \)]/)) !== -1) {
            fullVersion = fullVersion.substring(0, ix);
        }

        majorVersion = parseInt('' + fullVersion, 10);

        if (isNaN(majorVersion)) {
            fullVersion = '' + parseFloat(navigator.appVersion);
            majorVersion = parseInt(navigator.appVersion, 10);
        }

        return {
            fullVersion: fullVersion,
            version: majorVersion,
            name: browserName,
            isPrivateBrowsing: false
        };
    }

    // via: https://gist.github.com/cou929/7973956

    function retry(isDone, next) {
        var currentTrial = 0,
            maxRetry = 50,
            isTimeout = false;
        var id = window.setInterval(
            function() {
                if (isDone()) {
                    window.clearInterval(id);
                    next(isTimeout);
                }
                if (currentTrial++ > maxRetry) {
                    window.clearInterval(id);
                    isTimeout = true;
                    next(isTimeout);
                }
            },
            10
        );
    }

    function isIE10OrLater(userAgent) {
        var ua = userAgent.toLowerCase();
        if (ua.indexOf('msie') === 0 && ua.indexOf('trident') === 0) {
            return false;
        }
        var match = /(?:msie|rv:)\s?([\d\.]+)/.exec(ua);
        if (match && parseInt(match[1], 10) >= 10) {
            return true;
        }
        return false;
    }

    function detectPrivateMode(callback) {
        var isPrivate;

        try {

            if (window.webkitRequestFileSystem) {
                window.webkitRequestFileSystem(
                    window.TEMPORARY, 1,
                    function() {
                        isPrivate = false;
                    },
                    function(e) {
                        isPrivate = true;
                    }
                );
            } else if (window.indexedDB && /Firefox/.test(window.navigator.userAgent)) {
                var db;
                try {
                    db = window.indexedDB.open('test');
                    db.onerror = function() {
                        return true;
                    };
                } catch (e) {
                    isPrivate = true;
                }

                if (typeof isPrivate === 'undefined') {
                    retry(
                        function isDone() {
                            return db.readyState === 'done' ? true : false;
                        },
                        function next(isTimeout) {
                            if (!isTimeout) {
                                isPrivate = db.result ? false : true;
                            }
                        }
                    );
                }
            } else if (isIE10OrLater(window.navigator.userAgent)) {
                isPrivate = false;
                try {
                    if (!window.indexedDB) {
                        isPrivate = true;
                    }
                } catch (e) {
                    isPrivate = true;
                }
            } else if (window.localStorage && /Safari/.test(window.navigator.userAgent)) {
                try {
                    window.localStorage.setItem('test', 1);
                } catch (e) {
                    isPrivate = true;
                }

                if (typeof isPrivate === 'undefined') {
                    isPrivate = false;
                    window.localStorage.removeItem('test');
                }
            }

        } catch (e) {
            isPrivate = false;
        }

        retry(
            function isDone() {
                return typeof isPrivate !== 'undefined' ? true : false;
            },
            function next(isTimeout) {
                callback(isPrivate);
            }
        );
    }

    var isMobile = {
        Android: function() {
            return navigator.userAgent.match(/Android/i);
        },
        BlackBerry: function() {
            return navigator.userAgent.match(/BlackBerry|BB10/i);
        },
        iOS: function() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        Opera: function() {
            return navigator.userAgent.match(/Opera Mini/i);
        },
        Windows: function() {
            return navigator.userAgent.match(/IEMobile/i);
        },
        any: function() {
            return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
        },
        getOsName: function() {
            var osName = 'Unknown OS';
            if (isMobile.Android()) {
                osName = 'Android';
            }

            if (isMobile.BlackBerry()) {
                osName = 'BlackBerry';
            }

            if (isMobile.iOS()) {
                osName = 'iOS';
            }

            if (isMobile.Opera()) {
                osName = 'Opera Mini';
            }

            if (isMobile.Windows()) {
                osName = 'Windows';
            }

            return osName;
        }
    };

    // via: http://jsfiddle.net/ChristianL/AVyND/
    function detectDesktopOS() {
        var unknown = '-';

        var nVer = navigator.appVersion;
        var nAgt = navigator.userAgent;

        var os = unknown;
        var clientStrings = [{
            s: 'Chrome OS',
            r: /CrOS/
        }, {
            s: 'Windows 10',
            r: /(Windows 10.0|Windows NT 10.0)/
        }, {
            s: 'Windows 8.1',
            r: /(Windows 8.1|Windows NT 6.3)/
        }, {
            s: 'Windows 8',
            r: /(Windows 8|Windows NT 6.2)/
        }, {
            s: 'Windows 7',
            r: /(Windows 7|Windows NT 6.1)/
        }, {
            s: 'Windows Vista',
            r: /Windows NT 6.0/
        }, {
            s: 'Windows Server 2003',
            r: /Windows NT 5.2/
        }, {
            s: 'Windows XP',
            r: /(Windows NT 5.1|Windows XP)/
        }, {
            s: 'Windows 2000',
            r: /(Windows NT 5.0|Windows 2000)/
        }, {
            s: 'Windows ME',
            r: /(Win 9x 4.90|Windows ME)/
        }, {
            s: 'Windows 98',
            r: /(Windows 98|Win98)/
        }, {
            s: 'Windows 95',
            r: /(Windows 95|Win95|Windows_95)/
        }, {
            s: 'Windows NT 4.0',
            r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/
        }, {
            s: 'Windows CE',
            r: /Windows CE/
        }, {
            s: 'Windows 3.11',
            r: /Win16/
        }, {
            s: 'Android',
            r: /Android/
        }, {
            s: 'Open BSD',
            r: /OpenBSD/
        }, {
            s: 'Sun OS',
            r: /SunOS/
        }, {
            s: 'Linux',
            r: /(Linux|X11)/
        }, {
            s: 'iOS',
            r: /(iPhone|iPad|iPod)/
        }, {
            s: 'Mac OS X',
            r: /Mac OS X/
        }, {
            s: 'Mac OS',
            r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/
        }, {
            s: 'QNX',
            r: /QNX/
        }, {
            s: 'UNIX',
            r: /UNIX/
        }, {
            s: 'BeOS',
            r: /BeOS/
        }, {
            s: 'OS/2',
            r: /OS\/2/
        }, {
            s: 'Search Bot',
            r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/
        }];
        for (var i = 0, cs; cs = clientStrings[i]; i++) {
            if (cs.r.test(nAgt)) {
                os = cs.s;
                break;
            }
        }

        var osVersion = unknown;

        if (/Windows/.test(os)) {
            if (/Windows (.*)/.test(os)) {
                osVersion = /Windows (.*)/.exec(os)[1];
            }
            os = 'Windows';
        }

        switch (os) {
            case 'Mac OS X':
                if (/Mac OS X (10[\.\_\d]+)/.test(nAgt)) {
                    osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
                }
                break;
            case 'Android':
                if (/Android ([\.\_\d]+)/.test(nAgt)) {
                    osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
                }
                break;
            case 'iOS':
                if (/OS (\d+)_(\d+)_?(\d+)?/.test(nAgt)) {
                    osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
                    osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
                }
                break;
        }

        return {
            osName: os,
            osVersion: osVersion
        };
    }

    var osName = 'Unknown OS';
    var osVersion = 'Unknown OS Version';

    function getAndroidVersion(ua) {
        ua = (ua || navigator.userAgent).toLowerCase();
        var match = ua.match(/android\s([0-9\.]*)/);
        return match ? match[1] : false;
    }

    var osInfo = detectDesktopOS();

    if (osInfo && osInfo.osName && osInfo.osName != '-') {
        osName = osInfo.osName;
        osVersion = osInfo.osVersion;
    } else if (isMobile.any()) {
        osName = isMobile.getOsName();

        if (osName == 'Android') {
            osVersion = getAndroidVersion();
        }
    }

    var isNodejs = typeof process === 'object' && typeof process.versions === 'object' && process.versions.node;

    if (osName === 'Unknown OS' && isNodejs) {
        osName = 'Nodejs';
        osVersion = process.versions.node.toString().replace('v', '');
    }

    var isCanvasSupportsStreamCapturing = false;
    var isVideoSupportsStreamCapturing = false;
    ['captureStream', 'mozCaptureStream', 'webkitCaptureStream'].forEach(function(item) {
        if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
            return;
        }

        if (!isCanvasSupportsStreamCapturing && item in document.createElement('canvas')) {
            isCanvasSupportsStreamCapturing = true;
        }

        if (!isVideoSupportsStreamCapturing && item in document.createElement('video')) {
            isVideoSupportsStreamCapturing = true;
        }
    });

    var regexIpv4Local = /^(192\.168\.|169\.254\.|10\.|172\.(1[6-9]|2\d|3[01]))/,
        regexIpv4 = /([0-9]{1,3}(\.[0-9]{1,3}){3})/,
        regexIpv6 = /[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7}/;

    // via: https://github.com/diafygi/webrtc-ips
    function DetectLocalIPAddress(callback, stream) {
        if (!DetectRTC.isWebRTCSupported) {
            return;
        }

        var isPublic = true,
            isIpv4 = true;
        getIPs(function(ip) {
            if (!ip) {
                callback(); // Pass nothing to tell that ICE-gathering-ended
            } else if (ip.match(regexIpv4Local)) {
                isPublic = false;
                callback('Local: ' + ip, isPublic, isIpv4);
            } else if (ip.match(regexIpv6)) { //via https://ourcodeworld.com/articles/read/257/how-to-get-the-client-ip-address-with-javascript-only
                isIpv4 = false;
                callback('Public: ' + ip, isPublic, isIpv4);
            } else {
                callback('Public: ' + ip, isPublic, isIpv4);
            }
        }, stream);
    }

    function getIPs(callback, stream) {
        if (typeof document === 'undefined' || typeof document.getElementById !== 'function') {
            return;
        }

        var ipDuplicates = {};

        var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

        if (!RTCPeerConnection) {
            var iframe = document.getElementById('iframe');
            if (!iframe) {
                return;
            }
            var win = iframe.contentWindow;
            RTCPeerConnection = win.RTCPeerConnection || win.mozRTCPeerConnection || win.webkitRTCPeerConnection;
        }

        if (!RTCPeerConnection) {
            return;
        }

        var peerConfig = null;

        if (DetectRTC.browser === 'Chrome' && DetectRTC.browser.version < 58) {
            // todo: add support for older Opera
            peerConfig = {
                optional: [{
                    RtpDataChannels: true
                }]
            };
        }

        var servers = {
            iceServers: [{
                urls: 'stun:stun.l.google.com:19302'
            }]
        };

        var pc = new RTCPeerConnection(servers, peerConfig);

        if (stream) {
            if (pc.addStream) {
                pc.addStream(stream);
            } else if (pc.addTrack && stream.getTracks()[0]) {
                pc.addTrack(stream.getTracks()[0], stream);
            }
        }

        function handleCandidate(candidate) {
            if (!candidate) {
                callback(); // Pass nothing to tell that ICE-gathering-ended
                return;
            }

            var match = regexIpv4.exec(candidate);
            if (!match) {
                return;
            }
            var ipAddress = match[1];
            var isPublic = (candidate.match(regexIpv4Local)),
                isIpv4 = true;

            if (ipDuplicates[ipAddress] === undefined) {
                callback(ipAddress, isPublic, isIpv4);
            }

            ipDuplicates[ipAddress] = true;
        }

        // listen for candidate events
        pc.onicecandidate = function(event) {
            if (event.candidate && event.candidate.candidate) {
                handleCandidate(event.candidate.candidate);
            } else {
                handleCandidate(); // Pass nothing to tell that ICE-gathering-ended
            }
        };

        // create data channel
        if (!stream) {
            try {
                pc.createDataChannel('sctp', {});
            } catch (e) {}
        }

        // create an offer sdp
        if (DetectRTC.isPromisesSupported) {
            pc.createOffer().then(function(result) {
                pc.setLocalDescription(result).then(afterCreateOffer);
            });
        } else {
            pc.createOffer(function(result) {
                pc.setLocalDescription(result, afterCreateOffer, function() {});
            }, function() {});
        }

        function afterCreateOffer() {
            var lines = pc.localDescription.sdp.split('\n');

            lines.forEach(function(line) {
                if (line && line.indexOf('a=candidate:') === 0) {
                    handleCandidate(line);
                }
            });
        }
    }

    var MediaDevices = [];

    var audioInputDevices = [];
    var audioOutputDevices = [];
    var videoInputDevices = [];

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        // Firefox 38+ seems having support of enumerateDevices
        // Thanks @xdumaine/enumerateDevices
        navigator.enumerateDevices = function(callback) {
            var enumerateDevices = navigator.mediaDevices.enumerateDevices();
            if (enumerateDevices && enumerateDevices.then) {
                navigator.mediaDevices.enumerateDevices().then(callback).catch(function() {
                    callback([]);
                });
            } else {
                callback([]);
            }
        };
    }

    // Media Devices detection
    var canEnumerate = false;

    /*global MediaStreamTrack:true */
    if (typeof MediaStreamTrack !== 'undefined' && 'getSources' in MediaStreamTrack) {
        canEnumerate = true;
    } else if (navigator.mediaDevices && !!navigator.mediaDevices.enumerateDevices) {
        canEnumerate = true;
    }

    var hasMicrophone = false;
    var hasSpeakers = false;
    var hasWebcam = false;

    var isWebsiteHasMicrophonePermissions = false;
    var isWebsiteHasWebcamPermissions = false;

    // http://dev.w3.org/2011/webrtc/editor/getusermedia.html#mediadevices
    function checkDeviceSupport(callback) {
        if (!canEnumerate) {
            if (callback) {
                callback();
            }
            return;
        }

        if (!navigator.enumerateDevices && window.MediaStreamTrack && window.MediaStreamTrack.getSources) {
            navigator.enumerateDevices = window.MediaStreamTrack.getSources.bind(window.MediaStreamTrack);
        }

        if (!navigator.enumerateDevices && navigator.enumerateDevices) {
            navigator.enumerateDevices = navigator.enumerateDevices.bind(navigator);
        }

        if (!navigator.enumerateDevices) {
            if (callback) {
                callback();
            }
            return;
        }

        MediaDevices = [];

        audioInputDevices = [];
        audioOutputDevices = [];
        videoInputDevices = [];

        hasMicrophone = false;
        hasSpeakers = false;
        hasWebcam = false;

        isWebsiteHasMicrophonePermissions = false;
        isWebsiteHasWebcamPermissions = false;

        // to prevent duplication
        var alreadyUsedDevices = {};

        navigator.enumerateDevices(function(devices) {
            MediaDevices = [];

            audioInputDevices = [];
            audioOutputDevices = [];
            videoInputDevices = [];

            devices.forEach(function(_device) {
                var device = {};
                for (var d in _device) {
                    try {
                        if (typeof _device[d] !== 'function') {
                            device[d] = _device[d];
                        }
                    } catch (e) {}
                }

                if (alreadyUsedDevices[device.deviceId + device.label + device.kind]) {
                    return;
                }

                // if it is MediaStreamTrack.getSources
                if (device.kind === 'audio') {
                    device.kind = 'audioinput';
                }

                if (device.kind === 'video') {
                    device.kind = 'videoinput';
                }

                if (!device.deviceId) {
                    device.deviceId = device.id;
                }

                if (!device.id) {
                    device.id = device.deviceId;
                }

                if (!device.label) {
                    device.isCustomLabel = true;

                    if (device.kind === 'videoinput') {
                        device.label = 'Camera ' + (videoInputDevices.length + 1);
                    } else if (device.kind === 'audioinput') {
                        device.label = 'Microphone ' + (audioInputDevices.length + 1);
                    } else if (device.kind === 'audiooutput') {
                        device.label = 'Speaker ' + (audioOutputDevices.length + 1);
                    } else {
                        device.label = 'Please invoke getUserMedia once.';
                    }

                    if (typeof DetectRTC !== 'undefined' && DetectRTC.browser.isChrome && DetectRTC.browser.version >= 46 && !/^(https:|chrome-extension:)$/g.test(location.protocol || '')) {
                        if (typeof document !== 'undefined' && typeof document.domain === 'string' && document.domain.search && document.domain.search(/localhost|127.0./g) === -1) {
                            device.label = 'HTTPs is required to get label of this ' + device.kind + ' device.';
                        }
                    }
                } else {
                    // Firefox on Android still returns empty label
                    if (device.kind === 'videoinput' && !isWebsiteHasWebcamPermissions) {
                        isWebsiteHasWebcamPermissions = true;
                    }

                    if (device.kind === 'audioinput' && !isWebsiteHasMicrophonePermissions) {
                        isWebsiteHasMicrophonePermissions = true;
                    }
                }

                if (device.kind === 'audioinput') {
                    hasMicrophone = true;

                    if (audioInputDevices.indexOf(device) === -1) {
                        audioInputDevices.push(device);
                    }
                }

                if (device.kind === 'audiooutput') {
                    hasSpeakers = true;

                    if (audioOutputDevices.indexOf(device) === -1) {
                        audioOutputDevices.push(device);
                    }
                }

                if (device.kind === 'videoinput') {
                    hasWebcam = true;

                    if (videoInputDevices.indexOf(device) === -1) {
                        videoInputDevices.push(device);
                    }
                }

                // there is no 'videoouput' in the spec.
                MediaDevices.push(device);

                alreadyUsedDevices[device.deviceId + device.label + device.kind] = device;
            });

            if (typeof DetectRTC !== 'undefined') {
                // to sync latest outputs
                DetectRTC.MediaDevices = MediaDevices;
                DetectRTC.hasMicrophone = hasMicrophone;
                DetectRTC.hasSpeakers = hasSpeakers;
                DetectRTC.hasWebcam = hasWebcam;

                DetectRTC.isWebsiteHasWebcamPermissions = isWebsiteHasWebcamPermissions;
                DetectRTC.isWebsiteHasMicrophonePermissions = isWebsiteHasMicrophonePermissions;

                DetectRTC.audioInputDevices = audioInputDevices;
                DetectRTC.audioOutputDevices = audioOutputDevices;
                DetectRTC.videoInputDevices = videoInputDevices;
            }

            if (callback) {
                callback();
            }
        });
    }

    var DetectRTC = window.DetectRTC || {};

    // ----------
    // DetectRTC.browser.name || DetectRTC.browser.version || DetectRTC.browser.fullVersion
    DetectRTC.browser = getBrowserInfo();

    detectPrivateMode(function(isPrivateBrowsing) {
        DetectRTC.browser.isPrivateBrowsing = !!isPrivateBrowsing;
    });

    // DetectRTC.isChrome || DetectRTC.isFirefox || DetectRTC.isEdge
    DetectRTC.browser['is' + DetectRTC.browser.name] = true;

    // -----------
    DetectRTC.osName = osName;
    DetectRTC.osVersion = osVersion;

    var isNodeWebkit = typeof process === 'object' && typeof process.versions === 'object' && process.versions['node-webkit'];

    // --------- Detect if system supports WebRTC 1.0 or WebRTC 1.1.
    var isWebRTCSupported = false;
    ['RTCPeerConnection', 'webkitRTCPeerConnection', 'mozRTCPeerConnection', 'RTCIceGatherer'].forEach(function(item) {
        if (isWebRTCSupported) {
            return;
        }

        if (item in window) {
            isWebRTCSupported = true;
        }
    });
    DetectRTC.isWebRTCSupported = isWebRTCSupported;

    //-------
    DetectRTC.isORTCSupported = typeof RTCIceGatherer !== 'undefined';

    // --------- Detect if system supports screen capturing API
    var isScreenCapturingSupported = false;
    if (DetectRTC.browser.isChrome && DetectRTC.browser.version >= 35) {
        isScreenCapturingSupported = true;
    } else if (DetectRTC.browser.isFirefox && DetectRTC.browser.version >= 34) {
        isScreenCapturingSupported = true;
    } else if (DetectRTC.browser.isEdge && DetectRTC.browser.version >= 17) {
        isScreenCapturingSupported = true;
    } else if (DetectRTC.osName === 'Android' && DetectRTC.browser.isChrome) {
        isScreenCapturingSupported = true;
    }

    if (!!navigator.getDisplayMedia || (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)) {
        isScreenCapturingSupported = true;
    }

    if (!/^(https:|chrome-extension:)$/g.test(location.protocol || '')) {
        var isNonLocalHost = typeof document !== 'undefined' && typeof document.domain === 'string' && document.domain.search && document.domain.search(/localhost|127.0./g) === -1;
        if (isNonLocalHost && (DetectRTC.browser.isChrome || DetectRTC.browser.isEdge || DetectRTC.browser.isOpera)) {
            isScreenCapturingSupported = false;
        } else if (DetectRTC.browser.isFirefox) {
            isScreenCapturingSupported = false;
        }
    }
    DetectRTC.isScreenCapturingSupported = isScreenCapturingSupported;

    // --------- Detect if WebAudio API are supported
    var webAudio = {
        isSupported: false,
        isCreateMediaStreamSourceSupported: false
    };

    ['AudioContext', 'webkitAudioContext', 'mozAudioContext', 'msAudioContext'].forEach(function(item) {
        if (webAudio.isSupported) {
            return;
        }

        if (item in window) {
            webAudio.isSupported = true;

            if (window[item] && 'createMediaStreamSource' in window[item].prototype) {
                webAudio.isCreateMediaStreamSourceSupported = true;
            }
        }
    });
    DetectRTC.isAudioContextSupported = webAudio.isSupported;
    DetectRTC.isCreateMediaStreamSourceSupported = webAudio.isCreateMediaStreamSourceSupported;

    // ---------- Detect if SCTP/RTP channels are supported.

    var isRtpDataChannelsSupported = false;
    if (DetectRTC.browser.isChrome && DetectRTC.browser.version > 31) {
        isRtpDataChannelsSupported = true;
    }
    DetectRTC.isRtpDataChannelsSupported = isRtpDataChannelsSupported;

    var isSCTPSupportd = false;
    if (DetectRTC.browser.isFirefox && DetectRTC.browser.version > 28) {
        isSCTPSupportd = true;
    } else if (DetectRTC.browser.isChrome && DetectRTC.browser.version > 25) {
        isSCTPSupportd = true;
    } else if (DetectRTC.browser.isOpera && DetectRTC.browser.version >= 11) {
        isSCTPSupportd = true;
    }
    DetectRTC.isSctpDataChannelsSupported = isSCTPSupportd;

    // ---------

    DetectRTC.isMobileDevice = isMobileDevice; // "isMobileDevice" boolean is defined in "getBrowserInfo.js"

    // ------
    var isGetUserMediaSupported = false;
    if (navigator.getUserMedia) {
        isGetUserMediaSupported = true;
    } else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        isGetUserMediaSupported = true;
    }

    if (DetectRTC.browser.isChrome && DetectRTC.browser.version >= 46 && !/^(https:|chrome-extension:)$/g.test(location.protocol || '')) {
        if (typeof document !== 'undefined' && typeof document.domain === 'string' && document.domain.search && document.domain.search(/localhost|127.0./g) === -1) {
            isGetUserMediaSupported = 'Requires HTTPs';
        }
    }

    if (DetectRTC.osName === 'Nodejs') {
        isGetUserMediaSupported = false;
    }
    DetectRTC.isGetUserMediaSupported = isGetUserMediaSupported;

    var displayResolution = '';
    if (screen.width) {
        var width = (screen.width) ? screen.width : '';
        var height = (screen.height) ? screen.height : '';
        displayResolution += '' + width + ' x ' + height;
    }
    DetectRTC.displayResolution = displayResolution;

    function getAspectRatio(w, h) {
        function gcd(a, b) {
            return (b == 0) ? a : gcd(b, a % b);
        }
        var r = gcd(w, h);
        return (w / r) / (h / r);
    }

    DetectRTC.displayAspectRatio = getAspectRatio(screen.width, screen.height).toFixed(2);

    // ----------
    DetectRTC.isCanvasSupportsStreamCapturing = isCanvasSupportsStreamCapturing;
    DetectRTC.isVideoSupportsStreamCapturing = isVideoSupportsStreamCapturing;

    if (DetectRTC.browser.name == 'Chrome' && DetectRTC.browser.version >= 53) {
        if (!DetectRTC.isCanvasSupportsStreamCapturing) {
            DetectRTC.isCanvasSupportsStreamCapturing = 'Requires chrome flag: enable-experimental-web-platform-features';
        }

        if (!DetectRTC.isVideoSupportsStreamCapturing) {
            DetectRTC.isVideoSupportsStreamCapturing = 'Requires chrome flag: enable-experimental-web-platform-features';
        }
    }

    // ------
    DetectRTC.DetectLocalIPAddress = DetectLocalIPAddress;

    DetectRTC.isWebSocketsSupported = 'WebSocket' in window && 2 === window.WebSocket.CLOSING;
    DetectRTC.isWebSocketsBlocked = !DetectRTC.isWebSocketsSupported;

    if (DetectRTC.osName === 'Nodejs') {
        DetectRTC.isWebSocketsSupported = true;
        DetectRTC.isWebSocketsBlocked = false;
    }

    DetectRTC.checkWebSocketsSupport = function(callback) {
        callback = callback || function() {};
        try {
            var starttime;
            var websocket = new WebSocket('wss://echo.websocket.org:443/');
            websocket.onopen = function() {
                DetectRTC.isWebSocketsBlocked = false;
                starttime = (new Date).getTime();
                websocket.send('ping');
            };
            websocket.onmessage = function() {
                DetectRTC.WebsocketLatency = (new Date).getTime() - starttime + 'ms';
                callback();
                websocket.close();
                websocket = null;
            };
            websocket.onerror = function() {
                DetectRTC.isWebSocketsBlocked = true;
                callback();
            };
        } catch (e) {
            DetectRTC.isWebSocketsBlocked = true;
            callback();
        }
    };

    // -------
    DetectRTC.load = function(callback) {
        callback = callback || function() {};
        checkDeviceSupport(callback);
    };

    if (typeof MediaDevices !== 'undefined') {
        DetectRTC.MediaDevices = MediaDevices;
    } else {
        DetectRTC.MediaDevices = [];
    }

    DetectRTC.hasMicrophone = hasMicrophone;
    DetectRTC.hasSpeakers = hasSpeakers;
    DetectRTC.hasWebcam = hasWebcam;

    DetectRTC.isWebsiteHasWebcamPermissions = isWebsiteHasWebcamPermissions;
    DetectRTC.isWebsiteHasMicrophonePermissions = isWebsiteHasMicrophonePermissions;

    DetectRTC.audioInputDevices = audioInputDevices;
    DetectRTC.audioOutputDevices = audioOutputDevices;
    DetectRTC.videoInputDevices = videoInputDevices;

    // ------
    var isSetSinkIdSupported = false;
    if (typeof document !== 'undefined' && typeof document.createElement === 'function' && 'setSinkId' in document.createElement('video')) {
        isSetSinkIdSupported = true;
    }
    DetectRTC.isSetSinkIdSupported = isSetSinkIdSupported;

    // -----
    var isRTPSenderReplaceTracksSupported = false;
    if (DetectRTC.browser.isFirefox && typeof mozRTCPeerConnection !== 'undefined' /*&& DetectRTC.browser.version > 39*/ ) {
        /*global mozRTCPeerConnection:true */
        if ('getSenders' in mozRTCPeerConnection.prototype) {
            isRTPSenderReplaceTracksSupported = true;
        }
    } else if (DetectRTC.browser.isChrome && typeof webkitRTCPeerConnection !== 'undefined') {
        /*global webkitRTCPeerConnection:true */
        if ('getSenders' in webkitRTCPeerConnection.prototype) {
            isRTPSenderReplaceTracksSupported = true;
        }
    }
    DetectRTC.isRTPSenderReplaceTracksSupported = isRTPSenderReplaceTracksSupported;

    //------
    var isRemoteStreamProcessingSupported = false;
    if (DetectRTC.browser.isFirefox && DetectRTC.browser.version > 38) {
        isRemoteStreamProcessingSupported = true;
    }
    DetectRTC.isRemoteStreamProcessingSupported = isRemoteStreamProcessingSupported;

    //-------
    var isApplyConstraintsSupported = false;

    /*global MediaStreamTrack:true */
    if (typeof MediaStreamTrack !== 'undefined' && 'applyConstraints' in MediaStreamTrack.prototype) {
        isApplyConstraintsSupported = true;
    }
    DetectRTC.isApplyConstraintsSupported = isApplyConstraintsSupported;

    //-------
    var isMultiMonitorScreenCapturingSupported = false;
    if (DetectRTC.browser.isFirefox && DetectRTC.browser.version >= 43) {
        // version 43 merely supports platforms for multi-monitors
        // version 44 will support exact multi-monitor selection i.e. you can select any monitor for screen capturing.
        isMultiMonitorScreenCapturingSupported = true;
    }
    DetectRTC.isMultiMonitorScreenCapturingSupported = isMultiMonitorScreenCapturingSupported;

    DetectRTC.isPromisesSupported = !!('Promise' in window);

    // version is generated by "grunt"
    DetectRTC.version = '1.4.0';

    if (typeof DetectRTC === 'undefined') {
        window.DetectRTC = {};
    }

    var MediaStream = window.MediaStream;

    if (typeof MediaStream === 'undefined' && typeof webkitMediaStream !== 'undefined') {
        MediaStream = webkitMediaStream;
    }

    if (typeof MediaStream !== 'undefined' && typeof MediaStream === 'function') {
        DetectRTC.MediaStream = Object.keys(MediaStream.prototype);
    } else DetectRTC.MediaStream = false;

    if (typeof MediaStreamTrack !== 'undefined') {
        DetectRTC.MediaStreamTrack = Object.keys(MediaStreamTrack.prototype);
    } else DetectRTC.MediaStreamTrack = false;

    var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

    if (typeof RTCPeerConnection !== 'undefined') {
        DetectRTC.RTCPeerConnection = Object.keys(RTCPeerConnection.prototype);
    } else DetectRTC.RTCPeerConnection = false;

    window.DetectRTC = DetectRTC;

    {
        module.exports = DetectRTC;
    }
})();
});

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  return value === proto;
}

var _isPrototype = isPrototype;

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

var _overArg = overArg;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = _overArg(Object.keys, Object);

var _nativeKeys = nativeKeys;

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto$1.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!_isPrototype(object)) {
    return _nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

var _baseKeys = baseKeys;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

var _freeGlobal = freeGlobal;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = _freeGlobal || freeSelf || Function('return this')();

var _root = root;

/** Built-in value references. */
var Symbol = _root.Symbol;

var _Symbol = Symbol;

/** Used for built-in method references. */
var objectProto$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto$2.toString;

/** Built-in value references. */
var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty$1.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

var _getRawTag = getRawTag;

/** Used for built-in method references. */
var objectProto$3 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$3.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString$1.call(value);
}

var _objectToString = objectToString;

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag$1 && symToStringTag$1 in Object(value))
    ? _getRawTag(value)
    : _objectToString(value);
}

var _baseGetTag = baseGetTag;

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

var isObject_1 = isObject;

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject_1(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = _baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

var isFunction_1 = isFunction;

/** Used to detect overreaching core-js shims. */
var coreJsData = _root['__core-js_shared__'];

var _coreJsData = coreJsData;

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(_coreJsData && _coreJsData.keys && _coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

var _isMasked = isMasked;

/** Used for built-in method references. */
var funcProto = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

var _toSource = toSource;

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto$1 = Function.prototype,
    objectProto$4 = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$1 = funcProto$1.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$2 = objectProto$4.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString$1.call(hasOwnProperty$2).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject_1(value) || _isMasked(value)) {
    return false;
  }
  var pattern = isFunction_1(value) ? reIsNative : reIsHostCtor;
  return pattern.test(_toSource(value));
}

var _baseIsNative = baseIsNative;

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

var _getValue = getValue;

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = _getValue(object, key);
  return _baseIsNative(value) ? value : undefined;
}

var _getNative = getNative;

/* Built-in method references that are verified to be native. */
var DataView = _getNative(_root, 'DataView');

var _DataView = DataView;

/* Built-in method references that are verified to be native. */
var Map = _getNative(_root, 'Map');

var _Map = Map;

/* Built-in method references that are verified to be native. */
var Promise$1 = _getNative(_root, 'Promise');

var _Promise = Promise$1;

/* Built-in method references that are verified to be native. */
var Set = _getNative(_root, 'Set');

var _Set = Set;

/* Built-in method references that are verified to be native. */
var WeakMap = _getNative(_root, 'WeakMap');

var _WeakMap = WeakMap;

/** `Object#toString` result references. */
var mapTag = '[object Map]',
    objectTag = '[object Object]',
    promiseTag = '[object Promise]',
    setTag = '[object Set]',
    weakMapTag = '[object WeakMap]';

var dataViewTag = '[object DataView]';

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = _toSource(_DataView),
    mapCtorString = _toSource(_Map),
    promiseCtorString = _toSource(_Promise),
    setCtorString = _toSource(_Set),
    weakMapCtorString = _toSource(_WeakMap);

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = _baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if ((_DataView && getTag(new _DataView(new ArrayBuffer(1))) != dataViewTag) ||
    (_Map && getTag(new _Map) != mapTag) ||
    (_Promise && getTag(_Promise.resolve()) != promiseTag) ||
    (_Set && getTag(new _Set) != setTag) ||
    (_WeakMap && getTag(new _WeakMap) != weakMapTag)) {
  getTag = function(value) {
    var result = _baseGetTag(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? _toSource(Ctor) : '';

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag;
        case mapCtorString: return mapTag;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag;
        case weakMapCtorString: return weakMapTag;
      }
    }
    return result;
  };
}

var _getTag = getTag;

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

var isObjectLike_1 = isObjectLike;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike_1(value) && _baseGetTag(value) == argsTag;
}

var _baseIsArguments = baseIsArguments;

/** Used for built-in method references. */
var objectProto$5 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$3 = objectProto$5.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto$5.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = _baseIsArguments(function() { return arguments; }()) ? _baseIsArguments : function(value) {
  return isObjectLike_1(value) && hasOwnProperty$3.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

var isArguments_1 = isArguments;

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

var isArray_1 = isArray;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

var isLength_1 = isLength;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength_1(value.length) && !isFunction_1(value);
}

var isArrayLike_1 = isArrayLike;

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

var stubFalse_1 = stubFalse;

var isBuffer_1 = createCommonjsModule(function (module, exports) {
/** Detect free variable `exports`. */
var freeExports =  exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? _root.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse_1;

module.exports = isBuffer;
});

/** `Object#toString` result references. */
var argsTag$1 = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag$1 = '[object Function]',
    mapTag$1 = '[object Map]',
    numberTag = '[object Number]',
    objectTag$1 = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag$1 = '[object Set]',
    stringTag = '[object String]',
    weakMapTag$1 = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag$1 = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag$1] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag$1] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag$1] =
typedArrayTags[mapTag$1] = typedArrayTags[numberTag] =
typedArrayTags[objectTag$1] = typedArrayTags[regexpTag] =
typedArrayTags[setTag$1] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag$1] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike_1(value) &&
    isLength_1(value.length) && !!typedArrayTags[_baseGetTag(value)];
}

var _baseIsTypedArray = baseIsTypedArray;

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

var _baseUnary = baseUnary;

var _nodeUtil = createCommonjsModule(function (module, exports) {
/** Detect free variable `exports`. */
var freeExports =  exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && _freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    // Use `util.types` for Node.js 10+.
    var types = freeModule && freeModule.require && freeModule.require('util').types;

    if (types) {
      return types;
    }

    // Legacy `process.binding('util')` for Node.js < 10.
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

module.exports = nodeUtil;
});

/* Node.js helper references. */
var nodeIsTypedArray = _nodeUtil && _nodeUtil.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? _baseUnary(nodeIsTypedArray) : _baseIsTypedArray;

var isTypedArray_1 = isTypedArray;

/** `Object#toString` result references. */
var mapTag$2 = '[object Map]',
    setTag$2 = '[object Set]';

/** Used for built-in method references. */
var objectProto$6 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$4 = objectProto$6.hasOwnProperty;

/**
 * Checks if `value` is an empty object, collection, map, or set.
 *
 * Objects are considered empty if they have no own enumerable string keyed
 * properties.
 *
 * Array-like values such as `arguments` objects, arrays, buffers, strings, or
 * jQuery-like collections are considered empty if they have a `length` of `0`.
 * Similarly, maps and sets are considered empty if they have a `size` of `0`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is empty, else `false`.
 * @example
 *
 * _.isEmpty(null);
 * // => true
 *
 * _.isEmpty(true);
 * // => true
 *
 * _.isEmpty(1);
 * // => true
 *
 * _.isEmpty([1, 2, 3]);
 * // => false
 *
 * _.isEmpty({ 'a': 1 });
 * // => false
 */
function isEmpty(value) {
  if (value == null) {
    return true;
  }
  if (isArrayLike_1(value) &&
      (isArray_1(value) || typeof value == 'string' || typeof value.splice == 'function' ||
        isBuffer_1(value) || isTypedArray_1(value) || isArguments_1(value))) {
    return !value.length;
  }
  var tag = _getTag(value);
  if (tag == mapTag$2 || tag == setTag$2) {
    return !value.size;
  }
  if (_isPrototype(value)) {
    return !_baseKeys(value).length;
  }
  for (var key in value) {
    if (hasOwnProperty$4.call(value, key)) {
      return false;
    }
  }
  return true;
}

var isEmpty_1 = isEmpty;

function checkConstraintsPresence(itemConstraints) {
  const errors = [];
  Object.keys(itemConstraints).forEach((key) => {
    const value = itemConstraints[`${key}`];
    if (value.presence) {
      errors.push(`Item ${key} must be defined in array`);
    }
  });
  return isEmpty_1(errors) ? null : { errors }
}

validate.validators.array = (arrayItems, itemConstraints) => {
  let itemFlag = false;
  let objectFlag = false;
  if (!arrayItems || !arrayItems.length) {
    return checkConstraintsPresence(itemConstraints)
  }
  const arrayItemErrors = arrayItems.reduce((errors, item, index) => {
    if (typeof item !== 'object') {
      if (objectFlag) {
        errors[index] = { error: 'You cannot mix objects with strings or numbers in array validation ' };
        return errors
      }
      itemFlag = true;
      const tempKey = String(item);
      const validateObj = {};
      validateObj[`${tempKey}`] = item;
      const validatorObj = {};
      validatorObj[`${tempKey}`] = itemConstraints;
      const error = validate(validateObj,validatorObj);
      if (error) errors[index] = { error };
      return errors
    }
    if (itemFlag) {
      errors[index] = { error: 'You cannot mix objects with strings or numbers in array validation' };
      return errors
    }
    objectFlag = true;
    const error = validate(item, itemConstraints);
    if (error) errors[index] = { error };
    return errors
  }, {});
  return isEmpty_1(arrayItemErrors) ? null : { errors: arrayItemErrors }
};

validate.validators.function = (item) => {
  if (!(item instanceof Function)) {
    return 'Logger needs to be an instance of a function'
  }
  return null
};

function validateConfig(params) {
  const constraints = {
    publishers:{
      array:{
        userId:{
          presence:true,
          type:'number'
        },
        eventId:{
          presence:true,
          type:'number'
        },
        interpreterId:{
          presence: false,
          type: 'number'
        },
        language:{
          presence: false,
          type: 'string'
        },
        interpreterNeeded:{
          presence: false,
          type: 'boolean'
        }
      }
    },
    'auth.uid':{
      presence:true,
      type:'number'
    },
    'auth.channel':{
      presence:true,
      type: 'string'
    },
    'auth.appId':{
      presence:true,
      type: 'string'
    },
    'auth.token':{
      presence:true,
      type:'string'
    },
    userLanguage:{
      presence:false,
      type:'string'
    },
    userType:{
      presence:true,
      type:'string'
    },
    assetsUrl:{
      presence:true,
      type:'string'
    },
    wasmPath:{
      presence:true,
      type:'string'
    },
    asmPath:{
      presence:true,
      type:'string'
    },
    iosUseFallback:{
      presence:false,
      type:'boolean'
    }    
  };
  const notValid = validate(params, constraints);
  if (notValid) {
    throw new Error(JSON.stringify(notValid))
  }
}

/* eslint-disable no-undef */

// drawio docs
// @see https://app.diagrams.net/#G1UQNyRdkzAUjz2E-Zpri92_tpBDlE3eic

// Agora RTS Docs
// @see https://docs-preview.agoralab.co/en/Interactive%20Broadcast/web_in_app?platform=Web
// needs to be gloabally defined because it needs to be attached 
// to both AgoraRTC lib and the initialized client
let AgoraRTS;
let env;
// allow forcing the use of RTC Fallback from localStorage
const { forceRTCFallback, forceRTC } = localStorage;

if (forceRTC && forceRTCFallback) {
  console.warn('Both forceRTC and forceRTCFallback defined as true. ForceRTC is activated');
}

// some env will not defined process and throw an error needlesly
try {
  env = process.env.NODE_ENV;
  if (env === 'test') {
    console.warn('Initializing RTCBase in test env');
  }
}
catch (err) {
  // it's okay to fail
}

const idPrefix = 'stream-';

/**
 * @description CSS selectors have to start with a string or escaped
 * @param {number} id 
 */
function id2domId(id) {
  return `${idPrefix}${id}`
}

function fetchBlobAsUrl(url) {
  return fetch(url,{ mode: 'cors' })
    .then(response => response.blob())
    .then(response => URL.createObjectURL(response))
}
/**
 * @description expects a 
 */
function parsePublishers(publishers, uid) {
  const keys = Object.keys(publishers);
  const parsedPublishers = {};
  keys.forEach((key) => {
    const publisher = publishers[key];
    // remove self as floor host
    if (publisher.userId === uid && publisher.sourceLanguage) {
      return
    }
    // remove self as interpreter host
    if (publisher.interpreterId === uid) {
      return
    }
    const id = publisher.sourceLanguage ? publisher.userId : publisher.interpreterId;
    if (!id) {
      if (publisher.sourceLanguage) {
        return console.warn('Publisher without an id', publisher)
      }
      // no id on a !sourceLanguage situation just means an unassigned interpreter
      return
    }
    const { language } = publisher;
    if (!parsedPublishers[language]) {
      parsedPublishers[language] = [];
    }
    parsedPublishers[language].push(id2domId(id));
  });
  return parsedPublishers
}

class RTCBase {
  constructor(config) {
    const { stream = {} } = config || {};
    this.emitter = new EventEmitter();
    this.RTCSupport = {};
    this.logger = stream.logger;
    validateConfig(stream);
    this.baseConfig = this.extendConfig({ stream });
    this.browserSupport = { ...getBrowserInfo() }; // we are modifying the object later, make a copy
    this.clientInitialized = this.initializeBase();
    this.rtcOnlineFlag = true; // we assume we are online until proven otherwise
    this.firstConnection = true; // a flag to report first established connection
    this.waitForInitialConnection = true;
    setTimeout(() => {
      this.waitForInitialConnection = false;
      this.log('debug','Initial connection wait removed. Rtc will report connection status');
    }, 8000);
    this.log('debug','baseConfig', this.baseConfig);
  }


  log(level, ...messages) {
    if (this.logger && this.logger[`${level}`] instanceof Function) {
      this.logger[`${level}`](messages);
    }
  }
	
  getLogLevel() {
    if (this.logger && this.logger.getLogLevel instanceof Function) {
      return this.logger.getLogLevel()
    }
    return 'error'
  }
  // eslint-disable-next-line class-methods-use-this
  extendConfig({ stream }) {
    const { publishers, auth } = stream; 
    const parsedPublishers  = parsePublishers(publishers, auth.uid);
    const config = { ...stream };
    config.publishers = parsedPublishers;
    return config
  }

  /**
	 * @description check that we support current device for broadcasting
	 * @see https://docs.agora.io/en/faq/browser_support
	 */
  checkBroadcasterSupport() {
    if (!this.RTCSupport.microphone) {
      const message = 'We could not detect a microphone on your device';
      this.emitter.emit('support', { id:'broadcast:no-microphone', message });
      throw new Error(message)
    }
    // ios support
    if (this.browserSupport.isIos) {
      if (!this.browserSupport.version || this.browserSupport.version < 11) {
        const message = 'Ios version < 11 devices are not supported for broadcasting';
        this.emitter.emit('support', { id:'broadcast:ios-version-not-supported', message });
        throw new Error(message)
      }
    }
    // mac support
    if (this.browserSupport.isMac) {
      if (!this.browserSupport.version || this.browserSupport.version < 10) {
        const message = 'Macos versions below 10 are not supported for broadcasting';
        this.emitter.emit('support', { id:'broadcast:macos-version-not-supported', message });
        throw new Error(message)
      }
      if (this.browserSupport.isSafari) {
        const message = 'Safari is not recommended for broadcasting, please use Chrome or Firefox';
        this.emitter.emit('support', { id:'broadcast:safari-not-recommended', message });
      }
    }
    if (!this.RTCSupport.supported) {
      const message = 'This browser does not support webRTC, please try using chrome or firefox';
      this.emitter.emit('support', { id:'broadcast:rtc-not-supported', message });
      throw new Error(message)
    }
  }

  /**
  * @description check that we support current device for receiving
  * @see https://docs.agora.io/en/faq/browser_support
  */
  checkReceiverSupport() {
    // allow to force ios devices to user RTC fallback (AgoraRTS), this is usefull if we 
    // want to avoid autoPlay errors since AgoraRTS uses the web audio API and a canvas
    // element for the streams which is not autoplay blocked by the browser
    if (this.browserSupport.isIos && this.baseConfig.iosUseFallback) {
      this.RTCSupport.supported = false;
    }

    // ios
    if (this.browserSupport.isIos && (!this.browserSupport.version || this.browserSupport.version < 11)) {
      this.RTCSupport.supported = false;
    }

    // mac
    if (this.browserSupport.isMac && (!this.browserSupport.version || this.browserSupport.version < 10)) {
      this.RTCSupport.supported = false;
    }
  }

  checkRTCSupport() {
    return new Promise((resolve,reject) => {
      DetectRTC.load(() => {
        // modify global variable
        this.RTCSupport.webcam = DetectRTC.hasWebcam;
        this.RTCSupport.microphone = DetectRTC.hasMicrophone;
        this.RTCSupport.supported = DetectRTC.isWebRTCSupported;
        resolve();
      });
    })
  }

  async checkDeviceSupport() {
    // read streaming device information
    await this.checkRTCSupport();
    this.log('debug','Browser info', this.browserSupport);
    this.log('debug','Browser name', this.browserSupport.name);
    this.log('debug','Browser os', this.browserSupport.os);
    this.log('debug','Browser version', this.browserSupport.version);
    if (this.baseConfig.userType === 'audience') {
      return this.checkReceiverSupport()
    }
    else {
      return this.checkBroadcasterSupport()
    }
  }
  
  

  getAsmUrl() {
    return fetchBlobAsUrl(`${this.baseConfig.assetsUrl}${this.baseConfig.asmPath}`)
  }

  getWasmUrl() {
    return fetchBlobAsUrl(`${this.baseConfig.assetsUrl}${this.baseConfig.wasmPath}`)
  }

  async agoraImport() {
    // disabled temporarily
    if (env === 'test') {
      return import('./index-79f983c7.js')
    }	
    /**
     * @description agoras RTS fallback
     * @see https://docs-preview.agoralab.co/en/Interactive%20Broadcast/web_in_app?platform=Web
     */
    else if ((!this.RTCSupport.supported || forceRTCFallback) && !forceRTC) {
      console.warn('WebRTC is not supported, using fallback');
      AgoraRTS = (await import('./AgoraRTS-6851a72e.js')).default;
      const AgoraRTC = (await import('./AgoraRTC-2962e35f.js')).default;
      const asmUrl = await this.getAsmUrl();
      const wasmUrl = await this.getWasmUrl();
      // I hope we can load the libraries selectively. For now we import both
      // because there seems to be no clear way to do it
      await AgoraRTS.init(AgoraRTC, {
        asmDecoderPath: asmUrl,
        wasmDecoderPath: wasmUrl
      });
      return { default:AgoraRTC } 
    }
    else {
      return import('./AgoraRTCSDK.min-948af744.js')
    } 
  } 

  async initializeBase() {
    try {
      await this.checkDeviceSupport();
      // this works because of rollup commonjs config
      // if it stops working you can add that or just import() to window
      this.AgoraRTC = (await this.agoraImport()).default;
      this.setAgoraLogLevel(this.getLogLevel());
      this.createClient();
      this.initBaseListeners();
      await this.initClient();
      await this.setClientRole(this.baseConfig.userType);
      await this.joinChannel();
      this.log('debug','Running Agora SDK version', this.AgoraRTC.VERSION);
    }
    catch (err) {
      const error = rtcError(err,'initializeBase');
      this.emitter.emit('error',error);
    }
  }

  createClient() {
    this.client = this.AgoraRTC.createClient({ mode: 'live', codec: 'h264' });
    // in non-rtc mode we need to proxy connections
    if (AgoraRTS) {
      AgoraRTS.proxy(this.client);
    }
    return this.client
  }


  initClient() {
    return new Promise((resolve,reject) => {
      this.client.init(this.baseConfig.auth.appId, () => {
        resolve();
      }, (err) => {
        const error = rtcdError(err,'initClient');
        reject(error);
      });
    })
  }
  
  joinChannel() {
    return new Promise((resolve,reject) => {
      this.client.join(
        this.baseConfig.auth.token,
        this.baseConfig.auth.channel,
        parseInt(this.baseConfig.auth.uid,10),
        () => {
          resolve();
        }, (err) => {
          const error = rtcError(err,'joinChannel');
          reject(error);
        });
    })
  }


  /**
   * @description initializes AgoraRTC.client event listeners
   * @see https://docs.agora.io/en/Audio%20Broadcast/API%20Reference/web/interfaces/agorartc.client.html#on
   */
  initBaseListeners() {
    
    this.client.on('error', (err) => {
      const error = rtcError(err,'AgoraClient');
      this.emitter.emit('error', error);
    });
		
		
    // runs every second or so
    this.client.on('network-quality', (msg) => {
      this.log('insane',`Connection status ${JSON.stringify({ rtcOnline:this.rtcOnlineFlag, firstConnection:this.firstConnection })}`);
      const { downlinkNetworkQuality } = msg;
      // will be 0 or 1
      const online = parseInt(downlinkNetworkQuality,10);
      // report first connection to activate streaming
      if (this.firstConnection && online) {
        this.firstConnection = false;
        this.log('debug','RTC Connection active');
        const message = extendMessage(msg,'AgoraClient');
        return this.emitter.emit('connection-status', { id:'connection-active', message })
      }
      // wait for a couple of seconds for the connection to
      // be created before we report connection quality
      if (this.waitForInitialConnection) {
        return
      }
      if (!online) {
        // we don't need to keep reporting that we are still offline
        if (!this.rtcOnlineFlag) {
          return
        }
        this.rtcOnlineFlag = false;
        importanceDebounce('connection-offline','error',() => {
          this.log('debug','RTC-offline');
          const message = extendMessage(msg,'AgoraClient');
          this.emitter.emit('connection-status', { id:'connection-offline', message });
        });
      }
      else {
        // we don't need to keep reporting that we are still online
        if (this.rtcOnlineFlag) {
          return
        }
        this.rtcOnlineFlag = true;
        importanceDebounce('connection-online','resolved',() => {
          this.log('debug','RTC Online');
          const message = extendMessage(msg,'AgoraClient');
          this.emitter.emit('connection-status', { id:'connection-online', message });
        });
      }
    });
    this.client.on('stream-fallback', (msg) => {
      const message = extendMessage(msg,'AgoraClient');
      this.emitter.emit('warn', message);
    });
    this.client.on('exception', (msg) => {
      const message = extendMessage(msg,'AgoraClient');
      this.emitter.emit('warn', message);
    });
    this.client.on('network-type-changed', (msg) => {
      const message = extendMessage(msg,'AgoraClient');
      this.emitter.emit('warn', message);
    });
  }
  

  async setClientRole(role) {
    this.emitter.emit('new-client-role', role);
    this.baseConfig.userType = role;
    this.client.setClientRole(role);
  }

  
  async setAgoraLogLevel(level) {
    switch (level) {
      case 'error':
        this.AgoraRTC.Logger.setLogLevel(this.AgoraRTC.Logger.ERROR);
        break
      case 'info':
        this.AgoraRTC.Logger.setLogLevel(this.AgoraRTC.Logger.INFO);
        break
      case 'warning':
        this.AgoraRTC.Logger.setLogLevel(this.AgoraRTC.Logger.WARNING);
        break
      case 'debug':
        this.AgoraRTC.Logger.setLogLevel(this.AgoraRTC.Logger.DEBUG);   
        break
      case 'insane':
        this.AgoraRTC.Logger.setLogLevel(this.AgoraRTC.Logger.DEBUG);   
        break
      case 'off':
        this.AgoraRTC.Logger.setLogLevel(this.AgoraRTC.Logger.NONE);
        break
      default:
        this.AgoraRTC.Logger.setLogLevel(this.AgoraRTC.Logger.ERROR);
        break
    }
  }

  getPublisherLanguage(domId) {
    let streamLanguage;
    const languages = Object.keys(this.baseConfig.publishers);
    languages.forEach((language) => {
      const publishers = this.baseConfig.publishers[language];
      publishers.forEach((publisher) => {
        if (publisher === domId) {
          streamLanguage = language;
        }
      });
    });
    return streamLanguage
  }


  
  on(event,fn) {
    this.emitter.on(event,fn);
  }
}

function validateConfig$1(params) {
  const constraints = {
    subscribeToAudio:{
      presence:false,
      type:'boolean'
    },
    subscribeToVideo:{
      presence:false,
      type:'boolean'
    },
    container:{
      presence:true,
      type:'string'
    },
    onAutoPlayErrorForceFallback:{
      presence:false,
      type:'boolean'
    }
  };
  const notValid = validate(params, constraints);
  if (notValid) {
    throw new Error(JSON.stringify(notValid))
  }
}

const idPrefix$1 = 'stream-';

const defaultConsumerConfig = {
  subscribeToVideo:false,
  subscribeToAudio:true,
  connectedPublishers:{},
  languageState:{},
  outputVolume:90
};

function parsePayload(payload) {
  if (Array.isArray(payload)) {
    return payload
  }
  return [payload]
}

/**
 * @description CSS selectors have to start with a string or escaped
 * @param {number} id 
 */
function id2domId$1(id) {
  return `${idPrefix$1}${id}`
}

class RTCConsumer extends RTCBase {
  constructor(config) {
    const { stream = {} } = config || {};
    super({ stream });
    validateConfig$1(stream);
    this.consumerConfig = defaultConsumerConfig;
    this.consumerConfig.subscribeToAudio = typeof stream.subscribeToAudio === 'boolean' ? stream.subscribeToAudio : defaultConsumerConfig.subscribeToAudio;
    this.consumerConfig.subscribeToVideo = typeof stream.subscribeToVideo === 'boolean' ? stream.subscribeToVideo : defaultConsumerConfig.subscribeToVideo;
    this.consumerConfig.container = stream.container;
    this.consumerConfig.domContainer = document.querySelector(`#${this.consumerConfig.container}`);
    // iOS devices do not support choosing what to subscribe to
    this.consumerConfig.subscribeOptions = this.browserSupport.isIos ? null : {
      audio: this.consumerConfig.subscribeToAudio, 
      video: this.consumerConfig.subscribeToVideo
    }; 
    if (!this.consumerConfig.domContainer) {
      throw new Error(`Unable to detect stream container ${this.consumerConfig.container} on the DOM`)
    }
    this.initLanguageState();
    this.initConsumerListeners();
  }


  // ANCHOR Private Functions

  initLanguageState() {
    const languages = Object.keys(this.baseConfig.publishers);
    languages.forEach((language) => {
      this.consumerConfig.languageState[`${language}`] = { autoPlay:false, subscribe: false };
    });
    this.log('debug', 'Consumer LanguageSate init', this.consumerConfig.languageState);
  }

  async initConsumerListeners() {
    // await the agora client to be fully initialized
    await this.clientInitialized;

    // new remote stream added
    // will only fire on broadcaster publish, NOT on connect
    this.client.on('stream-added', (evt) => {
      this.handleStreamAdded(evt);
    });
    
    // remote stream has left
    this.client.on('stream-removed', (evt) => {
      this.handleStreamRemoved(evt);
    });

    // remote stream has changed to audience mode
    this.client.on('peer-leave', (evt) => {
      this.handlePeerLeave(evt);
    });

    this.client.on('stream-subscribed', (evt) => {
      this.handleStreamSubscribed(evt);
    });

    this.client.on('stream-updated',(evt) => {
    });
  }

  handleStreamAdded(evt) {
    if (!evt) {
      return this.log('warn','Received stream-added without event')
    }
    if (!evt.stream) {
      return this.log('warn','Received stream-added without stream', evt)
    }
    const { stream } = evt;
    const hasAudio = stream.hasAudio();
    const hasVideo = stream.hasVideo();
    const id = stream.getId();
    this.log('debug',`stream-added with id ${id}`);
    // we don't want to subscribe to our own stream
    if (id === this.baseConfig.auth.uid) {
      return
    }
    const domId = id2domId$1(id);
    // add remote to a list of available streams
    const language = this.getPublisherLanguage(domId);
    if (!language) {
      return this.log('debug', `Publisher with id ${id} without language, not subscribing`)
    }
    // add publisher if not added yet
    if (!this.consumerConfig.connectedPublishers[`${domId}`]) {
      this.consumerConfig.connectedPublishers[`${domId}`]  = {};
    }
    // update publisher details
    const publisher = this.consumerConfig.connectedPublishers[`${domId}`]; 
    publisher.subscribed = false;
    publisher.subscribeError = false;
    publisher.language = language;
    publisher.stream = stream;
    publisher.domId = domId;
    publisher.hasAudio = hasAudio;
    publisher.hasVideo = hasVideo;
    // if this language is set to be subscribed, subscribe to it automatically
    if (this.consumerConfig.languageState[`${language}`].subscribe) {
      this.subscribeStreamsById(domId);
    }
  }
  

  handleStreamRemoved(evt) {
    if (!evt) {
      return this.log('warn','Received stream-removed without event')
    }
    if (!evt.stream) {
      return this.log('warn','Received stream-removed without stream', evt)
    }
    const remoteStream = evt.stream;
    const id = remoteStream.getId();
    const domId = id2domId$1(id);
    this.log('debug',`stream-removed with id ${id}`);
    this.unsubscribeStreamsById(domId);
    this.emitter.emit('consumer:stream-removed', domId );
  }

  handlePeerLeave(evt) {
    if (!evt) {
      return this.log('warn','Received peer-leave without event')
    }
    if (!evt.stream) {
      return this.log('warn','Received peer-leave without stream', evt)
    }
    const remoteStream = evt.stream;
    const id = remoteStream.getId();
    const domId = id2domId$1(id);
    this.log('debug',`peer-left with id ${id}`);
    this.emitter.emit('consumer:peer-leave', domId);
  }

  handleStreamSubscribed(evt) {
    if (!evt) {
      return this.log('warn','Received stream-subscribed without event')
    }
    if (!evt.stream) {
      return this.log('warn','Received stream-subscribed without stream', evt)
    }
    const id = evt.stream.getId();
    const domId = id2domId$1(id);
    const publisher = this.consumerConfig.connectedPublishers[`${domId}`];
    publisher.subscribed = true;
    this.handleAutoPlayback({ language:publisher.language, domId:publisher.domId });
    this.log('debug','Subscribed to stream', id);
    this.emitter.emit('consumer:stream-subscribed', domId);
  }
   
  handleAutoPlayback({ language, domId }) {
    const languageState = this.consumerConfig.languageState[`${language}`];
    if (!languageState.autoPlay) {
      return this.log('debug', `Autoplay not active for language ${language}, returning without playback`)
    }
    // for iOS devices (unless they are using AgoraRTS) and for other devices that don't allow autoPlay
    // we need to wait to have subscribed to all publishers for language before we can autoplay
    // this way we need to only manually press play once if the autoplay fails
    if ((this.browserSupport.isIos && this.RTCSupport.supported) || this.consumerConfig.autoPlayError) {
      const { connectedPublishers } = this.consumerConfig;
      const publishers = Object.keys(connectedPublishers);
      // if a publisher is in an error state we don't calculate that in the autoPlay filtering
      const availableLanguagePublishers = publishers.filter(publisherInstance => connectedPublishers[`${publisherInstance}`].language === language && !connectedPublishers[`${publisherInstance}`].subscribeError);
      const subscribed = availableLanguagePublishers.filter(publisherInstance => connectedPublishers[`${publisherInstance}`].subscribed);
      if (subscribed.length === availableLanguagePublishers.length) {
        this.playLanguage(language);
      }
      else {
        return this.log('debug', 'Autoplay not tried for device because not all connectedpublishers are subscribed yet subscribed:', subscribed, ' available publishers:', availableLanguagePublishers)
      }
    }
    // otherwise we just play directly
    else {
      this.playStreamsById(domId);
    }
    this.emitter.emit('consumer:autoplay',{ language, domId });
  }

  getConnectedPublishersPerLanguage(language) {
    const { connectedPublishers } = this.consumerConfig;
    return Object.keys(connectedPublishers).filter(domId => connectedPublishers[`${domId}`].language === language)
  }
  

  removeStreamElement(domId) {
    // do not remove what is not there
    if (!document.querySelector(`#${domId}`)) {
      return domId
    }
    this.log('debug',`Removing stream element with id #${domId}`);
    const element = document.querySelector(`#${domId}`);
    // element.style.display = 'none'
    this.consumerConfig.domContainer.removeChild(element);
  }

  appendStreamElement(domId) {
    // do not add an existing element
    if (document.querySelector(`#${domId}`)) {
      return domId
    }
    this.log('debug',`Adding new stream element with id #${domId}`);
    const div = document.createElement('div');
    div.id = domId;
    div.style.display = 'none';
    this.consumerConfig.domContainer.appendChild(div);
    return domId
  }

  // ANCHOR Public functions
	
  
  setOutputVolume(volume) {
    const domIds = Object.keys(this.consumerConfig.connectedPublishers);
    this.consumerConfig.outputVolume = volume;
    domIds.forEach((domId) => {
      const { stream } = this.consumerConfig.connectedPublishers[`${domId}`];
      if (stream && stream.isPlaying()) {
        stream.setAudioVolume(volume);
      }
    });
  }

  /**
	 * @description get audio output volume
   * @returns {number}
	 */
  getOutputVolume() {
    return this.consumerConfig.outputVolume
  }


  playStreamsById(domIds) {
    if (!domIds || !domIds.length) {
      return this.log('debug','playStreamsById: no domIds to play')
    }
    this.log('debug','playStreamsById: playing streams', domIds);
    const parsed = parsePayload(domIds);
    parsed.forEach(async(domId) => {
      try {
        const publisher = this.consumerConfig.connectedPublishers[`${domId}`];
        // check if we have a remote stream available
        if (!publisher || !publisher.stream) {
          return this.log('debug',`playStreamsById: Unable to play ${domId}, no remote available`)
        }
        if (!publisher.subscribed) {
          return this.log('debug',`playStreamsById: Unable to play ${domId}, not subscribed`)
        }
        const { stream } = publisher;
        stream.setAudioVolume(this.consumerConfig.outputVolume);
        if (stream.isPlaying()) {
          this.log('debug', 'listenStream: Stream is already playing, trying to resume');
          await stream.resume();
          return this.emitter.emit('consumer:playing-id', { domId })
        }
        stream.play(`${domId}`,{ fit:'contain' }, async(err) => {
          // @see https://docs.agora.io/en/Audio%20Broadcast/API%20Reference/web/interfaces/agorartc.streamplayerror.html
          if (!err) {
            return this.emitter.emit('consumer:playing-id', { domId })
          }
          // @see https://docs.agora.io/en/Interactive%20Broadcast/autoplay_policy_web?platform=Web
          if (err.status && err.status !== 'aborted') {
            this.emitter.emit('consumer:stream-stuck', { domId, language:publisher.language });
            this.consumerConfig.autoPlayError = true;
            // in some cases we want to forgo reporting stream stuck and rather ensure that no
            // autoplay errors happen, in this case we can for the user to use AgoraRTS 
            // for which autoplay policies are not as strict
            if (this.consumerConfig.onAutoPlayErrorForceFallback) {
              localStorage.forceRTCFallback = true;
              setTimeout(() => {
                window.location.reload();
              },1000);
            }
            return
          }
          try {
            // sometimes play method fails but we can fix this with a resume
            // TODO: Report to Agora 
            // it is for now possible that even when the audio starts playing for
            // this method to just never resolve the promise then throwing an error
            // when we stop the stream
            await stream.resume();
            this.emitter.emit('consumer:playing-id', { domId });
          }
          catch (error) {
            this.emitter.emit('error', rtcError(err,'playStreamsById:play'));
          }
        });
      } 
      catch (err) {
        const error = rtcError(err,'playStreamsById');
        this.emitter.emit('error',error);
      }    
    });
  }


  stopStreamsById(domIds) {
    if (!domIds || !domIds.length) {
      return this.log('debug','stopStreamsById: no domIds to stop')
    }
    this.log('debug','Stopping streams', domIds);
    const parsed = parsePayload(domIds);
    parsed.forEach((domId) => {
      try {
        const { stream } = this.consumerConfig.connectedPublishers[`${domId}`] || {};
        if (stream && stream.isPlaying()) {
          stream.stop();
        }
        this.emitter.emit('consumer:stopped-id', domId);
      }
      catch (err) {
        const error = rtcError(err,'stopStreamsById');
        this.emitter.emit('error',error);
      }
    });
  }


  unsubscribeStreamsById(domIds) {
    if (!domIds || !domIds.length) {
      return this.log('warn','unsubscribeStreamsById: No domIds defined on function call, returning')
    }
    this.log('debug','unsubscribeStreamsById: Unsubscribing streams: ', domIds);
    const parsed = parsePayload(domIds);
    parsed.forEach((domId) => {
      this.stopStreamsById(domId);
      this.removeStreamElement(domId);
      const { stream } = this.consumerConfig.connectedPublishers[`${domId}`] || {};
      if (stream) {
        this.log('debug',`Unsubscribing stream ${domId}`);
        this.emitter.emit('consumer:unsubscribed-id', { domId });
        this.consumerConfig.connectedPublishers[`${domId}`].subscribed = false;
        this.client.unsubscribe(stream,(err) => {
          if (err) {
            // we are trying to unsubscribe a stream that doesn't exist, not harmful
            if (err === 'NO_SUCH_REMOTE_STREAM') {
              return
            }
            const error = rtcError(err,'unsubscribeStreamsById');
            this.emitter.emit('error',error);
          }
        });
      }
    });
  }


  subscribeStreamsById(domIds) {
    if (!domIds || !domIds.length) {
      return this.log('debug','Not able to subscribe streams, no domIds provided')
    }
    const parsed = parsePayload(domIds);
    parsed.forEach((domId) => {
      const publisher = this.consumerConfig.connectedPublishers[`${domId}`];
      const languageState = this.consumerConfig.languageState[`${publisher.language}`];
      if (!languageState.subscribe) {
        return this.log('debug', `Not subscribing to ${domId}, language is not being subscribed`)
      }
      if (!publisher || !publisher.stream) {
        return this.log('debug', `No publisher or stream not defined for ${domId}, not subscribing`)
      }
      this.appendStreamElement(domId);
      this.log('debug',`Subscribing to stream ${domId} with options`, this.consumerConfig.subscribeOptions);     
      // assume that there is no subscribe error first, otherwise we might end up in a 
      // unpredictable situation (does the callback run before or after the next line?)
      publisher.subscribeError = false;
      publisher.subscribed = true;
      const { hasAudio, hasVideo } = publisher;
      this.emitter.emit('consumer:subscribed-id', { domId, hasAudio, hasVideo });
      this.client.subscribe(publisher.stream, 
        this.consumerConfig.subscribeOptions,
        (err) => {
          if (err) {
            publisher.subscribeError = true;
            publisher.subscribed = false;
            // if one subscription fails we might want to autoplay the language anyway
            this.handleAutoPlayback({ language:publisher.language, domId:publisher.domId });
            // remove stream element on fail
            this.removeStreamElement(domId);
            this.emitter.emit('consumer:unsubscribed-id', { domId });
            const error = rtcError(err,'subscribeStreamsById');
            this.emitter.emit('error',error);
          }
        });
    });
  }


  subscribeToLanguage({ language, autoPlay = true }) {
    const publishers = this.getConnectedPublishersPerLanguage(language);
    const languageState = this.consumerConfig.languageState[`${language}`];
    if (!languageState) {
      return this.log('warn', `trying to subscribe an invalid language: ${language}`)
    }
    languageState.subscribe = true;
    // when the 'stream-subscribed' event fires wheter or not we will try to autoPlay
    languageState.autoPlay = autoPlay;
    this.log('debug',`languageState after subscribing to language ${language}`, this.consumerConfig.languageState);
    this.emitter.emit('consumer:subscribed-language',{ language, publishers });
    if (!publishers || !publishers.length) {
      return this.log('debug', `no publishers available to subscribe for language ${language}`)
    }
    this.subscribeStreamsById(publishers);
  }
  

  unsubscribeFromLanguage(language) {
    const publishers = this.getConnectedPublishersPerLanguage(language);
    // make sure that we don't autoplay languages we are about to unsubscribe, could happen
    // in a quick language switch scenario
    this.consumerConfig.languageState[`${language}`] = { autoPlay:false, subscribe: false };
    this.emitter.emit('consumer:unsubscribed-language',{ language, publishers });
    if (!publishers || !publishers.length) {
      return this.log('debug', `no publishers available to unsubscribe for language ${language}`)
    }
    this.unsubscribeStreamsById(publishers);
  }

  unsubscribeFromOtherLanguages(language) {
    const otherLanguages = Object.keys(this.consumerConfig.languageState).filter(key => key !== language);
    if (!otherLanguages) {
      return this.log('debug', `unsubscribeFromOtherLanguages: no other languages available to unsubscribe from. Filtering with ${language}`)
    }
    this.log('debug', `unsubscribeFromOtherLanguages: Keeping ${language} Unsubcsribing other languages: `, otherLanguages);
    otherLanguages.forEach((unsubsLanguage) => {
      this.unsubscribeFromLanguage(unsubsLanguage); });
  }
  
  playLanguage(language) {
    const publishers = this.getConnectedPublishersPerLanguage(language);
    const languageState = this.consumerConfig.languageState[`${language}`];
    if (!languageState) {
      return this.log('warn', `trying to play an invalid language: ${language}`)
    }
    languageState.autoPlay = true;
    this.log('debug', `playLanguage: playing language ${language}`);
    this.emitter.emit('consumer:playing-language',{ language });
    if (!publishers || !publishers.length) {
      return this.log('debug', `no publishers available to play for language ${language}`)
    }
    this.playStreamsById(publishers);
  }
  
  stopLanguage(language) {
    const publishers = this.getConnectedPublishersPerLanguage(language);
    const languageState = this.consumerConfig.languageState[`${language}`];
    if (!languageState) {
      return this.log('warn', `trying to stop an invalid language: ${language}`)
    }
    languageState.autoPlay = false;
    this.log('debug', `stopLanguage: stopping language ${language}`);
    this.emitter.emit('consumer:stopped-language',{ language });
    if (!publishers || !publishers.length) {
      return this.log('debug', `no publishers available to stop for language ${language}`)
    }
    this.stopStreamsById(publishers);
  }
  
}

// Note for future features

// this._client.on("onTokenPrivilegeWillExpire", function () {
//   // After requesting a new token
//   // this._client.renewToken(token);
//   _common__WEBPACK_IMPORTED_MODULE_1__[/* Toast */ "a"].info("onTokenPrivilegeWillExpire");
//   console.log("onTokenPrivilegeWillExpire");
// });

// this._client.on("onTokenPrivilegeDidExpire", function () {
//   // After requesting a new token
//   // client.renewToken(token);
//   _common__WEBPACK_IMPORTED_MODULE_1__[/* Toast */ "a"].info("onTokenPrivilegeDidExpire");
//   console.log("onTokenPrivilegeDidExpire");
// });


// We could react to a remote mute, but for now there seems to be no need. Here as a note
// this.client.on('unmute-audio', (evt) => {
// const remoteStream = evt.stream
// console.warn('Remote stream unmute', evt)
// if (!remoteStream) {
//   return logger.warn('Received unmute-audio without stream', evt)
// }
// const id = remoteStream.getId()
// logger.debug(`stream-unmuted with id ${id}`)
// // we don't want to subscribe to our own stream      
// if (id === this.baseConfig.auth.uid) {
//   return
// }
// const domId = id2domId(id)
// // don't subscribe if we already have subsribed
// if (this.consumerConfig.connectedPublishers[`${domId}`]) {
//   return
// }
// this.consumerConfig.connectedPublishers[`${domId}`] = { stream:remoteStream }
// this.emitter.emit('new-stream', domId)
// })

// this.client.on('mute-audio', (evt) => {
//   const remoteStream = evt.stream
//   if (remoteStream) {
//     const id = remoteStream.getId()
//     const domId = id2domId(id)
//     this.stopStreamsById(domId)
//     this.unsubscribeStreamsById(domId)
//     this.emitter.emit('consumer:stream-removed', domId )
//   }
// })

export { DetectRTC as D, EventEmitter as E, RTCConsumer as R, rtcError as r };
