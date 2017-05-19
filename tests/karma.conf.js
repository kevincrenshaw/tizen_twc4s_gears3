// Karma configuration
// Generated on Mon May 08 2017 15:18:07 GMT+0200 (CEST)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'expect', 'requirejs'],

    client: {
        mocha: {
            reporter: 'html',
            ui: 'bdd'
        }
    },


    // list of files / patterns to load in the browser
    files: [
      {pattern: './code/lib/jquery/jquery-1.11.1.min.js', included: false, watched: false},
      {pattern: './code/lib/rx.all.js', included: false, watched: false},
      // {pattern: './code/js/tauConfig.js', included: true, watched: false}, // todo remove and mock
      // {pattern: './code/lib/tau/wearable/js/tau.js', included: true, watched: false}, // todo remove and mock
      {pattern: './code/language.js', included: true, watched: false}, // todo remove and mock

      './tests/test-main.js',
      {pattern: './code/js/**/*.js', included: false},
      {pattern: './tests/specs/**/*.js', included: false}
    ],


    // list of files to exclude
    exclude: [
        './code/js/app.js'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        './code/js/**/*.js': ['coverage']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: [
        'mocha',
        'coverage'
    ],


    coverageReporter: {
      includeAllSources: true,
      type : 'html',
      dir : 'tests/coverage/',
      subdir: 'report'
    },


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_WARN,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [
        'PhantomJS2',
        // 'Chrome'
    ],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
