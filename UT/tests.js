define(['utils/utils', 'utils/storage', 'utils/storageHelpers'], function(utils, storage, storageHelpers) {
	QUnit.module('utils');

	QUnit.module('getAllowedPrecisionAccordingToLOD');

	QUnit.test('present in utils', function(assert) {
		assert.ok(utils.hasOwnProperty('getAllowedPrecisionAccordingToLOD'));
	});

	QUnit.test('LOD 1-4 (precision 0)', function(assert) {
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.1, 1).toString(), '0');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.24, 1).toString(), '0');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.49, 1).toString(), '0');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.5, 1).toString(), '1');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.51, 1).toString(), '1');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.99, 1).toString(), '1');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(1.4, 1).toString(), '1');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(1.5, 1).toString(), '2');

		assert.equal(utils.getAllowedPrecisionAccordingToLOD(51.1030, 1).toString(), '51');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(13.5, 2).toString(), '14');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(3.65, 3).toString(), '4');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(-7.93, 3).toString(), '-8');
	});
	
	QUnit.test('LOD 5-7 (precision 1)', function(assert) {
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.1, 5).toString(), '0.0');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.24, 5).toString(), '0.0');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.25, 5).toString(), '0.5');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.49, 5).toString(), '0.5');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.5, 5).toString(), '0.5');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.51, 5).toString(), '0.5');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.749, 5).toString(), '0.5');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.75, 5).toString(), '1.0');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.9999, 5).toString(), '1.0');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(1.2499, 5).toString(), '1.0');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(1.4, 5).toString(), '1.5');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(1.5, 5).toString(), '1.5');

		assert.equal(utils.getAllowedPrecisionAccordingToLOD(51.1030, 5).toString(), '51.0');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(13.491, 6).toString(), '13.5');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(13.591, 7).toString(), '13.5');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(13.85, 7).toString(), '14.0');
	});

	QUnit.test('LOD 8-11 (precision 2)', function(assert) {
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.01, 8).toString(), '0.00');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.024, 8).toString(), '0.00');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.025, 8).toString(), '0.05');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.05, 8).toString(), '0.05');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.074, 8).toString(), '0.05');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.075, 8).toString(), '0.10');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.124, 8).toString(), '0.10');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.125, 8).toString(), '0.15');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.1512, 8).toString(), '0.15');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.1749, 8).toString(), '0.15');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.175, 8).toString(), '0.20');

		assert.equal(utils.getAllowedPrecisionAccordingToLOD(51.1030, 8).toString(), '51.10');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(51.1055, 9).toString(), '51.10');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(42, 10).toString(), '42.00');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(-3.0099, 11).toString(), '-3.00');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(-3.76, 11).toString(), '-3.75');
	});

	QUnit.test('LOD 12-14 (precision 3)', function(assert) {
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.001, 12).toString(), '0.000');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.00249, 12).toString(), '0.000');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.0025, 12).toString(), '0.005');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.005, 12).toString(), '0.005');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.00749, 12).toString(), '0.005');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.0075, 12).toString(), '0.010');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.012499, 12).toString(), '0.010');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.0125, 12).toString(), '0.015');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.017, 12).toString(), '0.015');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.018, 12).toString(), '0.020');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.0222, 12).toString(), '0.020');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.0247, 12).toString(), '0.025');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(0.0256, 12).toString(), '0.025');

		assert.equal(utils.getAllowedPrecisionAccordingToLOD(51.10349, 12).toString(), '51.105');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(51.10350, 13).toString(), '51.105');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(-4, 14).toString(), '-4.000');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(-4.137, 14).toString(), '-4.135');
	});

	// QUnit.module('getMapZoomDistanceInMeters');

	// QUnit.test('present in storageHelpers', function(assert) {
	// 	assert.ok(storageHelpers.hasOwnProperty('getMapZoomDistanceInMeters'));
	// });

	// //Return object that mimics setting functionality (limited to getter only)
	// const createFakeSettingGetter = function(value) {
	// 	return {
	// 		get: function() { return value },
	// 	};
	// };

	// //distance: 1=miles, 2=kilometers, 3=megameters
	// //mapzoom: 1=100, 2=75, 3=50, 4=25

	// QUnit.test('100 kilometers', function(assert) {
	// 	// const distance = createFakeSettingGetter(2);	//kilometers
	// 	// const mapZoom = createFakeSettingGetter(1);		//100

	// 	// assert.equal(storageHelpers.getMapZoomDistanceInMeters(distance, mapZoom), 100000);
	// 	assert.ok(true);
	// });

	// QUnit.test('75 kilometers', function(assert) {
	// 	// const distance = createFakeSettingGetter(2);	//kilometers
	// 	// const mapZoom = createFakeSettingGetter(2);		//75

	// 	// assert.equal(storageHelpers.getMapZoomDistanceInMeters(distance, mapZoom), 75000);

	// 	//storage.units.mapzoom.set(2)

	// 	assert.ok(true);
	// });
});