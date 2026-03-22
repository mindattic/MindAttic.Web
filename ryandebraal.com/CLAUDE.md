# Project Rules

## /commit
- Stage changed files, auto-generate a descriptive commit message, commit, push, and print the commit hash
- Always end with: "To revert: `/revert <hash>`"
- Commit message should summarize the "why" not just the "what"
- Always include: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

## /commit "Message"
- Use the provided custom message as the commit message
- Stage changed files, commit, push, and print the commit hash
- Always end with: "To revert: `/revert <hash>`"
- Always include: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

## /revert X
- Revert the commit with hash X using `git revert`
- Push after reverting
