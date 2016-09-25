angular.module('main.controllers', [])

.controller('GlobalCtrl', function($scope, $rootScope, $interval) {
    /* Side Pane Code */
	$scope.splitViewElement = document.getElementById("splitView");
    window.onresize = setPane;
    window.onload = setPane;

	$scope.hidePane = function() {
		$scope.splitViewObject.closePane();
	}
    
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
    
    $rootScope.startTime = function() {
        runTime = true;
        
        stop = $interval(function() {
            date.setTime(date.getTime() + interval);
            $rootScope.formattedDate = date.toLocaleString();
        }, 1000);
    }

    $rootScope.stopTime = function() {
        $interval.cancel(stop);
        runTime = false;
        stop = undefined;
    }

    $rootScope.filterDate = function(date) {
        return date.toLocaleString();
    }
})

.controller('HomeCtrl', function($scope) {

});