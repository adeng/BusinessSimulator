angular.module('main.services', [])

.factory('Inventory', function(localStorageService) {
    /**
     * Fetches and returns the inventory object from storage.
     * 
     * @author - Albert Deng
     * @return - {String} A string representation of the inventory object
     */
    function getInventoryObj() {
        // If inventory does not exist, create it
        if(localStorageService.get('inventory') == undefined) {
            var a = [];
            localStorageService.set(JSON.stringify(a));
        }
        return localStorageService.get('inventory');
    }

    /**
     * Calculates and returns the total value of inventory.
     * 
     * @author - Albert Deng
     * @return - {Number} The value of inventory
     */
    function calculateInventoryValue() {
        // Replace this logic if you decide to do inventory costing methods
        var invObj = JSON.parse(getInventoryObj());
        var invValue = 0;
        for(var i = 0; i < invObj.length; i++) {
            invValue += (invObj[i]['units'] * invObj[i]['cost']);
        }
        return invValue;
    }

    return {
        /**
         * Insert new inventory object entry into the inventory object. Will then 
         * calculate and return the inventory value based on the currently selected
         * inventory costing method.
         * 
         * @author - Albert Deng
         * @return - {Number} The value of inventory 
         */
        buyInventory: function(units, price) {
            var invObj = JSON.parse(this.getInventoryObj());
            var obj = {
                'units': units,
                'cost': price
            };
            invObj.push(obj);

            // Push updated inventory object to storage
            localStorageService.set(JSON.stringify(invObj));
            return calculateInventoryValue();
        },
        /**
         * Returns the calculated value of inventory.
         * 
         * @author - Albert Deng
         * @return - {Number} The value of inventory
         */
        getInventory: function() {
            return calculateInventoryValue();
        }
    }
});