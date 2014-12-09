'use strict';

angular.module('4screens.socialhub').directive( 'socialhubIsotopeTileDirective',
  function( SocialhubIsotopeService ) {
    var _link = function( scope, element ) {
      SocialhubIsotopeService.addItem( element, scope.$index );
    };

    return {
      restrict: 'C',
      link: _link
    };
  }
);
