module.exports = function(config) {
  config.set({

    basePath: '',

    frameworks: ['jasmine'],

    files: [
      'lib/jquery/dist/jquery.js',
      'lib/angular/angular.js',
      'lib/angular-mocks/angular-mocks.js',
      'src/module.js',
      'src/**/*.js',
      'test/**/*.js'
    ],

    reporters: ['progress'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ['Chrome'],

    singleRun: false
  });
};
