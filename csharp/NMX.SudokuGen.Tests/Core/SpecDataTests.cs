// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

namespace NMX.SudokuGen.Tests.Core;
using System.Text.Json;
using NMX.SudokuGen.Library.Core;
using static NMX.SudokuGen.Library.Core.Utility;

// checks the library against the shared test data in spec/tests, which every language's tests load:
// the same seed must give the same random numbers, puzzles and shuffles in every language
public sealed class SpecDataTests
{
    public sealed record RandomCase(int Seed, int[][] Calls)
    {
        public override string ToString() => $"seed {Seed}";
    }

    public sealed record CreateCase(int Rank, int Blanks, int Seed, bool Exhaustive, int Removed, string Puzzle, string Solution)
    {
        public override string ToString() => $"rank {Rank}, blanks {Blanks}, seed {Seed}{(Exhaustive ? ", exhaustive" : "")}";
    }

    public sealed record ShuffleCase(string Input, int Seed, string Puzzle, string Solution)
    {
        public override string ToString() => $"seed {Seed}, input {Input}";
    }

    public sealed record SolveCase(string Input, string? Solution)
    {
        public override string ToString() => Input;
    }

    private static readonly JsonSerializerOptions jsonOptions = new(JsonSerializerDefaults.Web);

    // the csproj copies spec/tests next to the test assembly
    private static T[] Load<T>(in string p_name) => JsonSerializer.Deserialize<T[]>(
        File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "spec", "tests", p_name)), jsonOptions)!;

    public static TheoryData<RandomCase> RandomCases => new(Load<RandomCase>("random.json"));
    public static TheoryData<CreateCase> CreateCases => new(Load<CreateCase>("create.json"));
    public static TheoryData<ShuffleCase> ShuffleCases => new(Load<ShuffleCase>("shuffle.json"));
    public static TheoryData<SolveCase> SolveCases => new(Load<SolveCase>("solve.json"));

    [Theory]
    [MemberData(nameof(RandomCases))]
    public void Random_SameSeed_DrawsSpecNumbers(RandomCase p_case)
    {
        // each call is [min, max, result]
        Random a_random = new(p_case.Seed);
        int[] a_expected = [.. p_case.Calls.Select(p_call => p_call[2])];
        int[] a_actual = [.. p_case.Calls.Select(p_call => a_random.Next(p_call[0], p_call[1]))];
        Assert.Equal(a_expected, a_actual);
    }

    [Theory]
    [MemberData(nameof(CreateCases))]
    public void Create_SameArguments_GiveSpecPuzzle(CreateCase p_case)
    {
        Sudoku a_sudoku = Sudoku.Create(p_case.Rank, p_case.Blanks, p_case.Seed, p_case.Exhaustive);
        Assert.Equal(p_case.Puzzle, GetPuzzleCode(a_sudoku.Puzzle));
        Assert.Equal(p_case.Solution, GetPuzzleCode(a_sudoku.Solution));
        Assert.Equal(p_case.Removed, a_sudoku.Removed);
    }

    [Theory]
    [MemberData(nameof(ShuffleCases))]
    public void Shuffle_SameSeed_GivesSpecVariant(ShuffleCase p_case)
    {
        Sudoku a_shuffled = Sudoku.Solve(GetPuzzleArr(p_case.Input)).Shuffle(p_case.Seed);
        Assert.Equal(p_case.Puzzle, GetPuzzleCode(a_shuffled.Puzzle));
        Assert.Equal(p_case.Solution, GetPuzzleCode(a_shuffled.Solution));
    }

    [Theory]
    [MemberData(nameof(SolveCases))]
    public void Solve_GivesSpecSolution_OrThrowsWhenNone(SolveCase p_case)
    {
        int[] a_puzz = GetPuzzleArr(p_case.Input);
        if (p_case.Solution is null) Assert.Throws<InvalidOperationException>(() => Sudoku.Solve(a_puzz));
        else Assert.Equal(p_case.Solution, GetPuzzleCode(Sudoku.Solve(a_puzz).Solution));
    }
}
