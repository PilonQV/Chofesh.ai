# GitHub Actions Workflows

This directory contains automated CI/CD workflows for the Chofesh.ai project.

## Overview

The project uses two complementary security workflows:

1. **Security Audit** (`security-audit.yml`) - Scans npm dependencies for vulnerabilities
2. **Central Repo Audit** (`invoke-central-audit.yml`) - Runs CodeQL analysis for code vulnerabilities

Together, these workflows provide comprehensive security coverage for both dependencies and source code.

## Security Audit Workflow

**File:** `security-audit.yml`

### Purpose

Automatically scans dependencies for known security vulnerabilities using `pnpm audit` to ensure the project remains secure.

### Triggers

The security audit runs automatically on:

1. **Pull Requests** - Runs on every PR to `main` or `develop` branches
2. **Push to Main** - Runs on direct commits to `main` branch
3. **Weekly Schedule** - Runs every Monday at 9 AM UTC
4. **Manual Trigger** - Can be triggered manually from GitHub Actions tab

### What It Does

1. **Checks out code** - Gets the latest code from the repository
2. **Sets up Node.js 22** - Installs the required Node.js version
3. **Installs pnpm 10.28.2** - Uses the secure version of pnpm
4. **Caches dependencies** - Speeds up subsequent runs
5. **Installs dependencies** - Runs `pnpm install --frozen-lockfile`
6. **Runs security audit** - Executes `pnpm audit --audit-level=moderate`
7. **Comments on PR** - If vulnerabilities are found, posts a detailed comment on the PR
8. **Uploads reports** - Saves audit reports as artifacts for 30 days

### Audit Levels

The workflow uses `--audit-level=moderate`, which means:

- ✅ **Low severity** - Allowed (won't fail the build)
- ❌ **Moderate severity** - Fails the build
- ❌ **High severity** - Fails the build
- ❌ **Critical severity** - Fails the build

### Viewing Results

#### In Pull Requests

When a PR is created, the workflow will:
- Show a ✅ green check if no vulnerabilities are found
- Show a ❌ red X if vulnerabilities are detected
- Post a comment with detailed vulnerability information

#### In GitHub Actions Tab

1. Go to the **Actions** tab in your repository
2. Click on **Security Audit** workflow
3. View the summary with vulnerability details
4. Download the audit report artifacts

### Status Badge

Add this badge to your README.md to show the security status:

```markdown
[![Security Audit](https://github.com/serever-coder357/Chofesh.ai/actions/workflows/security-audit.yml/badge.svg)](https://github.com/serever-coder357/Chofesh.ai/actions/workflows/security-audit.yml)
```

### Fixing Vulnerabilities

If the audit finds vulnerabilities:

1. **Review the audit output** - Check which packages are affected
2. **Try automatic fix** - Run `pnpm audit fix` locally
3. **Manual update** - Update specific packages: `pnpm update <package-name>`
4. **Add overrides** - If needed, add version overrides in `package.json`:

```json
{
  "pnpm": {
    "overrides": {
      "vulnerable-package": ">=safe-version"
    }
  }
}
```

5. **Test locally** - Run `pnpm audit` to verify fixes
6. **Commit and push** - The workflow will re-run automatically

### Troubleshooting

**Workflow fails with "frozen-lockfile" error:**
- Run `pnpm install` locally and commit the updated `pnpm-lock.yaml`

**False positives:**
- Review the vulnerability details
- If it's a dev dependency with no production impact, consider accepting the risk
- Document the decision in a comment

**Workflow doesn't trigger:**
- Check that the workflow file is in `.github/workflows/`
- Verify GitHub Actions is enabled in repository settings
- Check branch protection rules

### Best Practices

1. **Don't ignore vulnerabilities** - Fix them promptly
2. **Keep dependencies updated** - Run `pnpm update` regularly
3. **Review audit reports** - Check the weekly scheduled runs
4. **Monitor Dependabot alerts** - Enable Dependabot for automatic PRs
5. **Test after updates** - Always run tests after updating dependencies

### Related Resources

- [pnpm audit documentation](https://pnpm.io/cli/audit)
- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [npm security advisories](https://github.com/advisories)
- [Dependabot documentation](https://docs.github.com/en/code-security/dependabot)
