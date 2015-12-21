angular
  .module('4screen.engagehub.service', [])
  .factory('engagehub',
    function(CONFIG, $rootScope, $http, $q, $timeout, CommonSocketService, $document, $window, EngagehubEventsService) {
      'use strict';

      var _data = {}, streamId = null, visibled = 0, pack = 50;
      var complete = {value: true, newest: true}; // Spinner
      var queue = [];  // Array of id's

      var newest = {
        hidden: 0,
        approved: 0
      }; // Number of new posts
      //var throttler = 500; // Time (msc) used to throttle renderVisibled posts in public service api

      // FIXME: Normalization - change it to array ?
      var archived = {}; // Contains posts objects, after render are copied to results
      var results = []; // Collection of posts
      var currentSocket, URL = '', mode = 'embed';

      // Used by console, to get posts with specific status
      // 1 - new
      // 2 - approved
      // 3 - declined
      var currentPostsStatus = 2;

      function setDomain(domain) {
        URL = domain;
      }

      function getHubs() {
        console.debug('[ Engagehub Service ] GetHubs');
        return $http.get(URL + CONFIG.backend.engagehub.base)
          .then(function(data) {
            _data.socialhubs = data.data;
            _data.selected = {};

            return data.data;
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

      function clearData(onlyPosts) {
        queue.length = 0;
        results.length = 0;
        complete.value = true;
        complete.newest = true;
        visibled = 0;
        newest.hidden = 0;
        newest.approved = 0;
        archived = {};

        if (!onlyPosts) {
          _data = {};
        }
      }

      function setStreamId(id) {
        console.debug('[ Engagehub Service ] SetStreamId');
        streamId = id;
        visibled = 0;

        queue.length = 0;
        newest.hidden = 0;
        newest.approved = 0;
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
            EngagehubEventsService.triggerEvent('arrangePosts');
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

        visibled = results.length;
      }

      function changeCommerce(shId, postId, commerce) {
        console.debug('[ Engagehub Service ] ChangeCommerce');
        return $http.post(URL + CONFIG.backend.engagehub.postsModeration.replace(':id', streamId).replace(':postId', postId), {commerce: commerce})
          .then(function(data) {
            return data.data;
          });
      }

      function changeModeration(shId, postId, moderationStatus) {
        console.debug('[ Engagehub Service ] ChangeModeration');
        return $http.post(URL + CONFIG.backend.engagehub.postsModeration.replace(':id', streamId).replace(':postId', postId),
          {approved: moderationStatus})
          .then(function(data) {
            return data.data;
          });
      }

      function changePinned(shId, postId, pinnedStatus) {
        console.debug('[ Engagehub Service ] ChangePinned');
        return $http.post(URL + CONFIG.backend.engagehub.postsModeration.replace(':id', streamId).replace(':postId', postId),
          {pinned: pinnedStatus})
          .then(function(data) {
            return data.data;
          });
      }

      function changeFeatured(shId, postId, featuredStatus) {
        console.debug('[ Engagehub Service ] ChangeFeatured');
        return $http.post(URL + CONFIG.backend.engagehub.postsModeration.replace(':id', streamId).replace(':postId', postId),
          {featured: featuredStatus})
          .then(function(data) {
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
        return $http.delete(URL + CONFIG.backend.engagehub.base + '/' + sh._id);
      }

      function updateTag(shId, id, moderation) {
        console.debug('[ Engagehub Service ] Update tag');

        return $http.post(URL + CONFIG.backend.engagehub.base + '/' + streamId + '/keywords/' + id, {
          moderation: moderation
        });
      }

      function removeTagFromStream(sh, keyword) {
        console.debug('[ Engagehub Service ] RemoveTagFromStream');
        return $http.delete(URL + CONFIG.backend.engagehub.base + '/' + streamId + '/keywords/' + keyword._id)
          .then(function(data) {

            // Remove posts
            _.forEach([archived, results], function(e) {
              _.forEach(e, function(post) {
                if (post.source.channel === keyword.channel && post.source.value === keyword.value) {
                  removeLocalPost(post.id);
                }
              });
            });

            renderNewest();

            EngagehubEventsService.triggerEvent('arrangePosts');
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
        return $http.post(URL + CONFIG.backend.engagehub.update.replace(':id', streamId), sh)
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

          return getPosts({page: page, status: currentPostsStatus}).then(function(posts) {
            complete.value = true;
            _.forEach(posts, function(post) {

              if (_.indexOf(queue, post.id) === -1) {
                archived[post.id] = post;
                queue.push(post.id);
              }

            });

            if (queue.length > visibled) {
              renderVisibled(Math.min(step, queue.length - visibled));
            } else {
              EngagehubEventsService.triggerEvent('arrangePosts');
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

          EngagehubEventsService.triggerEvent('newPostsReady');
        }

        return $q.resolve();
      }

      // TODO: This is overkill, improve it to use renderVisibled here
      function renderNewest() {
        console.debug('[ Engagehub Service ] Render newest');

        complete.newest = false;

        getPosts({page: 0, status: currentPostsStatus, ammount: newest.value}).then(function(posts) {
          complete.newest = true;

          _.forEach(posts, function(post) {
            if (_.indexOf(queue, post.id) === -1) {
              results.unshift(post);
              archived[post.id] = post;
              queue.push(post.id);
              visibled++;
            }
          });

          resetPostsCounter();
          EngagehubEventsService.triggerEvent('arrangePosts');
        }).catch(function() {
          resetPostsCounter();
          complete.newest = true;
          EngagehubEventsService.triggerEvent('arrangePosts');
        });
      }

      function socketOnNewPost(data) {
        console.debug('[ Socket ] New post');

        if (currentPostsStatus === 1 || currentPostsStatus === 2) {
          newest.hidden += data.hidden;
          newest.approved += data.approved;

          // There is no post shown so reneder some feed
          if (visibled === 0) {
            renderNewest();
          }
        }
      }

      function socketOnUpdatePost(data) {
        console.debug('[ Socket ] Update post ' + data.id);

        var resultsPostIndex = _.findIndex(results, {id: data.id});
        var archivedPost = archived[data.id];
        var resultsPost = resultsPostIndex !== -1 ? results[resultsPostIndex] : null;

        if (archivedPost) {

          // Rmove local post
          if (archivedPost.approved !== data.approved) {
            if (resultsPost) {
              removeLocalPost(data.id);
            } else {
              removeLocalPost(data.id);
            }

            EngagehubEventsService.triggerEvent('arrangePosts');
            return;
          }

          // Update archived
          archivedPost.featured = data.featured;
          archivedPost.pinned = data.pinned;

          // Update results
          if (resultsPost) {
            resultsPost.featured = data.featured;
            resultsPost.pinned = data.pinned;
          }

          EngagehubEventsService.triggerEvent('arrangePosts');
        } else {
          // Post has arrived
          if (data.approved === currentPostsStatus) {
            getPost(data.id).then(function(post) {
              results.unshift(post);
              archived[post.id] = post;
              queue.push(post.id);
              visibled++;
              EngagehubEventsService.triggerEvent('arrangePosts');
            });
          }
        }
      }

      function socketOnDeletePost(id) {
        console.debug('[ Socket ] Delete post ' + id);

        removeLocalPost(id);

        EngagehubEventsService.triggerEvent('renderLayout');
      }

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
        currentSocket.on('socialhub:newPosts', socketOnNewPost);

        // Post update
        currentSocket.on('socialhub:updatePost', socketOnUpdatePost);

        // Post delete
        currentSocket.on('socialhub:deletePost', socketOnDeletePost);
      }

      function setMode(m) {
        mode = m;
        currentPostsStatus = 1;
      }

      // Executed on scope destroy
      function close() {
        console.debug('[ Engagehub Service ] Close');
        clearData();

        if (currentSocket) {
          currentSocket.disconnect();
        }
      }

      function resetPostsCounter() {
        if (currentPostsStatus === 1) {
          newest.hidden = 0;
        } else if (currentPostsStatus === 2) {
          newest.approved = 0;
        }
      }

      function getCurrentNewestCount() {
        if (currentPostsStatus === 1) {
          return newest.hidden;
        } else if (currentPostsStatus === 2) {
          return newest.approved;
        } else {
          return 0;
        }
      }

      function changeCurrentPostsStatus(status) {
        console.debug('[ Engagehub Service ] Change current posts status');
        currentPostsStatus = status || 1;

        resetPostsCounter();

        EngagehubEventsService.triggerEvent('arrangePosts');
      }

      function setCallbackRearrangePosts(callback) {
        EngagehubEventsService.setCallbackFor('arrangePosts', callback);
      }

      function setCallbackRenderLayout(callback) {
        EngagehubEventsService.setCallbackFor('renderLayout', callback);
      }

      function setCallbackNewPostsReady(callback) {
        EngagehubEventsService.setCallbackFor('newPostsReady', callback);
      }

      return {
        data: _data,
        setDomain: setDomain,
        clearData: clearData,
        getHubs: getHubs,
        getHub: getHub,
        getPosts: getPosts,
        removePost: removePost,
        callbacks:{
          set: {
            onRearrangePosts: setCallbackRearrangePosts,
            onNeedToRenderLayout: setCallbackRenderLayout,
            onNewPostsReady: setCallbackNewPostsReady
          }
        },
        changeCommerce: changeCommerce,
        changeModeration: changeModeration,
        changeFeatured: changeFeatured,
        changePinned: changePinned,
        select: selectSocialHub,
        sendSMS: sendSMS,
        streams: {
          create: createStreamGroup,
          remove: removeStreamGroup,
          tags: {
            update: updateTag,
            remove: removeTagFromStream
          },
          get: getStreams
        },
        update: update,

        setStreamId: setStreamId,
        renderVisibled: renderVisibled,
        renderNewest: _.throttle(renderNewest, 500),
        removeLocalPost: removeLocalPost,
        newest: newest,
        currentNewestCount: getCurrentNewestCount,
        complete: complete,
        results: {
          posts: results
        },
        setMode: setMode,
        mode: mode,
        close: close,
        changeCurrentPostsStatus: changeCurrentPostsStatus
      };
    }
  );
