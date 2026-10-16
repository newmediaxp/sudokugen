# Sudoku Gen C#

The C# projects of Sudoku Gen, in one Visual Studio solution ([NMX.SudokuGen.Library.sln](./NMX.SudokuGen.Library.sln)).

* [NMX.SudokuGen.Library](./NMX.SudokuGen.Library) — the C# library (`netstandard2.1`), published on
  [NuGet](https://www.nuget.org/packages/NMX.SudokuGen.Library)
* [NMX.SudokuGen.Cli](./NMX.SudokuGen.Cli) — the C# CLI app (`.NET 10`), with Native AOT binaries on
  [GitHub Releases](https://github.com/newmediaxp/sudokugen/releases)
* [NMX.SudokuGen.Tests](./NMX.SudokuGen.Tests) — the xUnit tests for the library

---

## Develop

Needs the .NET 10 SDK. Native AOT builds of the CLI also need the platform's C++ build tools.

```
dotnet test NMX.SudokuGen.Library.sln                    # build and run the tests
dotnet publish NMX.SudokuGen.Cli -c Release -r win-x64   # Native AOT CLI binary for one platform
```

* The library is the reference implementation: the other languages port its search, and the test data in
  [spec/tests](../spec/tests) came from it. `Core/SpecDataTests.cs` checks the library against that data,
  so a change that alters seeded output fails there, and is a spec change for every language.
* On Windows, if the AOT link step can't find `vswhere.exe`, put `%ProgramFiles(x86)%\Microsoft Visual Studio\Installer`
  on the `PATH` first.

---

## Release

1. Bump `<Version>` in both csprojs (Library and Cli) and commit.
2. Wait until GitHub's main has that commit (GitLab mirrors it there), then create a GitHub Release
   tagged `csharp-v<version>` (e.g. `csharp-v1.2.0`) on it. The jobs in
   [publish.yml](../.github/workflows/publish.yml) run the tests, push the library to NuGet through
   trusted publishing, and attach the CLI binaries for 7 platforms to the release.

---
