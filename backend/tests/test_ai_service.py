import asyncio

from app.services.ai_service import evaluate_answer, generate_questions


def test_mock_question_generation(monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "ai_mode", "mock")
    questions = asyncio.run(generate_questions("Software Developer", "Junior", "Technical", "Medium", 5))
    assert len(questions) == 5
    assert all(item["question"] and item["expected_topics"] for item in questions)


def test_mock_evaluation_has_bounded_scores(monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "ai_mode", "mock")
    result = asyncio.run(evaluate_answer("I first clarified the problem, then tested my approach and measured the result.", "Explain your approach", ["testing", "result"]))
    assert 0 <= result["overall_score"] <= 100
    assert len(result["strengths"]) >= 2
