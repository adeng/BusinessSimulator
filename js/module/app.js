(function() {
	var home = angular.module('main', ['winjs', 'LocalStorageModule', 'ui.router', 'main.controllers', 'main.services'])
	
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
