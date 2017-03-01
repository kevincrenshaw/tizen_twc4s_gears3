module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-qunit-junit');

	grunt.initConfig({
		qunit: {
			src: ['index.html'],
		},

		qunit_junit: {
			options: {
				dest: '.'
			},
		},
	});

	grunt.registerTask('default', ['qunit_junit', 'qunit']);
};