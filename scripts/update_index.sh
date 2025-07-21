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
