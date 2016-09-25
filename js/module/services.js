angular.module('main.services', [])

.factory('General', function() {
    return {
        /** 
         * Generates a random number between the min and max range. If the range 
         * is undefined, then it will generate a number between 0 and 10,000, 
         * inclusive.
         * 
         * @author - Albert Deng
         * @param - {min} The bottom end of the range, inclusive; if undefined, 0
         * @param - {max} The upper end of the range, inclusive; if undefined, 10,000
         * @return - {Number} A random number between the range provided
         */
        getRandomInt: function(min, max) {
            min = (min == undefined) ? 0 : Math.ceil(min);
            max = (max == undefined) ? 10000 : Math.floor(max);
            return Math.floor(Math.random() * (max - min)) + min;
        },
        /**
         * Formats a number using a standard accounting format, rounded to the nearest int.
         * If the number is negative, the method will wrap the number using parentheses.
         * 
         * @author - Albert Deng
         * @param - {num} The number to format
         * @return - {String} The number formatted with parentheses and commas
         */
        formatAccountingInt: function(num) {
            var str = num.toString();
            var result = [];
            for(var i = str.length - 1, j = 1; i >= 0; i--, j++) {
                result.unshift(str[i]);
                if(j % 3 == 0 && i != 0 && str[i - 1] != "-") {
                    result.unshift(",");
                }
            }
            if(num < 0) {
                result.shift();
                result.unshift("(");
                result.push(")");
            }
            return result.join('');
        }
    }
})

.factory('Inventory', function(localStorageService) {
    /**
     * Fetches and returns the inventory object from storage.
     * 
     * @author - Albert Deng
     * @return - {String} A string representation of the inventory object
     */
    function getInventoryObj() {
        // If inventory does not exist, create it
        if(localStorageService.get('inventory') == null) {
            var a = [];
            localStorageService.set('inventory', JSON.stringify(a));
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
         * @param - {units} The number of units of inventory to purchase
         * @param - {price} The price of the inventory at the time of purchase
         * @return - {Number} The value of inventory 
         */
        buyInventory: function(units, price) {
            var invObj = JSON.parse(getInventoryObj());
            var obj = {
                'units': units,
                'cost': price
            };
            invObj.push(obj);

            // Push updated inventory object to storage
            localStorageService.set('inventory', JSON.stringify(invObj));
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
        },
        /**
         * Returns the total number of inventory units.
         * 
         * @author - Albert Deng
         * @return - {Number} The number of units of inventory
         */
        getInventoryUnits: function() {
            var invObj = JSON.parse(getInventoryObj());
            var invUnits = 0;
            for(var i = 0; i < invObj.length; i++) {
                invUnits += invObj[i]['units'];
            }
            return invUnits;
        }
    }
});