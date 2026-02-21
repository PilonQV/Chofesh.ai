# Contributing to Chofesh.ai

Thank you for considering contributing to Chofesh.ai! We welcome contributions from the community.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Testing](#testing)

---

## 📜 Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior by opening a GitHub issue.

---

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, Node.js version, browser)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case and motivation**
- **Possible implementation approach**
- **Alternative solutions considered**

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Update documentation
7. Submit a pull request

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 22+
- pnpm 9+
- PostgreSQL 14+
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Chofesh.ai.git
cd Chofesh.ai

# Add upstream remote
git remote add upstream https://github.com/PilonQV/Chofesh.ai.git

# Install dependencies
pnpm install

# Set up environment variables
# Copy .env.example and fill in your values
cp .env.example .env

# Set up database
pnpm db:push

# Start development server
pnpm dev
```

### Development Workflow

```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add amazing feature"

# Keep your branch up to date
git fetch upstream
git rebase upstream/main

# Push to your fork
git push origin feature/my-feature
```

---

## 🔄 Pull Request Process

1. **Update Documentation** - Update README.md, comments, and inline documentation
2. **Add Tests** - Ensure new features have test coverage
3. **Run Tests** - All tests must pass (`pnpm test`)
4. **Type Check** - No TypeScript errors (`pnpm type-check`)
5. **Lint Code** - Follow coding standards (`pnpm lint`)
6. **Update Changelog** - Add entry to CHANGELOG.md (if applicable)
7. **Request Review** - Tag maintainers for review

### PR Title Format

Use conventional commits format:

```
feat: add new AI provider integration
fix: resolve memory leak in chat component
docs: update installation instructions
refactor: simplify complexity scoring logic
test: add unit tests for rate limiter
```

---

## 💻 Coding Standards

### TypeScript

- Use strict mode
- Avoid `any` type
- Prefer interfaces over types for object shapes
- Use meaningful variable names

```typescript
// Good
interface UserProfile {
  id: number;
  name: string;
  email: string;
}

// Avoid
type User = any;
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript for props

```typescript
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Constants: `UPPER_SNAKE_CASE.ts`
- Tests: `*.test.ts` or `*.spec.ts`

---

## 📝 Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(chat): add markdown table rendering

- Implement ReactMarkdown with remarkGfm
- Add custom table component with horizontal scrolling
- Update AskDiaLinks component

Closes #123
```

```
fix(api): resolve Kimi API 401 errors

- Add retry logic with exponential backoff
- Fix API endpoint URL (.ai instead of .cn)
- Update rate limiting configuration

Fixes #456
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test path/to/test.test.ts
```

### Writing Tests

Use Vitest for unit and integration tests:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateComplexityScore } from './complexityScoring';

describe('complexityScoring', () => {
  it('should score simple queries low', () => {
    const score = calculateComplexityScore('Hello');
    expect(score).toBeLessThan(50);
  });

  it('should score complex queries high', () => {
    const score = calculateComplexityScore(
      'Analyze this dataset and create visualizations with statistical analysis'
    );
    expect(score).toBeGreaterThan(70);
  });
});
```

### Test Coverage

- Aim for >80% code coverage
- Test edge cases and error handling
- Mock external API calls

---

## 🎨 Code Style

### ESLint

We use ESLint with TypeScript support:

```bash
# Run linter
pnpm lint

# Fix auto-fixable issues
pnpm lint --fix
```

### Prettier

Code is automatically formatted with Prettier:

```bash
# Format all files
pnpm format

# Check formatting
pnpm format:check
```

---

## 📚 Documentation

### Code Comments

- Use JSDoc for functions and classes
- Explain "why" not "what"
- Keep comments up to date

```typescript
/**
 * Calculates query complexity score (0-100) to determine routing strategy.
 * 
 * Scores >80 trigger paid API usage (Kimi), <=80 use free APIs (Groq/Cerebras).
 * 
 * @param query - User's input query
 * @returns Complexity score between 0 and 100
 */
export function calculateComplexityScore(query: string): number {
  // Implementation...
}
```

### README Updates

Update README.md when adding:
- New features
- Configuration options
- API changes
- Breaking changes

---

## 🐛 Debugging

### Development Tools

- **React DevTools** - Component inspection
- **Redux DevTools** - State debugging (if using Redux)
- **VS Code Debugger** - Breakpoint debugging
- **Console Logging** - Strategic `console.log` statements

### Common Issues

**Database Connection Errors:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify DATABASE_URL in .env
```

**TypeScript Errors:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
pnpm install
pnpm build
```

---

## 🚀 Release Process

Maintainers handle releases:

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag
4. Push to GitHub
5. Create GitHub release
6. Deploy to production

---

## 📞 Getting Help

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and community support
- **Pull Request Comments** - Code review feedback

---

## 🙏 Thank You!

Your contributions make Chofesh.ai better for everyone. We appreciate your time and effort!

---

<div align="center">

**Happy Contributing! 🎉**

[Back to README](./README.md)

</div>
