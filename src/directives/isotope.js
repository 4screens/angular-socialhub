'use strict';

angular.module('4screensAdminApp').directive('engagehubIsotope',
  function(EngagehubIsotopeService, EngagehubInfinityService, $window, $document) {
    var _link = function(scope, element) {
      EngagehubIsotopeService.init(element);

      $document.unbind('scroll');
      $document.bind('scroll', EngagehubInfinityService.scrollHandler(scope, element, $window));
    };

    return {
      restrict: 'C',
      link: _link
    };
  }

);
