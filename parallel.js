var lib = require('./lib');
var stepFunction = lib.stepFunction;
var getLogger = lib.getLogger;

var step1 = stepFunction(1);
var step2 = stepFunction(2);
var step3 = stepFunction(3);

var getPromise1 = Promise.wrap(step1);
var getPromise2 = Promise.wrap(step2);
var getPromise3 = Promise.wrap(step3);

var cbGateLog = getLogger('cb-gate');
var cbGateErrorLog = getLogger('cb-gate', true);
var val1, val2;
function cbGateFinal() {
    //console.log('cbGateFinal called,', val1, val2);
    if (val1 && val2) {
        cbGateLog([val1, val2]);
        step3(function(err3, val3) {
            if (err3) {
                return cbGateErrorLog(err1);
            }
            cbGateLog(val3);
        });
    }
}
step1(function(err1, _val1) {
    if (err1) {
        return cbGateErrorLog(err1);
    }
    val1 = _val1;
    cbGateLog(val1);
    cbGateFinal();
});
step2(function(err2, _val2) {
    if (err2) {
        return cbGateErrorLog(err1);
    }
    val2 = _val2;
    cbGateLog(val2);
    cbGateFinal();
});

var cbLatchLog = getLogger('cb-latch');
var cbLatchErrorLog = getLogger('cb-latch', true);
var latch_engaged = true;
function cbLatchFinal(val) {
    //console.log('cbLatchFinal called,', latch_engaged);
    if (latch_engaged) {
        latch_engaged = false;
        cbLatchLog(val, 'wins');
        step3(function(err3, val3) {
            if (err3) {
                return cbLatchErrorLog(err1);
            }
            cbLatchLog(val3);
        });
    }
}
step1(function(err1, _val1) {
    if (err1) {
        return cbLatchErrorLog(err1);
    }
    val1 = _val1;
    cbLatchLog(val1);
    cbLatchFinal(val1);
});
step2(function(err2, _val2) {
    if (err2) {
        return cbLatchErrorLog(err1);
    }
    val2 = _val2;
    cbLatchLog(val2);
    cbLatchFinal(val2);
});



var async = require('async');

var asyncGateLog = getLogger('async-gate');
var asyncGateErrorLog = getLogger('async-gate', true);
// wrapper that logs success callback data
var asyncGateWrap = function(fn) {
    return function(done) {
        fn(function(err, val) {
            if (val) {
                asyncGateLog(val);
            }
            done(err, val);
        });
    }
};
async.parallel([asyncGateWrap(step1), asyncGateWrap(step2)], function(err) {
    if (err) {
        return asyncGateErrorLog(err);
    }
    step3(function(err3, val3) {
        if (err3) {
            return asyncGateErrorLog(err1);
        }
        asyncGateLog(val3);
    });
});

var asyncLatchLog = getLogger('async-latch');
var asyncLatchErrorLog = getLogger('async-latch', true);
// wrapper that logs callback data and returns true (required by async.some)
var asyncLatchWrap = function(fn) {
    return function(done) {
        fn(function(err, val) {
            if (val) {
                asyncLatchLog(val);
            }
            else {
                asyncLatchErrorLog(err);
            }
            done(true);
        });
    }
};
async.parallel([asyncLatchWrap(step1), asyncLatchWrap(step2)], function() {
    asyncLatchLog('? wins');
    step3(function(err3, val3) {
        if (err3) {
            return asyncLatchErrorLog(err1);
        }
        asyncLatchLog(val3);
    });
});



var ASQ = require('asynquence');
require('asynquence-contrib');
var getAsqWrapper = function(log, errorLog) {
    // wrapper function
    return function(fn) {
        //wrapped function
        return function(done) {
            fn(function(err, val) {
                if (err) {
                    errorLog(err);
                    return done.fail(err);
                }
                log(val);
                done(val);
            });
        };
    };
};

var asqGateLog = getLogger('ASQ-gate');
var asqGateErrorLog = getLogger('ASQ-gate', true);
var asqGateWrap = getAsqWrapper(asqGateLog, asqGateErrorLog);
ASQ().gate(asqGateWrap(step1), asqGateWrap(step2))
.val(function() {
    var args = Array.prototype.slice.call(arguments);
    asqGateLog(args);
})
.or(asqGateErrorLog)
.then(asqGateWrap(step3));

var asqLatchLog = getLogger('ASQ-latch');
var asqLatchErrorLog = getLogger('ASQ-latch', true);
var latchWrap = getAsqWrapper(asqLatchLog, asqLatchErrorLog);
ASQ().first(latchWrap(step1), latchWrap(step2))
.val(function(val) { asqLatchLog(val, 'wins'); })
.or(asqLatchErrorLog)
.then(latchWrap(step3));



var promiseGateLog = getLogger('Promise-gate');
var promiseGateErrorLog = getLogger('Promise-gate', true);
Promise.all([getPromise1(), getPromise2()])
  .then(function(vals) {
    promiseGateLog(vals);
    return getPromise3();
  }, promiseGateErrorLog)
  .then(function(val3) {
    promiseGateLog(val3);
  }, promiseGateErrorLog)
  .catch(promiseGateErrorLog);

var promiseLatchLog = getLogger('Promise-latch');
var promiseLatchErrorLog = getLogger('Promise-latch', true);
Promise.race([getPromise1(), getPromise2()])
  .then(function(val) {
    promiseLatchLog(val, 'wins');
    return getPromise3();
  }, promiseLatchErrorLog)
  .then(function(val3) {
    promiseLatchLog(val3);
  }, promiseLatchErrorLog)
  .catch(promiseLatchErrorLog);



var genGateLog = getLogger('gen-gate');
var genGateErrorLog = getLogger('gen-gate', true);
function *gate() {
    try {
        genGateLog(yield Promise.all([getPromise1(), getPromise2()]));
        genGateLog(yield getPromise3());
    }
    catch(err) {
        genGateErrorLog(err);
    }
}
lib.runGen(gate);

var genLatchLog = getLogger('gen-latch');
var genLatchErrorLog = getLogger('gen-latch', true);
function *latch() {
    try {
        genLatchLog(yield Promise.race([getPromise1(), getPromise2()]), 'wins');
        genLatchLog(yield getPromise3());
    }
    catch(err) {
        genLatchErrorLog(err);
    }
}
lib.runGen(latch);