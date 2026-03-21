import * as http from 'node:http';
import * as https from 'node:https';
import { URL } from 'node:url';

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

export class SqlVaultClient {
  constructor(private apiUrl: string, private apiKey: string) {}

  private async request<T>(path: string, options: http.RequestOptions = {}, body?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      let requestUrl: string;
      try {
        requestUrl = new URL(path, this.apiUrl).toString();
      } catch (e) {
        return reject(new Error(`Invalid API URL: ${this.apiUrl}`));
      }

      const url = new URL(requestUrl);
      const isHttps = url.protocol === 'https:';
      const requestFn = isHttps ? https.request : http.request;

      const defaultOptions: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        timeout: 5000,
      };

      const req = requestFn(defaultOptions, (res) => {
        let responseData = '';

        if (res.statusCode === 401) {
          reject(new Error("Invalid API Key. Run 'SQL Vault: Configure API Key' to reconfigure."));
          req.destroy();
          return;
        }

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(responseData ? JSON.parse(responseData) : (null as unknown as T));
            } catch (e) {
              reject(new Error(`Failed to parse JSON response: ${responseData}`));
            }
          } else {
            reject(new Error(`HTTP Error ${res.statusCode}: ${responseData}`));
          }
        });
      });

      req.on('error', (e) => {
        if ((e as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
          reject(new Error(`Cannot connect to SQL Vault at ${this.apiUrl}. Make sure it is running.`));
        } else {
          reject(e);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out after 5000ms'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  async listQueries(search?: string): Promise<Query[]> {
    const path = search ? `/api/queries?search=${encodeURIComponent(search)}` : `/api/queries`;
    const res = await this.request<any[]>(path);
    return res.map(q => ({ ...q, name: q.name || q.title }));
  }

  async getQuery(id: string): Promise<Query> {
    const q = await this.request<any>(`/api/queries/${id}`);
    return { ...q, name: q.name || q.title };
  }

  async createQuery(data: {
    name: string
    sql: string
    database: DatabaseType
    description?: string
    tagIds?: string[]
    status: 'active' | 'draft'
  }): Promise<Query> {
    const q = await this.request<any>(`/api/queries`, { method: 'POST' }, {
      title: data.name,
      sql: data.sql,
      database: data.database,
      description: data.description,
      tagIds: data.tagIds,
      status: data.status
    });
    return { ...q, name: q.name || q.title };
  }

  async copyQuery(id: string): Promise<void> {
    await this.request<any>(`/api/queries/${id}/copy`, { method: 'POST' }).catch(() => {});
  }

  async listTags(): Promise<Tag[]> {
    return this.request<Tag[]>(`/api/tags`);
  }

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.request<any>(`/api/tags`);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }
}
