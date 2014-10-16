/*
 4screens-socialhub v0.0.1
 (c) 2014 Nopattern sp. z o.o.
 License: proprietary
*/
'use strict';

angular.module('4screens.socialhub',[]);

'use strict';

angular.module('4screens.socialhub').directive( 'socialhubIsotopeDirective',
  ["$rootScope", "$timeout", function( $rootScope, $timeout ) {
    var _link = function( scope, element, attrs ) {
      $rootScope.$on( 'SocialhubIsotopeDirectiveInitialize', function() {
        $timeout(function() {
          scope.iso = new Isotope( element[0], {
            // options
            itemSelector: '.socialhub-isotope-tile-directive'
          } );
          $rootScope.$emit('SocialhubIsotopeDirectiveImagesLoaded');
        });
      } );
      $rootScope.$on( 'SocialhubIsotopeDirectiveImagesLoaded', function() {
        $timeout(function() {
          var imgLoad = imagesLoaded( element );

          imgLoad.on( 'always', function() {
            $rootScope.$emit('SocialhubIsotopeDirectiveArrange');
          } );
        });
      } );
      $rootScope.$on( 'SocialhubIsotopeDirectiveArrange', function() {
        $timeout(function() {
          scope.iso.reloadItems();
          scope.iso.arrange();
        });
      } );
    };

    return {
      restrict: 'C',
      link: _link
    }
  }]
);

'use strict';

angular.module('4screens.socialhub').directive( 'socialhubIsotopeTileDirective',
  ["$rootScope", "$timeout", function( $rootScope, $timeout ) {
    var _link = function( scope, element, attrs ) {
      scope.$watch( '$last', function( v ) {
        if( v ) {
          $timeout(function() {
            // This code will run after template has been loaded
            // and transformed by directives
            $timeout(function() {
              // and properly rendered by the browser
              $rootScope.$emit('SocialhubIsotopeDirectiveInitialize');
            });
          });
        }
      });
    };

    return {
      restrict: 'C',
      link: _link
    }
  }]
);

'use strict';

angular.module('4screens.socialhub').factory('SocialhubBackendService',
  ["CONFIG", "socketService", "$rootScope", "$http", "$q", function( CONFIG, socketService, $rootScope, $http, $q ) {
    var
      socket = socketService.get( CONFIG.socialhub.namespace + CONFIG.socialhub.id ),
      config = {
         post: CONFIG.backend.domain + CONFIG.socialhub.post.replace( ':id', CONFIG.socialhub.id ),
         posts: CONFIG.backend.domain + CONFIG.socialhub.posts.replace( ':id', CONFIG.socialhub.id )
      },
      results = {};

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

    socket.on( 'socialhub:newPost', function( postId ) {
      getPost( postId ).then(function( post ) {
        results.posts.unshift( post );
        $rootScope.$emit('SocialhubIsotopeDirectiveImagesLoaded');
      }).catch(function( err ) {
        if( err.status === 404 ) {
          _.remove( results.posts, { _id: postId } );
          $rootScope.$emit('SocialhubIsotopeDirectiveImagesLoaded');
        }
      });
    } );

    return {
      results: results,
      getLatest: function( page ) {
        page = page || 0;

        return getPosts({ 'page': page }).then(function( posts ) {
          results.posts = ( results.posts || [] ).concat( posts );
          return posts;
        });
      }
    };
  }]
);
