import pytest
from fastapi.testclient import TestClient

try:
	from app.main import app
except Exception as e:
	# Fallback: try alternate import paths if needed
	raise


@pytest.fixture(scope="session")
def client():
	with TestClient(app) as c:
		yield c

