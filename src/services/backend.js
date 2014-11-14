'use strict';

angular.module('4screens.socialhub').factory('SocialhubBackendService',
  function( CONFIG, socketService, $http, $document ) {
    var visibled = 1
      , pack = 50
      , queue = []
      , archived = {}
      , results = [];

    function getPost( postId ) {
      if( !postId ) {
        throw 'PostId has not been set!';
      }

      return $http.get( CONFIG.backend.domain + CONFIG.socialhub.post.replace( ':id', CONFIG.socialhub.id ).replace( ':postid', postId ) ).then(function( res ) {
        if ( res.status === 200 ) {
          return res.data;
        }
        return $q.reject( res.data );
      });
    }

    function getPosts( params ) {
      params = params || {};

      return $http.get( CONFIG.backend.domain + CONFIG.socialhub.posts.replace( ':id', CONFIG.socialhub.id ), { params: params } ).then(function( res ) {
        if ( res.status === 200 ) {
          return res.data;
        }
        return $q.reject( res.data );
      });
    }

    function renderVisibled( step ) {
      visibled += step || 0;

      if( visibled > _.size( archived ) ) {
        getPosts({ page: Math.floor( _.size( archived ) / pack ) }).then(function( posts ) {
          _.forEach( posts, function( post ) {
            archived[ post._id ] = post;
            queue.push( post._id );
          } );
          if( queue.length > visibled ) {
            renderVisibled();
          }
        });
      } else {
        _.each( queue.slice( 0, visibled ), function( postId, postIndex ) {
          if( _.findIndex( results, { _id: postId } ) === -1 ) {
            results.splice( postIndex, 0, archived[ postId ] );
          }
        } );
        _.remove( results, function( postId, postIndex ) {
          return postIndex >= visibled;
        });
        $document.triggerHandler('isotopeArrange');
      }
    }

    socketService.get( CONFIG.socialhub.namespace + CONFIG.socialhub.id ).on( 'socialhub:newPost', function( postId ) {
      getPost( postId ).then(function( post ) {
        if( _.findIndex( queue, postId ) === -1 ) {
          archived[ post._id ] = post;
          queue.unshift( post._id );
          queue.pop();
          renderVisibled();
        }
      }).catch(function( err, b, c, d ) {
        if( err.status === 404 || err.status === 500 ) {
          _.remove( queue, function( v ) {
            return v === postId;
          } );
          _.remove( results, function( v ) {
            return v._id === postId;
          } );
          $document.triggerHandler('isotopeRemove');
        }
      });
    } );

    return {
      renderVisibled: renderVisibled,
      results: {
        posts: results
      }
    };
  }
);
