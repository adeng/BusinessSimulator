angular.module('main.accounting', [])

.factory('Accounting', function($q, $http, localStorageService) {
    /**
     * Checks the local storage for the chart of accounts. If chart of 
     * accounts data does not exist, refresh the localStorage with the data
     * from the JSON file. 
     * 
     * @warning - If the chart of accounts data is not in local storage, may return null
     * 
     * @author - Albert Deng
     * @return - {Object} The chart of accounts data
     */
    function getChartOfAccounts() {
        if(localStorageService.get('accounts') == null) {
            refreshChartOfAccounts();
        }
        return JSON.parse(localStorageService.get('accounts'));
    }

    /**
     * Download the chart of accounts data from the json file into local storage.
     * Return a promise containing the chart of accounts data.
     * 
     * @author - Albert Deng
     * @return - {Promise} A promise that resolves to the chart of accounts data
     */
    function refreshChartOfAccounts() {
        var deferred = $q.defer();
        $http.get('/data/accounts.json').success( function(data) {
            deferred.resolve(data);
            localStorageService.set('accounts', JSON.stringify(data));
        })
        return deferred.promise;
    }

    /**
     * Fetches and returns the general ledger object from storage. If the object
     * does not exist, then the function will create it.
     * 
     * @author - Albert Deng
     * @return - {Object} The general ledger object 
     */
    function getBooks() {
        if(localStorageService.get('generalledger') == null) {
            var a = {};
            localStorageService.set('generalledger', JSON.stringify(a));
        }
        return JSON.parse(localStorageService.get('generalledger'));
    }
    
    /**
     * Adds the given value to the accounting ledger. Also subtracts if the 
     * value is negative.
     * 
     * @param - {account} The GL code for the account to add value to
     * @param - {value} The amount to add into the account
     * @author - Albert Deng
     */
    function addValue(account, value) {
        var books = getBooks();
        
        // Force the account to a string, just in case the programmer forgot
        account = account.toString(); 

        if(books[account] == undefined) {
            books[account] = value;
        } else {
            books[account] += value;
        }

        localStorageService.set('generalledger', JSON.stringify(books));
    }

    return {
        /** 
         * Creates a journal entry from the provided transactions. 
         * 
         * A transaction object has the given form: [account, value]
         * If value is positive, it is processed as a debit; if it is negative, it is a credit
         * 
         * @author - Albert Deng
         * @param - {transactions} An array of transaction objects
         */
        makeJournalEntry: function(transactions) {
            for(var i = 0; i < transactions.length; i++) {
                var account = transactions[i][0];
                var value = transactions[i][1];

                // Check if account is debit
                if(account.toString()[0] == "1" || account.toString()[0] == "6" || account.toString()[0] == "8") {
                    addValue(account, value);
                } else {
                    // Add positive value if credit, add negative if debit
                    (value < 0) ? addValue(account, -1 * value) : addValue(account, value);
                }
            }
        },
        /**
         * Fetches and returns the company's general ledger.
         * 
         * @author - Albert Deng
         * @return - {Object} The company's general ledger object
         */
        getAccounts: function() {
            return JSON.stringify(getBooks());
        },
        /**
         * Update the chart of accounts data.
         * 
         * @author - Albert Deng
         */
        updateAccounts: function() {
            return refreshChartOfAccounts();
        }
    }
});