/*
 4screens-socialhub v0.0.1
 (c) 2014 Nopattern sp. z o.o.
 License: proprietary
*/
'use strict';

angular.module('4screens.socialhub',[]);

angular.module('4screens.socialhub').run(['$templateCache', function($templateCache) {
  $templateCache.put('views/socialhub/main.html',
    '<div class="masonry__iframe" data-ng-if="showSocial"><div class="masonry__iframe--navigation"><a href data-ng-click="closeSocial()" class="masonry__iframe--close"><span class="fa-stack fa-lg fa-stack-2x"><i class="fa fa-circle fa-stack-2x fa-inverse"></i> <i class="fa fa-times fa-stack-1x"></i></span></a></div><iframe width="100%" height="100%" data-ng-src="{{ datasrc }}" frameborder="0"></iframe><div class="masonry__iframe--background"></div></div><div><div class="masonry__newest" data-ng-if="!!sh.newest.posts.length" data-ng-click="sh.renderNewest()">Dodano nowych posów: {{ sh.newest.posts.length }}</div></div><div class="masonry socialhub-isotope-directive"><article class="masonry__tile socialhub-isotope-tile-directive" data-ng-include="\'views/socialhub/tile-\' + post.source + \'.html\'" data-ng-repeat="post in sh.results.posts track by post._id"></article></div><div class="masonry__preloader" data-ng-if="!sh.complete.value">Wczytywanie postów...</div>');
}]);

angular.module('4screens.socialhub').run(['$templateCache', function($templateCache) {
  $templateCache.put('views/socialhub/tile-facebook.html',
    '<figure data-ng-click="openSocial(post._id)"><div class="masonry__tile--social" data-ng-class="\'masonry__tile--social-\'+ post.source"><i class="fa" data-ng-class="\'fa-\'+ post.source"></i></div><div class="masonry__tile--image" data-ng-show="post.type==\'photo\' || post.type ==\'video\'"><img ng-src="{{post.photo.source}}" alt data-ng-if="post.type==\'photo\'"> <img ng-src="{{post.video.image}}" alt data-ng-if="post.type==\'video\'"> <span class="fa-stack fa-lg" data-ng-if="post.type==\'video\'"><i class="fa fa-circle fa-stack-2x"></i> <i class="fa fa-play fa-stack-1x fa-inverse"></i></span></div><figcaption class="masonry__tile--signature"><div class="masonry__tile--signature-avatar"><img data-ng-src="{{post.from.image}}" alt> <span class="name" ng-bind-html="post.from.name"></span> <span class="time" am-time-ago="post.created_time"></span></div><p class="masonry__tile--signature-caption" ng-bind-html="post.message | emoji"></p></figcaption></figure>');
}]);

angular.module('4screens.socialhub').run(['$templateCache', function($templateCache) {
  $templateCache.put('views/socialhub/tile-instagram.html',
    '<figure data-ng-click="openSocial(post._id)"><div class="masonry__tile--social" data-ng-class="\'masonry__tile--social-\'+ post.source"><i class="fa" data-ng-class="\'fa-\'+ post.source"></i></div><div class="masonry__tile--image" data-ng-show="post.images"><img ng-src="{{post.images.standard_resolution.url}}" alt> <span class="fa-stack fa-lg" data-ng-if="post.type==\'video\'"><i class="fa fa-circle fa-stack-2x"></i> <i class="fa fa-play fa-stack-1x fa-inverse"></i></span></div><figcaption class="masonry__tile--signature"><div class="masonry__tile--signature-avatar"><img data-ng-src="{{post.user.profile_picture}}" alt> <span class="name" ng-bind-html="post.user.full_name | emoji"></span> <span class="time" am-time-ago="post.created_time"></span></div><p class="masonry__tile--signature-caption" ng-bind-html="post.caption | emoji"></p></figcaption></figure>');
}]);

angular.module('4screens.socialhub').run(['$templateCache', function($templateCache) {
  $templateCache.put('views/socialhub/tile-twitter.html',
    '<figure data-ng-click="openSocial(post._id)"><div class="masonry__tile--social" data-ng-class="\'masonry__tile--social-\'+ post.source"><i class="fa" data-ng-class="\'fa-\'+ post.source"></i></div><div class="masonry__tile--image" data-ng-show="post.images"><img ng-src="{{post.images.media_url}}" alt> <span class="fa-stack fa-lg" data-ng-if="post.type==\'video\'"><i class="fa fa-circle fa-stack-2x"></i> <i class="fa fa-play fa-stack-1x fa-inverse"></i></span></div><figcaption class="masonry__tile--signature"><div class="masonry__tile--signature-avatar"><img data-ng-src="{{post.user_image_url}}" alt> <span class="name" ng-bind-html="post.user"></span> <span class="time" am-time-ago="post.created_time"></span></div><p class="masonry__tile--signature-caption" ng-bind-html="post.caption | emoji"></p></figcaption></figure>');
}]);

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

    $document.bind('isotopeReload', function() {
      $timeout(function() {
        isotope.reloadItems();
        isotope.arrange();
      }, 100 );
    });

    function init( element ) {
      container = element;
      instance = new Isotope( element[0], options );
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
  ["CONFIG", "socketService", "$http", "$document", "$window", function( CONFIG, socketService, $http, $document, $window ) {
    var visibled = 1
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

    socketService.get( CONFIG.socialhub.namespace + CONFIG.socialhub.id ).on( 'socialhub:newPost', function( postId ) {
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
  }]
);
