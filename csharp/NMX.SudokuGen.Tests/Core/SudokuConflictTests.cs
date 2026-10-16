// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

namespace NMX.SudokuGen.Tests.Core;
using NMX.SudokuGen.Library.Core;

public sealed class SudokuConflictTests
{
    private static readonly Sudoku sudoku = Sudoku.Create(3, 40, 12345);

    [Fact]
    public void FindConflicts_BlankSquare_ReturnsNone()
        => Assert.Equal(Sudoku.Conflict.None, sudoku.FindConflicts(new int[81], 0, 0, true));

    [Fact]
    public void FindConflicts_LoneValue_ReturnsNone()
    {
        const int a_len = 81, a_idx = 0, a_val = 5;
        int[] a_board = new int[a_len];
        a_board[a_idx] = a_val;
        Assert.Equal(Sudoku.Conflict.None, sudoku.FindConflicts(a_board, a_val, a_idx, true));
    }

    [Fact]
    public void FindConflicts_SameRowOtherSegment_ReturnsRow()
    {
        const int a_len = 81, a_idx1 = 0, a_idx2 = 8, a_val1 = 5, a_val2 = 5;
        int[] a_board = new int[a_len];
        a_board[a_idx1] = a_val1; a_board[a_idx2] = a_val2;
        Assert.Equal(Sudoku.Conflict.Row, sudoku.FindConflicts(a_board, a_val1, a_idx1, true));
    }

    [Fact]
    public void FindConflicts_SameColumnOtherSegment_ReturnsColumn()
    {
        const int a_len = 81, a_idx1 = 0, a_idx2 = 72, a_val1 = 5, a_val2 = 5;
        int[] a_board = new int[a_len];
        a_board[a_idx1] = a_val1; a_board[a_idx2] = a_val2;
        Assert.Equal(Sudoku.Conflict.Column, sudoku.FindConflicts(a_board, a_val1, a_idx1, true));
    }

    [Fact]
    public void FindConflicts_SameSegmentOtherRowCol_ReturnsSegment()
    {
        const int a_len = 81, a_idx1 = 0, a_idx2 = 10, a_val1 = 5, a_val2 = 5;
        int[] a_board = new int[a_len];
        a_board[a_idx1] = a_val1; a_board[a_idx2] = a_val2;
        Assert.Equal(Sudoku.Conflict.Segment, sudoku.FindConflicts(a_board, a_val1, a_idx1, true));
    }

    [Fact]
    public void FindConflicts_NeighbourInRowAndSegment_ReturnsBoth()
    {
        const int a_len = 81, a_idx1 = 0, a_idx2 = 1, a_val1 = 5, a_val2 = 5;
        int[] a_board = new int[a_len];
        a_board[a_idx1] = a_val1; a_board[a_idx2] = a_val2;
        Assert.Equal(Sudoku.Conflict.Row | Sudoku.Conflict.Segment, sudoku.FindConflicts(a_board, a_val1, a_idx1, true));
    }

    [Fact]
    public void FindConflicts_AllThreeUnits_ReturnsAll()
    {
        const int a_len = 81, a_idx1 = 0, a_idx2 = 8, a_idx3 = 72, a_idx4 = 10, a_val1 = 5, a_val2 = 5, a_val3 = 5, a_val4 = 5;
        int[] a_board = new int[a_len];
        a_board[a_idx1] = a_val1; a_board[a_idx2] = a_val2; a_board[a_idx3] = a_val3; a_board[a_idx4] = a_val4;
        Assert.Equal(Sudoku.Conflict.Row | Sudoku.Conflict.Column | Sudoku.Conflict.Segment,
            sudoku.FindConflicts(a_board, a_val1, a_idx1, true));
    }

    [Fact]
    public void FindConflicts_CandidateOnBlankSquare_ReportsUnits()
    {
        const int a_len = 81, a_idx1 = 0, a_idx2 = 8, a_val = 5;
        int[] a_board = new int[a_len];
        a_board[a_idx2] = a_val;
        Assert.Equal(Sudoku.Conflict.Row, sudoku.FindConflicts(a_board, a_val, a_idx1, true));
    }

    [Fact]
    public void FindConflicts_CandidateIgnoresCurrentValue()
    {
        const int a_len = 81, a_idx = 0, a_val1 = 5, a_val2 = 7;
        int[] a_board = new int[a_len];
        a_board[a_idx] = a_val2;
        Assert.Equal(Sudoku.Conflict.None, sudoku.FindConflicts(a_board, a_val1, a_idx, true));
    }

    [Fact]
    public void FindConflicts_IncludeIdx_SelfReportsAll()
    {
        const int a_len = 81, a_idx = 0, a_val = 5;
        int[] a_board = new int[a_len];
        a_board[a_idx] = a_val;
        Assert.Equal(Sudoku.Conflict.Row | Sudoku.Conflict.Column | Sudoku.Conflict.Segment,
            sudoku.FindConflicts(a_board, a_val, a_idx, false));
    }

    [Fact]
    public void FindConflicts_WrongBoardLength_Throws()
        => Assert.Throws<ArgumentException>(() => sudoku.FindConflicts(new int[16], 0, 0, true));

    [Theory]
    [InlineData(-1)]
    [InlineData(81)]
    public void FindConflicts_IndexOutOfBoard_Throws(int p_idx)
        => Assert.Throws<ArgumentException>(() => sudoku.FindConflicts(new int[81], 1, p_idx, true));

    [Theory]
    [InlineData(-1)]
    [InlineData(10)]
    public void FindConflicts_InputOutOfRange_Throws(int p_val)
        => Assert.Throws<ArgumentException>(() => sudoku.FindConflicts(new int[81], p_val, 0, true));

    [Fact]
    public void FindConflicts_PlacedBlank_ReturnsNone()
        => Assert.Equal(Sudoku.Conflict.None, sudoku.FindConflicts(new int[81], 0));

    [Fact]
    public void FindConflicts_PlacedValue_ReturnsRowAndColumn()
    {
        const int a_len = 81, a_idx1 = 0, a_idx2 = 8, a_idx3 = 72, a_val = 5;
        int[] a_board = new int[a_len];
        a_board[a_idx1] = a_val; a_board[a_idx2] = a_val; a_board[a_idx3] = a_val;
        Assert.Equal(Sudoku.Conflict.Row | Sudoku.Conflict.Column, sudoku.FindConflicts(a_board, a_idx1));
    }

    [Fact]
    public void FindConflicts_PlacedWrongBoardLength_Throws()
        => Assert.Throws<ArgumentException>(() => sudoku.FindConflicts(new int[16], 0));

    [Theory]
    [InlineData(-1)]
    [InlineData(81)]
    public void FindConflicts_PlacedIndexOutOfBoard_Throws(int p_idx)
        => Assert.Throws<ArgumentException>(() => sudoku.FindConflicts(new int[81], p_idx));

    [Fact]
    public void FindConflicts_PlacedValueOutOfRange_Throws()
    {
        const int a_len = 81, a_idx = 0, a_val = 10;
        int[] a_board = new int[a_len];
        a_board[a_idx] = a_val;
        Assert.Throws<ArgumentException>(() => sudoku.FindConflicts(a_board, a_idx));
    }
}
