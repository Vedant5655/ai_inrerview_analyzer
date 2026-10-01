from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _register_user():
    response = client.post("/api/auth/register", json={"name": "Test User", "email": "tester@example.com", "password": "safe-password-123"})
    if response.status_code == 409:
        response = client.post("/api/auth/login", json={"email": "tester@example.com", "password": "safe-password-123"})
    assert response.status_code in (200, 201)
    return response.json()["access_token"]


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "ok"


def test_register_login_and_current_user():
    token = _register_user()
    headers = {"Authorization": f"Bearer {token}"}
    current = client.get("/api/auth/me", headers=headers)
    assert current.status_code == 200
    assert current.json()["email"] == "tester@example.com"
    profile = client.get("/api/profile", headers=headers)
    assert profile.status_code == 200, profile.text
    assert profile.json()["name"] == "Test User"
    updated = client.put("/api/profile", headers=headers, json={
        "name": "Updated Test", "target_role": "Engineer", "experience_level": "Junior", "preferred_interview_type": "Technical",
    })
    assert updated.status_code == 200, updated.text
    assert updated.json()["target_role"] == "Engineer"


def test_interview_creation_answer_analysis_and_finish():
    token = _register_user()
    headers = {"Authorization": f"Bearer {token}"}
    created = client.post("/api/interviews", headers=headers, json={
        "job_role": "Software Developer", "experience_level": "Junior", "interview_type": "Technical", "difficulty": "Medium", "total_questions": 5,
    })
    assert created.status_code == 201, created.text
    interview = created.json()
    assert len(interview["questions"]) == 5
    question = interview["questions"][0]
    answer = client.post(f"/api/interviews/{interview['id']}/answers", headers=headers, json={
        "question_id": question["id"], "answer_text": "I clarified the problem, considered trade-offs, tested the solution, and measured the result with examples.",
    })
    assert answer.status_code == 200, answer.text
    assert 0 <= answer.json()["analysis"]["overall_score"] <= 100
    finished = client.post(f"/api/interviews/{interview['id']}/finish", headers=headers)
    assert finished.status_code == 200, finished.text
    assert finished.json()["status"] == "completed"
    result = client.get(f"/api/interviews/{interview['id']}/analysis", headers=headers)
    assert result.status_code == 200
    assert len(result.json()["questions"]) == 1


def test_protected_routes_require_authentication():
    response = client.get("/api/interviews")
    assert response.status_code == 401
