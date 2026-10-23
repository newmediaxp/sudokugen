// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Sudoku } from "../src/index.ts";
import { assertPuzzleMatchesSolution, assertValidGrid, blanks } from "./grid-assert.ts";

describe("Sudoku.shuffle", () => {
    for (const [a_rank, a_remove] of [
        [2, 6],
        [3, 40],
    ] as const) {
        it(`rank ${a_rank}: produces a valid grid`, () => {
            const a_shuffled = Sudoku.create(a_rank, a_remove).shuffle();
            assertValidGrid(a_shuffled.solution, a_rank);
            assertPuzzleMatchesSolution(a_shuffled.puzzle, a_shuffled.solution);
        });

        it(`rank ${a_rank}: stays uniquely solvable`, () => {
            const a_shuffled = Sudoku.create(a_rank, a_remove).shuffle();
            assert.deepEqual(Sudoku.solve(a_shuffled.puzzle).solution, a_shuffled.solution);
        });
    }

    it("keeps the rank and blank count", () => {
        const a_sudoku = Sudoku.create(3, 40);
        const a_shuffled = a_sudoku.shuffle();
        assert.equal(a_shuffled.rank, a_sudoku.rank);
        assert.equal(a_shuffled.remove, a_sudoku.remove);
        assert.equal(a_shuffled.removed, a_sudoku.removed);
        assert.equal(blanks(a_shuffled.puzzle), blanks(a_sudoku.puzzle));
    });

    it("the same seed reproduces the same result", () => {
        const a_sudoku = Sudoku.create(3, 40, { seed: 12345 });
        const a_shuffled1 = a_sudoku.shuffle(777),
            a_shuffled2 = a_sudoku.shuffle(777);
        assert.deepEqual(a_shuffled1.puzzle, a_shuffled2.puzzle);
        assert.deepEqual(a_shuffled1.solution, a_shuffled2.solution);
    });

    it("different seeds produce different results", () => {
        const a_sudoku = Sudoku.create(3, 40, { seed: 12345 });
        assert.notDeepEqual(a_sudoku.shuffle(1).solution, a_sudoku.shuffle(2).solution);
    });

    it("produces a different board", () => {
        const a_sudoku = Sudoku.create(3, 40);
        assert.notDeepEqual(a_sudoku.shuffle().solution, a_sudoku.solution);
    });

    it("leaves the original untouched", () => {
        const a_sudoku = Sudoku.create(3, 40, { seed: 12345 });
        const a_puzzBefore = [...a_sudoku.puzzle],
            a_solnBefore = [...a_sudoku.solution];
        a_sudoku.shuffle();
        assert.deepEqual(a_sudoku.puzzle, a_puzzBefore);
        assert.deepEqual(a_sudoku.solution, a_solnBefore);
    });

    for (const a_seed of [2 ** 31, 1.5])
        it(`seed ${a_seed} throws`, () => assert.throws(() => Sudoku.create(2, 6).shuffle(a_seed), RangeError));
});
