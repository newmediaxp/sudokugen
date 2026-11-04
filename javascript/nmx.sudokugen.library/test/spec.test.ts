// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

// Checks this library against the shared test data in spec/tests, which the C# library (the reference) produced:
// the same seed must give the same random numbers, puzzles and shuffles in every language,
// and every encoding must write and read the same puzzle codes.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { EncodingOption, getPuzzleArr, getPuzzleCode, Sudoku } from "../src/index.ts";
import { Random } from "../src/random.ts";

function load<T>(p_name: string): T[] {
    return JSON.parse(readFileSync(new URL(`../../../spec/tests/${p_name}`, import.meta.url), "utf8")) as T[];
}

describe("spec/tests", () => {
    it("random.json: the seeded generator draws the same numbers", () => {
        for (const a_case of load<{ seed: number; calls: [number, number, number][] }>("random.json")) {
            const a_random = new Random(a_case.seed);
            for (const [a_min, a_max, a_expected] of a_case.calls)
                assert.equal(a_random.next(a_min, a_max), a_expected, `seed ${a_case.seed}, next(${a_min}, ${a_max})`);
        }
    });

    type CreateCase = {
        rank: number;
        blanks: number;
        seed: number;
        exhaustive: boolean;
        removed: number;
        puzzle: string;
        solution: string;
    };
    for (const a_case of load<CreateCase>("create.json")) {
        const a_name = `rank ${a_case.rank}, blanks ${a_case.blanks}, seed ${a_case.seed}`;
        it(`create.json: ${a_name}${a_case.exhaustive ? ", exhaustive" : ""}`, () => {
            const a_options = { seed: a_case.seed, exhaustive: a_case.exhaustive };
            const a_sudoku = Sudoku.create(a_case.rank, a_case.blanks, a_options);
            assert.equal(getPuzzleCode(a_sudoku.puzzle), a_case.puzzle);
            assert.equal(getPuzzleCode(a_sudoku.solution), a_case.solution);
            assert.equal(a_sudoku.removed, a_case.removed);
        });
    }

    it("shuffle.json: the same seed gives the same variant", () => {
        for (const a_case of load<{ input: string; seed: number; puzzle: string; solution: string }>("shuffle.json")) {
            const a_shuffled = Sudoku.solve(getPuzzleArr(a_case.input)).shuffle(a_case.seed);
            assert.equal(getPuzzleCode(a_shuffled.puzzle), a_case.puzzle, `seed ${a_case.seed}`);
            assert.equal(getPuzzleCode(a_shuffled.solution), a_case.solution, `seed ${a_case.seed}`);
        }
    });

    it("solve.json: solves the unique puzzles and rejects the rest", () => {
        for (const a_case of load<{ input: string; solution: string | null }>("solve.json")) {
            const a_puzz = getPuzzleArr(a_case.input);
            if (a_case.solution === null) assert.throws(() => Sudoku.solve(a_puzz), Error, a_case.input);
            else assert.equal(getPuzzleCode(Sudoku.solve(a_puzz).solution), a_case.solution, a_case.input);
        }
    });

    type EncodingName = keyof typeof EncodingOption;

    it("encode.json: every encoding writes the same codes and rejects the same values", () => {
        for (const a_case of load<{ encoding: EncodingName; values: number[]; code: string | null }>("encode.json")) {
            const a_encoding = EncodingOption[a_case.encoding];
            const a_name = `${a_case.encoding} ${a_case.code ?? "throws"}`;
            if (a_case.code === null) assert.throws(() => getPuzzleCode(a_case.values, a_encoding), RangeError, a_name);
            else assert.equal(getPuzzleCode(a_case.values, a_encoding), a_case.code, a_name);
        }
    });

    it("decode.json: every encoding reads the same values", () => {
        for (const a_case of load<{ encoding: EncodingName; code: string; values: number[] }>("decode.json"))
            assert.deepEqual(
                getPuzzleArr(a_case.code, EncodingOption[a_case.encoding]),
                a_case.values,
                `${a_case.encoding} ${a_case.code}`,
            );
    });
});
