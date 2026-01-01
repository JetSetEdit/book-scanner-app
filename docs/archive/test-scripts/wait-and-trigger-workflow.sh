#!/bin/bash
# Wait for GitHub to index the workflow, then trigger it

echo "⏳ Waiting for GitHub to index the workflow file..."
echo "This may take 1-5 minutes after pushing..."
echo ""

MAX_ATTEMPTS=12
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))
  echo "Attempt $ATTEMPT/$MAX_ATTEMPTS: Checking for workflow..."
  
  # Try to find the workflow
  WORKFLOW_ID=$(gh api repos/JetSetEdit/book-scanner-app/actions/workflows --paginate --jq '.workflows[] | select(.path == ".github/workflows/manual-handling-notifications.yml") | .id' 2>/dev/null)
  
  if [ -n "$WORKFLOW_ID" ]; then
    echo "✅ Workflow found! ID: $WORKFLOW_ID"
    echo ""
    echo "🚀 Triggering workflow..."
    
    gh api -X POST "repos/JetSetEdit/book-scanner-app/actions/workflows/$WORKFLOW_ID/dispatches" \
      -f ref=main
    
    if [ $? -eq 0 ]; then
      echo "✅ Workflow triggered successfully!"
      echo ""
      echo "📊 Check status:"
      echo "   gh run list --workflow=manual-handling-notifications.yml"
      echo ""
      echo "🔗 Or view in browser:"
      echo "   https://github.com/JetSetEdit/book-scanner-app/actions"
      exit 0
    else
      echo "❌ Failed to trigger workflow"
      exit 1
    fi
  fi
  
  if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
    echo "   Workflow not found yet, waiting 30 seconds..."
    sleep 30
  fi
done

echo "❌ Workflow not found after $MAX_ATTEMPTS attempts"
echo ""
echo "💡 Try manually:"
echo "   1. Go to: https://github.com/JetSetEdit/book-scanner-app/actions"
echo "   2. Look for 'Manual Handling Notifications'"
echo "   3. Click 'Run workflow'"
exit 1


