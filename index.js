var express = require("express");
var jade = require("jade");
var path = require("path");
var io = require('socket.io');

var app = express()
  , server = require('http').createServer(app)
  , io = io.listen(server);

app.set("views", path.join(__dirname,"templates"));

//app.use is a method to server middle ware to everyone
app.use(express.static("js"));

//build dynamic C R U D parameters into the url
app.get('/', function(req, res){
  res.render('index.jade');
});

io.on('connection', function(socket){
  console.log("a user just joined");
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});


server.listen(process.env.PORT);

