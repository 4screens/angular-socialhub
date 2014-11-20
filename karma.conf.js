/**
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE' or 'LICENSE.txt', which is part of this source code package.
 *
 * Created by misiek on 14.10.2014.
 */

module.exports = function(config) {
  config.set({
    files: [
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/lodash/dist/lodash.js',
      'bower_components/isotope/dist/isotope.pkgd.js',
      'socialhub.js',
      'test/**/*.spec.js'
    ],

    autoWatch: true,

    frameworks: ['jasmine'],

    browsers: ['PhantomJS', 'Chrome'],

    plugins: [
      'karma-jasmine',
      'karma-phantomjs-launcher',
      'karma-chrome-launcher',
      'karma-coverage'
    ],

    reporters: ['progress', 'coverage'],

    preprocessors: {
      'socialhub.js': ['coverage']
    },

    coverageReporter: {
      type: 'lcov',
      dir: 'coverage',
      subdir: '.'
    }
  });
};
