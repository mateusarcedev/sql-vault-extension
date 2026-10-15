import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { InsecureUrlError, parseApiUrl } from '../../url';

test('accepts https for any host', () => {
  assert.equal(parseApiUrl('https://vault.example.com').origin, 'https://vault.example.com');
});

test('accepts plain http only for loopback hosts', () => {
  for (const url of ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://127.1.2.3', 'http://[::1]:3000']) {
    assert.doesNotThrow(() => parseApiUrl(url), url);
  }
});

test('rejects plain http for remote hosts', () => {
  for (const url of ['http://vault.example.com', 'http://192.168.0.10:3000', 'http://localhost.evil.com']) {
    assert.throws(() => parseApiUrl(url), InsecureUrlError, url);
  }
});

test('rejects invalid URLs and other protocols', () => {
  assert.throws(() => parseApiUrl('not a url'), InsecureUrlError);
  assert.throws(() => parseApiUrl('ftp://localhost'), InsecureUrlError);
});
