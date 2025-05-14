# Nestup Audit Command Reference

**Version:** 1.0.0

## Basic Commands

### 1. Full Audit

```bash
# Complete codebase audit
audit-codebase full

# With depth options
audit-codebase full --depth=shallow
audit-codebase full --depth=full
audit-codebase full --depth=deep

# With output format
audit-codebase full --output=md|html|json

# With specific focus
audit-codebase full --focus=security
```

### 2. Quick Health Check

```bash
# Basic quick check
audit-codebase quick

# Focus on specific area
audit-codebase quick --focus=security
audit-codebase quick --focus=performance
audit-codebase quick --focus=architecture

# Check only changed files
audit-codebase quick --changed-only
```

### 3. Verification Commands

```bash
# Verify frontend
audit-codebase verify --area=frontend
audit-codebase verify --area=frontend --components=ModelBuilderForm,PlankLogicEditor

# Verify backend
audit-codebase verify --area=backend
audit-codebase verify --area=backend --services=auth,material

# Verify documentation
audit-codebase verify --area=docs
audit-codebase verify --area=docs --type=mbk

# Verify security
audit-codebase verify --area=security
audit-codebase verify --area=security --severity=high
```

### 4. Comparison Commands

```bash
# Compare with previous audit
audit-codebase compare --with=YYYY-MM-DD

# Compare specific metrics
audit-codebase compare --with=YYYY-MM-DD --metrics=performance,security

# Compare with formatted output
audit-codebase compare --with=YYYY-MM-DD --format=table|json|md
```

## Maintenance Commands

### 1. Template Management

```bash
# Repair missing templates
audit-codebase repair --templates

# Update templates
audit-codebase repair --templates --update

# Verify templates
audit-codebase repair --templates --verify
```

### 2. Configuration

```bash
# Verify configuration
audit-codebase verify-config

# Initialize configuration
audit-codebase init-config

# Update configuration
audit-codebase update-config
```

### 3. Recovery Commands

```bash
# Recover incomplete audit
audit-codebase recover --date=YYYY-MM-DD

# Force complete audit
audit-codebase recover --date=YYYY-MM-DD --force

# Clean up incomplete audits
audit-codebase recover --cleanup
```

## Integration Commands

### 1. CI/CD Integration

```bash
# Run in CI mode
audit-codebase full --ci

# Generate CI artifacts
audit-codebase full --ci --artifacts=reports,metrics

# With GitHub integration
audit-codebase full --ci --github-output
```

### 2. Pre-commit Checks

```bash
# Quick pre-commit check
audit-codebase quick --changed-only --fail-fast

# Security-focused pre-commit
audit-codebase verify --area=security --changed-only
```

## Helper Commands

### 1. Debug Mode

```bash
# Enable debug logging
audit-codebase full --debug

# Verbose output
audit-codebase full --verbose

# Trace mode
audit-codebase full --trace
```

### 2. Logging Options

```bash
# Set log level
audit-codebase full --log-level=info|warn|error|debug

# Output logs to file
audit-codebase full --log-file=audit.log

# JSON logging
audit-codebase full --log-format=json
```

## Common Options

### Global Flags

```bash
--config        Specify config file path
--output        Output format (md|html|json)
--silent        Suppress all output
--no-color     Disable colored output
--temp-dir     Custom temporary directory
```

### Filter Options

```bash
--exclude       Paths to exclude
--include       Paths to include
--pattern       File pattern to match
--ignore-path   Additional ignore file
```

### Output Options

```bash
--format        Output format
--reporters     Enabled reporters
--summary-only  Show only summary
--full-report   Show detailed report
```

## Environment Variables

```bash
# Configuration
AUDIT_CONFIG_PATH=/path/to/config
AUDIT_RULES_PATH=/path/to/rules

# Notifications
AUDIT_NOTIFY_SLACK=true
AUDIT_NOTIFY_EMAIL=true

# Integration
AUDIT_GITHUB_TOKEN=xxx
AUDIT_JIRA_TOKEN=xxx

# Debug
AUDIT_DEBUG=true
AUDIT_LOG_LEVEL=debug
```

## Examples

### 1. Monthly Security Audit

```bash
audit-codebase full \
  --focus=security \
  --depth=deep \
  --output=html \
  --notify=slack,email
```

### 2. Pre-release Check

```bash
audit-codebase verify \
  --area=frontend,backend \
  --critical-only \
  --fail-fast
```

### 3. Documentation Update Check

```bash
audit-codebase verify \
  --area=docs \
  --type=mbk \
  --update-required
```

### 4. Performance Analysis

```bash
audit-codebase compare \
  --with=2025-04-14 \
  --metrics=performance \
  --format=table
```

## Best Practices

1. **Regular Audits**

   ```bash
   # Monthly full audit
   0 0 1 * * audit-codebase full --depth=deep

   # Weekly quick check
   0 0 * * 0 audit-codebase quick
   ```

2. **Pre-commit Checks**

   ```bash
   # In .git/hooks/pre-commit
   audit-codebase quick --changed-only --fail-fast
   ```

3. **CI Integration**

   ```bash
   # In GitHub Actions
   audit-codebase verify --ci --github-output
   ```

## Error Codes

- `1`: General error
- `2`: Configuration error
- `3`: Validation error
- `4`: Critical security issue
- `5`: Performance threshold exceeded
