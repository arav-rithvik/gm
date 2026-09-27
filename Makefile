GBRAIN_REPO ?= https://github.com/garrytan/gbrain.git
GBRAIN_REF  ?= e78f1c3
GBRAIN_DIR  ?= vendor/gbrain
PY          := .venv/bin/python
ENV         := set -a; [ -f .env ] && . ./.env; set +a;

.PHONY: setup data routing behavior pairs test

setup: $(GBRAIN_DIR)
	uv venv -q
	uv pip install -q -r requirements.txt

$(GBRAIN_DIR):
	git clone -q --filter=blob:none $(GBRAIN_REPO) $(GBRAIN_DIR)
	git -C $(GBRAIN_DIR) checkout -q $(GBRAIN_REF)

data: $(GBRAIN_DIR)
	GBRAIN_DIR=$(GBRAIN_DIR) $(PY) data/parse_skills.py

routing: data
	$(ENV) GBRAIN_DIR=$(GBRAIN_DIR) $(PY) data/make_routing.py

behavior: data
	$(ENV) GBRAIN_DIR=$(GBRAIN_DIR) $(PY) data/make_behavior.py

pairs: routing behavior

test:
	$(PY) -m pytest -q tests
