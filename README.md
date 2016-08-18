# RateConverter
# :::::::::::::::::::::::::::::::::::::::::::

[npm module](https://www.npmjs.com/package/rate-converter) to convert Currency Rates Using the REST API from [Open Exchange Rates](https://openexchangerates.org/)


> A small library providing a utility method to convert from different rates supporting the latest rates and historical rates.

> Storing Data using MongoDB (optional) and the FileSystem to avoid requesting data already requested previously.


## Installation

```
  npm install rate-converter --save
```

## Usage
```javascript

    // require the module
    var rateConverter = require('rate-converter');

    //Initialize the object with your settings
    rateConverter.initialize({
        //Name the collection in DB
        historyCollection: 'history',
        //Name the folder in the FileSystem
        historyFolder: 'history',
        //If you don't provide this, the module will use FileSystem
        mongodb_url: 'mongodb://127.0.0.1/yourDB',
        //Provide your API key from https://openexchangerates.org/
        API_KEY: 'yourAPIKEY',
        //A time in milliseconds to update the latest rates.
        updateLatestRates : 10000
        });
    
    //Conversion using historical data
      rateConverter.convertRates('historical', '2016-05-16', 'MXN', 1000, 'USD')
      .then(function (result) {
         console.log(result);
        }, function (error) {
           console.log(error)
        });
            
    //Conversion using latest data
    rateConverter.convertRates('latest', 'latest', 'USD', 1000, 'MXN')
        .then(...);
            
    //Obtain a list of supported currencies
    rateConverter.convertRates('currencies', 'currencies')
        .then(...);
    
    //Obtain a list of historical currency rates
    rateConverter.getData('historical', 'YYYY-MM-DD')
        .then(...);
```


## Tests
```javascript
  cd tests
  jasmine
```


## Contribution(s)

Initial implementation, feel free to contribute. If you have a comment, feel free to suggest and fork the project!


## Note(s) - Updates

This module can be improved to perform better, as of now im a little busy but i'll be working as soon as i can to integrate the feature of multiple conversions in an array based syntax.


## Release History

* 0.1.5 Update Test Files
* 0.1.4 Initial release Fixed
* 0.1.3 Fixed historical folder from server root
* 0.1.2 Initial release completed
* 0.1.1 Fixed folder for historical data
* 0.1.0 Initial release