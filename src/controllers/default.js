'use strict';

angular.module('4screens.socialhub').controller( 'socialhubDefaultCtrl',
  function( CONFIG, SocialhubBackendService, SettingsSocialhubService, $rootScope, $scope, $routeParams, $sce, $analytics ) {
    $scope.sh = SocialhubBackendService;
    $scope.detail = null;

    SettingsSocialhubService.get( $routeParams.shWidgetId || CONFIG.frontend.socialhubWidget.id ).then(function( widget ) {
      CONFIG.frontend.socialhub.id = widget.socialHubId;
      widget.theme = widget.theme || {};
      if( !!widget.theme.customThemeCssFile ) {
        $scope.staticThemeCssFile = CONFIG.backend.domain.replace( ':subdomain', '' ) + '/uploads/' + widget.theme.customThemeCssFile;
      }
      SocialhubBackendService.widgetId = widget._id;
      SocialhubBackendService.complete.infiniteScroll = !!widget.config.infiniteScroll;
      SocialhubBackendService.renderVisibled( SocialhubBackendService.complete.infiniteScroll ? 0 : 10 );
    });

    $scope.ratio = function( w, h, force ) {
      if( !!force ) {
        return force;
      }
      if( w > h ) {
        return 'verticale';
      }
      if( w < h ) {
        return 'horizontal';
      }
    };

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
          $scope.detail.video = [ {
            src: $sce.trustAsResourceUrl( post.videos.standard_resolution.url ),
            type: 'video/mp4'
          } ];
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
          $scope.detail.video = [ {
            src: $sce.trustAsResourceUrl( post.video.source ),
            type: 'video/mp4'
          } ];
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
        // if( post.type === 'video' ) {
        //   $scope.detail.video = '';
        // }
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

      $analytics.eventTrack( 'Open item', { category: 'Social Hub', label: post._id });
    };

    $scope.closeSocial = function() {
      $scope.detail = null;
      $rootScope.noscroll = false;

      $analytics.eventTrack( 'Close item', { category: 'Social Hub', label: 'Close item' });
    };

    $scope.renderMore = function() {
      SocialhubBackendService.renderVisibled( 10 );
    };
  }
);
