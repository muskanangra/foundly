"""
Merge sort for sorting search results.

merge_sort is a stable, in-place-on-output sort using the standard
divide-and-conquer algorithm.  Used to order search results by found_at.

Time  complexity: O(n log n) — always (no best-case shortcut)
Space complexity: O(n)       — O(log n) call stack + O(n) for the merge buffer
"""

from typing import Callable, TypeVar

T = TypeVar("T")


def merge_sort(items: list[T], key: Callable[[T], any], reverse: bool = False) -> list[T]:
    """
    Return a new sorted list of items.

    Parameters
    ----------
    items   : list to sort (not mutated)
    key     : function that extracts the comparison value from each element
    reverse : if True, sort descending (largest key first)

    Returns a NEW list — the original is never modified.
    O(n log n) time, O(n) extra space.
    """
    if len(items) <= 1:
        return list(items)
    mid = len(items) // 2
    left = merge_sort(items[:mid], key, reverse)
    right = merge_sort(items[mid:], key, reverse)
    return _merge(left, right, key, reverse)


def _merge(left: list[T], right: list[T], key: Callable, reverse: bool) -> list[T]:
    """
    Merge two sorted sub-lists into one sorted list.
    Stable: equal elements from left appear before those from right.
    O(len(left) + len(right)).
    """
    result: list[T] = []
    i = j = 0
    while i < len(left) and j < len(right):
        lk = key(left[i])
        rk = key(right[j])
        if reverse:
            take_left = lk >= rk
        else:
            take_left = lk <= rk
        if take_left:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result
