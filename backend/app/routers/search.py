"""
Search router: autocomplete (Trie-backed) and DSA stats (admin only).
"""

from typing import Optional

from fastapi import APIRouter, Depends

from app.core.security import require_admin
from app.dsa.search_index import search_index

router = APIRouter(tags=["search"])


@router.get("/search/autocomplete")
def autocomplete(q: Optional[str] = None):
    """
    Return up to 8 item names whose words start with the given prefix.
    Powered by the in-memory Trie; O(L + K) where L = prefix length.
    Empty or whitespace q → empty suggestions list.
    """
    if not q or not q.strip():
        return {"suggestions": []}
    suggestions = search_index.trie.autocomplete(q.strip(), 8)
    return {"suggestions": suggestions}


@router.get("/dsa/stats")
def dsa_stats(current_user=Depends(require_admin)):
    """
    Return diagnostic stats for all in-memory DSA structures.
    Admin only.
    """
    return {
        "trie": {
            "nodes": search_index.trie.node_count(),
            "words": search_index.trie.word_count(),
        },
        "items_table": search_index.items_table.stats(),
        "users_table": search_index.users_table.stats(),
    }
