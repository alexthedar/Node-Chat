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

  client.on('join', function(myName){

    if (checkName(myName) === 0){
      client.emit('duplicate name', myName)
    } else {
      listChatters(client);
      joinRoom(myName, client);
      getMessages(client);
    };

    client.username=myName;
  });

  client.on('disconnect', function(name){
    client.broadcast.emit('remove chatter', name);
    redisClient.srem('chatters', name);
  });

  client.on('message', function(data){
    var username = client.username;
    client.broadcast.emit('message', username + ": " + data);
    client.emit('message', username + ": " + data);
    storeMessage(username, data);
  });
});

function checkName(myName){
  var check = redisClient.sadd('chatters', myName);
  return check;
};

function listChatters(client){
  redisClient.smembers('chatters',function(err, allNames){
    allNames.forEach(function(name){
      client.emit('add chatter', name);
    });
  });
};

function joinRoom(myName, client){
  client.broadcast.emit('new chatter', myName);
  client.emit('join room', myName);
  console.log(myName + " has joined");
  redisClient.sadd('chatters', myName);
};

function getMessages(client){
  redisClient.lrange("messages",0,-1,function(err,messages){
    messages.reverse();

    messages.forEach(function(message){
      message = JSON.parse(message);
      client.emit("message", message.name + ": " + message.data);
    });
  });
};
