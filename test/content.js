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
        , [ 'E', 'equiv', { hello: { value: 'replaced', toto: 42, C: { foo: 'bar' } } } ]
        , [ 'both', 'equiv', { key: { value: 42, another: 42, and: 42 } } ]
        ]
      ]
    }
  , 'resolveReference':
    { 1:
      [ () => Content.get({ a: { b: 42 }, '&:a.b:c': null })
      , [ 'Assert.equiv', { a: { b: 42 }, c: 42 } ]
      ]
    }
  }
);

