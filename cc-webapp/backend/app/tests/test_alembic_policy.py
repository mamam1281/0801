import os
from alembic.config import Config
from alembic.script import ScriptDirectory


def _get_script_dir():
    # pytest 실행 경로가 /app 기준일 때, 이 파일은 /app/app/tests/ 아래에 존재
    # ../../alembic -> /app/alembic
    here = os.path.dirname(__file__)
    script_location = os.path.abspath(os.path.join(here, "../../alembic"))
    cfg = Config()
    cfg.set_main_option("script_location", script_location)
    return ScriptDirectory.from_config(cfg)


def test_alembic_has_single_head():
    script = _get_script_dir()
    heads = script.get_heads()
    assert len(heads) == 1, f"Alembic heads must be single. Found: {heads}"
