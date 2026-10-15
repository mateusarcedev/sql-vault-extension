import * as http from 'node:http';
import * as https from 'node:https';
import { parseApiUrl } from './url';

export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'oracle' | 'other'

export type Tag = {
  id: string
  name: string
  color: string
}

export type Query = {
  id: string
  name: string
  description: string | null
  sql: string
  database: DatabaseType
  status: 'active' | 'draft'
  isFavorite: boolean
  copyCount: number
  tags: Tag[]
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

// The API names the field `title`; older payloads used `name`.
type RawQuery = Omit<Query, 'name'> & { name?: string; title?: string }

export type ApiErrorKind = 'auth' | 'network' | 'timeout' | 'http' | 'parse'

export class ApiError extends Error {
  constructor(public readonly kind: ApiErrorKind, message: string, public readonly status?: number) {
    super(message);
  }
}

export const DEFAULT_TIMEOUT_MS = 5000;
const MAX_ERROR_DETAIL = 200;

function toQuery(raw: RawQuery): Query {
  return { ...raw, name: raw.name || raw.title || '(untitled)' };
}

function errorDetail(body: string): string {
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === 'object' && 'message' in parsed && typeof parsed.message === 'string') {
      return parsed.message.slice(0, MAX_ERROR_DETAIL);
    }
  } catch {
    // Not JSON (e.g. an HTML error page): do not surface the body.
  }
  return '';
}

export class SqlVaultClient {
  private readonly baseUrl: URL;

  constructor(apiUrl: string, private readonly apiKey: string, private readonly timeoutMs = DEFAULT_TIMEOUT_MS) {
    this.baseUrl = parseApiUrl(apiUrl);
  }

  private request<T>(path: string, method: 'GET' | 'POST' = 'GET', body?: unknown): Promise<T> {
    const url = new URL(path, this.baseUrl);
    const requestFn = url.protocol === 'https:' ? https.request : http.request;
    const payload = body === undefined ? undefined : JSON.stringify(body);

    return new Promise<T>((resolve, reject) => {
      const req = requestFn(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
          ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        timeout: this.timeoutMs,
      }, (res) => {
        const status = res.statusCode ?? 0;
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => { data += chunk; });
        res.on('end', () => {
          if (status === 401) {
            reject(new ApiError('auth', "Invalid API key. Run 'SQL Vault: Configure API Key' to reconfigure.", status));
            return;
          }
          if (status < 200 || status >= 300) {
            const detail = errorDetail(data);
            reject(new ApiError('http', `SQL Vault returned HTTP ${status}${detail ? `: ${detail}` : ''}`, status));
            return;
          }
          if (!data) {
            resolve(undefined as T);
            return;
          }
          try {
            resolve(JSON.parse(data) as T);
          } catch {
            reject(new ApiError('parse', 'SQL Vault returned an invalid JSON response.', status));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy(new ApiError('timeout', `Request to SQL Vault timed out after ${this.timeoutMs}ms.`));
      });

      req.on('error', (e: NodeJS.ErrnoException) => {
        if (e instanceof ApiError) {
          reject(e);
        } else if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
          reject(new ApiError('network', `Cannot connect to SQL Vault at ${this.baseUrl.origin}. Make sure it is running.`));
        } else {
          reject(new ApiError('network', `Cannot reach SQL Vault: ${e.message}`));
        }
      });

      if (payload !== undefined) req.write(payload);
      req.end();
    });
  }

  async listQueries(search?: string): Promise<Query[]> {
    const path = search ? `/api/queries?search=${encodeURIComponent(search)}` : '/api/queries';
    const res = await this.request<RawQuery[]>(path);
    return Array.isArray(res) ? res.map(toQuery) : [];
  }

  async createQuery(data: {
    name: string
    sql: string
    database: DatabaseType
    description?: string
    tagIds?: string[]
    status: 'active' | 'draft'
  }): Promise<Query> {
    const q = await this.request<RawQuery>('/api/queries', 'POST', {
      title: data.name,
      sql: data.sql,
      database: data.database,
      description: data.description,
      tagIds: data.tagIds,
      status: data.status,
    });
    return toQuery(q);
  }

  /** Increments the query's copyCount. Requires SQL Vault with POST /api/queries/:id/usage. */
  async recordUsage(id: string): Promise<void> {
    await this.request<void>(`/api/queries/${encodeURIComponent(id)}/usage`, 'POST');
  }

  async listTags(): Promise<Tag[]> {
    return this.request<Tag[]>('/api/tags');
  }

  async testConnection(): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      await this.listTags();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }
}
