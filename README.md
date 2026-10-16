# Sudoku Gen

`sudoku` `C#` `dotnet` `library` `cli`

&copy; 2024-2026 New Media XP. Licensed under the [MIT License](./LICENSE).  
|
[website](https://www.newmediaxp.com)
|
[email](mailto:contact@newmediaxp.com)
|

---

## Description

Generates and solves sudoku puzzles from rank 2 (4×4) to rank 5 (25×25).
Every generated puzzle has exactly one solution, and a seed reproduces the same puzzle.

It comes as a library and as a command-line app. C# is available now;
versions in other languages will follow the shared [spec](./spec).

---

## Packages

| Language | Library                                                                                   | CLI                                                                        |
|----------|-------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| C#       | [NMX.SudokuGen.Library](https://www.nuget.org/packages/NMX.SudokuGen.Library) on NuGet    | binaries on [GitHub Releases](https://github.com/newmediaxp/sudokugen/releases) |

```
dotnet add package NMX.SudokuGen.Library
```

---

## Layout

* spec [(link)](./spec) — the shared spec: library API, puzzle code format, CLI, test data
* csharp [(link)](./csharp) — `NMX.SudokuGen.Library.sln`
    * NMX.SudokuGen.Library [(link)](./csharp/NMX.SudokuGen.Library) — `netstandard2.1` library
    * NMX.SudokuGen.Cli [(link)](./csharp/NMX.SudokuGen.Cli) — `.NET 10` CLI app
    * NMX.SudokuGen.Tests [(link)](./csharp/NMX.SudokuGen.Tests) — xUnit test suite

---

## Contact

* Link: <https://www.newmediaxp.com/contact>
* Email-1: <contact@newmediaxp.com>
* Email-2: <animaxneil@gmail.com>

---
