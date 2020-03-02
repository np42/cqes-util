import * as fs            from 'fs';
import { join, basename } from 'path';
import { Tree }           from 'Tree';
const yaml                = require('js-yaml');

export function getFile(file: string) {
  return get({ ['%:' + file + ':*']: {} });
}

export async function get(data: any) {
  data = await resolveInclude(data);
  data = resolveReference(data);
  return data;
}

export async function resolveInclude(data: any, basedir: string) {
  switch (Object.prototype.toString.call(data)) {
  case '[object Object]':  {
    const result = {};
    const keys = Object.keys(data);
    for (const key of keys) {
      if (key.substr(0, 2) === '%:') {
        const [scheme, file, extract, target] = key.split(':');
        const filepath = join(basedir || '.', file);
        let content = null;
        switch (file.substr(file.lastIndexOf('.'))) {
        case '.json': { content = await readJSON(filepath); } break ;
        case '.yaml': case '.yml': { content = await readYAML(filepath); } break ;
        }
        const keys = [];
        if (extract == '*') {
          Array.prototype.push.apply(keys, Object.keys(content));
        } else {
          throw new Error('Not implemented');
        }
        if (target == null) {
          for (const key of keys)
            data[key] = await resolveInclude(content[key], basename(filepath));
        } else {
          throw new Error('Not implemented');
        }
      } else {
        result[key] = await resolveInclude(data[key]);
      }
    }
    return result;
  }
  case '[object Array]': {
    const result = [];
    for (let i = 0; i < data.length; i += 1)
      result[i] = await resolveInclude(data[i]);
    return result;
  }
  default :
    return data;
  }
}

export function resolveReference(data: any, root?: any) {
  if (root == null) root = data;
  return Tree.replace(data, (holder, key) => {
    if (!(holder instanceof Object)) return holder;
    if (holder instanceof Array) return holder;
    const result = {};
    for (const key in holder) {
      if (key.substr(0, 2) === '&:') {
        const lastOffset = key.lastIndexOf(':');
        const target     = key.substr(lastOffset + 1);
        const skip       = lastOffset === 1 ? 1 : Number(target);
        const source     = key.substring(2, lastOffset > 1 ? lastOffset : key.length);
        const value      = merge(get(root, source), Process.inflateContent(holder[key], root));
        const output     = isNaN(skip) ? target : source.split('.').slice(skip).join('.');
        set(result, output, value);
      } else {
        result[key] = holder[key];
      }
    }
    return result;
  });
}

export async readJSON(filepath: string) {
  return require(filepath);
}

export async function readYAML(filepath: string) {
  return await new Promise((resolve, reject) => {
    return fs.readFile(filepath, (err, content) => {
      if (err) return reject(err);
      try {
        const config = yaml.safeLoad(content.toString());
        return resolve(config);
      } catch (e) {
        return reject(e);
      }
    });
  });
}
