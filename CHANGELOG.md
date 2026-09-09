# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project documentation set: `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, and `docs/`
  covering architecture, configuration, deployment, database, testing, branding, and known
  issues.
- Jest test suite — unit tests for `src/utils`, API-area tests under `tests/unit/api/`, and
  repo-wide contract tests that assert every route exports valid, unique `metadata` and
  references only permissions that exist in the seeder.
- GitHub Actions CI: lint, typecheck, tests on Node 20 and 22, build, and a Docker image
  build on `main`.
- Issue and pull request templates, `CODEOWNERS`, and grouped Dependabot configuration.
- Devcontainer with Node 22, pnpm, MySQL 8 (schema pre-loaded), and Redis.
- `Dockerfile` and `docker-compose.yml` for self-hosting.

### Changed

- Database schema moved to `db/initial.sql`, and explicitly re-included in `.gitignore`,
  which previously excluded it via a blanket `*.sql` rule — a fresh clone had no schema.
- Design tokens reworked: near-black neutral ramp, blue primary ramp, and semantic
  trading colors for long/short.
- Landing components now use `primary-*` token classes instead of hardcoded hex.

### Fixed

- Punjabi locale bundles (`public/locale{s}/pa/common.json`) were missing a closing brace
  and failed to parse.

### Known issues

Seven permissions are referenced by routes but never seeded, 88 `operationId` values are
duplicated, and three routes lack a default export. These are pre-existing, baselined in the
contract tests so they cannot get worse, and tracked in
[`docs/KNOWN-ISSUES.md`](docs/KNOWN-ISSUES.md).

---

## [4.6.6]

Baseline release.
