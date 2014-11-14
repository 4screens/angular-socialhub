'use strict';

angular.module('4screens.socialhub').factory('SocialhubIsotopeService',
  function( SocialhubInfinityService, $document, $timeout ) {
    var instance = null
      , container = null
      , options = {
        itemSelector: '.socialhub-isotope-tile-directive',
        transitionDuration: '0.2s'
      };

    $document.bind('isotopeArrange', function() {
      $timeout(function() {
        arrange();
      });
    });
    $document.bind('isotopeRemove', function() {
      $timeout(function() {
        isotope.reloadItems();
        isotope.arrange();
      });
    });

    function init( element ) {
      container = element;
      instance = new Isotope( element[0], options );
      window.isotope = instance;
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

    var arrange = _.debounce(function() {
      loadImage(function() {
        SocialhubInfinityService.enable();
        $document.triggerHandler('scroll');
      });
    });

    function loadImage( callback ) {
      var loadImages = imagesLoaded( container );

      $timeout(function() {
        instance.arrange();
      });

      loadImages.on( 'always', function() {
        $timeout(function() {
          instance.arrange();
          callback.apply( this, arguments );
        });
      } );
    }

    // public API
    return {
      init: init,
      addItem: addItem,
      arrange: arrange
    }
  }
);
