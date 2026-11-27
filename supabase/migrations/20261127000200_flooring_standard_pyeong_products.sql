BEGIN;

-- This batch charges by pyeong but the supplier does not state its area per pyeong.
-- Use the AND standard for these rows only; leave the original catalog unchanged.
INSERT INTO public.os_flooring_products
  (sku, brand, product_group, official_name, short_name, width_mm, length_mm, thickness_mm,
   pack_m2, billing_unit, supplier_pyeong_m2, supply_cost, source_notes)
SELECT sku, brand, product_group, official_name, short_name, width_mm, length_mm, thickness_mm,
       pack_m2, 'PYEONG', 3.3058, supply_cost,
       concat_ws(' / ', '지너스 바닥재 정밀 시공 단가표 p.' || page || ' (2026-10-23, VAT 별도)',
         '평당 단가, 공급사 평 면적 미기재: AND 1평 3.3058㎡ 적용', source_note)
FROM (VALUES
  ('kg-blond-order', '구정마루', '초광폭 강마루', '블론데 주문 (곧은결·무늬결 비율)', '블론데 주문', 230, 2420, 8.7, 2.78, 163000, 1, '운임·양중 별도'),
  ('kg-marvel-muse', '구정마루', '타일형 강마루', '마블러스 뮤즈', '마블러스 뮤즈', 393, 1200, 8.7, 2.83, 140000, 1, '공급사 비고: 로스율 15~20% 전후'),
  ('kg-marvel-deuce-brick', '구정마루', '타일형 강마루', '마블러스 듀스 벽돌식 시공', '마블러스 듀스 벽돌식 시공', 597, 1210, 8.7, 2.89, 168000, 1, '공급사 비고: 로스율 15~20% 전후'),
  ('kg-marvel-deuce-straight', '구정마루', '타일형 강마루', '마블러스 듀스 1:1 정시공', '마블러스 듀스 1:1 정시공', 597, 1210, 8.7, 2.89, 173000, 1, '공급사 비고: 로스율 15~20% 전후'),
  ('kg-nobless-light240', '구정마루', '원목마루', '노블레스 THE ANTIQUE 오크브러쉬라이트 240폭', '노블레스 오크브러쉬라이트 240폭', 240, 2200, 14, 2.112, 420000, 1, '단판 4mm / 운임·양중 별도'),
  ('kg-nobless-white240', '구정마루', '원목마루', '노블레스 THE ANTIQUE 화이트오크 240폭', '노블레스 화이트오크 240폭', 240, 2200, 14, 2.112, 420000, 1, '단판 4mm / 운임·양중 별도'),
  ('kg-nobless-antique-uv240', '구정마루', '원목마루', '노블레스 THE ANTIQUE 앤티크오크UV 240폭', '노블레스 앤티크오크UV 240폭', 240, 2200, 14, 2.112, 420000, 1, '단판 4mm / 운임·양중 별도'),
  ('kg-nobless-herringbone-oak', '구정마루', '헤링본', '노블레스 헤링본 오크', '노블레스 헤링본 오크', 90, 600, 10, 1.08, 260000, 1, '단판 3mm'),
  ('parts-panorama240', '파츠 NOV', '원목마루', '파츠 파노라마 240', '파노라마 240', 240, 2200, 12, 2.112, 250000, 2, '단판 1.2mm / 운임·양중 별도'),
  ('nass-orvo', '성원 NASS', '하이브리드 마루', '오르보(ORVO)마루', '오르보 (ORVO)', 240, 2200, 12, 3.168, 180000, 2, '운임·양중 별도'),
  ('dh-baum190', '동화자연마루', '바움시리즈 원목마루', '바움 190', '바움 190', 190, 1900, 12, 2.88, 300000, 2, '단판 2mm / 운임·양중 별도'),
  ('eg-green230', '이건마루', '우드형 강마루', '그린230', '그린230', 230, 2430, 10.5, 2.79, 160000, 2, '운임·양중 별도'),
  ('nova-acro-k', '노바마루', '원목마루', '노바 원목아크로 K시리즈', '원목아크로 K시리즈', 190, 1900, 15, 2.166, 350000, 2, '단판 3mm / 운임·양중 별도'),
  ('nest-mineral', '네스트', '미네랄마루', '미네랄마루', '미네랄마루', 405, 810, 8.2, 1.653, 180000, 3, '운임 별도'),
  ('lx-editone600-square', 'LX하우시스', 'SPC 바닥재', '에디톤 600각 (솔티애쉬 4종)', '에디톤 600각', 600, 600, 5, 1.44, 150000, 3, '운임·배차 별도 / 스페이서·코너비드 별도')
) AS additions (sku, brand, product_group, official_name, short_name, width_mm, length_mm, thickness_mm,
                pack_m2, supply_cost, page, source_note);

COMMIT;
