angular.module('main.products', [])

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
});