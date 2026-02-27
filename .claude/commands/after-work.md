Commit all changes and push to the remote repository after finishing work.

Steps:
1. Run `git status` to see all changes
2. Run `git diff` to review staged and unstaged changes
3. Run `git log --oneline -5` to see recent commit style
4. Stage relevant files (avoid secrets like .env)
5. Create a commit with a descriptive message following the repo's commit style
6. Push to the remote branch
7. Confirm push was successful

If $ARGUMENTS is provided, use it as the commit message.
