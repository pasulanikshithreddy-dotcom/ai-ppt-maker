from typing import Literal

from pydantic import BaseModel, Field


class TemplateTheme(BaseModel):
    title_font_size: int = Field(ge=12, le=72)
    body_font_size: int = Field(ge=10, le=48)
    primary_color: str = Field(min_length=6, max_length=6)
    secondary_color: str = Field(min_length=6, max_length=6)
    font_family: str = Field(min_length=2, max_length=80)


class TemplateLayoutOptions(BaseModel):
    title_alignment: Literal["left", "center", "right"]
    body_alignment: Literal["left", "center", "right"]
    cover_style: str = Field(min_length=2, max_length=80)
    content_columns: int = Field(ge=1, le=3)
    show_page_numbers: bool = True
    use_accent_band: bool = False


class TemplateDefinition(BaseModel):
    id: str
    name: str
    description: str
    is_pro: bool = False
    theme: TemplateTheme
    layout: TemplateLayoutOptions
    source_pptx: str | None = None


class TemplateListData(BaseModel):
    items: list[TemplateDefinition]
    total: int
    free_count: int
    pro_count: int
