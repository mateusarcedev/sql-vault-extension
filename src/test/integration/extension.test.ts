import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';

describe('SQL Vault extension', () => {
  const extensionId = 'mateusarcedev.sqlvault';

  before(async () => {
    const extension = vscode.extensions.getExtension(extensionId);
    assert.ok(extension, `${extensionId} not found`);
    await extension.activate();
  });

  it('registers all commands', async () => {
    const commands = await vscode.commands.getCommands(true);
    for (const id of ['sqlvault.searchQuery', 'sqlvault.saveQuery', 'sqlvault.configure', 'sqlvault.clearApiKey', 'sqlvault.refreshTree']) {
      assert.ok(commands.includes(id), `${id} not registered`);
    }
  });

  it('declares apiUrl as machine-scoped so workspaces cannot override it', () => {
    const pkg = vscode.extensions.getExtension(extensionId)!.packageJSON;
    assert.equal(pkg.contributes.configuration.properties['sqlvault.apiUrl'].scope, 'machine');
  });
});
