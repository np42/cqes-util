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
  return await resolveInclude(data);
}

export async function resolveInclude(data: any, basedir?: string): Promise<any> {
  return resolveReference(await resolveOnlyInclude(data, basedir));
}

export async function resolveOnlyInclude(data: any, basedir?: string): Promise<any> {
  if (basedir == null) basedir = '.';
  switch (Object.prototype.toString.call(data)) {
  case '[object Object]':  {
    let result = {};
    const keys = Object.keys(data);
    for (const key of keys) {
      if (key.substr(0, 2) === '%:') {
        const [scheme, file, extract, target] = key.split(':');
        const filepath = file[0] === '/' ? file : join(basedir, file);
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
        result[key] = await resolveOnlyInclude(data[key], basedir);
      }
    }
    return result;
  }
  case '[object Array]': {
    const result = [];
    for (let i = 0; i < data.length; i += 1)
      result[i] = await resolveOnlyInclude(data[i], basedir);
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
        const parts      = key.split(':');
        if (~parts[1].indexOf('.') && parts.length < 3) throw new Error(key + ': needs a target');
        else if (parts[2] == null) parts[2] = parts[1];
        const reference  = resolveReference(Obj.get(root, parts[1]), root);
        const appliment  = resolveReference(holder[key], root);
        const value      = merge(reference, appliment);
        if (/^\d+$/.test(parts[2])) {
          Obj.set(result, parts[1].split('.').slice(Number(parts[2])).join('.') || '.', value);
        } else {
          Obj.set(result, parts[2], value);
        }
      } else if (!(key in result)) {
        result[key] = resolveReference(holder[key], root);
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
