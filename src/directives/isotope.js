'use strict';

angular.module('4screens.socialhub').directive( 'socialhubIsotopeDirective',
  function( $rootScope, $timeout ) {
    var _link = function( scope, element, attrs ) {
      $rootScope.$on( 'SocialhubIsotopeDirectiveInitialize', function() {
        $timeout(function() {
          scope.iso = new Isotope( element[0], {
            // options
            itemSelector: '.socialhub-isotope-tile-directive'
          } );
          $rootScope.$emit('SocialhubIsotopeDirectiveImagesLoaded');
        });
      } );
      $rootScope.$on( 'SocialhubIsotopeDirectiveImagesLoaded', function() {
        $timeout(function() {
          var imgLoad = imagesLoaded( element );

          imgLoad.on( 'always', function() {
            $rootScope.$emit('SocialhubIsotopeDirectiveArrange');
          } );
        });
      } );
      $rootScope.$on( 'SocialhubIsotopeDirectiveArrange', function() {
        $timeout(function() {
          scope.iso.reloadItems();
          scope.iso.arrange();
        });
      } );
    };

    return {
      restrict: 'C',
      link: _link
    }
  }
);
