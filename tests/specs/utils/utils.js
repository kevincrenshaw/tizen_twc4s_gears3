define(['utils/utils'], function(utils) {

    const MINUTE_IN_SECONDS = 60;
    const HOUR_IN_SECONDS = MINUTE_IN_SECONDS * 60;
    const DAY_IN_SECONDS = HOUR_IN_SECONDS * 24;

    describe('utils utils', function() {

        it('getTimeAsText method', function() {
            //PM test
            const datePM = new Date(99,5,24,//year, month, day
                18,33,30); //hour, minutes, seconds
            const stringPM1 = utils.getTimeAsText(datePM, '1', true); //system uses 12h format
            const stringPM2 = utils.getTimeAsText(datePM, '1', false);  //system uses 24h format
            
            const stringPM3 = utils.getTimeAsText(datePM, '2'); //12h
            const stringPM4 = utils.getTimeAsText(datePM, '3'); //24h
             
            expect(stringPM1).to.eql(['6:33', ' PM']);
            expect(stringPM2).to.eql(['18:33', '']);
            expect(stringPM3).to.eql(['6:33', ' PM']);
            expect(stringPM4).to.eql(['18:33', '']);
            
            //AM test 
            const dateAM = new Date(99,5,24,//year, month, day
                    8,33,30); //hour, minutes, seconds 
            const stringAM1 = utils.getTimeAsText(dateAM, '1', true); //system uses 12h format
            const stringAM2 = utils.getTimeAsText(dateAM, '1', false); //system uses 12h format
            const stringAM3 = utils.getTimeAsText(dateAM, '2'); //12h
            const stringAM4 = utils.getTimeAsText(dateAM, '3'); //24h
            
            expect(stringAM1).to.eql(['8:33', ' AM']);
            expect(stringAM2).to.eql(['8:33', '']);
            expect(stringAM3).to.eql(['8:33', ' AM']);
            expect(stringAM4).to.eql(['8:33', '']);
        });

        
        it('guid method', function() {
            var time = new Date().getTime();
            var string1 = time + '-' + utils.guid();
            var string2 = time + '-' + utils.guid();
            expect(string1).not.to.be(string2);
        });

        
        it('getCategoryForTimeDiff method', function() {
            expect(utils.getCategoryForTimeDiff(0)).to.be(1);
            expect(utils.getCategoryForTimeDiff(30)).to.be(1);
            expect(utils.getCategoryForTimeDiff(59)).to.be(1);
            expect(utils.getCategoryForTimeDiff(MINUTE_IN_SECONDS + 59)).to.be(2);
            expect(utils.getCategoryForTimeDiff(2 * MINUTE_IN_SECONDS)).to.be(2);
            expect(utils.getCategoryForTimeDiff(2 * MINUTE_IN_SECONDS + 1)).to.be(2);
            expect(utils.getCategoryForTimeDiff(HOUR_IN_SECONDS - 1)).to.be(2);
            expect(utils.getCategoryForTimeDiff(HOUR_IN_SECONDS)).to.be(3);
            expect(utils.getCategoryForTimeDiff(2 * HOUR_IN_SECONDS - 1)).to.be(3);
            expect(utils.getCategoryForTimeDiff(2 * HOUR_IN_SECONDS)).to.be(3);
            expect(utils.getCategoryForTimeDiff(15 * HOUR_IN_SECONDS)).to.be(3);
            expect(utils.getCategoryForTimeDiff(23 * HOUR_IN_SECONDS)).to.be(3);
            expect(utils.getCategoryForTimeDiff(24 * HOUR_IN_SECONDS - 1)).to.be(3);
            expect(utils.getCategoryForTimeDiff(DAY_IN_SECONDS - 1)).to.be(3);
            expect(utils.getCategoryForTimeDiff(DAY_IN_SECONDS)).to.be(4);
            expect(utils.getCategoryForTimeDiff(DAY_IN_SECONDS + 10 * HOUR_IN_SECONDS)).to.be(4);
            expect(utils.getCategoryForTimeDiff(2 * DAY_IN_SECONDS - 1)).to.be(4);
            expect(utils.getCategoryForTimeDiff(2 * DAY_IN_SECONDS)).to.be(5);
            expect(utils.getCategoryForTimeDiff(15 * DAY_IN_SECONDS)).to.be(5);
        });


        it('formatTimeDiffValue method', function() {
            expect(utils.formatTimeDiffValue(0, 1)).to.be(0);
            expect(utils.formatTimeDiffValue(30, 1)).to.be(30);
            expect(utils.formatTimeDiffValue(59, 1)).to.be(59);
            expect(utils.formatTimeDiffValue(60, 1)).to.be(0);
            expect(utils.formatTimeDiffValue(65, 1)).to.be(5);

            expect(utils.formatTimeDiffValue(30, 2)).to.be(0);
            expect(utils.formatTimeDiffValue(59, 2)).to.be(0);
            expect(utils.formatTimeDiffValue(MINUTE_IN_SECONDS, 2)).to.be(1);
            expect(utils.formatTimeDiffValue(MINUTE_IN_SECONDS + 59, 2)).to.be(1);
            expect(utils.formatTimeDiffValue(2 * MINUTE_IN_SECONDS, 2)).to.be(2);
            expect(utils.formatTimeDiffValue(15 * MINUTE_IN_SECONDS, 2)).to.be(15);
            expect(utils.formatTimeDiffValue(HOUR_IN_SECONDS - 1, 2)).to.be(59);

            expect(utils.formatTimeDiffValue(HOUR_IN_SECONDS - 1, 3)).to.be(0);
            expect(utils.formatTimeDiffValue(HOUR_IN_SECONDS, 3)).to.be(1);
            expect(utils.formatTimeDiffValue(10 * HOUR_IN_SECONDS, 3)).to.be(10);
            expect(utils.formatTimeDiffValue(DAY_IN_SECONDS - 1, 3)).to.be(23);

            expect(utils.formatTimeDiffValue(DAY_IN_SECONDS, 4)).to.be(1);

            expect(utils.formatTimeDiffValue(DAY_IN_SECONDS, 5)).to.be(1);
            expect(utils.formatTimeDiffValue(2 * DAY_IN_SECONDS - 1, 5)).to.be(1);
            expect(utils.formatTimeDiffValue(2 * DAY_IN_SECONDS, 5)).to.be(2);
            expect(utils.formatTimeDiffValue(42 * DAY_IN_SECONDS, 5)).to.be(42);
        });

    });

});
