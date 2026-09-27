import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "data"))
from page_checker import check_page  # noqa: E402

GOOD_PAGE = """File: people/sarah-chen.md
---
type: person
title: Sarah Chen
---

## State
VP Engineering at [Acme Corp](companies/acme-corp.md). [Source: User, meeting notes, 2026-04-07]

- Leads the GraphQL migration, target Q3. [Source: User, meeting notes, 2026-04-07]

<!-- timeline -->

## Timeline

- **2026-04-07** | Met at team sync. Discussed the API migration.
  [Source: Meeting notes, 2026-04-07]
"""


def test_good_page_passes():
    assert check_page(GOOD_PAGE) == []


@pytest.mark.parametrize("change, problem", [
    (lambda p: p.replace("File: people/sarah-chen.md\n", ""), "first line must be"),
    (lambda p: p.replace("File: people/", "File: sources/"), "sources/"),
    (lambda p: p.replace("type: person\n", "type: [person\n"), "not valid YAML"),
    (lambda p: p.replace("title: Sarah Chen\n", ""), "type and title"),
    (lambda p: p.replace("<!-- timeline -->", ""), "no split"),
    (lambda p: p.replace("target Q3. [Source: User, meeting notes, 2026-04-07]", "target Q3."),
     "without [Source"),
    (lambda p: p.replace("[Acme Corp](companies/acme-corp.md)", "Acme Corp"), "no link"),
    (lambda p: p.replace("**2026-04-07** |", "**YYYY-MM-DD** |"), "timeline has no"),
])
def test_bad_pages_fail(change, problem):
    problems = check_page(change(GOOD_PAGE))
    assert any(problem in p for p in problems), problems
