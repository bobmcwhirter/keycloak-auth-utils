
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    doxx: {
      all: {
        src: '.',
        target: 'doc',
        options: {
          ignore: 'Gruntfile.js,form.js,spec,node_modules,.git',
        }
      }
    },
    jshint: {
      all: ['Gruntfile.js', '*.js', 'test/**/*.js']
    },
    'gh-pages': {
      options: {
        base: 'doc'
      },
      src: ['**']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-doxx');
  grunt.loadNpmTasks('grunt-gh-pages');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'doxx']);

};

