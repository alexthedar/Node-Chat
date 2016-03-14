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

  client.on('join', function(name){
    client.username=name;
  })

  client.on('message', function(data){
    var username = client.username;
    client.broadcast.emit('message', username + ": " + data);
    client.emit('message', username + ": " + data);
  });
});
