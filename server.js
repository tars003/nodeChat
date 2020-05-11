const express = require('express');
const path = require('path')
const http = require('http');
const socketio = require('socket.io')
const formatMessage = require('./utils/messages.js');
const { userJoin, getCurrUser, userLeave, getRoomUsers } = require('./utils/users.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = "Chat bot";

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

//Run when client connects
io.on('connection', socket => {
    console.log('New WS Connection');

    socket.on('joinRoom', ({username, room}) => {

        // Make the user join the room
        const user = userJoin( socket.id ,username, room);
        socket.join(user.room);
        console.log(user.room);

        // Welcomes the current user
        socket.emit('message', formatMessage(botName, 'Welcome to chat'));  // Only the client that is connecting
        
        // io.emit() // To all the users

        // Brodcast when a user connects
        socket.broadcast
        .to(user.room)
        .emit('message', formatMessage(botName, `${user.username} has joined the chat`));     // To all the user except the client himself

        // Send user and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    })

    // Listen for chat msg
    socket.on('chatMessage', (msg) => {
        const user = getCurrUser(socket.id);

        // console.log(msg);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });


    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit(
                'message', 
                formatMessage(botName, `${user.username} has left the chat`));

            // Send user and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        };
    });

});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server runnning on port ${PORT}`));
