import * as fs            from 'fs';
import { join, dirname }  from 'path';
import { Tree }           from './Tree';
import { merge }          from './merge';
import * as Obj           from './objects';
const yaml                = require('js-yaml');

export function getFile(file: string) {
  return get({ ['%:' + file + ':*']: {} });
}

export async function get(data: any) {
  data = await resolveInclude(data);
  data = resolveReference(data);
  return data;
}

export async function resolveInclude(data: any, basedir?: string): Promise<any> {
  if (basedir == null) basedir = '.';
  switch (Object.prototype.toString.call(data)) {
  case '[object Object]':  {
    let result = {};
    const keys = Object.keys(data);
    for (const key of keys) {
      if (key.substr(0, 2) === '%:') {
        const [scheme, file, extract, target] = key.split(':');
        const filepath = file[0] == '/' ? file : join(basedir, file);
        let content = null;
        switch (file.substr(file.lastIndexOf('.'))) {
        case '.json': { content = await readJSON(filepath); } break ;
        case '.yaml': case '.yml': { content = await readYAML(filepath); } break ;
        default : { content = { text: (await readText(filepath)).toString() }; } break ;
        }
        const resolved = await resolveInclude(content, dirname(filepath));
        if (extract == '*' && target == null) {
          result = merge(resolved, data[key]);
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
        const value      = merge(Obj.get(root, source), resolveReference(holder[key], root));
        const output     = isNaN(skip) ? target : source.split('.').slice(skip).join('.');
        Obj.set(result, output, value);
      } else {
        result[key] = holder[key];
      }
    }
    return result;
  });
}

export async function readText(filepath: string) {
  return new Promise((resolve, reject) => {
    return fs.readFile(filepath, (err, content) => {
      if (err) return reject(err);
      else return resolve(content);
    });
  });
}

export async function readJSON(filepath: string) {
  const buffer = await readText(filepath);
  return JSON.parse(buffer.toString());
}

export async function readYAML(filepath: string) {
  const buffer = await readText(filepath);
  return yaml.safeLoad(buffer.toString());
}
