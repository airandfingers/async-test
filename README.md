# async-test: experiments with async flow

This repo is for me to learn and experiment with async flow techniques as solutions to normal async flow problems.
I currently use callbacks and the [async](https://github.com/caolan/async) library.
I recently read Kyle Simpson's [You Don't Know JS: Async & Performance](https://github.com/getify/You-Dont-Know-JS/tree/master/async%20%26%20performance), and this repo contains utilities copied from there.

## real-world async flows to implement:
- parallel db queries, then check
- parallel db queries, then waterfall worker call (1 callback) + db queries or waterfall db queries
- series worker call (n callbacks) and db queries and/or /notify_csr_sync
- series db queries
- parallel db queries, then series db queries (could collide with previous)
- series of db queries, with logical sub-series
- series db query, then n parallel db queries for n results
- composition of above flows

## functions used:
- [x] async (1 second + extra delay) error-first callback
- [ ] "Promise-aware" functions that return "thenables"
- [ ] generator functions that return iterators

## flows implemented:
- [x] series function calls (no error)
- [x] series function calls (error mid-flow)
- [x] parallel function calls (no error), then final function after all calls finish (gate)
- [x] parallel function calls (1 error), then final function after all calls finish (gate)
- [x] parallel function calls (no error), then final function after one call finishes (latch)
- [x] parallel function calls (1 error), then final function after one call finishes (latch)

## technologies
- [x] callback functions
- [x] Caolan McMahon's [async](https://github.com/caolan/async) library
- [x] Kyle Simpson's [asynquence (ASQ)](https://github.com/getify/asynquence) library
- [x] ES6 Promises, polyfilled using Google's [traceur](https://github.com/google/traceur-compiler) compiler
- [x] ES6 generators, transpiled using Google's [traceur](https://github.com/google/traceur-compiler) compiler

## how to use
`npm i`
`node_modules/traceur/traceur parallel_error.js`  - replace parallel_error.js with whatever test to run