// Get a list of all the test files to include
const allTestFiles = Object.keys(window.__karma__.files).filter(function(file) {
  return file.indexOf('tests/specs/utils/map') > -1; 
});
/*var allTestFiles = [];
Object.keys(window.__karma__.files).forEach(function (file) {
  if (file.indexOf('tests/specs/utils/map') > -1) {
    // Normalize paths to RequireJS module names.
    // If you require sub-dependencies of test files to be loaded as-is (requiring file extension)
    // then do not normalize the paths
    var normalizedTestModule = file.replace(/^\/base\/|\.js$/g, '');
    allTestFiles.push('../../' + normalizedTestModule); // prepend with '../../' due to baseUrl config below
  }
});*/


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
