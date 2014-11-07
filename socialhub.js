/*
 4screens-socialhub v0.0.1
 (c) 2014 Nopattern sp. z o.o.
 License: proprietary
*/
'use strict';

angular.module('4screens.socialhub',[]);

'use strict';

angular.module('4screens.socialhub').directive( 'socialhubIsotopeDirective',
  ["$window", "$document", "SocialhubBackendService", function( $window, $document, SocialhubBackendService ) {
    var _link = function( scope, element ) {
      SocialhubBackendService.isotope.init( element );
      $document.bind( 'scroll', SocialhubBackendService.infinity.scrollHandler( scope, element, $window ) );
    };

    return {
      restrict: 'C',
      link: _link
    }
  }]
);

'use strict';

angular.module('4screens.socialhub').directive( 'socialhubIsotopeTileDirective',
  ["SocialhubBackendService", function( SocialhubBackendService ) {
    var _link = function( scope, element ) {
      SocialhubBackendService.isotope.addItem( element );
      SocialhubBackendService.isotope.arrange();
    };

    return {
      restrict: 'C',
      link: _link
    }
  }]
);

'use strict';

angular.module('4screens.socialhub').factory('SocialhubBackendService',
  ["CONFIG", "socketService", "$document", "$timeout", "$http", "$q", function( CONFIG, socketService, $document, $timeout, $http, $q ) {
    var
      socket = socketService.get( CONFIG.socialhub.namespace + CONFIG.socialhub.id ),
      isotope = {
        instance: null,
        container: null,
        items: [],
        method: {},
        settings: {
          classNameTile: '.socialhub-isotope-tile-directive'
        }
      },
      infinity = {
        enabled: true,
        method: {},
        settings: {
          offset: 200,
          step: 1
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

    isotope.method.addItem = function( element ) {
      isotope.items.push( element[0] );
    };

    isotope.method.clearItems = function() {
      isotope.items = [];
    };

    isotope.method.arrange = _.debounce( function() {
      isotope.instance.insert( isotope.items );
      isotope.method.clearItems();
      isotope.method.loadImage(function() {
        infinity.enabled = true;
        $document.triggerHandler('scroll');
      });
    }, 100 );

    isotope.method.loadImage = function( callback ) {
      var loadImages = imagesLoaded( isotope.container );

      loadImages.on( 'always', function() {
        callback();
      } );
    };

    infinity.method.step = function() {
      if( !!infinity.enabled ) {
        archived.visibled += infinity.settings.step;
        infinity.enabled = false;
        getResults();
      }
    };

    infinity.method.scrollHandler = _.throttle( function( s, e, w ) {
      return function() {
        if( w.innerHeight - e.offset().top + w.scrollY + infinity.settings.offset >= e.height() ) {
          $timeout(function() {
            infinity.method.step();
          });
        }
      }
    }, 500 );

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

      return $http.get( config.posts, { params: params } ).then(function( res ) {
        if ( res.status === 200 ) {
          return res.data;
        }
        return $q.reject( res.data );
      });
    }

    function getResults() {
      if( infinity.visibled === 0 ) {
        return;
      }

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
        addItem: isotope.method.addItem,
        arrange: isotope.method.arrange
      },
      infinity: {
        scrollHandler: infinity.method.scrollHandler
      },
      results: results,
      getResults: getResults
    };
  }]
);
