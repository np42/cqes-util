const TQ = require('..').TaskQueue.TaskQueue;

let done = 0;
const maxRetry = 20;

const q = new TQ
( { retryPolicy:    [1]
  , maxRetry:       maxRetry
  , maxRunningJobs: 10
  , handler: (x, t) => new Promise((resolve, reject) => {
      const rand = Math.random();
      if (rand > 0.8) {
        done += 1;
        setTimeout(resolve, 200);
      } else {
        setTimeout(reject, 200);
      }
      console.log( Date.now()
                 , 'done:',   done
                 , 'slot:',   t.slot
                 , 'taskId:', x
                 , 'retry:',  t.retryCount, '/', maxRetry
                 , 'score:',  ((rand * 10) | 0) / 10
                 );
    })
  }
);

for (let i = 0; i < 100; i ++)
  q.push(i, String(Math.random() * 12 | 0));
