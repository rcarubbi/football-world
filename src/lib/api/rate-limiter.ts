import PQueue from "p-queue";

export class RateLimiter {
  private queue: PQueue;
  private dailyCounter = 0;
  private dailyLimit: number;
  private counterDate: string;

  constructor(concurrency: number, dailyLimit: number) {
    this.queue = new PQueue({ concurrency });
    this.dailyLimit = dailyLimit;
    this.counterDate = new Date().toISOString().split("T")[0];
  }

  private resetDailyCounterIfNeeded() {
    const today = new Date().toISOString().split("T")[0];
    if (today !== this.counterDate) {
      this.dailyCounter = 0;
      this.counterDate = today;
    }
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    this.resetDailyCounterIfNeeded();

    if (this.dailyCounter >= this.dailyLimit) {
      throw new Error(`Daily rate limit of ${this.dailyLimit} reached`);
    }

    return this.queue.add(async () => {
      this.dailyCounter++;
      return fn();
    });
  }

  getRemainingDailyQuota(): number {
    this.resetDailyCounterIfNeeded();
    return this.dailyLimit - this.dailyCounter;
  }
}

export function createRateLimiter(
  concurrency: number,
  dailyLimit: number
): RateLimiter {
  return new RateLimiter(concurrency, dailyLimit);
}
