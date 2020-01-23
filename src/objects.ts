export function get(data: any, path: string) {
  if (!path) return data;
  return path.split('.').reduce((value, key) => value ? value[key] : null, data);
}

export function set(target: any, path: string, value: any) {
  for (const chain = path.split('.'); chain.length > 0; target = target[chain.shift()]) {
    const key = chain[0];
    if (chain.length == 1) {
      target[key] = value;
    } else {
      if (target.hasOwnProperty(key)) {
        if (target[key] instanceof Array) {
          if (Number(chain[1]) >= 0) {
            continue ;
          } else {
            target[key] = target[key].reduce((result: any, value: any, index: number) => {
              result[index] = value;
              return result;
            }, {});
          }
        } else if (target[key] instanceof Object) {
          continue ;
        }
      } else {
        if (Number(chain[1]) >= 0) {
          target[key] = [];
        } else {
          target[key] = {};
        }
      }
    }
  }
}

export function join(...paths: Array<string>) {
  return paths.reduce((result, arg) => result + (result ? '.' : '') + arg, '');
}

export function isConstructor(fn: Function) {
  if (typeof fn !== 'function') return false;
  if (!fn.hasOwnProperty('prototype')) return false;
  return true;
}

export function isObject(alpha: any) {
  if (alpha instanceof Object) return true;
  if (kind(alpha) == 'Object') return true;
  return false;
}

export function kind(alpha: any) {
  const name = Object.prototype.toString.call(alpha);
  return name.substring(8, name.length - 1);
}

const token = Symbol('serialized');

export function serialize(data: any, skipempty?: boolean, iterator?: Function): string {
  if (typeof iterator == 'function') data = iterator(data);
  switch (Object.prototype.toString.call(data)) {
  case '[object Array]':
  case '[object Arguments]':
    if (data[token] != null) return data[token];
    else data[token] = 'null';
    const result = [];
    for (let i = 0; i < data.length; i++) {
      const value = serialize(data[i], skipempty, iterator);
      if (value == null && skipempty) continue ;
      result.push(value);
    }
    if (result.length < 1 && skipempty) return 'null';
    delete data[token];
    return '[' + result.join(',') + ']';
  case '[object RegExp]':
    return [ '/', (data.source == '' ? '(?:)' : data.source), '/'
           , data.global ? 'g' : ''
           , data.ignoreCase ? 'i' : ''
           , data.multiline ? 'm' : ''
           ].join('');
  case '[object Date]':
    return '(new Date(' + serialize(data.getTime(), skipempty, iterator) + '))';
  case '[object Function]':
    return '(' + data.toString() + ')';
  case '[object Object]':
    if (data.constructor && data.constructor !== Object && data.constructor.toString)
      return data.toString();
    if (data[token] != null) return data[token];
    if (typeof data.serialize == 'function') {
      return data.serialize(iterator);
    } else {
      data[token] = 'Circular()';
      const temp = {};
      const order = [];
      for (let i in data) {
        var value = serialize(data[i], skipempty, iterator);
        if (value == null) continue ;
        order.push(i);
        temp[i] = value;
      }
      order.sort();
      const result = [];
      for (var i = 0; i < order.length; i++)
        result.push(serialize(order[i], skipempty, iterator) + ':' + temp[order[i]]);
      delete data[token];
      if (result.length < 1 && skipempty) return 'null';
      return '{' + result.join(',') + '}';
    }
  case '[object Number]':
  case '[object Boolean]':
    return data.toString();
  case '[object String]':
    if (data == '' && skipempty) return 'null';
    return JSON.stringify(data);
  case '[object Null]': case '[object Undefined]':
    return 'null';
  default:
    return serialize(Object.prototype.toString.call(data), skipempty, iterator);
  }
}

/*
export function diff(from: any, to: any, iter: (path: string, from: any, to: any) => void) {
  if (from === to) return ;
  const fromType = Object.prototype.toString.call(from);
  const toType   = Object.prototype.toString.call(to);
  switch (fromType) {
  case '[object Undefined]': case '[object Null]':
    switch (toType) {
    case '[object Undefined]': case '[object Null]': return ;
    default : return 
    }
  }
}
*/