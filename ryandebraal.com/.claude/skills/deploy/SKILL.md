---
name: deploy
description: Deploy ryandebraal.com via MindAttic.Deploy (sibling repo). Stamps index.htm and FTPS-uploads it to the site root. Replaces the retired local deploy.ps1.
---

When invoked, run:

```
powershell -NoProfile -ExecutionPolicy Bypass -Command "cd D:\Projects\MindAttic\MindAttic.Deploy; npm run deploy -- --site ryandebraal.com"
```

Then report the upload result and flag any failures.

The site's profile lives in `MindAttic.Deploy/projects.json` under `sites[]`. Credentials are centralized in `MindAttic.Deploy/secrets/ftp.json`; the per-site `settings.json` and `deploy.ps1` in this folder are retired.
