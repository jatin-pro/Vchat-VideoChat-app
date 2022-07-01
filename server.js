const express = require('express'); 

// create express app
const app = express(); 

// create the server for socket io otherwise socketio run on other port
const server = require('http').Server(app); 

// create the socket
const io = require('socket.io')(server); 

//importing v4 version of uuid to make rooms id
const { v4: uuidv4 } = require('uuid'); 

//for peer to peer connect
const { ExpressPeerServer } = require('peer');

const peerServer = ExpressPeerServer(server, {
    path: "/peerjs"
})

//letting peerJS know what url we are going to use
app.use('/peerjs', peerServer);

// visible ejs file when server is on 
app.set('view engine', 'ejs');


app.use(express.static('public'));

//create dynamic room whenever someone enter in server unique id will generate  that will redirect to room ejs filw
app.get('/', (request, response) => {
    response.redirect(`/${uuidv4()}`);
});

app.get('/:room', (request, response) => {
    response.render('room', { roomId: request.params.room })
})


//socket io connection 

io.on('connection' , socket => { 
    console.log(`connection occured`)
    socket.on('join-room', (roomId, userID, username) => {
        console.log(username); 
        socket.join(roomId);    //we are joining the room whose id is been passed.
        socket.to(roomId).emit('user-connected', userID, username); //socket letting other user know (broadcasting) that user has joined  with this id in that room.
    
        socket.on('message', (message) => {
            io.to(roomId).emit('createMessage',message, userID, username)
        })
        socket.on('disconnect', () => {
            io.to(roomId).emit('user-disconnected', userID)
        })
        socket.on('leave-room', (username) => {
           io.to(roomId).emit('user-left', userID, username)
        })
    })
})


const PORT = process.env.PORT || 8000;


server.listen( PORT, function() {
console.log( 'listening on :' + PORT );
});

