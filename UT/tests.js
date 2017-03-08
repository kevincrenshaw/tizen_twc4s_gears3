define(['utils/map', 'utils/fsutils'], function(map, fsutils) {
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
    
	QUnit.module('fsutils');

	QUnit.test("getFileExtension function", function(assert) {
		var extension = fsutils.getFileExtension('https://splashbase.s3.amazonaws.com/unsplash/regular/tumblr_mnh0n9pHJW1st5lhmo1_1280.jpg');
        assert.equal(extension, 'jpg');
	});
	
	QUnit.test("getFileExtension function - map url", function(assert) {
		var extension = fsutils.getFileExtension('https://api.weather.com/v2/maps/dynamic?geocode=51.0,6.5&w=400&h=400&lod=7&product=satrad&apiKey=ce00000b00000000ce000b0b0000a0ae');
        assert.equal(extension, '');
	});
});