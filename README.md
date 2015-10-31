angular-endless-scroll.js
=========================

EndlessScroll an AngularJS directive that can help you implement an infinite scrolling UI. As your user scrolls a page, the directive determines if there is a need to fetch more data. If so, it emits an event to the controller of the page requesting for more data, which you can listen for. Your event listener can then make an API request for the next page of data, which get populated by the directive once they are ready. To improve performance and avoid the page getting overloaded with DOM elements, the directive only renders items that are currently (and would-be) visible in the viewport.

## Demo

You can have a look at the [demo here](http://davidchin.me/demos/angular/endless-scroll).

## Getting Started

You can get EndlessScroll via GitHub or via Bower `bower install angular-endless-scroll`

This module requires the following libraries: `angular ^1.2.6` and `jquery ^1.9.0`. Make sure you include the following script tags on your page (or in your packaged js file) in this order.

```html
<script type="text/javascript" src="/path/to/jquery.min.js"></script>
<script type="text/javascript" src="/path/to/angular.min.js"></script>
<script type="text/javascript" src="/path/to/angular-endless-scroll.min.js"></script>
```

Also, include `'dc.endlessScroll'` as part of your application module. For example: `angular.module('App', ['dc.endlessScroll'])`

## Example

Below is a simple example of how to use EndlessScroll directive in your project. You need to specify `endless-scroll` as an attribute to the element you want to repeat. Please note that the example uses some Bootstrap classes for the purpose of a demonstration - they are not required.

```html
<ul class="list-group">
  <li endless-scroll="item in items" class="list-group-item">
    {{ item.name }}
  </li>
</ul>

<p ng-show="loading" class="text-center">
  Loading...
</p>
```

And in your controller, listen for `endlessScroll:next` event by registering an event handler.

```javascript
angular.module('App', ['dc.endlessScroll'])
  .controller('Main', function($scope, $http, $routeParams) {
    // Define a method to load a page of data
    function load(page) {
      var params     = { page: page },
          isTerminal = $scope.pagination &&
                       $scope.pagination.current_page >= $scope.pagination.total_pages &&
                       $scope.pagination.current_page <= 1;

      // Determine if there is a need to load a new page
      if (!isTerminal) {
        // Flag loading as started
        $scope.loading = true;

        // Make an API request
        $http.get('/api/path', params)
          .success(function(data, status, headers) {
            // Parse pagination data from the response header
            $scope.pagination = angular.fromJson(headers('x-pagination'));

            // Create an array if not already created
            $scope.items = $scope.items || [];

            // Append new items (or prepend if loading previous pages)
            $scope.items.push.apply($scope.items, data);
          })
          .finally(function() {
            // Flag loading as complete
            $scope.loading = false;
          });
      }
    }

    // Register event handler
    $scope.$on('endlessScroll:next', function() {
      // Determine which page to load
      var page = $scope.pagination ? $scope.pagination.current_page + 1 : 1;

      // Load page
      load(page);
    });

    // Load initial page (first page or from query param)
    load($routeParams.page ? parseInt($routeParams.page, 10) : 1);
  });
```

You can also listen for `endlessScroll:previous` if you want to support deep-linking pagination and load previous pages when scrolled to the top. The directive fires the aforementioned event when you scroll to the top. Similar to the previous example, your event handler is responsible for determining if there is a need to load, and if so, which page to load.
