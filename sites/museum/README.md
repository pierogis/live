# museum

a room for games

```sh
pnpm -F museum dev      # http://localhost:5179
pnpm -F museum test     # engine and level tests
pnpm -F museum check    # svelte-check
pnpm -F museum levels   # check every level and print its stats
pnpm -F museum murals   # draw both games' murals into their pack files (a name draws one; --look <dir> saves images; --dry writes nothing)
pnpm -F museum forage:tune      # pick each forage level's deal to hit its difficulty
```

## layout

Each game lives in `src/lib/<game>/`, is listed in `src/lib/games.ts` for the home page, and has its own small route tree, `src/routes/<game>/`: `/<game>`, the game's murals with a button to resume where you were, and `/<game>/<level id>`. The routes import the game's modules directly, so SvelteKit preloads them with the page and the board is playable as soon as it hydrates; their server loads are shared in `src/lib/shared/pages.server.ts`. Every level has its own prerendered page (`/<game>/<level id>`, so a link keeps its picture when packs are added) with its board and starting state already in the HTML. Progress is saved in one small cookie per game (`museum-<game>`: the level you're on, the pictures you've cleared, sound and the game's options, like mosaic's bigger tray), so the server can mark cleared pictures and link back to your level before the page loads. A level in progress is kept in the tab's session storage while the page is hidden or left, so a reload (a phone dropping a backgrounded tab, or the dev server reconnecting) picks it up where you were. Boards size themselves in CSS from the row's width and the small viewport height, rounded to whole pixels. The games use the site's look from `@pierogis/utensils`: `border inset link-box` buttons, 2px inset rings, Courier for labels, no narration, no hints and no pop-ups; a move that can't go gets a still outline, and a finished or stuck level says so in a panel under the board. A game's rules sit in plain TypeScript with no DOM and `.ts` imports, so the page, the node tests in `test/` and the scripts in `scripts/` all run the same code.

`src/lib/shared/` holds what the games share:

- `engine.ts`: seeded random numbers, shuffles and reading a level's picture
- `level.ts` and `levels.ts`: the picture and pack types, and turning a game's `levels/*.json` files into packs
- `save.ts`: the save cookie
- `difficulty.ts`: the 1 to 5 difficulty labels
- `palette.ts` (checks that a picture's colors are easy to tell apart), `ink.ts` (black or white text on a color), `art.ts` (draws a level as a small picture) and `sound.ts`
- `game/`: a level's life on its page (`level.svelte.ts`), the title bar with the level's name, difficulty and ✓ mark, and undo, restart, sound and the murals (`GameBar.svelte`), the previous and next picture under the board (`LevelNav.svelte`), the panel for a finished or stuck level (`LevelEnd.svelte`), difficulty dots (`Pips.svelte`), short still marks (`cue.svelte.ts`), animated sprites and the page styles around the board. The board and the tray or slots under it are one utensils `Card`, styled for games in `stage.css`.
- `Murals.svelte`: a game's murals, its home page
- `checks.ts` (the picture checks every game starts from) and `rules.ts` (what `pnpm -F museum levels` needs from a game)

A new game brings its engine, its component, its murals, a `save.ts` and a `rules.ts` with its level checks, plus one entry in `src/lib/games.ts`. `pnpm -F museum levels` and the tests find it from there.

`scripts/` holds the level check (`check-levels.ts`), the mural maker (`make-murals.ts`: the drawing grid and panel cutting in `scripts/murals/`, and one file per mural in `scripts/murals/<game>/`), `tune-forage.ts`, and `write-pack.ts`, which writes a pack file formatted the way Prettier would. `test/levels.ts` reads the packs from disk for the tests and scripts.

## mosaic

Lift dots off a picture, sort them by color, and fill the picture back in. The rules are at the top of `src/lib/mosaic/engine.ts`.

- `engine.ts`: rules, shuffle and solver
- `Mosaic.svelte`: the game: board, tray, zoom and pan, forgiving taps
- `flights.ts`: dots flying between the board and the tray
- `report.ts`: one level's checks and stats, for `pnpm -F museum levels` and `pnpm -F museum murals`
- `rules.ts`: a mosaic level's line in `pnpm -F museum levels`
- `levels/`: the level packs. Every pack is a mural: one big picture, after a famous old artwork, cut into panels that are each a level (`"mural": { "cols": n }` in the pack file gives the panels per row). Packs play in file name order, easiest first (see below): the first murals have small panels (18 by 16 dots) in a few flat colors, the last ones 24 by 22 in up to 14. No color covers more than half of a panel, and every pair of colors is easy to tell apart. A pack's `"song"` gives its panels one theme and one set of notes. The pack files are written by `pnpm -F museum murals` from `scripts/murals/mosaic/`: each mural is a file that paints one big grid of color letters with shapes and formulas (`canvas.ts`), and names its panels and their songs. To change a mural, change its file and run the command; a test checks that every pack file is what its script draws.

A level can't get stuck: lifting dots to the tray uncovers as many spots as it fills, so open spots always match the dots in the tray, and one of them always fits. Difficulty is effort and planning instead: how many dots and colors there are, how broken up the picture is, and how the scattered blobs compare to the tray. A level's tray grows with its picture, about a slot for every 14 dots (20 for the small first murals, about 35 for the big late ones), so a bigger picture isn't harder for its size alone (`trayFor` in `engine.ts`); every level is built and proven with its own, and the bigger-tray option doubles it. How hard a level is comes from its `difficulty`, 0 to 1: its mural's (set in its script and saved in its pack), unless its panel sets its own, never its place in play. It sets how big the scattered blobs are, from 10 to 28 dots at 0, which often fit the tray whole, to 16 to 48 at 1, which rarely do (`blobSizes`); how often a blob joins a same-colored blob in the next color area, so the two lift as one group: always at 0, so even a busy picture scrambles into fewer, bigger groups with few lone dots, and never at 1, so its small areas leave many lone dots to hunt for (`joinFor`; a blob always keeps to its own color area, so lifting it opens one clean patch); and it tightens the tray a little. The murals play in the order they measure. Each panel's score comes from a quick player rather than the solver's best path, since the game is about seeing and tapping quickly (`quickPlay` in `report.ts`): it fills the tray first, tapping whatever catches the eye (big groups before lone dots), then once the tray is full looks past groups until it finds one that can go home, and empties the tray only at a wall: when nothing on the board can go home, or nearly all the open spots are colors in the tray. The score is its taps plus the groups it looked past, so lone dots you need are what cost the most. The scores are combined per mural in a power mean (`muralScore` in `report.ts`), so one very hard panel among easy ones ranks the mural above all-fairly-easy ones but below all-medium ones. `pnpm -F museum murals` numbers the pack files in that order, so a new mural goes where its panels put it and no level changes how it plays; a test checks the files are in order.

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

`pnpm -F museum levels` fails when a picture has two colors that look alike, two levels of a game share an id, a mosaic level can't be solved with its own tray, or a forage level can't be dealt. `--order` also prints mosaic's levels from easiest to hardest, and `--measure` plays every forage level (minutes) instead of trusting the win share `forage:tune` saved.

## forage

Ant colonies eat a pixel picture away. Tap the front colony of a column and it goes to work in one of 5 slots, and its first ant leaves right away. A working colony sends one ant every 0.2s to the first exposed food of its color that no ant is heading for yet (bottom row first, left to right); its number counts down as they leave, and it frees its slot as soon as it has sent its last one. Exposed means a side touches empty space that reaches the outside; sealed holes don't count. Each ant finds its way through the grid: out of its slot's door below the picture, around the outside edge and in through cleared space, and the length of that walk is how long it takes, so food deep in a tunnel takes longer to reach and to uncover what's behind it. Food it uncovers can be claimed on a later dispatch. A colony with nothing in reach just waits in its slot, so with every slot busy nothing more can go out. Clear the picture to win. The game doesn't narrate or preview: a tap that can't go outlines what's in the way. The rules are at the top of `src/lib/forage/engine.ts`.

Later levels add linked groups of 2 to 4 colonies (each group ringed in its own color and joined by a rail of that color, which keeps to the gaps between lanes and the strip above them; a lane's count gets a ring in the color of each group it hides; they go out together once each is at the front of its column or right behind another member there (members in one column sit back to back and leave as one stack), and stay linked in their slots: none leaves until all have sent their ants), locks (a tile in a column, ringed in a marker color, in front of the colonies it holds back; once it reaches the front the column waits until the key in the picture, ringed in the same color, touches the outside), mystery colonies (grey, color hidden until they reach the front; from halfway through play often stacked behind a linked partner), and, from about 60% of the way through in a little over half the levels, food dispensers (a tile in place of a food, ringed in the text color, showing the color it hands out and how many more: whenever food of that color is eaten anywhere, it puts a new one in its place at once, so eating it uncovers nothing; it switches color after set amounts without showing what's next, and once empty its tile is empty space).

Each level has a difficulty index from 1 (Easy) to 5 (Very hard), shown in the title and on the murals page. It comes from `wins`, the share of games won by the best of four players (a look-ahead player, two that follow the rule of thumb "send colonies that finish, park only when you must", and careless random play), capped by the level's cruxes: short stretches where only a few sends still win. A level needs rule breaks (moments where every send that would finish loses, so you must park on purpose) spread across the game to rate 4 or 5. `forage:tune` measures both and saves them with the level (`difficulty.ts`, `cruxes.ts`).

- `engine.ts`: rules, the deal of colonies and solver
- `Forage.svelte`: the game
- `report.ts`: plays a deal many times with several players (`player.ts`) to measure how hard it is
- `cruxes.ts`: walks a winning line with the solver and finds its cruxes and rule breaks
- `ants.ts`: the ants running between the slots and the picture
- `rules.ts`: a forage level's line in `pnpm -F museum levels`
- `levels/`: the level packs. Every pack is a mural, as in Mosaic, after an old artwork of its own (Mosaic's aren't reused), drawn by `pnpm -F museum murals` from `scripts/murals/forage/`. Forage's panels are bigger than Mosaic's and grow through play, and they're drawn for how Forage plays: dark outlines that seal shapes in, lone single foods, and patterns where colors interleave. Pictures stay at most 40 wide, so a phone still shows each food at 8px or more. A redraw keeps the tuned deal of every panel whose picture comes out the same; to preview one mural while drawing it, run `node scripts/murals/forage/look.ts <file> <first level> <dir>`.

A level's place in play sets how hard it's dealt: how far it sits between the five teaching levels and `LAST_LEVEL` in `engine.ts` (a test keeps that at the last level, so set it when murals are added). Colonies grow with the picture, so a level takes about 25 sends at the start of play and 40 at the end however big its picture is, with sizes spread from a handful of ants to a crowd.

Every deal comes from playing the picture out patiently (send a colony, let everything finish eating), so every level can be won that way. The solver, the tests and the difficulty measure play the same way; the game runs the same ticks on a timer. `pnpm -F museum forage:tune` sets how hard each level is: it tries many seeds, and placements of the colonies in the columns, for the deal closest to the level's target (100% wins and no cruxes for the first five levels, falling to 20% with several spread-out cruxes by the last level, with an easier breather every sixth level). It saves `seed`, `deal`, `wins`, `breaks`, `cruxes`, `spread` and, when needed, a `push` to the difficulty ramp and late pressure (`tuning.late`) in the pack. It shares the levels out to worker processes (`--jobs`, all cores but one by default). Run it after adding, regenerating or moving levels.
