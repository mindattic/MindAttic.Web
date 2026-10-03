---
name: deploy
description: Deploy ryandebraal.com via MindAttic.Deploy (sibling repo). Pins and stamps index.htm, commits and tags MindAttic.Web, then FTPS-uploads it to the site root. Deploying it deploys the whole linked mindattic-web group.
---

When invoked, run:

```
powershell -NoProfile -ExecutionPolicy Bypass -Command "cd D:\Projects\MindAttic\MindAttic.Deploy; npm run deploy -- --site ryandebraal.com"
```

Then report the upload result and flag any failures.

The site's profile lives in `MindAttic.Deploy/projects.json` under `sites[]`. Credentials are centralized in `MindAttic.Deploy/secrets/ftp.json`. This folder has no deploy script or FTP settings of its own.
