"""Packaged entry point — this is what PyInstaller builds into the .exe.

Not used in dev (dev runs `uvicorn app.main:app` directly). This script:
1. Runs Alembic migrations to head (so upgrades to a new version never
   require the admin to do anything manually — CLAUDE.md §4 rule 1).
2. Seeds Main/IIM/admin only if the DB is brand new (seed.py is idempotent
   either way, but this makes the first-run behavior explicit).
3. Starts uvicorn bound to settings.host/settings.port. On an admin install
   set HOST=0.0.0.0 (via a .env next to the exe, or PROINVOICING_HOST env
   var) so employee PCs on the LAN can reach it — see packaging/README.md.
"""

import sys
from pathlib import Path

# When frozen, PyInstaller puts our own package at sys._MEIPASS; make sure
# `app` is importable the same way it is in dev.
if getattr(sys, "frozen", False):
    sys.path.insert(0, str(Path(sys._MEIPASS)))  # type: ignore[attr-defined]

from alembic import command
from alembic.config import Config

from app.core.config import resource_dir, settings


def run_migrations():
    alembic_cfg = Config()
    alembic_cfg.set_main_option("script_location", str(resource_dir() / "alembic"))
    alembic_cfg.set_main_option("sqlalchemy.url", settings.database_url)
    command.upgrade(alembic_cfg, "head")


def maybe_seed():
    from app.seed import seed

    seed()  # idempotent — safe to call on every startup


def main():
    run_migrations()
    maybe_seed()

    import uvicorn

    from app.main import app

    uvicorn.run(app, host=settings.host, port=settings.port, log_level="info")


if __name__ == "__main__":
    main()
