from fastapi import APIRouter
from ..models.exam import ExamPaper, ExamReviewResponse
from ..services.ai_analyzer import analyze_exam_paper

router = APIRouter()

@router.post("/exam", response_model=ExamReviewResponse)
async def review_exam_paper(exam: ExamPaper):
    result = await analyze_exam_paper(exam)
    return ExamReviewResponse(result=result)
