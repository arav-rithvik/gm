# GM

**"GBrain gets better the more it's used. Every correction your team makes becomes training data, and GM improves overnight."**

GM is an open-weight model compiled from [GBrain](https://github.com/garrytan/gbrain)'s skills, named for the brain it was compiled from.

Work in progress. See [CONTRACT.md](CONTRACT.md) for how the parts connect.

## How to run

Needs Python 3.11+, [uv](https://docs.astral.sh/uv/) and git. Copy `.env.example` to `.env` and fill in the keys.

```sh
make setup   # clone GBrain at a pinned commit, install Python deps
make data    # build data/skills.json from GBrain's skills and rule files
make pairs   # write routing + behavior training pairs (needs the teacher keys in .env)
make test    # run the unit tests
```
