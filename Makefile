GBRAIN_REPO ?= https://github.com/garrytan/gbrain.git
GBRAIN_REF  ?= e78f1c3
GBRAIN_DIR  ?= vendor/gbrain
PY          := .venv/bin/python
PART2_DIR   := night/gm-nightly-loop
PART2_PY    := $(PART2_DIR)/.venv/bin/python
GM_NIGHT_CONFIG ?= $(PART2_DIR)/examples/gm-part2.toml

.PHONY: setup data test quickstart part2-setup part2-demo part2-test night

setup: $(GBRAIN_DIR)
	uv venv -q
	uv pip install -q -r requirements.txt

$(GBRAIN_DIR):
	git clone -q --filter=blob:none $(GBRAIN_REPO) $(GBRAIN_DIR)
	git -C $(GBRAIN_DIR) checkout -q $(GBRAIN_REF)

data: $(GBRAIN_DIR)
	GBRAIN_DIR=$(GBRAIN_DIR) $(PY) data/parse_skills.py

test:
	$(PY) -m pytest -q tests

quickstart:
	$(MAKE) setup
	$(MAKE) data
	$(MAKE) test
	$(MAKE) part2-demo
	$(MAKE) part2-test

part2-setup:
	$(MAKE) -C $(PART2_DIR) setup

part2-demo: part2-setup
	$(MAKE) -C $(PART2_DIR) demo

part2-test: part2-setup
	$(MAKE) -C $(PART2_DIR) test

night: part2-setup
	$(PART2_PY) night/run.py --config $(GM_NIGHT_CONFIG)
