import * as fs              from 'fs';
import { join, dirname }    from 'path';
import { Tree, WalkAction } from './Tree';
import { merge }            from './merge';
import * as Obj             from './objects';
const yaml                = require('js-yaml');

interface TaskInclude {
  node:      any;
  path:      Array<string>;
  basedir:   string;
  file:      string;
  extract:   string;
  overwrite: any;
  target:    string;
}

interface TaskReference {

}

export function getFile(file: string) {
  return get({ ['%:' + file + ':*']: {} });
}

export async function get(data: any) {
  const includes = process(data, [], '.');
  while (includes.length > 0) {
    const props = includes.shift();
    const include = await resolveInclude(props.basedir, props.file);
    const basepath = props.path.slice(0, -1);
    const keptData = Obj.get(props.node, props.path);
    Obj.remove(props.node, props.path);
    Obj.set(props.node, basepath, merge(include, Obj.get(props.node, basepath), keptData));
    const directory = dirname(props.file.slice(0, 1) === '/' ? props.file : join(props.basedir, props.file));
    const newIncludes = process(data, basepath, directory);
    includes.push(...newIncludes);
  }
  resolveReference(data);
  return data;
}

export function resolveReference(data: any) {
  Tree.walk(data, (path, setter, holder) => {
    const key = path[path.length - 1];
    if (typeof key !== 'string') return ;
    const scheme = key.slice(0, 2);
    if (scheme !== '&:') return ;
    if (typeof setter !== 'function') return ;
    delete holder[key];
    setter(data, holder);
    return WalkAction.Reloop;
  });
}

export function process(node: any, path: Array<string>, basedir: string) {
  const includes: Array<TaskInclude> = [];
  Tree.walk(Obj.get(node, path), function iterate(path, overwrite, holder) {
    if (typeof overwrite === 'function') return ;
    const key = path[path.length - 1];
    if (typeof key !== 'string') return ;
    const scheme = key.slice(0, 2);
    switch (scheme) {
    case '%:': {
      const [scheme, file, extract, target] = key.split(':');
      includes.push({ node, path, basedir, file, extract, overwrite, target });
    } break ;
    case '&:': {
      const [scheme, source, target] = key.split(':');
      const sourcepath = source.split('.');
      const targetpath = target == null ? sourcepath
        : /^\d+$/.test(target) ? sourcepath.slice(Number(target))
        : target.split('.');
      holder[key] = (root: any, holder: any) => {
        const referencedValue = Obj.get(node, sourcepath) || Obj.get(root, sourcepath);
        const finalValue = merge(referencedValue, overwrite);
        Obj.set(holder, targetpath, merge(Obj.get(holder, targetpath), finalValue));
      };
      Tree.walk(overwrite, iterate);
    } break ;
    }
  }, path);
  return includes;
}

export async function resolveInclude(basedir: string, file: string) {
  const filepath = file[0] === '/' ? file : join(basedir, file);
  switch (file.substr(file.lastIndexOf('.'))) {
  case '.json': { return await readJSON(filepath); } break ;
  case '.yaml': case '.yml': { return await readYAML(filepath); } break ;
  default : { return { text: (await readText(filepath)).toString() }; } break ;
  }
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
