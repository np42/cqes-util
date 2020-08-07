export interface props<T> {
  maxRunningJobs?: number;
  maxRetry?:       number;
  cooldown?:       number; // ms to wait before starting next task
  retryPolicy?:    Array<number>;
  handler:         handler<T>;
  onError?:        (payload: T) => void;
}

export type handler<T> = (payload: T, task: Task<T>) => Promise<void>;

export interface Task<T> {
  retryCount: number;
  nextRetry:  number;
  slot:       string;
  payload:    T;
}

export class TaskQueue<T> {
  protected queue:          Array<Task<T>>; // Time ordered
  protected busySlots:      Set<string>;
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
    this.busySlots      = new Set();
    this.running        = 0;
    this.enabled        = true;
    this.timer          = null;
    this.handler        = props.handler;
    this.onError        = props.onError        || (() => {});
    this.maxRetry       = props.maxRetry       || 5;
    this.retryPolicy    = props.retryPolicy    || [1, 60, 300, 3600, 3000, 43200];
    this.maxRunningJobs = props.maxRunningJobs || 1;
    if (typeof this.handler !== 'function')
      throw new Error('Need an handler');
  }

  public push(task: T, slot?: string) {
    this.insert(0, Date.now(), slot, task);
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

  protected insert(retryCount: number, nextRetry: number, slot: string, payload: T) {
    const task = { retryCount, nextRetry, slot, payload };
    for (let i = 0; i < this.queue.length; i += 1) {
      if (this.queue[i].nextRetry <= nextRetry) continue ;
      this.queue.splice(i, 0, task);
      return ;
    }
    this.queue.push(task);
  }

  protected drain() {
    while (this.enabled) {
      if (this.running >= this.maxRunningJobs) return ;
      if (this.queue.length === 0) return ;
      const task = this.getNextTask();
      if (task == null) {
        if (this.timer != null) return ;
        if (this.running > 0) return ;
        const delay = this.queue[0].nextRetry - Date.now() + 1;
        this.timer = setTimeout(() => { this.timer = null; this.drain() }, delay);
        return ;
      } else {
        this.running += 1;
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        let promise = null;
        if (task.slot != null) this.busySlots.add(task.slot);
        try { promise = this.handler(task.payload, task); }
        catch (e) { promise = Promise.reject(e); }
        promise.then(() => {
          this.running -= 1;
          this.busySlots.delete(task.slot);
          this.drain();
        }).catch((e: Error) => {
          this.running -= 1;
          this.busySlots.delete(task.slot);
          if (task.retryCount >= this.maxRetry) return this.onError(task.payload);
          const retryCount = task.retryCount + 1;
          const retryDelay = this.retryPolicy[Math.min(this.retryPolicy.length - 1, retryCount)] * 1000;
          this.insert(retryCount, Date.now() + retryDelay, task.slot, task.payload);
          this.drain();
        });
      }
    }
  }

  protected getNextTask() {
    const now = Date.now();
    for (let i = 0; i < this.queue.length; i += 1) {
      const task = this.queue[i];
      if (task.nextRetry > now) return null;
      if (task.slot != null && this.busySlots.has(task.slot)) continue ;
      return this.queue.splice(i, 1)[0];
    }
    return null;
  }

}
