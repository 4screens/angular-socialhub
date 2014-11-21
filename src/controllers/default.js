'use strict';

angular.module('4screens.socialhub').controller( 'socialhubDefaultCtrl',
  function( SocialhubBackendService, $rootScope, $scope, $sce, $analytics ) {
    $scope.sh = SocialhubBackendService;
    $scope.sh.renderVisibled();
    $scope.detail = null;

    $scope.openSocial = function( post ) {
      $scope.detail = {};
      $rootScope.noscroll = true;

      if( post.source === 'instagram' ) {
        // image
        if( !!post.images ) {
          $scope.detail.image = post.images.standard_resolution.url;
        }
        // video
        if( post.type === 'video' ) {
         $scope.detail.video = true;
        }
        // user
        $scope.detail.user = {
          name: post.user.username,
          avatar: post.user.profile_picture
        };
        // time
        $scope.detail.publish = post.created_time;
        // message
        $scope.detail.message = post.caption;
      } else if( post.source === 'facebook' ) {
        // image
        if( !!post.photo ) {
          $scope.detail.image = post.photo.source;
        }
        // video
        if( post.type === 'video' ) {
         $scope.detail.video = true;
        }
        // user
        $scope.detail.user = {
          name: post.from.name,
          avatar: post.from.image
        };
        // time
        $scope.detail.publish = post.created_time;
        // message
        $scope.detail.message = post.message || post.description || post.caption || post.story;
      } else if( post.source === 'twitter' ) {
        // image
        if( !!post.images ) {
          $scope.detail.image = post.images.media_url;
        }
        // video
        if( post.type === 'video' ) {
         $scope.detail.video = true;
        }
        // user
        $scope.detail.user = {
          name: post.user,
          avatar: post.user_image_url
        };
        // time
        $scope.detail.publish = post.created_time;
        // message
        $scope.detail.message = post.caption;
      }

      $analytics.eventTrack('Open item', {  category: 'Social Hub', label: post._id });
    };

    $scope.closeSocial = function() {
      $scope.detail = null;
      $rootScope.noscroll = false;

      $analytics.eventTrack('Close item', {  category: 'Social Hub', label: 'Close item' });
    };
  }
);
