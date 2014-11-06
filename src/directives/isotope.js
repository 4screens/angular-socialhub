'use strict';

angular.module('4screens.socialhub').directive( 'socialhubIsotopeDirective',
  function( $window, $document, SocialhubBackendService ) {
    var _link = function( scope, element ) {
      SocialhubBackendService.isotope.init( element );

    };

    return {
      restrict: 'C',
      link: _link
    }
  }
);
