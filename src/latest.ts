/** Tracks overlapping async requests so only the most recent one applies its result. */
export class LatestOnly {
  private current = 0;

  next(): number {
    return ++this.current;
  }

  isCurrent(ticket: number): boolean {
    return ticket === this.current;
  }
}
