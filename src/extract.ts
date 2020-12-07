import { Tree } from './Tree';
import { get }  from './objects';

export function extract(pattern: any, against: any, knowledge = Knowledge) {
  return Tree.map(pattern, function mapper(key, value) {
    if (typeof value === 'string') {
      const semiColonOffset = value.indexOf(':');
      if (semiColonOffset === -1) return value;
      const scheme = value.slice(0, semiColonOffset);
      if (knowledge.String[scheme] == null) return value;
      return knowledge.String[scheme](value.slice(semiColonOffset + 1))(against);
    } else {
      return Tree.map(value, mapper);
    }
  });
}

const Knowledge = {
  String: {
    $:  (path: string) => (locals: any) => get(locals, path),
    js: (code: string) => new Function
    ( 'locals'
    , 'with (locals) { try { return (code); } catch (e) { return null; } }'
    )
  },
  Object: {
  }
};
