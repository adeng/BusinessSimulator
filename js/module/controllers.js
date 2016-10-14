angular.module('main.controllers', [])

.controller('GlobalCtrl', function($scope, $rootScope, $interval, localStorageService, Entities, Inventory, Sales, General) {
    // Disable this on live production
    General.clearAll();
    Entities.generateSuppliers();

    /* Time Code */
    $rootScope.date = new Date("1/1/2000");
    $rootScope.date.setTime($rootScope.date.getTime() - $rootScope.date.getTimezoneOffset()*60000);
    $rootScope.interval = (24 * 60 * 60 * 1000);
    $rootScope.runTime = false;
    $rootScope.formattedDate = $rootScope.date.toUTCString();

    var stop;
    
    /**
     * Starts the timer.
     * 
     * @author - Albert Deng
     */
    $rootScope.startTime = function() {
        // Don't start the timer again if it's already running
        if($rootScope.runTime == true) 
            return;
        $rootScope.runTime = true;
        
        stop = $interval(function() {
            var oldDate = $rootScope.date;
            var newDate = new Date($rootScope.date.getTime() + $rootScope.interval);

            // Scheduled Processes
            Inventory.scheduledProcess();
            Sales.scheduledProcess();
            Entities.scheduledProcess();

            $rootScope.date.setTime($rootScope.date.getTime() + $rootScope.interval + (newDate.getUTCHours() - oldDate.getUTCHours())*60000);

            localStorageService.set('time', $rootScope.date.getTime());

            $rootScope.formattedDate = $rootScope.date.toUTCString();
        }, 1000);
    }

    /**
     * Stops the timer.
     * 
     * @author - Albert Deng
     */
    $rootScope.stopTime = function() {
        $interval.cancel(stop);
        $rootScope.runTime = false;
        stop = undefined;
    }

    /**
     * Toggles the timer depending on the current run state.
     * 
     * @author - Albert Deng
     */
    $rootScope.toggleTime = function() {
        if($rootScope.runTime == true)
            $rootScope.stopTime();
        else
            $rootScope.startTime();
    }

    // Start time by default
    $rootScope.startTime();

    /* Side Pane Code */
	$scope.splitViewElement = document.getElementById("splitView");
    window.onresize = setPane;
    window.onload = setPane;

    /**
     * Close the splitview pane.
     * 
     * @author - Albert Deng
     */
	$scope.hidePane = function() {
		$scope.splitViewObject.closePane();
	}
    
    /**
     * Set the document splitview display mode based on the document's width.
     * 
     * @author - Albert Deng
     */
    function setPane() {
        document.getElementById("loader").innerHTML = "";
        document.getElementById("header-container").className = "";
        var width = window.innerWidth;
        
        if( width <= 500 ) {
            $scope.splitViewObject.closedDisplayMode = WinJS.UI.SplitView.ClosedDisplayMode.none;
        } else {
            $scope.splitViewObject.closedDisplayMode = WinJS.UI.SplitView.ClosedDisplayMode.inline;
        }
    }

    /* RootScope Wrappers */
    
    /**
     * Rootscope wrapper for General accounting formatting method.
     * 
     * @author - Albert Deng
     * @param - {num} The number to format
     */
    $rootScope.formatInt = function(num) {
        return General.formatAccountingInt(num);
    }

    /**
     * Function to format the given UNIX time number to a date string.
     * 
     * @author - Albert Deng
     * @param - {date} The UNIX time to format
     * @return - {String} A string representation of the date
     */
    $rootScope.formatDate = function(date) {
        var d = new Date(date);
        return d.toUTCString();
    }

    $rootScope.time_toggler = function(event) {
      if (event.keyCode == 32)  {
            $rootScope.toggleTime();
           
        }
    }

})

.controller('HomeCtrl', function($rootScope) {
    // Initialization Code
    $rootScope.title = "Home";
})

.controller('SourcingCtrl', function($scope, $state, $rootScope, Entities, Products, Inventory, General) {
    // Initialization Code
    $rootScope.title = "Procurement";
    $scope.purchase = {
        "units": 0
    };

    $scope.purchaseLog = Inventory.getPurchaseLog();
    
    // Watch the dashboard variables for change
    $scope.$watch(Inventory.getInventory, function() {
        $scope.invUnits = Inventory.getInventoryUnits();
        $scope.invValue = Inventory.getInventory();
        $scope.contracts = Inventory.getContracts();
        $scope.invTable = Inventory.getInventoryObject();
    });

    // Update the suppliers and their ticking information
    $scope.$watch(Entities.getSuppliers, function() {
        $scope.suppliers = Entities.getSuppliers();
    });

    $scope.$watch(Inventory.getPurchaseLog, function() {
        $scope.purchaseLog = Inventory.getPurchaseLog();
    })

    /**
     * Navigates to the purchase page.
     * 
     * @author - Albert Deng
     */
    $scope.openProductPage = function(supplier, product) {
        $state.go('sourcing.purchase', {supplierid: supplier, productid: product});
    }

    /**
     * A scope wrapper for the getProduct service function. Returns the given
     * product's name, given its ID.
     * 
     * @author - Albert Deng
     * @param - {id} The ID of the product to search for
     * @return - {String} The product name
     */
    $scope.getProductName = function(id) {
        return Products.getProduct(id).name;
    }

    /**
     * A scope wrapper for the getSupplier service function. Returns the given
     * supplier's name, given its ID.
     * 
     * @author - Albert Deng
     * @param - {id} The ID of the supplier to search for
     * @return - {String} The supplier name
     */
    $scope.getSupplierName = function(id) {
        return Entities.getSupplier(id).name;
    }

    /**
     * Create a contract using the Inventory factory's function.
     * 
     * @author - Albert Deng
     * @param - {units} The number of units to buy
     * @param - {price} The price at which to buy the units
     * @param - {terms} The number of days over which to repeat the contract
     */
    $scope.makeContract = function(units, price, terms) {
        Inventory.makeContract(units, price, terms);
        $scope.contracts = Inventory.getContracts();
        alert("Contract created");
    }
})

.controller('SourcingBuyCtrl', function($scope, $state, $rootScope, $stateParams, General, Entities, Products, Inventory) {
    // Fetch the product and supplier IDs from the URL
    $scope.supplier = Entities.getSupplier($stateParams.supplierid);
    $scope.product = Products.getProduct($stateParams.productid);

    // Object to store the value from the purchase input box
    $scope.purchase = {};
    $scope.purchase.quantity = 0;

    /**
     * Creates a contract object for a recurring purchase.
     * 
     * @author - Albert Deng
     * @param - {contract} The object containing the contract terms
     */
    $scope.buyContract = function(contract) {
        Inventory.makeContract(contract.units, contract.price, $scope.product.id, $scope.supplier.id, contract.terms);
        alert("Contract signed");
        
        $state.go('sourcing');
    }
    
    /**
     * Purchases inventory if the number of units in the contract does not exceed the
     * total number of units available for sale. Will also calculate and increase the 
     * supplier's loyalty value and navigate back to the Procurement page.
     * 
     * @author - Albert Deng
     * @param - {units} The number of units to purchase 
     */
    $scope.buyInventory = function(units) {
        // This logic will have to be updated in the future
        $scope.supplier.loyalty++;

        if(units > $scope.supplier.inventory[$scope.product.id].available || units == undefined) {
            alert("Not enough units of inventory to purchase.");
            $state.go('sourcing');
            return;
        }

        // Calculate loyalty based on a fraction of the units purchased
        $scope.supplier.loyalty += 2 * (units / $scope.supplier.inventory[$scope.product.id].available);

        // Call backend service functions
        var price = $scope.supplier.inventory[$scope.product.id].price;
        Inventory.buyInventory(units, price, $scope.product.id, $scope.supplier.id);
        Entities.buyFromSupplier($scope.supplier.id, $scope.product.id, units);

        alert("Purchased " + units + " units at $" + price + " for a total cost of $" + $rootScope.formatInt(price * units));

        $state.go('sourcing');
    }
})

.controller('SalesCtrl', function($scope, $rootScope, Sales) {
    // Initialization Code
    $rootScope.title = "Sales";

    // Watch the dashboard variables to update
    $scope.$watch(Sales.getSalesData, function() {
        var salesInfo = JSON.parse(Sales.getSalesData());
        $scope.totalCash = salesInfo['totalCash'];
        $scope.totalCredit = salesInfo['totalCredit'];
        $scope.monthlyCash = salesInfo['monthlyCash'];
        $scope.monthlyCredit = salesInfo['monthlyCredit'];
        $scope.avgCash = salesInfo['avgCash'];
        $scope.avgCredit = salesInfo['avgCredit'];
    })
})

.controller('FinancialsCtrl', function($scope, $rootScope, localStorageService, Accounting) {
    // Initialization Code
    $rootScope.title = "Financials";
    $scope.sections = {};

    Accounting.updateAccounts().then(function(val) {
        $scope.GL = val;
        $scope.accounts = Object.keys(val);

        var temp = [];
        for(var i = 0; i < $scope.accounts.length; i++) {
            if(temp[parseInt($scope.accounts[i][0])] == undefined)
                temp[parseInt($scope.accounts[i][0])] = [];
            temp[parseInt($scope.accounts[i][0])].push($scope.accounts[i]);
        }
        
        $scope.sections.assets = temp[1];
        $scope.sections.liabilities = temp[2];
        $scope.sections.equity = temp[3];
        $scope.sections.revenues = temp[5];
        $scope.sections.expenses = temp[6];
        $scope.sections.others = temp[8].concat(temp[9]);
    });

    $scope.$watch(Accounting.getAccounts, function() {
        $scope.books = JSON.parse(Accounting.getAccounts());
    });
});