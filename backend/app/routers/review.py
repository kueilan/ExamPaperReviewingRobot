from typing import List
from fastapi import APIRouter
from ..models.question import Question, ReviewResult, LogicCheckRequest, LogicCheckResponse
from ..services.logic_checker import check_question_logic

router = APIRouter()

@router.post("/review", response_model=LogicCheckResponse)
async def review_question(request: LogicCheckRequest):
    result = check_question_logic(request.question)
    return LogicCheckResponse(result=result)

@router.post("/review/batch")
async def review_questions_batch(questions: List[Question]):
    results = []
    for question in questions:
        result = check_question_logic(question)
        results.append(result)
    return {"results": results}
