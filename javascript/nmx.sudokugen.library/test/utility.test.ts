// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EncodingOption, getPuzzleArr, getPuzzleCode, getSymbol, maxRank } from "../src/index.ts";
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

describe("puzzle code encodings", () => {
    // name, encoding, highest writable value, max rank, the code of [0, 1, max, 0]
    const a_encodings = [
        ["All", EncodingOption.All, 35, 5, "01.Z0"],
        ["AllMinusO", EncodingOption.AllMinusO, 34, 5, "01.Z0"],
        ["DigitsOnly", EncodingOption.DigitsOnly, 9, 3, "01.90"],
        ["LettersOnly", EncodingOption.LettersOnly, 26, 5, "0A.Z0"],
        ["LettersOnlyMinusO", EncodingOption.LettersOnlyMinusO, 25, 5, "0A.Z0"],
    ] as const;

    for (const [a_name, a_encoding, a_max, a_rank, a_code] of a_encodings) {
        it(`${a_name} round-trips a rank ${a_rank} grid holding every value`, () => {
            const a_rows = a_rank * a_rank;
            const a_puzz = Array.from({ length: a_rows * a_rows }, (_, i) => i % (a_rows + 1));
            assert.equal(new Set(a_puzz).size, a_rows + 1);
            const a_puzzleCode = getPuzzleCode(a_puzz, a_encoding);
            assert.equal(a_puzzleCode.length, a_rows * a_rows + a_rows - 1);
            assert.deepEqual(getPuzzleArr(a_puzzleCode, a_encoding), a_puzz);
            assert.deepEqual(getPuzzleArr(a_puzzleCode.toLowerCase(), a_encoding), a_puzz);
        });

        it(`${a_name} writes [0, 1, max, 0] as ${a_code} and throws above max`, () => {
            assert.equal(getPuzzleCode([0, 1, a_max, 0], a_encoding), a_code);
            assert.throws(() => getPuzzleCode([0, 1, a_max + 1, 0], a_encoding), RangeError);
            assert.throws(() => getSymbol(a_max + 1, a_encoding), RangeError);
            assert.throws(() => getSymbol(-1, a_encoding), RangeError);
            assert.throws(() => getSymbol(1.5, a_encoding), RangeError);
        });

        it(`${a_name} writes blank as '0' and every value as a distinct symbol`, () => {
            const a_symbols = Array.from({ length: a_max + 1 }, (_, i) => getSymbol(i, a_encoding));
            assert.equal(a_symbols[0], "0");
            assert.equal(new Set(a_symbols).size, a_max + 1);
            assert.deepEqual(getPuzzleArr(a_symbols.join(""), a_encoding), [...a_symbols.keys()]);
        });
    }

    for (const [a_name, a_encoding, a_max] of a_encodings.filter(([p_name]) => p_name.endsWith("MinusO")))
        it(`${a_name} never writes O`, () => {
            for (let i = 0; i <= a_max; ++i) assert.notEqual(getSymbol(i, a_encoding), "O");
        });

    it("minus-O encodings skip O and ignore it when parsing", () => {
        assert.equal(getPuzzleCode([23, 24, 0, 0], EncodingOption.AllMinusO), "NP.00");
        assert.equal(getPuzzleCode([14, 15, 0, 0], EncodingOption.LettersOnlyMinusO), "NP.00");
        assert.deepEqual(getPuzzleArr("NOP", EncodingOption.AllMinusO), [23, 24]);
        assert.deepEqual(getPuzzleArr("NOP", EncodingOption.LettersOnlyMinusO), [14, 15]);
        assert.deepEqual(getPuzzleArr("nop", EncodingOption.LettersOnlyMinusO), [14, 15]);
    });

    it("parse only the characters the encoding uses", () => {
        assert.deepEqual(getPuzzleArr("05a9z", EncodingOption.LettersOnly), [0, 1, 26]);
        assert.deepEqual(getPuzzleArr("05a9z", EncodingOption.DigitsOnly), [0, 5, 9]);
        // ASCII letters only: dotless i and long s are not I and S
        assert.deepEqual(getPuzzleArr("ıſ", EncodingOption.All), []);
    });

    it("maxRank", () => {
        assert.deepEqual(
            a_encodings.map(([, a_encoding]) => maxRank(a_encoding)),
            [5, 5, 3, 5, 5],
        );
        for (const [, a_encoding, , a_rank] of a_encodings) assert.equal(maxRank(a_encoding), a_rank);
    });

    it("no encoding means All", () => {
        const a_puzz = Array.from({ length: 36 }, (_, i) => i);
        assert.equal(getPuzzleCode(a_puzz), getPuzzleCode(a_puzz, EncodingOption.All));
        assert.throws(() => getPuzzleCode([36, 0, 0, 0]), RangeError);
        assert.throws(() => getPuzzleCode([-1, 0, 0, 0]), RangeError);
        const a_code = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcxyz+.-";
        assert.deepEqual(getPuzzleArr(a_code), getPuzzleArr(a_code, EncodingOption.All));
        assert.deepEqual(getPuzzleArr("O0o"), [24, 0, 24]);
    });

    it("unknown encodings throw", () => {
        const a_unknown = 5 as number as EncodingOption;
        assert.throws(() => getSymbol(1, a_unknown), RangeError);
        assert.throws(() => getPuzzleCode([0], a_unknown), RangeError);
        assert.throws(() => getPuzzleArr("", a_unknown), RangeError);
        assert.throws(() => maxRank(a_unknown), RangeError);
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
