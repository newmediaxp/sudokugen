# Releasing

How the Sudoku Gen packages get published. This is for maintainers; the package READMEs cover using them.

---

## Pipeline

* The primary repo is on [GitLab](https://gitlab.com/newmediaxp/sudokugen). It push-mirrors to
  [GitHub](https://github.com/newmediaxp/sudokugen), where releases and CI run.
* Publishing a GitHub Release runs [publish.yml](./.github/workflows/publish.yml). Every language shares it,
  so each job checks the release tag's prefix and only the matching language publishes.
* The registries trust that workflow through trusted publishing (OIDC), so no API keys are stored.
  Their trusted publishing settings name `publish.yml`: update them on NuGet and npm before renaming it.
* A manual run (Run workflow on the Actions page) runs every job. The registries skip versions they already have.

### Steps

1. Bump the version (see the language below) and commit it on main.
2. Push to GitLab, then wait until GitHub's main has that commit. The mirror isn't instant. A release tagged
   before the bump commit arrives builds the old version, the registry skips it as a duplicate, and the run
   still shows success while nothing new is published.
3. On GitHub, create a Release on that commit, tagged with the language's prefix (`csharp-v1.2.0`, `js-v1.2.0`),
   and publish it.
4. Check the run on the Actions page, then the package on its registry.

---

## csharp

* Tag: `csharp-v<version>`
* Version: `<Version>` in both [NMX.SudokuGen.Library.csproj](./csharp/NMX.SudokuGen.Library/NMX.SudokuGen.Library.csproj)
  and [NMX.SudokuGen.Cli.csproj](./csharp/NMX.SudokuGen.Cli/NMX.SudokuGen.Cli.csproj), kept equal.
* Jobs:
    * `publish-nuget` runs the tests, packs the library and pushes it to
      [NuGet](https://www.nuget.org/packages/NMX.SudokuGen.Library). The trusted publishing policy belongs to
      the NuGet user NewMediaXP.
    * `console-binaries` builds Native AOT binaries of the CLI for 7 platforms and attaches them to the release.

---

## js

* Tag: `js-v<version>`
* Version: `version` in [js/nmx.sudokugen.library/package.json](./js/nmx.sudokugen.library/package.json).
* Job: `publish-npm` runs `npm run check` in `js/`, then publishes the library to
  [npm](https://www.npmjs.com/package/nmx.sudokugen.library) with provenance.
* Once, before the first release: npm can't trust a workflow for a package that doesn't exist yet, so publish
  the first version by hand from `js/nmx.sudokugen.library` (`npm login`, then `npm publish`). Then, in the
  package's settings on npmjs.com, add a trusted publisher: user `newmediaxp`, repository `sudokugen`,
  workflow `publish.yml`.

---
