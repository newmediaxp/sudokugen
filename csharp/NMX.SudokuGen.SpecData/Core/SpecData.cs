// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

namespace NMX.SudokuGen.SpecData.Core;

using Library.Core;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Encodings.Web;
using System.Text.Json;

// writes the shared test data in spec/tests from the library, the reference implementation.
// run it only after a deliberate change to seeded output: that is a spec change for every language
public static class SpecData
{
    private const string usage = "usage: NMX.SudokuGen.SpecData [output folder]   (default: the repo's spec/tests)",
        known = "390560027.001809405.600172893.180257900.500643000.204081570.003096052.050328619.962010300";

    // the csproj sets it to the repo's spec/tests at build time
    private static readonly string dftOutDir = typeof(SpecData).Assembly.GetCustomAttributes<AssemblyMetadataAttribute>()
        .First(p_attr => p_attr.Key == "SpecTestsDir").Value!;

    private static readonly JsonSerializerOptions jsonOptions = new() { Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping };

    public static int Main(string[] p_args)
    {
        if (p_args.Length > 1) { Console.Error.WriteLine(usage); return 1; }
        string a_outDir = Path.GetFullPath(p_args.Length == 1 ? p_args[0] : dftOutDir);
        _ = Directory.CreateDirectory(a_outDir);
        Console.WriteLine($"writing to {a_outDir}");
        WriteRandom(a_outDir);
        WriteCreate(a_outDir);
        WriteShuffle(a_outDir);
        WriteSolve(a_outDir);
        return 0;
    }

    // one compact JSON object per line
    private static void Write(in string p_outDir, in string p_name, IEnumerable<object> p_rows)
    {
        string a_body = string.Join(",\n", p_rows.Select(p_row => "  " + JsonSerializer.Serialize(p_row, jsonOptions)));
        File.WriteAllText(Path.Combine(p_outDir, p_name), "[\n" + a_body + "\n]\n");
        Console.WriteLine($"wrote {p_name}");
    }

    // .NET's seeded Random, drawn with Next(min, max) over a fixed cycle of ranges
    private static void WriteRandom(in string p_outDir)
    {
        int[] a_seeds = [0, 1, -1, 777, 12345, -12345, 161803398, 161803399, 1000000000, -1999999999, int.MaxValue, int.MinValue];
        (int min, int max)[] a_ranges = [(0, 2), (0, 9), (3, 12), (0, 625), (-50, 50), (0, int.MaxValue), (-1000000000, 1000000000)];
        Write(p_outDir, "random.json", a_seeds.Select(p_seed =>
        {
            Random a_random = new(p_seed);
            List<int[]> a_calls = [];
            for (int i_call = 0; i_call < 70; ++i_call)
            {
                (int a_min, int a_max) = a_ranges[i_call % a_ranges.Length];
                a_calls.Add([a_min, a_max, a_random.Next(a_min, a_max)]);
            }
            return (object)new { seed = p_seed, calls = a_calls };
        }));
    }

    private static void WriteCreate(in string p_outDir)
    {
        (int rank, int blanks, int seed, bool exhaustive)[] a_cases =
        [
            (2, 0, 1, false), (2, 6, 12345, false), (2, -1, -7, false), (2, -1, 7, false),
            (3, 0, 1, false), (3, 40, 777, false), (3, 40, 12345, false), (3, 54, 42, false),
            (3, -1, 777, false), (3, -1, int.MaxValue, false), (3, -1, int.MinValue, false), (3, -1, 0, false),
            (3, 81, 12345, true), (3, -1, 2024, true),
            (4, 120, 777, false), (4, -1, 1, false),
            (5, 300, 777, false),
        ];
        List<object> a_rows = [];
        foreach ((int rank, int blanks, int seed, bool exhaustive) a_case in a_cases)
        {
            Stopwatch a_watch = Stopwatch.StartNew();
            Sudoku a_sudoku = Sudoku.Create(a_case.rank, a_case.blanks, a_case.seed, a_case.exhaustive);
            Console.WriteLine($"  create {a_case} -> removed {a_sudoku.Removed} in {a_watch.ElapsedMilliseconds}ms");
            a_rows.Add(new
            {
                rank = a_case.rank, blanks = a_case.blanks, seed = a_case.seed, exhaustive = a_case.exhaustive, removed = a_sudoku.Removed,
                puzzle = Utility.GetPuzzleCode(a_sudoku.Puzzle), solution = Utility.GetPuzzleCode(a_sudoku.Solution),
            });
        }
        Write(p_outDir, "create.json", a_rows);
    }

    // solve the input, then shuffle the result with the seed
    private static void WriteShuffle(in string p_outDir)
    {
        string a_rank2 = Utility.GetPuzzleCode(Sudoku.Create(2, 6, 12345).Puzzle);
        string a_rank4 = Utility.GetPuzzleCode(Sudoku.Create(4, 120, 777).Puzzle);
        (string input, int seed)[] a_cases = [(known, 1), (known, 777), (known, -5), (known, int.MinValue), (a_rank2, 3), (a_rank4, 99)];
        Write(p_outDir, "shuffle.json", a_cases.Select(p_case =>
        {
            Sudoku a_shuffled = Sudoku.Solve(Utility.GetPuzzleArr(p_case.input)).Shuffle(p_case.seed);
            return (object)new
            {
                input = p_case.input, seed = p_case.seed,
                puzzle = Utility.GetPuzzleCode(a_shuffled.Puzzle), solution = Utility.GetPuzzleCode(a_shuffled.Solution),
            };
        }));
    }

    // a unique solution, or null when Solve must throw
    private static void WriteSolve(in string p_outDir)
    {
        string[] a_inputs =
        [
            known,
            "398564127.721839465.645172893.186257934.579643281.234981576.813496752.457328619.962715348",
            Utility.GetPuzzleCode(Sudoku.Create(2, 6, 12345).Puzzle),
            Utility.GetPuzzleCode(Sudoku.Create(4, 120, 777).Puzzle),
            Utility.GetPuzzleCode(Sudoku.Create(3, -1, 777).Puzzle),
            Utility.GetPuzzleCode(Sudoku.Create(5, 300, 777).Puzzle),
            "000000000.000000000.000000000.000000000.000000000.000000000.000000000.000000000.000000000",
            "550000000.000000000.000000000.000000000.000000000.000000000.000000000.000000000.000000000",
            "500000000.000000000.000000000.000000000.000000000.000000000.000000000.000000000.500000000",
            "500000000.050000000.000000000.000000000.000000000.000000000.000000000.000000000.000000000",
            "A00000000.000000000.000000000.000000000.000000000.000000000.000000000.000000000.000000000",
            "123456780.000000009.000000000.000000000.000000000.000000000.000000000.000000000.000000000",
            "0000000000",
        ];
        Write(p_outDir, "solve.json", a_inputs.Select(p_input =>
        {
            string? a_solution;
            try { a_solution = Utility.GetPuzzleCode(Sudoku.Solve(Utility.GetPuzzleArr(p_input)).Solution); }
            catch (Exception) { a_solution = null; }
            return (object)new { input = p_input, solution = a_solution };
        }));
    }
}
