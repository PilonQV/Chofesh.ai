# Master Command System - Usage Guide

## Overview

The Master Command system enables admin users to give natural language commands that automatically modify the Chofesh codebase. It follows a **detect → plan → code → test → deploy** workflow inspired by cutting-edge self-improving AI research.

## Quick Start

### 1. Set Admin Token

Add to your `.env` file:

```bash
MASTER_COMMAND_ADMIN_TOKEN=your_secure_token_here
ADMIN_USER_IDS=1,2,3  # Optional: Comma-separated user IDs allowed to use Master Command
```

### 2. Use via tRPC

```typescript
import { trpc } from '@/lib/trpc';

// Execute a command
const result = await trpc.masterCommand.execute.mutate({
  command: "Add a dark mode toggle to the settings page",
  adminToken: "your_secure_token_here",
  dryRun: false, // Set to true to preview changes without applying
});

console.log(result);
// {
//   success: true,
//   commandId: "cmd_1234567890_abc123",
//   plan: { ... },
//   execution: {
//     changes: [ ... ],
//     testsPass: true,
//     checkpointId: "abc123",
//     versionId: "1.45.0"
//   },
//   logs: [ ... ]
// }
```

### 3. Use via API (Future)

```bash
curl -X POST https://chofesh.ai/api/trpc/masterCommand.execute \
  -H "Content-Type: application/json" \
  -d '{
    "command": "Fix the bug where credit balance doesn't update",
    "adminToken": "your_secure_token_here"
  }'
```

## Example Commands

### Simple Commands

**Add a feature:**
```
"Add a dark mode toggle to the settings page"
"Add export chat history as PDF button"
"Add a loading spinner to the submit button"
```

**Fix a bug:**
```
"Fix the bug where credit balance doesn't update"
"Fix the navigation menu not closing on mobile"
"Fix the typo in the homepage hero section"
```

**Modify UI:**
```
"Change the primary button color to blue"
"Update the homepage hero text"
"Remove the unused footer links"
```

### Medium Commands

```
"Add a feature to export chat history as PDF"
"Implement rate limiting for API endpoints"
"Add analytics tracking for button clicks"
"Create a new settings tab for notifications"
```

### Complex Commands

```
"Create a usage analytics dashboard showing credit spending by feature"
"Implement real-time collaboration features"
"Add webhook integration for external services"
```

## Command Workflow

1. **Parse** - Natural language command → Structured intent
2. **Analyze** - Scan codebase → Find relevant files
3. **Plan** - Create implementation plan → Steps & files
4. **Generate** - Write/modify code → File changes
5. **Test** - Run test suite → Verify no breakage
6. **Deploy** - Create checkpoint → Version bump

## Dry Run Mode

Preview changes without applying them:

```typescript
const preview = await trpc.masterCommand.execute.mutate({
  command: "Add a new feature",
  adminToken: "your_token",
  dryRun: true, // Preview only
});

console.log(preview.plan);
// {
//   steps: [ ... ],
//   filesToModify: [ ... ],
//   estimatedComplexity: "medium",
//   risks: [ ... ]
// }
```

## Safety Mechanisms

### 1. Admin Authentication
- Requires valid admin token
- Optional: Restrict to specific user IDs
- All commands are logged

### 2. Automatic Checkpoints
- Checkpoint created before any modification
- Version number automatically incremented
- Easy rollback via `webdev_rollback_checkpoint`

### 3. Test Validation
- All changes must pass existing tests
- Blocks deployment if tests fail
- Reports test failures with details

### 4. Change Audit Log
- Every command is logged
- Tracks success/failure
- Stores changes and checkpoints

### 5. Rollback Capability
- Revert to any previous checkpoint
- Preserves change history
- No data loss

## Response Format

```typescript
interface MasterCommandResponse {
  success: boolean;
  commandId: string;
  plan: {
    steps: ImplementationStep[];
    filesToModify: string[];
    filesToCreate: string[];
    estimatedComplexity: 'simple' | 'medium' | 'complex';
    estimatedTime: number;
    risks: string[];
  };
  execution?: {
    changes: FileChange[];
    testsPass: boolean;
    checkpointId: string;
    versionId: string;
  };
  error?: string;
  logs: string[];
}
```

## Limitations

### What Master Command CAN Do:
✅ Modify existing files  
✅ Create new files  
✅ Delete unused files  
✅ Add new features  
✅ Fix bugs  
✅ Refactor code  
✅ Update UI components  
✅ Add API endpoints  
✅ Modify styling  

### What Master Command CANNOT Do:
❌ Modify database schema (requires manual migration)  
❌ Change environment variables (requires manual update)  
❌ Deploy to production (only creates checkpoint)  
❌ Access external services without credentials  
❌ Modify infrastructure (server config, DNS, etc.)  
❌ Install new npm packages (requires manual approval)  

## Error Handling

If a command fails:

1. **Check the error message** in the response
2. **Review the logs** for detailed information
3. **Rollback if needed** using the last checkpoint
4. **Refine the command** and try again

Example error response:

```json
{
  "success": false,
  "commandId": "cmd_1234567890_abc123",
  "error": "Command involves dangerous operation: database. This requires manual intervention.",
  "logs": [
    "[Parser] Starting Master Command: ...",
    "[Parser] Command validation failed"
  ]
}
```

## Best Practices

### 1. Be Specific
❌ "Make the app better"  
✅ "Add a dark mode toggle to the settings page"

### 2. One Task Per Command
❌ "Add dark mode and fix the credit bug and update homepage"  
✅ "Add a dark mode toggle to the settings page"  
✅ "Fix the bug where credit balance doesn't update"  
✅ "Update the homepage hero text"

### 3. Use Dry Run First
```typescript
// Preview changes
const preview = await execute({ command, dryRun: true });
console.log(preview.plan);

// Apply if looks good
const result = await execute({ command, dryRun: false });
```

### 4. Test After Deployment
```bash
# Run tests manually to verify
cd /home/ubuntu/libre-ai
pnpm test
```

### 5. Monitor Checkpoints
- Review checkpoint messages
- Track version numbers
- Keep rollback strategy ready

## Troubleshooting

### Command Not Working?

1. **Check admin token** - Ensure it matches `.env`
2. **Check user ID** - Ensure you're in `ADMIN_USER_IDS`
3. **Review command** - Make it more specific
4. **Check logs** - Look for error details
5. **Try dry run** - Preview the plan first

### Tests Failing?

1. **Review test output** in response
2. **Check what broke** in the changes
3. **Rollback** to previous checkpoint
4. **Fix manually** or refine command

### Changes Not Applied?

1. **Check success flag** in response
2. **Review logs** for errors
3. **Verify checkpoint** was created
4. **Restart dev server** if needed

## Future Enhancements

### Phase 2: Admin Panel UI (Planned)
- Visual command interface
- Change preview with diff viewer
- Command history browser
- One-click rollback
- Real-time execution logs

### Phase 3: Learning System (Planned)
- Learn from successful commands
- Build library of common patterns
- Suggest improvements
- Auto-optimize based on feedback

### Phase 4: Advanced Features (Planned)
- Multi-step command chains
- Conditional execution
- Parallel execution
- A/B testing for changes
- Automated rollback on errors

## Security Considerations

1. **Keep admin token secret** - Never commit to git
2. **Rotate tokens regularly** - Change every 30 days
3. **Limit admin users** - Only trusted users
4. **Monitor command logs** - Review regularly
5. **Test in development** - Never test in production

## Support

For issues or questions:
1. Check this documentation
2. Review command logs
3. Test with dry run
4. Rollback if needed
5. Contact admin for help

---

**Remember:** Master Command is a powerful tool. Use it responsibly and always test changes before deploying to production.
