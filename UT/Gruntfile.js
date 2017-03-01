module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-qunit');

	grunt.initConfig({
		qunit: {
			src: ['index.html'],
		},
	});

	grunt.registerTask('default', ['qunit']);
};