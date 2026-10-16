// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Conflict, Sudoku } from "../src/index.ts";

describe("Sudoku", () => {
    it("exposes the rank and blank bounds", () => {
        assert.equal(Sudoku.minRank, 2);
        assert.equal(Sudoku.maxRank, 5);
        assert.equal(Sudoku.maxBlanks, -1);
    });

    it("derives rows and squares from the rank", () => {
        const a_sudoku = Sudoku.create(4, 0, { seed: 1 });
        assert.equal(a_sudoku.rank, 4);
        assert.equal(a_sudoku.rows, 16);
        assert.equal(a_sudoku.squares, 256);
        assert.equal(a_sudoku.puzzle.length, 256);
        assert.equal(a_sudoku.solution.length, 256);
    });

    it("is immutable", () => {
        const a_sudoku = Sudoku.create(3, 40, { seed: 1 });
        assert.ok(Object.isFrozen(a_sudoku));
        assert.ok(Object.isFrozen(a_sudoku.puzzle));
        assert.ok(Object.isFrozen(a_sudoku.solution));
        assert.throws(() => ((a_sudoku.puzzle as number[])[0] = 9), TypeError);
        assert.throws(() => ((a_sudoku as { removed: number }).removed = 0), TypeError);
    });

    it("can only be made by its factories", () => {
        const a_construct = Sudoku as unknown as new () => Sudoku;
        assert.throws(() => new a_construct(), TypeError);
    });

    it("has frozen conflict flags", () => {
        assert.deepEqual({ ...Conflict }, { None: 0, Row: 1, Column: 2, Segment: 4 });
        assert.ok(Object.isFrozen(Conflict));
    });
});
