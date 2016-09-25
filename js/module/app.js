(function() {
	var home = angular.module('main', ['winjs', 'ui.router', 'main.controllers', 'main.services'])
	
	.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
		$stateProvider
		
		.state('home', {
			url: '/',
			templateUrl: 'templates/home/index.html',
			controller: 'HomeCtrl'
		})

    });
})();
