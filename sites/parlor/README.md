# parlor

a room for games

```sh
pnpm -F parlor dev      # http://localhost:5179
pnpm -F parlor test     # engine and level tests
pnpm -F parlor levels   # check every level and print its stats
pnpm -F parlor forage:pictures  # regenerate the drawn forage pictures (packs 02 on)
pnpm -F parlor forage:tune      # pick each forage level's deal to hit its difficulty
```

## layout

Each game lives in `src/lib/<game>/` and gets a route in `src/routes/<game>/`, with its picture list on its own page at `src/routes/<game>/pictures/`. Every level has its own prerendered page (`/<game>/N`) with its board already in the HTML; the bare `/<game>` page sends you on to your saved level. Progress is saved in one small cookie per game (`parlor-<game>`: the level you're on, the pictures you've cleared, sound and relaxed mode), so the server can send you to the right level and mark cleared pictures before the page loads. Older saves in local storage move over on the first visit. Boards size themselves in CSS from the row's width and the small viewport height, rounded to whole pixels. The games use the site's look from `@pierogis/utensils`: `border inset link-box` buttons, 2px inset rings, Courier for labels, no narration, no hints and no pop-ups; a move that can't go gets a still outline, and a finished or stuck level says so in a panel under the board. A game's rules sit in plain TypeScript with no imports and no DOM, so the page, the node tests in `test/` and the scripts in `scripts/` all run the same code.

`src/lib/shared/` holds what the games share:

- `engine.ts`: seeded random numbers, shuffles and reading a level's picture
- `levels.ts`: turns a game's `levels/*.json` files into packs
- `save.ts`: the save cookie
- `difficulty.ts`: the 1 to 5 difficulty labels
- `palette.ts` (checks that a picture's colors are easy to tell apart), `shapes.ts` (draws a picture from circles, rects and polygons), `art.ts` (draws a level as a small picture) and `sound.ts`
- `game/`: the title bar with undo, restart, sound and pictures (`GameBar.svelte`), and the panel for a finished or stuck level (`LevelEnd.svelte`)
- `Pictures.svelte`: a game's picture list
- `editor/`: the level editor, its image import and the picture checks every game shares

A new game brings its engine, its component, its levels and an `editor.ts` that tells the editor how to check and play a level.

## mosaic

Lift dots off a picture, sort them by color, and fill the picture back in. The rules are at the top of `src/lib/mosaic/engine.ts`.

- `engine.ts`: rules, shuffle and solver
- `Mosaic.svelte`: the game: board, tray, zoom and pan, forgiving taps
- `flights.ts`: dots flying between the board and the tray
- `report.ts`: one level's checks and stats, shared by the editor and `pnpm -F parlor levels`
- `editor.ts`: what the shared editor checks for a mosaic level
- `levels/`: the level packs

### editor

Open http://localhost:5179/mosaic/edit or http://localhost:5179/forage/edit with the dev server running. Both games use the same editor.

- Paint with Brush (B), Fill (F), Pick (I, or Alt-click) and Erase (E). Number keys pick colors. Ctrl+Z and Ctrl+Shift+Z undo and redo.
- Colors that look too alike are flagged; tap the other color's letter to merge them.
- Checks rerun as you paint. For mosaic: whether the 20-slot tray is enough, solver moves, tray use, group sizes and a difficulty score. For forage: whether a deal can be won and how often careless play wins (run `forage:tune` to save a tuned deal).
- Play-test plays the draft in the real game, in its place in play order, without touching saved progress.
- Import image shrinks a picture to the width you pick and reduces it to a few colors that are easy to tell apart. Tiny colors and lone pixels are folded into their neighbors. Each import starts a new level. Use images you have the rights to.
- Save to pack writes into `levels/*.json` (dev server only, through `scripts/levels-plugin.ts`). Download and Copy JSON work anywhere.
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

## forage

Ant colonies eat a pixel picture away. Tap the front colony of a column and it goes to work in one of 5 slots, and its first ant leaves right away. A working colony sends one ant every 0.2s to the first exposed food of its color that no ant is heading for yet (bottom row first, left to right); its number counts down as they leave, and it frees its slot as soon as it has sent its last one. Exposed means a side touches empty space that reaches the outside; sealed holes don't count. Each ant finds its way through the grid: out of its slot's door below the picture, around the outside edge and in through cleared space, and the length of that walk is how long it takes, so food deep in a tunnel takes longer to reach and to uncover what's behind it. Food it uncovers can be claimed on a later dispatch. A colony with nothing in reach just waits in its slot, so with every slot busy nothing more can go out. Clear the picture to win. The game doesn't narrate or preview: a tap that can't go outlines what's in the way. The rules are at the top of `src/lib/forage/engine.ts`.

Later levels add linked colonies (marked with the same letter; they go out together once both are at the front, and stay linked in their slots: neither leaves until both have sent all their ants), locks (a tile in a column, in front of the colonies it holds back; once it reaches the front the column waits until the numbered key in the picture touches the outside), and mystery colonies (striped, color hidden until they reach the front).

Each level has a difficulty index from 1 (Easy) to 5 (Very hard), shown in the title and the picture list. It comes from `wins`, the share of careless games won, which `forage:tune` measures and saves with the level (`difficulty.ts`).

- `engine.ts`: rules, the deal of colonies and solver
- `Forage.svelte`: the game
- `report.ts`: plays a deal many times with random players to measure how hard it is
- `ants.ts`: the ants running between the slots and the picture
- `editor.ts`: what the shared editor checks for a forage level
- `levels/`: the level packs. `01-outlines` was drawn by hand; the rest come from `pnpm -F parlor forage:pictures`, which draws original pictures (flowers, fish, houses, planets, cats, owls and more) from seeded shape templates in `scripts/make-forage-pictures.ts`, outlines their objects so the insides start sealed, and checks every palette

Every deal comes from playing the picture out patiently (send a colony, let everything finish eating), so every level can be won that way. The solver, the tests and the difficulty measure play the same way; the game runs the same ticks on a timer. How hard a level is depends on its picture and its deal: `pnpm -F parlor forage:tune` tries many deals for each level, keeps the one whose careless-play win rate is closest to the level's target (about 88% at the start, easing toward 22%, with an easier breather every sixth level), and saves its `seed` and `wins` in the pack. It shares the levels out to worker processes (`--jobs`, all cores but one by default). Run it after adding, regenerating or moving levels.
