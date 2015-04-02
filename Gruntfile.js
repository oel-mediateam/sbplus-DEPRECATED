module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({

        pkg: grunt.file.readJSON( 'package.json' ),
        qunit: {
            files: ['build/*.html']
        },
        watch: {
            files: ['build/tests/tests.js', 'build/*.html', 'sources/scripts/storybookplus.js'],
            tasks: ['qunit'],
        }

    });

    // Load plugin
    grunt.loadNpmTasks( 'grunt-contrib-qunit' );
    grunt.loadNpmTasks( 'grunt-contrib-watch' );

    // Task to run tests
    grunt.registerTask( 'default', 'watch' );

};