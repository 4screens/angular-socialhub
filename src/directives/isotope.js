'use strict';

angular.module('4screens.socialhub').directive( 'socialhubIsotopeDirective',
  function( SocialhubIsotopeService, SocialhubInfinityService, $window, $document ) {
    var _link = function( scope, element ) {
      SocialhubIsotopeService.init( element );
      $document.unbind('scroll');
      $document.bind( 'scroll', SocialhubInfinityService.scrollHandler( scope, element, $window ) );
    };

    return {
      restrict: 'C',
      link: _link
    };
  }
);
