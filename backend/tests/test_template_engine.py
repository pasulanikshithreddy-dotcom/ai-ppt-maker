from app.config.settings import Settings
from app.services.template_engine import TemplateEngine
from app.services.template_service import TemplateService


def test_template_engine_loads_catalog_with_required_count() -> None:
    engine = TemplateEngine(Settings().template_catalog_path)

    templates = engine.list_templates()

    assert len(templates) == 10
    assert any(template.is_pro for template in templates)
    assert any(not template.is_pro for template in templates)


def test_template_service_returns_rich_template_metadata() -> None:
    service = TemplateService(Settings())

    payload = service.list_templates()
    template = payload.items[0]

    assert payload.total == 10
    assert payload.free_count + payload.pro_count == 10
    assert template.theme.title_font_size >= 28
    assert template.layout.content_columns in {1, 2, 3}
