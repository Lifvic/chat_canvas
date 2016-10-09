var express = require("express");
var pug = require("pug");
var path = require("path");
var io = require('socket.io');

var app = express()
  , server = require('http').createServer(app)
  , io = io.listen(server);

app.set("views", path.join(__dirname, "templates"));

// Static files under public/ directory.
app.use(express.static("public"));

app.get('/', function(req, res){
  res.render('canvas.pug');
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
    io.emit('users', this.active_users);
  }
};

var user_counter = 0;
var message_counter = 0;
io.on('connection', function(socket){
  socket.on('join', function(user_name){
    var user_id = user_counter++;
    
    user_manager.user_joined(user_id, user_name);

    socket.on('disconnect', function() {
      user_manager.user_left(user_id)
    });
  });
  
  socket.on('message', function(message){
    io.emit('message', {text: message,
                        key: message_counter});
    ++message_counter;
  });
});

server.listen(process.env.PORT);

