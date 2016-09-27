angular.module('main.entities', [])

.factory('Entities', function($rootScope, localStorageService, Products, Accounting, General) {
    var suppliers = [];

    /**
     * Fetches and returns the array of suppliers. Also updates the suppliers
     * object.
     * 
     * @author - Albert Deng
     */
    function getSuppliers() {
        updateSuppliers();
        return suppliers;
    }

    /**
     * Updates the localStorage suppliers object with the copy from the 
     * local session.
     * 
     * @author - Albert Deng
     */
    function updateSuppliers() {
        localStorageService.set('suppliers', JSON.stringify(suppliers));
    }

    /**
     * Given a supplier's loyalty value, calculates and returns the supplier's 
     * discount for buyers. Calculates on a step basis from 0 - 20% based on steps of 5,
     * maxing at 20%. These discounts are applied to purchase contracts.
     * 
     * @author - Albert Deng
     * @param - {loyalty} The supplier's numerical loyalty value
     * @return - {Number} A discount percentage to apply to purchase contracts
     */
    function calculateLoyaltyDiscount(loyalty) {
        return Math.round(Math.min(40, loyalty)/10)*0.05;
    }

    /**
     * Calculates a random supplier price ranging from 75% of the initial price to
     * 110% of the initial price.
     * 
     * @author - Albert Deng
     * @param - {price} A ballpark estimate of the price
     * @return - {Number} A randomly generated supplier price
     */
    function calculateSupplierPrice(price) {
        return General.getRandomInt(Math.round(price*0.75), Math.round(price*1.1));
    }

    /**
     * Updates the supplier's production logic on a daily basis. This function
     * is scheduled in the supplier scheduled processes function.
     * 
     * @author - Albert Deng
     * @param - {supplier} The supplier to update production for
     */
    function updateProduction(supplier) {
        // For each product
        for(var i = 0; i < supplier.products.length; i++) {
            var product = supplier.products[i].id;
            var inventory = supplier.inventory[product];
            
            // Insert new daily transaction
            if(supplier.history[product].length == 0 || supplier.history[product][supplier.history[product].length - 1].date != $rootScope.date.getTime()) {
                var transaction = {
                    'amount': 0,
                    'date': $rootScope.date.getTime()
                }
                supplier.history[product].push(transaction);
            }

            // Remove old history and stuff
            while(supplier.history[product].length > inventory.daysToAdj) {
                supplier.history[product].shift();
            }

            // Add up historical purchases
            var avgAmt = 0;
            for(var j = 0; j < supplier.history[product].length; j++) {
                avgAmt += supplier.history[product][j].amount;
            }
            avgAmt /= inventory.daysToAdj;

            // Adjust daily production values
            if(supplier.history[product].length >= inventory.daysToAdj) {
                supplier.inventory[product].dailyProduction += (supplier.inventory[product].outsideConsump + avgAmt < supplier.inventory[product].dailyProduction ? -1 : 1) * Math.ceil(Math.abs((supplier.inventory[product].outsideConsump + avgAmt - supplier.inventory[product].dailyProduction)/inventory.daysToAdj));
            }

            var consumption = General.getRandomInt(Math.round(supplier.inventory[product].outsideConsump * 0.8), Math.round(supplier.inventory[product].outsideConsump * 1.25));
            supplier.inventory[product].available -= consumption;
            if(supplier.inventory[product].available < 0)
                supplier.inventory[product].available = 0;

            // Add in loyalty decay
            supplier.loyalty -= 0.01;
            supplier.loyalty = Math.max(0, supplier.loyalty);
        }
    }

    /**
     * Creates a new supplier object and pushes it to the local variable. Then
     * updates the copy in local storage.
     * 
     * @author - Albert Deng
     * @param - {name} The name of the supplier
     * @param - {id} The ID of the supplier
     * @param - {products} An array of product objects that the supplier carries
     * @param - {inventory} An object containing the supplier's inventory parameters
     */
    function createSupplierObject(name, id, products, inventory) {
        var obj = {
            'name': name,
            'id': id,
            'products': products,
            'inventory': inventory,
            'loyalty': 0,
            'contracts': {}
        }
        var history = {};
        for(var i = 0; i < products.length; i++) {
            history[products[i].id] = [];
        }
        obj.history = history;
        suppliers.push(obj);
        updateSuppliers();
    }

    /**
     * Regenerate purchase contracts for the supplier. Has a possibility of not generating
     * a contract at all. The terms and conditions of the contract are randomly generated.
     * 
     * @author - Albert Deng
     * @param - {supplier} The supplier to generate contracts for
     */
    function refreshPurchaseContracts(supplier) {
        var daysArray = [15, 30, 45];
        for(var i = 0; i < supplier.products.length; i++) {
            var products = supplier.products;
            // For now, generate contract randomly
            // Insert code to determine whether or not a contract should be made
            if(Math.random() > 0.5) {
                supplier.contracts[products[i].id] = {
                    'units': Math.round(supplier.inventory[products[i].id].available * 0.5),
                    'price': supplier.inventory[products[i].id].price * Math.round(1 - calculateLoyaltyDiscount(supplier.loyalty)),
                    'id': products[i].id,
                    'terms': daysArray[General.getRandomInt(0,2)]
                }
            } else {
                delete supplier.contracts[products[i].id];
            }
        }
    }

    /**
     * Checks whether the given product exists in the given array based on 
     * the product's ID.
     * 
     * @author - Albert Deng
     * @param - {product} The product to check for
     * @param - {arr} The array of products to check against
     * @return - {Boolean} Whether or not the product exists in the array
     */
    function productExistsInArr(product, arr) {
        for(var i = 0; i < arr.length; i++) {
            if(arr[i]['id'] == product['id'])
                return true;
        }
        return false;
    }

    return {
        /**
         * Contains the entities functions that are timer based. Is called in the
         * timer update code.
         * 
         * @author - Albert Deng
         */
        scheduledProcess: function() {
            // If we are at the beginning of the day and time is running
            if($rootScope.date.getUTCHours() == 0 && $rootScope.runTime) {
                // Increase supplier inventory
                for(var i = 0; i < suppliers.length; i++) {
                    updateProduction(suppliers[i]);
                    for(var j = 0; j < suppliers[i]['products'].length; j++) {
                        var prodID = suppliers[i]['products'][j]['id'];
                        suppliers[i]['inventory'][prodID]['available'] += suppliers[i]['inventory'][prodID]['dailyProduction'];
                    }

                    // Once a week (on Sunday)
                    if($rootScope.date.getDay() == 0 && $rootScope.runTime) {
                        refreshPurchaseContracts(suppliers[i]);
                    }
                }
                updateSuppliers();
            }

        },
        /**
         * Returns the suppliers object.
         * 
         * @author - Albert Deng
         * @return - {Array} An array of suppliers objects
         */
        getSuppliers: function() {
            return getSuppliers();
        },
        /**
         * Creates a new supplier object using local code.
         * 
         * @author - Albert Deng
         * @param - {name} The name of the supplier
         * @param - {products} The products that the supplier will sell
         * @param - {inventory} The supplier's parameters for the products
         */
        createSupplier: function(name, products, inventory) {
            createSupplierObject(name, products, inventory);
        },
        /**
         * Increases the given supplier's loyalty value by the provided amount.
         * 
         * @author - Albert Deng
         * @param - {supplierid} The ID of the supplier to manipulate
         * @param - {loyalty} The amount to increase the supplier's loyalty by
         */
        addLoyalty: function(supplierid, loyalty) {
            for(var i = 0; i < suppliers.length; i++) {
                if(suppliers[i] == supplierid) {
                    suppliers[i].loyalty += loyalty;
                    return;
                }
            }
        },
        /**
         * Searches and returns the suppliers array for a supplier with the given ID.
         * If the supplier cannot be found, will return -1.
         * 
         * @author - Albert Deng
         * @param - {id} The id to search for
         * @return - {Object} The supplier object being searched for, or -1 if not found
         */
        getSupplier: function(id) {
            for(var i = 0; i < suppliers.length; i++) {
                if(suppliers[i]['id'] == id)
                    return suppliers[i];
            }
            return -1;
        },
        /**
         * Removes a given number of units of product from the supplier's inventory. Will also
         * create a transaction in the supplier's history to help the supplier adjust for the future.
         * 
         * @author - Albert Deng
         * @param - {supplierid} The ID of the supplier that inventory was purchased from
         * @param - {productid} The ID of the product that was purchased
         * @param - {units} The number of units purchased
         */
        buyFromSupplier: function(supplierid, productid, units) {
            for(var i = 0; i < suppliers.length; i++) {
                if(suppliers[i]['id'] == supplierid) {
                    suppliers[i].inventory[productid].available;
                    suppliers[i].inventory[productid].available -= units;
                    if(suppliers[i].inventory[productid].available < 0)
                        suppliers[i].inventory[productid].available = 0;
                    suppliers[i].history[productid].push({
                        'amount': units,
                        'date': $rootScope.date.getTime()
                    });
                    return;
                }
            }
        },
        /**
         * Returns the current loyalty discount calculated for the given supplier.
         * 
         * @author - Albert Deng
         * @param - {supplierid} The ID of the supplier to check
         * @return - {Number} The loyalty discount percentage
         */
        getCurrentDiscount: function(supplierid) {
            for(var i = 0; i < suppliers.length; i++) {
                if(suppliers[i]['id'] == id)
                    return calculateLoyaltyDiscount(suppliers[i].loyalty);
            }
        },
        /**
         * Generates the initial set of suppliers that define the procurement market
         * for this business unit.
         * 
         * @author - Albert Deng
         */
        generateSuppliers: function() {
            // Sample product that will be replaced with actual code later
            Products.generateProducts();

            var numSuppliers = General.getRandomInt(2,5);
            for(var i = 0; i < numSuppliers; i++) {
                var inventory = {};
                var productArray = [];
                var numItems = General.getRandomInt(1, Products.getProducts().length);
                for(var j = 0; j < numItems; j++) {
                    var sampleProduct = Products.getRandomProduct();
                    if(!productExistsInArr(sampleProduct, productArray)) {
                        productArray.push(sampleProduct);
                        inventory[sampleProduct['id']] = {
                            'available': Math.round(sampleProduct['optimal'][1]/(1-0.8)),
                            'price': Math.round(calculateSupplierPrice(sampleProduct['optimal'][0])),
                            'daysToAdj': General.getRandomInt(3,15),
                            'expComp': Math.random() * 0.4 + 0.4,
                            'dailyProduction': Math.round(sampleProduct['optimal'][1]/(1-0.8)),
                            'outsideConsump': Math.round(sampleProduct['optimal'][1]*(1/(1-0.8)-1))
                        };
                    }
                }

                productArray.sort( function(a, b) {
                    return parseInt(a['id']) - parseInt(b['id']);
                });

                var id = General.getRandomInt(100,300);
                createSupplierObject('Supplier ' + id, id, productArray, inventory);
            }
            updateSuppliers();
        }
    }
});