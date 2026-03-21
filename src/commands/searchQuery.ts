import * as vscode from 'vscode';
import { getApiKey, getApiUrl, configure } from '../auth';
import { SqlVaultClient, Query } from '../api';

export async function searchQuery(context: vscode.ExtensionContext, treeQuery?: Query) {
  const apiKey = getApiKey();
  if (!apiKey) {
    await configure(context);
    return;
  }

  const client = new SqlVaultClient(getApiUrl(), apiKey);

  if (treeQuery) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      const doc = await vscode.workspace.openTextDocument({ content: treeQuery.sql, language: 'sql' });
      await vscode.window.showTextDocument(doc);
    } else {
      await editor.edit(eb => {
        eb.insert(editor.selection.active, treeQuery.sql);
      });
    }
    client.copyQuery(treeQuery.id).catch(() => {});
    return;
  }

  const quickPick = vscode.window.createQuickPick();
  
  quickPick.placeholder = 'Search SQL Vault queries...';
  quickPick.matchOnDescription = true;
  quickPick.matchOnDetail = true;

  let timeout: NodeJS.Timeout | undefined;

  const fetchQueries = async (search: string) => {
    quickPick.busy = true;
    try {
      const queries = await client.listQueries(search);
      if (queries.length === 0) {
        quickPick.items = [{ label: 'No queries found', kind: vscode.QuickPickItemKind.Separator }];
      } else {
        quickPick.items = queries.map(q => ({
          label: q.name,
          description: q.database,
          detail: q.sql.slice(0, 100).replace(/\n/g, ' '),
          query: q
        } as vscode.QuickPickItem & { query: Query }));
      }
    } catch (e: any) {
      vscode.window.showErrorMessage(e.message);
    } finally {
      quickPick.busy = false;
    }
  };

  quickPick.onDidChangeValue(value => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      fetchQueries(value);
    }, 250);
  });

  quickPick.onDidAccept(async () => {
    const selection = quickPick.selectedItems[0] as vscode.QuickPickItem & { query?: Query };
    if (!selection || !selection.query) return;

    const query = selection.query;
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      const doc = await vscode.workspace.openTextDocument({ content: query.sql, language: 'sql' });
      await vscode.window.showTextDocument(doc);
    } else {
      await editor.edit(eb => {
        eb.insert(editor.selection.active, query.sql);
      });
    }

    quickPick.hide();

    client.copyQuery(query.id).catch(() => {});
  });

  quickPick.onDidHide(() => quickPick.dispose());
  quickPick.show();

  fetchQueries('');
}
