import * as vscode from 'vscode';
import { configure as authConfigure } from '../auth';

export function configure(context: vscode.ExtensionContext) {
  return authConfigure(context);
}
