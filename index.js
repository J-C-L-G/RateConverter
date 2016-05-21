/**************************************
 * Exchange Rates Module              *
 **************************************/

/*** ..:: Require(s) ::.. ***/
var Promise = require('promise'),
    MongoClient = require('mongodb').MongoClient,
    historyCollection,
    http = require('http'),
    fs = require('fs'),
    path = require('path');


/***********  Module Variables  ************/
var API_KEY,
    base,
    mongodbInstance,
    historyFolder,
    serviceProviderUrls = {
        base: 'http://openexchangerates.org/api/',
        historical: function (date) {
            return this.base + 'historical/' + date + '.json' + API_KEY;
        },
        latest: function () {
            return this.base + 'latest.json' + API_KEY;
        }
    };


/***********  Utility Functions ************/

function urlJSONloader(url) {
    return new Promise(function (resolve, reject) {
        var parts = [];
        http.get(url, function (res) {
            res.on('data', function (chunk) {
                parts.push(chunk);
            }).on('end', function () {
                resolve(JSON.parse(parts.join('')));
            }).on('error', function (error) {
                reject(error);
            });
        });
    });
}


/**
 *
 */
function persistsData(date, jsonData) {
    return new Promise(function (resolve, reject) {
        //Persist data into the Database
        if (mongodbInstance) {
            historyCollection.insert({'_id': date, data: jsonData},
                function (error, document) {
                    if (error) {
                        reject(error);
                    }
                });
        }
        //persist data into the FS
        var fileName = historyFolder + date + '.json';
        fs.writeFile(fileName, JSON.stringify(jsonData), 'utf8', function (error) {
            if (error) {
                reject(error);
            }
                resolve(jsonData);
        });
    });
}


/**
 *
 */

function getDataFromService(requestType, date) {
    return new Promise(function (resolve, reject) {
        urlJSONloader(serviceProviderUrls[requestType](date))
            .then(
            function (data) {
                persistsData(date, data)
                    .then(function (data) {
                        resolve(data);
                    },function(error){
                        reject(error);
                    });
            },
            function (error) {
                reject(error);
            });
    });
}

/**
 * Return the document or null if it was not found in the database
 * @param date {string}
 * @return {object}
 */
function getJSONfromDB(date) {
    return new Promise(function (resolve, reject) {
        historyCollection.findOne({'_id': date}, function (error, document) {
            if (error)
                reject(error);
            if (document != null)
                resolve(document);
            else
                reject(document);
        });
    });
}

/**
 * Return the content of a file or
 * @param date {string}
 */
function getJSONfromFS(date) {
    return new Promise(function (resolve, reject) {
        date = historyFolder + date + '.json';
        fs.readFile(date, 'utf-8', function (error, fileContent) {
            if (error)
                reject(null);
            resolve(fileContent);
        });
    });
}

/**
 * Function that retrieves the historial data from the database
 * or request from the service, persist the data and return it.
 * @param date
 */

function getData(requestType, date) {
    return new Promise(function (resolve, reject) {
        if (mongodbInstance) {
            getJSONfromDB(date)
                .then(
                function (data) {
                    resolve(data);
                },
                function (error) {
                    getDataFromService(requestType, date)
                        .then(function (data) {
                            resolve(data);
                        }, function (error) {
                            reject(error);
                        });
                });
        } else {
            getJSONfromFS(date)
                .then(
                function (data) {
                    resolve(data);
                },
                function (error) {
                    getDataFromService(requestType, date)
                        .then(function (data) {
                            resolve(data);
                        }, function (error) {
                            reject(error);
                        })
                });
        }
    });
}


/***********  Public API ************/

/**
 * Function to Setup the MongoDataBase
 *
 * @param {object} {
 *                      API_KEY 'string',
 *                      base 'string' (optional),
 *                      historyFolder 'string' (optional),
 *                      historyCollection 'string' (optional),
 *                      mongodb_url 'string' (optional) - Will work with files instead of mongodb.
 *                 }
 */
function initialize(options) {
    base = options.base || 'USD';
    historyFolder = path.normalize(__dirname + '/' + (options.historyFolder || 'history') + '/');

    if (options.API_KEY) {
        API_KEY = '?app_id=' + options.API_KEY;
    } else {
        throw 'API_KEY not set';
    }

    if (options.mongodb_url) {
        mongodbInstance = MongoClient.connect(options.mongodb_url, function (error, db) {
            if (error) {
                throw 'Connection to MongoDB was not successful';
            }
            mongodbInstance = db;
            historyCollection = mongodbInstance.collection(options.historyCollection || 'history');

            getData('historical','2016-05-16').then(function(data){
                console.log('end: ',data);
            },function(error){
                console.log(error);
            });


            getData('latest','latest').then(function(data){
                console.log('end: ',data);
            },function(error){
                console.log(error);
            })

        });
    } else {
        mongodbInstance = false;
    }
}


initialize({mongodb_url: 'mongodb://127.0.0.1/rates', API_KEY: 'd40d3014b6d84d0ab84a3acbdd523d01'});


module.exports = {
    initialize: initialize,

};