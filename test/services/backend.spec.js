'use strict';

// @todo Add properly backend service tests...
describe('backend service', function() {

  var SocialhubBackendService
    , CONFIGMock
    , socketServiceMock;

  beforeEach( module('4screens.socialhub') );

  // Here we create a dummy/mock service, to determine if they were caused.
  beforeEach( function() {
    CONFIGMock = {
      'socialhub': {
        'namespace': '/4screens/socialhub/'
      }
    };
    socketServiceMock = {
      get: function() {
        return socketServiceMock;
      },
      on: function() {
        return socketServiceMock;
      }
    };
    module(function( $provide ) {
      $provide.value( 'CONFIG', CONFIGMock );
      $provide.value( 'socketService', socketServiceMock );
    });
  } );

  beforeEach( inject(function( _SocialhubBackendService_, _CONFIG_, _socketService_ ) {
    SocialhubBackendService = _SocialhubBackendService_;
  }));

  it( 'should have renderVisibled method', function() {
    expect( SocialhubBackendService.renderVisibled ).not.toBeUndefined();
  });

  it( 'should have renderNewest method', function() {
    expect( SocialhubBackendService.renderNewest ).not.toBeUndefined();
  });

  it( 'should have newest object', function() {
    expect( SocialhubBackendService.newest ).not.toBeUndefined();
  });

  it( 'should have complete method', function() {
    expect( SocialhubBackendService.complete ).not.toBeUndefined();
  });

  it( 'should have results object', function() {
    expect( SocialhubBackendService.results ).not.toBeUndefined();
  });

});
