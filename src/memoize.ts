import { ExpireMap }  from './ExpireMap';
import { digest }     from './Digest';
import { genId }      from './genId';

interface Info {
  resolved: boolean;
  waiters:  Array<{ resolve: Function, reject: Function }>;
  returned: any;
  rejected: any;
};

const token = Symbol('memoize');
const cache = new ExpireMap<string, Info>();

export function memoize(fn: Function, duration: number = 150) {

  return function (...args: any[]) {
    if (fn[token] == null) fn[token] = genId();
    const key  = digest(fn[token], ...args);
    const info = cache.get(key);
    if (info != null) {
      if (info.resolved) {
        if (info.rejected != null) return Promise.reject(info.rejected);
        else return Promise.resolve(info.returned);
      } else {
        return new Promise((resolve, reject) => info.waiters.push({ resolve, reject }));
      }
    } else {
      const info: Info = { resolved: false, waiters: [], returned: null, rejected: null };
      cache.set(key, duration, info);
      return new Promise((resolve, reject) => {
        info.waiters.push({ resolve, reject });
        try {
          const result = fn(...args);
          if (result instanceof Promise) {
            result
              .then( s => {
                info.resolved = true;
                info.returned = s;
                while (info.waiters.length > 0)
                  info.waiters.shift().resolve(s);
              })
              .catch( e => {
                info.resolved = true;
                info.rejected = e;
                while (info.waiters.length > 0)
                  info.waiters.shift().reject(e);
              })
          } else {
            info.resolved = true;
            info.returned = result;
            while (info.waiters.length > 0)
              info.waiters.shift().resolve(result);
          }
        } catch (e) {
          info.resolved = true;
          info.rejected = e;
          while (info.waiters.length > 0)
            info.waiters.shift().reject(e);
        }
      });
    }
  };

};
