'use strict';

angular.module('4screensAdminApp').factory('EngagehubInfinityService',
  function(engagehub) {
    var scrollHandler, available = true, offset = 0, step = 10;

    function enable() {
      available = true;
    }

    scrollHandler = _.throttle(function(s, e, w) {
      console.debug('[ InfinityService ] Scroll handler');
      return function() {
        if (w.innerHeight - e.prop('offsetTop') + w.scrollY + offset >= parseInt(e.css('height'), 10)) {
          if (available) {
            available = false;
            engagehub.renderVisibled(step);
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
