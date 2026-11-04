# parlor

a room for games

```sh
pnpm -F parlor dev      # http://localhost:5179
pnpm -F parlor test     # engine and level tests
pnpm -F parlor levels   # check every level and print its stats
```

## layout

Each game lives in `src/lib/<game>/` and gets a route in `src/routes/<game>/`. A game's rules sit in plain TypeScript with no imports and no DOM, so the page, the node tests in `test/` and the scripts in `scripts/` all run the same code.

## mosaic

Lift dots off a picture, sort them by color, and fill the picture back in. The rules are at the top of `src/lib/mosaic/engine.ts`.

- `engine.ts`: rules, shuffle, solver and hints
- `Mosaic.svelte`: the game: board, tray, zoom and pan, forgiving taps, overlays
- `flights.ts`: dots flying between the board and the tray
- `palette.ts`: checks that a picture's colors are easy to tell apart
- `report.ts`: one level's checks and stats, shared by the editor and `pnpm -F parlor levels`
- `Editor.svelte`, `grid.ts`, `quantize.ts`: the level editor and its image import
- `shapes.ts`: draws a picture from circles, rects and polygons, for writing levels in code
- `levels/`: the level packs

### editor

Open http://localhost:5179/mosaic/edit with the dev server running.

- Paint with Brush (B), Fill (F), Pick (I, or Alt-click) and Erase (E). Number keys pick colors. Ctrl+Z and Ctrl+Shift+Z undo and redo.
- Colors that look too alike are flagged; tap the other color's letter to merge them.
- Checks rerun as you paint: whether the 20-slot tray is enough, solver moves, tray use, group sizes, and a difficulty score.
- Play-test plays the draft in the real game, in its place in play order, without touching saved progress.
- Import image shrinks a picture to the width you pick and reduces it to a few colors that are easy to tell apart. Tiny colors and lone pixels are folded into their neighbors. Each import starts a new level. Use images you have the rights to.
- Save to pack writes into `levels/*.json` (dev server only, through `scripts/mosaic-levels-plugin.ts`). Download and Copy JSON work anywhere.
- The draft is kept in the browser, so a reload doesn't lose it.

### levels

Every `levels/*.json` file is a pack, played in file name order:

```json
{
  "name": "First light",
  "levels": [
    {
      "id": "heart",
      "name": "Heart",
      "palette": { "B": "#fff4d6", "R": "#e63946" },
      "art": ["BBRRBB", "BRRRRB", "BBRRBB"]
    }
  ]
}
```

- `art` is rows of palette letters, all the same width. `.` is an empty pixel.
- `id` must be unique across all packs. It seeds the shuffle, so changing it changes the puzzle.
- A level's place in the whole list sets how big the color blobs are, so moving a level changes its puzzle too.

`pnpm -F parlor levels` fails when a level can't be solved with the 20-slot tray, or has two colors that look alike. `--order` also prints the levels from easiest to hardest.
