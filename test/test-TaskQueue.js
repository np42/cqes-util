const TQ = require('..').TaskQueue;

const q = new TQ
( { retryPolicy: [1,1,5]
  , maxRetry: 15
  , handler: (x, t) => new Promise((resolve, reject) => {
    const rand = Math.random();
    console.log(t.retryCount, ((rand * 10) | 0) / 10, '==>', x);
    if (rand > 0.8) {
      resolve();
    } else {
      setTimeout(reject, 10);
    }
  })
  }
);

for (let i = 0; i < 10; i ++)
  q.push(i);
