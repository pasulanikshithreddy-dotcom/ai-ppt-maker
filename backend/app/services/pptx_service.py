from pathlib import Path

from app.config.settings import Settings
from app.schemas.template import TemplateDefinition
from app.services.template_engine import TemplateEngine


class PptxService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.template_engine = TemplateEngine(settings.template_catalog_path)

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

    def get_template_definition(self, template_id: str) -> TemplateDefinition | None:
        return self.template_engine.get_template(template_id)
