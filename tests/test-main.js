// b/c module mocking and injection is not ready yet, some deps may cause errors
const exludedTestFiles = [
  '/base/tests/specs/utils/back.js', // uses network
  '/base/tests/specs/utils/storage.js', // uses network
  '/base/tests/specs/utils/network.js', // uses fsutils
  '/base/tests/specs/utils/updater.js', // uses network, storage
  '/base/tests/specs/utils/fsutils.js', // uses tizen global object

  // use fsutils directly or indirectly
  '/base/tests/specs/pages/alerts.js',
  '/base/tests/specs/pages/distance.js',
  '/base/tests/specs/pages/information.js',
  '/base/tests/specs/pages/main.js',
  '/base/tests/specs/pages/mapzoom.js',
  '/base/tests/specs/pages/partnerapp.js',
  '/base/tests/specs/pages/radar.js',
  '/base/tests/specs/pages/settings.js',
  '/base/tests/specs/pages/temperature.js',
  '/base/tests/specs/pages/time.js',
  '/base/tests/specs/pages/units.js',
  '/base/tests/specs/pages/weather.js',
  '/base/tests/specs/app.js'
];
// Get a list of all the test files to include
const allTestFiles = Object.keys(window.__karma__.files).filter(function(file) {
  console.log(file, file.indexOf('tests/specs/') > -1, exludedTestFiles.indexOf(file) < 0);
  return file.indexOf('tests/specs/') > -1 && exludedTestFiles.indexOf(file) < 0; 
});


require.config({
  // Karma serves files under /base, which is the basePath from your config file
  baseUrl: '/base/code/js',

  paths: {
    jquery: '../lib/jquery/jquery-1.11.1.min',
    rx: '../lib/rx.lite'
  },

  // dynamically load all test files
  deps: allTestFiles,

  // we have to kickoff jasmine, as it is asynchronous
  callback: window.__karma__.start
});
