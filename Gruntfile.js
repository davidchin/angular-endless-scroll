module.exports = function(grunt) {
  'use strict';

  // Config
  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
    },

    concat: {
      options: {
        separator: ';'
      },

      build: {
        src: ['src/module.js', 'src/**/*.js'],
        dest: 'build/angular-endless-scroll.js'
      }
    },

    ngmin: {
      build: {
        src: ['build/angular-endless-scroll.js'],
        dest: 'build/angular-endless-scroll.min.js'
      }
    },

    uglify: {
      build: {
        files: {
          'build/angular-endless-scroll.min.js': ['build/angular-endless-scroll.min.js']
        }
      }
    },

    clean: {
      build: ['build/**/*.js']
    },

    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    },

    watch: {
      scripts: {
        files: ['src/**/*.js'],
        tasks: ['build']
      }
    }
  });

  // Load tasks
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-ngmin');
  grunt.loadNpmTasks('grunt-karma');

  // Combined tasks
  grunt.registerTask('test', ['karma']);
  grunt.registerTask('build', ['jshint', 'clean', 'concat', 'ngmin', 'uglify']);
};
