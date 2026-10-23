// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPuzzleArr, Sudoku } from "../src/index.ts";
import { assertValidGrid } from "./grid-assert.ts";

// known pair taken from the CLI app's help examples
const knownPuzz = "390560027.001809405.600172893.180257900.500643000.204081570.003096052.050328619.962010300";
const knownSoln = "398564127.721839465.645172893.186257934.579643281.234981576.813496752.457328619.962715348";

/** An empty rank 3 board with p_value at each of p_idxs. */
function boardWith(p_value: number, ...p_idxs: number[]): number[] {
    const a_board = new Array<number>(81).fill(0);
    for (const a_idx of p_idxs) a_board[a_idx] = p_value;
    return a_board;
}

describe("Sudoku.solve", () => {
    for (const [a_rank, a_remove] of [
        [2, 6],
        [3, 40],
    ] as const)
        it(`rank ${a_rank}: round-trips a created puzzle`, () => {
            const a_created = Sudoku.create(a_rank, a_remove);
            assert.deepEqual(Sudoku.solve(a_created.puzzle).solution, a_created.solution);
        });

    it("solves the known puzzle", () => {
        const a_sudoku = Sudoku.solve(getPuzzleArr(knownPuzz));
        assert.deepEqual(a_sudoku.solution, getPuzzleArr(knownSoln));
        assertValidGrid(a_sudoku.solution, 3);
    });

    it("returns a complete grid unchanged", () => {
        const a_grid = getPuzzleArr(knownSoln);
        const a_sudoku = Sudoku.solve(a_grid);
        assert.deepEqual(a_sudoku.solution, a_grid);
        assert.equal(a_sudoku.removed, 0);
    });

    it("infers the rank from the length", () => {
        assert.equal(Sudoku.solve(Sudoku.create(2, 6).puzzle).rank, 2);
    });

    it("counts the blanks as remove and removed", () => {
        const a_sudoku = Sudoku.solve(getPuzzleArr(knownPuzz));
        assert.equal(a_sudoku.remove, 30);
        assert.equal(a_sudoku.removed, 30);
    });

    it("accepts typed arrays and leaves the input untouched", () => {
        const a_input = Int32Array.from(getPuzzleArr(knownPuzz));
        const a_before = Array.from(a_input);
        assert.deepEqual(Sudoku.solve(a_input).solution, getPuzzleArr(knownSoln));
        assert.deepEqual(Array.from(a_input), a_before);
    });

    it("throws on an invalid length", () => {
        assert.throws(() => Sudoku.solve(new Array<number>(10).fill(0)), /could not determine rank/);
        assert.throws(() => Sudoku.solve(new Array<number>(1).fill(0)), /rank must be within 2..5/);
    });

    it("throws on a duplicate in a row", () => assert.throws(() => Sudoku.solve(boardWith(5, 0, 1)), /duplicate/));
    it("throws on a duplicate in a column", () => assert.throws(() => Sudoku.solve(boardWith(5, 0, 9)), /duplicate/));
    it("throws on a duplicate in a segment", () => assert.throws(() => Sudoku.solve(boardWith(5, 0, 10)), /duplicate/));

    for (const a_value of [10, -1, 2.5, Number.NaN])
        it(`throws on the value ${a_value}`, () =>
            assert.throws(() => Sudoku.solve(boardWith(a_value, 0)), /outside 0..9/));

    it("throws on a puzzle with many solutions", () => {
        // an empty grid has many solutions, so it must be rejected
        assert.throws(() => Sudoku.solve(boardWith(0)), /unique/);
    });

    it("throws on a conflict-free puzzle without a solution", () => {
        // the top row still needs a 9 at square 8, which already sees one in its column and segment
        assert.throws(() => Sudoku.solve(getPuzzleArr("123456780.000000009" + ".000000000".repeat(7))), /no solution/);
    });
});
