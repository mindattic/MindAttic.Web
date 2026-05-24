---
description: Propogate (fan out) every subscribed component into mindattic.com, StreetSamurai, Claudia, ChiMesh, and any other subscribers. Synonym for /publish, /sync, /push — neither is an FTP deploy; this only pushes component sources into sibling repos.
---

Run `sync/sync-all.ps1` from the repo root. Use the PowerShell tool. Do not edit the script or substitute your own commands — just execute it and report the output verbatim.

```powershell
powershell -File sync/sync-all.ps1
```

If it fails, surface the error and stop. Do not retry or attempt to "fix" anything unless the user explicitly asks.
