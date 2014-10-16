'use strict';

angular.module('4screens.socialhub').directive( 'socialhubIsotopeTileDirective',
  function( $rootScope, $timeout ) {
    var _link = function( scope, element, attrs ) {
      scope.$watch( '$last', function( v ) {
        if( v ) {
          $timeout(function() {
            // This code will run after template has been loaded
            // and transformed by directives
            $timeout(function() {
              // and properly rendered by the browser
              $rootScope.$emit('SocialhubIsotopeDirectiveInitialize');
            });
          });
        }
      });
    };

    return {
      restrict: 'C',
      link: _link
    }
  }
);
