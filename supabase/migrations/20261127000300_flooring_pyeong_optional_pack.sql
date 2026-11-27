BEGIN;

ALTER TABLE public.os_flooring_products
  ALTER COLUMN pack_m2 DROP NOT NULL,
  ADD CONSTRAINT os_flooring_products_box_pack_required
    CHECK (billing_unit = 'PYEONG' OR pack_m2 IS NOT NULL);

-- The listed prices include supply and installation. Do not infer an area per box.
INSERT INTO public.os_flooring_products
  (sku, brand, product_group, official_name, short_name, width_mm, length_mm, thickness_mm,
   pack_m2, billing_unit, supplier_pyeong_m2, supply_cost, source_notes)
VALUES
  ('olg-loca-square', '올고다', '타일형 HDF마루', '로카 스퀘어', '로카 스퀘어',
    600, 600, 7, NULL, 'PYEONG', 3.24, 135000, '지너스 바닥재 정밀 시공 단가표 p.3 / 평당 과금, 박스 면적 미기재'),
  ('dm-wood14-abc240-premium', '디앤메종', '14T 원목마루', '14T 오크브러쉬(ABC) 프리미엄 240폭', '오크브러쉬 ABC 프리미엄 240폭',
    240, 2200, 14, NULL, 'PYEONG', 3.24, 280000, '지너스 바닥재 정밀 시공 단가표 p.2 / 단판 1.2mm / ABC 프리미엄 / 운임·양중 별도 / 박스 면적 미기재'),
  ('kg-piante-del-arbo', '구정마루', '이탈리아 원목마루', '피안테 델 아르보', '피안테 델 아르보',
    242, 2350, 15, NULL, 'PYEONG', 3.24, 1400000, '지너스 원목마루 정밀 시공 단가표 / 블로네티·포스티에라·티에네·베키오·카멜로 / 단판 4mm / 운임·양중 별도 / 박스 면적 미기재');

COMMIT;
