from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.database.models import Answer, Interview, Question, User
from app.schemas.interview import AnalysisResponse

router = APIRouter(tags=["Analysis"])


@router.get("/api/interviews/{interview_id}/analysis", summary="Get all analysis for an interview")
def get_interview_analysis(interview_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    interview = db.scalar(select(Interview).options(selectinload(Interview.questions).selectinload(Question.answer).selectinload(Answer.analysis)).where(Interview.id == interview_id, Interview.user_id == user.id))
    if not interview:
        raise HTTPException(status_code=404, detail="Interview was not found")
    return {
        "overall_score": interview.overall_score,
        "summary": "AI-generated assessments are coaching suggestions based on submitted answer text.",
        "questions": [
            {"question": question.question_text, "answer": question.answer.answer_text, "analysis": AnalysisResponse.model_validate(question.answer.analysis).model_dump()}
            for question in interview.questions if question.answer and question.answer.analysis
        ],
    }


@router.get("/api/answers/{answer_id}/analysis", response_model=AnalysisResponse, summary="Get answer analysis")
def get_answer_analysis(answer_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    answer = db.scalar(select(Answer).options(selectinload(Answer.analysis), selectinload(Answer.question).selectinload(Question.interview)).where(Answer.id == answer_id))
    if not answer or answer.question.interview.user_id != user.id or not answer.analysis:
        raise HTTPException(status_code=404, detail="Answer analysis was not found")
    return AnalysisResponse.model_validate(answer.analysis)
