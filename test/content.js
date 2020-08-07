const Test    = require('cqes-test');
const Content = require('../dist/src/Content');

Test.test(
  { 'resolveReference':
    { 1:
      [ () => Content.resolveReference({ '&:A': { b: 42, c: 'youpi' }, A: { a : 21, b: true } })
      , [ 'Assert.equiv', { A: { a: 21, b: 42, c: 'youpi' } } ]
      ]
    , 2:
      [ () => Content.resolveReference({ '&:A_B': { C: { honey: 'pot', pli: 'muk' } }
                                       , 'A_B': { '&:_.A:2': { C: { pli: 'foo', some: 'value', overwrite: 1 } } }
                                       , _: { A: { C: { overwrite: 0, based: 'value' } } }
                                       }
                                      )
      , [ 'Assert.equiv', { A_B: { C: { honey: 'pot', pli: 'muk', some: 'value', 'overwrite': 1, based: 'value' } }
                          , _: { A: { C: { overwrite: 0, based: 'value' } } }
                          }
        ]
      ]
    }
  }
);

