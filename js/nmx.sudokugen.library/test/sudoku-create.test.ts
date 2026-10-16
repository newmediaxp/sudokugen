// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Sudoku } from "../src/index.ts";
import { assertPuzzleMatchesSolution, assertValidGrid, blanks } from "./grid-assert.ts";

describe("Sudoku.create", () => {
    for (const [a_rank, a_remove] of [
        [2, 4],
        [3, 27],
    ] as const) {
        it(`rank ${a_rank}, ${a_remove} blanks: the solution is a valid grid`, () => {
            assertValidGrid(Sudoku.create(a_rank, a_remove).solution, a_rank);
        });

        it(`rank ${a_rank}, ${a_remove} blanks: the puzzle matches the solution where filled`, () => {
            const a_sudoku = Sudoku.create(a_rank, a_remove);
            assertPuzzleMatchesSolution(a_sudoku.puzzle, a_sudoku.solution);
        });
    }

    for (const [a_rank, a_remove] of [
        [2, 4],
        [3, 27],
        [3, 81],
    ] as const)
        it(`rank ${a_rank}, ${a_remove} blanks: the blank count equals removed and never exceeds the request`, () => {
            const a_sudoku = Sudoku.create(a_rank, a_remove);
            assert.equal(blanks(a_sudoku.puzzle), a_sudoku.removed);
            assert.ok(a_sudoku.removed >= 0 && a_sudoku.removed <= a_remove);
        });

    it("0 blanks: the puzzle equals the solution", () => {
        const a_sudoku = Sudoku.create(3, 0);
        assert.equal(a_sudoku.removed, 0);
        assert.deepEqual(a_sudoku.puzzle, a_sudoku.solution);
    });

    it("maxBlanks asks for every square", () => {
        const a_sudoku = Sudoku.create(3, Sudoku.maxBlanks);
        assert.equal(a_sudoku.remove, 81);
        assert.ok(a_sudoku.removed > 0 && a_sudoku.removed < 81);
    });

    it("the pruned puzzle stays uniquely solvable", () => {
        const a_sudoku = Sudoku.create(3, 54);
        assert.deepEqual(Sudoku.solve(a_sudoku.puzzle).solution, a_sudoku.solution);
    });

    it("consecutive calls produce different solutions", () => {
        assert.notDeepEqual(Sudoku.create(3, 0).solution, Sudoku.create(3, 0).solution);
    });

    for (const [a_rank, a_remove, a_seed] of [
        [2, 6, 12345],
        [3, 40, 12345],
    ] as const)
        it(`rank ${a_rank}, seed ${a_seed}: the same seed reproduces the same puzzle`, () => {
            const a_sudoku1 = Sudoku.create(a_rank, a_remove, { seed: a_seed });
            const a_sudoku2 = Sudoku.create(a_rank, a_remove, { seed: a_seed });
            assert.deepEqual(a_sudoku1.solution, a_sudoku2.solution);
            assert.deepEqual(a_sudoku1.puzzle, a_sudoku2.puzzle);
        });

    it("different seeds produce different solutions", () => {
        assert.notDeepEqual(Sudoku.create(3, 0, { seed: 1 }).solution, Sudoku.create(3, 0, { seed: 2 }).solution);
    });

    for (const a_rank of [1, 6, 2.5, Number.NaN])
        it(`rank ${a_rank} throws`, () => assert.throws(() => Sudoku.create(a_rank, 4), RangeError));

    // -2 is below the maxBlanks (-1) sentinel, 82 above squares (rank 3 -> 81)
    for (const a_blanks of [-2, 82, 1.5])
        it(`${a_blanks} blanks throws`, () => assert.throws(() => Sudoku.create(3, a_blanks), RangeError));

    for (const a_seed of [2 ** 31, -(2 ** 31) - 1, 1.5, Number.NaN])
        it(`seed ${a_seed} throws`, () => assert.throws(() => Sudoku.create(3, 40, { seed: a_seed }), RangeError));

    it("rank 4: the solution is valid and uniquely solvable", () => {
        const a_sudoku = Sudoku.create(4, 32);
        assertValidGrid(a_sudoku.solution, 4);
        assertPuzzleMatchesSolution(a_sudoku.puzzle, a_sudoku.solution);
        assert.deepEqual(Sudoku.solve(a_sudoku.puzzle).solution, a_sudoku.solution);
    });

    it("exhaustive: the puzzle stays uniquely solvable", () => {
        const a_sudoku = Sudoku.create(3, 81, { exhaustive: true });
        assertValidGrid(a_sudoku.solution, 3);
        assertPuzzleMatchesSolution(a_sudoku.puzzle, a_sudoku.solution);
        assert.deepEqual(Sudoku.solve(a_sudoku.puzzle).solution, a_sudoku.solution);
    });

    it("exhaustive: the same seed reproduces the same puzzle", () => {
        const a_sudoku1 = Sudoku.create(3, 81, { seed: 12345, exhaustive: true });
        const a_sudoku2 = Sudoku.create(3, 81, { seed: 12345, exhaustive: true });
        assert.deepEqual(a_sudoku1.solution, a_sudoku2.solution);
        assert.deepEqual(a_sudoku1.puzzle, a_sudoku2.puzzle);
    });
});
