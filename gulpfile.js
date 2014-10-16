/**
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE' or 'LICENSE.txt', which is part of this source code package.
 */
var gulp = require('gulp')
, plugins = require('gulp-load-plugins')()
, pkg = require('./package.json')
, fs = require('fs')

, FILES = [
    './src/app.js',
    './src/directives/isotope.js',
    './src/directives/isotope-tile.js',
    './src/services/backend.js'
  ]
, BANNER = './src/header.txt'
, MAIN = 'socialhub.js';

gulp.task( 'build', function() {
  return gulp.src( FILES )
    .pipe( plugins.concat( MAIN ) )
    .pipe( plugins.ngAnnotate() )
    .pipe( plugins.header( fs.readFileSync( BANNER, 'utf8' ), { pkg : pkg } ) )
    .pipe( gulp.dest('.') )
} );

gulp.task( 'minify', function() {
  return gulp.src( MAIN )
    .pipe( plugins.plumber() )
    .pipe( plugins.uglify() )
    .pipe( plugins.rename({ extname: '.min.js' }) )
    .pipe( plugins.header( fs.readFileSync( BANNER, 'utf8' ), { pkg : pkg } ) )
    .pipe( gulp.dest('.') )
} );

gulp.task( 'copy', function() {
  return gulp.src([ MAIN, MAIN.replace('.js', '.min.js') ])
    .pipe( gulp.dest('examples/client/vendor') );
} );

gulp.task( 'complexity', function() {
  return gulp.src( MAIN )
    .pipe( plugins.complexity() );
} );

gulp.task( 'watch', function() {
  gulp.watch( FILES, [ 'build', 'complexity', 'minify', 'copy'] );
} );

gulp.task( 'default', [ 'build', 'minify', 'copy' ] );
