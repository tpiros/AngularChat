module.exports = function(server) {
  var uuid = require('node-uuid')
  _ = require('underscore')._
  , Room = require('./utils/room')
  , people = {}
  , rooms = {}
  , chatHistory = {}
  , chatHistoryCount = 10
  , sockets = []
  , io = require('socket.io').listen(server)
  , utils = require('./utils/utils')
  , purgatory = require('./utils/purge');
  io.set('log level', 1);

  io.sockets.on('connection', function (socket) {
    //on every connection count the number of people already online and broadcast message to all clients
    totalPeopleOnline = _.size(people);
    utils.sendToAllConnectedClients(io,'updatePeopleCount', {count: totalPeopleOnline});
    totalRooms = _.size(rooms);
    utils.sendToAllConnectedClients(io, 'updateRoomsCount', {count: totalRooms});

    utils.sendToSelf(socket, 'connectingToSocketServer', {
      status: 'online',
    });

    socket.on('checkUniqueUsername', function(username, cb) {
      var exists = false;
      if (username.length !== 0) {
        _.find(people, function(k, v) {
          if (k.name.toLowerCase() === username) {
            return exists = true;
          }
        });
        cb({result: exists});
      }
    });

    socket.on('checkUniqueRoomName', function(roomname, cb) {
      var exists = false;
      if (roomname.length !== 0) {
        _.find(rooms, function(k, v) {
          if (k.name.toLowerCase() === roomname) {
            return exists = true;
          }
        });
        cb({result: exists});
      }
    });

    socket.on('suggest', function(username, cb) {
      var random = Math.floor(Math.random()*1001);
      var suggestedUsername = username + random;
      cb({suggestedUsername: suggestedUsername});
    });

    socket.on('joinSocketServer', function(data) {
      var exists = false;
      _.find(people, function(k, v) {
        if (k.name.toLowerCase() === data.name.toLowerCase())
          return exists = true;
      });
      if (!exists) {
        if (data.name.length !== 0) {
          people[socket.id] = {name: data.name};
          people[socket.id].inroom = null; //setup 'default' room value
          people[socket.id].owns = null;
          totalPeopleOnline = _.size(people);
          totalRooms = _.size(rooms);
          utils.sendToAllConnectedClients(io, 'updateRoomsCount', {count: totalRooms});
          utils.sendToAllConnectedClients(io, 'updateUserDetail', people);
          utils.sendToAllConnectedClients(io, 'updatePeopleCount', {count: totalPeopleOnline});
          utils.sendToAllConnectedClients(io,'listAvailableChatRooms', rooms);
          utils.sendToSelf(socket, 'joinedSuccessfully'); //useragent and geolocation detection
          utils.sendToAllConnectedClients(io, 'updateUserDetail', people);
          sockets.push(socket); //keep a collection of all connected clients
        }
      }
    });

socket.on('userDetails', function(data) {
      //update the people object with further user details
      var countryCode = data.countrycode.toLowerCase();
      people[socket.id].countrycode = countryCode;
      people[socket.id].device = data.device;
      utils.sendToAllConnectedClients(io,'updateUserDetail', people);
      utils.sendToSelf(socket, 'sendUserDetail', people[socket.id]);
    });

socket.on('typing', function(data) {
  if (typeof people[socket.id] !== 'undefined') {
    utils.sendToAllClientsInRoom(io, socket.room, 'isTyping', {isTyping: data, person: people[socket.id].name});
  }
});

socket.on('send', function(data) {
  if (typeof people[socket.id] === 'undefined') {
    utils.sendToSelf(socket, 'sendChatMessage', {name: 'ChatBot', message: 'You need a name first, please.'});
  } else {
    if (io.sockets.manager.roomClients[socket.id]['/'+socket.room]) {
      if (_.size(chatHistory[socket.room]) > chatHistoryCount) {
        chatHistory[socket.room].splice(0,1);
      } else {
        chatHistory[socket.room].push(data);
      }
      utils.sendToAllClientsInRoom(io, socket.room, 'sendChatMessage', data);
    } else {
      utils.sendToSelf(socket, 'sendChatMessage', {name: 'ChatBot', message: 'Please connect to a room'});
    }
  }
});

socket.on('createRoom', function(data) {
  var flag = false;
  if (typeof people[socket.id] === 'undefined') {
    utils.sendToSelf(socket, 'sendChatMessage', {name: 'ChatBot', message: 'You need a name first, please.'});
    flag = true;
  } else {
    var exists = false;
    _.find(rooms, function(k, v) {
      if (k.name.toLowerCase() === data.toLowerCase())
        return exists = true;
    });
    if (!exists) {
      if (people[socket.id].owns !== null && !flag) {
        utils.sendToSelf(socket, 'sendChatMessage', {name: 'ChatBot', message: 'You are already an owner of a room.'});
        flag = true;
      }
      if (people[socket.id].inroom !== null && !flag) {
        utils.sendToSelf(socket, 'sendChatMessage', {name: 'ChatBot', message: 'You are already in a room.'});
        flag = true;
      }
      if (!flag) {
        var roomName = data;
        if (roomName.length !== 0) {
              var uniqueRoomID = uuid.v4() //guarantees uniquness of room
              , room = new Room(roomName, uniqueRoomID, socket.id);
              people[socket.id].owns = uniqueRoomID; //set ownership of room
              people[socket.id].inroom = uniqueRoomID; //assign user to room in people object
              people[socket.id].roomname = roomName;
              room.addPerson(socket.id);
              rooms[uniqueRoomID] = room;
              socket.room = roomName;
              socket.join(socket.room);
              totalRooms = _.size(rooms);
              utils.sendToAllConnectedClients(io, 'updateRoomsCount', {count: totalRooms});
              utils.sendToAllConnectedClients(io,'listAvailableChatRooms', rooms);
              utils.sendToAllConnectedClients(io, 'updateUserDetail', people);
              utils.sendToSelf(socket, 'sendUserDetail', people[socket.id]);
              chatHistory[socket.room] = []; //initiate chat history
            }
          }
        }
      }
    });

socket.on('joinRoom', function(id) {
  var flag = false;
  if (typeof people[socket.id] !== 'undefined') {
    var room = rooms[id];
    if (socket.id === room.owner && !flag) {
      utils.sendToSelf(socket, 'sendChatMessage', {name: 'ChatBot', message: 'You own this room, why join it? ;)'});
      flag = true;
    }
    if (_.contains((room.people), socket.id) && !flag) {
      utils.sendToSelf(socket, 'sendChatMessage', {name: 'ChatBot', message: 'You are already in this room.'});
      flag = true;
    }
    if (people[socket.id].inroom !== null && !flag) {
      utils.sendToSelf(socket, 'sendChatMessage', {name: 'ChatBot', message: 'You are already in a room ('+rooms[people[socket.id].inroom].name+').'});
      flag = true;
    }
    if (!flag) {
      var roomToJoin = rooms[id];
      socket.room = roomToJoin.name;
      socket.join(socket.room);
      roomToJoin.addPerson(socket.id);
      people[socket.id].inroom = id;
      people[socket.id].roomname = roomToJoin.name;
      utils.sendToAllConnectedClients(io, 'updateUserDetail', people);
      utils.sendToSelf(socket, 'sendUserDetail', people[socket.id]);
      if (chatHistory[socket.room].length === 0) {
        utils.sendToSelf(socket, 'sendChatMessage', {name: 'ChatBot', message: 'No chat history.'});
      } else {
        utils.sendToSelf(socket, 'sendChatMessageHistory', chatHistory[socket.room]);
      }
    }
  }
});

socket.on('deleteRoom', function(id) {
     var roomToDelete = rooms[id]; // find the room to remove?
     if (typeof roomToDelete !== 'undefined') {
      if (socket.id === roomToDelete.owner) { //only allow the owner to delete a room
        purgatory.purge(socket, 'deleteRoom');
      } else {
        utils.sendToSelf(socket, 'sendChatMessage', {name: 'ChatBot', message: 'Don\'t be cheeky - you are not the owner of this room.'});
      }
    }
  });

socket.on('leaveRoom', function(id) {
  var roomToLeave = rooms[id];
  if (typeof roomToLeave !== 'undefined') {
    purgatory.purge(socket, 'leaveRoom');
  } else {
    utils.sendToSelf(socket, 'sendChatMessage', {name: 'ChatBot', message: 'Don\'t be cheeky - you are not the owner of this room.'});
  }
});

socket.on('disconnect', function() {
      if (typeof people[socket.id] !== 'undefined') { //this handles the refresh of the name screen
        purgatory.purge(socket, 'disconnect');
      }
    });
});
};