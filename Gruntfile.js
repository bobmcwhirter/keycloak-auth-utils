
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
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-doxx');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'doxx']);

};

