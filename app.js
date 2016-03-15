'use strict'

var express = require('express');
var app = express();
var redis = require('redis');
var redisClient = redis.createClient();

app.use(express.static('public'));

var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

server.listen(8080);

var storeMessage = function(name, data){
  var message = JSON.stringify({name:name,data:data});

  redisClient.lpush("messages", message, function(err, res){
    redisClient.ltrim("messages",0,9);
  });
};

io.on('connection', function(client){
  console.log('client connected');

  client.on('join', function(name){
    client.username=name;


    redisClient.lrange("messages",0,-1,function(err,messages){
      messages.reverse();

      messages.forEach(function(message){
        message = JSON.parse(message);
        client.emit("message", message.name + ": " + message.data);
      });
      
      console.log(client.username + " has joined");
      client.broadcast.emit('message', client.username + " has joined.");
      client.emit('message', client.username + " has joined.");
    });

  });

  client.on('message', function(data){
    var username = client.username;
    client.broadcast.emit('message', username + ": " + data);
    client.emit('message', username + ": " + data);
    storeMessage(username, data);
  });
});
