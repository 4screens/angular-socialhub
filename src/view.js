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
    function($rootScope, $scope, $sce, engagehub, $timeout, CONFIG, EngagehubInfinityService, embedSettings) {
      'use strict';

		/**
		 * In order to initialise the hub, use this.refreshAndSelect(id) method, where 'id' is the hub's id that can
     * be taken from $stateParams.shId or from some other source.
     */
      $scope.isoOptions = {
        getSortData: {
          order: '[data-order] parseInt'
        },
        sortAscending: false,
          masonry: {
        columnWidth: '.engagehub-isotope-tile.not-featured'
      },
        sortBy: 'order'
      };

      var isoMethodBroadcast = function(name, params) {
        $scope.$broadcast('iso-method', { name: name, params: params});
      };

      var arrangeItems = _.debounce(function() {
        isoMethodBroadcast('arrange', null);
      }, 200);

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

      engagehub.callbacks.set.onNewPostsReady(function() {
        $timeout(function() {
          arrangeItems();
          EngagehubInfinityService.enable();
        });
      });

      $scope.filtered = [];
      $scope.engagehub = engagehub;

      $scope.imageLoaded = _.debounce(arrangeItems, 300);

      function colorToRgb(color) {
          var colorParts, temp, triplets;
          if (color[0] === '#') {
              color = color.substr(1);
          }
          else {
              colorParts = color.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
              color = (colorParts && colorParts.length === 4) ? ('0' + parseInt(colorParts[1], 10).toString(16)).slice(-2) +
                  ('0' + parseInt(colorParts[2], 10).toString(16)).slice(-2) +
                  ('0' + parseInt(colorParts[3], 10).toString(16)).slice(-2) : '';
          }
          if (color.length === 3) {
              temp = color;
              color = '';
              temp = /^([a-f0-9])([a-f0-9])([a-f0-9])$/i.exec(temp).slice(1);
              for (var i = 0; i < 3; i++) {
                  color += temp[i] + temp[i];
              }
          }
          triplets = /^([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i.exec(color).slice(1);
          return {
              red: parseInt(triplets[0], 16),
              green: parseInt(triplets[1], 16),
              blue: parseInt(triplets[2], 16)
          };
      };

      function getThemeType(color) {
          var colorRGB = colorToRgb(color);
          if ((colorRGB.red * 0.299 + colorRGB.green * 0.587 + colorRGB.blue * 0.114) > 186) {
              return 'light';
          }
          else {
              return 'dark';
          }
      };

      this.refreshAndSelect = function refreshAndSelect(shId) {
        console.debug('[ EngagehubView ] RefreshAndSelect');
        engagehub.setStreamId(shId);

        return engagehub.getHub(shId).then(function(data) {
          $scope.sh = data;

          $scope.brandingDefault = {
            enabled: !$scope.sh.stateBranding,
            isDefault: true,
            text: "Made with",
            link: "https://4screens.net/engagehub/?utm_source=Default%20Branding&utm_medium=Embed&utm_campaign=Enagehub%20Embed"
          };

          if ($scope.sh.config.theme.backgroundColor) {
            $scope.themeType = getThemeType($scope.sh.config.theme.backgroundColor);
          }

          engagehub.select($scope.sh);
          engagehub.renderVisibled(10, true);

          return $scope.sh;
        });
      };

      $scope.openModal = function(post, $event) {
        if (post.commerce && post.commerce.url && post.commerce.text && !$scope.sh.config.theme.commerceButtonShow) {
           window.open(post.commerce.url, '_blank');
        } else {
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

            if (videoUrl) {
              $scope.detail.video = [{
                src: $sce.trustAsResourceUrl(videoUrl),
                type: 'video/mp4'
              }];
            }
          }
        }

        // user
        $scope.detail.user = {
          name: post.post.author.name,
          avatar: post.post.author.picture || 'http://graph.facebook.com/' + post.post.author.id + '/picture'
        };

        // time
        $scope.detail.publish = post.post.created * 1000;

        // channel
        $scope.detail.channel = post.post.source.channel;

        $scope.detail.headline = post.post.headline;
        $scope.detail.message = post.post.message;

        // message
        $scope.detail.message = post.post.message || post.post.description || post.post.caption || post.post.story;

        // commerce
        $scope.detail.commerce = (post.commerce && post.commerce.url && post.commerce.text) ? post.commerce : null;

        // headline
        $scope.detail.headline = _.has(post, 'post.headline') && post.post.headline ? post.post.headline : null;

        $scope.$broadcast('modal-opened', $event);

      };

      $scope.$on('modal-opened', function(event, args) {
        if (window.self != window.top) {
          setTimeout(function(){
            /* here is applied stuff to hack modal position in inframed window*/

            var iframe = angular.element(document.querySelector('.engagehub-iframe'));
            iframe.css("display", "block");
            var wrapper = angular.element(document.querySelector(".engagehub-iframe--wrapper"));
            var center = parseFloat(window.getComputedStyle(wrapper[0],null).getPropertyValue("height"))/2;
            var margin = args.clientY-center;

            if (margin < 0) {
              margin =0;
            }

            var height_size = 2*center;
            var height_end = margin+height_size;
            var body = document.body, html = document.documentElement;
            var screen_height =  body.offsetHeight;

            if (height_end > screen_height) {
              margin = screen_height-height_size-12.134;
            }

            wrapper.css('margin-top', margin+"px");
          }, 0);
        }
      });

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
      $scope.linkify = function(inputText) {
        if (inputText) {
          var replacedText, replacePattern1, replacePattern2, replacePattern3;

          //URLs starting with http://, https://, or ftp://
          replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
          replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

          //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
          replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
          replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

          //Change email addresses to mailto:: links.
          replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
          replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

          return replacedText;
        } else {
          return inputText;
        }
      };

      // Decides if the "Load more" button should be displayed.
      $scope.shouldShowLoadMoreButton = function() {
        return !embedSettings.allowScrolling;
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

          var resizeListener = scope.$on('iso-method', _.debounce(
            function() {
              var elementsListHeight = $el[0].offsetHeight;
              var availableHeight = $window.innerHeight;
              if (elementsListHeight < availableHeight) {
                EngagehubInfinityService.renderVisible(10);
              } else {
                resizeListener();
              }
            }, 500)
          );
        }
      }
    })
  .filter('excerpt', function() {
    return function(txt) {
      txt || (txt = '');
      return txt.length > 180 ? txt.slice(0, 180) + ' ..' : txt;
    };
  });
