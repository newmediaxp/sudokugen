# Releasing

How the Sudoku Gen packages get published. This is for maintainers; the package READMEs cover using them.

---

## Pipeline

* The primary repo is on [GitLab](https://gitlab.com/newmediaxp/sudokugen). It push-mirrors to
  [GitHub](https://github.com/newmediaxp/sudokugen), where releases and CI run.
* The mirror makes GitHub's branches and tags match GitLab's, so it deletes a tag that exists only on GitHub,
  and a GitHub Release whose tag is deleted turns back into a draft. Create every tag in GitLab, never on GitHub.
* Publishing a GitHub Release runs [publish.yml](./.github/workflows/publish.yml). Every language shares it,
  so each job checks the release tag's prefix and only the matching language publishes.
* The registries trust that workflow through trusted publishing (OIDC), so no API keys are stored.
  Their trusted publishing settings name `publish.yml`: update them on NuGet and npm before renaming it.
* A manual run (Run workflow on the Actions page) runs every job. The registries skip versions they already have.

### Steps

1. Bump the version (see the language below) and commit it on main.
2. Tag that commit with the language's prefix and push both to GitLab, for example:

   ```
   git tag -a csharp-v1.2.0 -m "csharp 1.2.0"
   git push gitlab main csharp-v1.2.0
   ```

3. Wait until GitHub shows the tag. The mirror isn't instant.
4. On GitHub, create a Release, choose the existing tag from the tag list (don't type a new one, which would
   create the tag on GitHub), and publish it.
5. Check the run on the Actions page, then the package on its registry.

Tagging the bump commit itself also prevents an old mistake: a release made on GitHub before the bump commit had
mirrored built the old version, the registry skipped it as a duplicate, and the run still showed success.

---

## Versioning

Every package's version is `major.minor.patch`.

* `major.minor` is the shared spec feature set: packages with the same `major.minor` have the same features
  and give the same output for the same seed, whatever their language. A spec change bumps it in each
  language as that language implements the change.
* `patch` is per language: fixes, packaging and docs that leave the spec alone. So C# 1.1.1 and JS 1.1.0
  implement the same spec.

---

## csharp

* Tag: `csharp-v<version>`
* Version: `<Version>` in both [NMX.SudokuGen.Library.csproj](./csharp/NMX.SudokuGen.Library/NMX.SudokuGen.Library.csproj)
  and [NMX.SudokuGen.Cli.csproj](./csharp/NMX.SudokuGen.Cli/NMX.SudokuGen.Cli.csproj), kept equal.
* Jobs:
    * `publish-nuget` runs the tests, packs the library and pushes it to
      [NuGet](https://www.nuget.org/packages/NMX.SudokuGen.Library). The trusted publishing policy belongs to
      the NuGet user NewMediaXP. After the push it attaches `SudokuGenLib-netstandard2.1.zip` (the DLL, its XML
      docs and the license) to the release, for setups without NuGet such as Unity's `Assets/Plugins`.
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
* First version: npm can't trust a workflow for a package that doesn't exist yet, so 1.1.0 was published by hand
  from `js/nmx.sudokugen.library` (`npm login`, then `npm publish`, confirmed with 2FA).
* First release through CI: on the same day, add a trusted publisher in the package's settings on npmjs.com.
  npm deletes a new trusted publisher setting that no publish has used within 2 days, so don't add it earlier.
    * Publisher: GitHub Actions
    * Organization or user: `newmediaxp`, repository: `sudokugen`, workflow filename: `publish.yml`
    * Environment name: empty, since the job uses no GitHub environment. The label is optional.
    * Allowed actions: tick "Allow npm publish". Without it npm only lets the workflow stage a release for
      approval on the website, and the job's plain `npm publish` is refused. Leave "Allow npm dist-tag" unticked.

---
