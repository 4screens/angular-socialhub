angular
  .module('4screen.engagehub.service', [])
  .factory('engagehub',
    function(CONFIG, $rootScope, $http, $q, CommonSocketService, $document, $window) {
      'use strict';

      var _data = {}, streamId = null, visibled = 0, pack = 50;
      var complete = {value: true, newest: true}; // Spinner
      var queue = [], newest = [];  // Array of id's
      //var throttler = 500; // Time (msc) used to throttle renderVisibled posts in public service api

      // FIXME: Normalization - change it to array ?
      var archived = {}; // Contains posts objects, after render are copied to results
      var results = []; // Collection of posts
      var filtered = []; // Collections of filtered (hidden) posts
      var currentSocket, URL = '', mode = 'embed';

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
            _data.selected = data;
            return data.data || {};
          });
      }

      function clearData() {
        _data = {};
        queue.length = 0;
        newest.length = 0;
        results.length = 0;
        complete.value = true;
        complete.newest = true;
        visibled = 0;
        archived = {};
      }

      function setStreamId(id) {
        console.debug('[ Engagehub Service ] SetStreamId');
        streamId = id;
        visibled = 0;

        queue.length = 0;
        newest.length = 0;
        results.length = 0;
        archived = {};

        connectSocketIo();
      }

      function getPosts(params) {
        console.debug('[ Engagehub Service ] GetPosts');
        params = params || {};
        complete.value = false;
        var url = URL + CONFIG.backend.engagehub.posts.replace(':id', streamId);

        return $http.get(url, {params: params}).then(function(res) {
          complete.value = true;
          if (res.status === 200) {
            return res.data;
          }

          return $q.reject(res.data);
        }).catch(function() {
          complete.value = true;
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

        _.remove(archived, function(v) {
          return v.id === postId;
        });

        $rootScope.$emit('isotopeArrange');
      }

      function changeCommerce(shId, postId, commerce) {
        console.debug('[ Engagehub Service ] ChangeCommerce');
        return $http.post(URL + CONFIG.backend.engagehub.postsModeration.replace(':id', shId).replace(':postId', postId), {commerce: commerce})
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
        clearData();
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

      function renderVisibled(step, reload, page) {
        reload = reload || false;
        step = step || 0;

        console.debug('[ Engagehub Service ] Render visibled - step: ' + (step || 0));
        page = typeof page === 'number' ? page : Math.floor(_.size(archived) / pack);

        // Should i request next posts ?
        if (visibled + step > _.size(archived) && complete.value) {
          complete.value = false;

          getPosts({page: page}).then(function(posts) {
            complete.value = true;
            _.forEach(posts, function(post) {
              // if (!posts.length) {
              //   throttler = Math.min(Math.max(500, throttler * 2), 5000);
              //   return;
              // }

              // console.log(_.indexOf(queue, post.id));
              // console.log(post.id);

              if (_.indexOf(queue, post.id) === -1) {
                archived[post.id] = post;
                queue.push(post.id);

                // Update newest
                newest.splice(newest.indexOf(post.id), 1);
              }

            });

            if (queue.length > visibled) {
              renderVisibled(Math.min(step, queue.length - visibled));
            }
          }).catch(function() {
            complete.value = true;
          });
        } else {
          _.each(queue, function(postId, postIndex) {
            if (_.findIndex(results, {id: postId}) === -1 && step) {
              results.splice(postIndex, 0, archived[postId]);
              visibled++;
              step--;
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

          // if (complete.value && queue.length >= postLimit) {
          //   $document.unbind('scroll');
          // }
        }

        // console.log(visibled, results.length, Object.keys(archived).length, queue.length, complete.value);
      }

      // TODO: This is overkill, improve it to use renderVisibled here
      function renderNewest() {
        console.debug('[ Engagehub Service ] Render newest');

        // More than pack ?
        if (newest.length > pack) {
          newest.length = 0;
          clearData();
          renderVisibled(10, true);
        } else {
          complete.newest = false;

          getPosts({page: 0}).then(function(posts) {
            complete.newest = true;

            _.forEach(posts, function(post) {
              if (_.indexOf(queue, post.id) === -1) {
                newest.length = 0;
                results.unshift(post);
                archived[post.id] = post;
                queue.push(post.id);
                visibled++;

                $rootScope.$emit('isotopeArrange');
              }
            });

          }).catch(function() {
            newest.length = 0;
            complete.newest = true;
          });
        }
      }

      function socketOnNewPost(data) {
        console.debug('[ Socket ] New post');

        if (mode === 'admin' || data.approved === 2) {
          newest.push(data.id);

          // There is no post shown so reneder some feed
          if (visibled === 0) {
            renderNewest();
          }
        }
      }

      // function socketOnUpdatePost(data) {
      //   console.debug('[ Socket ] Update post');
      //   if (_.indexOf(queue, data.id) !== -1) {
      //     // Update
      //     queue[data.id].featured = data.featured;
      //     queue[data.id].pinned = data.pinned;
      //     queue[data.id].approved = data.approved;

      //     // Need DOM change ?
      //     if (data.approved !== 2 && mode === 'embed') {
      //       removeLocalPost(data.id);
      //     }
      //     $rootScope.$emit('IsotopeArrange');
      //   }
      // }

      function connectSocketIo() {
        if (currentSocket) {
          console.debug('[ Socket ] Found one, disconnect');
          currentSocket.disconnect();
        }

        currentSocket = CommonSocketService.get(CONFIG.backend.engagehub.socketio.namespace.replace(':id', streamId));

        currentSocket.on('connect', function(a) {
          console.debug('[ Socket ] Connected');
        });

        // New post
        currentSocket.on('socialhub:newPost', socketOnNewPost);

        // Post update
        // currentSocket.on('socialhub:updatePost', socketOnUpdatePost);
      }

      function setMode(m) {
        mode = m;
      }

      // Executed on scope destroy
      function close() {
        console.debug('[ Engagehub Service ] Close');
        clearData();

        if (currentSocket) {
          currentSocket.disconnect();
        }
      }

      // Passing no @id will resets filters, otherwhise @id will toggle filter for connection / keyword
      // Filtered post still should stay in visibled array
      // FIXME: FINISH IT
      function filterKeyword(id) {
        console.debug('[ Engagehub Service ] Filter connection');
        if (!id) results = results.concat(filtered);

        // Check if there is a filter on that keyword
        if (_.find(filtered, {_keyword: id})) {
          // Toggle on
          results = results.concat(_.filter(filtered, {_keyword: id}));
          filtered = _.reject(filtered, {_keyword: id});
        } else {
          //console.log([typeof_.filter(results, {_keyword: id})));
          // Toggle off
          filtered = filtered.concat(_.filter(results, {_keyword: id}));
          results = _.reject(results, {_keyword: id});
        }

        //console.log(id, results, filtered);

        $rootScope.$emit('isotopeArrange');
      }

      return {
        data: _data,
        setDomain: setDomain,
        clearData: clearData,
        getHubs: getHubs,
        getHub: getHub,
        getPosts: getPosts,
        removePost: removePost,
        changeCommerce: changeCommerce,
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
        renderNewest: _.throttle(renderNewest, 500),
        removeLocalPost: removeLocalPost,
        newest: {
          posts: newest
        },
        complete: complete,
        results: {
          posts: results
        },
        setMode: setMode,
        mode: mode,
        filterKeyword: filterKeyword,
        close: close
      };
    }
  );
