// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

namespace NMX.SudokuGen.Library.Core;

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;

public static class Utility
{
    /// <summary>
    /// Copies one array into another, up to the destination's length (not the source's).
    /// </summary>
    /// <param name="p_from">Source array; must be at least as long as the destination.</param>
    /// <param name="p_to">Destination array; filled completely.</param>
    public static void Copy(in int[] p_from, in int[] p_to) => Array.Copy(p_from, 0, p_to, 0, p_to.Length);

    /// <summary>
    /// True when both sequences hold the same values in the same order; sequences of different lengths are never the same.
    /// </summary>
    public static bool Same(in IEnumerable<int> p_arr1, in IEnumerable<int> p_arr2) => p_arr1.SequenceEqual(p_arr2);

    public static int Count(in IEnumerable<int> p_arr, in int p_num)
    { int a_count = 0; foreach (int a_value in p_arr) if (a_value == p_num) ++a_count; return a_count; }

    /// <summary>
    /// The 1.0.0 signature of <see cref="Same(in IEnumerable{int}, in IEnumerable{int})"/>, kept so apps compiled against 1.0.0 keep running.
    /// The lowered priority makes new calls bind to the <see cref="IEnumerable{T}"/> overload, so C# 13+ callers never see the obsolete warning;
    /// older compilers ignore the priority and warn on calls with arrays or lists.
    /// </summary>
    [Obsolete("Kept only for apps compiled against 1.0.0; calls bind to Same(IEnumerable<int>, IEnumerable<int>). Will be removed in a future major version.")]
    [EditorBrowsable(EditorBrowsableState.Never)]
    [OverloadResolutionPriority(-1)]
    public static bool Same(in IReadOnlyList<int> p_arr1, in IReadOnlyList<int> p_arr2) => Same((IEnumerable<int>)p_arr1, p_arr2);

    /// <summary>
    /// The 1.0.0 signature of <see cref="Count(in IEnumerable{int}, in int)"/>, kept so apps compiled against 1.0.0 keep running.
    /// </summary>
    [Obsolete("Kept only for apps compiled against 1.0.0; calls bind to Count(IEnumerable<int>, int). Will be removed in a future major version.")]
    [EditorBrowsable(EditorBrowsableState.Never)]
    [OverloadResolutionPriority(-1)]
    public static int Count(in IReadOnlyList<int> p_arr, in int p_num) => Count((IEnumerable<int>)p_arr, p_num);

    public static void Swap2(ref int p_num1, ref int p_num2) => (p_num2, p_num1) = (p_num1, p_num2);

    public static void Init(in int[] p_arr) => Array.Clear(p_arr, 0, p_arr.Length);

    /// <summary>
    /// Fills an array block-wise so that every consecutive block ends up a random permutation of the same value range.
    /// </summary>
    /// <param name="p_random">Random generator driving the shuffle.</param>
    /// <param name="p_arr">Array to fill; its length should be a multiple of <paramref name="p_length"/>.</param>
    /// <param name="p_length">Block size, and the size of the permuted value range.</param>
    /// <param name="p_plus1">When true each block holds 1..length, otherwise 0..length-1.</param>
    public static void InitRandom(in Random p_random, in int[] p_arr, in int p_length, in bool p_plus1)
    {
        for (int i = 0; i < p_arr.Length; ++i) p_arr[i] = i % p_length + (p_plus1 ? 1 : 0);
        for (int r, i = 0; i < p_arr.Length; ++i)
        {
            int a_rows = i / p_length, a_start = a_rows * p_length, a_nextStart = (a_rows + 1) * p_length;
            r = p_random.Next(a_start, a_nextStart); Swap2(ref p_arr[i], ref p_arr[r]);
        }
    }

    /// <summary>
    /// Counts the set bits of <paramref name="p_bits"/> (SWAR popcount;
    /// netstandard2.1 offers no <c>BitOperations.PopCount</c>).
    /// </summary>
    /// <param name="p_bits">The bits to count.</param>
    /// <returns>The number of set bits, 0..32.</returns>
    public static int PopCount(in uint p_bits)
    {
        uint a_bits = p_bits;
        a_bits -= (a_bits >> 1) & 0x55555555u;
        a_bits = (a_bits & 0x33333333u) + ((a_bits >> 2) & 0x33333333u);
        return (int)((((a_bits + (a_bits >> 4)) & 0x0F0F0F0Fu) * 0x01010101u) >> 24);
    }

    /// <summary>
    /// Character sets a puzzle code can be written in. Blank (0) is '0' in every one of them.
    /// </summary>
    public enum EncodingOption
    {
        /// <summary>
        /// 1 to 9 as digits, then 10 to 35 as A to Z. Fits every rank.
        /// </summary>
        All,

        /// <summary>
        /// 1 to 9 as digits, then 10 to 34 as A to Z without O, so it can't be misread as the blank '0'. Fits every rank.
        /// </summary>
        AllMinusO,

        /// <summary>
        /// 1 to 9 as digits only. Fits rank 3 and below.
        /// </summary>
        DigitsOnly,

        /// <summary>
        /// 1 to 26 as A to Z. Fits every rank.
        /// </summary>
        LettersOnly,

        /// <summary>
        /// 1 to 25 as A to Z without O, so it can't be misread as the blank '0'. Fits every rank.
        /// </summary>
        LettersOnlyMinusO,
    }

    // the highest square value each encoding can write; blank (0) is '0' on top of these
    private static int MaxValue(in EncodingOption p_encoding) => p_encoding switch
    {
        EncodingOption.All => 35,
        EncodingOption.AllMinusO => 34,
        EncodingOption.DigitsOnly => 9,
        EncodingOption.LettersOnly => 26,
        EncodingOption.LettersOnlyMinusO => 25,
        _ => throw new ArgumentOutOfRangeException(nameof(p_encoding), p_encoding, null),
    };

    /// <summary>
    /// The highest rank whose grids <paramref name="p_encoding"/> can write; a rank r grid holds values up to r^2.
    /// </summary>
    public static int MaxRank(in EncodingOption p_encoding) => Math.Min((int)Math.Sqrt(MaxValue(p_encoding)), Sudoku.maxRank);

    // the letter at index p_letterIdx of A to Z with O skipped
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static char LetterMinusO(in int p_letterIdx) => (char)('A' + (p_letterIdx < 'O' - 'A' ? p_letterIdx : p_letterIdx + 1));

    /// <summary>
    /// The character <paramref name="p_encoding"/> writes for one square value; blank (0) is '0' in every encoding.
    /// </summary>
    /// <param name="p_value">The square value, from 0 (blank) up to what the encoding can write.</param>
    /// <param name="p_encoding">The character set to write it in.</param>
    /// <exception cref="ArgumentOutOfRangeException">The value is negative or too large for the encoding.</exception>
    public static char GetSymbol(in int p_value, in EncodingOption p_encoding)
    {
        int a_maxValue = MaxValue(p_encoding);
        if (p_value < 0 || p_value > a_maxValue)
            throw new ArgumentOutOfRangeException(nameof(p_value), $"value {p_value} is outside 0..{a_maxValue} for {p_encoding} encoding");
        if (p_value == 0) return '0';
        return p_encoding switch
        {
            EncodingOption.All => p_value <= 9 ? (char)('0' + p_value) : (char)('A' + p_value - 10),
            EncodingOption.AllMinusO => p_value <= 9 ? (char)('0' + p_value) : LetterMinusO(p_value - 10),
            EncodingOption.DigitsOnly => (char)('0' + p_value),
            EncodingOption.LettersOnly => (char)('A' + p_value - 1),
            EncodingOption.LettersOnlyMinusO => LetterMinusO(p_value - 1),
            _ => throw new ArgumentOutOfRangeException(nameof(p_encoding), p_encoding, null),
        };
    }

    // the value one character stands for under p_encoding, or -1 when the encoding doesn't use that character
    private static int GetValue(in char p_symbol, in EncodingOption p_encoding)
    {
        if (p_symbol == '0') return 0;
        // ASCII-only case fold; char.ToUpperInvariant would also turn 'ı' and 'ſ' into letters
        char a_upper = p_symbol is >= 'a' and <= 'z' ? (char)(p_symbol - 'a' + 'A') : p_symbol;
        int a_digit = a_upper is >= '1' and <= '9' ? a_upper - '0' : -1;
        int a_letter = a_upper is >= 'A' and <= 'Z' ? a_upper - 'A' : -1;
        // O is not a symbol of the minus-O encodings, so it is ignored like any other unused character
        int a_letterMinusO = a_letter < 0 || a_upper == 'O' ? -1 : a_upper < 'O' ? a_letter : a_letter - 1;
        return p_encoding switch
        {
            EncodingOption.All => a_digit > 0 ? a_digit : a_letter >= 0 ? a_letter + 10 : -1,
            EncodingOption.AllMinusO => a_digit > 0 ? a_digit : a_letterMinusO >= 0 ? a_letterMinusO + 10 : -1,
            EncodingOption.DigitsOnly => a_digit,
            EncodingOption.LettersOnly => a_letter >= 0 ? a_letter + 1 : -1,
            EncodingOption.LettersOnlyMinusO => a_letterMinusO >= 0 ? a_letterMinusO + 1 : -1,
            _ => throw new ArgumentOutOfRangeException(nameof(p_encoding), p_encoding, null),
        };
    }

    /// <summary>
    /// Encodes a grid as one character per square, row by row: 0 = blank, 1-9 as digits,
    /// 10 and above as letters ('A' = 10), '.' between rows. Same as <see cref="EncodingOption.All"/>.
    /// Values above 35 ('Z') are unrepresentable and throw, so rank 5 (25x25) at most.
    /// </summary>
    /// <param name="p_puzz">The grid to encode, row by row.</param>
    /// <returns>The puzzle code, e.g. "0012.3400...".</returns>
    public static string GetPuzzleCode(in IReadOnlyList<int> p_puzz) => GetPuzzleCode(p_puzz, EncodingOption.All);

    /// <summary>
    /// Encodes a grid as one character per square in <paramref name="p_encoding"/>, row by row, '.' between rows.
    /// Blank (0) is '0' in every encoding.
    /// </summary>
    /// <param name="p_puzz">The grid to encode, row by row.</param>
    /// <param name="p_encoding">The character set to write; <see cref="MaxRank"/> gives the ranks it fits.</param>
    /// <returns>The puzzle code, e.g. "0012.3400..." in <see cref="EncodingOption.All"/>
    /// or "00AB.CD00..." in <see cref="EncodingOption.LettersOnly"/>.</returns>
    /// <exception cref="ArgumentOutOfRangeException">A value is negative or too large for the encoding.</exception>
    public static string GetPuzzleCode(in IReadOnlyList<int> p_puzz, in EncodingOption p_encoding)
    {
        int a_rows = (int)Math.Sqrt(p_puzz.Count);
        StringBuilder a_puzzleCode = new(p_puzz.Count + a_rows);
        for (int i = 0; i < p_puzz.Count; ++i)
        {
            if (i > 0 && i % a_rows == 0) a_puzzleCode.Append('.');
            a_puzzleCode.Append(GetSymbol(p_puzz[i], p_encoding));
        }
        return a_puzzleCode.ToString();
    }

    /// <summary>
    /// Parses a puzzle code back into a grid array. Same as <see cref="EncodingOption.All"/>.
    /// </summary>
    /// <param name="p_code">Text containing the grid as digits and letters ('A' or 'a' = 10);
    /// every other character is ignored.</param>
    /// <returns>One element per recognised character, in order.</returns>
    public static int[] GetPuzzleArr(in string p_code) => GetPuzzleArr(p_code, EncodingOption.All);

    /// <summary>
    /// Parses a puzzle code written in <paramref name="p_encoding"/> back into a grid array.
    /// The encoding can't be told from the code itself (a code without 'O' may or may not be a minus-O one), so it is given.
    /// </summary>
    /// <param name="p_code">Text containing the grid, '0' = blank, letters in either case;
    /// every character the encoding doesn't use is ignored, including 'O' in the minus-O encodings.</param>
    /// <param name="p_encoding">The character set the code was written in.</param>
    /// <returns>One element per recognised character, in order.</returns>
    public static int[] GetPuzzleArr(in string p_code, in EncodingOption p_encoding)
    {
        List<int> a_puzzle = new(p_code.Length);
        foreach (char a_char in p_code)
        {
            int a_value = GetValue(a_char, p_encoding);
            if (a_value != -1) a_puzzle.Add(a_value);
        }
        return [.. a_puzzle];
    }
}
