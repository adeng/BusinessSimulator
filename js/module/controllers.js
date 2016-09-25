angular.module('main.controllers', [])

.controller('GlobalCtrl', function($scope, $rootScope, $interval, Inventory, Sales, General) {
    // Disable this on live production
    General.clearAll();

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

    /* Time Code */
    $rootScope.date = new Date("1/1/2000");
    $rootScope.interval = (24 * 60 * 60 * 1000);
    $rootScope.runTime = false;
    $rootScope.formattedDate = $rootScope.date.toLocaleString();

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
            $rootScope.date.setTime($rootScope.date.getTime() + $rootScope.interval);
            $rootScope.formattedDate = $rootScope.date.toLocaleString();
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
    $scope.invUnits = Inventory.getInventoryUnits();
    $scope.invValue = Inventory.getInventory();
    $scope.contracts = Inventory.getContracts();

    $scope.buyUnits = function(units, price) {
        Inventory.buyInventory(units, price);

        // Update dashboard numbers
        $scope.invUnits = Inventory.getInventoryUnits();
        $scope.invValue = Inventory.getInventory();
    }

    $scope.makeContract = function(units, price, terms) {
        Inventory.makeContract(units, price, terms);
        $scope.contracts = Inventory.getContracts();
    }
})

.controller('SalesCtrl', function($scope, $rootScope) {
    // Initialization Code
    $rootScope.title = "Sales";
})

.controller('FinancialsCtrl', function($scope, $rootScope, localStorageService, Accounting) {
    // Initialization Code
    $rootScope.title = "Financials";
    
    Accounting.updateAccounts().then(function(val) {
        $scope.GL = val;
    });

    $scope.books = Accounting.getAccounts();
    console.log($scope.books);
    $scope.accounts = Object.keys($scope.books);
});