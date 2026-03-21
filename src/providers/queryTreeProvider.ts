import * as vscode from 'vscode';
import { SqlVaultClient, Query } from '../api';
import { getApiKey, getApiUrl } from '../auth';

export class QueryTreeItem extends vscode.TreeItem {
  constructor(
    public readonly query: Query | null,
    public readonly label: string,
    public readonly _description?: string,
    public readonly _tooltip?: string,
    public readonly state?: 'loading' | 'error' | 'configure' | 'query'
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    
    if (state === 'query' && query) {
      this.description = query.database;
      this.tooltip = query.sql.slice(0, 200);
      this.command = {
        command: 'sqlvault.searchQuery',
        title: 'Insert Query',
        arguments: [query]
      };
      this.iconPath = new vscode.ThemeIcon('database');
    } else if (state === 'configure') {
      this.command = {
        command: 'sqlvault.configure',
        title: 'Configure SQL Vault'
      };
    } else if (state === 'error') {
      this.iconPath = new vscode.ThemeIcon('error');
    } else if (state === 'loading') {
      this.iconPath = new vscode.ThemeIcon('loading~spin');
    }
  }
}

export class QueryTreeProvider implements vscode.TreeDataProvider<QueryTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<QueryTreeItem | undefined | void> = new vscode.EventEmitter<QueryTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<QueryTreeItem | undefined | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: QueryTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: QueryTreeItem): Promise<QueryTreeItem[]> {
    if (element) return [];

    const apiKey = getApiKey();
    if (!apiKey) {
      return [
        new QueryTreeItem(null, "Click here to configure SQL Vault", undefined, undefined, 'configure')
      ];
    }

    const client = new SqlVaultClient(getApiUrl(), apiKey);
    
    try {
      const queries = await client.listQueries();
      const topQueries = queries.slice(0, 50);
      if (topQueries.length === 0) {
        return [new QueryTreeItem(null, "No queries found", undefined, undefined, 'error')];
      }
      return topQueries.map(q => new QueryTreeItem(q, q.name, undefined, undefined, 'query'));
    } catch (e: any) {
      return [new QueryTreeItem(null, "Cannot connect to SQL Vault", undefined, undefined, 'error')];
    }
  }
}
