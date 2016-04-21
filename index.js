var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var usernames = {};
var shooterCount;
var gameBoard = [];
var turn;
var hitCount = [];



// respond to a get on the root directory

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


http.listen(process.env.PORT || 3000, function(){
console.log('listening on *:' + http.address().port);
});


// event listener and actions

io.on('connection', function(socket){
  	
  	// a message was received from a client

  	socket.on('chat message', function(msg) {

  			// check for SHOOT command

  		if (msg.charAt(0) == '/') {

  			// it's some game command

				// check for SHOOT 

	  			if (/^\/SHOOT\/[a-zA-Z][0-9]$/.test(msg)) {

		  			if (socket.shooter == turn) {
			  			target = msg.substr(7,8);
						fire(target,socket.shooter);
					} else {
						io.emit('chat message', "Not " + socket.username + "'s turn", "SERVER: ", getTime());
					}
	  		}

				// check for NEW command

	  			if (/^\/NEW$/.test(msg)) {

	  			newGame();
				io.emit('chat message', "New Game Created by " + socket.username, "SERVER: ", getTime());

	  		}

				// check for JOIN command

	  			if (/^\/JOIN$/.test(msg)) {
	  			socket.shooter = AddUsertoGame(socket.username);
				io.emit('chat message',  socket.username + " joined the Game", "SERVER: ", getTime());

	  		}

  		 } else {

  			// it's just a message, send across

    		io.emit('chat message', msg, socket.username, getTime());

  		}
    
    });

  	// someone left:

  	socket.on('disconnect', function(){
    	
    	console.log(socket.username + ' disconnected');
    	// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.emit('updateusers', usernames);
		// echo globally that this client has left
		mtime = getTime();
		socket.broadcast.emit('chat message', socket.username + ' has left the chat',  'SERVER', getTime());
  	});


	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){


		// we store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		usernames[username] = username;
		// echo to client they've connected
		socket.emit('chat message', 'Welcome. Use /NEW to create a new game.. /JOIN to join a game, /SHOOT/A1 to shoot to A1', 'SERVER', getTime());
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('chat message', socket.username + ' has joined the chat',  'SERVER', getTime());
		// update the list of users in chat, client-side
		socket.emit('updateusers', usernames);

		console.log(socket.username + ' connected');


	});


});

function newGame() {

   // BOARD CODE:  0 = water, 1 = part of ship, 2 = sunken part of ship, 3 = a missed shot
	// TODO: Random board generator

	gameBoard = [
					[
						[0,0,0,1,1,1,1,0,0,0],
						[0,0,0,0,0,0,0,0,0,0],
						[0,0,0,0,0,0,0,0,0,0],
						[0,0,0,0,0,0,1,0,0,0],
						[0,0,0,0,0,0,1,0,0,0],
						[1,0,0,0,0,0,1,1,1,1],
						[1,0,0,0,0,0,0,0,0,0],
						[1,0,0,1,0,0,0,0,0,0],
						[1,0,0,1,0,0,0,0,0,0],
						[1,0,0,0,0,0,0,0,0,0]
						],
					[
						[0,0,0,0,0,0,0,0,0,0],
						[0,0,0,1,0,0,0,0,0,0],
						[0,0,0,1,0,0,0,0,0,0],
						[0,0,0,1,0,0,1,0,0,0],
						[0,0,0,1,0,0,1,0,0,0],
						[1,0,0,0,0,0,0,0,0,1],
						[1,0,0,0,0,0,0,0,0,0],
						[1,0,0,1,0,0,0,1,0,0],
						[1,0,0,1,0,0,0,1,0,0],
						[1,0,0,0,0,0,0,1,0,0]
						]
					];

	shooterCount = 0;
	turn = 1;
	console.log("New game created.");
}


// helper functions


function fire(target,shooter,game) {

	console.log("Torpedo Fired to " + target + " by " + shooter);
	console.log(gameBoard[0][0][0]);


    // if item clicked (e.target) is not the parent element on which the event listener was set (e.currentTarget)
	if (/^[a-zA-Z][0-9]$/.test(target) && /^[1-2]$/.test(shooter)) { // target is letter + number
      
      		//  select board being shot
		      if (shooter == 1) {
				shooted = 1;
			} else if (shooter == 2) {
				shooted = 0;
			} else {
				io.emit('chat message', "Shooter is not part of the game", "SERVER: ", getTime());
				return;
			}
        
        // extract row and column # from the target string

        var col = target.charCodeAt(0) - 65;
		var row = target.charAt(1) - 1;
        console.log("Torpedo fired to board " + shooted + " on row " + row + ", col " + col);
			
		// if target has no ship
		if (gameBoard[shooted][row][col] == 0) {
			gameBoard[shooted][row][col] = 3;
			io.emit('chat message', "Missed", "SERVER: ", getTime());
			switchTurn();
		// if target has a ship
		} else if (gameBoard[shooted][row][col] == 1) {
			gameBoard[shooted][row][col] = 2;
			console.log("hit");
			io.emit('chat message', "HIT", "SERVER: ", getTime());
		// increment hitCount each time a ship is hit
			hitCount[shooter]++;

				// TODO: change this into a variable when a random board generator is implemented
			if (hitCount[shooter] == 17) {
				io.emit('chat message', "All enemy battleships have been defeated! Player "+ shooter +" wins!", "SERVER: ", getTime());

			}
			console.log(hitCount[shooter]);
			switchTurn();

			
		// if water again
		} else if (gameBoard[shooted][row][col] > 1) {
			io.emit('chat message', "You just wasted a shot! You had already fired at this location", "SERVER: ", getTime());
		}
	}	else {
			io.emit('chat message', "Invalid Target", "SERVER: ", getTime());

	}
    
}


function AddUsertoGame(username) {

		if (shooterCount == 0) {
			shooter = 1;
			shooterCount = 1;
			console.log(username + " is now Player 1");
			return shooter;

		} else if (shooterCount == 1) {
			shooter = 2;
			console.log(username + " is now Player 2");
			return shooter;

		} else { 
			console.log(username + " is now a bystander");
		}

}

function switchTurn() {

	switch (turn) {
	    case 0:
	        turn = 1;
	        break;
	    case 1:
	        turn = 0;
	        break;
	}
}


function getTime() {

	var d = new Date();
  		var dh = d.getHours();
  		var dm = d.getMinutes();
  		dm = (dm > 10) ? dm : '0'+dm;
  		var mtime = dh + ':' + dm;

  		return mtime;
}


