angular
  .module('4screen.engagehub.isotope', [])
  .directive('engagehubIsotope', function(EngagehubIsotopeService, EngagehubInfinityService, $window, $document) {
      'use strict';
      var _link = function(scope, element) {
        //EngagehubIsotopeService.clean();
        EngagehubIsotopeService.init(element);

        $document.unbind('scroll');
        $document.bind('scroll', EngagehubInfinityService.scrollHandler(scope, element, $window));

        scope.$on('$destroy', function() {
          $document.unbind('scroll');
        });
      };

      return {
        restrict: 'C',
        link: _link
      };
    }
  )
  .directive('engagehubIsotopeTile', function(EngagehubIsotopeService) {
      'use strict';

      var _link = function(scope, element) {
        EngagehubIsotopeService.addItem(element, scope.$index);
      };

      return {
        restrict: 'C',
        link: _link
      };
    }
  )
  .factory('EngagehubIsotopeService',
    function(EngagehubInfinityService, $rootScope, $document, $timeout) {
      'use strict';

      var instance = null, container = null, filter = [], options = {
        itemSelector: '.engagehub-isotope-tile',
        transitionDuration: '0.1s',
        percentPosition: true,
        masonry: {
          columnWidth: '.engagehub-isotope-tile.not-featured'
        },
        getSortData: {
          order: '[data-order] parseInt'
        },
        sortAscending: false,
        sortBy: 'order',
        // sortAscending: false,
        filter: function(item) {
          return item.className.indexOf('filter');
        }
      };

      var unsubscribeIsotopeArrange = $rootScope.$on('isotopeArrange', function() {
        console.debug('[ Isotope ] On Arrange');
        $timeout(function() {
          $timeout(function() {
            $timeout(function() {
              //$rootScope.$applyAsync(function() {
                if (instance) {
                  instance.arrange(options);
                  instance.updateSortData();
                }

                EngagehubInfinityService.enable();
                // $document.triggerHandler('scroll');
              // });
            });
          });
        });
      });

      var unsubscribeIsotope = $rootScope.$on('isotopeReload', function() {
        console.debug('[ Isotope ] On Reloaded');
        $timeout(function() {
          $timeout(function() {
            $timeout(function() {
              if (instance) {

                instance.reloadItems();
                instance.arrange(options);
                instance.updateSortData();
              }

              EngagehubInfinityService.enable();
              // $document.triggerHandler('scroll');
            });
          });
        });
      });

      function init(element) {
        console.debug('[ Isotope ] Init');
        container = element;
        instance = new Isotope(element[0], options);
        window.isotope = instance;
      }

      function addItem(element, index) {
        console.debug('[ Isotope ] Add item');
        $timeout(function() {
          if (index === 0) {
            instance.prepended(element[0]);
          } else {
            instance.appended(element[0]);
          }
        });
      }

      function clean() {
        console.debug('[ Isotope ] Clean');
        unsubscribeIsotopeArrange();
        unsubscribeIsotopeReload();
        unsubscribeIsotopeFilter();

        instance = null;
      }

      // public API
      return {
        init: init,
        addItem: addItem,
        clean: clean
      };
    }
  );
