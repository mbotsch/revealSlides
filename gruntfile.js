module.exports = function(grunt) {

    let root = grunt.option('root');

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		connect: {
			server: {
				options: {
					port: 8000,
                    base: root,
					livereload: true,
					open: true,
					useAvailablePort: true
				}
			}
		},

		watch: {
			html: {
				files: [root + '/*.html']
			},
			markdown: {
				files: [root + '/*.md'],
                options: { spawn: false },
				tasks: ['exec:pandoc']
			},
			options: {
				livereload: true
			}
		},

        exec: {
            pandoc: {
                command: 'make --directory ' + root + ' html'
            }
        }

	});

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-exec');

	grunt.registerTask( 'default', [ 'connect', 'watch' ] );
};
