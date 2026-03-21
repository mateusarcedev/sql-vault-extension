import * as vscode from 'vscode';
import { SqlVaultClient } from './api';

export function getApiKey(): string | undefined {
  const config = vscode.workspace.getConfiguration('sqlvault');
  const key = config.get<string>('apiKey');
  return key && key.trim().length > 0 ? key : undefined;
}

export function getApiUrl(): string {
  return vscode.workspace.getConfiguration('sqlvault').get<string>('apiUrl') || 'http://localhost:3000';
}

export async function configure(context: vscode.ExtensionContext): Promise<void> {
  const apiUrl = getApiUrl();
  vscode.env.openExternal(vscode.Uri.parse(`${apiUrl}/settings#api-keys`));

  const token = await vscode.window.showInputBox({
    prompt: 'Paste your SQL Vault API Key',
    placeHolder: 'sqlvault_...',
    password: true,
    ignoreFocusOut: true,
  });

  if (!token) {
    return;
  }

  const client = new SqlVaultClient(apiUrl, token);
  
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Testing connection to SQL Vault...',
    cancellable: false
  }, async () => {
    const result = await client.testConnection();
    if (result.ok) {
      await vscode.workspace.getConfiguration('sqlvault').update('apiKey', token, true);
      vscode.window.showInformationMessage('SQL Vault connected!');
      vscode.commands.executeCommand('sqlvault.refreshTree');
    } else {
      vscode.window.showErrorMessage(`Failed to connect: ${result.error}`);
    }
  });
}
