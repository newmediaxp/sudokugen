![Sudoku Gen](https://raw.githubusercontent.com/newmediaxp/sudokugen/main/icon.png)

# Sudoku Gen Library

`sudoku` `javascript` `typescript` `library` `npm`

&copy; 2024-2026 New Media XP. Licensed under the [MIT License](https://github.com/newmediaxp/sudokugen/blob/main/LICENSE).  
|
[website](https://www.newmediaxp.com)
|
[email](mailto:contact@newmediaxp.com)
|

---

## Description

A library written in TypeScript to generate and solve sudoku puzzles, from rank 2 (4×4) up to rank 5 (25×25).

* Every created puzzle has exactly one solution.
* A seed reproduces the same puzzle, and gives the same puzzle as the
  [C# library](https://www.nuget.org/packages/NMX.SudokuGen.Library) does for that seed.
* It can also check a board for conflicts and shuffle a puzzle into an equivalent one.

It ships as plain ES modules with type declarations and has no dependencies,
so it runs in browsers, Node.js, Deno and Bun.

---

## Install

```
npm install nmx.sudokugen.library
```

In a browser without a bundler, import it from a CDN:

```js
import { Sudoku } from "https://cdn.jsdelivr.net/npm/nmx.sudokugen.library@1/+esm";
```

---

## API

```js
import { Sudoku, Conflict, getPuzzleCode } from "nmx.sudokugen.library";

const a_sudoku = Sudoku.create(3, 40);                // rank 3 (9×9), up to 40 blanks
const a_seeded = Sudoku.create(3, 40, { seed: 777 }); // the same seed gives the same puzzle
const a_solved = Sudoku.solve(a_sudoku.puzzle);       // throws unless the puzzle has exactly one solution
const a_code   = getPuzzleCode(a_sudoku.puzzle);      // e.g. "390560027.001809405...."

const a_board = [...a_sudoku.puzzle];                 // the board being played
a_board[0] = 5;
if (a_sudoku.findConflicts(a_board, 0) & Conflict.Row) console.log("5 is already in the row");
```

### `Sudoku`

Immutable puzzle/solution pair. Grids are flat, row-by-row arrays of `squares` values, `0` = blank.
Get one from `Sudoku.create`, `Sudoku.solve` or `shuffle`; the constructor is private.

#### Methods

| Member          | Signature                                                                 | Description |
|-----------------|---------------------------------------------------------------------------|-------------|
| `create`        | `static create(rank, blanks, { seed?, exhaustive? } = {}): Sudoku`         | New random puzzle with a unique solution. `blanks = Sudoku.maxBlanks` (-1) requests as many as possible. `seed` (any 32-bit integer) reproduces the puzzle. `exhaustive` skips the search budget for an exact blank count (can run very long at high ranks). |
| `solve`         | `static solve(puzzle: ArrayLike<number>): Sudoku`                          | Solves a puzzle, rank inferred from its length. Takes arrays and typed arrays. Throws if the input is invalid, conflicting, or has no unique solution. |
| `shuffle`       | `shuffle(seed?: number): Sudoku`                                           | Returns an equivalent variant (same rank, difficulty and blank count, different look). The original is untouched. The same seed gives the same variant. |
| `findConflicts` | `findConflicts(board, index, input = board[index], excludeIndex = true): number` | Which of `index`'s units already hold `input`, as `Conflict` flags. Leave out `input` to check the value placed at `index`, or pass one to test a candidate before placing it. `excludeIndex = true` ignores the square's current value; `false` searches it too. A blank `input` (`0`) never conflicts. |

#### Properties

| Member                | Type                | Description                                                              |
|-----------------------|---------------------|--------------------------------------------------------------------------|
| `puzzle`              | `readonly number[]` | The puzzle grid, `0` = blank. Frozen: copy it (`[...puzzle]`) to edit.   |
| `solution`            | `readonly number[]` | The unique completed solution. Frozen.                                   |
| `removed`             | `number`            | Actual blank count (can be less than `blanks` when more would break uniqueness). |
| `rank`                | `number`            | Segment size, 2 (4×4) to 5 (25×25).                                      |
| `rows`                | `number`            | Squares per row, column and segment (`rank²`).                           |
| `squares`             | `number`            | Total squares (`rows²`).                                                 |
| `remove`              | `number`            | Requested blank count (the `blanks` argument to `create`, or `squares` for `maxBlanks`). |
| `minRank` / `maxRank` | `static number`     | Allowed rank bounds, `2` and `5`.                                        |
| `maxBlanks`           | `static number`     | Sentinel for `create`'s `blanks`: `-1` means "as many as possible".      |

### `Conflict`

Frozen bit flags, returned by `findConflicts`. Test them with `&`.

| Value     | Meaning                                  |
|-----------|------------------------------------------|
| `None`    | No conflict (`0`).                       |
| `Row`     | Value repeats in the row (`1`).          |
| `Column`  | Value repeats in the column (`2`).       |
| `Segment` | Value repeats in the segment, or box (`4`). |

A square that is rule-clean but still wrong (`board[i] !== solution[i]`) returns `None`, so compare against `solution` to catch those.

### Puzzle codes

| Function        | Signature                                         | Description                                                                                             |
|-----------------|---------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| `getPuzzleCode` | `getPuzzleCode(grid: ArrayLike<number>): string`  | Encodes a grid as a puzzle code: one char per square (`0` blank, `1`-`9`, `A` = 10…), `.` between rows. |
| `getPuzzleArr`  | `getPuzzleArr(code: string): number[]`            | Parses a puzzle code back into a grid array; unrecognised characters are ignored.                       |

### Notes

* **Errors** — `create`, `shuffle` and `findConflicts` throw a `RangeError` for an argument outside its range,
  such as a rank of 6 or a seed that isn't a 32-bit integer. `solve` throws an `Error` for any puzzle it can't solve
  uniquely, with the reason in the message.
* **Speed** — every call is synchronous. On a desktop machine a rank 3 create takes about a millisecond,
  a rank 4 create with `maxBlanks` around a tenth of a second, and a rank 5 create several seconds.
  In a browser, run rank 4 and 5 creates in a [Web Worker](https://developer.mozilla.org/docs/Web/API/Web_Workers_API)
  so the page stays responsive:

  ```js
  // sudoku-worker.js, started with new Worker("sudoku-worker.js", { type: "module" })
  import { Sudoku } from "nmx.sudokugen.library";

  self.onmessage = (p_event) => {
      const a_sudoku = Sudoku.create(p_event.data.rank, p_event.data.blanks);
      self.postMessage({ puzzle: a_sudoku.puzzle, solution: a_sudoku.solution });
  };
  ```

* **State** — instances share no state, so any number of them can be created and used independently.

---

## Details

* Dependencies

    * None. Needs an ES2022 runtime: current browsers, Node.js 20 or later, Deno, Bun.

* Other languages

    * C# library: [NMX.SudokuGen.Library](https://www.nuget.org/packages/NMX.SudokuGen.Library)

* Downloads

    * [npm](https://www.npmjs.com/package/nmx.sudokugen.library)

* Source

    * [GitHub](https://github.com/newmediaxp/sudokugen/tree/main/js/nmx.sudokugen.library)

---

## Contact

* Link: <https://www.newmediaxp.com/contact>
* Email-1: <contact@newmediaxp.com>
* Email-2: <animaxneil@gmail.com>

---
