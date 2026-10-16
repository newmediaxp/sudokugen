// Copyright (c) 2024-2026 New Media XP. Licensed under the MIT License.

namespace System.Runtime.CompilerServices;

/// <summary>
/// Built into .NET 9+ but missing from netstandard2.1. C# 13+ compilers match it by name,
/// so this internal copy works: among applicable overloads, the higher priority wins.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Constructor | AttributeTargets.Property, AllowMultiple = false, Inherited = false)]
internal sealed class OverloadResolutionPriorityAttribute : Attribute
{
    public OverloadResolutionPriorityAttribute(int p_priority) => Priority = p_priority;

    public int Priority { get; }
}
