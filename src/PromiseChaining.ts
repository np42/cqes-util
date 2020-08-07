/*
type resolve<T> = (arg: T) => void;
type reject = (reason: any) => void;
type handler<T> = (resolve: resolve<T>, reject: reject) => void;

export class NC<T> extends T {
  public ref: T;
  constructor(object: T, command: handler<T>) {
    super(
    this.
  }
}
*/
/*
class PromiseChaining {
  protected chain: Promise<void>;

  protected next(handler: promiseHandler) {
    const previous = this.chain;
    let fulfilled = false;
    this.chain = new Promise((resolve: resolve, reject: reject) => {
      const resolve2  = () => { fulfilled = true; resolve() };
      const rejected2 = (reason: any) => { fulfilled = true; reject(reason); };
      if (previous) previous.then(() => { promiseHandler(resolve2, reject2); });
      else promiseHandler(resolve2, reject2);
    });
  }

  public then(resolve: resolve) {
    if (this.chain) this.chain.then(resolve);
    else resolve();
  }

  public catch(reject: reject) {
    if (this.chain) this.chain.catch(reject);
  }
}
*/