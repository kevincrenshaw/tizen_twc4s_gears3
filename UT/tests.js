define(['utils/utils', 'utils/storage'], function(utils, storage) {
	QUnit.module('utils');

	QUnit.test("contains tryModifyElement function", function(assert) {
		assert.ok(utils.tryModifyElement !== undefined);
	});

	QUnit.module('getAllowedPrecisionAccordingToLOD');

	QUnit.test("present in utils", function(assert) {
		assert.ok(utils.hasOwnProperty('getAllowedPrecisionAccordingToLOD'));
	});

	QUnit.test("LOD 1-4 (precision 0)", function(assert) {
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(51.1030, 1).toString(), '51');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(13.5, 2).toString(), '14');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(3.65, 3).toString(), '4');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(-7.93, 3).toString(), '-8');
	});

	QUnit.test("LOD 5-7 (precision 1)", function(assert) {
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(51.1030, 5).toString(), '51.1');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(13.491, 6).toString(), '13.5');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(13.591, 7).toString(), '13.6');
	});

	QUnit.test("LOD 8-11 (precision 2)", function(assert) {
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(51.1030, 8).toString(), '51.10');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(51.1055, 9).toString(), '51.11');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(42, 10).toString(), '42.00');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(-3.0099, 11).toString(), '-3.01');
	});

	QUnit.test("LOD 12-14 (precision 2)", function(assert) {
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(51.10349, 12).toString(), '51.103');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(51.10350, 13).toString(), '51.104');
		assert.equal(utils.getAllowedPrecisionAccordingToLOD(-4, 14).toString(), '-4.000');
	});
});