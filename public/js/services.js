'use strict';

app.constant('useragentmsgs', {
  'errors.useragent.notFound':'unknown',
});
app.constant('geolocation_msgs', {
        'errors.location.unsupportedBrowser':'Browser does not support location services',
        'errors.location.notFound':'Unable to determine your location',
});

app.factory('socket', function ($rootScope) {
  var socket = io.connect('http://127.0.0.1:3000');
  if (socket.socket.connected === false) {
    $rootScope.status = 'offline';
  }
  var disconnect = false;
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function() {
        var args = arguments;
        if (!disconnect) {
          $rootScope.$apply(function() {
            callback.apply(socket, args);
          });
        }
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function() {
        var args = arguments;
        $rootScope.$apply(function() {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      });
    },
    disconnect: function() {
      disconnect = true;
      socket.disconnect();
    }
  }
});

app.factory('useragent', ['$q', '$rootScope', '$window', 'useragentmsgs', function ($q,$rootScope,$window,useragentmsgs) {
  return {
    getUserAgent: function () {
      var deferred = $q.defer();
      if ($window.navigator && $window.navigator.userAgent) {
        var ua = $window.navigator.userAgent;
        deferred.resolve(ua);
      }
      else {
        $rootScope.$broadcast('error',useragentmsgs['errors.useragent.notFound']);
        $rootScope.$apply(function(){deferred.reject(useragentmsgs['errors.useragent.notFound']);});
      }
      return deferred.promise;
    },
    getIcon: function(ua) {
      var deferred = $q.defer();
      var icon = '';
      if (ua.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i)) {
        icon = 'mobile';
        deferred.resolve(icon);
      } else {
        icon = 'desktop';
        deferred.resolve(icon)
      }
      return deferred.promise;
    }
  };
}]);

app.factory('geolocation', ['$q','$rootScope','$window', '$http', 'geolocation_msgs',function ($q, $rootScope, $window, $http, geolocation_msgs) {
  return {
    getLocation: function() {
      var deferred = $q.defer();
      if ($window.navigator && $window.navigator.geolocation) {
        $window.navigator.geolocation.getCurrentPosition(function(position){
          $rootScope.$apply(function(){deferred.resolve(position);});
        }, function(error) {
          $rootScope.$broadcast('error',geolocation_msgs['errors.location.notFound']);
          $rootScope.$apply(function(){deferred.reject(geolocation_msgs['errors.location.notFound']);});
        });
      }
      else {
        $rootScope.$broadcast('error',geolocation_msgs['errors.location.unsupportedBrowser']);
        $rootScope.$apply(function(){deferred.reject(geolocation_msgs['errors.location.unsupportedBrowser']);});
      }
      return deferred.promise;
    },
    getCountryCode: function(position) {
      var deferred = $q.defer();
      var countryCode = '';
      $http.get('http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20geo.placefinder%20where%20text%3D%22'+position.coords.latitude+'%2C'+position.coords.longitude+'%22%20and%20gflags%3D%22R%22&format=json').success(function(data) {
        countryCode = data.query.results.Result.countrycode;
        deferred.resolve(countryCode);
      });
      return deferred.promise;
    }
  };
}]);