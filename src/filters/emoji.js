'use strict';

angular.module('4screens.socialhub').filter( 'emoji',
  function( $sanitize ) {
    var cache = {};

    return function( input ) {
      var out = '';

      if( typeof input === 'undefined' || input === null ) {
        return '';
      }
      if( cache[input] ) {
        return cache[input];
      }

      input = input || '';
      out = $sanitize( emojione.toImage( input ) );
      cache[input] = out;
      return out;
    };
  }
);
