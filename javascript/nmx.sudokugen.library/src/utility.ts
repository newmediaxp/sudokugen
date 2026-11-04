// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

import type { Random } from "./random.ts";

/**
 * Character sets a puzzle code can be written in. Blank (0) is '0' in every one of them.
 */
export const EncodingOption = Object.freeze({
    /** 1 to 9 as digits, then 10 to 35 as A to Z. Fits every rank. */
    All: 0,
    /** 1 to 9 as digits, then 10 to 34 as A to Z without O, so it can't be misread as blank '0'. Fits every rank. */
    AllMinusO: 1,
    /** 1 to 9 as digits only. Fits rank 3 and below. */
    DigitsOnly: 2,
    /** 1 to 26 as A to Z. Fits every rank. */
    LettersOnly: 3,
    /** 1 to 25 as A to Z without O, so it can't be misread as blank '0'. Fits every rank. */
    LettersOnlyMinusO: 4,
} as const);
/** One of the {@link EncodingOption} values. */
export type EncodingOption = (typeof EncodingOption)[keyof typeof EncodingOption];

// the highest square value each encoding can write, indexed by EncodingOption; blank (0) is '0' on top of these
const maxValues: readonly number[] = [35, 34, 9, 26, 25];
const encodingNames: readonly string[] = Object.keys(EncodingOption);

function maxValue(p_encoding: EncodingOption): number {
    const a_maxValue = Number.isInteger(p_encoding) ? maxValues[p_encoding] : undefined;
    if (a_maxValue === undefined) throw new RangeError(`unknown encoding ${p_encoding}`);
    return a_maxValue;
}

/**
 * The highest rank whose grids an encoding can write; a rank r grid holds values up to r^2.
 * Never above Sudoku.maxRank, since no encoding writes past 35.
 * @param p_encoding The character set to check.
 * @returns 3 for {@link EncodingOption.DigitsOnly}, 5 for every other encoding.
 * @throws {RangeError} The encoding is not an {@link EncodingOption} value.
 */
export function maxRank(p_encoding: EncodingOption): number {
    return Math.trunc(Math.sqrt(maxValue(p_encoding)));
}

// the letter at index p_letterIdx of A to Z with O skipped; 'A' = 65, 'O' - 'A' = 14
function letterMinusO(p_letterIdx: number): string {
    return String.fromCharCode(65 + (p_letterIdx < 14 ? p_letterIdx : p_letterIdx + 1));
}

/**
 * The character an encoding writes for one square value; blank (0) is '0' in every encoding.
 * @param p_value The square value, from 0 (blank) up to what the encoding can write.
 * @param p_encoding The character set to write it in.
 * @returns A single character.
 * @throws {RangeError} The value is not an integer within 0 and what the encoding can write,
 * or the encoding is not an {@link EncodingOption} value.
 */
export function getSymbol(p_value: number, p_encoding: EncodingOption): string {
    const a_maxValue = maxValue(p_encoding);
    if (!Number.isInteger(p_value) || p_value < 0 || p_value > a_maxValue)
        throw new RangeError(`value ${p_value} is outside 0..${a_maxValue} for ${encodingNames[p_encoding]} encoding`);
    if (p_value === 0) return "0";
    // '0' = 48, 'A' - 10 = 55, 'A' - 1 = 64
    switch (p_encoding) {
        case EncodingOption.All:
            return String.fromCharCode(p_value <= 9 ? 48 + p_value : 55 + p_value);
        case EncodingOption.AllMinusO:
            return p_value <= 9 ? String.fromCharCode(48 + p_value) : letterMinusO(p_value - 10);
        case EncodingOption.DigitsOnly:
            return String.fromCharCode(48 + p_value);
        case EncodingOption.LettersOnly:
            return String.fromCharCode(64 + p_value);
        case EncodingOption.LettersOnlyMinusO:
            return letterMinusO(p_value - 1);
    }
}

// the value one character code stands for under p_encoding, or -1 when the encoding doesn't use that character
function getValue(p_char: number, p_encoding: EncodingOption): number {
    // '0'..'9' = 48..57, 'A'..'Z' = 65..90, 'a'..'z' = 97..122, 'O' = 79
    if (p_char === 48) return 0;
    // ASCII-only case fold; toUpperCase would also turn 'ı' and 'ſ' into letters
    const a_upper = p_char >= 97 && p_char <= 122 ? p_char - 32 : p_char;
    const a_digit = a_upper >= 49 && a_upper <= 57 ? a_upper - 48 : -1;
    const a_letter = a_upper >= 65 && a_upper <= 90 ? a_upper - 65 : -1;
    // O is not a symbol of the minus-O encodings, so it is ignored like any other unused character
    const a_letterMinusO = a_letter < 0 || a_upper === 79 ? -1 : a_upper < 79 ? a_letter : a_letter - 1;
    switch (p_encoding) {
        case EncodingOption.All:
            return a_digit > 0 ? a_digit : a_letter >= 0 ? a_letter + 10 : -1;
        case EncodingOption.AllMinusO:
            return a_digit > 0 ? a_digit : a_letterMinusO >= 0 ? a_letterMinusO + 10 : -1;
        case EncodingOption.DigitsOnly:
            return a_digit;
        case EncodingOption.LettersOnly:
            return a_letter >= 0 ? a_letter + 1 : -1;
        case EncodingOption.LettersOnlyMinusO:
            return a_letterMinusO >= 0 ? a_letterMinusO + 1 : -1;
    }
}

/**
 * Encodes a grid as one character per square, row by row, '.' between rows.
 * By default ({@link EncodingOption.All}): 0 = blank, 1-9 as digits, 10 and above as letters ('A' = 10).
 * Values above 35 ('Z') are unrepresentable and throw, so rank 5 (25x25) at most.
 * @param p_puzz The grid to encode, row by row.
 * @param p_encoding The character set to write; {@link maxRank} gives the ranks it fits.
 * Blank (0) is '0' in every encoding.
 * @returns The puzzle code, e.g. "0012.3400..." by default or in {@link EncodingOption.All},
 * or "00AB.CD00..." in {@link EncodingOption.LettersOnly}.
 * @throws {RangeError} A value is not an integer within 0 and what the encoding can write,
 * or the encoding is not an {@link EncodingOption} value.
 */
export function getPuzzleCode(p_puzz: ArrayLike<number>, p_encoding: EncodingOption = EncodingOption.All): string {
    maxValue(p_encoding);
    const a_rows = Math.trunc(Math.sqrt(p_puzz.length));
    let a_puzzleCode = "";
    for (let i = 0; i < p_puzz.length; ++i) {
        if (i > 0 && i % a_rows === 0) a_puzzleCode += ".";
        a_puzzleCode += getSymbol(p_puzz[i], p_encoding);
    }
    return a_puzzleCode;
}

/**
 * Parses a puzzle code back into a grid array.
 * The encoding can't be told from the code itself (a code without 'O' may or may not be a minus-O one), so it is given.
 * @param p_code Text containing the grid, '0' = blank, letters in either case ('A' or 'a' = 10 by default);
 * every character the encoding doesn't use is ignored, including 'O' in the minus-O encodings.
 * @param p_encoding The character set the code was written in; the default reads it as {@link EncodingOption.All}.
 * @returns One element per recognised character, in order.
 * @throws {RangeError} The encoding is not an {@link EncodingOption} value.
 */
export function getPuzzleArr(p_code: string, p_encoding: EncodingOption = EncodingOption.All): number[] {
    maxValue(p_encoding);
    const a_puzzle: number[] = [];
    for (let i = 0; i < p_code.length; ++i) {
        const a_value = getValue(p_code.charCodeAt(i), p_encoding);
        if (a_value !== -1) a_puzzle.push(a_value);
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
