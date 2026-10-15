import * as vscode from 'vscode';
import { clearApiKey as authClearApiKey, configure as authConfigure } from '../auth';

export function configure(context: vscode.ExtensionContext) {
  return authConfigure(context);
}

export function clearApiKey(context: vscode.ExtensionContext) {
  return authClearApiKey(context);
}
