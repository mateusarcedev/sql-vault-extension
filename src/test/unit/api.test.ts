import { after, before, beforeEach, test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as http from 'node:http';
import { AddressInfo } from 'node:net';
import { ApiError, SqlVaultClient } from '../../api';
import { InsecureUrlError } from '../../url';

type Recorded = { method?: string; url?: string; headers: http.IncomingHttpHeaders; body: string };
type Handler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

let server: http.Server;
let baseUrl: string;
let handler: Handler;
let requests: Recorded[];

before(async () => {
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      requests.push({ method: req.method, url: req.url, headers: req.headers, body });
      handler(req, res);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.closeAllConnections();
  server.close();
});

beforeEach(() => {
  requests = [];
  handler = (_req, res) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end('[]'); };
});

function json(status: number, body: unknown): Handler {
  return (_req, res) => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  };
}

async function rejectsWith(promise: Promise<unknown>, kind: ApiError['kind'], pattern?: RegExp) {
  await assert.rejects(promise, (e: unknown) => {
    assert.ok(e instanceof ApiError, `expected ApiError, got ${String(e)}`);
    assert.equal(e.kind, kind);
    if (pattern) assert.match(e.message, pattern);
    return true;
  });
}

test('sends the API key as a Bearer token and encodes the search term', async () => {
  handler = json(200, [{ id: 'q1', title: 'Monthly sales', sql: 'SELECT 1', database: 'postgresql' }]);
  const queries = await new SqlVaultClient(baseUrl, 'sqlvault_secret').listQueries('a&b c');

  assert.equal(requests[0].headers.authorization, 'Bearer sqlvault_secret');
  assert.equal(requests[0].url, '/api/queries?search=a%26b%20c');
  assert.equal(queries[0].name, 'Monthly sales');
});

test('maps title to name when creating a query', async () => {
  handler = json(201, { id: 'q2', title: 'New', sql: 'SELECT 2', database: 'mysql' });
  const created = await new SqlVaultClient(baseUrl, 'k').createQuery({ name: 'New', sql: 'SELECT 2', database: 'mysql', status: 'active' });

  assert.equal(requests[0].method, 'POST');
  assert.equal(requests[0].headers['content-type'], 'application/json');
  assert.deepEqual(JSON.parse(requests[0].body), { title: 'New', sql: 'SELECT 2', database: 'mysql', status: 'active' });
  assert.equal(created.name, 'New');
});

test('records usage on the usage endpoint with an encoded id', async () => {
  handler = (_req, res) => { res.writeHead(204); res.end(); };
  await new SqlVaultClient(baseUrl, 'k').recordUsage('a/b?c');

  assert.equal(requests[0].method, 'POST');
  assert.equal(requests[0].url, '/api/queries/a%2Fb%3Fc/usage');
});

test('maps 401 to an auth error', async () => {
  handler = json(401, { message: 'Not authenticated' });
  await rejectsWith(new SqlVaultClient(baseUrl, 'bad').listTags(), 'auth', /Configure API Key/);
});

test('surfaces the JSON message of HTTP errors but never an HTML body', async () => {
  handler = json(400, { message: 'Title and SQL are required' });
  await rejectsWith(new SqlVaultClient(baseUrl, 'k').listTags(), 'http', /^SQL Vault returned HTTP 400: Title and SQL are required$/);

  handler = (_req, res) => { res.writeHead(500, { 'content-type': 'text/html' }); res.end('<html>stack trace</html>'); };
  await rejectsWith(new SqlVaultClient(baseUrl, 'k').listTags(), 'http', /^SQL Vault returned HTTP 500$/);
});

test('rejects invalid JSON without echoing the body', async () => {
  handler = (_req, res) => { res.writeHead(200); res.end('<html>not json</html>'); };
  await rejectsWith(new SqlVaultClient(baseUrl, 'k').listTags(), 'parse', /^SQL Vault returned an invalid JSON response\.$/);
});

test('times out slow responses', async () => {
  handler = () => { /* never responds */ };
  await rejectsWith(new SqlVaultClient(baseUrl, 'k', 100).listTags(), 'timeout', /100ms/);
});

test('reports a refused connection as a network error', async () => {
  const closed = http.createServer();
  await new Promise<void>((resolve) => closed.listen(0, '127.0.0.1', resolve));
  const port = (closed.address() as AddressInfo).port;
  await new Promise<void>((resolve) => closed.close(() => resolve()));

  await rejectsWith(new SqlVaultClient(`http://127.0.0.1:${port}`, 'k').listTags(), 'network', /Cannot connect/);
});

test('refuses to build a client for plain http on a remote host', () => {
  assert.throws(() => new SqlVaultClient('http://vault.example.com', 'k'), InsecureUrlError);
});

test('testConnection reports failures instead of throwing', async () => {
  handler = json(401, {});
  const result = await new SqlVaultClient(baseUrl, 'bad').testConnection();
  assert.equal(result.ok, false);
});
