// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

import type { Random } from "./random.ts";
import { count, initRandom, popCount } from "./utility.ts";

/**
 * Search nodes a single solvability trial in uniqueWithout may spend before giving up on the removal.
 * Bounds Sudoku.create's runtime at extreme blank counts without ever breaking uniqueness;
 * bypassed by its exhaustive option.
 * Recalibrated for locked candidates (2026-06-12): max-blank counts stayed flat from 10 up to 100
 * at ranks 4 and 5 while runtime scaled with the budget, so the smallest equal-quality value wins.
 */
const trialBudgetPerSquare = 10;

/** C#'s int.MaxValue: the node budget of an exhaustive fill, and "no count yet". */
const intMax = 0x7fffffff;

/**
 * Candidate order used by fillConstrained for each blank square.
 */
const FillMode = {
    /** 1..rows in order — deterministic solving. */
    NoInput: 0,
    /** The pre-shuffled values of randomRows's row — randomised generation. */
    RandomRow: 1,
    /**
     * The solution value + 1 onwards, wrapping, so the known solution value is tried last.
     * Completing the grid before reaching it proves a second solution exists (see unique).
     */
    Uniqueness: 2,
} as const;
type FillMode = (typeof FillMode)[keyof typeof FillMode];

/**
 * The search engine behind Sudoku.create and Sudoku.solve: a port of the C# Sudoku class's
 * private state and methods, with the same names (lower camel case) so changes port line by line.
 * Each instance serves one create or solve call; the Sudoku it yields keeps only the grids.
 * Grids are flat row-by-row arrays of squares values, 0 = blank; masks hold bit v for value v.
 */
export class Solver {
    readonly rank: number;
    readonly rows: number;
    readonly squares: number;
    readonly remove: number;
    removed = 0;
    readonly puzzle: Int32Array;
    readonly solution: Int32Array;

    private readonly squaresInSegmentRow: number;
    private readonly trialBudget: number;
    private readonly altSolution: Int32Array;
    private readonly randomRows: Int32Array;
    private readonly rowMask: Int32Array;
    private readonly colMask: Int32Array;
    private readonly segMask: Int32Array;
    private readonly rowOnceMask: Int32Array;
    private readonly colOnceMask: Int32Array;
    private readonly segOnceMask: Int32Array;
    private readonly rowTwiceMask: Int32Array;
    private readonly colTwiceMask: Int32Array;
    private readonly segTwiceMask: Int32Array;
    private readonly rowThriceMask: Int32Array;
    private readonly colThriceMask: Int32Array;
    private readonly segThriceMask: Int32Array;
    private readonly candMask: Int32Array;
    private readonly rowBlockMask: Int32Array;
    private readonly colBlockMask: Int32Array;
    private readonly rowBlockElim: Int32Array;
    private readonly colBlockElim: Int32Array;
    private readonly rowConfMask: Int32Array;
    private readonly colConfMask: Int32Array;
    private readonly nakedSquares: Int32Array;
    private readonly nakedMasks: Int32Array;
    private readonly fullMask: number;
    private readonly rowOf: Int32Array;
    private readonly colOf: Int32Array;
    private readonly segOf: Int32Array;
    private readonly rowBlockOf: Int32Array;
    private readonly colBlockOf: Int32Array;
    private readonly unitSquares: Int32Array;
    private fillNodesLeft = 0;

    // results of scan_Candidates, search_UnitForced and search_NakedPairs, standing in for C#'s ref and out parameters
    private bestIdx = -1;
    private bestCount = intMax;
    private bestMask = 0;
    private eliminated = false;

    /**
     * @param p_rank Segment size, already validated.
     * @param p_remove Blank squares to aim for, already resolved and validated.
     * @param p_exhaustive Skips the per-trial node budget (see trialBudgetPerSquare).
     */
    constructor(p_rank: number, p_remove: number, p_exhaustive: boolean) {
        const a_rows = p_rank * p_rank,
            a_squares = a_rows * a_rows,
            a_squaresInSegmentRow = a_rows * p_rank;
        this.rank = p_rank;
        this.rows = a_rows;
        this.squares = a_squares;
        this.squaresInSegmentRow = a_squaresInSegmentRow;
        this.remove = p_remove;
        this.trialBudget = p_exhaustive ? intMax : a_squares * trialBudgetPerSquare;
        this.puzzle = new Int32Array(a_squares);
        this.solution = new Int32Array(a_squares);
        this.altSolution = new Int32Array(a_squares);
        this.randomRows = new Int32Array(a_squares);
        this.rowMask = new Int32Array(a_rows);
        this.colMask = new Int32Array(a_rows);
        this.segMask = new Int32Array(a_rows);
        this.rowOnceMask = new Int32Array(a_rows);
        this.colOnceMask = new Int32Array(a_rows);
        this.segOnceMask = new Int32Array(a_rows);
        this.rowTwiceMask = new Int32Array(a_rows);
        this.colTwiceMask = new Int32Array(a_rows);
        this.segTwiceMask = new Int32Array(a_rows);
        this.rowThriceMask = new Int32Array(a_rows);
        this.colThriceMask = new Int32Array(a_rows);
        this.segThriceMask = new Int32Array(a_rows);
        this.candMask = new Int32Array(a_squares);
        this.rowBlockMask = new Int32Array(a_squaresInSegmentRow);
        this.colBlockMask = new Int32Array(a_squaresInSegmentRow);
        this.rowBlockElim = new Int32Array(a_squaresInSegmentRow);
        this.colBlockElim = new Int32Array(a_squaresInSegmentRow);
        this.rowConfMask = new Int32Array(a_rows);
        this.colConfMask = new Int32Array(a_rows);
        this.nakedSquares = new Int32Array(a_rows);
        this.nakedMasks = new Int32Array(a_rows);
        this.fullMask = ((1 << a_rows) - 1) << 1;
        this.rowOf = new Int32Array(a_squares);
        this.colOf = new Int32Array(a_squares);
        this.segOf = new Int32Array(a_squares);
        this.rowBlockOf = new Int32Array(a_squares);
        this.colBlockOf = new Int32Array(a_squares);
        this.unitSquares = new Int32Array(3 * a_rows * a_rows);
        const a_unitFill = new Int32Array(3 * a_rows);
        for (let i = 0; i < a_squares; ++i) {
            const a_row = Math.trunc(i / a_rows),
                a_col = i % a_rows,
                a_seg = Math.trunc(i / a_squaresInSegmentRow) * p_rank + Math.trunc(a_col / p_rank);
            this.rowOf[i] = a_row;
            this.colOf[i] = a_col;
            this.segOf[i] = a_seg;
            this.rowBlockOf[i] = a_row * p_rank + Math.trunc(a_col / p_rank);
            this.colBlockOf[i] = a_col * p_rank + Math.trunc(a_row / p_rank);
            // units 0..rows-1 are the rows, then the columns, then the segments
            const a_colUnit = a_rows + a_col,
                a_segUnit = 2 * a_rows + a_seg;
            this.unitSquares[a_row * a_rows + a_unitFill[a_row]++] = i;
            this.unitSquares[a_colUnit * a_rows + a_unitFill[a_colUnit]++] = i;
            this.unitSquares[a_segUnit * a_rows + a_unitFill[a_segUnit]++] = i;
        }
    }

    //#region Create

    /**
     * Seeds the diagonal segments with random permutations. They never share a row or column,
     * so they can be filled independently without backtracking.
     */
    private set_DiagonalSegments(p_arr: Int32Array, p_random: Random): void {
        const a_inputs = new Int32Array(this.squaresInSegmentRow);
        initRandom(p_random, a_inputs, this.rows, true);
        for (let i_seg = 0; i_seg < this.rank; ++i_seg)
            for (let a_startIdx = i_seg * this.rank * (this.rows + 1), i_row = 0; i_row < this.rank; ++i_row)
                for (let i_col = 0; i_col < this.rank; ++i_col)
                    p_arr[a_startIdx + i_row * this.rows + i_col] =
                        a_inputs[i_seg * this.rows + i_row * this.rank + i_col];
    }

    /**
     * True when puzzle stays uniquely solvable after blanking p_idx.
     * The puzzle was unique before the removal, so a second solution would have to place another
     * conflict-free candidate there; each is trialled for solvability under trialBudget.
     * An exhausted trial counts as solvable, rejecting the removal — safe, but may undershoot max blanks.
     * @param p_idx Index of the square just blanked in puzzle.
     * @param p_removed The solution value the square held before blanking.
     * @returns True when no alternative value at p_idx completes the puzzle.
     */
    private uniqueWithout(p_idx: number, p_removed: number): boolean {
        this.altSolution.set(this.puzzle);
        this.loadMasks(this.altSolution);
        // captured before the trials below rebuild the masks
        const a_usedMask =
            this.rowMask[this.rowOf[p_idx]] | this.colMask[this.colOf[p_idx]] | this.segMask[this.segOf[p_idx]];
        for (let a_input = 1; a_input <= this.rows; ++a_input) {
            if (a_input === p_removed || (a_usedMask & (1 << a_input)) !== 0) continue;
            this.altSolution[p_idx] = a_input;
            if (this.fillRemaining(this.altSolution, FillMode.NoInput, this.trialBudget)) return false;
            // a failed fill backtracks every square it set, so only p_idx needs resetting
            this.altSolution[p_idx] = 0;
        }
        return true;
    }

    /**
     * Blanks random squares one at a time, keeping only removals that preserve uniqueness (via uniqueWithout),
     * until remove blanks are reached or no square can be removed.
     */
    prune(p_random: Random): void {
        const a_indexes = new Int32Array(this.squares);
        initRandom(p_random, a_indexes, this.squares, false);
        this.puzzle.set(this.solution);
        this.removed = 0;
        for (let i = 0; i < a_indexes.length && this.removed < this.remove; ++i) {
            const a_idx = a_indexes[i],
                a_input = this.puzzle[a_idx];
            if (a_input === 0) continue;
            this.puzzle[a_idx] = 0;
            if (this.uniqueWithout(a_idx, a_input)) {
                ++this.removed;
                continue;
            }
            this.puzzle[a_idx] = a_input;
        }
    }

    //#endregion

    //#region Fill

    /**
     * Rebuilds rowMask, colMask and segMask from p_arr:
     * bit v of a unit's mask is set when value v is placed in that unit.
     * @param p_arr The grid the masks should describe.
     */
    private loadMasks(p_arr: Int32Array): void {
        this.rowMask.fill(0);
        this.colMask.fill(0);
        this.segMask.fill(0);
        for (let i = 0; i < this.squares; ++i) {
            if (p_arr[i] === 0) continue;
            const a_valueBit = 1 << p_arr[i];
            this.rowMask[this.rowOf[i]] |= a_valueBit;
            this.colMask[this.colOf[i]] |= a_valueBit;
            this.segMask[this.segOf[i]] |= a_valueBit;
        }
    }

    /**
     * Recursive backtracker over the blank squares of p_arr, always working on the most constrained blank first,
     * forced squares (one candidate left, or a hidden single) are placed without branching,
     * and a grid is abandoned the moment any blank or needed unit value runs out of options.
     * Deductions escalate lazily: only when nothing is forced are locked candidates derived
     * (see derive_BlockEliminations) and the scan repeated on the narrowed candidates,
     * then naked pairs (see search_NakedPairs) as the last rung before guessing,
     * so easy grids never pay for the expensive deductions. All deductions keep every completion.
     * When guessing is unavoidable, a two-homes value (see fillValuePair) is preferred
     * over a square with 3+ candidates.
     * p_mode decides the candidate order per square.
     * The masks must describe p_arr on entry and are stale after a completed fill — enter via fillRemaining.
     * @param p_arr The grid to fill, solution or altSolution.
     * @param p_mode Candidate order per square.
     * @returns True when the grid was completed, or the node budget ran out (leaving p_arr
     * partially filled — see fillRemaining); a failed fill leaves it and the masks unchanged.
     */
    private fillConstrained(p_arr: Int32Array, p_mode: FillMode): boolean {
        // out of budget: give up, reporting the grid completable — the conservative answer for uniqueness trials
        if (--this.fillNodesLeft < 0) return true;
        if (!this.scan_Candidates(p_arr, false)) return false;
        if (this.bestIdx === -1) return true;
        if (this.bestCount > 1 && !this.search_UnitForced(p_arr)) return false;
        // nothing forced cheaply — escalate to locked candidates and rescan before resorting to guessing
        if (this.bestCount > 1) {
            this.derive_BlockEliminations(p_arr);
            if (!this.scan_Candidates(p_arr, true)) return false;
            if (this.bestCount > 1 && !this.search_UnitForced(p_arr)) return false;
            // still nothing — escalate once more to naked pairs, rescanning only when they removed candidates
            if (this.bestCount > 1) {
                if (!this.search_NakedPairs(p_arr)) return false;
                if (this.eliminated) {
                    if (!this.scan_Candidates(p_arr, true)) return false;
                    if (this.bestCount > 1 && !this.search_UnitForced(p_arr)) return false;
                }
            }
            // a value with exactly two homes in a unit is a narrower guess than a square with 3+ candidates
            if (this.bestCount > 2)
                for (let i = 0; i < this.rows; ++i) {
                    let a_pairMask = this.rowTwiceMask[i] & ~this.rowThriceMask[i];
                    let a_unitOf = this.rowOf;
                    if (a_pairMask === 0) {
                        a_pairMask = this.colTwiceMask[i] & ~this.colThriceMask[i];
                        a_unitOf = this.colOf;
                    }
                    if (a_pairMask === 0) {
                        a_pairMask = this.segTwiceMask[i] & ~this.segThriceMask[i];
                        a_unitOf = this.segOf;
                    }
                    if (a_pairMask === 0) continue;
                    return this.fillValuePair(p_arr, p_mode, a_unitOf, i, a_pairMask & ~(a_pairMask - 1));
                }
        }
        // the recursion below overwrites the fields, so this square's results move to locals first
        const a_bestIdx = this.bestIdx,
            a_bestFreeMask = this.bestMask;
        const a_row = this.rowOf[a_bestIdx],
            a_col = this.colOf[a_bestIdx],
            a_seg = this.segOf[a_bestIdx];
        for (let i = 0; i < this.rows; ++i) {
            let a_input: number;
            if (p_mode === FillMode.NoInput) a_input = i + 1;
            else if (p_mode === FillMode.RandomRow) a_input = this.randomRows[a_row * this.rows + i];
            else {
                a_input = this.solution[a_bestIdx] + i + 1;
                if (a_input > this.rows) a_input -= this.rows;
            }
            const a_inputBit = 1 << a_input;
            if ((a_bestFreeMask & a_inputBit) === 0) continue;
            p_arr[a_bestIdx] = a_input;
            this.rowMask[a_row] |= a_inputBit;
            this.colMask[a_col] |= a_inputBit;
            this.segMask[a_seg] |= a_inputBit;
            if (this.fillConstrained(p_arr, p_mode)) return true;
            this.rowMask[a_row] &= ~a_inputBit;
            this.colMask[a_col] &= ~a_inputBit;
            this.segMask[a_seg] &= ~a_inputBit;
            p_arr[a_bestIdx] = 0;
        }
        return false;
    }

    /**
     * One deduction pass over the blanks of p_arr: refreshes candMask,
     * rebuilds the once/twice/thrice unit masks and picks the most constrained square.
     * Stops early on a naked single, leaving the unit masks incomplete — the callers' count guards cover that.
     * Sets bestIdx (the most constrained blank square; -1 when the grid is full), bestCount
     * (that square's candidate count) and bestMask (that square's candidate mask).
     * @param p_arr The grid being filled.
     * @param p_refine False derives candidates from the unit masks; true narrows the stored ones
     * by rowBlockElim/colBlockElim (see derive_BlockEliminations).
     * @returns False when some blank has no candidate left.
     */
    private scan_Candidates(p_arr: Int32Array, p_refine: boolean): boolean {
        const a_rowOnce = this.rowOnceMask,
            a_colOnce = this.colOnceMask,
            a_segOnce = this.segOnceMask,
            a_rowTwice = this.rowTwiceMask,
            a_colTwice = this.colTwiceMask,
            a_segTwice = this.segTwiceMask,
            a_rowThrice = this.rowThriceMask,
            a_colThrice = this.colThriceMask,
            a_segThrice = this.segThriceMask;
        // the hottest loop of the search: fields are read once into locals
        const a_rowOf = this.rowOf,
            a_colOf = this.colOf,
            a_segOf = this.segOf,
            a_rowMask = this.rowMask,
            a_colMask = this.colMask,
            a_segMask = this.segMask,
            a_candMask = this.candMask,
            a_rowBlockOf = this.rowBlockOf,
            a_colBlockOf = this.colBlockOf,
            a_rowBlockElim = this.rowBlockElim,
            a_colBlockElim = this.colBlockElim,
            a_fullMask = this.fullMask,
            a_squares = this.squares;
        let a_bestIdx = -1,
            a_bestCount = intMax,
            a_bestMask = this.bestMask;
        for (let i = 0; i < this.rows; ++i) {
            a_rowOnce[i] = 0;
            a_colOnce[i] = 0;
            a_segOnce[i] = 0;
            a_rowTwice[i] = 0;
            a_colTwice[i] = 0;
            a_segTwice[i] = 0;
            a_rowThrice[i] = 0;
            a_colThrice[i] = 0;
            a_segThrice[i] = 0;
        }
        for (let i = 0; i < a_squares; ++i) {
            if (p_arr[i] !== 0) continue;
            const a_r = a_rowOf[i],
                a_c = a_colOf[i],
                a_s = a_segOf[i];
            const a_freeMask = p_refine
                ? a_candMask[i] & ~a_rowBlockElim[a_rowBlockOf[i]] & ~a_colBlockElim[a_colBlockOf[i]]
                : ~(a_rowMask[a_r] | a_colMask[a_c] | a_segMask[a_s]) & a_fullMask;
            if (a_freeMask === 0) return false;
            a_candMask[i] = a_freeMask;
            const a_count = popCount(a_freeMask);
            // values seen in one blank of the unit so far vs in two vs in more:
            // singles are once & ~twice, pairs twice & ~thrice
            a_rowThrice[a_r] |= a_rowTwice[a_r] & a_freeMask;
            a_rowTwice[a_r] |= a_rowOnce[a_r] & a_freeMask;
            a_rowOnce[a_r] |= a_freeMask;
            a_colThrice[a_c] |= a_colTwice[a_c] & a_freeMask;
            a_colTwice[a_c] |= a_colOnce[a_c] & a_freeMask;
            a_colOnce[a_c] |= a_freeMask;
            a_segThrice[a_s] |= a_segTwice[a_s] & a_freeMask;
            a_segTwice[a_s] |= a_segOnce[a_s] & a_freeMask;
            a_segOnce[a_s] |= a_freeMask;
            if (a_count >= a_bestCount) continue;
            a_bestCount = a_count;
            a_bestIdx = i;
            a_bestMask = a_freeMask;
            // a forced square cannot be beaten, except by a dead one ending the fill anyway
            if (a_bestCount === 1) break;
        }
        this.bestIdx = a_bestIdx;
        this.bestCount = a_bestCount;
        this.bestMask = a_bestMask;
        return true;
    }

    /**
     * Unit-level deductions over the masks of a completed scan_Candidates pass: fails the
     * fill when a unit can no longer host a value it still needs, and redirects the fill to a hidden
     * single (a value with one possible square left in a unit) when one exists, updating
     * bestIdx, bestCount (to 1) and bestMask (to the value's bit).
     * @param p_arr The grid being filled.
     * @returns False when a needed value has no square left in some unit.
     */
    private search_UnitForced(p_arr: Int32Array): boolean {
        const a_fullMask = this.fullMask;
        for (let i = 0; i < this.rows; ++i) {
            if ((a_fullMask & ~(this.rowMask[i] | this.rowOnceMask[i])) !== 0) return false;
            if ((a_fullMask & ~(this.colMask[i] | this.colOnceMask[i])) !== 0) return false;
            if ((a_fullMask & ~(this.segMask[i] | this.segOnceMask[i])) !== 0) return false;
            let a_hiddenMask = this.rowOnceMask[i] & ~this.rowTwiceMask[i];
            let a_unitOf = this.rowOf;
            if (a_hiddenMask === 0) {
                a_hiddenMask = this.colOnceMask[i] & ~this.colTwiceMask[i];
                a_unitOf = this.colOf;
            }
            if (a_hiddenMask === 0) {
                a_hiddenMask = this.segOnceMask[i] & ~this.segTwiceMask[i];
                a_unitOf = this.segOf;
            }
            if (a_hiddenMask === 0) continue;
            this.bestMask = a_hiddenMask & ~(a_hiddenMask - 1);
            this.bestIdx = this.search_HiddenSingle(p_arr, a_unitOf, i, this.bestMask);
            this.bestCount = 1;
            break;
        }
        return true;
    }

    /**
     * Locked candidates: summarises candMask per block (line∩segment intersection) and
     * collects into rowBlockElim/colBlockElim the values each block cannot host:
     * a value confined to one block of a segment stays out of the block's line elsewhere (pointing),
     * one confined to one block of a line stays out of the block's segment elsewhere (claiming).
     * @param p_arr The grid being filled; candMask must describe its blanks.
     */
    private derive_BlockEliminations(p_arr: Int32Array): void {
        const a_rank = this.rank,
            a_candMask = this.candMask,
            a_rowBlockMask = this.rowBlockMask,
            a_colBlockMask = this.colBlockMask,
            a_rowBlockElim = this.rowBlockElim,
            a_colBlockElim = this.colBlockElim;
        a_rowBlockMask.fill(0);
        a_colBlockMask.fill(0);
        a_rowBlockElim.fill(0);
        a_colBlockElim.fill(0);
        for (let i = 0; i < this.squares; ++i) {
            if (p_arr[i] !== 0) continue;
            a_rowBlockMask[this.rowBlockOf[i]] |= a_candMask[i];
            a_colBlockMask[this.colBlockOf[i]] |= a_candMask[i];
        }
        // per line, the values confined to a single one of its blocks
        for (let i = 0; i < this.rows; ++i) {
            let a_once = 0,
                a_twice = 0;
            for (let j = i * a_rank, a_limitIdx = j + a_rank; j < a_limitIdx; ++j) {
                a_twice |= a_once & a_rowBlockMask[j];
                a_once |= a_rowBlockMask[j];
            }
            this.rowConfMask[i] = a_once & ~a_twice;
            a_once = 0;
            a_twice = 0;
            for (let j = i * a_rank, a_limitIdx = j + a_rank; j < a_limitIdx; ++j) {
                a_twice |= a_once & a_colBlockMask[j];
                a_once |= a_colBlockMask[j];
            }
            this.colConfMask[i] = a_once & ~a_twice;
        }
        // band/stack from the loop counters, avoiding a per-segment div+mod by the runtime rank
        for (let a_bandIdx = 0; a_bandIdx < a_rank; ++a_bandIdx)
            for (let a_stackIdx = 0; a_stackIdx < a_rank; ++a_stackIdx) {
                let a_once = 0,
                    a_twice = 0;
                for (let j = 0; j < a_rank; ++j) {
                    const a_blockMask = a_rowBlockMask[(a_bandIdx * a_rank + j) * a_rank + a_stackIdx];
                    a_twice |= a_once & a_blockMask;
                    a_once |= a_blockMask;
                }
                let a_segConfMask = a_once & ~a_twice;
                for (let j = 0; j < a_rank; ++j) {
                    const a_lineIdx = a_bandIdx * a_rank + j,
                        a_blk = a_lineIdx * a_rank + a_stackIdx;
                    const a_pointMask = a_rowBlockMask[a_blk] & a_segConfMask;
                    const a_claimMask = a_rowBlockMask[a_blk] & this.rowConfMask[a_lineIdx];
                    if ((a_pointMask | a_claimMask) === 0) continue;
                    for (let j2 = 0; j2 < a_rank; ++j2) {
                        if (j2 !== a_stackIdx) a_rowBlockElim[a_lineIdx * a_rank + j2] |= a_pointMask;
                        if (j2 !== j) a_rowBlockElim[(a_bandIdx * a_rank + j2) * a_rank + a_stackIdx] |= a_claimMask;
                    }
                }
                a_once = 0;
                a_twice = 0;
                for (let j = 0; j < a_rank; ++j) {
                    const a_blockMask = a_colBlockMask[(a_stackIdx * a_rank + j) * a_rank + a_bandIdx];
                    a_twice |= a_once & a_blockMask;
                    a_once |= a_blockMask;
                }
                a_segConfMask = a_once & ~a_twice;
                for (let j = 0; j < a_rank; ++j) {
                    const a_lineIdx = a_stackIdx * a_rank + j,
                        a_blk = a_lineIdx * a_rank + a_bandIdx;
                    const a_pointMask = a_colBlockMask[a_blk] & a_segConfMask;
                    const a_claimMask = a_colBlockMask[a_blk] & this.colConfMask[a_lineIdx];
                    if ((a_pointMask | a_claimMask) === 0) continue;
                    for (let j2 = 0; j2 < a_rank; ++j2) {
                        if (j2 !== a_bandIdx) a_colBlockElim[a_lineIdx * a_rank + j2] |= a_pointMask;
                        if (j2 !== j) a_colBlockElim[(a_stackIdx * a_rank + j2) * a_rank + a_bandIdx] |= a_claimMask;
                    }
                }
            }
    }

    /**
     * Naked pairs: two blanks of a unit sharing the same two candidates lock those values between them,
     * so both can be removed from every other square of the unit. Eliminations are applied directly to
     * candMask; the caller rescans when any were made (eliminated is set true).
     * @param p_arr The grid being filled; candMask must describe its blanks.
     * @returns False when an elimination leaves a square without candidates
     * (e.g. a third square of the unit held the same bare pair).
     */
    private search_NakedPairs(p_arr: Int32Array): boolean {
        const a_rows = this.rows,
            a_candMask = this.candMask,
            a_unitSquares = this.unitSquares,
            a_nakedSquares = this.nakedSquares,
            a_nakedMasks = this.nakedMasks;
        this.eliminated = false;
        for (let i_unit = 0; i_unit < 3 * a_rows; ++i_unit) {
            const a_baseIdx = i_unit * a_rows;
            let a_found = 0;
            for (let k = 0; k < a_rows; ++k) {
                const a_idx = a_unitSquares[a_baseIdx + k];
                if (p_arr[a_idx] !== 0 || popCount(a_candMask[a_idx]) !== 2) continue;
                a_nakedSquares[a_found] = a_idx;
                a_nakedMasks[a_found] = a_candMask[a_idx];
                ++a_found;
            }
            for (let a = 0; a < a_found; ++a)
                for (let b = a + 1; b < a_found; ++b) {
                    if (a_nakedMasks[a] !== a_nakedMasks[b]) continue;
                    const a_lockMask = a_nakedMasks[a];
                    for (let k = 0; k < a_rows; ++k) {
                        const a_idx = a_unitSquares[a_baseIdx + k];
                        if (p_arr[a_idx] !== 0 || a_idx === a_nakedSquares[a] || a_idx === a_nakedSquares[b]) continue;
                        const a_newMask = a_candMask[a_idx] & ~a_lockMask;
                        if (a_newMask === a_candMask[a_idx]) continue;
                        if (a_newMask === 0) return false;
                        a_candMask[a_idx] = a_newMask;
                        this.eliminated = true;
                    }
                }
        }
        return true;
    }

    /**
     * Locates the one blank square of a unit that can still take the value of p_valueBit.
     * Only called after the unit scan in fillConstrained proved exactly one such square exists.
     * @param p_arr The grid being filled.
     * @param p_unitOf Square→unit lookup of the unit's type: rowOf, colOf or segOf.
     * @param p_unit Index of the unit within its type.
     * @param p_valueBit Bit of the hidden single's value.
     * @returns Index of the found square.
     */
    private search_HiddenSingle(p_arr: Int32Array, p_unitOf: Int32Array, p_unit: number, p_valueBit: number): number {
        for (let i = 0; i < this.squares; ++i)
            if (p_arr[i] === 0 && p_unitOf[i] === p_unit && (this.candMask[i] & p_valueBit) !== 0) return i;
        throw new Error("hidden single not found, logic error");
    }

    /**
     * Binary branch of fillConstrained: places the value of p_valueBit in each of its two possible
     * squares of a unit in turn and recurses — every completion must use one of them.
     * In Uniqueness mode the square matching solution is tried last, preserving the steer-away order.
     * @param p_arr The grid being filled.
     * @param p_mode Candidate order per square, passed through to the recursion.
     * @param p_unitOf Square→unit lookup of the unit's type: rowOf, colOf or segOf.
     * @param p_unit Index of the unit within its type.
     * @param p_valueBit Bit of the value with exactly two possible squares in the unit.
     * @returns True when the grid was completed; see fillConstrained for the budget caveat.
     */
    private fillValuePair(
        p_arr: Int32Array,
        p_mode: FillMode,
        p_unitOf: Int32Array,
        p_unit: number,
        p_valueBit: number,
    ): boolean {
        let a_idx1 = -1,
            a_idx2 = -1;
        for (let i = 0; i < this.squares; ++i) {
            if (p_arr[i] !== 0 || p_unitOf[i] !== p_unit || (this.candMask[i] & p_valueBit) === 0) continue;
            if (a_idx1 === -1) a_idx1 = i;
            else {
                a_idx2 = i;
                break;
            }
        }
        if (a_idx2 === -1) throw new Error("value pair not found, logic error");
        // the bit's index is the value: p_valueBit = 1 << value
        const a_input = 31 - Math.clz32(p_valueBit);
        if (p_mode === FillMode.Uniqueness && this.solution[a_idx1] === a_input) [a_idx1, a_idx2] = [a_idx2, a_idx1];
        for (let a_idx = a_idx1, i = 0; i < 2; ++i, a_idx = a_idx2) {
            const a_row = this.rowOf[a_idx],
                a_col = this.colOf[a_idx],
                a_seg = this.segOf[a_idx];
            p_arr[a_idx] = a_input;
            this.rowMask[a_row] |= p_valueBit;
            this.colMask[a_col] |= p_valueBit;
            this.segMask[a_seg] |= p_valueBit;
            if (this.fillConstrained(p_arr, p_mode)) return true;
            this.rowMask[a_row] &= ~p_valueBit;
            this.colMask[a_col] &= ~p_valueBit;
            this.segMask[a_seg] &= ~p_valueBit;
            p_arr[a_idx] = 0;
        }
        return false;
    }

    /**
     * Syncs the masks to p_arr via loadMasks, then runs fillConstrained over the whole grid.
     * @param p_arr The grid to fill, solution or altSolution.
     * @param p_mode Candidate order per square.
     * @param p_nodeBudget Search nodes the fill may spend; exhaustive when omitted. An exhausted fill
     * returns true but leaves p_arr partially filled — only safe on scratch grids (see uniqueWithout).
     * @returns True when the grid was completed (or the budget ran out); a failed fill leaves p_arr unchanged.
     */
    private fillRemaining(p_arr: Int32Array, p_mode: FillMode, p_nodeBudget = intMax): boolean {
        this.fillNodesLeft = p_nodeBudget;
        this.loadMasks(p_arr);
        return this.fillConstrained(p_arr, p_mode);
    }

    /**
     * Generates a complete random solution grid: seeds the diagonal segments,
     * then backtrack-fills the rest in randomised order.
     * @throws {Error} The grid could not be completed. Impossible for an empty grid,
     * so this signals a bug in the fill logic itself.
     */
    fillAll(p_random: Random): void {
        if (this.rank >= 3) this.set_DiagonalSegments(this.solution, p_random);
        initRandom(p_random, this.randomRows, this.rows, true);
        this.fillRemaining(this.solution, FillMode.RandomRow);
        if (count(this.solution, 0) > 0) throw new Error("cannot create, logic error");
    }

    /**
     * Completes solution from the already-validated puzzle inputs by deterministic backtracking.
     * @returns False when the puzzle has no solution, e.g. inputs that are conflict-free but still unsatisfiable.
     */
    fillRest(): boolean {
        this.fillRemaining(this.solution, FillMode.NoInput);
        return count(this.solution, 0) === 0;
    }

    //#endregion

    //#region Solve

    /**
     * True when every non-blank square of p_arr is within 1..rows and conflict-free.
     * Repurposes the unit masks as scratch; every fill resyncs them anyway (see fillRemaining).
     */
    valid(p_arr: Int32Array): boolean {
        this.rowMask.fill(0);
        this.colMask.fill(0);
        this.segMask.fill(0);
        for (let i = 0; i < p_arr.length; ++i) {
            if (p_arr[i] === 0) continue;
            if (p_arr[i] < 0 || p_arr[i] > this.rows) return false;
            const a_valueBit = 1 << p_arr[i],
                a_row = this.rowOf[i],
                a_col = this.colOf[i],
                a_seg = this.segOf[i];
            if (((this.rowMask[a_row] | this.colMask[a_col] | this.segMask[a_seg]) & a_valueBit) !== 0) return false;
            this.rowMask[a_row] |= a_valueBit;
            this.colMask[a_col] |= a_valueBit;
            this.segMask[a_seg] |= a_valueBit;
        }
        return true;
    }

    /**
     * True when solution is the only completion of puzzle: the Uniqueness fill steers away from the known solution,
     * so ending up identical proves uniqueness.
     */
    unique(): boolean {
        this.altSolution.set(this.puzzle);
        this.fillRemaining(this.altSolution, FillMode.Uniqueness);
        for (let i = 0; i < this.squares; ++i) if (this.altSolution[i] !== this.solution[i]) return false;
        return true;
    }

    //#endregion
}
