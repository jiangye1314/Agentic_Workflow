# ComfyUI 实践模板与案例方向

参考项目：

- ComfyUI: https://github.com/comfyanonymous/ComfyUI
- ComfyUI Examples: https://github.com/Comfy-Org/ComfyUI_examples

## 适合沉淀的案例

1. 文生图工作流
2. 图生图与风格迁移
3. 商品图批量生成
4. 品牌视觉素材流水线
5. 与内容工作流联动的封面图生成

## 推荐模板：营销视觉素材流水线

```yaml
name: comfyui-marketing-visual-pipeline
platform: comfyui
scenario: 商品或文章视觉素材生成

inputs:
  - product_or_topic_brief
  - brand_style_guide
  - reference_images_optional
  - output_size

workflow:
  - prompt_planning
  - negative_prompt_rules
  - image_generation
  - quality_filter
  - brand_consistency_review
  - export_assets

human_review:
  required_when:
    - commercial_use
    - contains_people_or_brand
    - generated_text_visible
    - product_details_must_be_exact

metrics:
  - review_pass_rate
  - brand_consistency_score
  - regeneration_count
  - asset_reuse_rate
```

## 推荐模板：封面图生成工作流

```yaml
name: comfyui-article-cover-flow
platform: comfyui
scenario: 文章、课程、报告封面图生成

steps:
  - extract_visual_brief_from_article
  - choose_style_preset
  - generate_3_to_6_candidates
  - select_candidate
  - upscale_and_export

outputs:
  - cover_image
  - prompt_record
  - seed_record
  - review_notes
```

## 落地建议

- ComfyUI 案例要保存 workflow JSON、prompt、seed、模型说明和输出样例。
- 商用素材必须保留版权、肖像、商标和品牌一致性审核。
- 产品图不要让模型凭空改写关键外观，应使用真实参考图和人工确认。

## 可放入仓库的目录建议

```text
examples/comfyui-marketing-visuals/
  README.md
  workflow.example.json
  prompt-template.md
  review-checklist.md
  output-spec.md
```
