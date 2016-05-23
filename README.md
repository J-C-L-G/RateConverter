# RateConverter
# =============

npm module to convert currency rates 
Using the REST API from https://openexchangerates.org/

A small library providing a utility method to convert from different rates
supporting the latest rate and historical rates.

Storing Data using MongoDB (optional) and the FileSystem
to avoid requesting data already requested previously.


## Installation

  npm install rate-converter --save

## Usage

    var rateConverter = require('rate-converter');
    
    rateConverter.initialize({
        historyCollection: 'history', 				//Name the collection in DB
        historyFolder: 'history',					//Name the folder in the FileSystem
        mongodb_url: 'mongodb://127.0.0.1/yourDB',	//If you don't provide this, the module will use FS not MongoDB
        API_KEY: yourAPIKEY',						//Provide your API key from https://openexchangerates.org/
        updateLatestRates : 10000					//A time in milliseconds to update the latest rates.
        });
    
    //for historical data
      rateConverter.convertRates('historical', '2016-05-16', 'MXN', 1000, 'USD')
      .then(function (result) {
         console.log(result);
        }, function (error) {
           console.log(error)
        });
            
    //for latest data
    rateConverter.convertRates('latest', 'latest', 'USD', 1000, 'MXN')
        .then(...);
            
    //for supported currencies 
    rateConverter.convertRates('currencies', 'currencies')
        .then(...);
    
    //for JSON Data
    rateConverter.getData('historical', 'YYYY-MM-DD')
        .then(...);

## Tests

  cd tests
  
  jasmine

## Contributing

Initial implementation, feel free to contribute!

## Release History

* 0.1.2 Initial release completed
* 0.1.1 Fixed folder for historical data
* 0.1.0 Initial release