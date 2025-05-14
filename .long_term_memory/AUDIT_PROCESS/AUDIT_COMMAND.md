# Audit Command Documentation

## Overview

The `audit-codebase` command automates the code audit process following our established checklist and templates. It generates standardized reports and maintains a historical record of all audits.

## Commands

### Full Audit

```bash
audit-codebase full [options]
```

Performs a comprehensive code audit including:

- Documentation review
- Code quality analysis
- Security review
- Architecture review
- Performance review

**Options:**

- `--depth=<level>` (default: full)
  - `shallow`: Quick overview
  - `full`: Complete analysis
  - `deep`: Include historical comparison
- `--output=<format>` (default: md)
  - `md`: Markdown reports
  - `html`: HTML reports
  - `json`: JSON format

### Quick Health Check

```bash
audit-codebase quick [options]
```

Performs a rapid health check focusing on:

- Critical security issues
- Major architectural violations
- Performance bottlenecks
- Documentation consistency

**Options:**

- `--focus=<area>`: Specific area to check
  - `security`
  - `performance`
  - `architecture`
  - `documentation`

### Verify Specific Area

```bash
audit-codebase verify --area=<area> [options]
```

Performs targeted verification of specific codebase areas:

- Frontend components
- Backend services
- Security measures
- Documentation

**Options:**

- `--area`: Required, area to verify
  - `frontend`
  - `backend`
  - `security`
  - `docs`
- `--components=<list>`: Comma-separated list of specific components

### Compare Audits

```bash
audit-codebase compare --with=<date> [options]
```

Compares current state with previous audit results:

- Changes in metrics
- New issues
- Resolved issues
- Trending problems

**Options:**

- `--with`: Required, date of previous audit (YYYY-MM-DD)
- `--metrics`: Comma-separated list of metrics to compare
- `--format`: Output format (table, json, md)

## Configuration

### Default Settings

Create `.auditrc` in project root:

```json
{
  "excludePaths": ["node_modules", "dist", "build"],
  "customRules": "path/to/rules.json",
  "reportPath": ".long_term_memory/AUDIT_PROCESS/AUDIT_HISTORY",
  "templatePath": ".long_term_memory/AUDIT_PROCESS/AUDIT_TEMPLATES",
  "thresholds": {
    "componentSize": 300,
    "complexity": 15,
    "coverage": 80
  }
}
```

### Custom Rules

Define custom rules in `rules.json`:

```json
{
  "security": {
    "bannedFunctions": ["eval", "new Function"],
    "requiredValidations": ["input", "authentication"]
  },
  "architecture": {
    "maxDependencies": 5,
    "requiredPatterns": ["repository", "service"]
  }
}
```

## Output Structure

```
AUDIT_HISTORY/
└── YYYY-MM-DD/
    ├── audit_log.md
    ├── critical_issues.md
    ├── action_plan.md
    ├── metrics/
    │   ├── security.json
    │   ├── performance.json
    │   └── quality.json
    └── reports/
        ├── frontend.md
        ├── backend.md
        └── security.md
```

## Integration

### CI/CD Integration

```yaml
# .github/workflows/audit.yml
name: Code Audit
on:
  schedule:
    - cron: '0 0 1 * *'  # Monthly audit
  workflow_dispatch:      # Manual trigger

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Audit
        run: audit-codebase full --ci
      - name: Upload Results
        uses: actions/upload-artifact@v2
        with:
          path: .long_term_memory/AUDIT_PROCESS/AUDIT_HISTORY
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run quick audit on changed files
audit-codebase quick --changed-only
```

## Examples

### Monthly Security Audit

```bash
audit-codebase full --focus=security --depth=deep
```

### Component-specific Check

```bash
audit-codebase verify --area=frontend --components=ModelBuilderForm,PlankLogicEditor
```

### Performance Trend Analysis

```bash
audit-codebase compare --with=2025-04-14 --metrics=performance,memory
```

## Troubleshooting

### Common Issues

1. **Missing Templates**

   ```bash
   audit-codebase repair --templates
   ```

2. **Incomplete Previous Audit**

   ```bash
   audit-codebase recover --date=YYYY-MM-DD
   ```

3. **Configuration Issues**

   ```bash
   audit-codebase verify-config
   ```

### Debug Mode

```bash
audit-codebase full --debug
```

Provides detailed logging and step-by-step execution information.

## Best Practices

1. Run full audits monthly
2. Use quick checks before major deployments
3. Include audit results in sprint retrospectives
4. Track metrics over time for trend analysis
5. Address critical issues within one sprint
6. Document all custom rules and thresholds
