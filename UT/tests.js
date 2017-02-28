define(['utils/utils'], function(utils) {
	console.log('hello from tests module');

	QUnit.test("test if function tryModifyElement exists in utils module", function(assert) {
		assert.ok(utils.tryModifyElement !== undefined, "Passed!");
	});
});