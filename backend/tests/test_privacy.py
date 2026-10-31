# Privacy policy hosted page (Google Play URL) + root health
import os
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL").rstrip("/")


def test_root():
    r = requests.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    assert r.json()["message"] == "Phone Cleaner API"


def test_privacy_html():
    r = requests.get(f"{BASE_URL}/api/privacy")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/html")
    body = r.text
    assert "<h1>Phone Cleaner - Privacy Policy</h1>" in body
    for h in ["Your files stay on your phone", "Smart AI helper (optional)", "No accounts, ads or tracking",
              "Permissions", "Deleting files", "Contact"]:
        assert h in body
    assert "never uploaded" in body


def test_privacy_head_or_unknown_404():
    r = requests.get(f"{BASE_URL}/api/privacy-nope")
    assert r.status_code == 404
