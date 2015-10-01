angular
  .module('4screenEngageHub.main', ['4screenEngageHub.engagehub', '4screenEngageHub.isotope', '4screenEngageHub.infinity'])
  .controller('EngagehubEditCtrl',
    function($rootScope, $scope, $sce, ModalService, engagehub, auth, growl, $location, $stateParams, $state, fonts, $timeout, CONFIG) {
      'use strict';

      if (!$stateParams.shId) return;

      $scope.redirectNotAuthenticated();
      $scope.engagehub = engagehub;
      $scope.keywordFilter = [];

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

      $scope.availableFonts = fonts;
      $scope.showContent = $state.params.content || 'moderate';
      $scope.$applyAsync(function() {
        $scope.subContent = $state.params.subContent ? $state.params.subContent : 'default_' + $scope.showContent;
      });

      var unsubscribeStateChangeStart = $rootScope.$on('$stateChangeStart', function(e, to, params) {
        $scope.showContent = params.content || 'moderate';
        $scope.subContent = params.subContent ? params.subContent : 'default_' + $scope.showContent;

        // Update isotope
        if (!params.content || params.content === 'moderate') {
          $rootScope.$emit('isotopeArrange');
        }
      });

      function refreshAndSelect(shId) {
        console.debug('[ EngagehubEdit ] RefreshAndSelect');
        engagehub.streams.get().then(function(streams) {
          $scope.sh = _.find(streams, {_id: shId || $scope.sh._id});

          // Fix themes if need
          if (!_.has($scope.sh, 'config.theme')) {
            $scope.sh.config.theme = CONFIG.frontend.engagehub.theme;
            $scope.sh.config.theme.authorFont = fonts[0].value || 'Open Sans';
            $scope.sh.config.theme.descriptionFont = fonts[0].value || 'Open Sans';
          }

          engagehub.select($scope.sh);
          $scope.results = engagehub.results;
          $scope.complete = engagehub.complete;
        });
      }

      $scope.updateSh = function(sh) {
        sh = sh || $scope.sh;
        console.debug('[ Engagehub EditCtrl ] Update engagehub');

        // Remove keywords
        var niceSh = _.clone(sh);
        delete niceSh.keywords;

        $rootScope.$broadcast('saving_data', true);
        engagehub.update(niceSh).then(function(data) {
          $rootScope.$broadcast('saving_data', false);
        }).catch(function(data) {
          growl.error(data.msg || 'Unexpected error');
          $rootScope.$broadcast('saving_data', false);
        });
      };

      $scope.remove = function _remove(post) {
        engagehub.removePost(post.socialhub, post.id).then(function() {
          engagehub.removeLocalPost(post.id);
        });
      };

      $scope.approvePost = function _approvePost(post) {
        console.debug('[ EngagehubEdit ] Approve Post');
        engagehub.changeModeration(post.socialhub, post.id, !post.approved).then(function(post) {
          var thisHubIndex = _.findIndex(
            engagehub.results.posts, {id: post.id}
          );
          engagehub.results.posts[thisHubIndex].approved = post.approved;
        })
      };

      $scope.featurePost = function _featurePost(post) {
        console.debug('[ EngagehubEdit ] Feature Post');
        engagehub.changeFeatured(post.socialhub, post.id, !post.featured).then(function(post) {
          var thisHubIndex = _.findIndex(
            engagehub.results.posts, {id: post.id}
          );
          engagehub.results.posts[thisHubIndex].featured = post.featured;
          $timeout(function() {
            $timeout(function() {
              $rootScope.$emit('isotopeArrange');
            });
          });
        });
      };

      $scope.addCommerceUrlModal = function(post) {
        console.debug('[ EngagehubEdit ] Add commerce url to Post');
        ModalService.showModal({
          templateUrl: 'scripts/engagehub/views/addCommerceUrl.html',
          inputs: {
            url: post.commerceUrl
          },
          controller: 'shAddCommerceUrlCtrl'
        }).then(function(modal) {
          modal.close.then(function(url) {
            if (url !== undefined && url !== false) {
              engagehub.changeCommerceUrl(post.socialhub, post.id, url).then(function(data) {
                var thisHubIndex = _.findIndex(
                  engagehub.results.posts, {id: post.id}
                );
                engagehub.results.posts[thisHubIndex].commerceUrl = url;
              });
            }
          });
        });
      };

      $scope.openSocial = function(post) {
        $scope.detail = {};
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
      };

      $scope.closeSocial = function() {
        $scope.detail = null;
        $rootScope.noscroll = false;
      };

      // FIXME: Semantics Tag == Keyword ?
      $scope.createNewTag = function _createNewTag(sh) {
        ModalService.showModal({
          templateUrl: '/scripts/engagehub/views/addNewTag.html',
          controller: 'EngagehubAddNewTagCtrl',
          inputs: {
            sh: sh
          }
        }).then(function(modal) {
          modal.close.then(function(result) {
            console.log(result);
            refreshAndSelect();
          });
        });
      };

      $scope.removeKeyword = function _removeKeyword(keyword) {
        engagehub.streams.tags.remove(engagehub.data.selected.data, keyword)
          .then(function(data) {
            if (data) {
              growl.success('Success');
            } else {
              growl.error('Unexpected error');
            }

            refreshAndSelect();
          })
          .catch(function(err) {
            growl.error(err.msg || 'Unexpected error');
          });
      };

      // Select correct sh
      refreshAndSelect($stateParams.shId);

      // Publish stuff
      $scope.embedUrl = 'xxx';
      $scope.embedEmbed = 'xxx';
      $scope.getQuizQRCode = function() { return 'xxx'; };

      // FIXME: Do we really need all this helpers ?
      $scope.getFont = function(font) {
        return '\'' + font + '\', sans-serif';
      };

      $scope.getCssImage = function(url) {
        return 'url(' + url + ')';
      };

      $scope.setFont = function(type, font) {
        $scope.sh.config.theme[type] = font;
        $scope.updateSh();
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
        return imgUrl.replace('$$cloudinary$$', CONFIG.frontend.cloudinary.domain).replace('$$bucket$$', CONFIG.frontend.cloudinary.bucket);
      };

      // Destroy events
      $scope.$on('$destroy', function() {
        unsubscribeStateChangeStart();
      });

    }
  )
  .value('fonts', [
    {value: 'Open Sans'},
    {value: 'Verdana'},
    {value: 'Abril Fatface'},
    {value: 'Advent Pro'},
    {value: 'Habibi'},
    {value: 'Libre Baskerville'},
    {value: 'Lora'},
    {value: 'PT Sans'},
    {value: 'Play'},
    {value: 'Russo One'},
    {value: 'Source Serif Pro'},
    {value: 'Tenor Sans'},
    {value: 'Titillium Web'}
  ])
  .filter('excerpt', function() {
    return function(txt) {
      return txt.length > 180 ? txt.slice(0, 180) + ' ..' : txt;
    };
  });
