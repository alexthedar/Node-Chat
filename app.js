'use strict'

var express = require('express');
var app = express();

app.use(express.static('public'));

var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

server.listen(8080);

io.on('connection', function(client){
  console.log('client connected');

  client.on('message', function(data){
    client.broadcast.emit('message', data);
    client.emit('message',data);
  });
});
