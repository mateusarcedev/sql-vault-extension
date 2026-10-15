import * as vscode from 'vscode';
import { getClient } from '../auth';
import { Query, SqlVaultClient } from '../api';
import { LatestOnly } from '../latest';

type QueryItem = vscode.QuickPickItem & { query?: Query };

async function insertQuery(client: SqlVaultClient, query: Query) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    const doc = await vscode.workspace.openTextDocument({ content: query.sql, language: 'sql' });
    await vscode.window.showTextDocument(doc);
  } else {
    await editor.edit(eb => {
      eb.insert(editor.selection.active, query.sql);
    });
  }
  // Usage metrics are best-effort; older SQL Vault versions lack the endpoint.
  client.recordUsage(query.id).catch(() => {});
}

export async function searchQuery(context: vscode.ExtensionContext, treeQuery?: Query) {
  const client = await getClient(context);
  if (!client) return;

  if (treeQuery) {
    await insertQuery(client, treeQuery);
    return;
  }

  const quickPick = vscode.window.createQuickPick<QueryItem>();
  quickPick.placeholder = 'Search SQL Vault queries...';
  quickPick.matchOnDescription = true;
  quickPick.matchOnDetail = true;

  const latest = new LatestOnly();
  let timeout: NodeJS.Timeout | undefined;

  const fetchQueries = async (search: string) => {
    const ticket = latest.next();
    quickPick.busy = true;
    try {
      const queries = await client.listQueries(search);
      // A slower response for an older search term must not replace newer results.
      if (!latest.isCurrent(ticket)) return;
      quickPick.items = queries.length === 0
        ? [{ label: 'No queries found', kind: vscode.QuickPickItemKind.Separator }]
        : queries.map(q => ({
          label: q.name,
          description: q.database,
          detail: q.sql.slice(0, 100).replace(/\n/g, ' '),
          query: q,
        }));
    } catch (e) {
      if (latest.isCurrent(ticket)) {
        vscode.window.showErrorMessage(e instanceof Error ? e.message : String(e));
      }
    } finally {
      if (latest.isCurrent(ticket)) quickPick.busy = false;
    }
  };

  quickPick.onDidChangeValue(value => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fetchQueries(value), 250);
  });

  quickPick.onDidAccept(async () => {
    const query = quickPick.selectedItems[0]?.query;
    if (!query) return;
    quickPick.hide();
    await insertQuery(client, query);
  });

  quickPick.onDidHide(() => {
    if (timeout) clearTimeout(timeout);
    quickPick.dispose();
  });
  quickPick.show();

  fetchQueries('');
}
