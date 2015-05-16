var lib = require('./lib');
var stepFunction = lib.stepFunction;
var getLogger = lib.getLogger;

var step1 = stepFunction(1, null, 1);
var step2 = stepFunction(2, null, 1);
var step3 = stepFunction(3, null, 1);
var returnError = stepFunction(null, new Error('returnError'));

var getPromise1 = Promise.wrap(step1);
var getPromise2 = Promise.wrap(step2);
var getPromise3 = Promise.wrap(step3);
var getErrorPromise = Promise.wrap(returnError);

var cbGateLog = getLogger('cb-gate');
var cbGateErrorLog = getLogger('cb-gate', true);
var val1, val2, v, e;
function cbGateFinal(err) {
    //console.log('cbGateFinal called,', val1, val2);
    if (e) {
        // ignore
        return;
    }
    if (err) {
        e = err;
        return cbGateErrorLog(err);
    }
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
        return cbGateFinal(e);
    }
    val1 = _val1;
    cbGateLog(val1);
    cbGateFinal();
});
step2(function(err2, _val2) {
    if (err2) {
        return cbGateFinal(e);
    }
    val2 = _val2;
    cbGateLog(val2);
    cbGateFinal();
});
returnError(function(e, _v) {
    if (e) {
        return cbGateFinal(e);
    }
    v = _v;
    cbGateLog(v);
    cbGateFinal();
});

var cbLatchLog = getLogger('cb-latch');
var cbLatchErrorLog = getLogger('cb-latch', true);
var latch_engaged = true;
function cbLatchFinal(err, val) {
    //console.log('cbLatchFinal called,', latch_engaged);
    if (err) {
        latch_engaged = false;
        return cbLatchErrorLog(err);
    }
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
        return cbLatchFinal(err1);
    }
    cbLatchLog(val1);
    cbLatchFinal(err1, val1);
});
step2(function(err2, _val2) {
    if (err2) {
        return cbLatchFinal(err2);
    }
    cbLatchLog(val2);
    cbLatchFinal(err2, val2);
});
returnError(function(e, _v) {
    if (e) {
        return cbLatchFinal(e);
    }
    cbLatchLog(v);
    cbLatchFinal(e, _v);
});



var promiseGateLog = getLogger('Promise-gate');
var promiseGateErrorLog = getLogger('Promise-gate', true);
Promise.all([getPromise1(), getPromise2(), getErrorPromise()])
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
Promise.race([getPromise1(), getPromise2(), getErrorPromise()])
  .then(function(val) {
    promiseLatchLog(val, 'wins');
    return getPromise3();
  }, promiseLatchErrorLog)
  .then(function(val3) {
    promiseLatchLog(val3);
  }, promiseLatchErrorLog)
  .catch(promiseLatchErrorLog);



var ASQ = require('asynquence');
require('asynquence-contrib');
var getWrapper = function(log, errorLog) {
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
var gateWrap = getWrapper(asqGateLog, asqGateErrorLog);
ASQ().gate(gateWrap(step1), gateWrap(step2), gateWrap(returnError))
.val(function() {
    var args = Array.prototype.slice.call(arguments);
    asqGateLog(args);
})
.then(gateWrap(step3))
.or(asqGateErrorLog);

var asqLatchLog = getLogger('ASQ-latch');
var asqLatchErrorLog = getLogger('ASQ-latch', true);
var latchWrap = getWrapper(asqLatchLog, asqLatchErrorLog);
ASQ().first(latchWrap(step1), latchWrap(step2), latchWrap(returnError))
.val(function(val) { asqLatchLog(val, 'wins'); })
.then(latchWrap(step3))
.or(asqLatchErrorLog);



var genGateLog = getLogger('gen-gate');
var genGateErrorLog = getLogger('gen-gate', true);
function *gate() {
    try {
        genGateLog(yield Promise.all([getPromise1(), getPromise2(), getErrorPromise()]));
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
        genLatchLog(yield Promise.race([getPromise1(), getPromise2()], getErrorPromise()), 'wins');
        genLatchLog(yield getPromise3());
    }
    catch(err) {
        genLatchErrorLog(err);
    }
}
lib.runGen(latch);