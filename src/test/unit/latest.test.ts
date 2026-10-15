import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { LatestOnly } from '../../latest';

test('only the most recent ticket is current', () => {
  const latest = new LatestOnly();
  const first = latest.next();
  const second = latest.next();
  assert.equal(latest.isCurrent(first), false);
  assert.equal(latest.isCurrent(second), true);
});
