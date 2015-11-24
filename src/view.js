angular
  .module('4screen.engagehub.view', [
    '4screen.engagehub.service',
    '4screen.engagehub.infinity',
    '4screen.engagehub.events',
    'com.2fdevs.videogular',
    'com.2fdevs.videogular.plugins.controls',
    'com.2fdevs.videogular.plugins.overlayplay',
    'com.2fdevs.videogular.plugins.poster',
    'com.2fdevs.videogular.plugins.buffering',
    'info.vietnamcode.nampnq.videogular.plugins.youtube',
    'ngLoad'
  ])
  .controller('EngagehubVievController',
    function($rootScope, $scope, $sce, engagehub, $timeout, CONFIG, EngagehubInfinityService) {
      'use strict';

		/**
		 * In order to initialise the hub, use this.refreshAndSelect(id) method, where 'id' is the hub's id that can
     * be taken from $stateParams.shId or from some other source.
     */

      var arrangeItems = function() {
        $scope.$broadcast('iso-method', { name: 'arrange', params: null});
      };

      EngagehubInfinityService.enable();

      engagehub.callbacks.set.onRearrangePosts(function() {
        $timeout(function() {
          arrangeItems();
        });
      });

      engagehub.callbacks.set.onNeedToRenderLayout(function() {
        $timeout(function() {
          arrangeItems();
        });
      });

      engagehub.callbacks.set.setCallbackNewPostsReady(function() {
        $timeout(function() {
          arrangeItems();
          EngagehubInfinityService.enable();
        });
      });

      $scope.filtered = [];
      $scope.engagehub = engagehub;

      $scope.imageLoaded = _.debounce(arrangeItems, 300);

      this.refreshAndSelect = function refreshAndSelect(shId) {
        console.debug('[ EngagehubView ] RefreshAndSelect');
        engagehub.setStreamId(shId);

        return engagehub.getHub(shId).then(function(data) {
          $scope.sh = data;

          engagehub.select($scope.sh);
          engagehub.renderVisibled(10, true);

          return $scope.sh;
        });
      };

      $scope.openModal = function(post) {
        $scope.detail = {};

        // image
        if (post.post.image) {
          $scope.detail.image = $scope.hasImage(post.post);
        }

        // video ???
        if (post.post.type === 'video') {
          var videoUrl;

          if (post.post.video.format) {
            videoUrl = post.post.video.format.small ? post.post.video.format.small.source : videoUrl;
            videoUrl = post.post.video.format.medium ? post.post.video.format.medium.source : videoUrl;
            videoUrl = post.post.video.format.large ? post.post.video.format.large.source : videoUrl;
          }

          // It's youtube and no link so far, let's build link
          if (!videoUrl && post.post.video.providerId && post.post.video.provider === 'youtube') {
            videoUrl = 'https://www.youtube.com/watch?v=' + providerId;
          }

          $scope.detail.video = [{
            src: $sce.trustAsResourceUrl(videoUrl),
            type: 'video/mp4'
          }];
        }

        // user
        $scope.detail.user = {
          name: post.post.author.name,
          avatar: post.post.author.picture || 'http://graph.facebook.com/' + post.post.author.id + '/picture'
        };

        // time
        $scope.detail.publish = post.created * 1000;

        // message
        $scope.detail.message = post.post.message || post.post.description || post.post.caption || post.post.story;

        // commerce
        $scope.detail.commerce = (post.commerce && post.commerce.url && post.commerce.text) ? post.commerce : null;

        $scope.$broadcast('modal-opened', $scope.detail);
      };

      $scope.closeModal = function() {
        $scope.detail = null;
        $scope.$broadcast('modal-closed');
      };

      $scope.getFontSize = function(message) {
        message = message || '';
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
  .directive('infiniteScroll',
    function($document, EngagehubInfinityService, $window) {
      'use strict';

      return {
        link: function(scope, $el) {
          $document.unbind('scroll');
          $document.bind('scroll', EngagehubInfinityService.scrollHandler(scope, $el, $window));

          scope.$on('$destroy', function() {
            $document.unbind('scroll');
          });
        }
      };
    })
  .filter('excerpt', function() {
    return function(txt) {
      txt || (txt = '');
      return txt.length > 180 ? txt.slice(0, 180) + ' ..' : txt;
    };
  });
