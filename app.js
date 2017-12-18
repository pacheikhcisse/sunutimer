var express = require('express'),
    app = module.exports = express.createServer(express.logger()),
    io = require('socket.io').listen(app);
    Stopwatch = require('./models/stopwatch'),
    routes = require('./routes');

// Configuration

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

// Heroku won't actually allow us to use WebSockets
// so we have to setup polling instead.
// https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

// Routes

// Use the port that Heroku provides or default to 5000
var port = process.env.PORT || 5000; 
app.listen(port, function() {
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

app.get('/', routes.index);

var stopwatch = new Stopwatch();
stopwatch.on('tick:stopwatch', function(time) {
  io.sockets.emit('time', { time: time });
});

stopwatch.on('reset:stopwatch', function(time) {
  io.sockets.emit('time', { time: time });
});

stopwatch.on('stop:stopwatch', function() {
  io.sockets.emit('start');
});

stopwatch.on('enable:stopwatch', function() {
  io.sockets.emit('enable');
});

// stopwatch.start();

io.sockets.on('connection', function (socket) {
  io.sockets.emit('time', { time: stopwatch.getTime() });

  socket.on('click:start', function () {
    io.sockets.emit('disable');
    io.sockets.emit('stop');
    stopwatch.start();
  });
  
  socket.on('click:stop', function () {
    io.sockets.emit('enable');
    io.sockets.emit('start');
    stopwatch.stop();
  });

  socket.on('click:reset', function () {
    io.sockets.emit('enable');
    io.sockets.emit('start');
    stopwatch.reset();
    stopwatch.stop();
  });

  socket.on('click:set', function (data) {
    io.sockets.emit('time', { time: stopwatch.formatTime(data.start) });
    io.sockets.emit('interval', { start: data.start, end: data.end });
    stopwatch.setStartTime(data.start);
    stopwatch.setEndTime(data.end);
  });

});