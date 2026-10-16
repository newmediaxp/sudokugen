# Sudoku Gen JS

The JavaScript packages of Sudoku Gen, written in TypeScript, in one npm workspace.

* [nmx.sudokugen.library](./nmx.sudokugen.library) — the JS library, published on
  [npm](https://www.npmjs.com/package/nmx.sudokugen.library)

---

## Develop

Needs Node.js 22.18 or later (see `.node-version`): the tests run the TypeScript sources directly, without a build.

```
npm install
npm run check      # prettier check, typecheck, tests
npm run format     # prettier --write
npm run build      # emits each package's dist/ (also run by npm pack and npm publish)
```

* The library is a port of the [C# library](../csharp/NMX.SudokuGen.Library). The internal `Solver` keeps the C# method
  names in lower camel case, so a change to the C# search ports over line by line.
* Seeds follow .NET's `System.Random`, so the same seed gives the same puzzle in both languages.
  `test/spec.test.ts` checks this against the data in [spec/tests](../spec/tests), which the C# library produced.

Releasing is in [RELEASING.md](../RELEASING.md#js).

---
