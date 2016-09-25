angular.module('main.controllers', [])

.controller('GlobalCtrl', function($scope, $rootScope, $interval, General) {
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
    var date = new Date("1/1/2000");
    var interval = (60 * 60 * 1000);
    var runTime = false;
    $rootScope.formattedDate = date.toLocaleString();

    var stop;
    
    /**
     * Starts the timer.
     * 
     * @author - Albert Deng
     */
    $rootScope.startTime = function() {
        runTime = true;
        
        stop = $interval(function() {
            date.setTime(date.getTime() + interval);
            $rootScope.formattedDate = date.toLocaleString();
        }, 1000);
    }

    /**
     * Stops the timer.
     * 
     * @author - Albert Deng
     */
    $rootScope.stopTime = function() {
        $interval.cancel(stop);
        runTime = false;
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
    Inventory.buyInventory(General.getRandomInt(0, 1000), General.getRandomInt(2, 8));
    $scope.invUnits = Inventory.getInventoryUnits();
    $scope.invValue = Inventory.getInventory();
})

.controller('FinancialsCtrl', function($scope, $rootScope, localStorageService, Accounting) {
    $rootScope.title = "Financials";
    
    Accounting.updateAccounts().then(function(val) {
        $scope.GL = val;
    });
     
    $scope.books = Accounting.getAccounts();
    $scope.accounts = Object.keys($scope.books);
    console.log($scope.accounts);
});