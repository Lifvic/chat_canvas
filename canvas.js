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

app.get('/', function(req, res){
  res.render('canvas.jade');
});

var user_counter = 0;
io.on('connection', function(socket){
  var this_user = "user"+user_counter;
  ++user_counter;
  function getRandom(min, max) {
    return parseInt(Math.random() * (max - min) + min);
  }
  
  var r = getRandom(0, 255);
  var g = getRandom(0, 255);
  var b = getRandom(0, 255);
  var color = "rgb("+ r+","+g+","+b+")";

  socket.on('click-position', function(pos){
    io.emit('click', {"offsetX": pos.offsetX, "offsetY": pos.offsetY, "id": this_user, "color": color});
  });
  
  socket.on('mousemove', function(move){
    io.emit('mousepaint', {"offsetX": move.offsetX, "offsetY": move.offsetY, "id": this_user});
  });
  
  socket.on('image', function(img){
     socket.broadcast.emit('newimage', img);
  });
  
});


server.listen(process.env.PORT);

