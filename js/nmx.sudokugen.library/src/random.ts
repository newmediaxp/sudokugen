// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

const mBig = 2147483647,
    mSeed = 161803398,
    sampleScale = 1 / mBig;

/**
 * Knuth's subtractive generator, step for step as .NET's seeded System.Random runs it,
 * so a seed gives the same puzzle here as in the C# library.
 * The Int32Array stores wrap like C#'s unchecked int arithmetic, which large seeds rely on.
 */
export class Random {
    private readonly seedArray = new Int32Array(56);
    private iNext = 0;
    private iNextP = 21;

    /**
     * @param p_seed Any 32-bit integer; like .NET, a seed and its negation give the same sequence.
     */
    constructor(p_seed: number) {
        const a_seedArray = this.seedArray;
        let a_mj = mSeed - (p_seed === -2147483648 ? mBig : Math.abs(p_seed)),
            a_mk = 1;
        a_seedArray[55] = a_mj;
        for (let a_ii = 0, i = 1; i < 55; ++i) {
            // the range [1..55] is special (Knuth), so position 0 stays unused
            a_ii += 21;
            if (a_ii >= 55) a_ii -= 55;
            a_seedArray[a_ii] = a_mk;
            a_mk = (a_mj - a_mk) | 0;
            if (a_mk < 0) a_mk = (a_mk + mBig) | 0;
            a_mj = a_seedArray[a_ii];
        }
        for (let k = 1; k < 5; ++k)
            for (let i = 1; i < 56; ++i) {
                let a_n = i + 30;
                if (a_n >= 55) a_n -= 55;
                a_seedArray[i] -= a_seedArray[1 + a_n];
                if (a_seedArray[i] < 0) a_seedArray[i] += mBig;
            }
    }

    /**
     * An integer within p_min..p_max - 1, as .NET's Random.Next(min, max) returns it.
     * Only ranges up to 2^31 - 1 wide; .NET draws wider ones differently.
     */
    next(p_min: number, p_max: number): number {
        const a_seedArray = this.seedArray;
        let a_iNext = this.iNext + 1,
            a_iNextP = this.iNextP + 1;
        if (a_iNext >= 56) a_iNext = 1;
        if (a_iNextP >= 56) a_iNextP = 1;
        let a_sample = (a_seedArray[a_iNext] - a_seedArray[a_iNextP]) | 0;
        if (a_sample === mBig) --a_sample;
        if (a_sample < 0) a_sample += mBig;
        a_seedArray[a_iNext] = a_sample;
        this.iNext = a_iNext;
        this.iNextP = a_iNextP;
        return Math.trunc(a_sample * sampleScale * (p_max - p_min)) + p_min;
    }
}

/**
 * A seed for the unseeded calls; their results only need to differ, not to be unpredictable.
 */
export function randomSeed(): number {
    return (Math.random() * 4294967296) | 0;
}
