import json
import re
from typing import Any

import httpx
from pydantic import BaseModel, Field, ValidationError

from app.core.config import settings


class GeneratedQuestion(BaseModel):
    question: str = Field(min_length=10, max_length=1200)
    category: str = Field(min_length=2, max_length=80)
    difficulty: str
    expected_topics: list[str]


class QuestionSet(BaseModel):
    questions: list[GeneratedQuestion]


class Evaluation(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    technical_score: int = Field(ge=0, le=100)
    communication_score: int = Field(ge=0, le=100)
    relevance_score: int = Field(ge=0, le=100)
    clarity_score: int = Field(ge=0, le=100)
    completeness_score: int = Field(ge=0, le=100)
    problem_solving_score: int = Field(ge=0, le=100)
    strengths: list[str] = Field(min_length=2, max_length=4)
    weaknesses: list[str] = Field(min_length=2, max_length=4)
    missing_topics: list[str]
    suggested_answer: str
    improvement_tip: str


QUESTION_BANK: dict[str, list[tuple[str, str, list[str]]]] = {
    "Technical": [
        ("How would you explain the core concepts and trade-offs involved in your area of expertise?", "Technical knowledge", ["core concepts", "trade-offs", "example"]),
        ("Describe a technical problem you solved and how you verified your solution.", "Problem solving", ["problem", "approach", "verification"]),
        ("How do you keep the quality and maintainability of your technical work high?", "Engineering practices", ["testing", "readability", "maintenance"]),
    ],
    "HR": [
        ("Tell me about yourself and what motivates you to pursue this role.", "Motivation", ["experience", "motivation", "role fit"]),
        ("What is a professional strength you rely on, and how have you demonstrated it?", "Self awareness", ["strength", "example", "impact"]),
        ("Describe a challenge at work and how you responded to it.", "Adaptability", ["challenge", "action", "result"]),
    ],
    "Behavioral": [
        ("Tell me about a time you had to resolve a disagreement with a teammate.", "Teamwork", ["situation", "action", "outcome"]),
        ("Describe a time you made a mistake. What did you learn from it?", "Learning", ["context", "ownership", "lesson"]),
        ("Give an example of how you managed competing priorities.", "Planning", ["priorities", "decision", "result"]),
    ],
    "Coding": [
        ("Explain how you would approach a coding problem, including edge cases and complexity.", "Algorithms", ["approach", "edge cases", "complexity"]),
        ("How would you test and improve an implementation that is producing incorrect results?", "Debugging", ["reproduce", "isolate", "tests"]),
        ("Describe a data structure you have used and why it fit the problem.", "Data structures", ["structure", "alternatives", "complexity"]),
    ],
    "General": [
        ("What kind of work have you enjoyed most, and what made it successful?", "Experience", ["context", "contribution", "impact"]),
        ("How do you approach learning an unfamiliar tool or subject?", "Learning", ["plan", "practice", "application"]),
        ("What would you like to accomplish in your next role?", "Career goals", ["goals", "role", "growth"]),
    ],
    "Mixed": [
        ("Describe a project relevant to this role and the impact you made.", "Experience", ["context", "contribution", "impact"]),
        ("How would you investigate and solve a difficult problem in your field?", "Problem solving", ["clarify", "approach", "validate"]),
        ("Tell me about a time you worked with others to achieve a shared goal.", "Collaboration", ["role", "communication", "outcome"]),
    ],
}


def _mock_questions(job_role: str, experience_level: str, interview_type: str, difficulty: str, count: int) -> list[dict[str, Any]]:
    bank = QUESTION_BANK.get(interview_type, QUESTION_BANK["Mixed"])
    questions = []
    for index in range(count):
        base, category, topics = bank[index % len(bank)]
        questions.append({
            "question": f"{base} Consider your experience as a {job_role} at the {experience_level} level.",
            "category": category,
            "difficulty": difficulty,
            "expected_topics": topics,
        })
    return questions


def _mock_evaluation(answer: str, expected_topics: list[str]) -> dict[str, Any]:
    words = re.findall(r"\b[\w'-]+\b", answer)
    word_count = len(words)
    lowered = answer.lower()
    topic_hits = sum(1 for topic in expected_topics if any(part.lower() in lowered for part in topic.split()))
    base = min(92, max(38, 42 + min(word_count, 130) // 3 + topic_hits * 4))
    return {
        "overall_score": base,
        "technical_score": min(100, base + (5 if topic_hits else -4)),
        "communication_score": min(100, max(30, base + (4 if word_count >= 35 else -3))),
        "relevance_score": min(100, max(25, base + topic_hits * 2)),
        "clarity_score": min(100, max(25, base + (3 if word_count >= 20 else -5))),
        "completeness_score": min(100, max(20, base + (5 if word_count >= 45 else -7))),
        "problem_solving_score": min(100, max(25, base + (5 if any(w in lowered for w in ("because", "therefore", "first", "then", "result")) else -2))),
        "strengths": ["You addressed the prompt with a relevant response.", "Your answer gives the interviewer a starting point for follow-up discussion."],
        "weaknesses": ["Add a specific example and explain your personal contribution.", "Make the outcome or evidence of success more explicit."],
        "missing_topics": [topic for topic in expected_topics if topic.lower() not in lowered][:4],
        "suggested_answer": f"A stronger answer would briefly describe the context, explain the steps you took as a {answer[:0] or 'candidate'}, and finish with a measurable result relevant to the question.",
        "improvement_tip": "Structure your next response as Situation, Action, and Result, then include one concrete detail that demonstrates impact.",
    }


async def _chat_json(system_prompt: str, user_prompt: str) -> dict[str, Any]:
    if not settings.ai_api_key:
        raise RuntimeError("AI_MODE=api requires AI_API_KEY")
    url = f"{settings.ai_base_url.rstrip('/')}/chat/completions"
    async with httpx.AsyncClient(timeout=40) as client:
        response = await client.post(
            url,
            headers={"Authorization": f"Bearer {settings.ai_api_key}"},
            json={
                "model": settings.ai_model,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            },
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        return json.loads(content)


async def generate_questions(job_role: str, experience_level: str, interview_type: str, difficulty: str, count: int) -> list[dict[str, Any]]:
    if settings.ai_mode.lower() != "api":
        return [q.model_dump() for q in QuestionSet(questions=_mock_questions(job_role, experience_level, interview_type, difficulty, count)).questions]
    try:
        raw = await _chat_json(
            "Generate interview questions. Return only valid JSON with a questions array; each item must have question, category, difficulty, expected_topics (array of strings).",
            json.dumps({"job_role": job_role, "experience_level": experience_level, "interview_type": interview_type, "difficulty": difficulty, "count": count}),
        )
        validated = QuestionSet.model_validate(raw)
        if len(validated.questions) != count:
            raise ValueError("AI returned an unexpected number of questions")
        return [item.model_dump() for item in validated.questions]
    except (httpx.HTTPError, KeyError, ValueError, ValidationError, json.JSONDecodeError, RuntimeError):
        return _mock_questions(job_role, experience_level, interview_type, difficulty, count)


async def evaluate_answer(answer: str, question: str, expected_topics: list[str]) -> dict[str, Any]:
    if settings.ai_mode.lower() != "api":
        return Evaluation.model_validate(_mock_evaluation(answer, expected_topics)).model_dump()
    try:
        raw = await _chat_json(
            "Evaluate only observable content in an interview answer. Do not infer personality, psychology, or medical traits. Return JSON matching fields overall_score, technical_score, communication_score, relevance_score, clarity_score, completeness_score, problem_solving_score (0-100), strengths (2-4 strings), weaknesses (2-4 strings), missing_topics (strings), suggested_answer, improvement_tip.",
            json.dumps({"question": question, "expected_topics": expected_topics, "answer": answer}),
        )
        return Evaluation.model_validate(raw).model_dump()
    except (httpx.HTTPError, KeyError, ValueError, ValidationError, json.JSONDecodeError, RuntimeError):
        return Evaluation.model_validate(_mock_evaluation(answer, expected_topics)).model_dump()
