'use strict';

describe('isotope directive', function() {

  var SocialhubIsotopeServiceMock
    , SocialhubInfinityServiceMock
    , $scope, $compile, $document;

  beforeEach( module('4screens.socialhub') );

  // Here we create a dummy/mock service, to determine if they were caused.
  beforeEach( function() {
    SocialhubIsotopeServiceMock = {
      initialized : false,
      init: function() {
        SocialhubIsotopeServiceMock.initialized = true;
      }
    }
    SocialhubInfinityServiceMock = {
      scrollTriggered: false,
      scrollHandler: function() {
        return function() {
          SocialhubInfinityServiceMock.scrollTriggered = true;
        };
      }
    }
    module(function( $provide ) {
      $provide.value( 'SocialhubIsotopeService', SocialhubIsotopeServiceMock );
      $provide.value( 'SocialhubInfinityService', SocialhubInfinityServiceMock );
    });
  } );

  beforeEach( inject(function( _$document_, _$rootScope_, _$compile_ ) {
    $document = _$document_;
    $scope = _$rootScope_;
    $compile = _$compile_;
  }) );

  function compile( markup ) {
    var element;

    markup = markup || '<div class="socialhub-isotope-directive"></div>';
    element = $compile( markup )( $scope );
    $scope.$digest();
    return element;
  }

  // also proven that directive socialhubIsotopeDirective exists and was initialized
  it( 'should initialize isotope service', function() {
    expect( SocialhubIsotopeServiceMock.initialized ).toBe( false );
    compile();
    expect( SocialhubIsotopeServiceMock.initialized ).toBe( true );
  });

  it( 'should bind scroll event in $document', function() {
    expect( SocialhubInfinityServiceMock.scrollTriggered ).toBe( false );
    compile();
    $document.triggerHandler('scroll');
    expect( SocialhubInfinityServiceMock.scrollTriggered ).toBe( true );
  });

});
