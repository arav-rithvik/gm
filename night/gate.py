"""The regression gate: a new GM goes live only if it is no worse.

`old` and `new` map each held-out case ID to True (passed) or False.
"""


def passes(old: dict[str, bool], new: dict[str, bool]) -> tuple[bool, str]:
    regressions = [k for k, ok in old.items() if ok and not new.get(k, False)]
    if regressions:
        return False, f"{len(regressions)} case(s) that passed yesterday now fail: {', '.join(regressions[:3])}"
    if sum(new.values()) < sum(old.values()):
        return False, "fewer cases pass than yesterday"
    return True, f"{sum(new.values())}/{len(new)} pass, no regressions"
