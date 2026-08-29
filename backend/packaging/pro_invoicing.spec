# PyInstaller spec for the admin-PC backend service.
#
# Build (from backend/):
#   ..\.venv\Scripts\pyinstaller.exe packaging\pro_invoicing.spec --distpath dist --workpath build
#
# NOTE (untested in this sandbox — see PROGRESS.md / QUESTIONS.md): WeasyPrint
# bundles native GTK/Pango DLLs dynamically at import time, which is a known
# hard case for PyInstaller. If the packaged .exe's PDF endpoint fails where
# the unpackaged dev server's didn't, the GTK3 DLLs likely need to be added
# to `binaries=` below explicitly (find them under the GTK3 runtime install
# path, typically the same one from QUESTIONS.md #4).

import sys
from pathlib import Path

block_cipher = None
backend_dir = Path(SPECPATH)  # noqa: F821  (PyInstaller injects SPECPATH)

a = Analysis(
    [str(backend_dir / "run_server.py")],
    pathex=[str(backend_dir.parent)],
    binaries=[],
    datas=[
        (str(backend_dir.parent / "app" / "templates"), "app/templates"),
        (str(backend_dir.parent / "alembic"), "alembic"),
        (str(backend_dir.parent / "alembic.ini"), "."),
    ],
    hiddenimports=[
        "uvicorn.logging",
        "uvicorn.loops",
        "uvicorn.loops.auto",
        "uvicorn.protocols",
        "uvicorn.protocols.http",
        "uvicorn.protocols.http.auto",
        "uvicorn.protocols.websockets",
        "uvicorn.protocols.websockets.auto",
        "uvicorn.lifespan",
        "uvicorn.lifespan.on",
        "passlib.handlers.bcrypt",
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    cipher=block_cipher,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="ProInvoicingServer",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,  # keep a console window so the admin can see startup errors
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
