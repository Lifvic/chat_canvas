/* global React */
/* global ReactDOM */
/* global io */

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

var ChatMessages = React.createClass({
  getInitialState: function() {
    socket.on('message', this.onSocketMessage);
    return {messages: []};
  },
  onSocketMessage: function(message) {
    console.log('onSocketMessage');
    var message_list = this.state.messages;
    message_list.push(message);
    this.setState({messages: message_list});
  },
  render: function() {
    var messages = [];
    for (var i = 0; i < this.state.messages.length; i++) {
      var message = this.state.messages[i];
      
      messages.push(<div key={message.key} className='message'>{message.text}</div>);
    }
    return (
      <div className="messages">
        {messages}
      </div>
    );
  }
});

var ChatInput = React.createClass({
  render: function() {
    return (
      <div className="inputBox">
        <input type="text"
               onKeyPress={this.onKeyPress}/>
      </div>
    );
  },
  onKeyPress: function(e) {
    if (e.key === 'Enter' && e.target.value.length > 0) {
      socket.emit('message', e.target.value);
      e.target.value = '';
    }
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