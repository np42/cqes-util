export class Library<T> {
  protected map:     Map<string, T>;
  protected context: string;

  constructor() {
    this.map = new Map();
  }

  public add(paths: string, hook: T) {
//    if (actions
    const path    = paths[i];
    const key     = [context, action, path].join(':');
//      this.map.set(key, 
    return this;
  }

  public get(path: string, ...args: any[]) {
    //return ;
  }

}