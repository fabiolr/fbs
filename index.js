var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var usernames = {};



// respond to a get on the root directory

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


http.listen(process.env.PORT || 3000, function(){
console.log('listening on *:' + http.address().port);
});



io.on('connection', function(socket){

	console.log(username + ' connected');
  	
  	// a message was received from a client

  	socket.on('chat message', function(msg){

	  		// do logic here with that msg if needed

    


  		// send it to other clients
    io.emit('chat message', msg, socket.username);
    
    });


  	// someone left:

  	socket.on('disconnect', function(){
    	
    	console.log(username + ' disconnected');
    	// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('chat message', socket.username + ' has left the chat',  'SERVER');
  	});


	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// we store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		usernames[username] = username;
		// echo to client they've connected
		socket.emit('chat message', 'you have connected', 'SERVER');
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('msg', 'SERVER', username + ' has connected');
		// update the list of users in chat, client-side
		socket.emit('updateusers', usernames);
		console.log(usernames);

	});


});

