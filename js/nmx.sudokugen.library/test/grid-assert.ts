// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

import assert from "node:assert/strict";

/** Asserts every row, column and segment of p_grid contains 1..rows exactly once. */
export function assertValidGrid(p_grid: ArrayLike<number>, p_rank: number): void {
    const a_rows = p_rank * p_rank;
    assert.equal(p_grid.length, a_rows * a_rows);
    const a_units: [string, (p_unit: number, p_i: number) => number][] = [
        ["row", (p_unit, p_i) => p_unit * a_rows + p_i],
        ["column", (p_unit, p_i) => p_i * a_rows + p_unit],
        [
            "segment",
            (p_unit, p_i) =>
                Math.trunc(p_unit / p_rank) * p_rank * a_rows +
                (p_unit % p_rank) * p_rank +
                Math.trunc(p_i / p_rank) * a_rows +
                (p_i % p_rank),
        ],
    ];
    for (const [a_name, a_idxOf] of a_units)
        for (let i_unit = 0; i_unit < a_rows; ++i_unit) {
            const a_seen = new Set<number>();
            for (let i = 0; i < a_rows; ++i) {
                const a_input = p_grid[a_idxOf(i_unit, i)];
                assert.ok(a_input >= 1 && a_input <= a_rows, `${a_input} out of range in ${a_name} ${i_unit}`);
                assert.ok(!a_seen.has(a_input), `duplicate ${a_input} in ${a_name} ${i_unit}`);
                a_seen.add(a_input);
            }
        }
}

/** Asserts every non-blank square of p_puzz equals the corresponding square of p_soln. */
export function assertPuzzleMatchesSolution(p_puzz: ArrayLike<number>, p_soln: ArrayLike<number>): void {
    assert.equal(p_puzz.length, p_soln.length);
    for (let i = 0; i < p_puzz.length; ++i) if (p_puzz[i] !== 0) assert.equal(p_puzz[i], p_soln[i]);
}

/** The number of blanks (0) in p_grid. */
export function blanks(p_grid: ArrayLike<number>): number {
    let a_count = 0;
    for (let i = 0; i < p_grid.length; ++i) if (p_grid[i] === 0) ++a_count;
    return a_count;
}
