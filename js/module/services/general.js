angular.module('main.general', [])

.factory('General', function(localStorageService) {
    return {
        /**
         * Empties all cached data.
         * 
         * @author - Albert Deng
         */
        clearAll: function() {
            localStorageService.clearAll();
        },
        /** 
         * Generates a random number between the min and max range. If the range 
         * is undefined, then it will generate a number between 0 and 10,000, 
         * inclusive.
         * 
         * @author - Albert Deng
         * @param - {min} The bottom end of the range, inclusive; if undefined, 0
         * @param - {max} The upper end of the range, inclusive; if undefined, 10,000
         * @return - {Number} A random number between the range provided
         */
        getRandomInt: function(min, max) {
            min = (min == undefined) ? 0 : Math.ceil(min);
            max = (max == undefined) ? 10000 : Math.floor(max);
            return Math.floor(Math.random() * (max - min)) + min;
        },
        /**
         * Formats a number using a standard accounting format, rounded to the nearest int.
         * If the number is negative, the method will wrap the number using parentheses.
         * 
         * @author - Albert Deng
         * @param - {num} The number to format
         * @return - {String} The number formatted with parentheses and commas
         */
        formatAccountingInt: function(num) {
            var str = Math.round(num).toString();
            var result = [];
            for(var i = str.length - 1, j = 1; i >= 0; i--, j++) {
                result.unshift(str[i]);
                if(j % 3 == 0 && i != 0 && str[i - 1] != "-") {
                    result.unshift(",");
                }
            }
            if(num < 0) {
                result.shift();
                result.unshift("(");
                result.push(")");
            }
            return result.join('');
        },
        /**
         * Returns the number of days between two dates.
         * 
         * @author - StackOverflow
         * @return - {Number} The number of days between the two dates
         */
        daysBetween: function(firstDate, secondDate) {
            var oneDay = 24 * 60 * 60 * 1000;
            return Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));
        }
    }
});