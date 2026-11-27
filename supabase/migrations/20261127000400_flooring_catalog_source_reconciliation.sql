BEGIN;

-- The supplemental rows repeat LX Editone dimensions and prices, but the
-- primary PDF lists different specifications for Nova Acro K and Nova STB.
-- Keep the original SKU keys for stored estimates; do not reassign the brand.
DO $reconcile$
DECLARE changed integer;
BEGIN
  UPDATE public.os_flooring_products
     SET active = false,
         revision = revision + 1,
         source_notes = source_notes || ' / PDF 노바 규격과 불일치, LX 에디톤과 규격·단가 동일: 제조사 확인 전 제외'
   WHERE brand = '노바마루'
     AND (sku, width_mm, length_mm, thickness_mm, supply_cost) IN
       (('nova-acro-image', 450, 900, 5, 135000), ('nova-stb-image', 600, 600, 5, 150000));
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 2 THEN
    RAISE EXCEPTION 'Expected both unresolved Nova seed rows';
  END IF;
END $reconcile$;

-- Use the exact supplier grouping instead of assigning an inferred Ash SKU.
INSERT INTO public.os_flooring_products
  (sku, brand, product_group, official_name, short_name, width_mm, length_mm, thickness_mm,
   pack_m2, billing_unit, supplier_pyeong_m2, supply_cost, source_notes)
VALUES
  ('kg-prestige-other-species', '구정마루', '천연마루', '프레스티지 오크 외 수종', '프레스티지 오크 외 수종',
    142, 1200, 8.7, 3.07, 'BOX', NULL, 160000,
    '지너스 원목마루 정밀 시공 단가표(2026-10-23, VAT 별도) / 구분 오크 외 수종 / 1박스 단가 / 단판 0.6mm / 세부 수종 미기재');

COMMIT;
