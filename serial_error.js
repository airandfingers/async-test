var lib = require('./lib');
var stepFunction = lib.stepFunction;
var getLogger = lib.getLogger;

var step1 = stepFunction(1);
var step2 = stepFunction(2);
var step3 = stepFunction(3);
var returnError = stepFunction(null, new Error('returnError'));

var getPromise1 = Promise.wrap(step1);
var getPromise2 = Promise.wrap(step2);
var getPromise3 = Promise.wrap(step3);
var getErrorPromise = Promise.wrap(returnError);

var cbLog = getLogger('cb');
var cbErrorLog = getLogger('cb', true);
step1(function(err1, val1) {
    if (err1) {
        return cbErrorLog(err1);
    }
    cbLog(val1);
    step2(function(err2, val2) {
        if (err2) {
            return cbErrorLog(err2);
        }
        cbLog(val2);
        returnError(function(err, val) {
            if (err) {
                return cbErrorLog(err);
            }
            cbLog(val);
            step3(function(err3, val3) {
                if (err3) {
                    return cbErrorLog(err1);
                }
                cbLog(val3);
            });
        });
    });
});

var promiseLog = getLogger('Promise');
var promiseErrorLog = getLogger('Promise', true);

getPromise1()
  .then(function(val1) {
    promiseLog(val1);
    return getPromise2();
  }, promiseErrorLog)
  .then(function(val2) {
    promiseLog(val2);
    return getErrorPromise();
  }, promiseErrorLog)
  .then(function(val) {
    promiseLog(val);
    return getPromise3();
  }, promiseErrorLog)
  .then(function(val3) {
    promiseLog(val3);
  }, promiseErrorLog)
  .catch(promiseErrorLog);

var asqLog = getLogger('ASQ');
var asqErrorLog = getLogger('ASQ', true);
var ASQ = require('asynquence');

var wrap = function(fn) {
    return function(done) {
        fn(function(err, val) {
            if (err) {
                asqErrorLog(err);
                return done.fail(err);
            }
            asqLog(val);
            done(val);
        });
    };
};

ASQ(wrap(step1), wrap(step2), wrap(returnError), wrap(step3));

var genLog = getLogger('gen');
var genErrorLog = getLogger('gen', true);
function *series() {
    try {
        genLog(yield getPromise1());
        genLog(yield getPromise2());
        genLog(yield getErrorPromise());
        genLog(yield getPromise3());
    }
    catch(err) {
        genErrorLog(err);
    }
}

lib.runGen(series);