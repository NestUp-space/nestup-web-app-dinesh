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
