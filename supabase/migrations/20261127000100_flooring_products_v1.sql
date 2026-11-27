BEGIN;
CREATE TABLE public.os_flooring_products (
  sku text PRIMARY KEY CHECK (sku ~ '^[a-z0-9-]+$'),
  brand text NOT NULL,
  product_group text NOT NULL,
  official_name text NOT NULL,
  short_name text NOT NULL,
  width_mm numeric(7,2) NOT NULL CHECK (width_mm > 0),
  length_mm numeric(7,2) NOT NULL CHECK (length_mm > 0),
  thickness_mm numeric(5,2) NOT NULL CHECK (thickness_mm > 0),
  pack_m2 numeric(7,4) NOT NULL CHECK (pack_m2 BETWEEN 0.01 AND 100),
  billing_unit text NOT NULL CHECK (billing_unit IN ('BOX','2BOX','PYEONG')),
  supplier_pyeong_m2 numeric(7,4),
  supply_cost integer NOT NULL CHECK (supply_cost BETWEEN 1 AND 10000000),
  loss_percent numeric(5,2) NOT NULL DEFAULT 15 CHECK (loss_percent BETWEEN 0 AND 100),
  source_version text NOT NULL DEFAULT 'zinus-2026-10-23',
  source_notes text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  revision integer NOT NULL DEFAULT 1,
  UNIQUE (brand, short_name, width_mm, length_mm, thickness_mm),
  CHECK (CASE WHEN billing_unit='PYEONG' THEN supplier_pyeong_m2 IS NOT NULL AND supplier_pyeong_m2 BETWEEN 0.01 AND 100 ELSE supplier_pyeong_m2 IS NULL END)
);
ALTER TABLE public.os_flooring_products ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.os_flooring_products FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.os_flooring_products TO service_role;

CREATE FUNCTION public.and_os_update_flooring_product(
  p_actor uuid, p_sku text, p_revision integer, p_supply_cost integer, p_loss_percent numeric,
  p_pack_m2 numeric, p_billing_unit text, p_supplier_pyeong_m2 numeric, p_active boolean
) RETURNS public.os_flooring_products LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor public.profiles; prior public.os_flooring_products; updated public.os_flooring_products;
BEGIN
  SELECT * INTO actor FROM public.profiles WHERE id = p_actor FOR SHARE;
  IF NOT FOUND OR actor.role IS DISTINCT FROM 'admin' OR actor.is_active IS NOT TRUE OR actor.must_change_password IS NOT FALSE THEN
    RAISE EXCEPTION 'flooring_admin_required' USING ERRCODE='42501';
  END IF;
  SELECT * INTO prior FROM public.os_flooring_products WHERE sku = p_sku FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'flooring_unknown_sku' USING ERRCODE='P0002'; END IF;
  IF prior.revision IS DISTINCT FROM p_revision THEN RAISE EXCEPTION 'flooring_revision_conflict' USING ERRCODE='40001'; END IF;
  UPDATE public.os_flooring_products SET supply_cost=p_supply_cost, loss_percent=p_loss_percent,
    pack_m2=p_pack_m2, billing_unit=p_billing_unit, supplier_pyeong_m2=p_supplier_pyeong_m2, active=p_active, revision=revision+1
    WHERE sku=p_sku RETURNING * INTO updated;
  INSERT INTO public.os_audit_logs(id, created_at, actor_user_id, actor_name, actor_role, action, target_type,
    target_id, target_label, before_data, after_data, result)
  VALUES(gen_random_uuid(), clock_timestamp(), p_actor, actor.name, actor.role, 'FLOORING_PRODUCT_UPDATED',
    'flooring_product', p_sku, prior.official_name, to_jsonb(prior), to_jsonb(updated), 'SUCCESS');
  RETURN updated;
END $$;
REVOKE ALL ON FUNCTION public.and_os_update_flooring_product(uuid,text,integer,integer,numeric,numeric,text,numeric,boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.and_os_update_flooring_product(uuid,text,integer,integer,numeric,numeric,text,numeric,boolean)
  TO service_role;

-- PDF: Zinus flooring schedule, pages 1-3. Supplement: solid wood schedule, same effective date.
-- Ambiguous dimensions, pack areas, conversion bases and cross-source conflicts are not seeded.
-- PDF, no supplier pyeong basis: Blond order, Marvelous Muse (3 methods), Nobless 240 Light/White/UV,
-- Nobless herringbone, Panorama 240, ORVO, Baum 190, Green230, Nova Acro K, Editone 600 square and Nest mineral.
-- Missing pack: Lochca Square, D&Maison 14T 240 premium, and the imported PianTe group.
-- Conflicts: Prestige ash price, D&Maison 12T teak-brush pack, and Baum 15T BOX remark vs 3.24m2 price column.
-- Egger Callistone (2 methods): missing thickness and supplier pyeong basis.
INSERT INTO public.os_flooring_products
  (sku, brand, product_group, official_name, short_name, width_mm, length_mm, thickness_mm,
   pack_m2, billing_unit, supplier_pyeong_m2, supply_cost, source_notes)
VALUES
  ('kg-modern', '구정마루', '강마루', '모던강마루', '모던강마루', 115, 800, 6.5, 3.036, 'BOX', NULL, 105000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('kg-classic', '구정마루', '강마루', '구정마루', '구정마루', 94, 800, 7.5, 3.22, 'BOX', NULL, 110000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('kg-grand165', '구정마루', '엠보 강마루', '그랜드텍스쳐 165', '그랜드텍스쳐 165', 165, 1200, 7.5, 3.17, 'BOX', NULL, 115000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('kg-nouveau215', '구정마루', '광폭 강마루', '누보 215', '누보 215', 215, 1815, 8.7, 3.12, 'PYEONG', 3.24, 150000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('kg-marvel-rib', '구정마루', '타일형 강마루', '마블러스 리브 벽돌식 시공', '마블러스 리브 벽돌식 시공', 393, 797, 7.7, 3.13, 'BOX', NULL, 125000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('kg-zen600', '구정마루', '타일형 강마루', '마블러스젠 600각', '마블러스젠 600각', 597, 597, 8.7, 3.20, 'BOX', NULL, 150000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('kg-zen600-edge', '구정마루', '타일형 강마루', '마블러스젠 톤업엣지 600각', '마블러스젠 톤업엣지 600각', 597, 597, 8.7, 3.20, 'BOX', NULL, 160000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('kg-el900', '구정마루', '타일형 강마루', '마블러스 엘 900각', '마블러스 엘 900각', 900, 900, 8.7, 3.24, 'BOX', NULL, 210000, '양중비 별도'),
  ('kg-prestige-oak', '구정마루', '천연마루', '프레스티지 오크', '프레스티지 오크', 142, 1200, 8.7, 3.07, 'BOX', NULL, 150000, '원목마루 이미지에 오크 명시'),
  ('kg-prestige-teak', '구정마루', '천연마루', '프레스티지 티크', '프레스티지 티크', 142, 1200, 8.7, 3.07, 'BOX', NULL, 160000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('kg-prestige-walnut', '구정마루', '천연마루', '프레스티지 월넛', '프레스티지 월넛', 142, 1200, 8.7, 3.07, 'BOX', NULL, 160000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('kg-prestige-rustic', '구정마루', '천연마루', '프레스티지 러스틱월넛', '프레스티지 러스틱월넛', 142, 1200, 8.7, 3.07, 'BOX', NULL, 160000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('kg-heritage-oak', '구정마루', '원목마루', '파켓 더 헤리티지 오크', '파켓 더 헤리티지 오크', 190, 1900, 10.5, 2.166, 'PYEONG', 3.24, 240000, '원목마루 이미지 기준'),
  ('kg-heritage-ash', '구정마루', '원목마루', '파켓 더 헤리티지 애쉬', '파켓 더 헤리티지 애쉬', 190, 1900, 10.5, 2.166, 'PYEONG', 3.24, 240000, '원목마루 이미지 기준'),
  ('kg-heritage-tanned', '구정마루', '원목마루', '파켓 더 헤리티지 탄화오크', '파켓 더 헤리티지 탄화오크', 190, 1900, 10.5, 2.166, 'PYEONG', 3.24, 270000, '원목마루 이미지 기준'),
  ('kg-heritage-walnut', '구정마루', '원목마루', '파켓 더 헤리티지 월넛', '파켓 더 헤리티지 월넛', 190, 1900, 10.5, 2.166, 'PYEONG', 3.24, 270000, '원목마루 이미지 기준'),
  ('kg-heritage-dark', '구정마루', '원목마루', '파켓 더 헤리티지 다크월넛', '파켓 더 헤리티지 다크월넛', 190, 1900, 10.5, 2.166, 'PYEONG', 3.24, 270000, '원목마루 이미지 기준'),
  ('kg-heritage-teak', '구정마루', '원목마루', '파켓 더 헤리티지 티크', '파켓 더 헤리티지 티크', 190, 1900, 10.5, 2.166, 'PYEONG', 3.24, 280000, '원목마루 이미지 기준'),
  ('kg-nobless-black', '구정마루', '원목마루', '노블레스 리얼블랙오크', '노블레스 리얼블랙오크', 190, 1900, 14, 2.166, 'PYEONG', 3.24, 300000, '이미지 The Antique / 운임·양중 별도'),
  ('kg-nobless-soft', '구정마루', '원목마루', '노블레스 소프트애쉬', '노블레스 소프트애쉬', 190, 1900, 14, 2.166, 'PYEONG', 3.24, 330000, '이미지 The Antique / 운임·양중 별도'),
  ('kg-nobless-ash', '구정마루', '원목마루', '노블레스 애쉬내추럴', '노블레스 애쉬내추럴', 190, 1900, 14, 2.166, 'PYEONG', 3.24, 330000, '원목마루 이미지 및 PDF 애쉬브러쉬내추럴'),
  ('kg-nobless-190', '구정마루', '원목마루', '노블레스 오크브러쉬내추럴 190폭', '노블레스 오크브러쉬내추럴 190폭', 190, 1900, 14, 2.166, 'PYEONG', 3.24, 350000, '원목마루 이미지 기준'),
  ('kg-nobless-240', '구정마루', '원목마루', '노블레스 오크브러쉬내추럴 240폭', '노블레스 오크브러쉬내추럴 240폭', 240, 2200, 14, 2.112, 'PYEONG', 3.24, 420000, '원목마루 이미지 기준'),
  ('kg-praha-strong', '구정마루', '헤링본 강마루', '프라하강 7종', '프라하강 7종', 94, 387, 7.5, 1.600, '2BOX', NULL, 160000, '2BOX 3.2㎡'),
  ('kg-praha-brush-ash', '구정마루', '헤링본 천연마루', '프라하브러쉬 애쉬스모키·애쉬아몬드·오크클래식', '프라하브러쉬 애쉬스모키·애쉬아몬드·오크클래식', 115, 437, 7.5, 1.608, '2BOX', NULL, 180000, '2BOX 3.216㎡'),
  ('kg-praha-brush-teak', '구정마루', '헤링본 천연마루', '프라하브러쉬 티크스카치·티크러스틱', '프라하브러쉬 티크스카치·티크러스틱', 115, 437, 7.5, 1.608, '2BOX', NULL, 190000, '2BOX 3.216㎡'),
  ('hs-sb95', '한솔마루', '우드형 SB마루', 'SB마루 95', 'SB마루 95', 95, 800, 7.5, 3.192, 'BOX', NULL, 95000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('hs-sb143', '한솔마루', '우드형 SB마루', 'SB마루 143', 'SB마루 143', 143, 1205, 7.5, 3.08, 'BOX', NULL, 95000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('hs-sb165', '한솔마루', '우드형 SB마루', 'SB마루 165', 'SB마루 165', 165, 1205, 7.5, 3.18, 'BOX', NULL, 95000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('hs-sb-stone395', '한솔마루', '타일형 SB마루', 'SB스톤395', 'SB스톤395', 395, 795, 7.5, 3.14, 'BOX', NULL, 100000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('hs-sb-stone600', '한솔마루', '타일형 SB마루', 'SB스톤600 벽돌식 시공', 'SB스톤600 벽돌식 시공', 600, 1200, 7.5, 2.88, 'PYEONG', 3.24, 130000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('hs-sb-square600', '한솔마루', '타일형 SB마루', 'SB스퀘어600 정시공', 'SB스퀘어600 정시공', 600, 600, 7.5, 3.24, 'BOX', NULL, 130000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('hs-sb-square800', '한솔마루', '타일형 SB마루', 'SB스퀘어800 정시공', 'SB스퀘어800 정시공', 800, 800, 7.5, 3.2, 'BOX', NULL, 140000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('hs-sb-square-print', '한솔마루', '타일형 SB마루', 'SB스퀘어800 디지털프린팅', 'SB스퀘어800 디지털프린팅', 800, 800, 7.5, 3.2, 'BOX', NULL, 150000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('hs-skin190', '한솔마루', '촉감마루', '스킨플로어 190', '스킨플로어 190', 190, 1700, 7.5, 3.23, 'BOX', NULL, 135000, '아토피협회 인증'),
  ('hs-petstone', '한솔마루', '펫마루', '펫마루 스톤', '펫마루 스톤', 390, 790, 6, 3.081, 'BOX', NULL, 110000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('hs-petwood', '한솔마루', '펫마루', '펫마루 우드', '펫마루 우드', 143, 1205, 6, 3.102, 'BOX', NULL, 110000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('hs-ultra95', '한솔마루', '엠보강마루', '울트라강 95 합판', '울트라강 95 합판', 95, 800, 7.5, 3.04, 'BOX', NULL, 110000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('hs-ultra165', '한솔마루', '엠보강마루', '울트라강 165 합판', '울트라강 165 합판', 165, 1205, 7.5, 3.18, 'BOX', NULL, 118000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('hs-lam190', '한솔마루', '비접착식 강화마루', '190폭 강화', '190폭 강화', 190, 1200, 8, 1.6, '2BOX', NULL, 85000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('hs-lam100', '한솔마루', '비접착식 강화마루', '100폭 강화', '100폭 강화', 100, 800, 8, 1.6, '2BOX', NULL, 90000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('hs-lam390', '한솔마루', '비접착식 강화마루', '390폭 강화', '390폭 강화', 390, 1200, 8, 3.276, 'BOX', NULL, 90000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('hs-class12', '한솔마루', '교실용마루', '교실용 12T', '교실용 12T', 190, 1200, 12, 1.37, 'PYEONG', 3.24, 140000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('hs-class15', '한솔마루', '교실용마루', '교실용 15T', '교실용 15T', 190, 1200, 15, 1.14, 'PYEONG', 3.24, 150000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('ps-primus', '풍산르플로', '우드형 강마루', '프리머스2 (PRIMUS2)', '프리머스2 (PRIMUS2)', 165, 1205, 7.5, 3.18, 'BOX', NULL, 115000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('ps-signature', '풍산르플로', '우드형 강마루', '시그니처 (SIGNATURE)', '시그니처 (SIGNATURE)', 142, 1203, 7.5, 3.08, 'BOX', NULL, 118000, '동조엠보'),
  ('ps-rocky', '풍산르플로', '타일형 강마루', '로키 (MONET ROCKY)', '로키 (MONET ROCKY)', 398, 800, 7.7, 3.184, 'BOX', NULL, 120000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('ps-cube', '풍산르플로', '타일형 강마루', '큐브 (MONET CUBE) 정사각 시공', '큐브 (MONET CUBE) 정사각 시공', 597, 597, 7.7, 3.21, 'BOX', NULL, 140000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('ps-duple', '풍산르플로', '타일형 강마루', '듀플 벽돌식 시공', '듀플 벽돌식 시공', 600, 1205, 7.7, 2.892, 'PYEONG', 3.24, 145000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('parts-nov165', '파츠 NOV', '원목마루', '노브165', '노브165', 165, 1200, 11, 3.168, 'BOX', NULL, 165000, 'PDF 및 원목마루 이미지: 허니아몬드 외 7컬러, 단판 1.2mm'),
  ('nass-sgw601', '성원 NASS', '원목마루', '12T SGW12-601 오크브러쉬', '12T SGW12-601 오크브러쉬', 165, 1200, 12, 1.386, 'PYEONG', 3.24, 200000, '원목마루 이미지 / 단판 1.2mm'),
  ('nass-sgw102', '성원 NASS', '원목마루', '10T SGW10-102·103·104·108·122·123·124', '10T SGW10-102·103·104·108·122·123·124', 125, 1200, 10, 2.4, 'PYEONG', 3.24, 200000, '원목마루 이미지 / 단판 2mm'),
  ('nass-sgw631', '성원 NASS', '원목마루', '12T SGW12-631·633·634', '12T SGW12-631·633·634', 190, 1900, 12, 2.888, 'PYEONG', 3.24, 270000, '원목마루 이미지 / 단판 1.2mm'),
  ('nass-sn001', '성원 NASS', '원목마루', '12T SN001·SN003~SN009', '12T SN001·SN003~SN009', 190, 1900, 12, 2.888, 'PYEONG', 3.24, 260000, '원목마루 이미지 / 단판 2mm'),
  ('nass-lt061', '성원 NASS', '원목마루', '14T LT061~064', '14T LT061~064', 60, 1200, 14, 1.728, 'PYEONG', 3.24, 260000, '원목마루 이미지 / 오크·화이트·스모크·그레이'),
  ('nass-sgw351', '성원 NASS', '원목마루', '14T SGW14-351 외', '14T SGW14-351 외', 190, 1900, 14, 2.166, 'PYEONG', 3.24, 280000, '원목마루 이미지 / 351·355·356·357·363·364·365·367·368·369 / 단판 2mm'),
  ('nass-sgw318b', '성원 NASS', '원목마루', '14T SGW14-318B 프리미엄오크', '14T SGW14-318B 프리미엄오크', 190, 1900, 14, 2.166, 'PYEONG', 3.24, 360000, '원목마루 이미지 / 단판 3mm'),
  ('nass-sgw305', '성원 NASS', '원목마루', '14T SGW14-305 오크브러쉬 외', '14T SGW14-305 오크브러쉬 외', 190, 1900, 14, 2.166, 'PYEONG', 3.24, 320000, '원목마루 이미지 / 305·366·307·309·310·315·317·322·324 / 단판 3mm'),
  ('nass-sgw651', '성원 NASS', '원목마루', 'SGW14-651 오크브러쉬', 'SGW14-651 오크브러쉬', 240, 2200, 14, 2.112, 'PYEONG', 3.24, 300000, '원목마루 이미지 / 단판 1.2mm'),
  ('nass-sn2402', '성원 NASS', '원목마루', 'SN2402·2403·2404', 'SN2402·2403·2404', 240, 2200, 14, 2.112, 'PYEONG', 3.24, 300000, '원목마루 이미지 / 단판 2mm'),
  ('nass-sgw821', '성원 NASS', '원목마루', 'SGW14-821 오크브러쉬 외', 'SGW14-821 오크브러쉬 외', 240, 2200, 14, 2.112, 'PYEONG', 3.24, 350000, '원목마루 이미지 / 821·822·823·824·825·827·829·852·832·833·834·836·837·838·839 / 단판 3mm'),
  ('nass-sgw868', '성원 NASS', '원목마루', '14T SGW14-868 고재월넛', '14T SGW14-868 고재월넛', 240, 2200, 14, 2.112, 'PYEONG', 3.24, 400000, '원목마루 이미지 / 단판 2mm'),
  ('nass-sgw881', '성원 NASS', '원목마루', '16T SGW16-881 외', '16T SGW16-881 외', 300, 2200, 16, 2.64, 'PYEONG', 3.24, 450000, '원목마루 이미지 / 881·882·883·885·886·888·889 JB CAPUCHINO / 단판 4mm'),
  ('nass-jumbo', '성원 NASS', '원목마루', '19T JUMBO', '19T JUMBO', 400, 3200, 19, 2.56, 'PYEONG', 3.24, 580000, '원목마루 이미지 / 단판 5mm'),
  ('dm-texture', '디앤메종', '강(합판)마루', '텍스처강 비 3.0', '텍스처강 비 3.0', 125, 1203, 7.5, 3.0, 'BOX', NULL, 120000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dm-wide', '디앤메종', '강(합판)마루', '와이드빅165', '와이드빅165', 165, 1203, 7.5, 3.175, 'BOX', NULL, 125000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dm-majesty', '디앤메종', '초광폭강', '마제스티 아트·내추럴', '마제스티 아트·내추럴', 230, 2000, 7.5, 3.2, 'BOX', NULL, 150000, '운임·양중 별도'),
  ('dm-herring', '디앤메종', '헤링본강', '그레이스 텍스처', '그레이스 텍스처', 115, 595, 7.5, 3.01, 'BOX', NULL, 150000, '주문 생산'),
  ('dm-coton395', '디앤메종', '타일형 HDF', '코튼395 HDF', '코튼395 HDF', 395, 800, 7.5, 3.16, 'BOX', NULL, 100000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dm-coton597', '디앤메종', '타일형 HDF', '코튼597 HDF', '코튼597 HDF', 597, 597, 7.5, 3.20, 'BOX', NULL, 130000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dm-ten-oak', '디앤메종', '원목마루', '텐우드 오크 외 수종', '텐우드 오크 외 수종', 165, 1200, 10, 3.168, 'BOX', NULL, 150000, 'PDF 오크·애쉬 포함 8종 / 이미지 오크 외 수종 / 단판 0.6mm'),
  ('dm-ten-ash', '디앤메종', '원목마루', '텐우드 애쉬', '텐우드 애쉬', 165, 1200, 10, 3.168, 'BOX', NULL, 150000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dm-ten-teak', '디앤메종', '원목마루', '텐우드 티크', '텐우드 티크', 165, 1200, 10, 3.168, 'BOX', NULL, 160000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dm-ten-walnut', '디앤메종', '원목마루', '텐우드 월넛', '텐우드 월넛', 165, 1200, 10, 3.168, 'BOX', NULL, 160000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dm-wood12-abcd', '디앤메종', '12T 원목마루', '12T 오크 ABCD 프리미엄', '12T 오크 ABCD 프리미엄', 190, 1900, 12, 2.527, 'PYEONG', 3.24, 250000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dm-wood12-ab', '디앤메종', '12T 원목마루', '12T 오크 AB 프리미엄', '12T 오크 AB 프리미엄', 190, 1900, 12, 2.527, 'PYEONG', 3.24, 320000, 'PDF 프리미엄 제품 (이미지 오크브러쉬 AB와 구분)'),
  ('dm-wood12-old', '디앤메종', '12T 원목마루', '12T 올드아렌·올드엘라·올드루이스', '12T 올드아렌·올드엘라·올드루이스', 190, 1900, 12, 2.527, 'PYEONG', 3.24, 260000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dm-wood14-abcd', '디앤메종', '14T 원목마루', '14T 오크브러쉬 ABCD', '14T 오크브러쉬 ABCD', 190, 1900, 14, 2.888, 'PYEONG', 3.24, 300000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dm-wood14-ab', '디앤메종', '14T 원목마루', '14T 오크브러쉬 AB 프리미엄', '14T 오크브러쉬 AB 프리미엄', 190, 1900, 14, 2.888, 'PYEONG', 3.24, 350000, 'PDF 프리미엄 제품 (이미지 오크브러쉬 AB와 구분)'),
  ('dm-wood14-select', '디앤메종', '14T 원목마루', '14T 카리브·벨포트·스모그드퍼셀', '14T 카리브·벨포트·스모그드퍼셀', 190, 1900, 14, 2.888, 'PYEONG', 3.24, 330000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dm-img-oak08', '디앤메종', '원목마루', '08T 오크', '08T 오크', 125, 900, 8, 2.25, 'PYEONG', 3.24, 150000, '원목마루 이미지 / 단판 1.2mm'),
  ('dm-img-oak10', '디앤메종', '원목마루', '10T 오크 착색', '10T 오크 착색', 125, 910, 10, 2.25, 'PYEONG', 3.24, 200000, '원목마루 이미지'),
  ('dm-img-teak10', '디앤메종', '원목마루', '10T 티크브러쉬', '10T 티크브러쉬', 122, 910, 10, 2.22, 'PYEONG', 3.24, 210000, '원목마루 이미지'),
  ('dm-img-herring-oak', '디앤메종', '원목마루', '10T 헤링본 오크브러쉬', '10T 헤링본 오크브러쉬', 90, 600, 10, 1.62, 'PYEONG', 3.24, 220000, '원목마루 이미지'),
  ('dm-img-herring-teak', '디앤메종', '원목마루', '10T 헤링본 티크브러쉬', '10T 헤링본 티크브러쉬', 90, 600, 10, 1.62, 'PYEONG', 3.24, 240000, '원목마루 이미지'),
  ('dm-img-abcd12', '디앤메종', '원목마루', '12T 오크브러쉬 ABCD', '12T 오크브러쉬 ABCD', 190, 1900, 12, 2.527, 'PYEONG', 3.24, 240000, '원목마루 이미지'),
  ('dm-img-ab12-thin', '디앤메종', '원목마루', '12T 오크브러쉬 AB 단판 1.2mm', '12T 오크브러쉬 AB 단판 1.2mm', 190, 1900, 12, 2.527, 'PYEONG', 3.24, 250000, '원목마루 이미지'),
  ('dm-img-abc12', '디앤메종', '원목마루', '12T 오크브러쉬 ABC', '12T 오크브러쉬 ABC', 190, 1900, 12, 2.527, 'PYEONG', 3.24, 250000, '원목마루 이미지'),
  ('dm-img-ab12', '디앤메종', '원목마루', '12T 오크브러쉬 AB', '12T 오크브러쉬 AB', 190, 1900, 12, 2.527, 'PYEONG', 3.24, 280000, '원목마루 이미지'),
  ('dm-img-collection12', '디앤메종', '원목마루', '12T 실속·골든블래스 등 원목 컬렉션', '12T 실속 원목 컬렉션', 190, 1900, 12, 2.527, 'PYEONG', 3.24, 260000, '원목마루 이미지 / 실속, 골든블래스, 솔트, 스모키화이트, 플로렌, 오크블랙, 올드엘란, 올드페이스, 아리아, 몬트로즈, 보스코, 애쉬화이트, 에보니'),
  ('dm-img-ab14', '디앤메종', '원목마루', '14T 오크브러쉬 AB', '14T 오크브러쉬 AB', 190, 1900, 14, 2.527, 'PYEONG', 3.24, 300000, '원목마루 이미지'),
  ('dm-img-abcd14-mix', '디앤메종', '원목마루', '14T 오크브러쉬 ABCD 2+1', '14T 오크브러쉬 ABCD 2+1', 190, 1900, 14, 2.527, 'PYEONG', 3.24, 330000, '원목마루 이미지'),
  ('dm-img-carib14', '디앤메종', '원목마루', '14T 카리브·원저·몬트로즈', '14T 카리브·원저·몬트로즈', 190, 1900, 14, 2.166, 'PYEONG', 3.24, 330000, '원목마루 이미지'),
  ('dm-img-oak240', '디앤메종', '원목마루', '14T 오크브러쉬 240폭', '14T 오크브러쉬 240폭', 240, 2200, 14, 2.112, 'PYEONG', 3.24, 300000, '원목마루 이미지 / 단판 1.2mm'),
  ('dh-forte', '동화자연마루', '나투스강', '강 포레', '강 포레', 95, 800, 6, 3.192, 'BOX', NULL, 100000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-origin', '동화자연마루', '나투스강', '강 오리진', '강 오리진', 98, 800, 7.5, 3.192, 'BOX', NULL, 110000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-herring', '동화자연마루', '나투스강', '강 헤링본', '강 헤링본', 95, 475, 7.5, 1.625, '2BOX', NULL, 160000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-texture', '동화자연마루', '나투스강', '강 텍스처', '강 텍스처', 143, 1205, 7.5, 3.102, 'BOX', NULL, 120000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-square', '동화자연마루', '나투스강', '강 스퀘어 정각', '강 스퀘어 정각', 597, 597, 9.5, 2.83, 'PYEONG', 3.24, 150000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-square-rect', '동화자연마루', '나투스강', '강 스퀘어 직각', '강 스퀘어 직각', 597, 1205, 9.5, 2.87, 'PYEONG', 3.24, 150000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-jin-origin', '동화자연마루', '나투스진', '진 오리진', '진 오리진', 98, 805, 7, 3.116, 'BOX', NULL, 90000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-jin-grande', '동화자연마루', '나투스진', '진 그란데', '진 그란데', 325, 805, 7, 3.14, 'BOX', NULL, 100000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-jin-herring', '동화자연마루', '나투스진', '진 헤링본', '진 헤링본', 95, 475, 7, 1.624, '2BOX', NULL, 140000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-jin-terra161', '동화자연마루', '나투스진', '진 테라 161', '진 테라 161', 161, 1205, 7.5, 3.102, 'BOX', NULL, 110000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-jin-terra143', '동화자연마루', '나투스진', '진 테라 143', '진 테라 143', 143, 1205, 7.5, 3.102, 'BOX', NULL, 110000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-jin-texture', '동화자연마루', '나투스진', '진 텍스처', '진 텍스처', 192, 1200, 7.5, 3.23, 'BOX', NULL, 120000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-jin-square', '동화자연마루', '나투스진', '진 그란데스퀘어 정각', '진 그란데스퀘어 정각', 675, 675, 7.5, 3.19, 'PYEONG', 3.24, 135000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-jin-square-rect', '동화자연마루', '나투스진', '진 그란데스퀘어 직각', '진 그란데스퀘어 직각', 675, 1205, 7.5, 3.27, 'PYEONG', 3.24, 135000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-jin-square805', '동화자연마루', '나투스진', '진 그란데스퀘어 805각', '진 그란데스퀘어 805각', 805, 805, 7.5, 3.24, 'PYEONG', 3.24, 150000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-jin-terra-max', '동화자연마루', '나투스진', '진 테라 맥스', '진 테라 맥스', 195, 2040, 7.5, 1.591, '2BOX', NULL, 140000, '2BOX 3.18㎡ / 운임·양중 별도'),
  ('dh-duo-origin', '동화자연마루', '나투스듀오', '듀오 오리진', '듀오 오리진', 115, 800, 7.5, 3.036, 'BOX', NULL, 120000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-duo-texture', '동화자연마루', '나투스듀오', '듀오 텍스처', '듀오 텍스처', 163, 1200, 10.5, 1.565, '2BOX', NULL, 130000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-duo-texture-max', '동화자연마루', '나투스듀오', '듀오 텍스처 맥스', '듀오 텍스처 맥스', 232, 2400, 10.5, 2.79, 'BOX', NULL, 160000, '운임·양중 별도'),
  ('dh-duo-square', '동화자연마루', '나투스듀오', '듀오 스퀘어 정각', '듀오 스퀘어 정각', 595, 595, 10.5, 3.21, 'BOX', NULL, 140000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-duo-square-rect', '동화자연마루', '나투스듀오', '듀오 스퀘어 직각', '듀오 스퀘어 직각', 595, 1205, 10.5, 2.87, 'BOX', NULL, 140000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('dh-baum165', '동화자연마루', '바움시리즈 원목마루', '바움 165', '바움 165', 165, 1200, 9, 1.584, '2BOX', NULL, 190000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('eg-green-s', '이건마루', '우드형 강마루', '그린S', '그린S', 165, 1200, 7.5, 3.168, 'BOX', NULL, 125000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('eg-green165', '이건마루', '우드형 강마루', '그린165', '그린165', 165, 1200, 10.5, 1.584, '2BOX', NULL, 130000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('eg-green190', '이건마루', '우드형 강마루', '그린190', '그린190', 190, 1615, 10.5, 1.53, '2BOX', NULL, 150000, '운임·양중 별도'),
  ('eg-green395', '이건마루', '타일형 강마루', '그린395', '그린395', 395, 800, 10.5, 1.58, '2BOX', NULL, 130000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('eg-green597', '이건마루', '타일형 강마루', '그린597 칼리스톤', '그린597 칼리스톤', 597, 597, 10.5, 3.2, 'BOX', NULL, 145000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('eg-foresta', '이건마루', '천연마루', '포레스타 165폭', '포레스타 165폭', 165, 1200, 10.5, 1.584, '2BOX', NULL, 180000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('eg-forest-g', '이건마루', '천연마루', '포레스타G 190폭', '포레스타G 190폭', 190, 1900, 11, 2.166, 'BOX', NULL, 200000, '운임·양중 별도'),
  ('eg-foresta155-image', '이건마루', '원목마루', '포레스타 155폭 오크·월넛', '포레스타 155폭 오크·월넛', 155, 1200, 14.5, 1.302, 'PYEONG', 3.24, 260000, '원목마루 이미지 / 3.24㎡ 단가 열, PDF 포레스타 165폭과 다른 규격'),
  ('nova-noble', '노바마루', '우드형 강마루', '노블', '노블', 95, 800, 6.5, 3.192, 'BOX', NULL, 100000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('nova-newtro', '노바마루', '우드형 강마루', '뉴트로', '뉴트로', 115, 800, 7.5, 3.04, 'BOX', NULL, 110000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('nova-black', '노바마루', '우드형 강마루', '블랙라벨', '블랙라벨', 165, 1200, 7.5, 3.17, 'BOX', NULL, 120000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('nova-terrace', '노바마루', '타일형 강마루', '테라스', '테라스', 395, 790, 7.5, 3.12, 'BOX', NULL, 120000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('nova-terrace-square', '노바마루', '타일형 강마루', '테라스 스퀘어 10종', '테라스 스퀘어 10종', 597, 597, 8, 3.207, 'BOX', NULL, 140000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('nova-stb', '노바마루', '천연마루', 'STB', 'STB', 150, 1200, 9, 3.24, 'BOX', NULL, 180000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('nova-acro-image', '노바마루', '원목마루', '아크로 원목 450×900', '아크로 원목 450×900', 450, 900, 5, 1.62, '2BOX', NULL, 135000, '원목마루 이미지 / 비고 2BOX'),
  ('nova-stb-image', '노바마루', '원목마루', 'STB 원목 600각', 'STB 원목 600각', 600, 600, 5, 1.44, '2BOX', NULL, 150000, '원목마루 이미지 / 비고 2BOX'),
  ('olg-loca', '올고다', '타일형 HDF마루', '로카', '로카', 395, 790, 7, 1.56, '2BOX', NULL, 120000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('olg-loca-premium', '올고다', '타일형 HDF마루', '로카 프리미엄', '로카 프리미엄', 600, 1200, 7, 2.88, 'PYEONG', 3.24, 135000, 'PDF: 지너스 2026-10-23 VAT 별도'),
  ('lx-editone', 'LX하우시스', 'SPC 바닥재', '에디톤', '에디톤', 450, 900, 5, 1.62, '2BOX', NULL, 135000, '운임·부자재 별도');
COMMIT;
