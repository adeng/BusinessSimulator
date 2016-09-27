angular.module('main.inventory', [])

.factory('Inventory', function($interval, $rootScope, localStorageService, Entities, General, Accounting) {
    var contracts = [];
    
    var purchaseLog = [];

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
     * Insert new inventory object entry into the inventory object. Will then 
     * calculate and return the inventory value based on the currently selected
     * inventory costing method.
     * 
     * @author - Albert Deng
     * @param - {units} The number of units of inventory to purchase
     * @param - {price} The price of the inventory at the time of purchase
     * @param - {id} The ID of the inventory being purchased
     * @param - {account} Whether the inventory is purchased on account or not
     * @return - {Number} The value of inventory 
     */
    function buyInventory(units, price, id, account) {
        account = account == undefined ? true : account;

        var invObj = getInventoryObj();
        var obj = {
            'units': units,
            'cost': price,
            'type': id
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
    }

    /**
     * Calculates and returns the total value of inventory. Accepts an optional
     * ID parameter to filter inventory value summation.
     * 
     * @author - Albert Deng
     * @param - {id} The product to value
     * @return - {Number} The value of inventory
     */
    function calculateInventoryValue(id) {
        // Replace this logic if you decide to do inventory costing methods
        var invObj = getInventoryObj();
        var invValue = 0;
        for(var i = 0; i < invObj.length; i++) {
            if(id == undefined || id == invObj[i]['type'])
                invValue += (invObj[i]['units'] * invObj[i]['cost']);
        }
        return invValue;
    }

    /**
     * Logs the purchase into the purchaseLog array, storing the number of units purchased,
     * the cost, the supplier ID, the product ID, and the date of the transaction.
     * 
     * @author - Albert Deng
     * @param - {units} The number of units to purchase
     * @param - {price} The price the inventory was purchased at
     * @param - {id} The ID of the product purchased
     * @param - {supplier} The ID of the supplier the inventory was purchased from
     */
    function addPurchase(units, price, id, supplier) {
        var obj = {
            'units': units,
            'cost': price,
            'supplierid': supplier,
            'productid': id,
            'date': $rootScope.date.getTime()
        }
        purchaseLog.push(obj);
    }

    return {
        /**
         * Contains the inventory functions that are timer based. Is called in the
         * timer update code.
         * 
         * @author - Albert Deng
         */
        scheduledProcess: function() {
            if($rootScope.date.getUTCHours() == 0 && $rootScope.runTime) {
                for(var i = 0; i < contracts.length; i++) {
                    // Buy inventory on account if date terms are met
                    if(General.daysBetween($rootScope.date, contracts[i][5]) % contracts[i][4] == 0) {
                        addPurchase(contracts[i][0], contracts[i][1], contracts[i][2], contracts[i][3]);
                        buyInventory(contracts[i][0], contracts[i][1], contracts[i][2], true);

                        Entities.addLoyalty(contracts[i][3], 1);
                    }
                }
            }
        },
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
        buyInventory: function(units, price, id, supplier, account) {
            addPurchase(units, price, id, supplier);
            buyInventory(units, price, id, account);
        },
        /**
         * Fetches and returns the historical purchase log object.
         * 
         * @author - Albert Deng
         * @return - {Array} An array of purchases
         */ 
        getPurchaseLog: function() {
            return purchaseLog;
        },
        /**
         * Fetches and returns all purchase log objects from the current date
         * for the past given days.
         * 
         * @author - Albert Deng
         * @param - {numDays} The number of days past to get items from
         * @return - {Array} An array containing all the matched purchase items
         */
        getPurchaseLogDays: function(numDays) {
            var d = new Date($rootScope.date.getTime());
            d.setDate(d.getDate() - numDays);
            var result = [];

            for(var i = purchaseLog.length - 1; i >= 0; i--) {
                if(purchaseLog[i].date >= d.getTime)
                    result.push(purchaseLog[i]);
            }
            return result;
        },
        /**
         * Sells inventory using the FIFO method. Will return the Cost of Goods Sold.
         * If inventory units sold exceed the amount of inventory actually on hand,
         * will just sell all of it.
         * 
         * @warning - rename this to sellInventoryFIFO later
         * 
         * @author - Albert Deng
         * @param - {units} The number of units of inventory to sell
         * @return - {Array} The calculated Cost of Goods Sold and the number of units actually sold
         */
        sellInventory: function(units) {
            var invObj = getInventoryObj();
            var remaining = units;
            var COGS = 0;
            for(var i = 0; i < invObj.length; ) {
                if(invObj[i]['units'] > remaining) {
                    COGS += remaining * invObj[i]['cost'];
                    invObj[i]['units'] -= remaining;
                    remaining = 0;
                    break;
                } 
                else if(invObj[i]['units'] == remaining) {
                    COGS += invObj[i]['units'] * invObj[i]['cost'];
                    remaining = 0;
                    invObj.shift();
                    break;
                }
                else {
                    COGS += invObj[i]['units'] * invObj[i]['cost'];
                    remaining -= invObj[i]['units'];
                    invObj.shift();
                }
            }

            // Make journal entry
            Accounting.makeJournalEntry([
                // Debit COGS
                [6001, COGS],
                // Credit inventory
                [1031, -1 * COGS]
            ]);

            localStorageService.set('inventory', JSON.stringify(invObj));
            
            return [COGS, (units - remaining)];
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
         * Returns the inventory array.
         * 
         * @author - Albert Deng
         * @return - {Array} The array of inventory entries
         */
        getInventoryObject: function() {
            return getInventoryObj();
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
        },
        /**
         * Return the contracts currently in place.
         * 
         * @author - Albert Deng
         * @return - {Array} The contracts currently in place for this business unit
         */
        getContracts: function() {
            return contracts;
        },
        /**
         * Add a new contract to the company.
         * 
         * @author - Albert Deng
         * @param - {quantity} The number of units to purchase
         * @param - {price} The price at which to buy the units
         * @param - {id} The ID of the product being purchased
         * @param - {supplierid} The ID of the supplier the contract was made with
         * @param - {days} The number of days which the contract should be repeated
         */
        makeContract: function(quantity, price, id, supplierid, days) {
            contracts.push([quantity, price, id, supplierid, days, new Date($rootScope.date.getTime())]);
        }
    }
});