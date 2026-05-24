Deploy mindatticcares.com via **MindAttic.Deploy** (sibling repo at `D:\Projects\MindAttic\MindAttic.Deploy`). One repo owns the whole FTP pipeline; the per-project `deploy.ps1` / `deploy.bat` / `settings.json` in this folder are retired.

Run this command and report the result:

```
powershell -NoProfile -ExecutionPolicy Bypass -Command "cd D:\Projects\MindAttic\MindAttic.Deploy; npm run deploy -- --site mindatticcares.com"
```

This site's profile lives in `MindAttic.Deploy/projects.json` under `sites[]`. It:

1. Stamps `index.htm` with the current UTC `<!-- Last Updated: ... -->`.
2. FTPS-uploads `index.htm` to `/mindatticcares.com/`.

After running, summarize the result and flag any failures.

Notes:
- FTP credentials are centralized in `MindAttic.Deploy/secrets/ftp.json` (gitignored). The per-site `settings.json` is no longer read.
- The repo was renamed from `MindAtticCares` -> `mindatticcares.com` (GitHub remote and local folder both updated). The MindAttic.Deploy site profile points at the new sourceDir.
