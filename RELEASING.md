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
    * `cli-aot` builds Native AOT binaries of the CLI for 7 platforms, attaches them to the release, and packs
      each platform's tool package on that platform (Native AOT can't cross-compile between operating systems).
    * `publish-cli-tool` runs once all 7 succeed. It packs the framework-dependent `any` fallback and the
      pointer package, then pushes the CLI to [NuGet](https://www.nuget.org/packages/NMX.SudokuGen.Cli) as the
      .NET tool `NMX.SudokuGen.Cli`: the platform packages first, the pointer last, so installs never find
      a missing platform package.
* Before the first release with the CLI tool: on nuget.org, check that the trusted publishing policy's scope
  allows new packages and covers `NMX.SudokuGen.Cli`, or the push of the new package id is refused.

---

## js

* Tag: `js-v<version>`
* Version: `version` in [js/nmx.sudokugen.library/package.json](./js/nmx.sudokugen.library/package.json).
* Job: `publish-npm` runs `npm run check` in `js/`, then publishes the library to
  [npm](https://www.npmjs.com/package/nmx.sudokugen.library) with provenance.
* First version: npm can't trust a workflow for a package that doesn't exist yet, so publish it by hand
  from `js/nmx.sudokugen.library` (`npm login`, then `npm publish`).
* First release through CI: on the same day, add a trusted publisher in the package's settings on npmjs.com
  (organization or user `newmediaxp`, repository `sudokugen`, workflow filename `publish.yml`, the rest blank).
  npm deletes a new trusted publisher setting that no publish has used within 2 days, so don't add it earlier.
  Once that run has published, set the package's Publishing access to "Require two-factor authentication
  and disallow tokens", so only CI can publish.

---
