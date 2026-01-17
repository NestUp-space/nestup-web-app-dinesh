# Cline Workflow Automation Scripts

This directory contains automation scripts designed to improve the Cline workflow setup and memory management system.

## Overview

The Cline setup includes a two-tier memory system with cache memory (`.cache_memory/`) for active session data and long-term memory (`.long_term_memory/`) for persistent project knowledge. These scripts automate various aspects of memory management and workflow integration.

## Available Scripts

### 1. `update_index.sh` ✅ Working
**Purpose:** Automatically updates `INDEX.md` whenever new files are added to the Long-Term Memory (LTM).

**Usage:**
```bash
./scripts/update_index.sh
```

**Features:**
- Scans `.long_term_memory/` directory for new markdown files
- Automatically adds missing files to `INDEX.md`
- Prevents duplicate entries
- Provides feedback on files added

**Example Output:**
```
Updating INDEX.md with new files...
New file found: PRODUCTION_CORS_FIX_GUIDE.md
Added PRODUCTION_CORS_FIX_GUIDE.md to INDEX.md
INDEX.md update completed.
```

### 2. `create_ticket.sh` ✅ Working
**Purpose:** Automatically creates corresponding tickets in the `.work_tickets/` directory when new tasks are started.

**Usage:**
```bash
./scripts/create_ticket.sh
```

**Features:**
- Extracts tasks from `CURRENT_TODO.md`
- Creates structured tickets with metadata
- Organizes tickets by date
- Prevents duplicate ticket creation
- Includes timestamps and status tracking

**Generated Ticket Format:**
```markdown
### Ticket: Task_Name_Sanitized
**Task Name:** Original Task Description
**Created:** 2025-06-24 23:37:06
**Status:** pending
**Assigned to:** cline
**Assigned by:** user
**Description:** Auto-generated ticket for task: [description]

**Updates:**
- 2025-06-24 23:37:06: Ticket created automatically
```

### 3. `summarize_context.sh` ⚠️ In Development
**Purpose:** Summarizes completed tasks in `CURRENT_CONTEXT.md` and archives them to `CONTEXT_SNAPSHOTS/`.

**Status:** Currently experiencing compatibility issues with macOS command-line tools. The script framework is in place but needs refinement for reliable operation.

**Planned Features:**
- Extract completed task content from `CURRENT_CONTEXT.md`
- Create archived snapshots in `CONTEXT_SNAPSHOTS/`
- Replace detailed content with summary links
- Maintain context history for future reference

### 4. `backend/src/scripts/createAdminUser.ts` ✅ Working
**Purpose:** Creates a new admin user with full permissions in the database.

**Usage:**
```bash
# From backend directory using npm script
cd backend && npm run create:admin -- --email admin@example.com --name "Admin User" --password "SecurePass123!" --phone "9876543210"

# Or directly with ts-node
cd backend && npx ts-node src/scripts/createAdminUser.ts \
  --email admin@example.com \
  --name "Admin User" \
  --password "SecurePass123!" \
  --phone "9876543210"
```

**Options:**
| Flag | Short | Description | Required |
|------|-------|-------------|----------|
| `--email` | `-e` | Email address for the admin user | Yes |
| `--name` | `-n` | Display name for the admin user | Yes |
| `--password` | `-p` | Password (min 8 chars, uppercase, lowercase, number) | Yes |
| `--phone` | `-t` | Phone number (10-15 digits) | Yes |
| `--help` | `-h` | Show help message | No |

**Features:**
- Input validation for email, password strength, and phone format
- Checks for existing users with same email/phone
- Automatically finds and assigns admin role
- Password is securely hashed with bcrypt
- User is created as verified and active
- Detailed success/error output

**Example Output:**
```
🔐 Create Admin User Script

==================================================

📋 Validating inputs...
  ✓ Email: admin@example.com
  ✓ Password: [validated]
  ✓ Phone: 9876543210
  ✓ Name: Admin User

🔍 Checking for existing users...
  ✓ Email is available
  ✓ Phone number is available

🔎 Finding admin role...
  ✓ Found admin role: "admin" (ID: 1)

🔒 Hashing password...
  ✓ Password hashed

👤 Creating admin user...
  ✓ User created successfully!

==================================================
✅ Admin User Created Successfully!

User Details:
  ID:      5
  Name:    Admin User
  Email:   admin@example.com
  Phone:   9876543210
  Role:    admin (admin)
  Active:  true
  Verified: true
  Created: 2026-01-17T10:30:00.000Z

==================================================
```

### 5. `decision_template.md` ✅ Available
**Purpose:** Provides a standardized template for recording decisions in `DECISION_LOG.md`.

**Usage:**
1. Copy the template from the file
2. Fill in all placeholder values
3. Add to `DECISION_LOG.md`

**Template Structure:**
```markdown
### Decision ID: [YYYYMMDD-NNN]
**Timestamp:** [YYYY-MM-DD HH:MM]
**Task:** [Task Description]
**Decision/Action Taken:** [Detailed description]
**Rationale:** [Reasoning behind the decision]
**Outcome (Anticipated):** [Expected outcome]
**Affected Files/Areas:** [List of affected areas]
**Next Steps:** [List of next steps]
```

## Installation and Setup

1. **Make scripts executable:**
```bash
chmod +x scripts/*.sh
```

2. **Verify directory structure:**
Ensure the following directories exist:
- `.cache_memory/`
- `.long_term_memory/`
- `.work_tickets/`

3. **Test scripts:**
```bash
# Test INDEX.md updates
./scripts/update_index.sh

# Test ticket creation
./scripts/create_ticket.sh
```

## Integration with Cline Workflow

### Recommended Usage Patterns

1. **Session Start:**
   - Run `./scripts/create_ticket.sh` to create tickets for any new tasks
   - Check `INDEX.md` for recent additions

2. **During Development:**
   - Use `decision_template.md` for consistent decision logging
   - Run `./scripts/update_index.sh` after adding new LTM files

3. **Session End:**
   - Update ticket statuses manually
   - Run context summarization (when available)
   - Archive completed work

### Automation Opportunities

Future enhancements could include:
- Git hooks to automatically run scripts on commits
- Scheduled runs via cron jobs
- Integration with IDE workflows
- Automated status updates based on file changes

## Troubleshooting

### Common Issues

1. **Permission Denied:**
```bash
chmod +x scripts/[script-name].sh
```

2. **File Not Found Errors:**
Ensure you're running scripts from the project root directory.

3. **macOS Compatibility:**
Some scripts may need adjustments for different versions of macOS command-line tools.

### Script-Specific Issues

- **`summarize_context.sh`:** Currently has parsing issues with complex task names containing special characters
- **`update_index.sh`:** May create simple entries that need manual organization
- **`create_ticket.sh`:** Ticket IDs are truncated to 50 characters for readability

## Future Enhancements

### Phase 2 Planned Features
- MBK synchronization script
- Automated linting and formatting integration
- Dependency management automation
- Enhanced context summarization

### Phase 3 Planned Features
- Automated testing integration
- Guardrails enforcement checks
- Advanced analytics and reporting
- Cross-platform compatibility improvements

## Contributing

When adding new scripts:
1. Follow the existing naming convention
2. Include comprehensive error handling
3. Add documentation to this README
4. Test on macOS environment
5. Update the decision log with rationale

## Version History

- **v1.0** (2025-06-24): Initial implementation with INDEX updates and ticket creation
- **v0.9** (2025-06-24): Context summarization framework (in development)

---

For questions or issues, refer to the Cline documentation in `.long_term_memory/GUARDRAILS.md` or create a new ticket using the automated system.
