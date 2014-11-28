'use strict';

angular.module('4screens.socialhub').factory('SocialhubInfinityService',
  function( SocialhubBackendService ) {
    var scrollHandler
      , available = true
      , offset = 1500
      , step = 10;

    function enable() {
      available = true;
    }

    scrollHandler = _.throttle( function( s, e, w ) {
      return function() {
        if( w.innerHeight - e.prop('offsetTop') + w.scrollY + offset >= parseInt( e.css('height'), 10 ) ) {
          if( !!available ) {
            available = false;
            SocialhubBackendService.renderVisibled( step );
          }
        }
      }
    }, 500 );

    // public API
    return {
      scrollHandler: scrollHandler,
      enable: enable
    }
  }
);
