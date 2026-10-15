# Changelog

All notable changes to this extension are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

## [0.2.0]

### Security
- API key moved to VS Code SecretStorage. A key saved in `settings.json` by 0.1.x is migrated automatically and removed from settings.
- `sqlvault.apiUrl` is now machine-scoped: a workspace `.vscode/settings.json` can no longer redirect requests (and the API key) to another server.
- Plain `http://` is refused for non-loopback hosts; use `https://`.
- Error messages no longer include raw response bodies.

### Changed
- **Breaking:** default shortcut for *Search Query* is now `Ctrl+Alt+Q` / `Cmd+Alt+Q`. The previous `Ctrl/Cmd+Shift+S` overrode *Save As*.
- The extension activates on first use instead of on startup, and no longer shows a "not configured" notification at every launch.
- Usage counting calls `POST /api/queries/:id/usage` instead of `/copy`, which rejected API keys and would duplicate the query.
- The sidebar distinguishes an invalid API key (click to reconfigure) from a server that cannot be reached.

### Added
- *SQL Vault: Remove API Key* command.
- Unit tests, integration tests on VS Code 1.85 and stable, CI and tag-based publishing to the Marketplace and Open VSX.

### Fixed
- Out-of-order search responses could overwrite newer results.
- Query ids are URL-encoded.

## [0.1.2] - 2026-03-21

### Changed
- New extension logo.

## [0.1.1] - 2026-03-21

### Changed
- Publisher set to `mateusarcedev`; MIT license added.

## [0.1.0] - 2026-03-21

### Added
- Search and insert queries, save selected SQL, sidebar with recent queries, API key configuration.

[0.2.0]: https://github.com/mateusarcedev/sql-vault-extension/compare/e1bbd70...v0.2.0
[0.1.2]: https://github.com/mateusarcedev/sql-vault-extension/commit/e1bbd70
[0.1.1]: https://github.com/mateusarcedev/sql-vault-extension/commit/eed97d4
[0.1.0]: https://github.com/mateusarcedev/sql-vault-extension/commit/03bc825
