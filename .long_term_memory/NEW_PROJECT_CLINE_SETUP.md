# Setting up a Cline-like Workflow in a New Project

This guide provides detailed instructions for setting up a Cline-like workflow and memory management system in a new software project. This setup is designed to improve efficiency, consistency, and knowledge retention throughout the development process.

## 1. Project Initialization

1.  **Create a new project directory:**

    ```bash
    mkdir my-new-project
    cd my-new-project
    ```

2.  **Initialize a Git repository:**

    ```bash
    git init
    ```

3.  **Create core directories:**

    ```bash
    mkdir .cache_memory .long_term_memory .work_tickets scripts
    ```

    *   `.cache_memory`: For active session data (short-term memory).
    *   `.long_term_memory`: For persistent project knowledge (long-term memory).
    *   `.work_tickets`: For tracking tasks and their status.
    *   `scripts`: For automation scripts.

## 2. Core Memory Files

1.  **Create `GUARDRAILS.md` in `.long_term_memory/`:**

    This file serves as the master rulebook for the project. It should contain:

    *   Global coding standards and best practices.
    *   Project-specific architectural guidelines.
    *   Command-line operation conventions.
    *   Memory management protocols.
    *   Git discipline rules.

    **Example `GUARDRAILS.md` Prompt:**

    ```
    "Create a comprehensive GUARDRAILS.md file for this project. Include sections on coding standards (e.g., naming conventions, code style), architectural principles (e.g., SOLID, Clean Architecture), command-line conventions (e.g., command chaining, tool usage), memory management protocols (e.g., cache pruning, LTM refinement), and Git discipline (e.g., commit message format, branching strategy)."
    ```

2.  **Create `PROJECT_CONTEXT_AND_ROADMAP.md` in `.long_term_memory/`:**

    This file provides a high-level overview of the project, its architecture, and future roadmap. It should include:

    *   Project genesis and purpose.
    *   Current architecture and key modules.
    *   Technology stack details.
    *   Future feature roadmap.
    *   Identified gaps and key considerations.

    **Example `PROJECT_CONTEXT_AND_ROADMAP.md` Prompt:**

    ```
    "Create a detailed PROJECT_CONTEXT_AND_ROADMAP.md file for this project. Include sections on the project's genesis and purpose, current architecture and key modules, technology stack details, future feature roadmap, and identified gaps and key considerations. Ensure the roadmap includes phases, dependencies, and effort estimates."
    ```

3.  **Create `INDEX.md` in `.long_term_memory/`:**

    This file serves as the master index for navigating the Long-Term Memory. It should contain links to all key documents and insights.

    **Example `INDEX.md` Prompt:**

    ```
    "Create an initial INDEX.md file for the .long_term_memory directory. Include links to GUARDRAILS.md and PROJECT_CONTEXT_AND_ROADMAP.md. Add sections for Key Architectural Decisions, Context Snapshots & Analyses, and a Generic Knowledge Base."
    ```

4.  **Create `BUSINESS_CONTEXT.md` in `.long_term_memory/`:**

    This file describes the business context of the project, including target users, market analysis, and key performance indicators (KPIs).

    **Example `BUSINESS_CONTEXT.md` Prompt:**

    ```
    "Create a BUSINESS_CONTEXT.md file that describes the target users, market analysis, and key performance indicators (KPIs) for this project. Include information about the project's goals and how it will generate revenue."
    ```

5.  **Create `CURRENT_CONTEXT.md` in `.cache_memory/`:**

    This file serves as the primary working summary and scratchpad for the current session. It should contain:

    *   Current task description and status.
    *   Summary of actions taken.
    *   Next steps.
    *   Links to relevant files and resources.

    **Example `CURRENT_CONTEXT.md` Prompt:**

    ```
    "Create a CURRENT_CONTEXT.md file for the current session. Include the current task description and status, a summary of actions taken, next steps, and links to relevant files and resources."
    ```

6.  **Create `CURRENT_DECISIONS.md` in `.cache_memory/`:**

    This file logs all significant decisions made during the current session. It should include:

    *   Decision ID and timestamp.
    *   Task description.
    *   Decision/action taken.
    *   Rationale.
    *   Outcome (anticipated).
    *   Affected files/areas.
    *   Next steps.

    **Example `CURRENT_DECISIONS.md` Prompt:**

    ```
    "Create a CURRENT_DECISIONS.md file for the current session. Include a section for each decision made, with the Decision ID, timestamp, task description, decision/action taken, rationale, outcome (anticipated), affected files/areas, and next steps."
    ```

7.  **Create `CURRENT_TODO.md` in `.cache_memory/`:**

    This file serves as the active checklist for session objectives. It should contain:

    *   Task name and description.
    *   Status (pending, in-progress, done, blocked).
    *   Assigned to.
    *   Assigned by.

    **Example `CURRENT_TODO.md` Prompt:**

    ```
    "Create a CURRENT_TODO.md file for the current session. Include a list of tasks with their name, description, status (pending, in-progress, done, blocked), assigned to, and assigned by."
    ```

## 3. Automation Scripts

1.  **Create `update_index.sh` in `scripts/`:**

    This script automatically updates `INDEX.md` whenever new files are added to the Long-Term Memory (LTM).

    **Example `update_index.sh` Content:**

    ```bash
    #!/bin/bash

    # This script automatically updates INDEX.md whenever new files are added to the LTM.

    # Define file paths
    INDEX_FILE=".long_term_memory/INDEX.md"
    LTM_DIR=".long_term_memory"

    # Check if the INDEX.md file exists
    if [ ! -f "$INDEX_FILE" ]; then
      echo "Error: $INDEX_FILE not found."
      exit 1
    fi

    # Check if the LTM directory exists
    if [ ! -d "$LTM_DIR" ]; then
      echo "Error: $LTM_DIR not found."
      exit 1
    fi

    echo "Updating INDEX.md with new files..."

    # Find all markdown files in LTM directory (excluding INDEX.md itself)
    find "$LTM_DIR" -name "*.md" -not -name "INDEX.md" | while read -r file; do
      # Get relative path from LTM directory
      relative_path=$(echo "$file" | sed "s|^$LTM_DIR/||")

      # Check if this file is already referenced in INDEX.md
      if ! grep -q "$relative_path" "$INDEX_FILE"; then
        echo "New file found: $relative_path"

        # Get the filename without extension for the link text
        filename=$(basename "$file" .md)

        # Add entry to INDEX.md (this is a simple implementation)
        echo "- [$filename]($relative_path)" >> "$INDEX_FILE"
        echo "Added $relative_path to INDEX.md"
      fi
    done

    echo "INDEX.md update completed."
    ```

    **Example Usage:**

    ```bash
    chmod +x scripts/update_index.sh
    ./scripts/update_index.sh
    ```

2.  **Create `create_ticket.sh` in `scripts/`:**

    This script automatically creates corresponding tickets in the `.work_tickets/` directory when new tasks are started.

    **Example `create_ticket.sh` Content:**

    ```bash
    #!/bin/bash

    # This script automatically creates a corresponding ticket in the .work_tickets/ directory when a new task is started.

    # Define file paths
    WORK_TICKETS_DIR=".work_tickets"
    CURRENT_TODO=".cache_memory/CURRENT_TODO.md"

    # Check if the CURRENT_TODO file exists
    if [ ! -f "$CURRENT_TODO" ]; then
      echo "Error: $CURRENT_TODO not found."
      exit 1
    fi

    # Create the work tickets directory if it doesn't exist
    mkdir -p "$WORK_TICKETS_DIR"

    # Function to create a ticket
    create_ticket() {
      local task_description="$1"
      local date=$(date +%Y-%m-%d)
      local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
      local ticket_file="$WORK_TICKETS_DIR/likely.tickets.for.$date.md"

      # Create a sanitized filename for the task
      local task_id=$(echo "$task_description" | sed 's/[^a-zA-Z0-9 ]//g' | sed 's/ /_/g' | cut -c1-50)

      # Check if ticket file exists, if not create it with header
      if [ ! -f "$ticket_file" ]; then
        cat > "$ticket_file" << EOF
    # Work Tickets for $date

    ## Active Tickets

    EOF
      fi

      # Check if this task already has a ticket
      if grep -q "$task_description" "$ticket_file"; then
        echo "Ticket already exists for task: $task_description"
        return
      fi

      # Add the new ticket
      cat >> "$ticket_file" << EOF

    ### Ticket: $task_id
    **Task Name:** $task_description
    **Created:** $timestamp
    **Status:** pending
    **Assigned to:** cline
    **Assigned by:** user
    **Description:** Auto-generated ticket for task: $task_description

    **Updates:**
    - $timestamp: Ticket created automatically

    EOF

      echo "Created ticket for task: $task_description"
      echo "Ticket file: $ticket_file"
    }

    # Extract tasks from CURRENT_TODO.md and create tickets
    echo "Checking for new tasks in CURRENT_TODO.md..."

    # Extract task descriptions from CURRENT_TODO.md
    grep "^### Task:" "$CURRENT_TODO" | sed 's/^### Task: //' | while IFS= read -r task; do
      if [ -n "$task" ]; then
        create_ticket "$task"
      fi
    done

    echo "Ticket creation process completed."
    ```

    **Example Usage:**

    ```bash
    chmod +x scripts/create_ticket.sh
    ./scripts/create_ticket.sh
    ```

3.  **Create `decision_template.md` in `scripts/`:**

    This file provides a standardized template for recording decisions in `DECISION_LOG.md`.

    **Example `decision_template.md` Content:**

    ```markdown
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
    ```

## 4. Setting up Cline

1.  **Install Cline (if not already installed):**

    Follow the instructions in the Cline documentation to install Cline on your system.

2.  **Configure Cline:**

    Configure Cline to use the appropriate settings for your project. This may involve setting environment variables or creating a configuration file.

3.  **Create a `.clinerules/` directory:**

    Create a `.clinerules/` directory in the project root. This directory will contain custom instructions for Cline.

    ```bash
    mkdir .clinerules
    ```

4.  **Create `custom_instructions.md` in `.clinerules/`:**

    This file contains custom instructions for Cline. It should include:

    *   Your primary role and responsibilities.
    *   Core operational mandates.
    *   Memory system overview.
    *   Memory workflow and integration guidelines.
    *   Existing systems and commands.

    **Example `custom_instructions.md` Prompt:**

    ```
    "Create a custom_instructions.md file for Cline. Include sections on your primary role and responsibilities, core operational mandates, memory system overview, memory workflow and integration guidelines, and existing systems and commands. Emphasize the importance of consulting GUARDRAILS.md for all decision-making processes."
    ```

## 5. Initializing the Workflow

1.  **Create initial tasks in `CURRENT_TODO.md`:**

    Add a list of initial tasks to `CURRENT_TODO.md`. These tasks will be used to generate initial tickets.

2.  **Run `create_ticket.sh`:**

    Run the `create_ticket.sh` script to generate initial tickets for the tasks in `CURRENT_TODO.md`.

3.  **Update `INDEX.md`:**

    Run the `update_index.sh` script to update `INDEX.md` with the new files and directories.

## 6. Ongoing Workflow

1.  **Start of Session:**

    *   Run `./scripts/create_ticket.sh` to create tickets for any new tasks.
    *   Check `INDEX.md` for recent additions.

2.  **During Development:**

    *   Use `decision_template.md` for consistent decision logging.
    *   Run `./scripts/update_index.sh` after adding new LTM files.

3.  **End of Session:**

    *   Update ticket statuses manually.
    *   Run context summarization (when available).
    *   Archive completed work.

## 7. Customization and Extension

This setup can be customized and extended to fit the specific needs of your project. Some potential enhancements include:

*   **Git hooks:** Automatically run scripts on commits.
*   **Scheduled runs:** Schedule scripts to run automatically via cron jobs.
*   **IDE integration:** Integrate scripts into IDE workflows.
*   **Automated status updates:** Automatically update ticket statuses based on file changes.

By following these instructions, you can set up a Cline-like workflow and memory management system in your new project, improving efficiency, consistency, and knowledge retention throughout the development process.
