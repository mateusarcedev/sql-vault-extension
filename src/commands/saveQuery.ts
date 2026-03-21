import * as vscode from 'vscode';
import { getApiKey, getApiUrl, configure } from '../auth';
import { SqlVaultClient, DatabaseType } from '../api';

export async function saveQuery(context: vscode.ExtensionContext) {
  const apiKey = getApiKey();
  if (!apiKey) {
    await configure(context);
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const sql = editor.document.getText(editor.selection);
  if (!sql.trim()) {
    vscode.window.showWarningMessage('No SQL selected.');
    return;
  }

  const name = await vscode.window.showInputBox({
    prompt: 'Query name',
    placeHolder: 'Ex: Monthly sales report',
    validateInput: v => v.trim() ? null : 'Name is required',
  });

  if (!name) return;

  const databases: DatabaseType[] = ['postgresql', 'mysql', 'sqlite', 'sqlserver', 'oracle', 'other'];
  const databaseStr = await vscode.window.showQuickPick(databases, {
    placeHolder: 'Select the target database'
  });

  if (!databaseStr) return;
  const database = databaseStr as DatabaseType;

  const client = new SqlVaultClient(getApiUrl(), apiKey);
  
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Saving query to SQL Vault...',
  }, async () => {
    try {
      await client.createQuery({ name, sql, database, status: 'active' });
      vscode.window.showInformationMessage('Query saved to SQL Vault!');
      vscode.commands.executeCommand('sqlvault.refreshTree');
    } catch (e: any) {
      vscode.window.showErrorMessage(`Failed to save query: ${e.message}`);
    }
  });
}
