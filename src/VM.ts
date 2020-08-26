export type AST = [string, ...any[]];

export class VM {
  protected functions: Map<string, Function>;

  constructor(functions: { [name: string]: Function }) {
    this.functions = new Map(Object.keys(functions).map(key => [key, functions[key]]));
  }

  public exec(data: any, path: string, ast: AST) {
    if (!(ast instanceof Array) || typeof ast[0] != 'string') throw new Error('Bad AST');
    const action = ast[0].indexOf('.') > 0 ? ast[0].replace(/\./g, '_') : ast[0];
    if (action == null) return data;
    const method = this.functions.get(action);
    if (method != null) {
      return method.apply(this, [data, path, ...ast.slice(1)]);
    } else {
      throw new Error('function ' + action + ' not found');
    }
  }

}
