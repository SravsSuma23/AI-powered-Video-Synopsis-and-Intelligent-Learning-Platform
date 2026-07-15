from datetime import datetime
from typing import Optional, Literal, List, Dict
from pydantic import BaseModel, Field

class SynopsisGenerateRequest(BaseModel):
    youtubeUrl: str = Field(..., example="https://www.youtube.com/watch?v=8pDquaF545o")
    summaryLength: Optional[str] = Field(default="medium", example="medium")
    includeSentiment: Optional[bool] = Field(default=True, example=True)
    outputFormat: Optional[Literal["pdf", "ppt"]] = Field(default="pdf", example="pdf")

class SynopsisChatRequest(BaseModel):
    message: str = Field(..., example="Explain the main ideas in the video")
    history: List[Dict[str, str]] = Field(default_factory=list, example=[{"role": "user", "content": "hello"}])

class SynopsisChatResponse(BaseModel):
    answer: str
    sources: List[str]
    provider: Optional[str] = None

class ChatMessageSchema(BaseModel):
    role: str
    content: str
    created_at: datetime = Field(alias="createdAt")

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }

class SynopsisChatHistoryResponse(BaseModel):
    messages: List[ChatMessageSchema]


