var getLogger = function(namespace, error) {
    var args;
    return function() {
        args = Array.prototype.slice.call(arguments);
        if (error) {
            args.unshift('(ERR)');
            console.trace();
        }
        args.unshift(namespace + ':');
        console.log.apply(console, args);
    };
};

var stepFunction = function(step_num, error, extra_delay) {
    var delay = extra_delay ? 1000 + extra_delay : 1000;
    return function(cb) {
        if (error) {
            setTimeout(function() {
                cb(error);
            }, delay);
        }
        else {
            setTimeout(function() {
                cb(null, step_num);
            }, delay);
        }
    };
};

// BEGIN stuff copied from  YDKJS: Async & Performance
// polyfill-safe guard check
if (!Promise.wrap) {
    Promise.wrap = function(fn) {
        return function() {
            var args = [].slice.call( arguments );

            return new Promise( function(resolve,reject){
                fn.apply(
                    null,
                    args.concat( function(err,v){
                        if (err) {
                            reject( err );
                        }
                        else {
                            resolve( v );
                        }
                    } )
                );
            } );
        };
    };
}

function run(gen) {
    var args = [].slice.call( arguments, 1), it;

    // initialize the generator in the current context
    it = gen.apply( this, args );

    // return a promise for the generator completing
    return Promise.resolve()
        .then( function handleNext(value){
            // run to the next yielded value
            var next = it.next( value );

            return (function handleResult(next){
                // generator has completed running?
                if (next.done) {
                    return next.value;
                }
                // otherwise keep going
                else {
                    return Promise.resolve( next.value )
                        .then(
                            // resume the async loop on
                            // success, sending the resolved
                            // value back into the generator
                            handleNext,

                            // if `value` is a rejected
                            // promise, propagate error back
                            // into the generator for its own
                            // error handling
                            function handleErr(err) {
                                return Promise.resolve(
                                    it.throw( err )
                                )
                                .then( handleResult );
                            }
                        );
                }
            })(next);
        } );
}
// END stuff copied from YDKJS: Async & Performance

module.exports = {
    getLogger: getLogger,
    stepFunction: stepFunction,
    runGen: run
};