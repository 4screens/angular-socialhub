angular
  .module('4screen.engagehub.service', [])
  .factory('engagehub',
    function(CONFIG, $rootScope, $http, $q, CommonSocketService, $document, $window) {
      'use strict';
      var _data = {}, streamId = null, visibled = 0, pack = 50, complete = {value: false}, queue = [], newest = [], archived = {}, results = [], currentSocket, URL = '';

      function setDomain(domain) {
        URL = domain;
      }

      function getHubs() {
        console.debug('[ Engagehub Service ] GetHubs');
        return $http.get(URL + CONFIG.backend.engagehub.base)
          .then(function(data) {
              _data.socialhubs = data.data;
              _data.selected = {};
          });
      }

      function getHub(id) {
        console.debug('[ Engagehub Service ] GetHub');
        return $http.get(URL + CONFIG.backend.engagehub.info.replace(':id', id))
          .then(function(data) {
            console.log(data);
            // _data.selected = data;
            return data;
          });
      }

      function clearData() {
        _data = {};
      }

      function setStreamId(id) {
        console.debug('[ Engagehub Service ] SetStreamId');
        streamId = id;

        visibled = 0;
        complete.value = false;

        queue.length = 0;

        newest.length = 0;

        archived = {};
        results.length = 0;

        connectSocketIo();
      }

      function getPosts(params) {
        console.debug('[ Engagehub Service ] GetPosts');
        params = params || {};
        var url = URL + CONFIG.backend.engagehub.posts.replace(':id', streamId);

        return $http.get(url, {params: params}).then(function(res) {
          if (res.status === 200) {
            return res.data;
          }

          return $q.reject(res.data);
        });
      }

      function getPost(postId) {
        console.debug('[ Engagehub Service ] GetPost');
        return $http.get(URL + CONFIG.backend.engagehub.post.replace(':id', streamId).replace(':postId', postId))
          .then(function(res) {
            if (res.status === 200) {
              return res.data;
            }

            return $q.reject(res.data);
          });
      }

      function removePost(id, postId) {
        console.debug('[ Socialhub Service ] RemovePost');
        return $http.delete(
          URL +
          CONFIG.backend.engagehub.remove
            .replace(':id', id)
            .replace(':postId', postId)
        ).then(function(res) {
          return res.data;
        });
      }

      function removeLocalPost(postId) {
        _.remove(queue, function(v) {
          return v === postId;
        });

        _.remove(results, function(v) {
          return v.id === postId;
        });

        $rootScope.$emit('isotopeArrange');
      }

      function changeCommerceUrl(shId, postId, url) {
        console.debug('[ Engagehub Service ] ChangeCommerceUrl');
        return $http.post(URL + CONFIG.backend.engagehub.postsModeration.replace(':id', shId).replace(':postId', postId),
          {commerceUrl: url})
          .then(function(data) {
            return data.data;
          });
      }

      function changeModeration(shId, postId, moderationStatus) {
        console.debug('[ Engagehub Service ] ChangeModeration');
        return $http.post(URL + CONFIG.backend.engagehub.postsModeration.replace(':id', shId).replace(':postId', postId),
          {approved: moderationStatus})
          .then(function(data) {
            return data.data;
          });
      }

      function changePinned(shId, postId, pinnedStatus) {
        console.debug('[ Engagehub Service ] ChangePinned');
        return $http.post(URL + CONFIG.backend.engagehub.postsModeration.replace(':id', shId).replace(':postId', postId),
          {pinned: pinnedStatus})
          .then(function(data) {
            return data.data;
          });
      }

      function changeFeatured(shId, postId, featuredStatus) {
        console.debug('[ Engagehub Service ] ChangeFeatured');
        return $http.post(URL + CONFIG.backend.engagehub.postsModeration.replace(':id', shId).replace(':postId', postId),
          {featured: featuredStatus})
          .then(function(data) {
            return data.data;
          });
      }

      function updateAccessToken(shId, accessToken, provider) {
        console.debug('[ Engagehub ] UpdateAccessToken');
        var at = {channel: provider, tokenValue: accessToken};

        return $http.post(URL + CONFIG.backend.engagehub.accessTokens.replace(':id', shId), at)
          .then(function(data) {
            if (data && data.data && data.data.status) {
              growl.success(data.data.status);
            }

            return data.data;
          });
      }

      var sockets = {};

      function selectSocialHub(sh) {
        console.debug('[ Engagehub Service ] SelectSocialHub');
        _data.selected = _data.selected || {};
        _data.selected.type = 'sh';
        _data.selected.data = sh;
      }

      function createStreamGroup(name) {
        console.debug('[ Engagehub Service ] CreateStreamGroup');
        return $http.post(URL + CONFIG.backend.engagehub.base, {name: name})
          .then(function(data) {
            if (data.data.ok) {
              getHubs();
              return data.data.ok;
            } else {
              return data.data.err;
            }
          });
      }

      function removeStreamGroup(sh) {
        console.debug('[ Engagehub Service ] RemoveStreamGroup');
        return $http.delete(URL + CONFIG.backend.engagehub.base + '/' + sh._id)
          .then(function(data) {
            //console.debug(data.data);
            //return data;
            if (data.data.status && data.data.status === 'removed') {
              getHubs();
              return (true);
            } else {
              return (false);
            }
          });
      }

      /**
       * dodaje taga do stream-a z defaultowym konfigiem, access_tokeny bierze z servisu auth
       * @param sh - stream do którego ma dodać
       * @param type - jaki typ taga
       * @param keyword - tag do dodania
       */
      function addTagToStream(sh, type, keyword) {
        console.debug('[ Engagehub Service ] AddTagToStream');

        return $http.post(URL + CONFIG.backend.engagehub.base + '/' + sh._id + '/keywords', {
            type: type,
            name: keyword,
            config: {},

            // New stuff
            value: keyword,
            channel: type,
            channelContentType: type === 'facebook' ? 'page' : 'tag'
          })
          .then(function(data) {
            //console.debug(data.data);
            //return data;
            if (data.data.status === 'ok') {
              // getHubs();
              return (true);
            } else {
              return (false);
            }
          });
      }

      function removeTagFromStream(sh, keyword) {
        console.debug('[ Engagehub Service ] RemoveTagFromStream');
        return $http.delete(URL + CONFIG.backend.engagehub.base +
            '/' + sh._id + '/keywords/' + keyword._id)
          .then(function(data) {
            //console.debug(data.data);
            //return data;
            if (data.data.status === 'ok') {
              // getHubs();
              return (true);
            } else {
              return (false);
            }
          });
      }

      function getStreams() {
        console.debug('[ Engagehub Service ] GetStreams');
        return $http.get(URL + CONFIG.backend.engagehub.base)
          .then(function(res) {
            return res.data;
          });
      }

      function getStream(id) {
        return getStreams().then(function(streams) {
          var index = _.findIndex(streams, {_id: id});
          return streams[index];
        });
      }

      function sendSMS(widgetId, phoneNumber) {
        console.debug('[ Engagehub Service ] SendSMS');
        var url = URL + CONFIG.backend.engagehub.Widgets.sendSMS.replace(':widgetId', widgetId);
        return $http.post(url, {phoneNumber: phoneNumber});
      }

      function update(sh) {
        console.debug('[ Engagehub Service ] Update');
        return $http.post(URL + CONFIG.backend.engagehub.update.replace(':id', sh._id), sh)
          .then(function(res) {
            return res.data;
          });
      }

      function renderVisibled(step, reload) {
        console.debug('[ Engagehub Service ] Render visibled');
        visibled += step || 0;
        reload = reload || false;

        if (visibled > _.size(archived) && complete.value === false) {
          getPosts({page: Math.floor(_.size(archived) / pack)}).then(function(posts) {
            if (posts.length < 50) {
              complete.value = true;
            }

            _.forEach(posts, function(post) {
              if (_.findIndex(queue, post.id) === -1) {
                archived[post.id] = post;
                queue.push(post.id);
              }
            });

            if (queue.length > visibled) {
              renderVisibled();
            }
          });
        } else {
          _.each(queue.slice(0, visibled), function(postId, postIndex) {
            if (_.findIndex(results, {id: postId}) === -1) {
              results.splice(postIndex, 0, archived[postId]);
            }
          });

          _.remove(results, function(postId, postIndex) {
            return postIndex >= visibled;
          });

          if (reload === false) {
            $rootScope.$emit('isotopeArrange');
          } else {
            $rootScope.$emit('isotopeReload');
          }

          if (complete.value === true && queue.length === visibled) {
            $document.unbind('scroll');
          }

        }
      }

      function renderNewest() {
        queue = newest.concat(queue);
        queue = queue.slice(0, visibled);

        // Najszybszy znany mi sposób wyczyszczenia tablicy
        // nie usuwając samej tablicy.
        // newest = [] 'ubija' watch angulara
        newest.length = 0;

        renderVisibled(0, true);
      }

      function connectSocketIo() {
        console.log('connecting socket', streamId);

        if (currentSocket) {
          currentSocket.disconnect();
        }

        currentSocket = CommonSocketService.get(CONFIG.backend.engagehub.socketio.namespace.replace(':id', streamId));
        currentSocket.on('connect', function(a) {
          console.log('socket connected');
        });

        currentSocket.on('socialhub:newPost', function(postId) {
          console.log('[ Socket ] New post');
          getPost(postId).then(function(post) {
            if (_.findIndex(queue, postId) === -1) {
              archived[post.id] = post;
              if ($window.scrollY === 0 && newest.length === 0) {
                queue.unshift(post.id);
                visibled++;
                renderVisibled();
              } else {
                newest.unshift(post.id);
              }
            }
          }).catch(function(err) {
            if (err.status === 404 || err.status === 500) {
              removeLocalPost(postId);
            }
          });
        });
      }

      return {
        data: _data,
        setDomain: setDomain,
        clearData: clearData,
        getHubs: getHubs,
        getHub: getHub,
        getPosts: getPosts,
        removePost: removePost,
        changeCommerceUrl: changeCommerceUrl,
        changeModeration: changeModeration,
        changeFeatured: changeFeatured,
        changePinned: changePinned,
        updateAccessToken: updateAccessToken,
        select: selectSocialHub,
        sendSMS: sendSMS,
        streams: {
          create: createStreamGroup,
          remove: removeStreamGroup,
          tags: {
            add: addTagToStream,
            remove: removeTagFromStream
          },
          get: getStreams
        },
        update: update,

        setStreamId: setStreamId,
        renderVisibled: renderVisibled,
        renderNewest: renderNewest,
        removeLocalPost: removeLocalPost,
        newest: {
          posts: newest
        },
        complete: complete,
        results: {
          posts: results
        }
      };
    }
  );
