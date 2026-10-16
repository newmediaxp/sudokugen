// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

import { Random, randomSeed } from "./random.ts";
import { Solver } from "./solver.ts";
import { count, initRandom } from "./utility.ts";

const minRank = 2,
    maxRank = 5,
    maxBlanks = -1;

/** Lets only Sudoku's own factories through its constructor. */
const constructToken = Symbol("Sudoku");

/**
 * The units {@link Sudoku.findConflicts} reports, as bit flags: test them with `&`.
 */
export const Conflict = Object.freeze({
    None: 0,
    Row: 1,
    Column: 2,
    Segment: 4,
} as const);
/** A combination of {@link Conflict} flags. */
export type Conflict = number;

/**
 * Options of {@link Sudoku.create}.
 */
export interface CreateOptions {
    /**
     * Seed for the random generator, any 32-bit integer. Determines the resulting sudoku together with
     * `exhaustive`, and gives the same sudoku as the C# library does for the same seed.
     */
    seed?: number | undefined;
    /**
     * Skips the internal search budget, making the achieved blank count exact instead of near-maximal.
     * Can run extremely long at high ranks with extreme blank counts
     * (rank 5 max-blanks: upwards of half an hour where the budgeted run takes a minute).
     * The same seed can produce different puzzles budgeted vs exhaustive.
     */
    exhaustive?: boolean | undefined;
}

/**
 * An immutable sudoku puzzle/solution pair, obtained via {@link Sudoku.create} (new random puzzle),
 * {@link Sudoku.solve} (from existing inputs) or {@link Sudoku.shuffle} (equivalent variant).
 * Grids are flat row-by-row arrays of {@link Sudoku.squares} values, 0 = blank.
 * Instances share no state, and every call runs synchronously; move long creates to a Web Worker
 * (or a worker thread) to keep a UI responsive.
 */
export class Sudoku {
    /** The smallest rank, 2 (4x4). */
    static readonly minRank = minRank;
    /** The largest rank, 5 (25x25). */
    static readonly maxRank = maxRank;
    /** Pass as `create`'s blanks to request as many blanks as possible. */
    static readonly maxBlanks = maxBlanks;

    /** Segment size of the sudoku: 2 = 4x4 up to 5 = 25x25. */
    readonly rank: number;
    /** Squares per row, column and segment. {@link Sudoku.rank} squared. */
    readonly rows: number;
    /** Total squares in the grid. {@link Sudoku.rows} squared. */
    readonly squares: number;
    /** Requested number of blank squares; {@link Sudoku.removed} holds the achieved count. */
    readonly remove: number;
    /**
     * Actual number of blanks in the puzzle. Can be lower than {@link Sudoku.remove} when further removal
     * would break uniqueness (or exceed the internal search budget at extreme blank counts).
     */
    readonly removed: number;
    /** The puzzle grid, 0 = blank. */
    readonly puzzle: readonly number[];
    /** The unique completed solution of {@link Sudoku.puzzle}. */
    readonly solution: readonly number[];

    private constructor(
        p_token: symbol,
        p_rank: number,
        p_remove: number,
        p_removed: number,
        p_puzzle: ArrayLike<number>,
        p_solution: ArrayLike<number>,
    ) {
        if (p_token !== constructToken) throw new TypeError("use Sudoku.create or Sudoku.solve to get a Sudoku");
        this.rank = p_rank;
        this.rows = p_rank * p_rank;
        this.squares = this.rows * this.rows;
        this.remove = p_remove;
        this.removed = p_removed;
        this.puzzle = Object.freeze(Array.from(p_puzzle));
        this.solution = Object.freeze(Array.from(p_solution));
        Object.freeze(this);
    }

    static #of(p_solver: Solver): Sudoku {
        return new Sudoku(
            constructToken,
            p_solver.rank,
            p_solver.remove,
            p_solver.removed,
            p_solver.puzzle,
            p_solver.solution,
        );
    }

    //#region Create

    /**
     * Creates a random sudoku while keeping the solution unique
     * ({@link Sudoku.removed} holds the achieved blank count).
     * @param p_rank Segment size of the sudoku, {@link Sudoku.minRank} to {@link Sudoku.maxRank}.
     * @param p_remove Desired number of blank squares, or {@link Sudoku.maxBlanks} for as many as possible.
     * Fewer are blanked when further removal would break uniqueness.
     * @param p_options `seed` reproduces a sudoku; `exhaustive` makes the blank count exact
     * (see {@link CreateOptions}).
     * @throws {RangeError} The rank is outside minRank..maxRank, the blanks are outside -1..rank^4,
     * or the seed is not a 32-bit integer.
     */
    static create(p_rank: number, p_remove: number, p_options: CreateOptions = {}): Sudoku {
        checkInteger(p_rank, minRank, maxRank, "rank");
        const a_squares = p_rank ** 4;
        checkInteger(p_remove, maxBlanks, a_squares, "blanks");
        const a_random = new Random(seedOrRandom(p_options.seed));
        const a_solver = new Solver(
            p_rank,
            p_remove === maxBlanks ? a_squares : p_remove,
            Boolean(p_options.exhaustive),
        );
        a_solver.fillAll(a_random);
        a_solver.prune(a_random);
        // a final shuffle washes out the positional bias of the backtracking fill
        return Sudoku.#of(a_solver).#shuffle(a_random);
    }

    //#endregion

    //#region Conflict

    /**
     * Checks p_input against the row, column and segment of the square at p_idx and reports every unit where it
     * already appears, so a candidate can be tested before it is written to the board.
     * A blank input (0) never conflicts.
     * @param p_board The board being played, row by row, 0 = blank; must have exactly {@link Sudoku.squares} squares.
     * @param p_idx Index of the square whose units are searched.
     * @param p_input The value to check; defaults to the value at p_idx, which checks the board as played.
     * @param p_excludeIdx When true (the default) the square at p_idx is skipped, so its current value is ignored;
     * when false it is searched too, so a square already holding p_input reports all three units.
     * @returns Flags for each conflicting unit (row, column, segment), or {@link Conflict.None}.
     * @throws {RangeError} The board is not exactly squares long, the index is outside the board,
     * or the input is outside 0..rows.
     */
    findConflicts(p_board: ArrayLike<number>, p_idx: number, p_input?: number, p_excludeIdx = true): Conflict {
        if (p_board.length !== this.squares) throw new RangeError(`board must have exactly ${this.squares} squares`);
        checkInteger(p_idx, 0, this.squares - 1, "index");
        const a_input = p_input ?? p_board[p_idx];
        checkInteger(a_input, 0, this.rows, "input");
        if (a_input === 0) return Conflict.None;
        let a_conflicts: Conflict = Conflict.None;
        if (this.#search_Row(p_board, a_input, p_idx, p_excludeIdx)) a_conflicts |= Conflict.Row;
        if (this.#search_Column(p_board, a_input, p_idx, p_excludeIdx)) a_conflicts |= Conflict.Column;
        if (this.#search_Segment(p_board, a_input, p_idx, p_excludeIdx)) a_conflicts |= Conflict.Segment;
        return a_conflicts;
    }

    /**
     * Whether p_input also occurs in p_idx's row (p_idx itself excluded if p_excludeIdx is true).
     */
    #search_Row(p_arr: ArrayLike<number>, p_input: number, p_idx: number, p_excludeIdx: boolean): boolean {
        const a_startIdx = Math.trunc(p_idx / this.rows) * this.rows;
        for (let i = a_startIdx, a_limitIdx = a_startIdx + this.rows; i < a_limitIdx; ++i)
            if ((!p_excludeIdx || i !== p_idx) && p_arr[i] === p_input) return true;
        return false;
    }

    /**
     * Whether p_input also occurs in p_idx's column (p_idx itself excluded if p_excludeIdx is true).
     */
    #search_Column(p_arr: ArrayLike<number>, p_input: number, p_idx: number, p_excludeIdx: boolean): boolean {
        for (let i = p_idx % this.rows; i < this.squares; i += this.rows)
            if ((!p_excludeIdx || i !== p_idx) && p_arr[i] === p_input) return true;
        return false;
    }

    /**
     * Whether p_input also occurs in p_idx's segment (p_idx itself excluded if p_excludeIdx is true).
     */
    #search_Segment(p_arr: ArrayLike<number>, p_input: number, p_idx: number, p_excludeIdx: boolean): boolean {
        const a_rank = this.rank,
            a_rows = this.rows,
            a_row = Math.trunc(p_idx / a_rows),
            a_col = p_idx % a_rows;
        const a_startIdx = Math.trunc(a_row / a_rank) * a_rank * a_rows + Math.trunc(a_col / a_rank) * a_rank;
        for (let i_row = 0; i_row < a_rank; ++i_row)
            for (let i_col = 0; i_col < a_rank; ++i_col) {
                const a_idx = a_startIdx + i_row * a_rows + i_col;
                if ((!p_excludeIdx || a_idx !== p_idx) && p_arr[a_idx] === p_input) return true;
            }
        return false;
    }

    //#endregion

    //#region Shuffle

    /**
     * Returns a new equivalent sudoku derived from this one by symmetry transformations:
     * permuted segment rows/columns, permuted rows/columns within segments,
     * relabelled digits and an optional transpose. The result is guaranteed to stay
     * valid and uniquely solvable, with the same rank, difficulty and blank count.
     * @param p_seed Seed for the random generator, any 32-bit integer; the same seed always reproduces the same
     * variant, here and in the C# library. Omit it for a random variant.
     * @throws {RangeError} The seed is not a 32-bit integer.
     */
    shuffle(p_seed?: number): Sudoku {
        return this.#shuffle(new Random(seedOrRandom(p_seed)));
    }

    #shuffle(p_random: Random): Sudoku {
        const a_rows = this.rows;
        const a_rowMap = this.#axisMap(p_random),
            a_colMap = this.#axisMap(p_random);
        const a_digitMap = new Int32Array(a_rows + 1),
            a_digits = new Int32Array(a_rows);
        initRandom(p_random, a_digits, a_rows, true);
        for (let i = 0; i < a_rows; ++i) a_digitMap[i + 1] = a_digits[i];
        const a_transpose = p_random.next(0, 2) === 1;
        const a_puzzle = new Int32Array(this.squares),
            a_solution = new Int32Array(this.squares);
        for (let i_row = 0; i_row < a_rows; ++i_row)
            for (let i_col = 0; i_col < a_rows; ++i_col) {
                const a_from = a_rowMap[i_row] * a_rows + a_colMap[i_col];
                const a_to = a_transpose ? i_col * a_rows + i_row : i_row * a_rows + i_col;
                a_puzzle[a_to] = a_digitMap[this.puzzle[a_from]];
                a_solution[a_to] = a_digitMap[this.solution[a_from]];
            }
        return new Sudoku(constructToken, this.rank, this.remove, this.removed, a_puzzle, a_solution);
    }

    /**
     * Builds an index map for one axis: permutes segments and lines within each segment,
     * so lines never leave their (relocated) segment and validity is preserved.
     */
    #axisMap(p_random: Random): Int32Array {
        const a_rank = this.rank;
        const a_map = new Int32Array(this.rows),
            a_segs = new Int32Array(a_rank),
            a_lines = new Int32Array(a_rank);
        initRandom(p_random, a_segs, a_rank, false);
        for (let i_seg = 0; i_seg < a_rank; ++i_seg) {
            initRandom(p_random, a_lines, a_rank, false);
            for (let i = 0; i < a_rank; ++i) a_map[i_seg * a_rank + i] = a_segs[i_seg] * a_rank + a_lines[i];
        }
        return a_map;
    }

    //#endregion

    //#region Solve

    /**
     * Solves the given puzzle. Rank is inferred from its length.
     * @param p_puzz The puzzle grid, row by row, 0 = blank. Length must be a 4th power (16, 81, ...).
     * @returns A sudoku whose {@link Sudoku.solution} is the unique completion of the input.
     * @throws {Error} The length is not the 4th power of a rank within minRank..maxRank,
     * a value is not an integer within 0..rows, the inputs conflict,
     * or the puzzle does not have exactly one solution.
     */
    static solve(p_puzz: ArrayLike<number>): Sudoku {
        const a_length = p_puzz.length,
            a_rank = Math.trunc(Math.sqrt(Math.sqrt(a_length)));
        if (a_rank ** 4 !== a_length) throw new Error("invalid puzzle length, could not determine rank");
        if (a_rank < minRank || a_rank > maxRank)
            throw new Error(`invalid puzzle length, rank must be within ${minRank}..${maxRank}`);
        const a_rows = a_rank * a_rank;
        for (let i = 0; i < a_length; ++i) {
            const a_value = p_puzz[i];
            if (!Number.isInteger(a_value) || a_value < 0 || a_value > a_rows)
                throw new Error(`invalid puzzle, value ${a_value} at index ${i} is outside 0..${a_rows}`);
        }
        const a_solver = new Solver(a_rank, count(p_puzz, 0), false);
        a_solver.removed = a_solver.remove;
        a_solver.puzzle.set(p_puzz);
        if (!a_solver.valid(a_solver.puzzle)) throw new Error("invalid puzzle, duplicate inputs found");
        a_solver.solution.set(a_solver.puzzle);
        if (!a_solver.fillRest()) throw new Error("invalid puzzle, no solution");
        if (!a_solver.unique()) throw new Error("invalid puzzle, no unique solution");
        return Sudoku.#of(a_solver);
    }

    //#endregion
}

function checkInteger(p_value: number, p_min: number, p_max: number, p_name: string): void {
    if (!Number.isInteger(p_value) || p_value < p_min || p_value > p_max)
        throw new RangeError(`${p_name} must be an integer within ${p_min}..${p_max}`);
}

function seedOrRandom(p_seed: number | undefined): number {
    if (p_seed === undefined) return randomSeed();
    checkInteger(p_seed, -2147483648, 2147483647, "seed");
    return p_seed;
}
