var express = require('express');
var app = module.exports = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server);
    Stopwatch = require('./models/stopwatch'),
    routes = require('./routes'),
    errorHandler = require('errorhandler'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override');

// Configuration

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(__dirname + '/public'));

// routing
app.get('/', routes.index);
app.get('/login', routes.login);


if ('development' == app.get('env')) {
    app.use(errorHandler({dumpExceptions: true, showStack: true}));
}

if ('production' == app.get('env')) {
    app.use(errorHandler());
}

// Heroku won't actually allow us to use WebSockets
// so we have to setup polling instead.
// https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});


// Use the port that Heroku provides or default to 5000
var port = process.env.PORT || 5000; 
/*app.listen(port, function() {
  console.log("Express server listening on port %d in %s mode", app.settings.port, app.settings.env);
});*/
server.listen(port, function(){
    console.log('Express server listening on port ' + port);
});



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