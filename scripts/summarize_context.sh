#!/bin/bash

# This script summarizes completed tasks in CURRENT_CONTEXT.md and archives them.

# Define file paths
CURRENT_TODO=".cache_memory/CURRENT_TODO.md"
CURRENT_CONTEXT=".cache_memory/CURRENT_CONTEXT.md"
CONTEXT_SNAPSHOTS=".long_term_memory/CONTEXT_SNAPSHOTS"

# Check if the files exist
if [ ! -f "$CURRENT_TODO" ]; then
  echo "Error: $CURRENT_TODO not found."
  exit 1
fi

if [ ! -f "$CURRENT_CONTEXT" ]; then
  echo "Error: $CURRENT_CONTEXT not found."
  exit 1
fi

# Create the CONTEXT_SNAPSHOTS directory if it doesn't exist
mkdir -p "$CONTEXT_SNAPSHOTS"

# Function to extract task IDs from CURRENT_TODO.md
extract_task_ids() {
  awk -F'### Task: ' '/### Task: / {gsub(/[[:space:]]+/," ",$2); print $2}' "$CURRENT_TODO"
}

# Function to summarize and archive a task
summarize_and_archive_task() {
  task_id="$1"
  echo "Processing task: $task_id"

  # Extract the task content from CURRENT_CONTEXT.md
  escaped_task_id=$(printf %q "${task_id//_/ /}")
  echo "escaped_task_id: $escaped_task_id"
  context_content=$(cat "$CURRENT_CONTEXT")

  # Get the line number where the task starts
  task_id_escaped=$(echo "${task_id//_/ /}" | sed 's/([()])/\\&/g')
  start_line=$(grep -inE "^### Task: ${task_id_escaped}" <<< "$context_content" | cut -d ":" -f 1)

  # Get the line number where the next task starts
  end_line=$(grep -n "^### Task: " <<< "$context_content" | grep -v "^${start_line}:" | head -n 1 | cut -d ":" -f 1)

  # If there is no next task, set the end line to the end of the file
  if [ -z "$end_line" ]; then
    end_line=$(wc -l <<< "$context_content" | awk '{print $1}')
  fi

  echo "start_line: $start_line"
  echo "end_line: $end_line"

  # Extract the task content using sed
  if [ -z "$end_line" ]; then
    task_content=$(sed -n "${start_line},\$p" <<< "$context_content")
  else
    task_content=$(sed -n "${start_line},${end_line}p" <<< "$context_content")
  fi

  # Check if task content is empty
  if [ -z "$task_content" ]; then
    echo "Warning: No content found for task: $task_id in CURRENT_CONTEXT.md"
    return
  fi

  # Create a snapshot file in CONTEXT_SNAPSHOTS
  snapshot_file="$CONTEXT_SNAPSHOTS/$(date +%Y%m%d_%H%M%S)_${task_id}.md"
  echo "$task_content" > "$snapshot_file"

  # Generate a summary (replace with actual summarization logic if needed)
  summary="[Archived detailed context for task: $task_id](.long_term_memory/CONTEXT_SNAPSHOTS/$(basename \"$snapshot_file\"))"

  # Replace the task content in CURRENT_CONTEXT.md with the summary
  sed -i "/### Task: ${task_id//_/ /}/, /### Task:/ {
    /### Task:/d
    s/.*/$summary/
  }" "$CURRENT_CONTEXT"

  echo "Task $task_id summarized and archived."
}

# Main script logic
task_ids=$(extract_task_ids)

if [ -z "$task_ids" ]; then
  echo "No completed tasks found in CURRENT_TODO.md"
  exit 0
fi

# Process each task
for task_id in $task_ids; do
  summarize_and_archive_task "$task_id"
done

echo "Script completed."
