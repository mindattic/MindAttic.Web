---
name: run
description: Run the MindAtticCares project. No arguments needed.
---

When invoked:

1. Inspect the project for a runnable entrypoint (e.g. `index.htm`, `*.csproj`, `package.json`, `*.sln`/`*.slnx`)
2. If no clear entrypoint exists yet, tell the user the project has no runnable target and exit
3. Otherwise run the appropriate command (e.g. `start index.htm`, `dotnet run --project <proj>`, `npm start`) and stream output
4. If the run fails, summarize the error and suggest a fix
