// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Conflict, Sudoku } from "../src/index.ts";

const sudoku = Sudoku.create(3, 40, { seed: 12345 });

/** An empty rank 3 board with p_value at each of p_idxs. */
function boardWith(p_value: number, ...p_idxs: number[]): number[] {
    const a_board = new Array<number>(81).fill(0);
    for (const a_idx of p_idxs) a_board[a_idx] = p_value;
    return a_board;
}

describe("Sudoku.findConflicts", () => {
    it("a blank input conflicts with nothing", () => {
        assert.equal(sudoku.findConflicts(boardWith(5, 1, 9, 10), 0, 0), Conflict.None);
    });

    it("a lone value conflicts with nothing", () => {
        assert.equal(sudoku.findConflicts(boardWith(5, 0), 0, 5), Conflict.None);
    });

    it("same row, other segment: Row", () => {
        assert.equal(sudoku.findConflicts(boardWith(5, 0, 8), 0, 5), Conflict.Row);
    });

    it("same column, other segment: Column", () => {
        assert.equal(sudoku.findConflicts(boardWith(5, 0, 72), 0, 5), Conflict.Column);
    });

    it("same segment, other row and column: Segment", () => {
        assert.equal(sudoku.findConflicts(boardWith(5, 0, 10), 0, 5), Conflict.Segment);
    });

    it("a neighbour in the row and segment: Row | Segment", () => {
        assert.equal(sudoku.findConflicts(boardWith(5, 0, 1), 0, 5), Conflict.Row | Conflict.Segment);
    });

    it("all three units: Row | Column | Segment", () => {
        assert.equal(
            sudoku.findConflicts(boardWith(5, 0, 8, 72, 10), 0, 5),
            Conflict.Row | Conflict.Column | Conflict.Segment,
        );
    });

    it("a candidate on a blank square reports its units", () => {
        assert.equal(sudoku.findConflicts(boardWith(5, 8), 0, 5), Conflict.Row);
    });

    it("a candidate ignores the square's current value", () => {
        assert.equal(sudoku.findConflicts(boardWith(7, 0), 0, 5), Conflict.None);
    });

    it("excludeIdx false: a square holding the input reports all three units", () => {
        assert.equal(
            sudoku.findConflicts(boardWith(5, 0), 0, 5, false),
            Conflict.Row | Conflict.Column | Conflict.Segment,
        );
    });

    it("without an input, checks the value already placed", () => {
        assert.equal(sudoku.findConflicts(boardWith(5, 0, 8, 72), 0), Conflict.Row | Conflict.Column);
        assert.equal(sudoku.findConflicts(boardWith(0), 0), Conflict.None);
    });

    it("accepts typed arrays", () => {
        assert.equal(sudoku.findConflicts(Int8Array.from(boardWith(5, 0, 8)), 0), Conflict.Row);
    });

    it("throws on a board of the wrong length", () => {
        assert.throws(() => sudoku.findConflicts(new Array<number>(16).fill(0), 0, 0), RangeError);
        assert.throws(() => sudoku.findConflicts(new Array<number>(16).fill(0), 0), RangeError);
    });

    for (const a_idx of [-1, 81, 0.5])
        it(`throws on the index ${a_idx}`, () => {
            assert.throws(() => sudoku.findConflicts(boardWith(0), a_idx, 1), RangeError);
            assert.throws(() => sudoku.findConflicts(boardWith(0), a_idx), RangeError);
        });

    for (const a_input of [-1, 10, 2.5])
        it(`throws on the input ${a_input}`, () => {
            assert.throws(() => sudoku.findConflicts(boardWith(0), 0, a_input), RangeError);
            assert.throws(() => sudoku.findConflicts(boardWith(a_input, 0), 0), RangeError);
        });
});
