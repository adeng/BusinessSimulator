angular.module('main.services', [])

.factory('General', function(localStorageService) {
    return {
        /**
         * Empties all cached data.
         * 
         * @author - Albert Deng
         */
        clearAll: function() {
            localStorageService.clearAll();
        },
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

.factory('Accounting', function($q, $http, localStorageService) {
    /**
     * Checks the local storage for the chart of accounts. If chart of 
     * accounts data does not exist, refresh the localStorage with the data
     * from the JSON file. 
     * 
     * @warning - If the chart of accounts data is not in local storage, may return null
     * 
     * @author - Albert Deng
     * @return - {Object} The chart of accounts data
     */
    function getChartOfAccounts() {
        if(localStorageService.get('accounts') == null) {
            refreshChartOfAccounts();
        }
        return JSON.parse(localStorageService.get('accounts'));
    }

    /**
     * Download the chart of accounts data from the json file into local storage.
     * Return a promise containing the chart of accounts data.
     * 
     * @author - Albert Deng
     * @return - {Promise} A promise that resolves to the chart of accounts data
     */
    function refreshChartOfAccounts() {
        var deferred = $q.defer();
        $http.get('/data/accounts.json').success( function(data) {
            deferred.resolve(data);
            localStorageService.set('accounts', JSON.stringify(data));
        })
        return deferred.promise;
    }

    /**
     * Fetches and returns the general ledger object from storage. If the object
     * does not exist, then the function will create it.
     * 
     * @author - Albert Deng
     * @return - {Object} The general ledger object 
     */
    function getBooks() {
        if(localStorageService.get('generalledger') == null) {
            var a = {};
            localStorageService.set('generalledger', JSON.stringify(a));
        }
        return JSON.parse(localStorageService.get('generalledger'));
    }
    
    /**
     * Adds the given value to the accounting ledger. Also subtracts if the 
     * value is negative.
     * 
     * @param - {account} The GL code for the account to add value to
     * @param - {value} The amount to add into the account
     * @author - Albert Deng
     */
    function addValue(account, value) {
        var books = getBooks();
        
        // Force the account to a string, just in case the programmer forgot
        account = account.toString(); 

        if(books[account] == undefined) {
            books[account] = value;
        } else {
            books[account] += value;
        }

        localStorageService.set('generalledger', JSON.stringify(books));
    }

    return {
        /** 
         * Creates a journal entry from the provided transactions. 
         * 
         * A transaction object has the given form: [account, value]
         * If value is positive, it is processed as a debit; if it is negative, it is a credit
         * 
         * @author - Albert Deng
         * @param - {transactions} An array of transaction objects
         */
        makeJournalEntry: function(transactions) {
            for(var i = 0; i < transactions.length; i++) {
                var account = transactions[i][0];
                var value = transactions[i][1];

                // Check if account is debit
                if(account.toString[0] == "1", "6", "8") {
                    // Add positive value if debit, add negative if credit
                    (value > 0) ? addValue(account, value) : addValue(account, -1 * value);
                } else {
                    // Add positive value if credit, add negative if debit
                    (value > 0) ? addValue(account, -1 * value) : addValue(account, value);
                }
            }
        },
        /**
         * Fetches and returns the company's general ledger.
         * 
         * @author - Albert Deng
         * @return - {Object} The company's general ledger object
         */
        getAccounts: function() {
            return getBooks();
        },
        /**
         * Update the chart of accounts data.
         * 
         * @author - Albert Deng
         */
        updateAccounts: function() {
            return refreshChartOfAccounts();
        }
    }
})

.factory('Inventory', function(localStorageService, Accounting) {
    /**
     * Fetches and returns the inventory object from storage.
     * 
     * @author - Albert Deng
     * @return - {Object} The inventory object
     */
    function getInventoryObj() {
        // If inventory does not exist, create it
        if(localStorageService.get('inventory') == null) {
            var a = [];
            localStorageService.set('inventory', JSON.stringify(a));
        }
        return JSON.parse(localStorageService.get('inventory'));
    }

    /**
     * Calculates and returns the total value of inventory.
     * 
     * @author - Albert Deng
     * @return - {Number} The value of inventory
     */
    function calculateInventoryValue() {
        // Replace this logic if you decide to do inventory costing methods
        var invObj = getInventoryObj();
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
         * @param - {account} Whether the inventory is purchased on account or not
         * @return - {Number} The value of inventory 
         */
        buyInventory: function(units, price, account) {
            account = account == undefined ? true : account;

            var invObj = getInventoryObj();
            var obj = {
                'units': units,
                'cost': price
            };
            var value = units * price;
            invObj.push(obj);

            // Make journal entry
            // If on account, credit AP, otherwise cash
            var credit = account ? 2001 : 1001;
            Accounting.makeJournalEntry([
                // Debit inventory
                [1031, value],
                // Credit cash
                [credit, -1 * value]
            ]);

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
            var invObj = getInventoryObj();
            var invUnits = 0;
            for(var i = 0; i < invObj.length; i++) {
                invUnits += invObj[i]['units'];
            }
            return invUnits;
        }
    }
});