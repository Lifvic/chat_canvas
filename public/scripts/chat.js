/* global React */
/* global ReactDOM */
/* global io */
/* global $ */

var socket = io();

var ChatHeader = React.createClass({
  getInitialState: function() {
    socket.on("users", this.onSocketUsers);
    return {users: {}};
  },
  onSocketUsers(users) {
    this.setState({users: users});
  },
  render: function() {
    var users = [];
    for (var id in this.state.users) {
      var user_name = this.state.users[id];
      
      users.push(<span key={id} className="header_user">{user_name}</span>);
    }
    return (<div>
              <div id="online_header">Currently Online</div>
              <div id="online_users">{users}</div>
            </div>);
  }
});

var ChatCanvas = React.createClass({
  funcClick: function(e) {
    this.is_drawing = !this.is_drawing;
    
    var click = {canvasId: this.props.canvasId,
                 x: e.offsetX,
                 y: e.offsetY};
    socket.emit("click", click);
  },
  render: function() {
    return (
      <div className="message_canvas">
        <canvas width="400" height="300" id={this.props.canvasId}></canvas>
      </div>
      );
  },
  onMouseMove: function(e) {
    if (this.is_drawing) {
      var data = {canvasId: this.props.canvasId,
                  x: e.offsetX,
                  y: e.offsetY};
      socket.emit("mousemove", data);
    }
  },
  componentDidMount: function() {
    if (this.canvas) return;
    
    this.canvas = document.getElementById(this.props.canvasId);
    this.drawing = {ctx: this.canvas.getContext("2d")};
    this.is_drawing = false;
    this.last_position = {};
    this.color_map = {};
    
    socket.on("click", this.onSocketClick);
    socket.on("mousepaint", this.onMousePaint);
    $(this.canvas).on("click", this.funcClick);
    $(this.canvas).on("mousemove", this.onMouseMove);
  },
  onSocketClick: function(data) {
    if (data.canvasId != this.props.canvasId) return;
    
    if (data.user_id in this.last_position) {
      // end point.
      delete this.last_position[data.user_id];
    } else {
      // start point.
      this.last_position[data.user_id] = {x: data.x, 
                                          y: data.y};
      this.color_map[data.user_id] = data.color;
    }
  },
  onMousePaint: function(data) {
    if (data.canvasId != this.props.canvasId) return;
    
    var new_point = {x: data.x, y: data.y};
    this.drawLine(this.last_position[data.user_id], new_point, this.color_map[data.user_id]);
    
    this.last_position[data.user_id] = new_point;
  },
  // Draw line segment between 'a' and 'b'.
  drawLine: function(a, b, color) {
    this.drawing.ctx.beginPath();
    this.drawing.ctx.strokeStyle = color;
    this.drawing.ctx.moveTo(a.x, a.y);
    this.drawing.ctx.lineTo(b.x, b.y);
    this.drawing.ctx.stroke();
  },
  
});

var ChatMessages = React.createClass({
  getInitialState: function() {
    socket.on("message", this.onSocketMessage);
    socket.on("new_canvas", this.newCanvas);
    return {messages: []};
  },
  onSocketMessage: function(message) {
    var message_list = this.state.messages;
    message_list.push(message);
    this.setState({messages: message_list});
  },
  newCanvas: function(canvas_data) {
    var message_list = this.state.messages;
    message_list.push(canvas_data);
    this.setState({messages: message_list});
  },
  render: function() {
    
    var messages = [];
    var previous_user_id = null;
    for (var i = 0; i < this.state.messages.length; i++) {
      var message = this.state.messages[i];
      
      var content;
      if ("text" in message) {
        content = <div className="message_content">{message.text}</div>;
      } else if ("canvas_id" in message) {
        content = <ChatCanvas key={message.canvas} canvasId={message.canvas_id}/>;
      }

      if (previous_user_id != message.user_id) {
        messages.push(
          <article key={message.key} className="message">
            <div className="message_data">
              <p className="message_user_name">{message.user_name}</p>
              <p className="message_time">{message.timedate}</p>
              {content}
            </div>
            <div className="message_user_photo"><img src="http://placehold.it/80x60"/></div>
          </article>);
        previous_user_id = message.user_id;
      } else {
        messages.push(
          <article key={message.key} className="message">
            <div className="message_data">
              <p className="message_time">{message.timedate}</p>
              {content}
            </div>
          </article>);
      }
    }
    
    return (
      <div className="messages">
        {messages}
      </div>
    );
  },
  componentDidUpdate: function() {
    $("#chatmessages").scrollTop(function() {return this.scrollHeight});
  }
});

var ChatInput = React.createClass({
  render: function() {
    return (
      <div className="inputBox">
        <input type="text"
               onKeyPress={this.onKeyPress}/>
        <button onClick={this.newCanvas}>Summon the Canvas</button>
      </div>
    );
  },
  onKeyPress: function(e) {
    if (e.key === "Enter" && e.target.value.length > 0) {
      socket.emit("message", e.target.value);
      e.target.value = "";
    }
  },
  newCanvas: function() {
    socket.emit("new_canvas");
  }
});

ReactDOM.render(
  <ChatHeader />,
  document.getElementById("chatheader")
);
ReactDOM.render(
  <ChatMessages />,
  document.getElementById("chatmessages")
);
ReactDOM.render(
  <ChatInput />,
  document.getElementById("chatinput")
);

// TODO: replace this with better intro screen.
var person = prompt("Please enter your name", "");
if (person != null) {;
  socket.emit("join", person);
}