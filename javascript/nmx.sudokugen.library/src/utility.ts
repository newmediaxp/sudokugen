// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

import type { Random } from "./random.ts";

/**
 * Encodes a grid as one character per square, row by row: 0 = blank, 1-9 as digits,
 * 10 and above as letters ('A' = 10), '.' between rows.
 * Values above 35 ('Z') are unrepresentable, so rank 5 (25x25) at most.
 * @param p_puzz The grid to encode, row by row.
 * @returns The puzzle code, e.g. "0012.3400...".
 */
export function getPuzzleCode(p_puzz: ArrayLike<number>): string {
    const a_rows = Math.trunc(Math.sqrt(p_puzz.length));
    let a_puzzleCode = "";
    for (let i = 0; i < p_puzz.length; ++i) {
        if (i > 0 && i % a_rows === 0) a_puzzleCode += ".";
        const a_value = p_puzz[i];
        // 'A' - 10 = 55, '0' = 48
        a_puzzleCode += String.fromCharCode(a_value > 9 ? 55 + a_value : 48 + a_value);
    }
    return a_puzzleCode;
}

/**
 * Parses a puzzle code back into a grid array.
 * @param p_code Text containing the grid as digits and letters ('A' or 'a' = 10);
 * every other character is ignored.
 * @returns One element per recognised character, in order.
 */
export function getPuzzleArr(p_code: string): number[] {
    const a_puzzle: number[] = [];
    for (let i = 0; i < p_code.length; ++i) {
        const c = p_code.charCodeAt(i);
        // '0'..'9' = 48..57, 'A'..'Z' = 65..90, 'a'..'z' = 97..122
        if (c >= 48 && c <= 57) a_puzzle.push(c - 48);
        else if (c >= 65 && c <= 90) a_puzzle.push(c - 55);
        else if (c >= 97 && c <= 122) a_puzzle.push(c - 87);
    }
    return a_puzzle;
}

// the helpers below are internal: index.ts does not export them

export function count(p_arr: ArrayLike<number>, p_num: number): number {
    let a_count = 0;
    for (let i = 0; i < p_arr.length; ++i) if (p_arr[i] === p_num) ++a_count;
    return a_count;
}

/**
 * Fills an array block-wise so that every consecutive block ends up a random permutation of the same value range.
 * @param p_random Random generator driving the shuffle.
 * @param p_arr Array to fill; its length should be a multiple of p_length.
 * @param p_length Block size, and the size of the permuted value range.
 * @param p_plus1 When true each block holds 1..length, otherwise 0..length-1.
 */
export function initRandom(p_random: Random, p_arr: Int32Array, p_length: number, p_plus1: boolean): void {
    for (let i = 0; i < p_arr.length; ++i) p_arr[i] = (i % p_length) + (p_plus1 ? 1 : 0);
    for (let i = 0; i < p_arr.length; ++i) {
        const a_start = Math.trunc(i / p_length) * p_length;
        const r = p_random.next(a_start, a_start + p_length);
        const a_swap = p_arr[i];
        p_arr[i] = p_arr[r];
        p_arr[r] = a_swap;
    }
}

/**
 * Counts the set bits of p_bits (SWAR popcount).
 * @param p_bits The bits to count.
 * @returns The number of set bits, 0..32.
 */
export function popCount(p_bits: number): number {
    let a_bits = p_bits - ((p_bits >>> 1) & 0x55555555);
    a_bits = (a_bits & 0x33333333) + ((a_bits >>> 2) & 0x33333333);
    return Math.imul((a_bits + (a_bits >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24;
}
