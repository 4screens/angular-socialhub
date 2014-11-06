'use strict';

angular.module('4screens.socialhub').directive( 'socialhubIsotopeDirective',
  function( $window, $document, SocialhubBackendService ) {
    var _link = function( scope, element ) {
      SocialhubBackendService.isotope.init( element );

      scope.$watch(function() {
        return element.height();
      }, function() {
        SocialhubBackendService.infinity.scrollHandler( scope, element, $window )();
      });

      $document.bind( 'scroll', SocialhubBackendService.infinity.scrollHandler( scope, element, $window ) );
    };

    return {
      restrict: 'C',
      link: _link
    }
  }
);
