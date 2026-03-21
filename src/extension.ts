import * as vscode from 'vscode';
import { searchQuery } from './commands/searchQuery';
import { saveQuery } from './commands/saveQuery';
import { configure } from './commands/configure';
import { QueryTreeProvider } from './providers/queryTreeProvider';
import { getApiKey } from './auth';

export function activate(context: vscode.ExtensionContext) {
  const treeProvider = new QueryTreeProvider();
  vscode.window.registerTreeDataProvider('sqlvault.queriesTree', treeProvider);

  context.subscriptions.push(
    vscode.commands.registerCommand('sqlvault.searchQuery', (query) => searchQuery(context, query)),
    vscode.commands.registerCommand('sqlvault.saveQuery', () => saveQuery(context)),
    vscode.commands.registerCommand('sqlvault.configure', () => configure(context)),
    vscode.commands.registerCommand('sqlvault.refreshTree', () => treeProvider.refresh())
  );

  if (!getApiKey()) {
    vscode.window.showInformationMessage(
      'SQL Vault: API Key not configured.',
      'Configure now'
    ).then(action => {
      if (action === 'Configure now') configure(context);
    });
  }
}

export function deactivate() {}
