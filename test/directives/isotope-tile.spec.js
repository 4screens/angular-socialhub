'use strict';

describe('isotope tile directive', function() {

  var SocialhubIsotopeServiceMock
    , $scope, $compile;

  beforeEach( module('4screens.socialhub') );

  // Here we create a dummy/mock service, to determine if they were caused.
  beforeEach( function() {
    SocialhubIsotopeServiceMock = {
      added : false,
      addItem: function() {
        SocialhubIsotopeServiceMock.added = true;
      }
    }
    module(function( $provide ) {
      $provide.value( 'SocialhubIsotopeService', SocialhubIsotopeServiceMock );
    });
  } );

  beforeEach( inject(function( _$rootScope_, _$compile_ ) {
    $scope = _$rootScope_;
    $compile = _$compile_;
  }) );

  function compile( markup ) {
    var element;

    markup = markup || '<div class="socialhub-isotope-tile-directive"></div>';
    element = $compile( markup )( $scope );
    $scope.$digest();
    return element;
  }

  // proven that directive socialhubIsotopeTileDirective exist
  // and has been triggered
  it( 'should execute addItem method in isotope service', function() {
    expect( SocialhubIsotopeServiceMock.added ).toBe( false );
    compile();
    expect( SocialhubIsotopeServiceMock.added ).toBe( true );
  });

});
