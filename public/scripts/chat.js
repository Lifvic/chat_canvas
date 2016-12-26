/* global React */
/* global ReactDOM */
/* global io */
/* global $ */

var socket = io();

var ChatHeader = React.createClass({
  getInitialState: function() {
    socket.on('users', this.onSocketUsers);
    return {users: []};
  },
  onSocketUsers(users) {
    this.setState({'users': users});
  },
  render: function() {
    var users = [];
    for (var id in this.state.users) {
      var user_name = this.state.users[id];
      
      users.push(<span key={id} className='user'>{user_name}</span>);
    }
    var label = users.length == 1 ? "user" : "users";
    return (<div>Online({users.length} {label}): {users}</div>);
  }
});

var ChatCanvas = React.createClass({
  funcClick: function(e) {
    this.is_drawing = !this.is_drawing;
    
    var click = {"canvasId": this.props.canvasId,
                 "x": e.offsetX,
                 "y": e.offsetY};
    socket.emit("click", click);
  },
  render: function() {
    return (
      <div><canvas width='400' height='300'
              id={this.props.canvasId}></canvas></div>
      );
  },
  onMouseMove: function(e) {
    if (this.is_drawing) {
      var data = {"canvasId": this.props.canvasId,
                  "x": e.offsetX,
                  "y": e.offsetY};
      socket.emit("mousemove", data);
    }
  },
  componentDidMount: function() {
    if (this.canvas) return;
    
    this.canvas = document.getElementById(this.props.canvasId);
    this.drawing = {ctx: this.canvas.getContext('2d')};
    this.is_drawing = false;
    this.last_position = {};
    this.color_map = {};
    
    socket.on('click', this.onSocketClick);
    socket.on('mousepaint', this.onMousePaint);
    $(this.canvas).on('click', this.funcClick);
    $(this.canvas).on('mousemove', this.onMouseMove);
  },
  onSocketClick: function(data) {
    if (data.canvasId != this.props.canvasId) return;
    
    if (data.user_id in this.last_position) {
      // end point.
      delete this.last_position[data.user_id];
    } else {
      // start point.
      this.last_position[data.user_id] = { "x": data.x, 
                                           "y": data.y };
      this.color_map[data.user_id] = data.color;
    }
  },
  onMousePaint: function(data) {
    if (data.canvasId != this.props.canvasId) return;
    
    var new_point = {"x": data.x, "y": data.y};
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
    socket.on('message', this.onSocketMessage);
    socket.on('new_canvas', this.newCanvas);
    return {messages: []};
  },
  onSocketMessage: function(message) {
    var message_list = this.state.messages;
    message_list.push(message);
    this.setState({messages: message_list});
  },
  newCanvas: function(canvas_id) {
    var message_list = this.state.messages;
    message_list.push({'canvas': canvas_id});
    this.setState({messages: message_list});
  },
  render: function() {
    
    var messages = [];
    for (var i = 0; i < this.state.messages.length; i++) {
      var message = this.state.messages[i];
      
      if ('text' in message) {
        messages.push(<div key={message.key} className='message'>{message.text}</div>);
      } else if ('canvas' in message) {
        messages.push(<ChatCanvas key={message.canvas} canvasId={message.canvas}/>);
      }
    }
    
    return (
      <div className="messages">
        {messages}
      </div>
    );
  },
  componentDidUpdate: function() {
    $('#chatmessages').scrollTop(function() {return this.scrollHeight});
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
    if (e.key === 'Enter' && e.target.value.length > 0) {
      socket.emit('message', e.target.value);
      e.target.value = '';
    }
  },
  newCanvas: function() {
    socket.emit('new_canvas');
  }
});

ReactDOM.render(
  <ChatHeader />,
  document.getElementById('chatheader')
);
ReactDOM.render(
  <ChatMessages />,
  document.getElementById('chatmessages')
);
ReactDOM.render(
  <ChatInput />,
  document.getElementById('chatinput')
);

// TODO: replace this with better intro screen.
var person = prompt("Please enter your name", "");
if (person != null) {;
  socket.emit('join', person);
}