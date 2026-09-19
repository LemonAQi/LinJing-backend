"""Start the LinJing API from the repo root.

Windows:
    py start.py
    .\\.venv\\Scripts\\python.exe start.py

This avoids the Microsoft Store `python` alias that can exit with no output.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REQUIRED_BRANCH = "cursor/uni-login-users-d4b8"


def fail(message: str, code: int = 1) -> None:
    print(f"[LinJing] FAILED: {message}", flush=True)
    sys.exit(code)


def main() -> None:
    print(f"[LinJing] working directory: {ROOT}", flush=True)
    if not (ROOT / "app" / "main.py").exists():
        fail(
            "app\\main.py is missing. This folder is not the login API checkout. "
            f"Run: git checkout {REQUIRED_BRANCH} && git pull"
        )

    sys.path.insert(0, str(ROOT))
    try:
        import uvicorn
    except ImportError:
        fail("uvicorn is not installed in this Python. Run .\\setup.ps1 first.")

    print(f"[LinJing] python  {sys.executable}", flush=True)
    print(f"[LinJing] uvicorn {uvicorn.__version__}", flush=True)
    print("[LinJing] starting http://127.0.0.1:8000 ...", flush=True)
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        app_dir=str(ROOT),
    )
    print("[LinJing] server process ended", flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001 — always show a reason on Windows
        fail(str(exc))
