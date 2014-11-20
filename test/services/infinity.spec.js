'use strict';

describe('infinity service', function() {

  var SocialhubInfinityService
    , SocialhubBackendServiceMock;

  beforeEach( module('4screens.socialhub') );

  // Here we create a dummy/mock service, to determine if they were caused.
  beforeEach( function() {
    SocialhubBackendServiceMock = {};
    module(function( $provide ) {
      $provide.value( 'SocialhubBackendService', SocialhubBackendServiceMock );
    });
  } );

  beforeEach( inject(function( _SocialhubInfinityService_ ) {
    SocialhubInfinityService = _SocialhubInfinityService_;
  }));

  it( 'should have scrollHandler method', function() {
    expect( SocialhubInfinityService.scrollHandler ).not.toBeUndefined();
  });

  it( 'should have enable method', function() {
    expect( SocialhubInfinityService.enable ).not.toBeUndefined();
  });

});
