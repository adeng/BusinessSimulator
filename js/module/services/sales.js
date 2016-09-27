angular.module('main.sales', [])

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