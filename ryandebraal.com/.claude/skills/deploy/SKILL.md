---
name: deploy
description: Deploy the site via FTPS to the remote server. Uses deploy.ps1 by default; falls back to deploy.py if PowerShell fails. Reads credentials from settings.json.
---

When invoked:

1. Run the PowerShell deploy script:
   `powershell -ExecutionPolicy Bypass -File deploy.ps1`
2. If PowerShell is unavailable or fails, fall back to Python:
   `python deploy.py`
3. Report the upload summary (files OK, files failed) to the user
4. If any files failed, highlight them and suggest checking FTP credentials or server connectivity
