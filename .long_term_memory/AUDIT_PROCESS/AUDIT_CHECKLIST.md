# Code Audit Process Checklist

## Pre-Audit Tasks

1. [ ] Create new audit directory: `.long_term_memory/AUDIT_PROCESS/AUDIT_HISTORY/YYYY-MM-DD/`
2. [ ] Copy current audit templates to new directory
3. [ ] Load previous audit results for comparison
4. [ ] Verify access to all required code files and documentation

## Core Audit Steps

### 1. Documentation Review

- [ ] Review .mbk files for accuracy
- [ ] Check test documentation
- [ ] Verify API documentation
- [ ] Review component documentation

### 2. Code Quality Analysis

- [ ] Frontend Components
  - [ ] Check component size and responsibilities
  - [ ] Verify state management patterns
  - [ ] Review type safety
  - [ ] Check error handling

- [ ] Backend Services
  - [ ] Review service layer architecture
  - [ ] Check repository pattern implementation
  - [ ] Verify dependency injection
  - [ ] Review error handling

### 3. Security Review

- [ ] Check for unsafe code execution
- [ ] Review input validation
- [ ] Verify authentication/authorization
- [ ] Check for exposed sensitive data

### 4. Architecture Review

- [ ] Verify SOLID principles compliance
- [ ] Check for code duplication
- [ ] Review component coupling
- [ ] Verify clean architecture implementation

### 5. Performance Review

- [ ] Check for performance bottlenecks
- [ ] Review state management efficiency
- [ ] Check database query optimization
- [ ] Verify caching implementation

## Post-Audit Tasks

1. [ ] Generate audit_log.md with findings
2. [ ] Create critical_issues_summary.md
3. [ ] Update action_plan.md with recommendations
4. [ ] Archive audit results
5. [ ] Create work tickets for critical issues

## Follow-up

1. [ ] Schedule review of critical issues
2. [ ] Set timeline for next periodic audit
3. [ ] Update audit metrics and trends
4. [ ] Document lessons learned

## Command Reference

```bash
# Full audit with all checks
audit-codebase full

# Quick health check
audit-codebase quick

# Verify specific area
audit-codebase verify --area=frontend|backend|security

# Compare with previous audit
audit-codebase compare --with=YYYY-MM-DD
