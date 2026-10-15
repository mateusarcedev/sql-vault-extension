# SQL Vault for VS Code

Search, insert and save SQL queries from your self-hosted [SQL Vault](https://github.com/mateusarcedev/sql-vault) without leaving the editor.

[Versão em português](README.pt-BR.md)

![Search and insert a query](https://raw.githubusercontent.com/mateusarcedev/sql-vault/main/public/screenshots/extensao-vscode-buscar-query.jpg)

## Features

- **Search & insert**: fuzzy search your queries and insert the SQL at the cursor (or in a new SQL document)
- **Save selection**: save the selected SQL to SQL Vault with a name and database type
- **Sidebar**: browse your most recent queries (up to 50) in the SQL Vault view
- **Secure by default**: API key kept in VS Code SecretStorage, HTTPS required for remote servers

## Requirements

| | Version |
|---|---|
| VS Code | 1.85 or newer |
| SQL Vault | Any version with API keys. Usage counting needs `POST /api/queries/:id/usage` ([mateusarcedev/sql-vault#20](https://github.com/mateusarcedev/sql-vault/pull/20)); older servers work, the counter just does not increase. |

## Installation

- **VS Code**: search for **SQL Vault** (`mateusarcedev.sqlvault`) in the Extensions view, or run `code --install-extension mateusarcedev.sqlvault`
- **Cursor, VSCodium and other Open VSX editors**: install `mateusarcedev.sqlvault` from [Open VSX](https://open-vsx.org/extension/mateusarcedev/sqlvault) (from 0.2.0)
- **Manual**: download the `.vsix` from [Releases](https://github.com/mateusarcedev/sql-vault-extension/releases) and run `Extensions: Install from VSIX...`

## Setup

1. If SQL Vault is not at `http://localhost:3000`, set the URL in your **user** settings:
   ```json
   { "sqlvault.apiUrl": "https://sqlvault.example.com" }
   ```
2. Run **SQL Vault: Configure API Key**. The extension opens `Settings > API Keys` in SQL Vault; create a key and paste it into the prompt.
3. The connection is tested before the key is saved.

Do not put the API key in `settings.json`: it is stored only in SecretStorage.

## Commands

| Command | Default access |
|---|---|
| SQL Vault: Search Query | `Ctrl+Alt+Q` (Windows/Linux), `Cmd+Alt+Q` (macOS), editor context menu |
| SQL Vault: Save Selected SQL | Editor context menu with a selection |
| SQL Vault: Configure API Key | Command Palette |
| SQL Vault: Remove API Key | Command Palette |
| Refresh | SQL Vault view title bar |

## Security

- **API key**: stored in VS Code [SecretStorage](https://code.visualstudio.com/api/references/vscode-api#SecretStorage) (OS keychain), never in `settings.json`. Keys saved in settings by 0.1.x are moved there automatically and removed from settings.
- **Transport**: `sqlvault.apiUrl` must use `https://`; plain `http://` is accepted only for `localhost`/`127.0.0.1`/`::1`.
- **Workspaces**: `sqlvault.apiUrl` is machine-scoped, so a repository's `.vscode/settings.json` cannot redirect your key to another server.
- To revoke access on a machine, run **SQL Vault: Remove API Key** and delete the key in SQL Vault.

## Troubleshooting

| Message | Fix |
|---|---|
| `Invalid API key...` | Run **SQL Vault: Configure API Key** again |
| `Cannot connect to SQL Vault at ...` | Check the server is running and `sqlvault.apiUrl` |
| `Refusing to send the API key to http://...` | Use `https://` for remote servers |
| `Request to SQL Vault timed out...` | Check network/VPN; requests time out after 5 s |

## Development

Requires Node.js 22.

```bash
npm ci
npm test                 # compile + unit tests (node:test, no VS Code needed)
npm run test:integration # downloads VS Code and runs the extension tests
npm run package          # builds the .vsix
```

Press `F5` in VS Code to run an Extension Development Host. Releases are published from `v*` tags by GitHub Actions; see [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)
