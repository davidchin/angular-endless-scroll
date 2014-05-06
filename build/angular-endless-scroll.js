/*!
 * angular-endless-scroll.js v0.0.1
 * http://davidchin.me
 * Copyright 2014 David Chin
 * MIT License
 */
(function() {
  'use strict';

  angular.module('dc.endlessScroll', []);
})();

(function() {
  'use strict';

  angular.module('dc.endlessScroll')

    .directive('endlessScroll', function($window, $timeout) {
      var NG_REPEAT_REGEXP = /^\s*(.+)\s+in\s+([\r\n\s\S]*?)\s*(\s+track\s+by\s+(.+)\s*)?$/;

      // ------------------------------------
      // Convenient Methods
      // ------------------------------------
      function throttle(fn, delay) {
        var timeout,
            previous = 0;

        return function() {
          var current = new Date().getTime(),
              remaining = delay - (current - previous),
              args = arguments;

          if (remaining <= 0) {
            if (timeout) {
              $timeout.cancel(timeout);
            }

            timeout = undefined;
            previous = current;

            fn.apply(this, args);
          } else if (!timeout) {
            timeout = $timeout(function() {
              timeout = undefined;
              previous = new Date().getTime();

              fn.apply(this, args);
            }, remaining);
          }
        };
      }

      function parseNgRepeatExp(expression) {
        var matches = expression.match(NG_REPEAT_REGEXP);

        return {
          item: matches[1],
          collection: matches[2],
          trackBy: matches[3]
        };
      }

      // ------------------------------------
      // EndlessScroll
      // ------------------------------------
      function EndlessScroll(scope, element, attrs) {
        if (!(this instanceof EndlessScroll) ) {
          return new EndlessScroll(scope, element, attrs);
        }

        var defaultOptions = {
          scrollOffset: -100,
          scrollThrottle: 300
        };

        // Priviledged properties
        this.scope = scope;
        this.window = $($window);
        this.element = $(element);
        this.attrs = attrs;
        this.options = angular.extend({}, defaultOptions, this.scope.$eval(this.attrs.endlessScrollOptions));
        this.dimension = { window: {}, parent: {}, items: [] };
        this.status = {};
        this.expression = parseNgRepeatExp(this.attrs.endlessScroll);

        // Watch for events and scope changes
        this._watch();
      }

      // Public methods
      EndlessScroll.prototype.check = function() {
        // Determine if scrolling up or down and if we reach the end of list or not
        angular.extend(this.status, this._getScrollStatus());

        // Determine window dimension
        this.dimension.window = this._getDimension('window');

        // Determine parent element dimension
        this.dimension.parent = this._getDimension('parent');

        // Clean up off-screen elements
        this.clean();

        // If scrolled to bottom, request more items
        if (this.status.isEndReached && this.status.isScrollingDown &&
            this.dimension.parent.bottom + this.options.scrollOffset <= this.dimension.window.bottom) {
          this.next();
        }

        // If scrolled to top, request more items
        if (this.status.isStartReached && this.status.isScrollingUp &&
            this.dimension.parent.top - this.options.scrollOffset >= this.dimension.window.top) {
          this.previous();
        }
      };

      EndlessScroll.prototype.next = function() {
        if (!this.status.isPendingNext) {
          this._setPending('next', true);

          // Notify parent scope
          this.scope.$emit('endlessScroll:next', this);
        }
      };

      EndlessScroll.prototype.previous = function() {
        if (!this.status.isPendingPrevious) {
          this._setPending('previous', true);

          // Notify parent scope
          this.scope.$emit('endlessScroll:previous', this);
        }
      };

      EndlessScroll.prototype.update = function(collection) {
        var beforeItems,
            afterItems,
            firstCommonItemIndex,
            lastCommonItemIndex,
            oldCollection,
            i,
            len;

        // KLUGE: collection == oldCollection before AngularJS 1.2.15
        oldCollection = this.previousOriginalItems;

        // Retain reference to original items
        this.originalItems = collection;

        // Get new items
        if (angular.isArray(collection) && angular.isArray(oldCollection)) {
          // Find first common item index
          for (i = 0, len = collection.length; i < len; i++) {
            if (collection[i] === oldCollection[0] && collection[i] !== undefined) {
              firstCommonItemIndex = i;
              break;
            }
          }

          // Find last common item index
          for (i = collection.length - 1; i >= 0; i--) {
            if (collection[i] === oldCollection[oldCollection.length - 1] && collection[i] !== undefined) {
              lastCommonItemIndex = i;
              break;
            }
          }

          if (firstCommonItemIndex) {
            beforeItems = collection.slice(0, firstCommonItemIndex);
          }

          if (lastCommonItemIndex) {
            afterItems = collection.slice(lastCommonItemIndex + 1);
          }
        }

        // Add to items
        if (!angular.isArray(this.items) || this.items.length === 0) {
          if (angular.isArray(collection)) {
            this.items = collection.slice();
          }
        } else {
          if (beforeItems) {
            this.items.unshift.apply(this.items, beforeItems);
          }

          if (afterItems) {
            this.items.push.apply(this.items, afterItems);
          }
        }

        // Previous collection
        if (angular.isArray(collection)) {
          this.previousOriginalItems = collection.slice();
        }

        // Flag status
        $timeout(angular.bind(this, function() {
          this._setPending('next', false);
          this._setPending('previous', false);

          // Perform check
          if (angular.isArray(collection) && angular.isArray(oldCollection)) {
            this.check();
          }
        }));
      };

      EndlessScroll.prototype.clean = function() {
        var firstVisibleItemIndex,
            lastVisibleItemIndex,
            defaultPlaceholderAttrs,
            placeholderHeight,
            itemTagName,
            newItems,
            children,
            parent = this._getParent();

        // Set default placeholder attrs
        defaultPlaceholderAttrs = {
          visibility: 'hidden',
          padding: 0,
          border: 0
        };

        // Determine dimension of each repeated element
        this.dimension.items = this._getDimension('items');

        if (this.dimension.items && this.originalItems &&
            this.dimension.items.length === this.originalItems.length) {
          // Determine tag name
          children = this._getChildren();
          itemTagName = children.get(0) && children.prop('tagName').toLowerCase();

          // Determine first and last visible item
          angular.forEach(this.dimension.items, function(dimension, itemIndex) {
            var isVisible = dimension.bottom >= this.dimension.window.top - this.dimension.window.height &&
                            dimension.top <= this.dimension.window.bottom + this.dimension.window.height;

            // Set reference to item index
            if (isVisible) {
              if (firstVisibleItemIndex === undefined) {
                firstVisibleItemIndex = itemIndex;
              }

              lastVisibleItemIndex = itemIndex;
            }
          }, this);

          // Create placeholder
          if (!this.placeholder && itemTagName) {
            this.placeholder = $('<' + itemTagName + '>');

            // Insert placeholder before all items
            this.placeholder
              .css(defaultPlaceholderAttrs)
              .prependTo(parent);
          }

          // Calculate total space occupied by items before the first visible item
          if (this.placeholder) {
            if (angular.isDefined(firstVisibleItemIndex)) {
              placeholderHeight = this.dimension.items[firstVisibleItemIndex].top - this.dimension.parent.top;
            } else {
              placeholderHeight = 0;
            }

            this.placeholder.height(placeholderHeight);
          }

          // Add to items
          if (angular.isDefined(firstVisibleItemIndex) &&
              angular.isDefined(lastVisibleItemIndex) &&
              angular.isArray(this.items) &&
              angular.isArray(this.originalItems)) {
            newItems = this.originalItems.slice(firstVisibleItemIndex, lastVisibleItemIndex + 1);
            this.items.splice.apply(this.items, [0, this.items.length].concat(newItems));
          }
        }
      };

      // Priviledged methods
      EndlessScroll.prototype._watch = function() {
        var collectionExp = this.expression.collection;

        if (collectionExp) {
          // Watch for data changes
          this.scope.$watchCollection(collectionExp, angular.bind(this, function watchCollection() {
            this.update.apply(this, arguments);
          }));

          // Watch for onScroll event
          this.window.on('scroll', this._boundOnScroll = angular.bind(this, this._onScroll));

          // Watch for $destroy event
          this.scope.$on('$destroy', angular.bind(this, this._unwatch));
        }
      };

      EndlessScroll.prototype._unwatch = function() {
        if (this._boundOnScroll) {
          this.window.off('scroll', this._boundOnScroll);
        }
      };

      EndlessScroll.prototype._setPending = function(type, bool) {
        var attr = 'isPending' + type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

        this.status[attr] = angular.isUndefined(bool) ? true : !!bool;
        this.timeouts = this.timeouts || {};

        if (this.status[attr]) {
          if (this.timeouts[attr]) {
            $timeout.cancel(this.timeouts[attr]);
            delete this.timeouts[attr];
          }

          // Automatically set the wait status to false after a time period
          this.timeouts[attr] = $timeout(angular.bind(this, function() {
            this.status[attr] = false;
          }), 5000);
        }
      };

      EndlessScroll.prototype._onScroll = function() {
        this.scope.$apply(angular.bind(this, function() {
          // Define a throttled check method, if it's not already defined
          if (!this._throttledCheck) {
            this._throttledCheck = throttle(angular.bind(this, this.check), this.options.scrollThrottle);
          }

          // Check if there's a need to fetch more data
          this._throttledCheck();
        }));
      };

      EndlessScroll.prototype._getParent = function() {
        if (!this._parent || !this._parent.get(0)) {
          this._parent = this.element.parent();
        }

        return this._parent;
      };

      EndlessScroll.prototype._getDimension = function(type) {
        var height,
            top,
            bottom,
            parent = this._getParent();

        switch(type) {
          case 'window':
            height = this.window.height();
            top    = this.window.scrollTop();
            bottom = top + height;

            return {
              height: height,
              top:    top,
              bottom: bottom
            };

          case 'parent':
            height = parent.height();
            top    = parent.get(0) && parent.offset().top;
            bottom = top + height;

            return {
              height: height,
              top:    top,
              bottom: bottom
            };

          case 'items':
            var itemIndex,
                items = this.dimension.items.slice();

            this._getChildren()
              .each(angular.bind(this, function(i, child) {
                child = $(child);
                height = child.outerHeight();
                top = child.get(0) && child.offset().top;
                bottom = top + height;
                itemIndex = $.inArray(child.scope()[this.expression.item], this.originalItems);

                // Set reference to the dimension of each visible element
                if (itemIndex > -1) {
                  items[itemIndex] = {
                    height: height,
                    top: top,
                    bottom: bottom
                  };
                }
              }));

            return items;
        }
      };

      EndlessScroll.prototype._getScrollStatus = function() {
        var windowTop = this.window.scrollTop(),
            status = {};

        if (this.dimension.window.top > 0) {
          status.isScrollingUp = windowTop - this.dimension.window.top < 0;
          status.isScrollingDown = windowTop - this.dimension.window.top > 0;
        } else {
          status.isScrollingUp = false;
          status.isScrollingDown = true;
        }

        if (angular.isArray(this.items) && angular.isArray(this.originalItems)) {
          status.isEndReached = this.items[this.items.length - 1] === this.originalItems[this.originalItems.length - 1];
          status.isStartReached = this.items[0] === this.originalItems[0];
        } else {
          status.isEndReached = true;
          status.isStartReached = false;
        }

        return status;
      };

      EndlessScroll.prototype._getChildren = function() {
        var selector = '[ng-repeat]';

        return this._getParent().children(selector);
      };

      // ------------------------------------
      // EndlessScrollTemplate
      // ------------------------------------
      function EndlessScrollTemplate(element, attrs) {
        this.html = this._create(element, attrs);
      }

      EndlessScrollTemplate.prototype.toString = function() {
        return this.html;
      };

      EndlessScrollTemplate.prototype._create = function(element, attrs) {
        var elementAttrs = Array.prototype.slice.call(element.prop('attributes'), 0),
            parsedExp = parseNgRepeatExp(attrs.endlessScroll),
            ngRepeatExp = parsedExp.item + ' in _endlessScroll.items' + (parsedExp.trackBy ? ' ' + parsedExp.trackBy : '');

        // Remove all element attributes as 'replace' already copies over these attributes
        angular.forEach(elementAttrs, function(attr) {
          element.removeAttr(attr.name);
        });

        // Retain reference to the original repeat expression
        element.attr('ng-repeat', ngRepeatExp);

        return element.prop('outerHTML');
      };

      return {
        restrict: 'A',
        scope: true,
        replace: true,

        template: function(element, attrs) {
          return (new EndlessScrollTemplate(element, attrs)).toString();
        },

        controller: function($scope, $element, $attrs) {
          return new EndlessScroll($scope, $element, $attrs);
        },

        link: function(scope, element, attrs, controller) {
          scope._endlessScroll = controller;
        }
      };
    });
})();
