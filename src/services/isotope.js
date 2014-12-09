'use strict';

angular.module('4screens.socialhub').factory( 'SocialhubIsotopeService',
  function( SocialhubInfinityService, $document, $timeout ) {
    var instance = null
      , container = null
      , options = {
        itemSelector: '.socialhub-isotope-tile-directive',
        transitionDuration: '0.1s'
      };

    $document.bind( 'isotopeArrange', function() {
      $timeout(function() {
        $timeout(function() {
          $timeout(function() {
            instance.arrange();
            SocialhubInfinityService.enable();
            $document.triggerHandler('scroll');
          });
        });
      });
    });

    $document.bind( 'isotopeReload', function() {
      $timeout(function() {
        $timeout(function() {
          $timeout(function() {
            instance.reloadItems();
            instance.arrange();
            SocialhubInfinityService.enable();
            $document.triggerHandler('scroll');
          });
        });
      });
    });

    function init( element ) {
      container = element;
      instance = new Isotope( element[0], options );
    }

    function addItem( element, index ) {
      $timeout(function() {
        if( index === 0 ) {
          instance.prepended( element[0] );
        } else {
          instance.appended( element[0] );
        }
      });
    }

    // public API
    return {
      init: init,
      addItem: addItem
    };
  }
);
