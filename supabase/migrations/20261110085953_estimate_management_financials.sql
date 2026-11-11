BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';

-- Keep every existing confirmation check; only one explicit, matching discount may be negative.
CREATE OR REPLACE FUNCTION public.and_os_preliminary_issues(p_row jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE issues jsonb:='[]';d jsonb:=p_row->'estimate_data';g jsonb;item jsonb;subtotal numeric;grand numeric:=0;
  count_items integer:=0;sale numeric;discount numeric;management numeric;discount_count integer:=0;
BEGIN
  IF coalesce(trim(p_row->>'project_name'),'')='' THEN issues:=issues||'"현장명을 입력하고 저장해 주세요."'::jsonb;END IF;
  IF coalesce(trim(p_row->>'client_name'),'')='' THEN issues:=issues||'"고객명을 입력하고 저장해 주세요."'::jsonb;END IF;
  IF coalesce((p_row->>'area_pyeong')::numeric,0)<=0 THEN issues:=issues||'"평형을 확인하고 저장해 주세요."'::jsonb;END IF;
  sale:=(p_row->>'total_price')::numeric;
  IF sale IS NULL OR sale<=0 OR sale>1000000000000 OR sale<>trunc(sale) THEN issues:=issues||'"저장 견적금액을 확인해 주세요."'::jsonb;END IF;
  discount:=coalesce((d#>>'{inputs,managementDiscount}')::numeric,0);
  management:=coalesce((d#>>'{inputs,managementCost}')::numeric,0);
  IF discount<0 OR discount>1000000000 OR discount<>trunc(discount) OR mod(discount,1000)<>0
    OR management<0 OR management>1000000000 OR management<>trunc(management) THEN
    RETURN issues||'"관리비용과 할인금액 형식을 확인해 주세요."'::jsonb;
  END IF;
  IF p_row->'cost_total' IS NOT NULL AND p_row->'cost_total'<>'null'::jsonb THEN
    IF jsonb_typeof(p_row->'cost_total')<>'number' OR (p_row->>'cost_total')::numeric<0 THEN
      issues:=issues||'"저장된 산정 금액 형식을 확인해 주세요."'::jsonb;
    END IF;
  END IF;
  IF d ? 'costTotal' AND d->'costTotal' IS DISTINCT FROM p_row->'cost_total' THEN
    issues:=issues||'"저장된 산정 금액과 견적 스냅샷이 일치하지 않습니다."'::jsonb;
  END IF;
  IF jsonb_typeof(d#>'{customerQuote,groups}') IS DISTINCT FROM 'array' THEN RETURN issues||'"저장된 고객 견적 내역이 없습니다."'::jsonb;END IF;
  FOR g IN SELECT value FROM jsonb_array_elements(d#>'{customerQuote,groups}') LOOP
    IF jsonb_typeof(g->'items') IS DISTINCT FROM 'array' THEN RETURN issues||'"공정별 공사 내역을 확인해 주세요."'::jsonb;END IF;
    subtotal:=0;
    FOR item IN SELECT value FROM jsonb_array_elements(g->'items') LOOP
      IF coalesce(trim(item->>'name'),'')='' OR jsonb_typeof(item->'amount') IS DISTINCT FROM 'number'
        OR (item->>'amount')::numeric<>trunc((item->>'amount')::numeric) THEN
        RETURN issues||'"품목명 또는 판매금액이 미설정된 공사 항목을 확인해 주세요."'::jsonb;
      END IF;
      IF item->'managementDiscount'='true'::jsonb THEN
        discount_count:=discount_count+1;
        IF discount<=0 OR discount_count>1 OR item->>'name'<>'할인금액' OR (item->>'amount')::numeric<>-discount THEN
          RETURN issues||'"할인 항목과 저장된 할인금액이 일치하지 않습니다."'::jsonb;
        END IF;
      ELSIF (item->>'amount')::numeric<0 THEN
        RETURN issues||'"일반 공사 항목의 판매금액은 음수일 수 없습니다."'::jsonb;
      ELSE count_items:=count_items+1;
      END IF;
      subtotal:=subtotal+(item->>'amount')::numeric;
    END LOOP;
    IF jsonb_typeof(g->'total') IS DISTINCT FROM 'number' OR (g->>'total')::numeric<>subtotal THEN
      RETURN issues||'"공정 소계와 품목 판매금액이 일치하지 않습니다."'::jsonb;
    END IF;
    grand:=grand+subtotal;
  END LOOP;
  IF discount_count<>(CASE WHEN discount>0 THEN 1 ELSE 0 END) THEN issues:=issues||'"저장된 할인 항목을 확인해 주세요."'::jsonb;END IF;
  IF count_items=0 THEN issues:=issues||'"최소 한 개의 공사 항목을 저장해 주세요."'::jsonb;END IF;
  IF grand IS DISTINCT FROM sale OR (d->>'total')::numeric IS DISTINCT FROM sale OR (d#>>'{customerQuote,total}')::numeric IS DISTINCT FROM sale THEN
    issues:=issues||'"저장 총액과 고객 견적 내역의 합계가 일치하지 않습니다."'::jsonb;
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(coalesce(d#>'{itemBuilder,publicRows}','[]')) LOOP
    IF jsonb_typeof(item->'saleUnitPrice') IS DISTINCT FROM 'number' OR (item->>'saleUnitPrice')::numeric<0
      OR jsonb_typeof(item->'quantity') IS DISTINCT FROM 'number' OR (item->>'quantity')::numeric<0 THEN
      issues:=issues||'"추가 공사의 판매단가와 수량을 확인해 주세요."'::jsonb;EXIT;
    END IF;
  END LOOP;
  IF coalesce(d->'pendingPriceRequests','[]'::jsonb)<>'[]'::jsonb OR coalesce(d->'unresolvedWorks','[]'::jsonb)<>'[]'::jsonb THEN
    issues:=issues||'"처리되지 않은 공사 확인 또는 가격 변경 요청을 먼저 해결해 주세요."'::jsonb;
  END IF;
  RETURN issues;
EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
  RETURN '["저장된 수량·단가·금액 형식을 확인해 주세요."]'::jsonb;
END $$;
COMMIT;
