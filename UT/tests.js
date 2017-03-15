define(['utils/map', 'utils/fsutils', 'utils/utils'], function(map, fsutils, utils) {
	QUnit.module('map');

	QUnit.test('LOD 1-4 (precision 0)', function(assert) {
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.1, 1).toString(), '0');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.24, 1).toString(), '0');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.49, 1).toString(), '0');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.5, 1).toString(), '1');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.51, 1).toString(), '1');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.99, 1).toString(), '1');
		assert.equal(map.getAllowedPrecisionAccordingToLod(1.4, 1).toString(), '1');
		assert.equal(map.getAllowedPrecisionAccordingToLod(1.5, 1).toString(), '2');

		assert.equal(map.getAllowedPrecisionAccordingToLod(51.1030, 1).toString(), '51');
		assert.equal(map.getAllowedPrecisionAccordingToLod(13.5, 2).toString(), '14');
		assert.equal(map.getAllowedPrecisionAccordingToLod(3.65, 3).toString(), '4');
		assert.equal(map.getAllowedPrecisionAccordingToLod(-7.93, 3).toString(), '-8');
	});
	
	QUnit.test('LOD 5-7 (precision 1)', function(assert) {
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.1, 5).toString(), '0.0');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.24, 5).toString(), '0.0');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.25, 5).toString(), '0.5');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.49, 5).toString(), '0.5');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.5, 5).toString(), '0.5');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.51, 5).toString(), '0.5');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.749, 5).toString(), '0.5');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.75, 5).toString(), '1.0');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.9999, 5).toString(), '1.0');
		assert.equal(map.getAllowedPrecisionAccordingToLod(1.2499, 5).toString(), '1.0');
		assert.equal(map.getAllowedPrecisionAccordingToLod(1.4, 5).toString(), '1.5');
		assert.equal(map.getAllowedPrecisionAccordingToLod(1.5, 5).toString(), '1.5');

		assert.equal(map.getAllowedPrecisionAccordingToLod(51.1030, 5).toString(), '51.0');
		assert.equal(map.getAllowedPrecisionAccordingToLod(13.491, 6).toString(), '13.5');
		assert.equal(map.getAllowedPrecisionAccordingToLod(13.591, 7).toString(), '13.5');
		assert.equal(map.getAllowedPrecisionAccordingToLod(13.85, 7).toString(), '14.0');
	});

	QUnit.test('LOD 8-11 (precision 2)', function(assert) {
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.01, 8).toString(), '0.00');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.024, 8).toString(), '0.00');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.025, 8).toString(), '0.05');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.05, 8).toString(), '0.05');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.074, 8).toString(), '0.05');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.075, 8).toString(), '0.10');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.124, 8).toString(), '0.10');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.125, 8).toString(), '0.15');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.1512, 8).toString(), '0.15');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.1749, 8).toString(), '0.15');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.175, 8).toString(), '0.20');

		assert.equal(map.getAllowedPrecisionAccordingToLod(51.1030, 8).toString(), '51.10');
		assert.equal(map.getAllowedPrecisionAccordingToLod(51.1055, 9).toString(), '51.10');
		assert.equal(map.getAllowedPrecisionAccordingToLod(42, 10).toString(), '42.00');
		assert.equal(map.getAllowedPrecisionAccordingToLod(-3.0099, 11).toString(), '-3.00');
		assert.equal(map.getAllowedPrecisionAccordingToLod(-3.76, 11).toString(), '-3.75');
	});

	QUnit.test('LOD 12-14 (precision 3)', function(assert) {
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.001, 12).toString(), '0.000');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.00249, 12).toString(), '0.000');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.0025, 12).toString(), '0.005');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.005, 12).toString(), '0.005');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.00749, 12).toString(), '0.005');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.0075, 12).toString(), '0.010');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.012499, 12).toString(), '0.010');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.0125, 12).toString(), '0.015');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.017, 12).toString(), '0.015');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.018, 12).toString(), '0.020');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.0222, 12).toString(), '0.020');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.0247, 12).toString(), '0.025');
		assert.equal(map.getAllowedPrecisionAccordingToLod(0.0256, 12).toString(), '0.025');

		assert.equal(map.getAllowedPrecisionAccordingToLod(51.10349, 12).toString(), '51.105');
		assert.equal(map.getAllowedPrecisionAccordingToLod(51.10350, 13).toString(), '51.105');
		assert.equal(map.getAllowedPrecisionAccordingToLod(-4, 14).toString(), '-4.000');
		assert.equal(map.getAllowedPrecisionAccordingToLod(-4.137, 14).toString(), '-4.135');
	});

	QUnit.test('25 kilometers', function(assert) {
		const mapZoom100 = 1;
		const mapZoom75 = 2;
		const mapZoom50 = 3;
		const mapZoom25 = 4;

		const distanceMiles = 1;
		const distanceKilometers = 2;
		const distanceMegameters = 3;

		assert.equal(map.getMapLod(mapZoom25, distanceKilometers), 14);
		assert.equal(map.getMapLod(mapZoom25, distanceMiles), 13);
		assert.equal(map.getMapLod(mapZoom50, distanceKilometers), 12);
		assert.equal(map.getMapLod(mapZoom75, distanceKilometers), 11);
		assert.equal(map.getMapLod(mapZoom50, distanceMiles), 10);
		assert.equal(map.getMapLod(mapZoom100, distanceKilometers), 9);
		assert.equal(map.getMapLod(mapZoom75, distanceMiles), 8);
		assert.equal(map.getMapLod(mapZoom100, distanceMiles), 7);
		assert.equal(map.getMapLod(mapZoom25, distanceMegameters),6);
		assert.equal(map.getMapLod(mapZoom50, distanceMegameters), 5);
		assert.equal(map.getMapLod(mapZoom75, distanceMegameters), 4);
		assert.equal(map.getMapLod(mapZoom100, distanceMegameters), 3);
	});
    
	QUnit.module('utils');
	    QUnit.test('getTimeAsText', function(assert) {
        //PM test
        const datePM = new Date(99,5,24,//year, month, day
            18,33,30); //hour, minutes, seconds
        const stringPM1 = utils.getTimeAsText(datePM, '1', true); //system uses 12h format
		const stringPM2 = utils.getTimeAsText(datePM, '1', false);  //system uses 24h format
        
		const stringPM3 = utils.getTimeAsText(datePM, '2'); //12h
        const stringPM4 = utils.getTimeAsText(datePM, '3'); //24h
         
        assert.equal(stringPM1, '6:33, PM');
		assert.equal(stringPM2, '18:33,');
        assert.equal(stringPM3, '6:33, PM');
        assert.equal(stringPM4, '18:33,');
        
        //AM test 
        const dateAM = new Date(99,5,24,//year, month, day
                8,33,30); //hour, minutes, seconds 
        const stringAM1 = utils.getTimeAsText(dateAM, '1', true); //system uses 12h format
		const stringAM2 = utils.getTimeAsText(dateAM, '1', false); //system uses 12h format
        const stringAM3 = utils.getTimeAsText(dateAM, '2'); //12h
        const stringAM4 = utils.getTimeAsText(dateAM, '3'); //24h
        
		assert.equal(stringAM1, '8:33, AM');
        assert.equal(stringAM2, '8:33,');
        assert.equal(stringAM3, '8:33, AM');
        assert.equal(stringAM4, '8:33,');
    });
	
	QUnit.test("guid ", function(assert) {
		var time = new Date().getTime();
		var string1 = time + '-' + utils.guid();
		var string2 = time + '-' + utils.guid();
		assert.ok(string1 !== string2);
	});
});