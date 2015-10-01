/**
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE' or 'LICENSE.txt', which is part of this source code package.
 *
 * Created by misiek on 01.10.2014.
 */

angular.module('4screensAdminApp').controller('AddNewEngagehubCtrl', function($scope, close, $timeout, growl, engagehub, $state) {
    'use strict';

    $scope.sending = false;

    $scope.close = function(result) {
      $scope.show = false;
      close(result, 500); // close, but give 500ms for bootstrap to animate
    };

    $timeout(function() {
      $scope.show = true;
    });

    $scope.add = function _add() {
      $scope.sending = true;
      engagehub.streams.create($scope.newStream.name)
        .then(function(res) {
          if (!res) {
            growl.error('Unexpected error');
            $scope.sending = false;
          }

          close(true, 500);
          $state.go('my.engagehub.edit', {shId: res._id});
        })
        .catch(function(res) {
          growl.error(res.msg || 'Unexpected error');
          close(true, 500);
        });
    };
  }

);
