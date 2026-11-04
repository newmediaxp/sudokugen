![Sudoku Gen](./icon.png)

# Sudoku Gen

`sudoku` `csharp` `dotnet` `unity` `javascript` `typescript` `library` `cli`

&copy; 2024-2026 New Media XP. Licensed under the [MIT License](./LICENSE).  
|
[website](https://www.newmediaxp.com)
|
[email](mailto:contact@newmediaxp.com)
|

---

## Description

Sudoku Gen creates and solves sudoku puzzles, from rank 2 (4×4) up to rank 5 (25×25).

* Every created puzzle has exactly one solution.
* A seed reproduces the same puzzle, in every language.
* It can also check a board for conflicts and shuffle a puzzle into an equivalent one.

It comes as a C# library (also packaged for Unity) and command-line app, and as a JS library. Versions in more languages are planned,
and they all follow the shared [spec](./spec).

---

## Used in

* [Sudoku Gen web app](https://www.newmediaxp.com/app/sudokugen) — create, solve, play and share puzzles in the browser
* [Shaolin Sudoku](https://www.newmediaxp.com/blog/article/shaolin-sudoku) — a sudoku game, on itch.io and Game Jolt

---

## Contents

* [csharp](./csharp) — the C# library and CLI app, in one Visual Studio solution
    * [NMX.SudokuGen.Library](./csharp/NMX.SudokuGen.Library) — the C# library (`netstandard2.1`),
      published on [NuGet](https://www.nuget.org/packages/NMX.SudokuGen.Library)
    * [NMX.SudokuGen.Cli](./csharp/NMX.SudokuGen.Cli) — the C# CLI app (`.NET 10`), published on
      [NuGet](https://www.nuget.org/packages/NMX.SudokuGen.Cli) as the .NET tool `sudokugen`,
      with standalone binaries on [GitHub Releases](https://github.com/newmediaxp/sudokugen/releases)
    * [NMX.SudokuGen.Tests](./csharp/NMX.SudokuGen.Tests) — the xUnit tests for the C# library
* [unity/com.newmediaxp.sudokugen](./unity/com.newmediaxp.sudokugen) — the C# library as a Unity package (its DLL,
  Unity 2021.2+), published on [OpenUPM](https://openupm.com/packages/com.newmediaxp.sudokugen)
* [javascript](./javascript) — the JS packages, in one npm workspace
    * [nmx.sudokugen.library](./javascript/nmx.sudokugen.library) — the JS library (TypeScript, ES modules),
      published on [npm](https://www.npmjs.com/package/nmx.sudokugen.library)
* [spec](./spec) — the shared spec every language follows: library API, puzzle code format,
  CLI and test data (in progress)

---

## Quick start

### csharp

Library: install it from NuGet.

```
dotnet add package NMX.SudokuGen.Library
```

```csharp
using NMX.SudokuGen.Library.Core;

Sudoku a_sudoku = Sudoku.Create(3, 40, 777);       // rank 3 (9×9), up to 40 blanks, seed 777
string a_code   = Utility.GetPuzzleCode(a_sudoku.Puzzle);
Sudoku a_solved = Sudoku.Solve(a_sudoku.Puzzle);   // throws unless the puzzle has exactly one solution
```

CLI: install it as a .NET tool from NuGet, or download a standalone `SudokuGen-<platform>` binary
from [GitHub Releases](https://github.com/newmediaxp/sudokugen/releases).

```
dotnet tool install -g NMX.SudokuGen.Cli
```

```
sudokugen create -r 3 -b 40 -s 777
sudokugen solve 390560027.001809405.600172893.180257900.500643000.204081570.003096052.050328619.962010300
```

Unity: install the library from OpenUPM. The [Unity README](./unity/com.newmediaxp.sudokugen) also covers
installing without the OpenUPM CLI.

```
openupm add com.newmediaxp.sudokugen
```

The [library README](./csharp/NMX.SudokuGen.Library) has the full API,
and the [CLI README](./csharp/NMX.SudokuGen.Cli) has every command and flag.

### javascript

Library: install it from npm.

```
npm install nmx.sudokugen.library
```

```js
import { Sudoku, getPuzzleCode } from "nmx.sudokugen.library";

const a_sudoku = Sudoku.create(3, 40, { seed: 777 }); // the same puzzle as the C# example above
const a_code   = getPuzzleCode(a_sudoku.puzzle);
const a_solved = Sudoku.solve(a_sudoku.puzzle);       // throws unless the puzzle has exactly one solution
```

The [library README](./javascript/nmx.sudokugen.library) has the full API.

---

## Contact

* Link: <https://www.newmediaxp.com/contact>
* Email-1: <contact@newmediaxp.com>
* Email-2: <animaxneil@gmail.com>

---
