import os
import tempfile
from pathlib import Path

_db_file = Path(tempfile.gettempdir()) / "linjing-auth-tests.db"
if _db_file.exists():
    _db_file.unlink()
os.environ["DB_PATH"] = str(_db_file)
