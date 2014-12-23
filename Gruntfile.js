
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    docco: {
      debug: {
        src: ['index.js', 'token-refresher.js', 'grant.js'],
        options: {
          output: 'doc/',
          layout: 'classic'
        }
      }
    },
    jshint: {
      all: ['Gruntfile.js', '*.js', 'test/**/*.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-docco');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'docco']);

};

