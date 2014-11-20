/**
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE' or 'LICENSE.txt', which is part of this source code package.
 */
var gulp = require('gulp')
, plugins = require('gulp-load-plugins')()
, pkg = require('./package.json')
, fs = require('fs')

, VIEWS = [
    './src/views/main.html',
    './src/views/tile-facebook.html',
    './src/views/tile-instagram.html',
    './src/views/tile-twitter.html'
  ]
, FILES = [
    './src/app.js',
    './src/views.js',
    './src/directives/isotope.js',
    './src/directives/isotope-tile.js',
    './src/services/infinity.js',
    './src/services/isotope.js',
    './src/services/backend.js'
  ]
, BANNER = './src/header.txt'
, MAIN = 'socialhub.js';

gulp.task( 'clean:tmp', function() {
  return gulp.src( '.tmp', { read: false } )
    .pipe( plugins.clean() );
} );

gulp.task( 'clean:views', ['copy'], function() {
  return gulp.src( './src/views.js', { read: false } )
    .pipe( plugins.clean() );
} );

gulp.task( 'minify:html', ['clean:tmp'], function() {
  return gulp.src( VIEWS )
    .pipe( plugins.minifyHtml({
      empty: true,
      quotes: true
    }) )
    .pipe( gulp.dest('.tmp/views') );
} );

gulp.task( 'html2js', ['minify:html'], function() {
  return gulp.src( '.tmp/views/*.html' )
    .pipe( plugins.ngHtml2js({
        moduleName: pkg.name.replace( '-', '.' ),
        declareModule: false,
        prefix: 'views/%s/'.replace( '%s', pkg.name.split('-')[1] )
    }) )
    .pipe( gulp.dest('.tmp/views') );
} );

gulp.task( 'build:html', ['html2js'], function() {
  return gulp.src('.tmp/views/*.js')
    .pipe( plugins.concat( 'views.js' ) )
    .pipe( gulp.dest('src') );
} );

gulp.task( 'build', ['build:html'], function() {
  return gulp.src( FILES )
    .pipe( plugins.concat( MAIN ) )
    .pipe( plugins.ngAnnotate() )
    .pipe( plugins.header( fs.readFileSync( BANNER, 'utf8' ), { pkg : pkg } ) )
    .pipe( gulp.dest('.') );
} );

gulp.task( 'minify', ['build'], function() {
  return gulp.src( MAIN )
    .pipe( plugins.plumber() )
    .pipe( plugins.uglify() )
    .pipe( plugins.rename({ extname: '.min.js' }) )
    .pipe( plugins.header( fs.readFileSync( BANNER, 'utf8' ), { pkg : pkg } ) )
    .pipe( gulp.dest('.') );
} );

gulp.task( 'copy', [ 'minify' ], function() {
  return gulp.src([ MAIN, MAIN.replace('.js', '.min.js') ])
    .pipe( gulp.dest('examples/client/vendor') );
} );

gulp.task( 'complexity', function() {
  return gulp.src( MAIN )
    .pipe( plugins.complexity() );
} );

gulp.task( 'watch', function() {
  gulp.watch( FILES, [ 'complexity', 'clean:views' ] );
} );

gulp.task( 'default', ['clean:views'] );
