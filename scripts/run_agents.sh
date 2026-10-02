#!/usr/bin/env bash
set -euo pipefail

# Always operate from the repository root, wherever this script is invoked from.
cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"

# WARNING: the implementation agent (Codex) runs with workspace-write and may clean
# or revert the working tree. COMMIT any work you care about BEFORE running this.

TASK="$*"

if [ -z "$TASK" ]; then
  echo 'Usage: scripts/run_agents.sh "Describe the task here"'
  exit 1
fi

mkdir -p .ai-orchestrator

PLAN_FILE=".ai-orchestrator/plan.md"
REVIEW_FILE=".ai-orchestrator/review.md"

echo "========================================"
echo "1/4 Claude: planning"
echo "========================================"

claude -p \
  --permission-mode plan \
  --max-turns 6 \
  "You are the planning architect for this repository.

User request:
$TASK

Inspect the current repository carefully.
Do NOT modify any files.

Produce a concrete implementation plan for another coding agent.
Include:
- relevant files
- exact changes required
- architectural considerations
- edge cases
- tests that should be run
- acceptance criteria

Return only the implementation plan." \
  > "$PLAN_FILE"

echo
echo "Plan saved to $PLAN_FILE"

echo
echo "========================================"
echo "2/4 Codex: implementation"
echo "========================================"

codex exec \
  --sandbox workspace-write \
  "Implement the following user request in this repository:

$TASK

Claude has already analyzed the repository.
Read the implementation plan at:
$PLAN_FILE

Follow the plan where appropriate, but use your own engineering judgment if the repository state requires adjustments.

Requirements:
- make the required code changes
- preserve existing behavior unless the task requires changing it
- run relevant tests, linting, or type checks when available
- fix problems you encounter
- do not merely explain what should be changed; perform the work

When finished, leave all changes in the working tree."

echo
echo "========================================"
echo "3/4 Claude: code review"
echo "========================================"

claude -p \
  --permission-mode plan \
  --max-turns 6 \
  "Act as a senior code reviewer.

Original user request:
$TASK

Inspect the CURRENT repository and git diff after another coding agent implemented the task.

Do NOT modify files.

Review for:
- whether the request was fully implemented
- bugs or regressions
- incomplete behavior
- architecture problems
- security concerns
- unnecessary complexity
- missing tests
- type/lint/test issues

If everything is correct, write exactly:
APPROVED

Otherwise give a concise, actionable list of fixes for the implementation agent." \
  > "$REVIEW_FILE"

echo
echo "Review saved to $REVIEW_FILE"

if grep -q '^APPROVED$' "$REVIEW_FILE"; then
  echo
  echo "========================================"
  echo "Claude approved the implementation."
  echo "========================================"
else
  echo
  echo "========================================"
  echo "4/4 Codex: fixing review findings"
  echo "========================================"

  codex exec \
    --sandbox workspace-write \
    "Finish this implementation.

Original user request:
$TASK

Read Claude's review here:
$REVIEW_FILE

Address every valid review finding.
Inspect the repository yourself before changing anything.
Run the relevant tests, linting, or type checks afterward.
Leave the repository in a finished state."

  echo
  echo "========================================"
  echo "Fix pass completed."
  echo "========================================"
fi

echo
echo "Final git status:"
git status --short

echo
echo "Done."
