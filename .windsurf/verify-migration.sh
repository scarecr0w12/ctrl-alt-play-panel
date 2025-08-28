#!/bin/bash

# Verification script for Windsurf migration

echo "=== Windsurf Migration Verification ==="
echo ""

echo "1. Checking recipes directory..."
ls -la .windsurf/recipes/ | grep -E "\.md$" | wc -l
echo ""

echo "2. Checking memories directory..."
ls -la .windsurf/memories/ | grep -E "\.md$" | wc -l
echo ""

echo "3. Checking MCP configuration..."
if [ -f ".windsurf/mcp-config.json" ]; then
  echo "MCP configuration exists"
else
  echo "ERROR: MCP configuration missing"
fi
echo ""

echo "4. Checking key recipe files..."
for recipe in architect.md ask.md code.md debug.md deployer.md orchestrator.md reviewer.md security.md tester.md data-scientist.md; do
  if [ -f ".windsurf/recipes/$recipe" ]; then
    echo "✓ $recipe exists"
  else
    echo "✗ $recipe missing"
  fi
done
echo ""

echo "5. Checking key memory files..."
for memory in project-overview.md api-documentation.md architecture-overview.md database-documentation.md testing-documentation.md deployment-documentation.md coding-standards.md ci-cd-documentation.md product-context.md active-context.md decision-log.md progress-tracking.md project-brief.md; do
  if [ -f ".windsurf/memories/$memory" ]; then
    echo "✓ $memory exists"
  else
    echo "✗ $memory missing"
  fi
done
echo ""

echo "6. Checking workflow files..."
for workflow in bug-investigation.md deployment-prep.md testing-workflow.md code-review-prep.md documentation-update.md feature-development.md; do
  if [ -f ".windsurf/recipes/$workflow" ]; then
    echo "✓ $workflow exists"
  else
    echo "✗ $workflow missing"
  fi
done
echo ""

echo "7. Checking summary files..."
if [ -f ".windsurf/migration-completion-summary.md" ]; then
  echo "✓ Migration completion summary exists"
else
  echo "✗ Migration completion summary missing"
fi

echo ""
echo "=== Verification Complete ==="
