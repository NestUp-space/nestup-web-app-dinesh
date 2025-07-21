# Decision Template

Use this template when creating new decision log entries in `DECISION_LOG.md`.

## Template

```markdown
### Decision ID: [YYYYMMDD-NNN]
**Timestamp:** [YYYY-MM-DD HH:MM]
**Task:** [Task Description]
**Decision/Action Taken:** [Detailed description of the decision or action taken]
**Rationale:** [Explanation of the reasoning behind the decision]
**Outcome (Anticipated):** [Expected outcome of the decision]
**Affected Files/Areas:** [List of files and areas affected by the decision]
**Next Steps:** [List of next steps to be taken]
```

## Example

```markdown
### Decision ID: 20250624-001
**Timestamp:** 2025-06-24 23:36
**Task:** Improve Cline Workflow Setup
**Decision/Action Taken:** Created automated scripts for INDEX.md updates and decision template standardization
**Rationale:** Manual maintenance of INDEX.md was becoming cumbersome and decision logging lacked consistency
**Outcome (Anticipated):** Improved efficiency in memory management and more consistent decision documentation
**Affected Files/Areas:** 
- `.long_term_memory/INDEX.md`
- `scripts/update_index.sh`
- `scripts/decision_template.md`
**Next Steps:** 
- Integrate scripts into regular workflow
- Create additional automation scripts for other memory management tasks
```

## Usage Instructions

1. Copy the template section above
2. Replace all placeholder values in square brackets with actual information
3. Use sequential numbering for Decision IDs within each day (001, 002, 003, etc.)
4. Add the completed entry to `.long_term_memory/DECISION_LOG.md`
5. Update the INDEX.md if needed using `scripts/update_index.sh`
