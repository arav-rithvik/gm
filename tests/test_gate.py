import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "night"))
from gate import passes  # noqa: E402


def test_no_regressions_passes():
    ok, _ = passes({"a": True, "b": False}, {"a": True, "b": True})
    assert ok


def test_a_regression_rolls_back():
    ok, why = passes({"a": True, "b": True}, {"a": False, "b": True})
    assert not ok and "a" in why


def test_first_night_passes():
    ok, _ = passes({}, {"a": True})
    assert ok
