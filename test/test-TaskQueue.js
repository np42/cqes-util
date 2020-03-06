const TQ = require('..').TaskQueue.TaskQueue;

const q = new TQ
( { retryPolicy:    [1,1,2,2,3]
  , maxRetry:       15
  , maxRunningJobs: 3
  , handler: (x, t) => new Promise((resolve, reject) => {
      const rand = Math.random();
      console.log(t.retryCount, ((rand * 10) | 0) / 10, '==>', x);
      if (rand > 0.8) {
        setTimeout(resolve, 100);
      } else {
        setTimeout(reject, 10);
      }
    })
  }
);

for (let i = 0; i < 100; i ++)
  q.push(i);
