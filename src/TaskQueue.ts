export interface props<T> {
  maxRunningJobs?: number;
  maxRetry?:       number;
  retryPolicy?:    Array<number>;
  handler:         handler<T>;
}

export type handler<T> = (payload: T) => Promise<void>;

interface Task<T> {
  retryCount: number;
  nextRetry:  number;
  payload:    T;
}

export class TaskQueue<T> {
  protected queue:   Array<Task<T>>;
  protected handler: handler;
  protected running: number;

  constructor(props: props<T>) {
    this.queue          = [];
    this.running        = 0;
    this.handler        = props.handler;
    this.maxRetry       = props.maxRetry       || 5;
    this.retryPolicy    = props.retryPolicy    || [1, 60, 300, 3600, 3000, 43200];
    this.maxRunningJobs = props.maxRunningJobs || 1;
  }

  public push(...args: Array<T>) {
    const result = this.queue.push(...args);
    this.drain();
    return result;
  }

  protected drain() {

  }

  protected pause() {

  }

  protected resume() {

  }
}