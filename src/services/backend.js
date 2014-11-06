'use strict';

angular.module('4screens.socialhub').factory('SocialhubBackendService',
  function( CONFIG, socketService, $timeout, $http, $q ) {
    var
      socket = socketService.get( CONFIG.socialhub.namespace + CONFIG.socialhub.id ),
      isotope = {
        instance: null,
        container: null,
        method: {},
        settings: {
          classNameTile: '.socialhub-isotope-tile-directive'
        }
      },
      config = {
         post: CONFIG.backend.domain + CONFIG.socialhub.post.replace( ':id', CONFIG.socialhub.id ),
         posts: CONFIG.backend.domain + CONFIG.socialhub.posts.replace( ':id', CONFIG.socialhub.id )
      },
      archived = {
        pack: 50,
        visibled: 0,
        priority: [],
        posts: {}
      },
      results = {
        posts: []
      };

    isotope.method.init = function( element ) {
      isotope.container = element;
      isotope.instance = new Isotope( element[0], {
        // options
        itemSelector: isotope.settings.classNameTile
      } );
    };

    isotope.method.arrange = _.debounce( function() {
      isotope.instance.reloadItems();
      isotope.instance.arrange();
      isotope.method.loadImage(function() {
        isotope.instance.arrange();
      });
    }, 100 );

    isotope.method.loadImage = function( callback ) {
      var loadImages = imagesLoaded( isotope.container );

      loadImages.on( 'always', function() {
        callback();
      } );
    };
    function getPost( postId ) {
      if( !postId ) {
        throw 'PostId has not been set!';
      }

      return $http.get( config.post.replace( ':postid', postId ) ).then(function( res ) {
        if ( res.status === 200 ) {
          return res.data;
        }
        return $q.reject( res.data );
      });
    }

    function getPosts( params ) {
      params = params || {};

      return $http.get( config.posts, params ).then(function( res ) {
        if ( res.status === 200 ) {
          return res.data;
        }
        return $q.reject( res.data );
      });
    }

    function getResults() {

      if( archived.visibled > _.size( archived.posts ) ) {
        getPosts({ page: Math.floor( _.size( archived.posts ) / archived.pack ) }).then(function( posts ) {
          _.forEach( posts, function( post ) {
            archived.posts[ post._id ] = post;
            archived.priority.push( post._id );
          } );
          getResults();
        });
      } else {
        _.each( archived.priority.slice( 0, archived.visibled ), function( postId, postIndex ) {
          if( _.findIndex( results.posts, { _id: postId } ) === -1 ) {
            results.posts.splice( postIndex, 0, archived.posts[ postId ] );
          }
        } );
        _.remove( results.posts, function( postId, postIndex ) {
          return postIndex >= archived.visibled;
        });
        isotope.method.arrange();
      }
    }

    socket.on( 'socialhub:newPost', function( postId ) {
      getPost( postId ).then(function( post ) {
        if( _.findIndex( archived.priority, postId ) === -1 ) {
          archived.posts[ post._id ] = post;
          archived.priority.unshift( post._id );
          getResults();
        }
      }).catch(function( err ) {
        if( err.status === 404 ) {
          _.remove( archived.priority, function( v ) {
            return v == postId;
          } );
          _.remove( results.posts, function( v ) {
            return v._id == postId;
          } );
          getResults();
        }
      });
    } );

    return {
      isotope: {
        init: isotope.method.init,
        arrange: isotope.method.arrange
      },
      results: results,
      getResults: getResults
    };
  }
);
