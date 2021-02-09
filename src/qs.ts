import { Tree }  from './Tree';
import { merge } from './merge';

export function qsencode(data: Object) {
  if (!data || !(data instanceof Object)) throw new Error('Must have an Object');
  const result = [];
  (function loop(key: any, data: any, accu: any) {
    const escapedKey = encodeURIComponent(key);
    const path = key === null ? '' : accu + (accu.length === 0 ? escapedKey : '[' + escapedKey + ']');
    switch (Object.prototype.toString.call(data)) {
    case '[object Number]': case '[object Boolean]':
      result.push(path + '=' + data);
      return accu;
    case '[object String]':
      result.push(path + '=' + encodeURIComponent(data));
      return accu;
    case '[object Date]':
      result.push(path + '=' + data.toISOString());
      return accu;
    case '[object Object]':
      for (const key in data) loop(key, data[key], path);
      return accu;
    case '[object Set]': case '[object Array]': case '[object Map]':
      let index = 0;
      for (const value of data) loop(index++, value, path);
      return accu;
    case '[object Null]': case '[object Undefined]': default :
      return accu;
    }
  })(null, data, '');
  return result.join('&');
}

const isNumber = /^-?((\d*(\.\d+)?)|Infinity)$/;
const pathSeparator = /\]\[|[\]\[]/;
export function qsdecode(str: string) {
  const result = str.split('&').reduce((accu: any, kv: string) => {
    const offset = kv.indexOf('=');
    if (!(offset >= 0)) return accu;
    const escapedKey   = kv.substring(0, offset);
    const escapedValue = kv.substring(offset + 1);
    let value = <any>decodeURIComponent(escapedValue);
    switch (value) {
    case 'true':  value = true;  break ;
    case 'false': value = false; break ;
    case 'null':  value = null;  break ;
    case '':      value = '';    break ;
    default:
      if (isNumber.test(value)) value = parseFloat(value);
      break ;
    }
    const path = escapedKey.split(pathSeparator);
    if (path.length > 1) path.pop();
    const result = {};
    path.reduce((accu: any, field: string, index: number, array: any) => {
      const key = decodeURIComponent(field);
      if (index + 1 === array.length) {
        accu[key] = value;
      } else if (!(key in accu)) {
        accu[key] = {};
      }
      return accu[key];
    }, result);
    return merge(accu, result);
  }, {});
  return Tree.replace(result, (value: any) => {
    if (value && typeof value === 'object') {
      const keys = Object.keys(value).map(n => parseInt(n)).sort((l, r) => l - r);
      const array = [];
      for (let i = 0; i < keys.length; i += 1) {
        if (keys[i] !== i) return value;
        array.push(value[i]);
      }
      return array;
    } else {
      return value;
    }
  });
}