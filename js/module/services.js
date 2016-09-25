angular.module('main.services', [])

.factory('Inventory', function($q, $http) {
    return {
        buyInventory: function(units, price) {
            var deferred = $q.defer();
        }
    }
});