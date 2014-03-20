(function() {
  'use strict';

  angular.module('davidchin.endlessScroll')
    .directive('endlessScroll', function(EndlessScroll) {
      return {
        restrict: 'EA',
        scope: true,

        controller: function($scope, $element, $attrs) {
          var scroller = new EndlessScroll($element, {
            next: $scope.$eval($attrs.endlessScroll || $attrs.next)
          });

          $scope.$on('$destroy', function() {
            scroller.unwatch();
          });

          return scroller;
        }
      };
    });
})();
