# Phone Cleaner backend: health + AI suggest endpoint tests
import os
import pytest
import requests
from pathlib import Path

def _base():
    url = os.environ.get("EXPO_PUBLIC_BACKEND_URL")
    if not url:
        for line in Path("/app/mobile/.env").read_text().splitlines():
            if line.startswith("EXPO_PUBLIC_BACKEND_URL="):
                url = line.split("=", 1)[1].strip()
    return url.rstrip("/")

BASE_URL = _base()
MB = 1024 * 1024

FILES = [
    {"id": "a1", "name": "IMG_1.jpg", "size": int(4.2 * MB), "kind": "photo", "age_days": 410, "dup_group": "g1", "is_keeper": True},
    {"id": "a2", "name": "IMG_1(1).jpg", "size": int(4.2 * MB), "kind": "photo", "age_days": 300, "dup_group": "g1", "is_keeper": False},
    {"id": "a3", "name": "WhatsApp Image.jpg", "size": int(4.2 * MB), "kind": "photo", "age_days": 290, "dup_group": "g1", "is_keeper": False},
    {"id": "v1", "name": "VID_2023.mp4", "size": 1240 * MB, "kind": "video", "age_days": 640},
    {"id": "m1", "name": "Movie_backup.mkv", "size": 2150 * MB, "kind": "file", "age_days": 800},
    {"id": "apk", "name": "app-release-v2.apk", "size": 152 * MB, "kind": "file", "age_days": 365},
    {"id": "s1", "name": "Screenshot_2024.png", "size": int(1.1 * MB), "kind": "photo", "age_days": 620},
    {"id": "w1", "name": "WhatsApp Video.mp4", "size": 86 * MB, "kind": "video", "age_days": 220, "dup_group": "g2", "is_keeper": True},
    {"id": "w2", "name": "WhatsApp Video(1).mp4", "size": 86 * MB, "kind": "video", "age_days": 210, "dup_group": "g2", "is_keeper": False},
]


@pytest.fixture(scope="module")
def suggest_result():
    r = requests.post(f"{BASE_URL}/api/ai/suggest", json={"files": FILES, "free_bytes": 9 * 1024 * MB, "total_bytes": 128 * 1024 * MB}, timeout=120)
    return r


class TestHealth:
    def test_root(self):
        r = requests.get(f"{BASE_URL}/api/", timeout=15)
        assert r.status_code == 200
        assert r.json()["message"] == "Phone Cleaner API"


class TestAiSuggest:
    def test_empty_files_400(self):
        r = requests.post(f"{BASE_URL}/api/ai/suggest", json={"files": []}, timeout=30)
        assert r.status_code == 400
        assert "No files" in r.json()["detail"]

    def test_invalid_payload_422(self):
        r = requests.post(f"{BASE_URL}/api/ai/suggest", json={"files": [{"id": "x"}]}, timeout=30)
        assert r.status_code == 422

    def test_status_200(self, suggest_result):
        assert suggest_result.status_code == 200, suggest_result.text

    def test_structure(self, suggest_result):
        d = suggest_result.json()
        assert isinstance(d["summary"], str) and d["summary"]
        assert isinstance(d["suggestions"], list) and len(d["suggestions"]) >= 1
        assert d["file_count"] == len(FILES)
        assert isinstance(d["id"], str) and d["id"]
        assert "_id" not in d

    def test_ids_valid_and_no_keepers(self, suggest_result):
        d = suggest_result.json()
        by_id = {f["id"]: f for f in FILES}
        for s in d["suggestions"]:
            assert s["priority"] in ("high", "medium", "low")
            assert s["item_ids"]
            for i in s["item_ids"]:
                assert i in by_id
                assert not by_id[i].get("is_keeper")

    def test_bytes_computed(self, suggest_result):
        d = suggest_result.json()
        by_id = {f["id"]: f for f in FILES}
        for s in d["suggestions"]:
            assert s["bytes"] == sum(by_id[i]["size"] for i in s["item_ids"])
