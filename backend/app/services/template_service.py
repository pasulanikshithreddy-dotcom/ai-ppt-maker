from app.config.settings import Settings
from app.schemas.template import TemplateDefinition, TemplateListData
from app.services.template_engine import TemplateEngine


class TemplateService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.engine = TemplateEngine(settings.template_catalog_path)

    def list_templates(self) -> TemplateListData:
        items = self.engine.list_templates()
        pro_count = sum(1 for item in items if item.is_pro)
        free_count = len(items) - pro_count
        return TemplateListData(
            items=items,
            total=len(items),
            free_count=free_count,
            pro_count=pro_count,
        )

    def get_template(self, template_id: str) -> TemplateDefinition | None:
        return self.engine.get_template(template_id)
