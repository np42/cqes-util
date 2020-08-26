const Test     = require('cqes-test');
const { join } = require('path');
const Content  = require('../dist/src/Content');

Test.test(
  { 'resolveInclude':
    { 1:
      [ () => Content.getFile(join(__dirname, './content/test.yaml'))
      , [ 'Assert.fields'
        , [ 'A', 'equiv', { hello: 'world', foo: 'bar', pli: 'muk' } ]
        , [ 'B', 'equiv', { some: 'data', value: 'replaced' } ]
        , [ 'C', 'equiv', { foo: 'bar' } ]
        , [ 'D', 'equiv', { value: 'replaced' } ]
        ]
      ]
    }
  }
);

