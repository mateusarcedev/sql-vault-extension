import * as vscode from 'vscode';
import { searchQuery } from './commands/searchQuery';
import { saveQuery } from './commands/saveQuery';
import { clearApiKey, configure } from './commands/configure';
import { QueryTreeProvider } from './providers/queryTreeProvider';
import { migrateLegacyApiKey, SECRET_KEY } from './auth';

export async function activate(context: vscode.ExtensionContext) {
  const treeProvider = new QueryTreeProvider(context);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('sqlvault.queriesTree', treeProvider),
    vscode.commands.registerCommand('sqlvault.searchQuery', (query) => searchQuery(context, query)),
    vscode.commands.registerCommand('sqlvault.saveQuery', () => saveQuery(context)),
    vscode.commands.registerCommand('sqlvault.configure', () => configure(context)),
    vscode.commands.registerCommand('sqlvault.clearApiKey', () => clearApiKey(context)),
    vscode.commands.registerCommand('sqlvault.refreshTree', () => treeProvider.refresh()),
    context.secrets.onDidChange(e => {
      if (e.key === SECRET_KEY) treeProvider.refresh();
    }),
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('sqlvault.apiUrl')) treeProvider.refresh();
    }),
  );

  try {
    await migrateLegacyApiKey(context);
  } catch (e) {
    console.error('[sqlvault] failed to migrate legacy API key setting', e);
  }
}

export function deactivate() {}
