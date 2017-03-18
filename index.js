#!/usr/bin/env node
var Preferences = require('preferences');
var program     = require('commander-plus');
var colors      = require('colors');

var pkg = require('./package.json')
var Account = require('./routes/Account');
var Company = require('./routes/Company');
var Status = require('./routes/Status');
var Screen = require('./Print');

var prefs = null;

start = function() {
  // Get the prefs
  prefs = new Preferences('rainbow');

  // initiate the program
  program.version(pkg.version);

  var account = new Account(program, prefs);
  var company = new Company(program, prefs);
  var status = new Status(program, prefs);

  account.start();
  company.start();
  status.start();

  program
  .command('*')
  .action(function () {
    Screen.print('Command not found.')
  })

  program.parse(process.argv);
}

start();