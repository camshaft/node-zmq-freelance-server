/**
 * Module dependencies
 */

var zmq = require('zmq');
var uuid = require('uuid').v4;
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var equal = require('buffer-equal');

var PING = new Buffer('PING');
var PONG = new Buffer('PONG');
var OK = new Buffer('OK');

exports = module.exports = createServer;
exports.createServer = createServer;

function createServer(handler) {
  var server = new FreelanceServer();
  if (handler) server.on('request', handler);
  return server;
}

function FreelanceServer() {
  var socket = this.socket = zmq.socket('router');
}
inherits(FreelanceServer, EventEmitter);

FreelanceServer.prototype.listen = function(port, hostname, cb) {
  if (typeof port === 'undefined') {
    port = '*';
  } else if (typeof port === 'function') {
    cb = port;
    port = '*';
  } else if (typeof hostname === 'function') {
    cb = hostname;
    hostname = undefined;
  }
  var address = format(port, hostname || '*');

  var self = this;
  var socket = self.socket;
  if (cb) self.once('error', cb);

  socket.identity = address;

  socket.bind(address, function(err) {
    if (err) return self.emit('error', err);
    self.removeListener('error', cb);
    if (cb) cb();

    socket.on('message', function(envelope, client, control, body) {
      var req = new Request();
      var res = new Response(envelope, client, socket);
      if (equal(control, PING)) return socket.pong();
      self.emit('request', req, res);
    });
  });
};

function Request() {

}

function Response(envelope, control, socket) {
  this.envelope = envelope;
  this.socket = socket;
  this.control = control;
  this.buffer = [];
}

Response.prototype.pong = function() {
  this.control = PONG;
  this.end();
};

Response.prototype.write = function(chunk, encoding) {
  this.buffer.push(chunk);
};

Response.prototype.end = function(data, encoding) {
  if (!data) return this.socket.send([this.envelope, this.control]);
  this.socket.send([this.envelope, this.control, data]);
};

function format(port, hostname) {
  return 'tcp://' + hostname + ':' + port;
}
