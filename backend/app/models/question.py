from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class SubjectType(str, Enum):
    MATH = "數學"
    PHYSICS = "物理"
    CHEMISTRY = "化學"
    BIOLOGY = "生物"

class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "選擇題"
    FILL_IN = "填充題"
    CALCULATION = "計算題"

class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class Question(BaseModel):
    id: Optional[str] = None
    subject: SubjectType
    grade: str
    question_type: QuestionType
    content: str
    options: Optional[List[str]] = None
    images: Optional[List[str]] = None
    answer: str
    knowledge_points: List[str]
    difficulty: DifficultyLevel

class ReviewResult(BaseModel):
    question_id: str
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    suggestions: List[str]

class LogicCheckRequest(BaseModel):
    question: Question

class LogicCheckResponse(BaseModel):
    result: ReviewResult
    explanation: Optional[str] = None
