#!/bin/bash
# Script to replace hard-coded localhost URLs

echo "Fixing hard-coded URLs in workflow files..."

# List of files to fix
files=(
  "client/src/features/workflows/components/AssignmentRuleForm.tsx"
  "client/src/features/workflows/components/SLAPolicyForm.tsx"
  "client/src/features/workflows/components/SLAWidget.tsx"
  "client/src/features/workflows/pages/AssignmentRulesPage.tsx"
  "client/src/features/workflows/pages/SLAPoliciesPage.tsx"
  "client/src/features/workflows/pages/WorkflowsPage.tsx"
  "client/src/features/tickets/components/CommentSection.tsx"
  "client/src/features/auth/SignUpPage.tsx"
  "client/src/features/auth/LoginPage.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    # Count occurrences
    count=$(grep -c "http://localhost:4000" "$file" 2>/dev/null || echo "0")
    echo "  Found $count hard-coded URL(s)"
  fi
done

echo "Done listing files with hard-coded URLs"
