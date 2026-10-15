# SQL Vault para VS Code

Busque, insira e salve consultas SQL do seu [SQL Vault](https://github.com/mateusarcedev/sql-vault) self-hosted sem sair do editor.

[English version](README.md)

## Recursos

- **Buscar e inserir**: busca nas suas queries e insere o SQL no cursor (ou num novo documento SQL)
- **Salvar seleção**: salva o SQL selecionado no SQL Vault com nome e tipo de banco
- **Barra lateral**: lista as queries mais recentes (até 50) na view SQL Vault
- **Seguro por padrão**: API key no SecretStorage do VS Code e HTTPS obrigatório para servidores remotos

## Requisitos

| | Versão |
|---|---|
| VS Code | 1.85 ou mais novo |
| SQL Vault | Qualquer versão com API keys. A contagem de uso precisa de `POST /api/queries/:id/usage` ([mateusarcedev/sql-vault#20](https://github.com/mateusarcedev/sql-vault/pull/20)); em servidores antigos tudo funciona, só o contador não aumenta. |

## Instalação

- **VS Code**: procure **SQL Vault** (`mateusarcedev.sqlvault`) na aba Extensões ou rode `code --install-extension mateusarcedev.sqlvault`
- **Cursor, VSCodium e outros editores com Open VSX**: instale `mateusarcedev.sqlvault` pelo [Open VSX](https://open-vsx.org/extension/mateusarcedev/sqlvault) (a partir da 0.2.0)
- **Manual**: baixe o `.vsix` em [Releases](https://github.com/mateusarcedev/sql-vault-extension/releases) e use `Extensions: Install from VSIX...`

## Configuração

1. Se o SQL Vault não estiver em `http://localhost:3000`, defina a URL nas configurações de **usuário**:
   ```json
   { "sqlvault.apiUrl": "https://sqlvault.exemplo.com" }
   ```
2. Rode **SQL Vault: Configure API Key**. A extensão abre `Settings > API Keys` no SQL Vault; crie uma chave e cole no prompt.
3. A conexão é testada antes de a chave ser salva.

Não coloque a API key no `settings.json`: ela fica apenas no SecretStorage.

## Comandos

| Comando | Acesso |
|---|---|
| SQL Vault: Search Query | `Ctrl+Alt+Q` (Windows/Linux), `Cmd+Alt+Q` (macOS), menu de contexto do editor |
| SQL Vault: Save Selected SQL | Menu de contexto com texto selecionado |
| SQL Vault: Configure API Key | Paleta de comandos |
| SQL Vault: Remove API Key | Paleta de comandos |
| Refresh | Barra de título da view SQL Vault |

## Segurança

- **API key**: guardada no SecretStorage do VS Code (chaveiro do sistema), nunca no `settings.json`. Chaves salvas nas configurações pela 0.1.x são movidas automaticamente e removidas das configurações.
- **Transporte**: `sqlvault.apiUrl` precisa usar `https://`; `http://` só é aceito para `localhost`/`127.0.0.1`/`::1`.
- **Workspaces**: `sqlvault.apiUrl` tem escopo de máquina, então o `.vscode/settings.json` de um repositório não consegue redirecionar sua chave para outro servidor.
- Para revogar o acesso numa máquina, rode **SQL Vault: Remove API Key** e apague a chave no SQL Vault.

## Problemas comuns

| Mensagem | Solução |
|---|---|
| `Invalid API key...` | Rode **SQL Vault: Configure API Key** novamente |
| `Cannot connect to SQL Vault at ...` | Confira se o servidor está no ar e o `sqlvault.apiUrl` |
| `Refusing to send the API key to http://...` | Use `https://` para servidores remotos |
| `Request to SQL Vault timed out...` | Verifique rede/VPN; o limite é 5 s |

## Desenvolvimento

Requer Node.js 22.

```bash
npm ci
npm test                 # compila + testes unitários (node:test, sem VS Code)
npm run test:integration # baixa o VS Code e roda os testes da extensão
npm run package          # gera o .vsix
```

`F5` no VS Code abre um Extension Development Host. Releases são publicadas a partir de tags `v*` pelo GitHub Actions; veja o [CHANGELOG.md](CHANGELOG.md).

## Licença

[MIT](LICENSE)
