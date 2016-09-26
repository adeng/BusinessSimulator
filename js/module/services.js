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
            var str = Math.round(num).toString();
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
        },
        /**
         * Returns the number of days between two dates.
         * 
         * @author - StackOverflow
         * @return - {Number} The number of days between the two dates
         */
        daysBetween: function(firstDate, secondDate) {
            var oneDay = 24 * 60 * 60 * 1000;
            return Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));
        }
    }
})

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
     * Calculates a random supplier price ranging from 75% of the initial price to
     * 110% of the initial price.
     * 
     * @author - Albert Deng
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
        }
    }

    /**
     * Creates a new supplier object and pushes it to the local variable. Then
     * updates the copy in local storage.
     * 
     * @author - Albert Deng
     */
    function createSupplierObject(name, id, products, inventory) {
        var obj = {
            'name': name,
            'id': id,
            'products': products,
            'inventory': inventory,
            'loyalty': 0
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
     * Checks whether the given product exists in the given array based on 
     * the product's ID.
     * 
     * @author - Albert Deng
     * @param - {product} The product to check for
     * @param - {arr} The array of products to check against
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
                }
                updateSuppliers();
            }
        },
        /**
         * Returns the suppliers object.
         * 
         * @author - Albert Deng
         */
        getSuppliers: function() {
            return getSuppliers();
        },
        /**
         * Creates a new supplier object using local code.
         * 
         * @author - Albert Deng
         */
        createSupplier: function(name, products, inventory) {
            createSupplierObject(name, products, inventory);
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
})

.factory('Products', function($rootScope, localStorageService, General) {
    var products = [];

    /**
     * Returns an optimal price and quantity based on a demand and supply function.
     * 
     * @author - Albert Deng
     * @param - {demand} An array of demand function coefficients
     * @param - {supply} An array of supply function coefficients
     * @return - {Array} An array containing the optimal price and quantity
     */
    function supplyDemandIntersect(demand, supply) {
        var q = (demand[1] - supply[1])/(supply[0] - demand[0]);
        var p = demand[0] * q + demand[1];

        return [p, q];
    }

    /**
     * Fetches and returns the products currently available. Also updates the localStorage
     * products object from the local session.
     * 
     * @author - Albert Deng
     * @return - {Array} The array of products
     */
    function getProducts() {
        updateProducts();
        return products;
    }

    /**
     * Updates the localStorage products object from the local session variable.
     * 
     * @author - Albert Deng
     */
    function updateProducts() {
        localStorageService.set('products', JSON.stringify(products));
    }

    /**
     * Creates a new product object and inserts it into the products array.
     * 
     * @author - Albert Deng
     * @param - {name} The name of the product
     * @param - {id} The id number of the product
     * @param - {demand} An array of the demand coefficients for the product
     * @param - {supply} An array of the supply coefficients for the product
     */
    function createProduct(name, id, demand, supply, durable) {
        var obj = {
            'name': name,
            'id': id,
            'demand': demand,
            'supply': supply,
            'durable': durable,
            'optimal': supplyDemandIntersect(demand, supply)
        }
        products.push(obj);
        updateProducts();
    }

    return {
        /**
         * Returns a random product from the list of products.
         * 
         * @author - Albert Deng
         * @return - {Object} A product object
         */
        getRandomProduct: function() {
            return products[General.getRandomInt(0, products.length - 1)];
        },
        /**
         * Returns the demand function coefficient array for the given product's id.
         * 
         * @author - Albert Deng
         * @return - {Array} An array containing the demand function's coefficients
         */
        getProductDemand: function(id) {
            for(var i = 0; i < products.length; i++) {
                if(products[i]['id'] == id)
                    return products[i]['demand'];
            }
        },
        /**
         * Returns the product object given a certain id.
         * 
         * @author - Albert Deng
         * @return - {Object} The product object
         */
        getProduct: function(id) {
            for(var i = 0; i < products.length; i++) {
                if(products[i]['id'] == id)
                    return products[i];
            }
        },
        /**
         * Fetches and returns the products array.
         * 
         * @author - Albert Deng
         * @return - {Array} An array of product objects
         */
        getProducts: function() {
            return products;
        },
        /**
         * Generates a random number of products with their associated parameters.
         * 
         * @author - Albert Deng
         */
        generateProducts: function() {
            var numProducts = General.getRandomInt(3, 8);
            for(var i = 0; i < numProducts; i++) {
                createProduct(
                    'Product ' + (i + 1), 
                    i.toString(), 
                    [-1*(Math.random()*(3-0.5) + 0.5), General.getRandomInt(50, 300)],
                    [(Math.random()*(3-0.5) + 0.5), General.getRandomInt(0, 20)],
                    Math.random()
                )
            }
        }
    }
})

.factory('Sales', function($interval, $rootScope, localStorageService, Inventory, Accounting) {
    var supply = {

    };

    var demand = {
        "1": [-30, 90]
    };

    // Constant variables
    var cashSales = 0.9;
    var price = 10;

    // These should be stored locally
    var totalCashSales = 0;
    var totalCreditSales = 0;
    var monthlyCashSales = 0;
    var monthlyCreditSales = 0;
    
    /**
     * Function that calculates the number of units of the given product to be sold based on
     * the demand equation generated.
     * 
     * @author - Albert Deng
     * @param - {product} The id of the product to calculate units for
     * @return - {Number} The number of units to be sold
     */
    function calcUnitsSold(product) {
        return Math.floor(($rootScope.interval/(24 * 60 * 60 * 1000))*(3 - price/30));
    }

    /**
     * Function that updates the object storing total, monthly, and average sales information.
     * 
     * @author - Albert Deng
     * @param - {cash} The dollar value of cash sales
     * @param - {credit} The dollar value of credit sales
     * @param - {endOfMonth} Whether or not a month has passed
     * @param - {numDays} The number of days since the beginning of the month
     */
    function updateSalesAmount(cash, credit, endOfMonth, numDays) {
        // Create the object if it does not already exist
        if(localStorageService.get('sales') == null) {
            var a = {
                'totalCash': 0,
                'totalCredit': 0,
                'monthlyCash': 0,
                'monthlyCredit': 0,
                'avgCash': 0,
                'avgCredit': 0
            };
            localStorageService.set('sales', JSON.stringify(a));
        }

        sales = JSON.parse(localStorageService.get('sales'));

        // Append cash and credit information
        sales['totalCash'] += cash; 
        sales['totalCredit'] += credit; 

        // Reset cash and credit information at the beginning of a new month
        sales['monthlyCash'] =  endOfMonth ? cash : sales['monthlyCash'] + cash; 
        sales['monthlyCredit'] = endOfMonth ? credit : sales['monthlyCredit'] + credit; 

        // Calculate the average cash and credit sales over the most recent month
        sales['avgCash'] = sales['monthlyCash']/numDays;
        sales['avgCredit'] = sales['monthlyCredit']/numDays;

        localStorageService.set('sales', JSON.stringify(sales));
    }

    /**
     * Process sales for every single product that exists.
     * 
     * @author - Albert Deng
     * @return - {Array} An array containing the amount of cash and credit sales
     */
    function makeSale() {
        var products = Object.keys(demand);

        // Don't sell anything if there's nothing TO sell
        if(Inventory.getInventoryUnits() == 0)
            return [0, 0];

        var cashSalesValue = 0;
        var creditSalesValue = 0;

        for(var i = 0; i < products; i++) {
            var units = calcUnitsSold(products[i]);
            var salesInfo = Inventory.sellInventory(units);
            var value = salesInfo[1] * price;

            // Add the amount of cash and credit sales
            cashSalesValue += Math.round(value * cashSales);
            creditSalesValue += (value - Math.round(value * cashSales));

            // Make journal entry
            Accounting.makeJournalEntry([
                // Debit Cash
                [1001, cashSalesValue],
                // Debit AR
                [1011, value - cashSalesValue],
                // Credit revenue
                [5001, -1 * value]
            ]);
        }

        return [cashSalesValue, creditSalesValue];
    }

    return {
        /**
         * Contains the sales functions that are timer based. Is called in the
         * timer update code.
         * 
         * @author - Albert Deng
         */
        scheduledProcess: function() {
            // If we are at the beginning of a day and time is running
            if($rootScope.date.getUTCHours() == 0 && $rootScope.runTime) {
                var salesInfo = makeSale();
                updateSalesAmount(salesInfo[0], salesInfo[1], $rootScope.date.getDate() == 1, $rootScope.date.getDate());
            }
        },
        /**
         * Return total, monthly, and average daily sales information in a string
         * representation.
         * 
         * @author - Albert Deng
         * @return - {String} A string representation of the sales data object
         */
        getSalesData: function() {
            if(localStorageService.get('sales') == null) {
                var a = {
                    'totalCash': 0,
                    'totalCredit': 0,
                    'monthlyCash': 0,
                    'monthlyCredit': 0,
                    'avgCash': 0,
                    'avgCredit': 0
                };
                localStorageService.set('sales', JSON.stringify(a));
            }
            return localStorageService.get('sales');
        }
    }
})

.factory('Inventory', function($interval, $rootScope, localStorageService, General, Accounting) {
    var contracts = [];
    
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
         * Contains the inventory functions that are timer based. Is called in the
         * timer update code.
         * 
         * @author - Albert Deng
         */
        scheduledProcess: function() {
            if($rootScope.date.getUTCHours() == 0 && $rootScope.runTime) {
                for(var i = 0; i < contracts.length; i++) {
                    // Buy inventory on account if date terms are met
                    if(General.daysBetween($rootScope.date, contracts[i][3]) % contracts[i][2] == 0) {
                        buyInventory(contracts[i][0], contracts[i][1], true);
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
        buyInventory: function(units, price, account) {
            buyInventory(units, price, account);
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
         * @param - {days} The number of days which the contract should be repeated
         */
        makeContract: function(quantity, price, days) {
            contracts.push([quantity, price, days, new Date($rootScope.date.getTime())]);
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
                if(account.toString()[0] == "1" || account.toString()[0] == "6" || account.toString()[0] == "8") {
                    addValue(account, value);
                } else {
                    // Add positive value if credit, add negative if debit
                    (value < 0) ? addValue(account, -1 * value) : addValue(account, value);
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
            return JSON.stringify(getBooks());
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
});