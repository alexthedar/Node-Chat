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

var storeMessage =  function(name, data){
                      var message = JSON.stringify({name:name,data:data});

                      redisClient.lpush("messages", message, function(err, res){
                        redisClient.ltrim("messages",0,9);
                      });
                    };

var currentChatters=[];
redisClient.smembers('chatters',function(err, allNames){
  if (err) throw (err);
  allNames.forEach(function(name){
    currentChatters.push(name);
  });
});


function checkChatterArr(myName){
  myName = myName;
  var check = true;
  currentChatters.forEach(function(name){
    if (myName == name){
      check = false;
    }
  });
  return check;
};

function removeChatterArr(myName){
  var index = currentChatters.indexOf(myName);
  if (index > -1) {
    currentChatters.splice(index, 1);
  };
};


io.on('connection', function(client){

  console.log('client connected');

  client.on('name check', function(myName){

    //validation on a framework works better than this
    if(myName === null || "" ){
      client.emit('no name');
    }

    //check for dupes
    if(checkChatterArr(myName) == false){
      client.emit('duplicate name', myName)
    } else {
      //join room
      joinRoom(myName, client);
      getMessages(client);
      client.username=myName;
    }
  });

  client.on('disconnect', function(){
    client.broadcast.emit('remove chatter', client.username);
    client.emit('remove chatter', client.username);
    redisClient.srem('chatters', client.username);
    removeChatterArr(client.username);
  });

  client.on('message', function(data){
    var username = client.username;
    client.broadcast.emit('message', username + ": " + data);
    client.emit('message', username + ": " + data);
    storeMessage(username, data);
  });
});

function listChatters(client){
  redisClient.smembers('chatters',function(err, allNames){
    allNames.reverse();
    allNames.forEach(function(name){
      client.emit('add chatter', name);
      client.broadcast.emit('add chatter', name);
    });
  });
};

function joinRoom(myName, client){
  client.broadcast.emit('new chatter', myName);
  client.emit('join room', myName);
  console.log(myName + " has joined");
  currentChatters.push(myName);
  redisClient.sadd('chatters', myName);
  listChatters(client);
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
