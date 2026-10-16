# Sudoku Gen

`sudoku` `csharp` `dotnet` `library` `cli`

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
* A seed reproduces the same puzzle.
* It can also check a board for conflicts and shuffle a puzzle into an equivalent one.

It comes as a library and as a command-line app. Versions in other languages are planned,
and they will follow the shared [spec](./spec).

---

## Contents

* [csharp](./csharp) — the C# library and CLI app, in one Visual Studio solution
    * [NMX.SudokuGen.Library](./csharp/NMX.SudokuGen.Library) — the C# library (`netstandard2.1`),
      published on [NuGet](https://www.nuget.org/packages/NMX.SudokuGen.Library)
    * [NMX.SudokuGen.Cli](./csharp/NMX.SudokuGen.Cli) — the C# CLI app (`.NET 10`),
      with binaries on [GitHub Releases](https://github.com/newmediaxp/sudokugen/releases)
    * [NMX.SudokuGen.Tests](./csharp/NMX.SudokuGen.Tests) — the xUnit tests for the C# library
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

CLI: download `SudokuGen-<platform>` from [GitHub Releases](https://github.com/newmediaxp/sudokugen/releases).
The examples call it `SudokuGen`.

```
SudokuGen create -r 3 -b 40 -s 777
SudokuGen solve 390560027.001809405.600172893.180257900.500643000.204081570.003096052.050328619.962010300
```

The [library README](./csharp/NMX.SudokuGen.Library) has the full API,
and the [CLI README](./csharp/NMX.SudokuGen.Cli) has every command and flag.

---

## Contact

* Link: <https://www.newmediaxp.com/contact>
* Email-1: <contact@newmediaxp.com>
* Email-2: <animaxneil@gmail.com>

---
