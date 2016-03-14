'use strict'

var express = require('express');
var app = express();

app.use(express.static('public'));


var server = require('http').createServer(app);
var io = require('socket.io')(server);

io.on('connection', function(client){
  console.log('client connected');
  client.on('messages', function(data){
    client.broadcast.emit('message', data);
    console.log(data);
  });
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');

});

server.listen(8080);
