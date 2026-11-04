![SudokuGen](https://raw.githubusercontent.com/newmediaxp/sudokugen/main/icon.png)

# SudokuGen for Unity

`sudoku` `csharp` `unity` `library` `dll`

&copy; 2024-2026 New Media XP. Licensed under the [MIT License](https://github.com/newmediaxp/sudokugen/blob/main/LICENSE).  
|
[website](https://www.newmediaxp.com)
|
[email](mailto:contact@newmediaxp.com)
|

---

## Description

The C# [SudokuGen library](https://www.nuget.org/packages/NMX.SudokuGen.Library) as a Unity package. It creates and
solves sudoku puzzles, from rank 2 (4×4) up to rank 5 (25×25).

* Every created puzzle has exactly one solution.
* A seed reproduces the same puzzle, in every language.
* It can also check a board for conflicts and shuffle a puzzle into an equivalent one.

The package holds the library's prebuilt `netstandard2.1` DLL and its XML docs, so it needs Unity 2021.2 or later.
Its version is the version of the NuGet package the DLL comes from.

---

## Install

From [OpenUPM](https://openupm.com/packages/com.newmediaxp.sudokugen), with the OpenUPM CLI:

```
openupm add com.newmediaxp.sudokugen
```

Or without the CLI: in Project Settings > Package Manager, add a scoped registry with the URL
`https://package.openupm.com` and the scope `com.newmediaxp`. Then, in the Package Manager window,
add the package by name: `com.newmediaxp.sudokugen`.

---

## Use

```csharp
using NMX.SudokuGen.Library.Core;

Sudoku a_sudoku = Sudoku.Create(3, 40, 777);       // rank 3 (9×9), up to 40 blanks, seed 777
string a_code   = Utility.GetPuzzleCode(a_sudoku.Puzzle);
Sudoku a_solved = Sudoku.Solve(a_sudoku.Puzzle);   // throws unless the puzzle has exactly one solution
```

The [library README](https://github.com/newmediaxp/sudokugen/tree/main/csharp/NMX.SudokuGen.Library) has the full API.

---

## Contact

* Link: <https://www.newmediaxp.com/contact>
* Email-1: <contact@newmediaxp.com>
* Email-2: <animaxneil@gmail.com>

---
