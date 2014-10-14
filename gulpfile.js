/**
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE' or 'LICENSE.txt', which is part of this source code package.
 *
 * Created by misiek on 14.10.2014.
 */

var gulp = require('gulp');
var rename = require('gulp-rename');
var plumber = require('gulp-plumber');
var uglify = require('gulp-uglify');
var complexity = require('gulp-complexity');

var MAIN = 'socialhub.js',
    MAIN_MIN = 'socialhub.min.js';

gulp.task('minify', function() {
  return gulp.src(MAIN)
      .pipe(plumber())
      .pipe(uglify())
      .pipe(rename(MAIN_MIN))
      .pipe(gulp.dest('.'))
});

gulp.task('copy', function() {
  return gulp.src([MAIN, MAIN_MIN])
      .pipe(gulp.dest('examples/client/vendor'));
});

gulp.task('complexity', function() {
  return gulp.src(MAIN)
      .pipe(complexity());
});

gulp.task('watch', function() {
  gulp.watch(MAIN, ['copy', 'minify']);
});


gulp.task('default', ['copy', 'minify', 'watch']);