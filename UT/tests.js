define(['utils/utils'], function(utils) {
	QUnit.module('utils');

	QUnit.test("contains tryModifyElement function", function(assert) {
		assert.ok(utils.tryModifyElement !== undefined);
	});
});