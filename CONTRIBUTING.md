# Contributing to Object Builder

Thank you for your interest in contributing to Object Builder! This guide will help you get started.

## Reporting Bugs

Before opening an issue, please check if a similar issue already exists.

When reporting a bug, include:

- **Steps to reproduce** &mdash; What you did to trigger the bug
- **Expected behavior** &mdash; What you expected to happen
- **Actual behavior** &mdash; What actually happened
- **Environment** &mdash; OS, app version, client version being edited
- **Log file** &mdash; Attach the log file from `Help > Open Log File` or the Log panel
- **Screenshots** &mdash; If the bug is visual, include a screenshot

## Suggesting Features

Open an issue with the `enhancement` label. Describe:

- **The problem** you're trying to solve
- **Your proposed solution**
- **Alternatives** you've considered

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm 9+
- [Git](https://git-scm.com/)

### Getting Started

```bash
# Fork and clone the repository
git clone https://github.com/<your-username>/object-builder.git
cd object-builder/electron

# Install dependencies
npm install

# Start development mode
npm run dev
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for architecture details and conventions.

## Code Style

### TypeScript

- **Strict mode** is enabled. Avoid `any` unless absolutely necessary.
- Use functional style: pure functions with module-level state instead of classes.
- Export types and interfaces alongside their implementation.

### Formatting

The project uses Prettier with the following settings:

- No semicolons
- Single quotes
- No trailing commas
- 100 character line width

```bash
# Format code
npm run format

# Check formatting
npm run format:check
```

### Linting

ESLint is configured with TypeScript and React Hooks rules.

```bash
npm run lint
npm run lint:fix
```

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Files | kebab-case | `sprite-panel.tsx`, `dat-reader.ts` |
| Components | PascalCase | `SpritePanel`, `ThingListPanel` |
| Functions | camelCase | `readDat()`, `buildSpriteSheet()` |
| Constants | UPPER_SNAKE_CASE | `SPRITE_DEFAULT_SIZE`, `MENU_FILE_NEW` |
| Types/Interfaces | PascalCase | `ThingType`, `ClientFeatures` |
| IPC channels | domain:action | `file:readBinary`, `project:load` |

### Component Conventions

- Every `.tsx` file **must** have `import React from 'react'` at the top (see [DEVELOPMENT.md](DEVELOPMENT.md) for why)
- Use `useTranslation()` for all user-visible strings &mdash; no hardcoded text
- Use semantic color tokens (`bg-bg-primary`, `text-text-secondary`) &mdash; no hardcoded hex in styles
- Colocate tests in `__tests__/` directories next to source files

## Commit Messages

Write clear, concise commit messages:

```
feat: add sprite batch export dialog
fix: correct OTB escape character handling for 0xFD bytes
refactor: extract sprite composition into separate module
test: add round-trip tests for OBD v3 format
docs: update DEVELOPMENT.md with worker architecture
```

Use conventional prefixes:
- `feat:` for new features
- `fix:` for bug fixes
- `refactor:` for code changes that don't add features or fix bugs
- `test:` for test additions or changes
- `docs:` for documentation changes
- `chore:` for build, CI, or dependency changes

## Pull Requests

### Before Submitting

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Write tests** for new functionality:
   ```bash
   npm run test
   ```

3. **Ensure all checks pass:**
   ```bash
   npm run typecheck
   npm run lint
   npm run format:check
   npm run test
   ```

4. **Keep commits focused** &mdash; one logical change per commit.

### PR Description

Include:
- **Summary** of what the PR does
- **Test plan** describing how the changes were verified
- **Screenshots** for UI changes

### Review Process

- PRs require at least one review before merging
- CI must pass (typecheck, lint, tests)
- Keep PRs small and focused when possible

## Testing Requirements

### For Bug Fixes

- Add a test that reproduces the bug (should fail before the fix)
- Verify the test passes after the fix

### For New Features

- Add unit tests for new functions and services
- Add component tests for new UI components
- Add E2E tests for new user-facing flows (when applicable)

### Running Tests

```bash
# Unit and component tests
npm run test

# E2E tests (requires build)
npm run test:e2e:build
```

## Translations

When adding or modifying user-visible text:

1. Add the translation key to all 3 locale files:
   - `src/renderer/src/i18n/locales/en_US.json` (required)
   - `src/renderer/src/i18n/locales/es_ES.json` (required)
   - `src/renderer/src/i18n/locales/pt_BR.json` (required)

2. Use the `t()` function from `useTranslation()` to reference the key.

If you're not confident in a translation, add the English text and mark it with a comment in the PR &mdash; someone else can improve it.

## Questions?

If you're unsure about anything, open a discussion or ask in the PR. We're happy to help!
