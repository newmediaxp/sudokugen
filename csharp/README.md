# Sudoku Gen C#

The C# projects of Sudoku Gen, in one Visual Studio solution ([NMX.SudokuGen.Library.sln](./NMX.SudokuGen.Library.sln)).

* [NMX.SudokuGen.Library](./NMX.SudokuGen.Library) — the C# library (`netstandard2.1`), published on
  [NuGet](https://www.nuget.org/packages/NMX.SudokuGen.Library)
* [NMX.SudokuGen.Cli](./NMX.SudokuGen.Cli) — the C# CLI app (`.NET 10`), published on
  [NuGet](https://www.nuget.org/packages/NMX.SudokuGen.Cli) as the .NET tool `sudokugen`, with Native AOT
  binaries also on [GitHub Releases](https://github.com/newmediaxp/sudokugen/releases)
* [NMX.SudokuGen.Tests](./NMX.SudokuGen.Tests) — the xUnit tests for the library
* [NMX.SudokuGen.SpecData](./NMX.SudokuGen.SpecData) — a dev tool that writes the shared test data in
  [spec/tests](../spec/tests) from the library; never packed or published

---

## Develop

Needs the .NET 10 SDK. Native AOT builds of the CLI also need the platform's C++ build tools.

```
dotnet test NMX.SudokuGen.Library.sln                    # build and run the tests
dotnet publish NMX.SudokuGen.Cli -c Release -r win-x64   # Native AOT CLI binary for one platform
dotnet pack NMX.SudokuGen.Cli -c Release -r win-x64      # the CLI's tool package for one platform
dotnet run --project NMX.SudokuGen.SpecData              # rewrite spec/tests from the library
```

* The library is the reference implementation: the other languages port its search, and the test data in
  [spec/tests](../spec/tests) came from it. `Core/SpecDataTests.cs` checks the library against that data,
  so a change that alters seeded output fails there, and is a spec change for every language.
* After such a deliberate change, `NMX.SudokuGen.SpecData` rewrites spec/tests to match (an optional argument
  writes to another folder instead). Without a seeded-output change it rewrites the files byte for byte, so
  `git diff` stays empty.
* On Windows, if the AOT link step can't find `vswhere.exe`, put `%ProgramFiles(x86)%\Microsoft Visual Studio\Installer`
  on the `PATH` first.

Releasing is in [RELEASING.md](../RELEASING.md#csharp).

---
