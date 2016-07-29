var rateConverter = require('../../index');

beforeEach(function(){
    rateConverter.initialize({
        historyCollection: 'history',
        historyFolder: 'history',
        mongodb_url: '',    //provide your own
        API_KEY: '',        //provide your own
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