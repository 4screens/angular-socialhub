angular
  .module('4screen.engagehub.view', ['4screen.engagehub.service', '4screen.engagehub.isotope', '4screen.engagehub.infinity'])
  .controller('EngagehubVievController',
    function($rootScope, $scope, $sce, engagehub, $timeout, CONFIG) {
      'use strict';

		/**
		 * In order to initialise the hub, use this.refreshAndSelect(id) method, where 'id' is the hub's id that can
     * be taken from $stateParams.shId or from some other source.
     */

      $scope.engagehub = engagehub;

      $scope.$watch(function() {
          if (_.has(engagehub, 'data.selected.data._id')) {
            return engagehub.data.selected.data._id;
          }
        },

        function(value) {
          if (value) {
            console.debug('[ Watcher ] SH Changed');
            $timeout(function() {
              engagehub.setStreamId(value);
              engagehub.renderVisibled();
            }, 500);
          }
        });

      this.refreshAndSelect = function refreshAndSelect(shId) {
        console.debug('[ EngagehubEdit ] RefreshAndSelect');
        return engagehub.streams.get().then(function(streams) {
          $scope.sh = _.find(streams, {_id: shId || $scope.sh._id});

          engagehub.select($scope.sh);
          $scope.results = engagehub.results;
          $scope.complete = engagehub.complete;

          return $scope.sh;
        });
      };

      $scope.openModal = function(post) {
        $scope.detail = {};

        // FIXME:
        $rootScope.noscroll = true;

        // image
        if (post.post.image) {
          $scope.detail.image = $scope.hasImage(post.post);
        }

        // video ???
        if (post.post.type === 'video') {
          $scope.detail.video = [{
            src: $sce.trustAsResourceUrl(post.post.video.source),
            type: 'video/mp4'
          }];
        }

        // user
        $scope.detail.user = {
          name: post.post.author.name,
          avatar: 'http://graph.facebook.com/' + post.post.author.id + '/picture'
        };

        // time
        $scope.detail.publish = post.created;

        // message
        $scope.detail.message = post.post.message || post.post.description || post.post.caption || post.post.story;

        $scope.$broadcast('modal-opened', $scope.detail);
      };

      $scope.closeModal = function() {
        $scope.detail = null;

        // FIXME
        $rootScope.noscroll = false;

        $scope.$broadcast('modal-closed');
      };

      $scope.getFontSize = function(message) {
        return Math.min(200, Math.max(170 / message.length * 100, 100)) + '%';
      };

      $scope.hasImage = function(post, size) {
        var imgUrl = '';

        // No images and no video
        if (!post.image && !post.video) return;

        if (size && (_.has(post, ['image', size, 'source']) || _.has(post, ['video', size, 'source']))) {
          imgUrl = post.image[size].source || post.video[size].source;
        } else {

          // Check if it has image, if no it MUST have a video
          imgUrl = post.image ? post.image.small : (post.video.small || imgUrl);
          imgUrl = post.image ? post.image.medium : (post.video.medium || imgUrl);
          imgUrl = post.image ? post.image.large : (post.video.large || imgUrl);
        }

        imgUrl = imgUrl.source ? imgUrl.source : imgUrl;
        return imgUrl.replace('$$cloudinary$$', CONFIG.backend.cloudinary.domain).replace('$$bucket$$', CONFIG.backend.cloudinary.account);
      };
    }
  )
  .filter('excerpt', function() {
    return function(txt) {
      return txt.length > 180 ? txt.slice(0, 180) + ' ..' : txt;
    };
  });
