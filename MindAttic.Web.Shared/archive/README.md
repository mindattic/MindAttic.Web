# archive/

Assets that are **kept but not part of the served package**: nothing on any MindAttic site references
them, so they are left out of `assets-manifest.json`, the asset layout in [`docs/ASSETS.md`](../docs/ASSETS.md)
and the tests. Paths mirror where each file would live in the package, so restoring one is a move back
to the same path (then regenerate the manifest).

| Path | What it is |
|---|---|
| `fonts/outfit/outfit.ttf`, `fonts/attic/attic.ttf` | the original TTFs the served `fonts/*/*.woff2` files were made from |
| `mindattic.com/logos/` | brand masters: the MindAttic Interactive wordmark (opaque + transparent) and the transparent M monogram |
| `mindatticcares.com/logos/m-cares-black-red-transparent.png` | 1024px master of the M-Cares logo (the site serves its 300px and 720px versions) |
| `ryandebraal.com/icons/` | the 32 Neko sprite frames and the MindAttic link icon; the page keeps these tiny files inline |

jsDelivr can technically serve any file in the repo, but nothing here is a supported URL: do not link to
`archive/` from a site. Use the package folders instead.
