angular
  .module('4screen.engagehub.infinity', [])
  .factory('EngagehubInfinityService', function(engagehub, $timeout) {
      'use strict';

      var delay = 1000;

      var scrollHandler, available = true, offset = 0, scrollTimeout;

      function enable() {
        $timeout.cancel(scrollTimeout);
        available = true;
      }

      function delayedEnable() {
        scrollTimeout = $timeout(function() {
          enable();
        }, delay);
      }

      scrollHandler = _.throttle(function(s, e, w) {
        return function() {
          if (w.innerHeight - e.prop('offsetTop') + w.scrollY + offset >= parseInt(e.css('height'), 10)) {
            if (available) {
              console.debug('[ InfinityService ] Scroll handler (disabled)');
              available = false;
              engagehub.renderVisibled(10);

              delayedEnable();
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
