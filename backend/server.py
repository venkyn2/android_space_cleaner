from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import json
import uuid
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import List, Optional, Annotated, Literal
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone  # noqa: E402

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

app = FastAPI()
api_router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    def to_mongo(self) -> dict:
        doc = self.model_dump(by_alias=True, exclude={"id"})
        return doc

    @classmethod
    def from_mongo(cls, doc: dict):
        return cls.model_validate(doc)


# ---------- Models ----------
class FileMeta(BaseModel):
    id: str
    name: str
    size: int
    kind: str
    age_days: int = 0
    dup_group: Optional[str] = None
    is_keeper: bool = False


class SuggestRequest(BaseModel):
    files: List[FileMeta]
    free_bytes: Optional[int] = None
    total_bytes: Optional[int] = None


class Suggestion(BaseModel):
    title: str
    reason: str
    priority: Literal["high", "medium", "low"] = "medium"
    item_ids: List[str]
    bytes: int = 0


class AiResult(BaseDocument):
    summary: str
    suggestions: List[Suggestion]
    file_count: int
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


SYSTEM_PROMPT = """You are a careful phone storage cleaning assistant.
You receive metadata (no content) of files on a user's Android phone: id, name, size in bytes, kind, age in days,
dup_group (files sharing a dup_group are exact duplicates) and is_keeper (the copy we recommend keeping).
Suggest what the user could delete to free space. Rules:
- Never suggest deleting a file where is_keeper is true.
- Prefer: duplicate extras, old large videos, old screenshots, installers (.apk), downloads, forwarded messenger media, old voice notes.
- Be conservative with personal photos that are not duplicates; mark those low priority.
- Return 2 to 6 suggestions, most impactful first. Only use ids from the input.
Respond with ONLY valid JSON, no markdown, in this shape:
{"summary": "one friendly sentence", "suggestions": [{"title": "short action title", "reason": "one sentence why it is safe", "priority": "high|medium|low", "item_ids": ["id1"]}]}"""


def _extract_json(text: str) -> dict:
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON in AI response")
    return json.loads(text[start:end + 1])


PRIVACY_HTML = """<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Phone Cleaner - Privacy Policy</title>
<style>body{font-family:sans-serif;max-width:720px;margin:40px auto;padding:0 16px;color:#121A14;line-height:1.55}h1{color:#4A7C59}h2{font-size:18px;margin-top:28px}</style></head><body>
<h1>Phone Cleaner - Privacy Policy</h1><p>Last updated October 31, 2026</p>
<h2>Your files stay on your phone</h2><p>Scanning, duplicate checks, large-file detection, previews and deletion all happen on your device. Your photos, videos, music and documents are never uploaded, copied or shared.</p>
<h2>Smart AI helper (optional)</h2><p>Only when you tap "Suggest what to delete", the app sends file details (names, sizes, types and ages) to our server and to our AI provider (Anthropic Claude) to create suggestions. File contents are never sent. The suggestions are kept on our server without any account or device identifier.</p>
<h2>No accounts, ads or tracking</h2><p>Phone Cleaner is free. There are no accounts, no ads, no analytics or tracking tools, and we never sell or share your data.</p>
<h2>Permissions</h2><p>Photos, Videos and Audio access is used only to find duplicate and large files. Folder access applies only to folders you pick yourself. You can revoke access anytime in Android Settings.</p>
<h2>Deleting files</h2><p>Nothing is deleted without your review and confirmation. Deleted files are removed permanently from your phone.</p>
<h2>Contact</h2><p>Questions about privacy? Contact the developer through the Google Play store listing.</p>
</body></html>"""


@api_router.get("/privacy", response_class=HTMLResponse)
async def privacy_policy():
    return PRIVACY_HTML


@api_router.get("/")
async def root():
    return {"message": "Phone Cleaner API"}


@api_router.post("/ai/suggest")
async def ai_suggest(req: SuggestRequest):
    if not req.files:
        raise HTTPException(status_code=400, detail="No files to analyze")
    files = sorted(req.files, key=lambda f: f.size, reverse=True)[:200]
    by_id = {f.id: f for f in files}
    payload = {
        "free_bytes": req.free_bytes,
        "total_bytes": req.total_bytes,
        "files": [f.model_dump(exclude_none=True) for f in files],
    }
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"suggest-{uuid.uuid4()}",
        system_message=SYSTEM_PROMPT,
    ).with_model("anthropic", "claude-sonnet-5-5")

    text = ""
    try:
        async for ev in chat.stream_message(UserMessage(text=json.dumps(payload))):
            if isinstance(ev, TextDelta):
                text += ev.content
            elif isinstance(ev, StreamDone):
                break
        data = _extract_json(text)
    except Exception as e:
        logger.exception("AI suggestion failed")
        raise HTTPException(status_code=502, detail=f"AI helper unavailable: {e}")

    suggestions: List[Suggestion] = []
    for s in data.get("suggestions", []):
        ids = [i for i in s.get("item_ids", []) if i in by_id and not by_id[i].is_keeper]
        ids = list(dict.fromkeys(ids))
        if not ids:
            continue
        pr = s.get("priority", "medium")
        suggestions.append(Suggestion(
            title=str(s.get("title", "Suggestion"))[:120],
            reason=str(s.get("reason", ""))[:400],
            priority=pr if pr in ("high", "medium", "low") else "medium",
            item_ids=ids,
            bytes=sum(by_id[i].size for i in ids),
        ))

    result = AiResult(summary=str(data.get("summary", "")), suggestions=suggestions, file_count=len(files))
    res = await db.ai_suggestions.insert_one(result.to_mongo())
    result.id = str(res.inserted_id)
    return result.model_dump()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
