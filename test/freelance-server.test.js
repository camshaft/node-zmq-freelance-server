/**
 * Module dependencies
 */

var freelance = require('..');

var app = freelance.createServer(handler);

var i = 0;

function handler(req, res) {
  i++;
  res.end('Ret: ' + i);
}

app.listen(5555, '127.0.0.1', function() {
  console.log('server listening');
});
