from pathlib import Path

from app.config.settings import Settings


class PptxService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    @property
    def default_template_path(self) -> Path:
        return self.settings.ppt_template_dir / "default.pptx"

    def is_configured(self) -> bool:
        return True

    def readiness_detail(self) -> str:
        return (
            f"Template directory: {self.settings.ppt_template_dir}. "
            f"Output directory: {self.settings.generated_ppt_dir}."
        )

    def create_presentation(self):
        from pptx import Presentation

        if self.default_template_path.exists():
            return Presentation(str(self.default_template_path))
        return Presentation()
