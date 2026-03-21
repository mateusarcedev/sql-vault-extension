# SQL Vault Extension (VS Code)

Extensão do VS Code para buscar e salvar consultas SQL diretamente no [SQL Vault](https://github.com/mateusarcedev/sql-vault).

Este repositório é **separado** do projeto principal e cobre apenas a integração com o editor.

## Visão geral

A extensão oferece um fluxo simples para uso diário:

- Buscar queries salvas no SQL Vault e inserir no editor
- Salvar SQL selecionado do editor no SQL Vault
- Navegar por uma árvore lateral com queries recentes
- Configurar autenticação por API Key (headless)

## Relação com o projeto principal

- Projeto principal (web + API): [mateusarcedev/sql-vault](https://github.com/mateusarcedev/sql-vault)
- Esta extensão usa autenticação via `Authorization: Bearer {token}`
- O token é gerado no SQL Vault em `Settings > API Keys`

## Requisitos

- VS Code `^1.85.0`
- Instância do SQL Vault rodando (padrão: `http://localhost:3000`)
- API Key válida gerada no SQL Vault
- Node.js + npm (apenas para desenvolvimento/empacotamento)

## Configuração

No `settings.json` do VS Code:

```json
{
  "sqlvault.apiUrl": "http://localhost:3000",
  "sqlvault.apiKey": ""
}
```

### Primeira conexão

1. Execute `SQL Vault: Configure API Key`
2. A extensão abre `{apiUrl}/settings#api-keys` no navegador
3. Cole o token no prompt do VS Code
4. A extensão testa conexão e salva o token globalmente

## Comandos

| Comando | ID | Como usar |
| --- | --- | --- |
| SQL Vault: Search Query | `sqlvault.searchQuery` | Paleta de comandos, menu de contexto ou atalho |
| SQL Vault: Save Selected SQL | `sqlvault.saveQuery` | Menu de contexto com texto selecionado |
| SQL Vault: Configure API Key | `sqlvault.configure` | Paleta de comandos |
| Refresh | `sqlvault.refreshTree` | Botão de refresh na view de Queries |

### Atalho

- Buscar query: `Cmd+Shift+S` (macOS) / `Ctrl+Shift+S` (Windows/Linux)

## Fluxos principais

### 1) Buscar query

- Abre QuickPick com busca reativa
- Consulta `GET /api/queries?search={term}`
- Insere SQL no editor ativo (ou abre novo documento SQL)
- Incrementa `copyCount` via `POST /api/queries/{id}/copy`

### 2) Salvar SQL selecionado

- Lê seleção atual do editor
- Solicita nome da query
- Solicita tipo de banco (`postgresql`, `mysql`, `sqlite`, `sqlserver`, `oracle`, `other`)
- Envia para `POST /api/queries` com `status: "active"`
- Atualiza a árvore lateral após sucesso

### 3) Tree View (Queries)

- Exibe view `SQL Vault > Queries` na barra lateral
- Carrega queries da API e mostra até 50 itens
- Clique em um item para inserir o SQL no editor

## Endpoints consumidos

- `GET /api/queries`
- `POST /api/queries`
- `GET /api/tags` (teste de conexão)
- `POST /api/queries/{id}/copy`

## Desenvolvimento local

```bash
npm install
npm run compile
```

Para desenvolvimento contínuo:

```bash
npm run watch
```

Para gerar pacote `.vsix`:

```bash
npm run package
```

## Estrutura do projeto

```text
src/
  api.ts                 # cliente HTTP e tipos
  auth.ts                # leitura/configuração de apiUrl e apiKey
  extension.ts           # ativação e registro de comandos/providers
  commands/
    configure.ts         # comando de configuração
    saveQuery.ts         # salvar SQL selecionado
    searchQuery.ts       # buscar e inserir query
  providers/
    queryTreeProvider.ts # árvore lateral de queries
```

## Troubleshooting

- `Invalid API Key...`: execute `SQL Vault: Configure API Key` novamente
- `Cannot connect to SQL Vault...`: confirme servidor rodando e `sqlvault.apiUrl`
- `Request timed out after 5000ms`: verifique conectividade/rede
- Árvore vazia: confirme se existem queries e clique em `Refresh`

## Limitações atuais

- Tree View limitada aos 50 primeiros resultados
- Sem suporte offline/cache local
- Sem gerenciamento de tags na interface da extensão

## Licença

Use a mesma política de licenciamento definida pelo projeto principal SQL Vault.