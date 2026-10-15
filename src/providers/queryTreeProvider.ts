import * as vscode from 'vscode';
import { ApiError, Query, SqlVaultClient } from '../api';
import { getApiKey, getApiUrl } from '../auth';

const MAX_ITEMS = 50;

type ItemState = 'error' | 'configure' | 'query';

export class QueryTreeItem extends vscode.TreeItem {
  constructor(
    public readonly query: Query | null,
    label: string,
    state: ItemState,
    tooltip?: string,
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);

    if (state === 'query' && query) {
      this.description = query.database;
      this.tooltip = query.sql.slice(0, 200);
      this.command = {
        command: 'sqlvault.searchQuery',
        title: 'Insert Query',
        arguments: [query],
      };
      this.iconPath = new vscode.ThemeIcon('database');
    } else if (state === 'configure') {
      this.tooltip = tooltip;
      this.iconPath = new vscode.ThemeIcon('key');
      this.command = {
        command: 'sqlvault.configure',
        title: 'Configure SQL Vault',
      };
    } else {
      this.tooltip = tooltip;
      this.iconPath = new vscode.ThemeIcon('error');
    }
  }
}

export class QueryTreeProvider implements vscode.TreeDataProvider<QueryTreeItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<QueryTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<QueryTreeItem | undefined | void> = this._onDidChangeTreeData.event;

  constructor(private readonly context: vscode.ExtensionContext) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: QueryTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: QueryTreeItem): Promise<QueryTreeItem[]> {
    if (element) return [];

    const apiKey = await getApiKey(this.context);
    if (!apiKey) {
      return [new QueryTreeItem(null, 'Click here to configure SQL Vault', 'configure')];
    }

    try {
      const client = new SqlVaultClient(getApiUrl(), apiKey);
      const queries = await client.listQueries();
      if (queries.length === 0) {
        return [new QueryTreeItem(null, 'No queries found', 'error')];
      }
      return queries.slice(0, MAX_ITEMS).map(q => new QueryTreeItem(q, q.name, 'query'));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (e instanceof ApiError && e.kind === 'auth') {
        return [new QueryTreeItem(null, 'Invalid API key: click to reconfigure', 'configure', message)];
      }
      if (e instanceof ApiError) {
        return [new QueryTreeItem(null, 'Cannot connect to SQL Vault', 'error', message)];
      }
      // Invalid or insecure apiUrl.
      return [new QueryTreeItem(null, 'Invalid SQL Vault URL', 'error', message)];
    }
  }
}
