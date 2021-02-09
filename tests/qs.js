const { qsencode, qsdecode } = require('..');
const assert = require('assert');

describe('qsencode', function () {

});

describe('qsdecode', function () {
  it('should considere enpty value as empty string', function () {
    const result = qsdecode('toto=')
    assert.deepEqual(result, { toto: '' });
  });
});

