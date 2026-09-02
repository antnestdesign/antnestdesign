-- AND OS recent estimate cost items registration.
-- Adds only missing cost_items rows used by the current estimate engine.
-- Existing rows, estimates, estimate_data, history, publish logs, and contract data are not updated.

begin;

create or replace function public.register_recent_and_os_cost_items()
returns table (
  item_code text,
  item_name text,
  cost_price numeric,
  default_margin_rate numeric,
  is_active boolean
)
security definer
set search_path = public
language plpgsql
as $$
begin
  perform set_config('request.and_os_cost_rpc', 'on', true);

  insert into public.cost_items (
    category,
    subcategory,
    item_code,
    item_name,
    unit,
    cost_price,
    default_margin_rate,
    customer_name,
    order_name,
    include_in_customer_quote,
    include_in_internal_quote,
    include_in_order_sheet,
    is_material,
    is_labor,
    is_service,
    is_active,
    sort_order,
    memo,
    calculation_basis,
    calculation_multiplier,
    rounding_method,
    is_pending_new
  )
  values
    ('타일·욕실', '자재', 'BATH_PORCELAIN_TILE_MATERIAL', '욕실 포세린 타일 자재+잡자재', '칸', 700000, 0.30, '욕실 포세린 타일 자재+잡자재', '욕실 포세린 타일 자재+잡자재', true, true, true, true, false, false, true, 71, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('타일·욕실', '설비', 'BATH_PLUMBING_RELOCATION', '욕실 설비 위치조정', '칸', 450000, 0.30, '욕실 설비 위치조정', '욕실 설비 위치조정', true, true, false, false, false, true, true, 72, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('타일·욕실', '도기·수전', 'BATH_FIXTURE_SET', '욕실 도기·수전 기본세트', '칸', 1000000, 0.30, '욕실 도기·수전 기본세트', '욕실 도기·수전 기본세트', true, true, true, true, false, false, true, 73, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('타일·욕실', '도기·수전', 'BATH_FIXTURE_INSTALL', '욕실 도기·수전 설치비', '칸', 400000, 0.30, '욕실 도기·수전 설치비', '욕실 도기·수전 설치비', true, true, false, false, true, false, true, 74, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('타일·욕실', '천장', 'BATH_SMC_CEILING', 'SMC 천장돔 설치비', '칸', 280000, 0.30, 'SMC 천장돔 설치비', 'SMC 천장돔 설치비', true, true, false, false, true, false, true, 75, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('타일·욕실', '환풍기', 'BATH_FAN_NORMAL', '일반 환풍기', '칸', 50000, 0.30, '일반 환풍기', '일반 환풍기', true, true, true, true, false, false, true, 76, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('타일·욕실', '휴젠트', 'BATH_HUGENT_MACHINE', '휴젠트 본체', '칸', 300000, 0.30, '휴젠트 본체', '휴젠트 본체', true, true, true, true, false, false, true, 77, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('타일·욕실', '휴젠트', 'BATH_HUGENT_INSTALL_EXTRA', '휴젠트 추가 설치비', '칸', 70000, 0.30, '휴젠트 추가 설치비', '휴젠트 추가 설치비', true, true, false, false, true, false, true, 78, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('타일·욕실', '욕조', 'BATH_BATHTUB', '욕조', '개', 350000, 0.30, '욕조', '욕조', true, true, true, true, false, false, true, 79, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('타일·욕실', '유리', 'BATH_GLASS_BOOTH', '유리파티션+유리문', '개', 450000, 0.30, '유리파티션+유리문', '유리파티션+유리문', true, true, true, true, false, false, true, 80, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('타일·욕실', '유리', 'BATH_GLASS_PARTITION', '유리파티션', '개', 120000, 0.30, '유리파티션', '유리파티션', true, true, true, true, false, false, true, 81, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('도배', '자재', 'WALLPAPER_ROLL_BESTI', '도배지 베스띠 1롤', '롤', 45000, 0.30, '도배지 베스띠 1롤', '도배지 베스띠 1롤', true, true, true, true, false, false, true, 82, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('도배', '자재', 'WALLPAPER_ROLL_DIAMANT', '도배지 디아망 1롤', '롤', 60000, 0.30, '도배지 디아망 1롤', '도배지 디아망 1롤', true, true, true, true, false, false, true, 83, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('도배', '자재', 'WALLPAPER_ROLL_FORTIS', '도배지 디아망 포티스 1롤', '롤', 90000, 0.30, '도배지 디아망 포티스 1롤', '도배지 디아망 포티스 1롤', true, true, true, true, false, false, true, 84, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('바닥', '장판', 'FLOORING_SHEET_18T', '장판 1.8T 평단가', '평', 27000, 0.30, '장판 1.8T 평단가', '장판 1.8T 평단가', true, true, true, true, false, false, true, 85, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('바닥', '장판', 'FLOORING_SHEET_20T', '장판 2T 평단가', '평', 36000, 0.30, '장판 2T 평단가', '장판 2T 평단가', true, true, true, true, false, false, true, 86, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('바닥', '장판', 'FLOORING_SHEET_22T', '장판 2.2T 평단가', '평', 46000, 0.30, '장판 2.2T 평단가', '장판 2.2T 평단가', true, true, true, true, false, false, true, 87, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('바닥', '장판', 'FLOORING_SHEET_32T', '장판 3.2T 평단가', '평', 73000, 0.30, '장판 3.2T 평단가', '장판 3.2T 평단가', true, true, true, true, false, false, true, 88, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('바닥', '장판', 'FLOORING_SHEET_45T', '장판 4.5T 평단가', '평', 90000, 0.30, '장판 4.5T 평단가', '장판 4.5T 평단가', true, true, true, true, false, false, true, 89, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('바닥', '장판', 'FLOORING_SHEET_50T', '장판 5T 평단가', '평', 100000, 0.30, '장판 5T 평단가', '장판 5T 평단가', true, true, true, true, false, false, true, 90, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('바닥', '마루', 'FLOORING_WOOD_STANDARD', '일반마루 평단가', '평', 100000, 0.30, '일반마루 평단가', '일반마루 평단가', true, true, true, true, false, false, true, 91, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('가구', '주방설비', 'KITCHEN_SINK_BOWL', '주방 싱크볼', '개', 550000, 0.30, '주방 싱크볼', '주방 싱크볼', true, true, true, true, false, false, true, 92, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('가구', '주방설비', 'KITCHEN_FAUCET', '주방 싱크수전', '개', 380000, 0.30, '주방 싱크수전', '주방 싱크수전', true, true, true, true, false, false, true, 93, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('가구', '주방설비', 'KITCHEN_HOOD', '주방 후드', '개', 500000, 0.30, '주방 후드', '주방 후드', true, true, true, true, false, false, true, 94, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('가구', '주방설비', 'KITCHEN_STANDARD_INSTALL', '주방 AND 표준설비 설치비', '식', 300000, 0.30, '주방 AND 표준설비 설치비', '주방 AND 표준설비 설치비', true, true, false, false, true, false, true, 95, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false),
    ('마감', '기타', 'MISC_EXISTING_PIPE_CLEANING', '기존 배관 청소', '식', 300000, 0.30, '기존 배관 청소', '기존 배관 청소', true, true, false, false, false, true, true, 96, '최근 견적 산식 원가 관리 항목 등록', 'manual_input', 1, 'none', false)
  on conflict on constraint cost_items_item_code_key do nothing;

  return query
  select
    ci.item_code,
    ci.item_name,
    ci.cost_price,
    ci.default_margin_rate,
    ci.is_active
  from public.cost_items ci
  where ci.item_code in (
    'BATH_PORCELAIN_TILE_MATERIAL',
    'BATH_PLUMBING_RELOCATION',
    'BATH_FIXTURE_SET',
    'BATH_FIXTURE_INSTALL',
    'BATH_SMC_CEILING',
    'BATH_FAN_NORMAL',
    'BATH_HUGENT_MACHINE',
    'BATH_HUGENT_INSTALL_EXTRA',
    'BATH_BATHTUB',
    'BATH_GLASS_BOOTH',
    'BATH_GLASS_PARTITION',
    'WALLPAPER_ROLL_BESTI',
    'WALLPAPER_ROLL_DIAMANT',
    'WALLPAPER_ROLL_FORTIS',
    'FLOORING_SHEET_18T',
    'FLOORING_SHEET_20T',
    'FLOORING_SHEET_22T',
    'FLOORING_SHEET_32T',
    'FLOORING_SHEET_45T',
    'FLOORING_SHEET_50T',
    'FLOORING_WOOD_STANDARD',
    'KITCHEN_SINK_BOWL',
    'KITCHEN_FAUCET',
    'KITCHEN_HOOD',
    'KITCHEN_STANDARD_INSTALL',
    'MISC_EXISTING_PIPE_CLEANING'
  )
  order by ci.sort_order;
end;
$$;

select * from public.register_recent_and_os_cost_items();

drop function public.register_recent_and_os_cost_items();

commit;
