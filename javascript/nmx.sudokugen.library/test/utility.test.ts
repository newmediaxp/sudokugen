// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPuzzleArr, getPuzzleCode } from "../src/index.ts";
import { Random } from "../src/random.ts";
import { count, initRandom, popCount } from "../src/utility.ts";

describe("puzzle codes", () => {
    it("round-trip", () => {
        const a_puzz = Array.from({ length: 81 }, (_, i) => i % 10);
        assert.deepEqual(getPuzzleArr(getPuzzleCode(a_puzz)), a_puzz);
    });

    it("separate rows with dots", () => {
        assert.equal(getPuzzleCode([1, 2, 3, 4]), "12.34");
    });

    it("ignore unrecognised characters", () => {
        assert.deepEqual(getPuzzleArr("1+0.2-"), [1, 0, 2]);
    });

    it("round-trip values above nine as letters", () => {
        const a_puzz = Array.from({ length: 256 }, (_, i) => i % 17);
        const a_code = getPuzzleCode(a_puzz);
        assert.ok(a_code.includes("A"));
        assert.deepEqual(getPuzzleArr(a_code), a_puzz);
    });

    it("parse letters case-insensitively", () => {
        assert.deepEqual(getPuzzleArr("AZaz"), [10, 35, 10, 35]);
    });
});

describe("internal helpers", () => {
    it("count counts matching elements", () => {
        assert.equal(count([0, 1, 0, 2, 0], 0), 3);
        assert.equal(count([1, 2, 3], 9), 0);
    });

    it("popCount counts set bits", () => {
        for (const [a_bits, a_count] of [
            [0, 0],
            [1, 1],
            [0b1011, 3],
            [0x3fffffe, 25],
            [0x7fffffff, 31],
        ])
            assert.equal(popCount(a_bits), a_count);
    });

    for (const [a_plus1, a_offset] of [
        [true, 1],
        [false, 0],
    ] as const)
        it(`initRandom (plus1 ${a_plus1}) makes each block a permutation`, () => {
            const a_length = 9,
                a_blocks = 3;
            const a_arr = new Int32Array(a_length * a_blocks);
            initRandom(new Random(1), a_arr, a_length, a_plus1);
            for (let i_block = 0; i_block < a_blocks; ++i_block) {
                const a_block = Array.from(
                    a_arr.subarray(i_block * a_length, (i_block + 1) * a_length),
                    (p_num) => p_num - a_offset,
                );
                assert.deepEqual(
                    a_block.sort((a, b) => a - b),
                    [0, 1, 2, 3, 4, 5, 6, 7, 8],
                );
            }
        });
});
