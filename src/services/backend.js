'use strict';

angular.module('4screens.socialhub').factory('SocialhubBackendService',
  function( CONFIG, socketService, $http, $document, $window ) {
    var visibled = 0
      , pack = 50
      , complete = { value: false }
      , queue = []
      , newest = []
      , archived = {}
      , results = [];

    function getPost( postId ) {
      if( !postId ) {
        throw 'PostId has not been set!';
      }

      return $http.get( CONFIG.backend.domain.replace( ':subdomain', '' ) + CONFIG.frontend.socialhub.post.replace( ':id', CONFIG.frontend.socialhub.id ).replace( ':postid', postId ) ).then(function( res ) {
        if ( res.status === 200 ) {
          return res.data;
        }
        return $q.reject( res.data );
      });
    }

    function getPosts( params ) {
      params = params || {};
      return $http.get( CONFIG.backend.domain.replace( ':subdomain', '' ) + CONFIG.frontend.socialhub.posts.replace( ':id', CONFIG.frontend.socialhub.id ), { params: params } ).then(function( res ) {
        if ( res.status === 200 ) {
          return res.data;
        }
        return $q.reject( res.data );
      });
    }

    function renderVisibled( step, reload ) {
      visibled += step || 0;
      reload = reload || false;

      if( visibled > _.size( archived ) && complete.value === false ) {
        getPosts({ page: Math.floor( _.size( archived ) / pack ) }).then(function( posts ) {
          if( posts.length < 50 ) {
            complete.value = true;
          }

          _.forEach( posts, function( post ) {
            if( _.findIndex( queue, post._id ) === -1 ) {
              archived[ post._id ] = post;
              queue.push( post._id );
            }
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

        if( reload === false ) {
          $document.triggerHandler('isotopeArrange');
        } else {
          $document.triggerHandler('isotopeReload');
        }

        if( complete.value === true && queue.length === visibled ) {
          $document.unbind('scroll');
        }
      }
    }

    function renderNewest() {
      queue = newest.concat( queue );
      queue = queue.slice( 0, visibled );

      // Najszybszy znany mi sposób wyczyszczenia tablicy
      // nie usuwając samej tablicy.
      // newest = [] 'ubija' watch angulara
      while (newest.length > 0) {
        newest.pop();
      }

      renderVisibled( 0, true );
    }

    socketService.get( CONFIG.frontend.socialhub.namespace + CONFIG.frontend.socialhub.id ).on( 'socialhub:newPost', function( postId ) {
      getPost( postId ).then(function( post ) {
        if( _.findIndex( queue, postId ) === -1 ) {
          archived[ post._id ] = post;
          if( $window.scrollY === 0 && newest.length === 0 ) {
            queue.unshift( post._id );
            visibled++;
            renderVisibled();
          } else {
            newest.unshift( post._id );
          }
        }
      }).catch(function( err, b, c, d ) {
        if( err.status === 404 || err.status === 500 ) {
          _.remove( queue, function( v ) {
            return v === postId;
          } );
          _.remove( results, function( v ) {
            return v._id === postId;
          } );
          $document.triggerHandler('isotopeReload');
        }
      });
    } );

    // public API
    return {
      renderVisibled: renderVisibled,
      renderNewest: renderNewest,
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
