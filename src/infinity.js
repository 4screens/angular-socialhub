angular
  .module('4screen.engagehub.infinity', [])
  .factory('EngagehubInfinityService', function(engagehub) {
      'use strict';

      var scrollHandler, available = true, offset = 0;

      function enable() {
        available = true;
      }

      scrollHandler = _.throttle(function(s, e, w) {
        return function() {
          if (w.innerHeight - e.prop('offsetTop') + w.scrollY + offset >= parseInt(e.css('height'), 10)) {
            if (available) {
              console.debug('[ InfinityService ] Scroll handler');
              available = false;
              engagehub.renderVisibled(10);
            }
          }
        };
      }, 500);

      // public API
      return {
        scrollHandler: scrollHandler,
        enable: enable
      };
    }
  );
