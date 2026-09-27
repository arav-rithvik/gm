import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "data"))
from leak_filter import filter_leaks, is_leak  # noqa: E402

EVALS = ["Create a person page for John Smith and enrich it from his GitHub"]


def test_exact_match_is_a_leak():
    assert is_leak("create a person page for john smith and enrich it from his github!", EVALS)


def test_near_duplicate_is_a_leak():
    assert is_leak("Create a person page for John Smith and enrich it from GitHub", EVALS)


def test_new_wording_is_kept():
    assert not is_leak("Who is Dana and what does she work on?", EVALS)


def test_filter_counts_removed():
    kept, removed = filter_leaks([{"prompt": EVALS[0]}, {"prompt": "prep me for my 3pm"}], EVALS)
    assert removed == 1 and kept == [{"prompt": "prep me for my 3pm"}]
