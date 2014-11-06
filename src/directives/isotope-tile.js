'use strict';

angular.module('4screens.socialhub').directive( 'socialhubIsotopeTileDirective',
  function( SocialhubBackendService ) {
    var _link = function() {
      SocialhubBackendService.isotope.arrange();
    };

    return {
      restrict: 'C',
      link: _link
    }
  }
);
