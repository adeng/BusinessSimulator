(function() {
	var home = angular.module('main', [
		'winjs', 
		'LocalStorageModule', 
		'ui.router', 
		'main.controllers', 
		'main.accounting',
		'main.entities',
		'main.general',
		'main.inventory',
		'main.products',
		'main.sales'
	])
	
	.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
		$stateProvider
		
		.state('home', {
			url: '/',
			templateUrl: 'templates/home/index.html',
			controller: 'HomeCtrl'
		})

        .state('sourcing', {
			url: '/sourcing',
			templateUrl: 'templates/sourcing/index.html',
			controller: 'SourcingCtrl'
		})

		.state('purchase', {
			url: '/sourcing/:supplierid/:productid',
			templateUrl: 'templates/processes/purchase.html',
			controller: 'SourcingBuyCtrl'
		})
        
        .state('sales', {
			url: '/sales',
			templateUrl: 'templates/sales/index.html',
			controller: 'SalesCtrl'
		})

        .state('financials', {
			url: '/financials',
			templateUrl: 'templates/financials/index.html',
			controller: 'FinancialsCtrl'
		})
		
		$urlRouterProvider.otherwise("/");
    })

    /* Configure storage module */
    .config(function(localStorageServiceProvider) {
        localStorageServiceProvider
            .setPrefix('businessSimulator')
            .setStorageType('localStorage')
            .setStorageCookie((10*365), '/', false)
            .setNotify(true, true);
    });
})();
