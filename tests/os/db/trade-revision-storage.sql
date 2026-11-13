BEGIN;
DO $$
DECLARE actor uuid; saved jsonb; original jsonb; row_id uuid; reloaded public.estimates;
BEGIN
  SELECT id INTO STRICT actor FROM public.profiles WHERE role='admin' AND is_active AND NOT must_change_password LIMIT 1;
  SELECT to_jsonb(e) INTO STRICT original FROM public.estimates e LIMIT 1;
  saved:=public.and_os_save_estimate(actor,NULL,NULL,jsonb_build_object(
    'project_name','Synthetic six trade storage','client_name','Synthetic','area_pyeong',34,'status','견적',
    'total_price',2340000,'cost_total',1800000,'margin_rate',30,'estimate_data',jsonb_build_object(
      'inputs',jsonb_build_object('tradeFormulaVersion','v2','wallpaperRoomPyeong','15','carryFloor','2','carryNoElevator',true,'carrySelected',true),
      'customerQuote',jsonb_build_object('total',2340000,'groups','[]'::jsonb))));
  row_id:=(saved->>'id')::uuid;
  SELECT * INTO STRICT reloaded FROM public.estimates WHERE id=row_id;
  ASSERT reloaded.estimate_data#>>'{inputs,tradeFormulaVersion}'='v2';
  ASSERT reloaded.estimate_data#>>'{inputs,wallpaperRoomPyeong}'='15';
  ASSERT reloaded.estimate_data#>'{inputs,carrySelected}'='true'::jsonb;
  ASSERT reloaded.total_price=2340000;
  ASSERT (SELECT to_jsonb(e)=original FROM public.estimates e WHERE e.id=(original->>'id')::uuid);
END $$;
ROLLBACK;
