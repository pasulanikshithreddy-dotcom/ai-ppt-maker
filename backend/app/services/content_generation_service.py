from __future__ import annotations

from pydantic import ValidationError

from app.schemas.content_generation import (
    GeneratedPresentationContent,
    TopicToPptRequest,
)
from app.services.openai_service import (
    OpenAIService,
    OpenAIServiceAuthenticationError,
    OpenAIServiceError,
    OpenAIServiceRateLimitError,
)


class ContentGenerationConfigurationError(RuntimeError):
    """Raised when content generation cannot run due to missing config."""


class ContentGenerationError(RuntimeError):
    """Raised when the model output cannot be used safely."""


class ContentGenerationService:
    def __init__(self, openai_service: OpenAIService) -> None:
        self.openai_service = openai_service

    def generate_topic_presentation(
        self,
        payload: TopicToPptRequest,
    ) -> GeneratedPresentationContent:
        if not self.openai_service.is_configured():
            raise ContentGenerationConfigurationError(
                "OpenAI API is not configured for content generation."
            )

        user_prompt = (
            f"Topic: {payload.topic}\n"
            f"Subject: {payload.subject}\n"
            f"Slide count: {payload.slide_count}\n"
            f"Tone: {payload.tone}\n"
            "Create a presentation outline for this topic."
        )
        try:
            presentation = self.openai_service.parse_chat_completion(
                system_prompt=TOPIC_TO_PPT_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                response_format=GeneratedPresentationContent,
                temperature=0.7,
            )
        except (OpenAIServiceAuthenticationError, OpenAIServiceRateLimitError) as exc:
            raise ContentGenerationConfigurationError(str(exc)) from exc
        except OpenAIServiceError as exc:
            raise ContentGenerationError(str(exc)) from exc
        except (ValidationError, ValueError) as exc:
            raise ContentGenerationError(
                "Generated presentation content was invalid."
            ) from exc

        self._validate_presentation(presentation, payload.slide_count)
        return presentation

    def generate_notes_presentation(
        self,
        *,
        normalized_notes: str,
        sections: list[str],
        slide_count: int,
        topic: str | None = None,
        title: str | None = None,
    ) -> GeneratedPresentationContent:
        if not self.openai_service.is_configured():
            raise ContentGenerationConfigurationError(
                "OpenAI API is not configured for content generation."
            )

        section_lines = "\n".join(
            f"{index}. {section}" for index, section in enumerate(sections, start=1)
        )
        user_prompt = (
            f"Requested slide count: {slide_count}\n"
            f"Suggested topic: {topic or 'None'}\n"
            f"Suggested title: {title or 'None'}\n\n"
            "Logical sections:\n"
            f"{section_lines}\n\n"
            "Normalized notes:\n"
            f"{normalized_notes}"
        )
        try:
            presentation = self.openai_service.parse_chat_completion(
                system_prompt=NOTES_TO_PPT_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                response_format=GeneratedPresentationContent,
                temperature=0.4,
            )
        except (OpenAIServiceAuthenticationError, OpenAIServiceRateLimitError) as exc:
            raise ContentGenerationConfigurationError(str(exc)) from exc
        except OpenAIServiceError as exc:
            raise ContentGenerationError(str(exc)) from exc
        except (ValidationError, ValueError) as exc:
            raise ContentGenerationError(
                "Generated presentation content was invalid."
            ) from exc

        self._validate_presentation(presentation, slide_count)
        return presentation

    def generate_pdf_presentation(
        self,
        *,
        extracted_text: str,
        slide_count: int,
        source_name: str,
    ) -> GeneratedPresentationContent:
        if not self.openai_service.is_configured():
            raise ContentGenerationConfigurationError(
                "OpenAI API is not configured for content generation."
            )

        user_prompt = (
            f"Source PDF name: {source_name}\n"
            f"Requested slide count: {slide_count}\n\n"
            "Readable text extracted from the PDF:\n"
            f"{extracted_text}"
        )
        try:
            presentation = self.openai_service.parse_chat_completion(
                system_prompt=PDF_TO_PPT_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                response_format=GeneratedPresentationContent,
                temperature=0.3,
            )
        except (OpenAIServiceAuthenticationError, OpenAIServiceRateLimitError) as exc:
            raise ContentGenerationConfigurationError(str(exc)) from exc
        except OpenAIServiceError as exc:
            raise ContentGenerationError(str(exc)) from exc
        except (ValidationError, ValueError) as exc:
            raise ContentGenerationError(
                "Generated presentation content was invalid."
            ) from exc

        self._validate_presentation(presentation, slide_count)
        return presentation

    @staticmethod
    def _validate_presentation(
        presentation: GeneratedPresentationContent,
        slide_count: int,
    ) -> None:
        if len(presentation.slides) != slide_count:
            raise ContentGenerationError(
                f"Expected {slide_count} slides but received {len(presentation.slides)}."
            )

        if any(len(slide.bullets) < 2 for slide in presentation.slides):
            raise ContentGenerationError(
                "Each generated slide must contain at least two bullet points."
            )


TOPIC_TO_PPT_SYSTEM_PROMPT = """
You are AI PPT Maker, an expert presentation writer.
Generate structured presentation JSON only.

Rules:
- Return a presentation title and a slides array.
- The slides array must contain exactly the requested number of slides.
- Each slide must include:
  - title
  - bullets
  - speaker_notes
- Keep bullets concise and presentation-ready.
- Speaker notes should help a presenter elaborate naturally.
- Do not return markdown, prose, or any text outside the structured response.
""".strip()


NOTES_TO_PPT_SYSTEM_PROMPT = """
You are AI PPT Maker, an expert presentation writer.
Convert cleaned user notes into structured presentation JSON only.

Rules:
- Return a presentation title and a slides array.
- The slides array must contain exactly the requested number of slides.
- Each slide must include:
  - title
  - bullets
  - speaker_notes
- Use the notes as the source of truth and stay grounded in them.
- Speaker notes should expand on the slide in a presenter-friendly way.
- Bullets should be concise, non-redundant, and ready for a deck.
- Use any suggested topic or title only if it improves the output.
- Do not return markdown, prose, or any text outside the structured response.
""".strip()


PDF_TO_PPT_SYSTEM_PROMPT = """
You are AI PPT Maker, an expert presentation writer.
Turn extracted PDF text into structured presentation JSON only.

Rules:
- Return a presentation title and a slides array.
- The slides array must contain exactly the requested number of slides.
- Each slide must include:
  - title
  - bullets
  - speaker_notes
- Summarize the document faithfully and avoid inventing unsupported claims.
- Prioritize key arguments, findings, timelines, and decisions over minor details.
- Speaker notes should add context a presenter can use while staying grounded in the source.
- Do not return markdown, prose, or any text outside the structured response.
""".strip()
