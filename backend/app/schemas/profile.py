from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ProfileUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    target_role: str = Field(default="", max_length=120)
    experience_level: str = Field(pattern="^(Fresher|Junior|Mid-Level|Senior)$")
    preferred_interview_type: str = Field(pattern="^(Technical|HR|Behavioral|Coding|General|Mixed)$")


class ProfileResponse(BaseModel):
    name: str
    email: EmailStr
    target_role: str
    experience_level: str
    preferred_interview_type: str
    model_config = ConfigDict(from_attributes=True)
