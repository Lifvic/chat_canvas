var express = require("express");
var pug = require("pug");
var path = require("path");
var io = require("socket.io");

var app = express()
  , server = require("http").createServer(app)
  , io = io.listen(server);

app.set("views", path.join(__dirname, "templates"));

// Static files under public/ directory.
app.use(express.static("public"));

app.get("/", function(req, res){
  res.render("canvas.pug");
});

var user_manager = {
  active_users: {},
  user_joined: function(user_id, user_name) {
    this.active_users[user_id] = user_name;
    this.broadcast();
  },
  user_left: function(user_id) {
    if (user_id in this.active_users) {
      delete this.active_users[user_id];
      this.broadcast();
    }
  },
  broadcast: function() {
    io.emit("users", this.active_users);
  }
};

function getRandomColor() {
  function getRandomArbitrary(min, max) {
    return parseInt(Math.random() * (max - min) + min);
  }
  
  var r = getRandomArbitrary(0, 255);
  var g = getRandomArbitrary(0, 255);
  var b = getRandomArbitrary(0, 255);
  var color = "rgb("+ r + "," + g + "," + b + ")";
  
  return color;
}

var user_counter = 0;
var message_counter = 0;
io.on("connection", function(socket){
  socket.on("join", function(user_name){
    var user_id = user_counter++;
    var color = getRandomColor();
    
    user_manager.user_joined(user_id, user_name);

    socket.on("disconnect", function() {
      user_manager.user_left(user_id)
    });
    
    socket.on("message", function(message){
      io.emit("message", {text: message,
                          user_id: user_id,
                          user_name: user_name,
                          key: message_counter,
                          timedate: "8:01 A.M. Dec 24 2015"
      });
      ++message_counter;
    });
    
    socket.on("new_canvas", function(){
      io.emit("new_canvas", {canvas_id: "canvas_" + message_counter,
                             user_id: user_id,
                             user_name: user_name,
                             timedate: "8:01 A.M. Dec 24 2015"
      });
      ++message_counter;
    });
    
    socket.on("click", function(pos){
      io.emit("click", {canvasId: pos.canvasId,
                        x: pos.x,
                        y: pos.y,
                        user_id: user_id,
                        color: color});
    });
    
    socket.on("mousemove", function(move){
      io.emit("mousepaint", {canvasId: move.canvasId,
                             x: move.x,
                             y: move.y,
                             user_id: user_id});
    });
  });
});

server.listen(process.env.PORT);

