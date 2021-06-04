let sequence = 0;
const crossings: any = {};

function clone<T>(item: T): T {
  sequence += 1;
  const workToken: string = Symbol('cqes-clone-' + sequence) as any;
  const crossed   = crossings[workToken] = <Array<any>>[];
  const result    = cloneAny(item, workToken);
  while (crossed.length > 0) {
    delete crossed.pop()[workToken];
  }
  delete crossings[workToken];
  return result;
}

function register<T>(result: T, item: any, workToken: string): T {
  const props = { value: result, configurable: true, enumerable: false, writable: false };
  Object.defineProperty(item, workToken, props);
  crossings[workToken].push(item);
  return result;
}

function cloneAny<T>(item: T, workToken: string): T {
  if (item && item[workToken]) return item[workToken];
  switch (Object.prototype.toString.call(item)) {
  case '[object Object]':
    if (item.constructor !== Object) return item;
    else if ('$$typeof' in item) return item;
    else return cloneObject(item, workToken);
  case '[object Set]':    return <any>cloneSet(<any>item, workToken);
  case '[object Array]':  return <any>cloneArray(<any>item, workToken);
  case '[object Map]':    return <any>cloneMap(<any>item, workToken);
  case '[object Regexp]': return <any>cloneRegExp(<any>item);
  case '[object Date]':   return <any>cloneDate(<any>item);
  default: return item;
  }
}

function cloneObject<T>(item: T, workToken: string) {
  const result = register(<any>{}, item, workToken);
  for (const key in item) {
    result[key] = cloneAny(<any>item[key], workToken);
  }
  return result;
}

function cloneSet<T>(item: Set<any>, workToken: string): Set<T> {
  const result = register(new Set(), item, workToken);
  for (const entry of item) {
    result.add(cloneAny(entry, workToken));
  }
  return <Set<any>>result;
}

function cloneArray<T>(item: Array<any>, workToken: string): Array<T> {
  const result = register(new Array(item.length), item, workToken);
  for (let i = 0; i < item.length; i += 1) {
    result[i] = cloneAny(item[i], workToken);
  }
  return result;
}

function cloneMap<K, V>(item: Map<any, any>, workToken: string): Map<K, V> {
  const map = register(new Map(), item, workToken);
  for (const [key, value] of item) {
    map.set(cloneAny(key, workToken), cloneAny(value, workToken));
  }
  return map;
}

function cloneRegExp(item: RegExp): RegExp {
  return new RegExp(item.source, item.flags);
}

function cloneDate(item: Date) {
  return new Date(item.getTime());
}

export { clone };
