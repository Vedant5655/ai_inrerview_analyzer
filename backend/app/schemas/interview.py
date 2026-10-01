from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class InterviewCreate(BaseModel):
    job_role: str = Field(min_length=2, max_length=120)
    experience_level: str = Field(pattern="^(Fresher|Junior|Mid-Level|Senior)$")
    interview_type: str = Field(pattern="^(Technical|HR|Behavioral|Coding|General|Mixed)$")
    difficulty: str = Field(pattern="^(Easy|Medium|Hard)$")
    total_questions: int = Field(ge=5, le=20)


class QuestionResponse(BaseModel):
    id: int
    question_text: str
    category: str
    difficulty: str
    expected_topics: list[str]
    question_order: int
    answered: bool = False
    answer_text: str | None = None
    model_config = ConfigDict(from_attributes=True)


class InterviewResponse(BaseModel):
    id: int
    job_role: str
    experience_level: str
    interview_type: str
    difficulty: str
    total_questions: int
    overall_score: float | None
    status: str
    created_at: datetime
    completed_at: datetime | None
    questions: list[QuestionResponse] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)


class AnswerSubmit(BaseModel):
    question_id: int
    answer_text: str = Field(min_length=1, max_length=12000)


class AnalysisResponse(BaseModel):
    id: int
    overall_score: float
    technical_score: float
    communication_score: float
    relevance_score: float
    clarity_score: float
    completeness_score: float
    problem_solving_score: float
    strengths: list[str]
    weaknesses: list[str]
    missing_topics: list[str]
    suggested_answer: str
    improvement_tip: str
    model_config = ConfigDict(from_attributes=True)


class AnswerResponse(BaseModel):
    id: int
    question_id: int
    answer_text: str
    analysis: AnalysisResponse
    model_config = ConfigDict(from_attributes=True)
