import { TRADE_REVISION_INPUTS } from "./trade-revision-inputs.js";

const groups={
  Demolition:[
    ["철거 방식",[["demolitionMode","범위",{full:"전체철거",partial:"부분철거"}]]],
    ["부분철거",[["demoKitchenMm","주방 가구 길이 (mm)"],["demoCounterMm","싱크대 상판 길이 (mm)"],["demoCabinetJa","일반 가구장 (자)"],["demoEntryUnits","중문 및 중문틀 (개소)"],["demoDoorUnits","방문만 (개)"],["demoDoorSetUnits","방문 및 문틀 (조)"],["demoLights","조명철거"],["demoPartitionMm","가벽 길이 (mm)"]]],
    ["화장실 철거",[["demoBathFull","전체철거 (개소)"],["demoBathFixtures","집기만 철거 (개소)"],["demoBathTub","전체철거 중 욕조 (개소)"],["demoBathOverlay","전체철거 중 덧방 타일 (개소)"]]],
  ],
  Electrical:[
    ["전기공사 방식",[["electricalMode","범위",{full:"전체 전기공사",partial:"부분 전기공사"}]]],
    ["부분 전기공사",[["electricBasic","기본형 인건비"],["electricArea","기본형 평형"],["electricRecessed","매입등 추가 시공 (개소, 기구 별도)"],["electricSwitch","스위치 추가 시공 (개소, 이설 제외)"]]],
    ["기구비",[["electricFixtureEnabled","기구비 직접 입력"],["electricLightCost","조명기구 원가 (원)"],["electricSwitchCost","스위치 기구 원가 (원)"],["electricOutletCost","콘센트 기구 원가 (원)"]]],
  ],
  Wallpaper:[["도배 면적",[["wallpaperRoomPyeong","별도 벽지 시공 방 면적 합계 (평)"]]]],
  Film:[["필름 노무",[["filmWindow","창호 포함"],["filmWindowArea","창호 평형",{"50":"50평 이상"}],["filmDoorCount","방문 (개)"],["filmOneSideMm","가구 한 면 (mm)"],["filmBothSidesMm","가구 양면 (mm)"],["filmWallMm","벽체 (mm)"]]]],
  Furniture:[
    ["문짝 교체·몰딩",[["furnitureTallDoors","키큰장 문짝 (개)"],["furnitureSinkSmallDoors","싱크대 문짝 400mm 이하 (개)"],["furnitureSinkMediumDoors","싱크대 문짝 400mm 초과~600mm 이하 (개)"],["furnitureMoldingMm","몰딩 길이 (mm)"]]],
    ["화장대",[["vanityMm","하부장 길이 (mm)"],["vanityDrawers","서랍 (개)"],["vanityTop","상판",{none:"없음",himacs:"인조대리석",khanstone:"칸스톤",ceramic:"세라믹"}],["vanityDepthMm","상판 깊이 (mm)"]]],
    ["상판 규격·운반",[["baseCounterWidthMm","주방 상판 가로 (mm)"],["baseCounterDepthMm","주방 상판 세로 (mm)"],["homebarCounterWidthMm","홈바 상판 가로 (mm)"],["homebarCounterDepthMm","홈바 상판 세로 (mm)"],["countertopTransport","상판 운반비 (현장 1회)"],["countertopLadder","사다리차 (E/V 적재 불가)"]]],
  ],
  Finish:[["소운반비",[["carryFloor","건물 층수"],["carryNoElevator","E/V 없음"],["carrySelected","소운반비 적용"]]]],
};

export function mountTradeRevisionInputs(document){
  const version=document.createElement("input");
  version.id="tradeFormulaVersion";version.type="hidden";version.value="v2";
  document.getElementById("areaPyeong")?.after(version);
  const panels=[];
  let vanityFields,vanityToggle,vanityValue,wallpaperRow;
  for(const [trade,sections] of Object.entries(groups)){
    const heading=document.getElementById(`section${trade}Enabled`)?.closest(".section-heading");
    if(!heading)continue;
    const old=heading.nextElementSibling;
    const pane=document.createElement("div");pane.className="furniture-block trade-revision-inputs";
    for(const [name,fields] of sections){
      const fieldset=document.createElement("fieldset");fieldset.className="control-grid compact-row-grid";
      const legend=document.createElement("legend");legend.textContent=name;fieldset.append(legend);
      for(const [id,label,labels] of fields){
        const schema=TRADE_REVISION_INPUTS[id],host=document.createElement("label");
        if(schema.type==="checkbox")host.className="inline-check";
        const input=document.createElement(schema.choices?"select":"input");input.id=id;
        if(schema.choices)for(const value of schema.choices){const option=document.createElement("option");option.value=value;option.textContent=labels?.[value]||(id.endsWith("Area")?`${value}평`:value);input.append(option);}
        else {input.type=schema.type;if(schema.type==="number"){input.min="0";input.max=String(schema.max);input.step=id==="wallpaperRoomPyeong"?"0.1":"1";}}
        if(schema.type!=="checkbox")input.value=schema.value;
        if(schema.type==="checkbox"){const caption=document.createElement("span");caption.textContent=label;host.append(input,caption);}
        else host.append(label,input);
        fieldset.append(host);
      }
      if(name==="화장대"){
        const block=document.createElement("div");block.className="furniture-block trade-revision-inputs";
        const label=document.createElement("label");label.className="check-title";
        vanityToggle=document.createElement("input");vanityToggle.type="checkbox";vanityToggle.id="vanityToggle";
        const caption=document.createElement("span");caption.textContent=name;
        vanityValue=document.createElement("input");vanityValue.id="vanityEnabled";vanityValue.type="hidden";vanityValue.value="auto";
        label.append(vanityToggle,caption);fieldset.querySelector("legend").remove();
        block.append(label,fieldset,vanityValue);document.getElementById("builtInEnabled").closest(".furniture-block").after(block);
        vanityFields=fieldset;
        vanityToggle.addEventListener("change",()=>{
          vanityValue.value=vanityToggle.checked?"on":"off";
          vanityValue.dispatchEvent(new document.defaultView.Event("change",{bubbles:true}));
        });
        continue;
      }
      if(trade==="Wallpaper"){wallpaperRow=fieldset.querySelector("label");continue;}
      if(trade==="Film"){
        const pair=document.createElement("div");pair.className="trade-toggle-pair";
        pair.append(...[...fieldset.querySelectorAll("label")].slice(0,2));fieldset.querySelector("legend").after(pair);
      }
      pane.append(fieldset);
    }
    if(pane.childElementCount)heading.after(pane);
    panels.push({trade,pane,old});
  }
  const get=id=>document.getElementById(id);
  const hide=(id,value,selector="label")=>{const node=get(id)?.closest(selector);if(node)node.hidden=value;};
  const preset=get("wallpaperPreset").closest("label"),publicGrade=get("wallpaperPublicMaterialGrade").closest("label"),roomGrade=get("wallpaperRoomMaterialGrade").closest("label");
  const gradePosition=document.createComment("room grade position");roomGrade.before(gradePosition);
  const wallpaperGrid=document.createElement("div");wallpaperGrid.className="trade-wallpaper-grid";
  preset.before(wallpaperGrid);
  const presetPosition=document.createComment("preset position"),publicPosition=document.createComment("public grade position");
  preset.before(presetPosition);publicGrade.before(publicPosition);
  wallpaperGrid.append(wallpaperRow);
  return (canEditCosts=false)=>{
    const revised=version.value==="v2";
    for(const {trade,pane,old} of panels){
      pane.hidden=!revised;
      if(trade==="Electrical"&&old)old.hidden=revised&&get("electricalMode").value==="partial";
      if(trade==="Demolition")pane.children[1].hidden=get("demolitionMode").value!=="partial";
      if(trade==="Electrical")pane.children[1].hidden=get("electricalMode").value!=="partial";
      if(trade==="Electrical")pane.children[2].hidden=!canEditCosts||get("electricalMode").value!=="partial";
    }
    if(revised&&!wallpaperGrid.contains(preset))wallpaperGrid.append(preset,publicGrade,wallpaperRow,roomGrade);
    if(!revised&&wallpaperGrid.contains(preset)){presetPosition.after(preset);publicPosition.after(publicGrade);gradePosition.after(roomGrade);}
    wallpaperGrid.hidden=!revised;
    for(const id of ["electricLightCost","electricSwitchCost","electricOutletCost"])hide(id,!canEditCosts||!get("electricFixtureEnabled").checked);
    hide("demolitionBasicEnabled",revised&&get("demolitionMode").value==="partial",".demo-unit");
    for(const id of ["demolitionFurnitureEnabled","demolitionBathroomEnabled"])hide(id,revised,".demo-unit");
    for(const id of ["wallpaperPublicWallLengthM","wallpaperRoomWallLengthM","filmPreset"])hide(id,revised);
    hide("wallpaperRoomMaterialGrade",false);
    get("wallpaperRoomMaterialGrade").disabled=get("wallpaperRoomPyeong").disabled||(revised&&Number(get("wallpaperRoomPyeong").value)===0);
    for(const id of ["demoBathTub","demoBathOverlay"])hide(id,Number(get("demoBathFull").value)===0);
    hide("electricArea",!get("electricBasic").checked);
    get("filmWindowArea").disabled=get("filmWindow").disabled||!get("filmWindow").checked;
    const areaTop=id=>["himacs","ceramic","khanstone"].includes(get(id).value);
    for(const id of ["baseCounterWidthMm","baseCounterDepthMm"])hide(id,!(get("baseEnabled").checked&&get("baseCountertopEnabled").checked&&areaTop("baseCountertop")));
    for(const id of ["homebarCounterWidthMm","homebarCounterDepthMm"])hide(id,!(get("homebarEnabled").checked&&areaTop("homebarCountertop")));
    const vanity=vanityValue.value==="on"||(vanityValue.value==="auto"&&Number(get("vanityMm").value)>0);
    vanityToggle.checked=vanity;
    vanityFields.closest(".furniture-block").hidden=!revised;
    vanityFields.hidden=!vanity;
    for(const field of vanityFields.querySelectorAll("input,select"))field.disabled=!vanity||vanityToggle.disabled;
    hide("vanityDepthMm",Number(get("vanityMm").value)<=0||!areaTop("vanityTop"));
    hide("countertopTransport",![
      get("baseEnabled").checked&&get("baseCountertopEnabled").checked&&["himacs","ceramic","khanstone"].includes(get("baseCountertop").value)&&Number(get("baseCounterWidthMm").value)>2000,
      get("islandEnabled").checked&&["himacs","ceramic","khanstone"].includes(get("islandCountertop").value)&&Number(get("islandM").value)>2000,
      get("homebarEnabled").checked&&["himacs","ceramic","khanstone"].includes(get("homebarCountertop").value)&&Number(get("homebarCounterWidthMm").value)>2000,
      vanity&&get("vanityTop").value!=="none"&&Number(get("vanityMm").value)>2000,
    ].some(Boolean));
    hide("carrySelected",!get("carryNoElevator").checked||Number(get("carryFloor").value)<2);
    const room=get("wallpaperRoomPyeong");
    room.max=String(Number(get("areaPyeong").value)||0);
    room.setCustomValidity(Number(room.value)>Number(room.max)?"방 면적은 전체 평수 이하여야 합니다.":"");
  };
}
