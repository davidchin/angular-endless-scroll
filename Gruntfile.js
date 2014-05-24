module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    // Configure tasks
    pkg: grunt.file.readJSON('bower.json'),

    banner: '/*!\n' +
            ' * <%= pkg.name %>.js v<%= pkg.version %>\n' +
            ' * <%= pkg.homepage %>\n' +
            ' * Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
            ' * <%= pkg.license %> License\n' +
            ' */\n',

    jshint: {
      all: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
    },

    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },

      dist: {
        src: ['src/module.js', 'src/**/*.js'],
        dest: 'build/<%= pkg.name %>.js'
      }
    },

    ngmin: {
      dist: {
        src: 'build/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },

    uglify: {
      options: {
        banner: '<%= banner %>'
      },

      dist: {
        src: 'build/<%= pkg.name %>.min.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },

    clean: {
      dist: [
        'build/**/*.js'
      ],

      docs: [
        'docs'
      ]
    },

    watch: {
      dist: {
        files: ['src/**/*.js'],
        tasks: ['build']
      },

      docs: {
        files: ['src/**/*.js'],
        tasks: ['docs']
      }
    },

    bump: {
      options: {
        files: ['package.json', 'bower.json'],
        commitFiles: ['-a'],
        push: false,
        createTag: false
      }
    },

    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    },

    jsdoc: {
      dist: {
        src: ['src/**/*.js'],
        options: {
          destination: 'docs',
          private: false
        }
      }
    },

    connect: {
      server: {
        options: {
          port: 9001,
          hostname: '0.0.0.0'
        }
      }
    }
  });

  // Load tasks
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-ngmin');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-jsdoc');

  // Register custom tasks
  grunt.registerTask('test', ['karma']);
  grunt.registerTask('build', ['jshint', 'clean:dist', 'concat', 'ngmin', 'uglify']);
  grunt.registerTask('docs', ['clean:docs', 'jsdoc']);
};
