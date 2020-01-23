const Test     = require('cqes-test');
const { diff } = require('..');

/*
Test.test
( { 'Object':
    { 'diff':
      [ [ 'assert', () => diff(null, null, () => { throw new Error('Should not be called') }) ]
      , [ () => { let i = 0; diff(null, true, () => i++); return i; }
        , [ 'assert', ['equiv', 1] ]
        ]
      , [ () => { let i = 0; diff(null, false, () => i++); return i; }
        , [ 'assert', ['equiv', 1] ]
        ]
      ]
    }
  }
)
*/