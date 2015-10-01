'use strict';

angular.module('4screensAdminApp').directive('engagehubIsotopeTile',
  function(EngagehubIsotopeService) {
    var _link = function(scope, element) {
      EngagehubIsotopeService.addItem(element, scope.$index);
    };

    return {
      restrict: 'C',
      link: _link
    };
  }

);
