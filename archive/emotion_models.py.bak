from __future__ import annotations

from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator

class SupportedLanguage(Enum):
    ENGLISH = "EN"
    KOREAN = "KO"
    # Add other supported languages here

class SupportedEmotion(Enum):
    ANGER = "ANGER"
    FEAR = "FEAR"
    JOY = "JOY"
    LOVE = "LOVE"
    SADNESS = "SADNESS"
    SURPRISE = "SURPRISE"
    NEUTRAL = "NEUTRAL"
    EXCITED = "EXCITED"
    FRUSTRATED = "FRUSTRATED"
    CURIOUS = "CURIOUS"
    TIRED = "TIRED"

    @classmethod
    def get_display_label(cls, emotion: SupportedEmotion, lang: SupportedLanguage) -> str:
        labels: Dict[SupportedLanguage, Dict[SupportedEmotion, str]] = {            SupportedLanguage.ENGLISH: {
                SupportedEmotion.ANGER: "Anger",
                SupportedEmotion.FEAR: "Fear",
                SupportedEmotion.JOY: "Joy",
                SupportedEmotion.LOVE: "Love",
                SupportedEmotion.SADNESS: "Sadness",
                SupportedEmotion.SURPRISE: "Surprise",
                SupportedEmotion.NEUTRAL: "Neutral",
                SupportedEmotion.EXCITED: "Excited",
                SupportedEmotion.FRUSTRATED: "Frustrated",
                SupportedEmotion.CURIOUS: "Curious",
                SupportedEmotion.TIRED: "Tired",
            },SupportedLanguage.KOREAN: {
                SupportedEmotion.ANGER: "분노",
                SupportedEmotion.FEAR: "두려움",
                SupportedEmotion.JOY: "기쁨",
                SupportedEmotion.LOVE: "사랑",
                SupportedEmotion.SADNESS: "슬픔",
                SupportedEmotion.SURPRISE: "놀람",
                SupportedEmotion.NEUTRAL: "중립",
                SupportedEmotion.EXCITED: "흥분",
                SupportedEmotion.FRUSTRATED: "좌절",
                SupportedEmotion.CURIOUS: "호기심",
                SupportedEmotion.TIRED: "피곤",
            }
        }
        try:
            return labels[lang][emotion]
        except KeyError:
            return emotion.value

class EmotionResult(BaseModel):
    emotion: SupportedEmotion = Field(..., description="The detected emotion type.")
    score: float = Field(..., ge=-1.0, le=1.0, description="The raw score, between -1.0 and 1.0.")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence level, between 0.0 and 1.0.")
    language: SupportedLanguage = Field(..., description="Language of the input text.")
    raw_output: Optional[Dict[str, Any]] = Field(default=None, description="Optional raw model output.")
    fallback_attempted: Optional[bool] = Field(default=None, description="LLM 폴백 시도 여부")

    @field_validator('emotion', mode='before')
    @classmethod
    def _validate_emotion(cls, value: Any) -> SupportedEmotion:
        if isinstance(value, SupportedEmotion):
            return value
        if isinstance(value, str):
            try:
                return SupportedEmotion[value.upper()]
            except KeyError:
                raise ValueError(f"Invalid emotion type: {value}")
        raise ValueError(f"Invalid emotion type: {value}")

    @field_validator('language', mode='before')
    @classmethod
    def _validate_language(cls, value: Any) -> SupportedLanguage:
        if isinstance(value, SupportedLanguage):
            return value
        if isinstance(value, str):
            try:
                return SupportedLanguage[value.upper()]
            except KeyError:
                for lang_enum in SupportedLanguage:
                    if value.upper() == lang_enum.value:
                        return lang_enum
                raise ValueError(f"Invalid language code: {value}")
        raise ValueError(f"Invalid language code: {value}")

    def is_confident(self, threshold: float = 0.7) -> bool:
        """Check if the emotion detection is confident above threshold"""
        return self.confidence >= threshold

    @classmethod
    def to_language(
        cls,
        emotion_result: EmotionResult,
        target_lang: SupportedLanguage,
    ) -> EmotionResult:
        # Creates a new EmotionResult for the target language context.
        # The 'language' field in the new instance is updated to target_lang.
        return emotion_result.model_copy(update={"language": target_lang})

    def get_display_emotion(self) -> str:
        # Helper to get display label for current emotion and language.
        return SupportedEmotion.get_display_label(self.emotion, self.language)

# Example Usage:
if __name__ == "__main__":
    joy_en_text_result = EmotionResult(
        emotion=SupportedEmotion.JOY, score=0.8, confidence=0.95, language=SupportedLanguage.ENGLISH
    )
    print(f"Original (EN text): {joy_en_text_result.get_display_emotion()}, Lang: {joy_en_text_result.language.value}")

    joy_for_ko_display = EmotionResult.to_language(joy_en_text_result, SupportedLanguage.KOREAN)
    print(f"For KO Display: {joy_for_ko_display.get_display_emotion()}, Lang: {joy_for_ko_display.language.value}")

    sad_ko_text_result = EmotionResult(emotion=SupportedEmotion.SADNESS, score=-0.7, confidence=0.88, language=SupportedLanguage.KOREAN)
    print(f"Original (KO text): {sad_ko_text_result.get_display_emotion()}, Lang: {sad_ko_text_result.language.value}")
