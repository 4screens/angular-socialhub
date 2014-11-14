/*
 4screens-socialhub v0.0.1
 (c) 2014 Nopattern sp. z o.o.
 License: proprietary
*/
'use strict';

angular.module('4screens.socialhub',[]);

'use strict';

angular.module('4screens.socialhub').directive( 'socialhubIsotopeDirective',
  ["SocialhubIsotopeService", "SocialhubInfinityService", "$window", "$document", function( SocialhubIsotopeService, SocialhubInfinityService, $window, $document ) {
    var _link = function( scope, element ) {
      SocialhubIsotopeService.init( element );
      $document.unbind('scroll');
      $document.bind( 'scroll', SocialhubInfinityService.scrollHandler( scope, element, $window ) );
    };

    return {
      restrict: 'C',
      link: _link
    }
  }]
);

'use strict';

angular.module('4screens.socialhub').directive( 'socialhubIsotopeTileDirective',
  ["SocialhubIsotopeService", function( SocialhubIsotopeService ) {
    var _link = function( scope, element ) {
      SocialhubIsotopeService.addItem( element, scope.$index );
    };

    return {
      restrict: 'C',
      link: _link
    }
  }]
);

'use strict';

angular.module('4screens.socialhub').factory('SocialhubInfinityService',
  ["SocialhubBackendService", function( SocialhubBackendService ) {
    var scrollHandler
      , available = true
      , offset = 800
      , step = 1;

    function enable() {
      available = true;
    }

    scrollHandler = _.throttle( function( s, e, w ) {
      return function() {
        if( w.innerHeight - e.offset().top + w.scrollY + offset >= e.height() ) {
          if( !!available ) {
            available = false;
            SocialhubBackendService.renderVisibled( step );
          }
        }
      }
    }, 500 );

    // public API
    return {
      scrollHandler: scrollHandler,
      enable: enable
    }
  }]
);

'use strict';

angular.module('4screens.socialhub').factory('SocialhubIsotopeService',
  ["SocialhubInfinityService", "$document", "$timeout", function( SocialhubInfinityService, $document, $timeout ) {
    var instance = null
      , container = null
      , options = {
        itemSelector: '.socialhub-isotope-tile-directive',
        transitionDuration: '0.2s'
      };

    $document.bind('isotopeArrange', function() {
      $timeout(function() {
        arrange();
      });
    });
    $document.bind('isotopeRemove', function() {
      $timeout(function() {
        isotope.reloadItems();
        isotope.arrange();
      });
    });

    function init( element ) {
      container = element;
      instance = new Isotope( element[0], options );
      window.isotope = instance;
    }

    function addItem( element, index ) {
      $timeout(function() {
        if( index === 0 ) {
          instance.prepended( element[0] );
        } else {
          instance.appended( element[0] );
        }
      });
    }

    var arrange = _.debounce(function() {
      loadImage(function() {
        SocialhubInfinityService.enable();
        $document.triggerHandler('scroll');
      });
    });

    function loadImage( callback ) {
      var loadImages = imagesLoaded( container );

      $timeout(function() {
        instance.arrange();
      });

      loadImages.on( 'always', function() {
        $timeout(function() {
          instance.arrange();
          callback.apply( this, arguments );
        });
      } );
    }

    // public API
    return {
      init: init,
      addItem: addItem,
      arrange: arrange
    }
  }]
);

'use strict';

angular.module('4screens.socialhub').factory('SocialhubBackendService',
  ["CONFIG", "socketService", "$http", "$document", function( CONFIG, socketService, $http, $document ) {
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
  }]
);
