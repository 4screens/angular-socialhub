'use strict';

describe('isotope service', function() {

  var SocialhubIsotopeService
    , SocialhubInfinityServiceMock
    , $element, $scope, $compile, $timeout;

  beforeEach( module('4screens.socialhub') );

  // Here we create a dummy/mock service, to determine if they were caused.
  beforeEach( function() {
    SocialhubInfinityServiceMock = {
      scrollHandler: function() {}
    };
    module(function( $provide ) {
      $provide.value( 'SocialhubInfinityService', SocialhubInfinityServiceMock );
    });
  } );

  beforeEach( inject(function( _SocialhubIsotopeService_, _$rootScope_, _$compile_, _$timeout_ ) {
    SocialhubIsotopeService = _SocialhubIsotopeService_;
    $scope = _$rootScope_;
    $compile = _$compile_;
    $timeout = _$timeout_;
  }));

  function compile( markup ) {
    $element = $compile( markup )( $scope );
    $scope.$digest();
  }

  it( 'should have init method', function() {
    expect( SocialhubIsotopeService.init ).not.toBeUndefined();
  });

  it( 'should initialize Isotope library', function() {
    compile(
      '<div class="socialhub-isotope-directive"></div>'
    );
    expect( $element.css('position') ).toBe('relative');
  });

  it( 'should initialize Isotope items', function() {
    compile(
      '<div class="socialhub-isotope-directive">' +
        '<div class="socialhub-isotope-tile-directive">1</div>' +
        '<div class="socialhub-isotope-tile-directive">2</div>' +
        '<div class="socialhub-isotope-tile-directive">3</div>' +
        '<div class="socialhub-isotope-tile-directive">4</div>' +
        '<div class="socialhub-isotope-tile-directive">5</div>' +
      '</div>'
    );
    expect( $element.find('div').length ).toBe( 5 );
    expect( angular.element( $element.find('div')[0] ).css('position') ).toBe('absolute');
  });

  it( 'should have addItem method', function() {
    expect( SocialhubIsotopeService.addItem ).not.toBeUndefined();
  });

  it( 'should add items to Isotope object', function() {
    // Here we create a dummy object, to determine activity.
    window.IsotopeProperly = window.Isotope;
    window.IsotopeProperty = {
      prepended: null,
      appended: null
    };
    window.Isotope = function Isotope( container, options ) {
      this.container = container;
      this.options = options;
    };
    Isotope.prototype.prepended = function( element ) {
      IsotopeProperty.prepended = element.innerText;
    };
    Isotope.prototype.appended = function( element ) {
      IsotopeProperty.appended = element.innerText;
    };

    compile(
      '<div class="socialhub-isotope-directive">' +
        '<div class="socialhub-isotope-tile-directive" data-ng-repeat="value in [1,2]">{{ value }}</div>' +
      '</div>'
    );

    Isotope = IsotopeProperly;
    $timeout.flush();

    expect( IsotopeProperty.prepended ).toBe('1');
    expect( IsotopeProperty.appended ).toBe('2');
  });

  it( 'should have arrange method', function() {
    expect( SocialhubIsotopeService.arrange ).not.toBeUndefined();
  });

});
