# Cline Guardrails and Operational Standards

## 🔒 Global Rules
- Command Chaining: Use ; instead of && for chaining PowerShell commands.
- Project Structure: Do not alter the project structure unless absolutely necessary. Always request explicit approval before creating new folders.
- Test Cases: Do not delete or alter existing test cases that are currently passing.
- Code Comments: Be verbose in explaining complex logic through inline and block comments.
- Logging: Add DEBUG/LOGGER lines wherever beneficial.
- Session Continuity: Always check ./backlog.tkt and relevant LTM/Cache memory files to continue pending work from the previous session.
- Git Discipline:
  - Commit messages must follow feat:, fix:, docs:, refactor: etc.
  - Use .editorconfig and .prettierrc for consistent formatting.

## 🧭 Workspace Rules
- Architecture & Code Principles:
  - Follow Clean Architecture (presentation, domain, application, infrastructure).
  - Apply SOLID principles.
  - Use a modular folder structure: controllers/, services/, models/, routes/, middlewares/, utils/, db/
- Frontend (React + TypeScript):
  - Use functional components, hooks, react-query or axios, Tailwind/MUI.
  - Structure: components/, pages/, hooks/, services/, types/, utils/
- Backend (Node.js/Express/NestJS + TypeScript):
  - Use Prisma/TypeORM with PostgreSQL.
  - Route → Controller → Service → Repository architecture.
  - Apply centralized validation (e.g., Zod, Joi).
  - Enable JWT auth, RBAC, and middlewares like Helmet, CORS.

## 🔍 PLAN MODE Guidelines
- Ask clarifying questions before coding.
- Lay out a detailed plan, including:
  - Prerequisites or dependencies
  - Flow diagram / architecture diagram (if applicable, use Mermaid syntax)
  - Affected files/components
  - Testing strategy (single testing plan file per task)
- Consult LTM (PROJECT_CONTEXT_AND_ROADMAP.md, DECISION_LOG.md, GUARDRAILS.md) and Cache (CURRENT_CONTEXT.md, CURRENT_DECISIONS.md) when formulating plans.

## 🚀 ACT MODE Guidelines
- After PLAN is approved, initiate ACT mode:
  - Create a .work_tickets/likely.tickets.for.<YYYY-MM-DD> file.
  - Split the plan into discrete tickets.
  - If ticket already exists, update under the Updates: section.
- After completing the task:
  - Update the corresponding .mbk file(s).
  - Move completed tickets to .work_tickets/worked.tickets.for.<YYYY-MM-DD>.
  - Update relevant cache memory files.
  - Perform LTM sync if it's end of day/session or a major milestone.

## 🧠 MEMORY BANK FILES (.memory_bank/*.mbk, TECHARCH.mbk)
- Describe when, how, and why the code runs.
- Modify and validate respective mbk file for each code change.
- Include input/output, internal logic, and diagrams (Mermaid, UML, ERD, etc.).
- One .mbk per folder/module.
- TECHARCH.mbk:
  - High-level project architecture.
  - End-to-end workflow description.
  - Setup, config, and goals overview.

## 🧾 TICKET FILES (.tickets.<YYYY-MM-DD>)
- Format: .tickets.<YYYY-MM-DD>
- Contents:
  - Task name, description
  - Timestamps
  - Status (pending, in-progress, done, blocked)
  - Assigned to: cline
  - Assigned by: user or cline (self-assigned)

## 📋 Final Checklist Before Task Completion
- ✅ All related .tickets updated
- ✅ Related .mbk file updated
- ✅ Cache Memory (`CURRENT_CONTEXT.md`, `CURRENT_DECISIONS.md`, `CURRENT_TODO.md`) updated.
- ✅ LTM updated/synced if end of session/day (Snapshots, Logs, Index).
- ✅ Test cases created/executed for all modified/added logic
- ✅ Run regression for previous passing unit tests
- ✅ Logs/debug lines added where useful
- ✅ Ask before hardcoding any value
- ✅ Follow validation/sanitization principles
- ✅ Secrets/API keys abstracted (no hardcoding)

## 🧠 Memory System: Iterative Improvement & Cache Management

### Cache Management (`.cache_memory/CURRENT_CONTEXT.md`)
- **Goal:** Keep `CURRENT_CONTEXT.md` focused on active tasks and within a reasonable size to ensure optimal AI performance.
- **Relevance:** Prioritize information directly related to `CURRENT_TODO.md` items.
- **Summarization & Archival Process (User-Initiated or Session End):**
    1. Identify sections in `CURRENT_CONTEXT.md` that are no longer immediately relevant (e.g., completed sub-tasks, resolved investigations).
    2. Propose summarizing these sections.
    3. Propose moving the original detailed text to a new, descriptively named file in `.long_term_memory/CONTEXT_SNAPSHOTS/` (e.g., `YYYY-MM-DD_TaskName_ArchivedContext.md`).
    4. Propose replacing the original text in `CURRENT_CONTEXT.md` with the summary and a Markdown link to the archived snapshot.
    5. User approval is required before executing these changes.

### Long-Term Memory (LTM) Refinement (User-Initiated "Memory Review")
- **Goal:** Ensure LTM (`DECISION_LOG.md`, `PROJECT_CONTEXT_AND_ROADMAP.md`, `INDEX.md`, etc.) remains accurate, clear, and useful.
- **Triggers:** User observation of information gaps, outdated info, retrieval difficulties, or scheduled periodic reviews.
- **Review Process:**
    1. User specifies the LTM area/topic for review.
    2. Cline scans relevant LTM files for the specified topic.
    3. Cline analyzes the information in conjunction with recent work/conversations.
    4. Cline proposes improvements:
        - New entries for `DECISION_LOG.md` (annotating or superseding old ones if necessary).
        - Updates to `INDEX.md` (new links, better organization).
        - New summary sections or clarifications for `PROJECT_CONTEXT_AND_ROADMAP.md`.
        - Suggestions for new diagrams or restructuring information for clarity.
    5. **Immutable Principle:** Direct edits to existing `DECISION_LOG.md` entries or historical `CONTEXT_SNAPSHOTS/` are not allowed. Changes are made via new, superseding entries or annotations in related documents.
    6. User approval is required before Cline implements proposed LTM changes.
