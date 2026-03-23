from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.schemas.content_generation import (
    GeneratedPresentationContent,
    PresentationSlide,
    TopicToPptRequest,
)
from app.services.content_generation_service import (
    ContentGenerationConfigurationError,
    ContentGenerationError,
    ContentGenerationService,
)


class FakeOpenAIService:
    def __init__(self, parsed_response, configured: bool = True) -> None:
        self.parsed_response = parsed_response
        self.configured = configured

    def is_configured(self) -> bool:
        return self.configured

    def parse_chat_completion(self, **_kwargs):
        return self.parsed_response


def test_content_generation_service_returns_validated_presentation() -> None:
    payload = TopicToPptRequest(
        topic="AI PPT workflows",
        subject="Productivity",
        slide_count=3,
        tone="practical",
    )
    parsed_response = GeneratedPresentationContent(
        presentation_title="AI PPT Workflows",
        slides=[
            PresentationSlide(
                title="Problem",
                bullets=["Teams start from scratch", "Consistency is hard"],
                speaker_notes="Describe the pain of manual deck drafting across teams.",
            ),
            PresentationSlide(
                title="Solution",
                bullets=["Generate structured outlines", "Refine before export"],
                speaker_notes="Explain how the service converts a topic into usable slide content.",
            ),
            PresentationSlide(
                title="Outcome",
                bullets=["Faster drafting", "Better presentation quality"],
                speaker_notes="Summarize the user value and product direction.",
            ),
        ],
    )
    service = ContentGenerationService(FakeOpenAIService(parsed_response))

    result = service.generate_topic_presentation(payload)

    assert result.presentation_title == "AI PPT Workflows"
    assert len(result.slides) == 3


def test_content_generation_service_rejects_invalid_slide_count() -> None:
    payload = TopicToPptRequest(
        topic="AI PPT workflows",
        subject="Productivity",
        slide_count=4,
        tone="practical",
    )
    parsed_response = GeneratedPresentationContent(
        presentation_title="AI PPT Workflows",
        slides=[
            PresentationSlide(
                title="Only Three Slides",
                bullets=["One", "Two"],
                speaker_notes="This intentionally mismatches the requested slide count.",
            ),
            PresentationSlide(
                title="Second Slide",
                bullets=["Three", "Four"],
                speaker_notes="Still valid slide content, but not enough slides overall.",
            ),
            PresentationSlide(
                title="Third Slide",
                bullets=["Five", "Six"],
                speaker_notes="Validation should fail before the response is returned.",
            ),
        ],
    )
    service = ContentGenerationService(FakeOpenAIService(parsed_response))

    with pytest.raises(ContentGenerationError):
        service.generate_topic_presentation(payload)


def test_content_generation_service_requires_openai_config() -> None:
    payload = TopicToPptRequest(
        topic="AI PPT workflows",
        subject="Productivity",
        slide_count=3,
        tone="practical",
    )
    service = ContentGenerationService(
        FakeOpenAIService(parsed_response=SimpleNamespace(), configured=False)
    )

    with pytest.raises(ContentGenerationConfigurationError):
        service.generate_topic_presentation(payload)


def test_content_generation_service_generates_notes_based_presentation() -> None:
    parsed_response = GeneratedPresentationContent(
        presentation_title="Normalized Research Notes",
        slides=[
            PresentationSlide(
                title="Overview",
                bullets=["Notes were cleaned", "Sections were identified"],
                speaker_notes=(
                    "Explain how preprocessing makes the notes easier to turn "
                    "into slides."
                ),
            ),
            PresentationSlide(
                title="Themes",
                bullets=["Speed matters most", "Trust needs visible polish"],
                speaker_notes="Summarize the strongest patterns that came out of the notes.",
            ),
            PresentationSlide(
                title="Next Steps",
                bullets=["Export to PPTX", "Share through storage"],
                speaker_notes="Close on the immediate product workflow after generation.",
            ),
        ],
    )
    service = ContentGenerationService(FakeOpenAIService(parsed_response))

    result = service.generate_notes_presentation(
        normalized_notes="Section A\n\nSection B",
        sections=["Section A", "Section B"],
        slide_count=3,
        topic="Research synthesis",
        title="Research summary",
    )

    assert result.presentation_title == "Normalized Research Notes"
    assert len(result.slides) == 3


def test_content_generation_service_rejects_invalid_notes_slide_count() -> None:
    parsed_response = GeneratedPresentationContent(
        presentation_title="Short Deck",
        slides=[
            PresentationSlide(
                title="Only One",
                bullets=["One", "Two"],
                speaker_notes="This is intentionally too short for the requested notes output.",
            ),
            PresentationSlide(
                title="Only Two",
                bullets=["Three", "Four"],
                speaker_notes="Still valid slide content, but the slide count is wrong overall.",
            ),
            PresentationSlide(
                title="Only Three",
                bullets=["Five", "Six"],
                speaker_notes="The service should reject this when four slides are required.",
            ),
        ],
    )
    service = ContentGenerationService(FakeOpenAIService(parsed_response))

    with pytest.raises(ContentGenerationError):
        service.generate_notes_presentation(
            normalized_notes="Section A\n\nSection B",
            sections=["Section A", "Section B"],
            slide_count=4,
            topic="Research synthesis",
            title="Research summary",
        )


def test_content_generation_service_generates_pdf_based_presentation() -> None:
    parsed_response = GeneratedPresentationContent(
        presentation_title="Annual Report Summary",
        slides=[
            PresentationSlide(
                title="Overview",
                bullets=["Financial performance improved", "Operational efficiency rose"],
                speaker_notes=(
                    "Introduce the PDF summary at a high level before diving "
                    "into details."
                ),
            ),
            PresentationSlide(
                title="Key Findings",
                bullets=["Revenue increased", "Margins expanded"],
                speaker_notes="Focus on the strongest signals surfaced from the PDF text.",
            ),
            PresentationSlide(
                title="Recommendations",
                bullets=["Sustain growth bets", "Monitor execution risk"],
                speaker_notes="Close with action-oriented takeaways grounded in the report.",
            ),
        ],
    )
    service = ContentGenerationService(FakeOpenAIService(parsed_response))

    result = service.generate_pdf_presentation(
        extracted_text="Long extracted report text",
        slide_count=3,
        source_name="annual-report.pdf",
    )

    assert result.presentation_title == "Annual Report Summary"
    assert len(result.slides) == 3
