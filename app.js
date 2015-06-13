/**
 * Created by Fernando Ramos on 10/06/2015.
 */

var app = require('express'),
    http = require('http').Server(app),
    io = require('socket.io').listen(http);

var PORT = process.env.PORT || 3000;

var users = [],
    userLookup = {};

var unity = io.of('/unity');

unity.on('connection', function (socket) {
    var currentUser;

    console.log("User connected: " + socket.id);

    socket.on('register', function (data) {

        // Creating a model of an user
        currentUser = {
            id:     socket.id,
            health: 100,
            isDead: false
        };
        console.log("User registered: " + currentUser.id);

        // Adding current user in the list
        users.push(currentUser);
        userLookup[currentUser.id] = currentUser;

        socket.emit('registerSuccess', {
            id: currentUser.id
        });

        socket.broadcast.emit('spawn', {
            id: currentUser.id
        });

        console.log("Players connected: " + users.length);

        users.forEach(function (user) {
            if (currentUser.id != user.id){
                socket.emit('spawn', {
                    id: user.id
                });
                console.log("Sending spawn to new player for: " + user.id);
            }
        });

    });

    socket.on('follow', function (data) {
        data.followerId = currentUser.id;
        console.log("Got follow" + JSON.stringify(data));

        socket.broadcast.emit('follow', data);
    });

    socket.on('move', function (data) {
        data.id = currentUser.id;

        console.log("Got move" + JSON.stringify(data));
        socket.broadcast.emit('move', data);
    });

    socket.on('hit', function (data) {
        console.log("Hit! " + data);

        var target = userLookup[data.targetId];

        if(!target.isDead){
            data.attackerId = currentUser.id;

            // Checking his live
            if(target.health <= 0){
                console.log("Player " + target.id + "has slain");

                io.sockets.emit("death", {
                    targetId : target.id
                });

                target.isDead = true;
            }

            target.health -= 10;
            data.health = target.health;

            console.log("Hit! " + 10 + " and health " + target.health);
            socket.broadcast.emit('hit', data);
        }
    });

    socket.on('disconnect', function () {

        // Removing of list of users
        var index = userLookup[currentUser.id];
        users.splice(index,1);
        console.log("User disconnected: " + currentUser.id);

        socket.broadcast.emit('disconnected', currentUser);
    });

});

// Listening in PORT
http.listen(PORT, function(){
    console.log("Magic things are happened in localhost:" + PORT);
});