type resolve<T = any> = (value?: any) => void;
type reject           = (reason: any) => void;

export class Awaiter {
  protected started:   boolean;
  protected fulfilled: boolean;
  protected rejected:  boolean;
  protected total:     number;
  protected succeed:   number;
  protected errors:    Array<any>;
  protected resolve:   resolve<number>;
  protected reject:    reject;

  constructor() {
    this.started   = false;
    this.fulfilled = false;
    this.rejected  = false;
    this.total     = 0;
    this.succeed   = 0;
    this.errors    = [];
  }

  public then(resolve: resolve<number>) {
    this.resolve = resolve;
    return this.next();
  }

  public catch(reject: reject) {
    this.reject = reject;
    return this.next();
  }

  public start() {
    this.started = true;
    return this.next();
  }

  protected next() {
    if (this.started === false) return this;
    if (this.resolve === null) return this;
    if (this.total > (this.succeed + this.errors.length)) return this;
    if (this.errors.length > 0) {
      this.rejected = true;
      this.reject(this.errors[0]);
    } else {
      this.fulfilled = true;
      this.resolve(this.succeed);
    }
    return this;
  }

  public add(count: number = 1) {
    if (this.fulfilled) throw new Error('Awaiter already fulfilled');
    if (this.rejected)  throw new Error('Awaiter already rejected');
    this.total += count;
    return this;
  }

  public subtract(count: number = 1) {
    if (this.fulfilled) throw new Error('Awaiter already fulfilled');
    if (this.rejected)  throw new Error('Awaiter already rejected');
    this.total -= count;
    return this.next();
  }

  public done(error?: any) {
    if (error == null) this.succeed += 1;
    else this.errors.push(error);
    return this.next();
  }

  public wrapResolve(resolve: resolve) {
    return (value?: any) => {
      resolve(value);
      return this.done();
    };
  }

  public wrapReject(reject: reject) {
    return (reason?: any) => {
      reject(reason);
      return this.done(reason);
    };
  }

}