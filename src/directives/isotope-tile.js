'use strict';

angular.module('4screens.socialhub').directive( 'socialhubIsotopeTileDirective',
  function( SocialhubBackendService ) {
    var _link = function( scope, element ) {
      SocialhubBackendService.isotope.addItem( element );
      SocialhubBackendService.isotope.arrange();
    };

    return {
      restrict: 'C',
      link: _link
    }
  }
);
