from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.database.models import Analysis, Answer, Interview, Question, User
from app.schemas.interview import AnswerResponse, AnswerSubmit, InterviewCreate, InterviewResponse
from app.services.ai_service import evaluate_answer, generate_questions

router = APIRouter(prefix="/api/interviews", tags=["Interviews"])


def _owned_interview(db: Session, interview_id: int, user_id: int) -> Interview:
    interview = db.scalar(
        select(Interview).options(selectinload(Interview.questions).selectinload(Question.answer).selectinload(Answer.analysis))
        .where(Interview.id == interview_id, Interview.user_id == user_id)
    )
    if not interview:
        raise HTTPException(status_code=404, detail="Interview was not found")
    return interview


@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED, summary="Create an interview")
async def create_interview(payload: InterviewCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    interview = Interview(user_id=user.id, **payload.model_dump())
    db.add(interview)
    db.flush()
    generated = await generate_questions(payload.job_role, payload.experience_level, payload.interview_type, payload.difficulty, payload.total_questions)
    for index, item in enumerate(generated, start=1):
        db.add(Question(interview_id=interview.id, question_text=item["question"], category=item["category"], difficulty=item["difficulty"], expected_topics=item["expected_topics"], question_order=index))
    db.commit()
    return InterviewResponse.model_validate(_owned_interview(db, interview.id, user.id))


@router.get("", response_model=list[InterviewResponse], summary="List interview history")
def list_interviews(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    interviews = db.scalars(select(Interview).options(selectinload(Interview.questions)).where(Interview.user_id == user.id).order_by(Interview.created_at.desc())).all()
    return [InterviewResponse.model_validate(item) for item in interviews]


@router.get("/{interview_id}", response_model=InterviewResponse, summary="Get interview details")
def get_interview(interview_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return InterviewResponse.model_validate(_owned_interview(db, interview_id, user.id))


@router.post("/{interview_id}/start", response_model=InterviewResponse, summary="Start an interview")
def start_interview(interview_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    interview = _owned_interview(db, interview_id, user.id)
    if interview.status == "completed":
        raise HTTPException(status_code=409, detail="This interview has already been completed")
    interview.status = "in_progress"
    db.commit()
    return InterviewResponse.model_validate(_owned_interview(db, interview_id, user.id))


@router.post("/{interview_id}/answers", response_model=AnswerResponse, summary="Submit an answer and get feedback")
async def submit_answer(interview_id: int, payload: AnswerSubmit, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    interview = _owned_interview(db, interview_id, user.id)
    if interview.status == "completed":
        raise HTTPException(status_code=409, detail="This interview has already been completed")
    question = next((q for q in interview.questions if q.id == payload.question_id), None)
    if not question:
        raise HTTPException(status_code=404, detail="Question was not found in this interview")
    if not payload.answer_text.strip():
        raise HTTPException(status_code=422, detail="Answer cannot be empty")
    evaluation = await evaluate_answer(payload.answer_text.strip(), question.question_text, question.expected_topics or [])
    answer = question.answer
    if answer:
        answer.answer_text = payload.answer_text.strip()
        answer.submitted_at = datetime.now(timezone.utc)
        analysis = answer.analysis
        for key, value in evaluation.items():
            setattr(analysis, key, value)
    else:
        answer = Answer(question_id=question.id, answer_text=payload.answer_text.strip())
        db.add(answer)
        db.flush()
        analysis = Analysis(answer_id=answer.id, **evaluation)
        db.add(analysis)
    interview.status = "in_progress"
    db.commit()
    db.refresh(answer)
    db.refresh(analysis)
    return AnswerResponse.model_validate(answer)


@router.post("/{interview_id}/finish", response_model=InterviewResponse, summary="Finish an interview")
def finish_interview(interview_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    interview = _owned_interview(db, interview_id, user.id)
    answered = [question.answer for question in interview.questions if question.answer and question.answer.analysis]
    if not answered:
        raise HTTPException(status_code=400, detail="Submit at least one answer before finishing")
    interview.overall_score = round(sum(answer.analysis.overall_score for answer in answered) / len(answered), 1)
    interview.status = "completed"
    interview.completed_at = datetime.now(timezone.utc)
    db.commit()
    return InterviewResponse.model_validate(_owned_interview(db, interview_id, user.id))


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an interview")
def delete_interview(interview_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    interview = _owned_interview(db, interview_id, user.id)
    db.delete(interview)
    db.commit()
