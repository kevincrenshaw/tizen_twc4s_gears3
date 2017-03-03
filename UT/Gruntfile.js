module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-qunit-junit');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.initConfig({
		qunit: {
			src: ['index.html'],
		},

		qunit_junit: {
			options: {
				dest: 'report'
			},
		},

		jshint: {
			all: ['../code/js/'],
			options: {
				reporter: 'checkstyle',
				reporterOutput: 'report/jshint-checkstyle.xml'
			}
		},
	});

	grunt.registerTask('default', ['jshint', 'qunit_junit', 'qunit']);
};