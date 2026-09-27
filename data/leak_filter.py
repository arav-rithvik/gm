"""Keep eval cases out of training data.

A training example is a leak if its text matches any eval intent exactly
(after normalizing) or shares most of its words with one.
"""
import re

THRESHOLD = 0.8


def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9 ]+", " ", text.lower()).split().__str__()


def words(text: str) -> set[str]:
    return set(re.sub(r"[^a-z0-9 ]+", " ", text.lower()).split())


def similarity(a: str, b: str) -> float:
    wa, wb = words(a), words(b)
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / len(wa | wb)


def is_leak(text: str, eval_intents: list[str], threshold: float = THRESHOLD) -> bool:
    return any(normalize(text) == normalize(e) or similarity(text, e) >= threshold for e in eval_intents)


def filter_leaks(examples: list[dict], eval_intents: list[str]) -> tuple[list[dict], int]:
    kept = [ex for ex in examples if not is_leak(ex["prompt"], eval_intents)]
    return kept, len(examples) - len(kept)
