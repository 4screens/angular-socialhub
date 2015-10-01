'use strict';

angular.module('4screensAdminApp').controller('shAddCommerceUrlCtrl',
  function($scope, $timeout, url,  close) {

    $scope.commerceUrl = url || '';

    $scope.close = function(result) {
      console.log('result', result);
      $scope.show = false;

      // close, but give 500ms for bootstrap to animate
      close(result, 500);
    };

    $timeout(function() {
      $scope.show = true;
    });
  });
