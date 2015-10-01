// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/**
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE' or 'LICENSE.txt', which is part of this source code package.
 *
 * Created by misiek on 07.10.2014.
 */

angular.module('4screensAdminApp').controller('EngagehubAddNewTagCtrl', function($scope, close, $timeout, engagehub, auth, growl, sh) {
    'use strict';

    $scope.locked = false;

    $scope.auth = auth;

    $scope.link = function _link(provider) {
      $scope.locked = true;
      auth.link(provider) // TW STOPS HERE
        .then(function(data) {
          $scope.locked = false;

          // Pass token to Lurid
          provider = provider === 'fb' ? 'facebook' : provider;

          console.log(data);

          auth.getUserProfile().then(function(user) {
            engagehub.updateAccessToken(engagehub.data.selected._id, user.access_tokens[provider], provider);
            $scope.locked = false;
          });
        })
        .catch(function(data) {
          growl.error(data.data.message || data.msg || 'Unexpected error');
          $scope.locked = false;
        });
    };

    $scope.sending = false;

    $scope.close = function(result) {
      $scope.show = false;
      console.log(result);
      close(result, 500); // close, but give 500ms for bootstrap to animate
    };

    $timeout(function() {
      $scope.show = true;
    });

    $scope.add = function _add() {
      console.log('[ Socialhub ] Data');

      $scope.locked = true;
      var type = $scope.newTag.type === 'fb' ? 'facebook' : $scope.newTag.type;
      engagehub.streams.tags.add(engagehub.data.selected.data, type, $scope.newTag.keyword)
        .then(function(status) {
          if (!status) {
            growl.error('Unexpected error');
            $scope.locked = false;
          } else {
            close(true, 500);
            growl.success('Success');
          }
        });
    };
  }

);
