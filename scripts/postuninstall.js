#!/usr/bin/env node

var cli = require('mongodb-js-cli')('mongodb-compass:scripts:postuninstall');
cli.yargs.usage('$0 [options]')
  .option('verbose', {
    describe: 'Confused or trying to track down a bug and want lots of debug output?',
    type: 'boolean',
    default: false
  })
  .help('help')
  .epilogue('a.k.a `make clean`');

if (cli.argv.verbose) {
  process.env.DEBUG = '*';
}

var del = require('del');
var async = require('async');
var path = require('path');

/**
 * TODO (imlucas) Figure out how to nuke `electron-compiler` cache as well.
 */
cli.spinner('Removing build artifacts');
async.parallel(['build/', 'dist/', 'node_modules/'].map(function(p) {
  return function(cb) {
    del(path.join(__dirname, '..', p)).then(cb.bind(null, null));
  };
}), function(err) {
  cli.abortIfError(err);
  cli.ok('Build artifacts removed');
});