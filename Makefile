GBRAIN_REPO ?= https://github.com/garrytan/gbrain.git
GBRAIN_REF  ?= e78f1c3
GBRAIN_DIR  ?= vendor/gbrain
PY          := .venv/bin/python

.PHONY: setup data test routing train bench night app

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

routing: data
	$(PY) data/routing_pairs.py

train:
	$(PY) train/river_sft.py

bench:
	$(PY) bench/run_bench.py

night:
	$(PY) night/night.py

app:
	cd arena && npm install && npm start
