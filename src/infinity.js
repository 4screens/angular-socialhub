angular
  .module('4screen.engagehub.infinity', [])
  .factory('EngagehubInfinityService', function(engagehub, $timeout) {
      'use strict';

      var delay = 1000;

      var scrollHandler, available = true, offset = 0, scrollTimeout, renderPosts;

      function enable() {
        $timeout.cancel(scrollTimeout);
        available = true;
      }

      function delayedEnable() {
        scrollTimeout = $timeout(function() {
          enable();
        }, delay);
      }

      renderPosts = function() {
        return engagehub.renderPosts();
      };

      scrollHandler = _.throttle(function(s, e, w) {
        return function() {
          if (w.innerHeight - e.prop('offsetTop') + w.scrollY + offset >= e[0].offsetHeight) {
            if (available) {
              console.debug('[ InfinityService ] Scroll handler (disabled)');
              available = false;
              engagehub.renderPosts();

              delayedEnable();
            }
          }
        };
      }, 500);

      // public API
      return {
        scrollHandler: scrollHandler,
        renderVisible: renderPosts,
        enable: enable
      };
    }
  );
