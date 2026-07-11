from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ApiConfig(BaseModel):
    apiKey: str
    baseUrl: str
    model: str

class ExamPaper(BaseModel):
    subject: str
    grade: str
    provider: str
    apiConfig: ApiConfig
    pages: List[dict]

class ReviewResult(BaseModel):
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    suggestions: List[str]
    detailed_analysis: Optional[dict] = None

class ExamReviewResponse(BaseModel):
    result: ReviewResult
