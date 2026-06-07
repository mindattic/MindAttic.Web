# MindAttic Cares — How to work here (L3)

> This is the "how to work" layer. The "what it IS / the rules" layer is the Codex canon in
> `docs/`. Read that before changing anything.

## Codex (canonical documentation)

The source of truth lives in `docs/`:

- **`docs/BIBLE.md`** (L0) — what MindAttic Cares IS, is NOT, architecture, and the Laws.
- **`docs/AMENDMENTS.md`** (L1) — append-only change log; an amendment **wins** over the bible.
- **`docs/USER_STORIES.md`** (L2) — stories + status; every ✅ cites its verifying test.
- **`docs/rfc/`** — design notes; graduate into the bible + stories when decided.
- **`docs/BIBLE.digest.md`** — GENERATED; never hand-edit (run `tools/codex.ps1 digest`).
- Org-wide laws: **[`MindAttic.HouseRules.md`](../MindAttic.HouseRules.md)** (inherited by BIBLE §5).

Rules:
- **Single home per fact.** A fact lives in one layer; everything else links to it by `{#ID}`.
- **Stable IDs, never line numbers.** Sections `{#MAC-§N}`, laws `{#MAC-LAW-n}`, stories
  `MAC-US-<Epic><n>`, amendments `MAC-A<n>`.
- **Append-only L1.** Never rewrite an amendment; supersede it.
- **Verified done.** Mark ✅ only when a test/build proves it; otherwise 🟡/⬜ (HOUSE-LAW-8).

### Tooling

```
pwsh tools/codex.ps1 digest    # regenerate docs/BIBLE.digest.md from BIBLE.md
pwsh tools/codex.ps1 doctor    # validate the docs; non-zero exit on any hard error
```

`.claude/hooks/inject-digest.ps1` injects the digest at SessionStart (wired in
`.claude/settings.json`).

## Building / running

There is **no build step** ([MAC-LAW-1](docs/BIBLE.md#MAC-LAW-1)). The whole site is the single
file `index.htm` — open it in a browser. See `README.md` for editing and `docs/BIBLE.md §4` for the
architecture. Do **not** introduce a CMS, bundler, or static-site generator.

## Deploying

Deployment is centralized in **MindAttic.Deploy** ([MAC-A1](docs/AMENDMENTS.md#MAC-A1),
[MAC-LAW-5](docs/BIBLE.md#MAC-LAW-5)). Use the `/deploy` command or:

```
cd D:\Projects\MindAttic\MindAttic.Deploy
npm run deploy -- --site mindatticcares.com
```

Do not re-create a per-folder `deploy.ps1` / `settings.json`.
