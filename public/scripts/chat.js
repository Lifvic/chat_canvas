/* global React */
/* global ReactDOM */

var Chat = React.createClass({
  render: function() {
    return (
      <div className="message">
        Hello, world!
      </div>
    );
  }
});

ReactDOM.render(
  <Chat />,
  document.getElementById('chat')
);