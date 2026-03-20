from __future__ import annotations

import json
from functools import cached_property
from pathlib import Path

from app.schemas.template import TemplateDefinition


class TemplateEngine:
    def __init__(self, catalog_path: Path) -> None:
        self.catalog_path = catalog_path

    @cached_property
    def templates(self) -> list[TemplateDefinition]:
        payload = json.loads(self.catalog_path.read_text(encoding="utf-8"))
        templates = [TemplateDefinition.model_validate(item) for item in payload]
        self._validate_templates(templates)
        return templates

    def list_templates(self) -> list[TemplateDefinition]:
        return list(self.templates)

    def get_template(self, template_id: str) -> TemplateDefinition | None:
        return next(
            (template for template in self.templates if template.id == template_id),
            None,
        )

    @staticmethod
    def _validate_templates(templates: list[TemplateDefinition]) -> None:
        ids = [template.id for template in templates]
        if len(ids) != len(set(ids)):
            raise ValueError("Template ids must be unique.")
        if len(templates) < 10:
            raise ValueError("At least 10 templates are required.")
