'use strict';

function ChatAppCtrl($scope, $q, socket, useragent, geolocation) {
  $scope.peopleCount = 0;
  $scope.messages = [];
  $scope.user = {}; //holds information about the current user
  $scope.users = {}; //holds information about ALL users
  $scope.rooms = []; //holds information about all rooms
  $scope.error = '';
  $scope.typingPeople = [];
  $scope.username = '';
  $scope.joined = false;
  var typing = false;
  var timeout  = undefined;

  $scope.setUsername = function(suggestedUsername) {
    $scope.username = suggestedUsername;
  }

  function timeoutFunction() {
    typing = false;
    socket.emit('typing', false);
  }

  $scope.focus = function(b) {
    $scope.focussed = b;
  }
  $scope.typing = function(event, room) {
    if (event.which !== 13) {
      if (typing === false && $scope.focussed && room !== null) {
        typing = true;
        socket.emit('typing', true);
      } else {
        clearTimeout(timeout);
        timeout = setTimeout(timeoutFunction, 1000);
      }
    }
  }

  socket.on("isTyping", function(data) {
    if (data.isTyping) {
      $scope.isTyping = data.isTyping;
      $scope.typingPeople.push(data.person);
    } else {
      $scope.isTyping = data.isTyping;
      var index = $scope.typingPeople.indexOf(data.person);
      $scope.typingPeople.splice(index, 1);
      $scope.typingMessage = '';
    }
  });

  $scope.joinServer = function() {
    $scope.user.name = this.username;
    if ($scope.user.name.length === 0) {
      $scope.error = 'Please enter a username';
    } else {
      var usernameExists = false;
      socket.emit('checkUniqueUsername', $scope.user.name, function(data) {
        usernameExists = data.result;
        if (usernameExists) {
          $scope.error = 'Username ' + $scope.user.name + ' already exists.';
          socket.emit('suggest', $scope.user.name, function(data) {
            $scope.suggestedUsername = data.suggestedUsername;
          });
        } else {
          socket.emit('joinSocketServer', {name: $scope.user.name});
          $scope.joined = true;
          $scope.error = '';
        }
      });
    }
  }

  $scope.send = function() {
    if (typeof this.message === 'undefined' || (typeof this.message === 'string' && this.message.length === 0)) {
      $scope.error = 'Please enter a message';
    } else {
      socket.emit('send', {
        name: this.username,
        message: this.message
      });
      $scope.message = '';
      $scope.error = '';
    }

  }

  $scope.createRoom = function() {
    var roomExists = false;
    var room = this.room;
    if (typeof this.room === 'undefined' || (typeof this.room === 'string' && this.room.length === 0)) {
      $scope.error = 'Please enter a room name';
    } else {
      socket.emit('checkUniqueRoomName', room, function(data) {
        roomExists = data.result;
        if (roomExists) {
          $scope.error = 'Room ' + room + ' already exists.';
        } else {
          socket.emit('createRoom', room);
          $scope.error = '';
        }
      });
    }
  }

  $scope.joinRoom = function(room) {
    socket.emit('joinRoom', room.id);
  }

  $scope.leaveRoom = function(room) {
    socket.emit('leaveRoom', room.id);
  }

  $scope.deleteRoom = function(room) {
    socket.emit('deleteRoom', room.id)
  }

  socket.on('sendUserDetail', function(data) {
    $scope.user = data;
  });

  socket.on('listAvailableChatRooms', function(data) {
    $scope.rooms.length = 0;
    angular.forEach(data, function(room, key) {
      $scope.rooms.push({name: room.name, id: room.id});
    });
  });

  socket.on('sendChatMessage', function(message) {
    $scope.messages.push(message);
  });

  socket.on('sendChatMessageHistory', function(data) {
    angular.forEach(data, function(messages, key) {
      $scope.messages.push(messages);
    });
  });

  socket.on('connectingToSocketServer', function(data) {
    $scope.status = data.status;
  });

  socket.on('usernameExists', function(data) {
    $scope.error = data.data;
  });

  socket.on('updateUserDetail', function(data) {
    $scope.users = data;
  });

  socket.on('joinedSuccessfully', function() {
      var payload = {
        countrycode: '',
        device: ''
      };
      geolocation.getLocation().then(function(position) {
        return geolocation.getCountryCode(position);
      }).then(function(countryCode) {
        payload.countrycode = countryCode;
        return useragent.getUserAgent();
      }).then(function(ua) {
        return useragent.getIcon(ua);
      }).then(function(device) {
        payload.device = device;
        socket.emit('userDetails', payload);
      });
  });

  socket.on('updatePeopleCount', function(data) {
    $scope.peopleCount = data.count;
  });

  socket.on('updateRoomsCount', function(data) {
    $scope.roomCount = data.count;
  });

  socket.on('disconnect', function(){
    $scope.status = "offline";
    $scope.users = 0;
    $scope.peopleCount = 0;
  });
}

