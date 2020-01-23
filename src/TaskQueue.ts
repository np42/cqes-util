export interface props<T> {
  maxRunningJobs?: number;
  maxRetry?:       number;
  retryPolicy?:    Array<number>;
  handler:         handler<T>;
  onError?:        (payload: T) => void;
}

export type handler<T> = (payload: T) => Promise<void>;

interface Task<T> {
  retryCount: number;
  nextRetry:  number;
  payload:    T;
}

export class TaskQueue<T> {
  protected queue:          Array<Task<T>>;
  protected running:        number;
  protected enabled:        boolean;
  protected timer:          NodeJS.Timer;
  protected handler:        handler<T>;
  protected onError:        (payload?: T) => void;
  protected maxRetry:       number;
  protected retryPolicy:    Array<number>;
  protected maxRunningJobs: number;

  constructor(props: props<T>) {
    this.queue          = [];
    this.running        = 0;
    this.enabled        = true;
    this.timer          = null;
    this.handler        = props.handler;
    this.onError        = props.onError        || (() => {});
    this.maxRetry       = props.maxRetry       || 5;
    this.retryPolicy    = props.retryPolicy    || [1, 60, 300, 3600, 3000, 43200];
    this.maxRunningJobs = props.maxRunningJobs || 1;
  }

  public push(...args: Array<T>) {
    const now = Date.now();
    for (let i = 0; i < args.length; i += 1)
      this.insert(0, now, args[i]);
    this.drain();
    return this.queue.length;
  }

  public pause() {
    this.enabled = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  public resume() {
    this.enabled = true;
    this.drain();
  }

  // ------------------------

  protected insert(retryCount: number, nextRetry: number, payload: T) {
    const task = { retryCount, nextRetry, payload };
    for (let i = 0; i < this.queue.length; i += 1) {
      if (this.queue[i].nextRetry < nextRetry) continue ;
      this.queue.splice(i, 0, task);
      return ;
    }
    this.queue.push(task);
  }

  protected drain() {
    if (!this.enabled) return ;
    if (!(this.running < this.maxRunningJobs)) return ;
    if (!(this.queue.length > 0)) return ;
    const task = this.getNextTask();
    if (task == null) {
      const now = Date.now();
      this.timer = setTimeout(() => this.drain(), this.queue[0].nextRetry - now + 1);
    } else {
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
      this.handler(task.payload).then(() => {
        this.drain();
      }).catch((e: Error) => {
        if (task.retryCount >= this.maxRetry) return this.onError(task.payload);
        const retryCount = task.retryCount + 1;
        const retryDelay = this.retryPolicy[Math.min(this.retryPolicy.length - 1, retryCount)] * 1000;
        this.insert(retryCount, Date.now() + retryDelay, task.payload);
      });
    }
  }

  protected getNextTask() {
    const now = Date.now();
    for (let i = 0; i < this.queue.length; i += 1)
      if (this.queue[i].nextRetry <= now)
        return this.queue.splice(i, 1)[0];
    return null;
  }

}
