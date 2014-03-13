'use strict';

app.directive('onFocus', function() {
  return {
    restrict: 'A',
    link: function(scope, el, attrs) {
      el.bind('focus', function() {
        scope.$apply(attrs.onFocus);
      });
    }
  };
});

app.directive('onBlur', function() {
  return {
    restrict: 'A',
    link: function(scope, el, attrs) {
      el.bind('blur', function() {
        scope.$apply(attrs.onBlur);
      });
    }
  };
});

app.directive('autoscroll', function () {
  return function(scope, element, attrs) {
    var pos = element[0].parentNode.parentNode.scrollHeight;
    $(element).parent().parent().animate({
      scrollTop : pos
    }, 1000);
  }
});