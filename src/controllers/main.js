'use strict';

angular.module('4screensAdminApp')
.controller('EngagehubMainCtrl', function($rootScope, $scope, $sce, ModalService, engagehub, auth, growl, $location, availableOrders) {

  $scope.redirectNotAuthenticated();
  $scope.engagehub = engagehub;

  $scope.createNewStream = function _createNewStrem() {
    ModalService.showModal({
      templateUrl: '/scripts/engagehub/views/addNewStream.html',
      controller: 'AddNewEngagehubCtrl'
    }).then(function(modal) {
        modal.close.then(function(result) {
          console.warn(result, modal);
        });
      });
  };

  $scope.deleteStream = function _deleteNewStrem(sh) {
    engagehub.streams.remove(sh)
      .then(function(data) {
        growl.success('Success');
      })
      .catch(function(err) {
        growl.error(err.msg || 'Unexpected error');
      });
  };

  // Filters
  $scope.selectType = function(type) {
    $scope.selectedTypeLabel = type.label;
    $scope.filterValues.type = type.value;
  };

  $scope.selectSort = function(sort) {
    $scope.order = sort;
  };

  $scope.clearSearch = function() {
    $scope.filterValues.name = '';
  };

  $scope.availableOrders = availableOrders;

  // Set default order
  $scope.order = availableOrders[2];

}).value('availableOrders', [{
    by: 'title',
    reverse: false,
    label: 'name, A to Z'
  }, {
    by: 'title',
    reverse: true,
    label: 'name, Z to A'
  }, {
    by: 'created',
    reverse: true,
    label: 'date, from newer'
  }, {
    by: 'created',
    reverse: false,
    label: 'date, from older'
  }
]);
