# Sudoku Gen Spec

The shared spec every language implementation follows. Not written yet.

This file will hold the whole written spec:

* the library API
* the puzzle code format
* the seeded random generator
* the `sudokugen` CLI commands, flags and output

---

## Test data

The `tests/` folder holds the test data every language's tests load. The C# library, the reference
implementation, produced it. Grids are puzzle codes (one character per square, `0` = blank, `.` between rows).

| File           | Each entry                                              | An implementation must                                                        |
|----------------|---------------------------------------------------------|-------------------------------------------------------------------------------|
| `random.json`  | `seed`, and `calls` as `[min, max, result]`             | return `result` from each `next(min, max)` in turn on a generator made from `seed`. It is .NET's seeded `System.Random` (Knuth's subtractive generator). |
| `create.json`  | `rank`, `blanks`, `seed`, `exhaustive`, `removed`, `puzzle`, `solution` | create exactly this `puzzle` and `solution`, with `removed` blanks, from these arguments. |
| `shuffle.json` | `input`, `seed`, `puzzle`, `solution`                   | solve `input`, shuffle the result with `seed`, and get exactly this `puzzle` and `solution`. |
| `solve.json`   | `input`, `solution`                                     | solve `input` to `solution`, or fail when `solution` is `null`.               |

Used by: the C# tests ([SpecDataTests.cs](../csharp/NMX.SudokuGen.Tests/Core/SpecDataTests.cs))
and the JS tests ([spec.test.ts](../js/nmx.sudokugen.library/test/spec.test.ts)).
A change that alters seeded output fails both, so it is a spec change for every language.
