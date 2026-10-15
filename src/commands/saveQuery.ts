import * as vscode from 'vscode';
import { getClient } from '../auth';
import { DatabaseType } from '../api';

const DATABASES: DatabaseType[] = ['postgresql', 'mysql', 'sqlite', 'sqlserver', 'oracle', 'other'];

export async function saveQuery(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const sql = editor.document.getText(editor.selection);
  if (!sql.trim()) {
    vscode.window.showWarningMessage('No SQL selected.');
    return;
  }

  const client = await getClient(context);
  if (!client) return;

  const name = await vscode.window.showInputBox({
    prompt: 'Query name',
    placeHolder: 'Ex: Monthly sales report',
    validateInput: v => v.trim() ? null : 'Name is required',
  });
  if (!name) return;

  const database = await vscode.window.showQuickPick(DATABASES, {
    placeHolder: 'Select the target database',
  }) as DatabaseType | undefined;
  if (!database) return;

  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Saving query to SQL Vault...',
  }, async () => {
    try {
      await client.createQuery({ name: name.trim(), sql, database, status: 'active' });
      vscode.window.showInformationMessage('Query saved to SQL Vault!');
      vscode.commands.executeCommand('sqlvault.refreshTree');
    } catch (e) {
      vscode.window.showErrorMessage(`Failed to save query: ${e instanceof Error ? e.message : String(e)}`);
    }
  });
}
