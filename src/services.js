(function() {
  'use strict';

  angular.module('davidchin.endlessScroll')
    .factory('EndlessScroll', function($window, $timeout) {
      function debounce(fn, delay) {
        var promise;

        return function() {
          if (promise) {
            $timeout.cancel(promise);
          }

          promise = $timeout(fn, delay);

          promise.then(function() {
            promise = undefined;
          });
        };
      }

      var EndlessScroll = function EndlessScroll(element, options) {
        this.windowElement = $($window);
        this.element = $(element);
        this.options = angular.extend({}, this.defaultOptions, options);
        this.dimension = { window: {}, element: {} };

        this.watch();
      };

      EndlessScroll.prototype.defaultOptions = {
        offset: -100
      };

      EndlessScroll.prototype.next = function() {
        if (angular.isFunction(this.options.next)) {
          return this.options.next.call(this);
        }
      };

      EndlessScroll.prototype.previous = function() {
        if (angular.isFunction(this.options.previous)) {
          return this.options.previous.call(this);
        }
      };

      EndlessScroll.prototype.pause = function() {
        // TODO
      };

      EndlessScroll.prototype.watch = function() {
        this._onScroll = debounce(angular.bind(this, this.update), 100);

        this.windowElement.on('scroll', this._onScroll);
      };

      EndlessScroll.prototype.unwatch = function() {
        if (angular.isFunction(this._onScroll)) {
          this.windowElement.off('scroll', this._onScroll);
        }
      };

      EndlessScroll.prototype.update = function() {
        this.dimension.window.height = this.windowElement.height();
        this.dimension.window.top = this.windowElement.scrollTop();
        this.dimension.window.bottom = this.dimension.window.top + this.dimension.window.height;

        this.dimension.element.height = this.element.outerHeight();
        this.dimension.element.top = this.element.offset().top;
        this.dimension.element.bottom = this.dimension.element.top + this.dimension.element.height;

        if (this.dimension.element.bottom + this.options.offset <= this.dimension.window.bottom) {
          this.next();
        }

        this._clean();
      };

      EndlessScroll.prototype._clean = function() {
        var _this = this;

        this.element.children().each(function(i, item) {
          item = $(item);

          var offset = item.offset(),
              height = item.outerHeight(),
              top = offset.top,
              bottom = offset.top + height;

          if (bottom < _this.dimension.window.top || top > _this.dimension.window.bottom) {
            item.css({ visibility: 'hidden', opacity: 0 });
          } else {
            item.css({ visibility: '', opacity: '' });
          }
        });
      };

      return EndlessScroll;
    });
})();
