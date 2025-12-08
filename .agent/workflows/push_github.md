---
description: Add files, commit changes, and push to GitHub
---

# Push to GitHub Workflow

Follow these steps to commit and push your changes to GitHub:

## 1. Stage all changes
// turbo
```bash
git add -A
```

## 2. Check what will be committed
// turbo
```bash
git status
```

## 3. Commit with a descriptive message
```bash
git commit -m "feat(scope): Brief description of changes

- Detailed change 1
- Detailed change 2
- Detailed change 3"
```

**Commit message format:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring without behavior change
- `test`: Adding tests
- `chore`: Maintenance tasks

## 4. Push to the current branch
```bash
git push origin $(git rev-parse --abbrev-ref HEAD)
```

Or push to a specific branch:
```bash
git push origin <branch-name>
```
