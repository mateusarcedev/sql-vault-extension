import * as vscode from 'vscode';
import { SqlVaultClient } from './api';
import { InsecureUrlError, parseApiUrl } from './url';

export const SECRET_KEY = 'sqlvault.apiKey';
const LEGACY_SETTING = 'apiKey';
export const DEFAULT_API_URL = 'http://localhost:3000';

export async function getApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
  const key = await context.secrets.get(SECRET_KEY);
  return key && key.trim().length > 0 ? key.trim() : undefined;
}

// `sqlvault.apiUrl` is machine-scoped, so values from a workspace's
// .vscode/settings.json are ignored and cannot redirect the API key.
export function getApiUrl(): string {
  return vscode.workspace.getConfiguration('sqlvault').get<string>('apiUrl') || DEFAULT_API_URL;
}

/**
 * Moves an API key saved in user settings by versions <= 0.1.x into
 * SecretStorage and removes it from settings.json. Workspace values are
 * never read.
 */
export async function migrateLegacyApiKey(context: vscode.ExtensionContext): Promise<void> {
  const config = vscode.workspace.getConfiguration('sqlvault');
  const legacy = config.inspect<string>(LEGACY_SETTING)?.globalValue;
  if (legacy === undefined) return;

  if (legacy.trim() && !(await getApiKey(context))) {
    await context.secrets.store(SECRET_KEY, legacy.trim());
  }
  await config.update(LEGACY_SETTING, undefined, vscode.ConfigurationTarget.Global);
}

/** Creates a client for the configured URL, or shows why it cannot. */
export async function getClient(context: vscode.ExtensionContext): Promise<SqlVaultClient | undefined> {
  const apiKey = await getApiKey(context);
  if (!apiKey) {
    const action = await vscode.window.showInformationMessage('SQL Vault: API key not configured.', 'Configure now');
    if (action === 'Configure now') await configure(context);
    return undefined;
  }

  try {
    return new SqlVaultClient(getApiUrl(), apiKey);
  } catch (e) {
    vscode.window.showErrorMessage(e instanceof Error ? e.message : String(e));
    return undefined;
  }
}

export async function configure(context: vscode.ExtensionContext): Promise<void> {
  const apiUrl = getApiUrl();
  let baseUrl: URL;
  try {
    baseUrl = parseApiUrl(apiUrl);
  } catch (e) {
    const message = e instanceof InsecureUrlError ? e.message : String(e);
    const action = await vscode.window.showErrorMessage(`${message} Update 'sqlvault.apiUrl' in your user settings.`, 'Open Settings');
    if (action === 'Open Settings') {
      vscode.commands.executeCommand('workbench.action.openSettings', 'sqlvault.apiUrl');
    }
    return;
  }

  vscode.env.openExternal(vscode.Uri.parse(new URL('/settings#api-keys', baseUrl).toString()));

  const token = await vscode.window.showInputBox({
    title: `SQL Vault (${baseUrl.origin})`,
    prompt: `Paste the API key generated at ${baseUrl.origin}/settings`,
    placeHolder: 'sqlvault_...',
    password: true,
    ignoreFocusOut: true,
  });

  if (!token?.trim()) {
    return;
  }

  const client = new SqlVaultClient(apiUrl, token.trim());

  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: `Testing connection to ${baseUrl.origin}...`,
    cancellable: false,
  }, async () => {
    const result = await client.testConnection();
    if (result.ok) {
      await context.secrets.store(SECRET_KEY, token.trim());
      vscode.window.showInformationMessage('SQL Vault connected!');
    } else {
      vscode.window.showErrorMessage(`Failed to connect: ${result.error}`);
    }
  });
}

export async function clearApiKey(context: vscode.ExtensionContext): Promise<void> {
  await context.secrets.delete(SECRET_KEY);
  vscode.window.showInformationMessage('SQL Vault: API key removed from this machine.');
}
