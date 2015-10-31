(function() {
  'use strict';

  describe('endlessScroll directive', function() {
    var parentScope,
        parentElement,
        directive,
        items,
        html;

    beforeEach(function() {
      module('dc.endlessScroll');

      inject(function($rootScope) {
        parentScope = $rootScope.$new();
      });

      items = [
        { name: 'Muffin' },
        { name: 'Kitty'  },
        { name: 'Tiger'  },
        { name: 'Oreo'   },
        { name: 'Coco'   }
      ];

      html = '<div endless-scroll="cat in cats"></div>';

      parentElement = $('<div></div>');

      parentScope.cats = items;
    });

    function compile(html) {
      var element,
          repeatElement;

      inject(function($compile) {
        element = $compile(html)(parentScope);
      });

      // Append to a parent node
      parentElement.html(element);

      // Compile transcluded directives
      parentScope.$apply();

      // KLUDGE: cannot retrieve controller and scope as directive element is replaced by ngRepeat
      repeatElement = element.next();

      return {
        element:    element,
        controller: repeatElement.controller('endlessScroll'),
        scope:      repeatElement.scope()
      };
    }

    describe('when it compiles >', function() {
      beforeEach(function() {
        directive = compile(html);
      });

      it('should apply a ng-repeat directive and use it to repeat its own collection of items', function() {
        expect(/^\s*ngRepeat:\s*.+\s+in\s+_endlessScroll.items/.test(directive.element.get(0).data)).toBeTruthy();
      });

      it('should watch for onScroll event and check neccessary to fetch more items', inject(function($window) {
        spyOn(directive.controller, 'check');
        $($window).triggerHandler('scroll');

        expect(directive.controller.check).toHaveBeenCalled();
      }));

      it('should watch for $destroy event and perform relevent clean-ups', function() {
        spyOn(directive.controller.window, 'off');
        parentScope.$destroy();

        expect(directive.controller.window.off).toHaveBeenCalledWith('scroll', jasmine.any(Function));
      });

      it('should watch for changes to data and update view', function() {
        spyOn(directive.controller, 'update');
        parentScope.cats.push(angular.copy(parentScope.cats[0]));
        parentScope.$apply();

        expect(directive.controller.update).toHaveBeenCalled();
      });

      it('should be configurable using HTML attributes', function() {
        expect(directive.controller.options.scrollOffset).toEqual(-100);

        html = '<div endless-scroll="cat in cats" endless-scroll-options="{ scrollOffset: -200 }"></div>';
        directive = compile(html);

        expect(directive.controller.options.scrollOffset).toEqual(-200);
      });

      it('should assign the browser window as the default window object', inject(function($window) {
        expect(directive.controller.window).toEqual($($window));

        html = '<div endless-scroll="cat in cats" endless-scroll-options="{ window: \'#sidebar\' }"></div>';
        directive = compile(html);

        expect(directive.controller.window).toEqual($('#sidebar'));
      }));
    });

    describe('when it checks if it is neccessary to fetch more data', function() {
      beforeEach(function() {
        directive = compile(html);
      });

      it('should define the dimension of window and parent dom', function() {
        directive.controller.check();

        expect(directive.controller.dimension.window.height).toBeDefined();
        expect(directive.controller.dimension.window.top).toBeDefined();
        expect(directive.controller.dimension.window.bottom).toBeDefined();

        expect(directive.controller.dimension.parent.height).toBeDefined();
        expect(directive.controller.dimension.parent.top).toBeDefined();
        expect(directive.controller.dimension.parent.bottom).toBeDefined();
      });

      it('should determine if displaying the last item of the collection', function() {
        directive.controller.check();
        expect(directive.controller.status.isEndReached).toBeTruthy();

        parentScope.cats.push(angular.copy(parentScope.cats[0]));
        directive.controller.check();
        expect(directive.controller.status.isEndReached).toBeFalsy();
      });

      it('should determine if displaying the first item of the collection', function() {
        directive.controller.check();
        expect(directive.controller.status.isStartReached).toBeTruthy();

        parentScope.cats.unshift(angular.copy(parentScope.cats[0]));
        directive.controller.check();
        expect(directive.controller.status.isStartReached).toBeFalsy();
      });

      it('should fetch the next set of data if displaying the last item of the collection and scrolled to the bottom', function() {
        spyOn(directive.controller, 'next');
        spyOn(directive.controller, '_getDimension');
        spyOn(directive.controller, '_getScrollStatus');

        directive.controller._getDimension.andCallFake(function(type) {
          if (type === 'window') {
            return { bottom: 1000 };
          } else if (type === 'parent') {
            return { bottom: 1000 };
          }
        });

        directive.controller._getScrollStatus.andReturn({
          isEndReached:     true,
          isScrollingDown:  true
        });

        directive.controller.check();
        expect(directive.controller.next).toHaveBeenCalled();
      });

      it('should not fetch the next set of data if not displaying the last item of the collection or scrolled to the bottom', function() {
        spyOn(directive.controller, 'next');
        spyOn(directive.controller, '_getDimension');
        spyOn(directive.controller, '_getScrollStatus');

        directive.controller._getDimension.andCallFake(function(type) {
          if (type === 'window') {
            return { bottom: 1000 };
          } else if (type === 'parent') {
            return { bottom: 1500 };
          }
        });

        directive.controller._getScrollStatus.andReturn({
          isEndReached:     false,
          isScrollingDown:  true
        });

        directive.controller.check();
        expect(directive.controller.next).not.toHaveBeenCalled();
      });

      it('should fetch the previous set of data if displaying the first item of the collection and scrolled to the top', function() {
        spyOn(directive.controller, 'previous');
        spyOn(directive.controller, '_getDimension');
        spyOn(directive.controller, '_getScrollStatus');

        directive.controller._getDimension.andCallFake(function(type) {
          if (type === 'window') {
            return { top: 1000 };
          } else if (type === 'parent') {
            return { top: 1000 };
          }
        });

        directive.controller._getScrollStatus.andReturn({
          isStartReached: true,
          isScrollingUp:  true
        });

        directive.controller.check();
        expect(directive.controller.previous).toHaveBeenCalled();
      });

      it('should not fetch the previous set of data if not displaying the first item of the collection or scrolled to the top', function() {
        spyOn(directive.controller, 'previous');
        spyOn(directive.controller, '_getDimension');
        spyOn(directive.controller, '_getScrollStatus');

        directive.controller._getDimension.andCallFake(function(type) {
          if (type === 'window') {
            return { top: 1000 };
          } else if (type === 'parent') {
            return { top: 2000 };
          }
        });

        directive.controller._getScrollStatus.andReturn({
          isStartReached: false,
          isScrollingUp:  true
        });

        directive.controller.check();
        expect(directive.controller.previous).not.toHaveBeenCalled();
      });

      it('should perform clean-ups', function() {
        spyOn(directive.controller, 'clean');
        directive.controller.check();

        expect(directive.controller.clean).toHaveBeenCalled();
      });
    });

    describe('when it requests more data', function() {
      beforeEach(function() {
        directive = compile(html);
      });

      it('should indicate its pending results', function() {
        directive.controller.status.isPendingNext = false;
        directive.controller.next();
        expect(directive.controller.status.isPendingNext).toBeTruthy();

        directive.controller.status.isPendingPrevious = false;
        directive.controller.previous();
        expect(directive.controller.status.isPendingPrevious).toBeTruthy();
      });

      it('should notify parent scope', function() {
        spyOn(directive.controller.scope, '$emit');

        directive.controller.status.isPendingNext = false;
        directive.controller.next();
        expect(directive.controller.scope.$emit).toHaveBeenCalledWith('endlessScroll:next', directive.controller);

        directive.controller.status.isPendingPrevious = false;
        directive.controller.previous();
        expect(directive.controller.scope.$emit).toHaveBeenCalledWith('endlessScroll:previous', directive.controller);
      });

      it('should not request data if its pending for results', function() {
        spyOn(directive.controller.scope, '$emit');

        directive.controller.status.isPendingNext = true;
        directive.controller.next();
        expect(directive.controller.scope.$emit).not.toHaveBeenCalledWith('endlessScroll:next', directive.controller);

        directive.controller.status.isPendingPrevious = true;
        directive.controller.previous();
        expect(directive.controller.scope.$emit).not.toHaveBeenCalledWith('endlessScroll:previous', directive.controller);
      });
    });

    describe('when it updates its data', function() {
      beforeEach(function() {
        directive = compile(html);
      });

      it('should retain a reference to the original collection of items', function() {
        directive.controller.update(items);

        expect(directive.controller.originalItems).toEqual(items);
      });

      it('should determine which items in the collection are newly appended and append to the collection of items for display', function() {
        var newItemsToAppend  = [{ name: 'Milo' }, { name: 'Maru' }],
            newItems          = items.slice();

        newItems.push.apply(newItems, newItemsToAppend);

        directive.controller.update(newItems);
        expect(directive.controller.items[directive.controller.items.length - 1]).toEqual(newItemsToAppend[newItemsToAppend.length - 1]);
        expect(directive.controller.items[directive.controller.items.length - 2]).toEqual(newItemsToAppend[newItemsToAppend.length - 2]);
      });

      it('should determine which items in the collection are newly prepended and prepend to the collection of items for display', function() {
        var newItemsToPrepend  = [{ name: 'Milo' }, { name: 'Maru' }],
            newItems          = items.slice();

        newItems.unshift.apply(newItems, newItemsToPrepend);

        directive.controller.update(newItems);
        expect(directive.controller.items[0]).toEqual(newItemsToPrepend[0]);
        expect(directive.controller.items[1]).toEqual(newItemsToPrepend[1]);
      });

      it('should indicate it is no longer pending for results', inject(function($timeout) {
        spyOn(directive.controller, 'check');
        directive.controller.status.isPendingNext = true;
        directive.controller.status.isPendingPrevious = true;
        directive.controller.update(items);
        $timeout.flush();

        expect(directive.controller.status.isPendingNext).toBeFalsy();
        expect(directive.controller.status.isPendingPrevious).toBeFalsy();
      }));

      it('should perform a check when the collection gets updated', inject(function($timeout) {
        spyOn(directive.controller, 'check');

        directive.controller.update(items);
        $timeout.flush();
        expect(directive.controller.check).toHaveBeenCalled();
      }));

      it('should not perform a check when the collection gets updated initially', inject(function($timeout) {
        spyOn(directive.controller, 'check');

        directive.controller.items = [];
        directive.controller.previousOriginalItems = undefined;
        directive.controller.update(items);
        $timeout.flush();
        expect(directive.controller.check).not.toHaveBeenCalled();
      }));

      it('should reset displayed items if there is a new data source', function() {
        directive.controller.items = items;
        parentScope.cats = [];
        parentScope.$apply();

        expect(directive.controller.items).not.toEqual(items);
      });
    });

    describe('when it tries to clean up unused items', function() {
      beforeEach(function() {
        directive = compile(html);
      });

      it('should determine the dimension of each element in the list', function() {
        directive.controller.clean();

        expect(directive.controller.dimension.items.length).toBeGreaterThan(0);

        directive.controller.dimension.items.forEach(function(dimension) {
          expect(dimension.height).toBeDefined();
          expect(dimension.top).toBeDefined();
          expect(dimension.bottom).toBeDefined();
        });
      });

      it('should normalise element\'s offset values if not using the document window as the reference point', function() {
        directive.controller.window = jasmine.createSpyObj('window', ['get', 'scrollTop']);
        directive.controller.docWindow = jasmine.createSpyObj('docWindow', ['get', 'scrollTop']);

        directive.controller.window.scrollTop.andReturn(100);
        directive.controller.docWindow.scrollTop.andReturn(20);
        directive.controller.clean();

        expect(directive.controller.dimension.items[0].top).toEqual(80);
      });

      it('should create a placeholder and insert it before all items if it does not exist', function() {
        directive.controller.clean();

        expect(directive.controller.placeholder.prop('tagName')).toEqual($(html).prop('tagName'));
        expect(directive.element.parent().children().get(0)).toEqual(directive.controller.placeholder.get(0));
      });

      it('should set the height of the placeholder to be the same as the items that are located above the viewport', function() {
        spyOn(directive.controller, '_getDimension').andCallFake(function(type) {
          if (type === 'items') {
            return [
              { top: 0,   bottom: 200,  height: 200 },
              { top: 200, bottom: 400,  height: 200 },
              { top: 400, bottom: 600,  height: 200 },
              { top: 600, bottom: 800,  height: 200 },
              { top: 800, bottom: 1000, height: 200 }
            ];
          }
        });
        directive.controller.dimension.parent.top    = -250;
        directive.controller.dimension.window.top    = 200;
        directive.controller.dimension.window.bottom = 200;
        directive.controller.dimension.window.height = 200;

        directive.controller.clean();

        expect(directive.controller.placeholder.height()).toEqual(250);
      });

      it('should only keep items that are visible to the user', function() {
        spyOn(directive.controller, '_getDimension').andCallFake(function(type) {
          if (type === 'items') {
            return [
              { top: 0,   bottom: 200,  height: 200 },
              { top: 200, bottom: 400,  height: 200 },
              { top: 400, bottom: 600,  height: 200 },
              { top: 600, bottom: 800,  height: 200 },
              { top: 800, bottom: 1000, height: 200 }
            ];
          }
        });
        directive.controller.dimension.parent.top    = 0;
        directive.controller.dimension.window.top    = 0;
        directive.controller.dimension.window.bottom = 200;
        directive.controller.dimension.window.height = 200;

        directive.controller.clean();

        expect(directive.controller.items).toContain(items[0]);
        expect(directive.controller.items).toContain(items[1]);
        expect(directive.controller.items).toContain(items[2]);
        expect(directive.controller.items).not.toContain(items[3]);
        expect(directive.controller.items).not.toContain(items[4]);
      });
    });
  });
})();
