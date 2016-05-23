var rateConverter = require('../../index');

beforeEach(function(){
    rateConverter.initialize({
        historyCollection: 'history',
        historyFolder: 'history',
        /*mongodb_url: 'mongodb://127.0.0.1/rates',*/
        API_KEY: 'd40d3014b6d84d0ab84a3acbdd523d01',
        updateLatestRates : 10000
    });
});

describe('testing the module',function(){

    it('should return 18.21945',function(done){
        rateConverter.convertRates('historical','2016-01-16','USD',1,'MXN')
            .then(function(result){
                expect(result).toBe(18.21945);
                done();
            });
    });

    it('should return 1',function(done){
        rateConverter.convertRates('historical','2016-01-16','MXN',18.21945,'USD')
            .then(function(result){
                expect(result).toBe(1);
                done();
            });
    });

});