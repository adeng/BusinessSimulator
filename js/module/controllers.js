angular.module('main.controllers', [])

.controller('GlobalCtrl', function($scope, $rootScope, $interval, Inventory, Sales, General) {
    // Disable this on live production
    General.clearAll();

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

            $rootScope.date.setTime($rootScope.date.getTime() + $rootScope.interval + (newDate.getUTCHours() - oldDate.getUTCHours())*60000);

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
})

.controller('HomeCtrl', function($rootScope) {
    // Initialization Code
    $rootScope.title = "Home";
})

.controller('SourcingCtrl', function($scope, $rootScope, Inventory, General) {
    // Initialization Code
    $rootScope.title = "Sourcing";
    $scope.purchase = {
        "units": 0
    };
    
    // Watch the dashboard variables for change
    $scope.$watch(Inventory.getInventory, function() {
        $scope.invUnits = Inventory.getInventoryUnits();
        $scope.invValue = Inventory.getInventory();
        $scope.contracts = Inventory.getContracts();
    });

    /**
     * Buy inventory units using the Inventory factory's function.
     * 
     * @author - Albert Deng
     * @param - {units} The number of units to buy
     * @param - {price} The price at which to buy the units
     */
    $scope.buyUnits = function(units, price) {
        if(units < 0) {
            alert("Cannot purchase negative units");
            return;
        }
        Inventory.buyInventory(units, price);
        alert("Purchased " + units + " units at $" + price);
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
        console.log(val, Object.keys(val));
        $scope.accounts = Object.keys(val);
        console.log($scope.accounts);

        var temp = [];
        for(var i = 0; i < $scope.accounts.length; i++) {
            if(temp[parseInt($scope.accounts[i][0])] == undefined)
                temp[parseInt($scope.accounts[i][0])] = [];
            temp[parseInt($scope.accounts[i][0])].push($scope.accounts[i]);
        }
        console.log(temp);
        
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