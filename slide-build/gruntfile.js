module.exports = function(grunt) {

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		connect: {
			server: {
				options: {
					port: 8000,
					base: '.',
					livereload: true,
					open: true,
					useAvailablePort: true
				}
			}
		},

		watch: {
			html: {
				files: ['*.html']
			},
			markdown: {
				files: ['*.md'],
                options: { spawn: false },
				tasks: ['exec:pandoc']
			},
			options: {
				livereload: true
			}
		},

        exec: {
            pandoc: {
                command: 'make'
            }
        }

	});

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-exec');

	grunt.registerTask( 'default', [ 'connect', 'watch' ] );
};
