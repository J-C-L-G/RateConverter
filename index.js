/**************************************
 * ..:: Exchange Rates Module ::..    *
 **************************************/

/*** ..:: Require(s) ::.. ***/
var Promise = require('promise'),
    MongoClient,
    historyCollection,
    http = require('http'),
    fs = require('fs'),
    path = require('path');


/***************************** **********************************/
/************              Module Variables        **************/
/***************************** **********************************/

var API_KEY,
    base,
    mongodbInstance,
    historyFolder,
    updaterID,
    serviceProviderUrls = {
        base: 'http://openexchangerates.org/api/',
        historical: function (date) {
            return this.base + 'historical/' + date + '.json' + API_KEY;
        },
        latest: function () {
            return this.base + 'latest.json' + API_KEY;
        },
        currencies : function(){
            return this.base + 'currencies.json' + API_KEY;
        }
    };


/***************************** **********************************/
/************              Private API              **************/
/***************************** **********************************/


/** ..:: urlJSONloader ::..
 * Function that will trigger an ajax request to
 * a service retrieve the response and parse it as JSON.
 *
 * @param url {string}
 * @returns {object} promise
 */
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


/** ..:: saveDataToDB ::..
 * Function that will verify if the current module
 * setup is db enabled and proceed persisting the data.
 *
 * @param date {string} - format YYYY-MM-DD
 * @param jsonData {object}
 * @returns {object} promise
 */
function saveDataToDB(jsonData){
    return new Promise(function(fulfill, reject){
        if (mongodbInstance) {
            historyCollection.insert(jsonData,
                function (error) {
                    if (error)
                        reject(error);
                    else
                        fulfill(jsonData);
                });
        }else{
            fulfill('No DataBase was set - OK not to save.')
        }
    });
}


/** ..:: saveDataToFS ::..
 * Function that will persist the data to the File System.
 *
 * @param date {string} - format YYYY-MM-DD
 * @param jsonData {object}
 * @returns {object} promise
 */
function saveDataToFS(jsonData){
    return new Promise(function(fulfill, reject){
        var fileName = historyFolder + jsonData._id + '.json';
        fs.writeFile(fileName, JSON.stringify(jsonData), 'utf8', function (error) {
            if (error) {
                reject(error);
            }
            fulfill(jsonData);
        });
    })
}


/** ..:: persistData ::..
 * Function that will persist the data into the database
 * if is enabled and then to the file system.
 *
 * @param {string} date
 * @param {object} jsonData
 * @return {object} promise
 */
function persistData(date, jsonData) {
    jsonData._id = date;
    return new Promise(function(fulfill, reject){
        saveDataToDB(jsonData)
            .then(
            saveDataToFS(jsonData)
                .then(
                    function(data){
                        fulfill(jsonData);
                    },function(error){
                        reject(error);
                    })
                );
    });
}


/** ..:: getDataFromService ::..
 * Function that will request the data from the service provider
 * and then execute the routine to persist the data (db and/or fs)
 * @param requestType {string} 'historical' || 'latest'
 * @param date {string} - format YYYY-MM-DD || 'latest'
 */
function getDataFromService(requestType, date) {
    return new Promise(function (resolve, reject) {
        urlJSONloader(serviceProviderUrls[requestType](date))
            .then(function (data) {
                    persistData(date, data)
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


/** ..:: getJSONfromDB ::..
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

/** ..:: getJSONfromFS ::..
 * Return the document or null if it was not found in the FileSystem
 * @param date {string}
 * @return {object}
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


/***************************** **********************************/
/************              Public API              **************/
/***************************** **********************************/

/** ..:: latestUpdater ::..
 * This function will update the document in the database
 * {_id : 'latest'} and the latest.json
 */
function latestUpdater(){
        getDataFromService('latest','latest')
            .then(function(latestData){
                historyCollection.update({_id:'latest'},latestData,function(error){
                 if(error)
                     throw error;
                });
            });
}


/** ..:: initialize ::..
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
    //Create directory
    if (!fs.existsSync(historyFolder)){
        fs.mkdirSync(historyFolder);
    }

    if (options.API_KEY) {
        API_KEY = '?app_id=' + options.API_KEY;
    } else {
        throw 'API_KEY not set';
    }

    if (options.mongodb_url) {
        try{
            MongoClient = require('mongodb').MongoClient;
            mongodbInstance = MongoClient.connect(options.mongodb_url, function (error, db) {
                if (error) {
                    throw 'Connection to MongoDB was not successful';
                }
                mongodbInstance = db;
                historyCollection = mongodbInstance.collection(options.historyCollection || 'history');
                if(options.updateLatestRates > 0){
                    updaterID = setInterval(latestUpdater,( options.updateLatestRates || 50000) ) ;
                }
            });
        }catch(exc){
            throw 'Connection to MongoDB was not successful';
        }
    } else {
        mongodbInstance = false;
    }
}

/** ..:: closeDB ::..
 * Function that will close the database connection
 * and will fallback to the file system.
 * @returns {boolean}
 */
function closeDB(){
    try{
        clearInterval(updaterID);
        mongodbInstance.close();
        mongodbInstance = false;
        return true;
    }catch(exc){
        return false;
    }
}

/** ..:: getData ::..
 * Function that retrieves the historical data from the database
 * if one was configured otherwise from the filesystem
 * If the data is nt there, it will  request it from the service,
 * persist the data and return it.
 *
 * @param requestType {string} - 'historical' || 'latest'
 * @param date {string} - format YYYY-MM-DD || 'latest'
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
                    resolve(JSON.parse(data));
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


/** ..:: convertRates ::..
 *
 */
function convertRates( requestType, date, from , amount, to){
    return new Promise(function(resolve, reject){
        getData(requestType, date)
            .then(function(jsonData){

                var usdEq = jsonData.rates[from], // 1usd
                    amountInUSD = amount / usdEq,
                    amountConverted = amountInUSD * jsonData.rates[to] ;
                    resolve(amountConverted);
            },
            function(error){reject(error)}
        );
    });
}


/** Module Export
 *
 * @type {{initialize: initialize, closeDB: closeDB, getData: getData}}
 */
module.exports = {
    initialize: initialize,
    closeDB : closeDB,
    getData : getData,
    convertRates : convertRates
};