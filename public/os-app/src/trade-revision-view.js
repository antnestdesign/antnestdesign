import { COUNTERTOP_DEFAULT_DEPTH_MM, TRADE_REVISION_INPUTS, furnitureDoorsSelected } from "./trade-revision-inputs.js";

const groups={
  Demolition:[
    ["철거 방식",[["demolitionMode","범위",{full:"전체철거",partial:"부분철거"}]]],
    ["부분철거",[["demoKitchenMm","주방 가구 길이 (mm)"],["demoCounterMm","싱크대 상판 길이 (mm)"],["demoCabinetJa","일반 가구장 (자)"],["demoEntryUnits","중문 및 중문틀 (개소)"],["demoDoorUnits","방문만 (개)"],["demoDoorSetUnits","방문 및 문틀 (조)"],["demoLights","조명철거"]]],
    ["화장실 철거",[["demoBathFull","전체철거 (개소)"],["demoBathFixtures","집기만 철거 (개소)"],["demoBathTub","전체철거 중 욕조 (개소)"],["demoBathOverlay","전체철거 중 덧방 타일 (개소)"]]],
    ["확장 공사",[["expansionLiving","거실 확장"],["expansionRooms","각방 확장 (개소)"],["expansionKitchen","주방 확장 (개소)"],["expansionPartitionMm","가벽철거 길이 (mm)"]]],
  ],
  Electrical:[
    ["전기공사 방식",[["electricalMode","범위",{full:"전체 전기공사",partial:"부분 전기공사"}]]],
    ["부분 전기공사",[["electricBasic","기본형 인건비"],["electricArea","기본형 평형"],["electricRecessed","매입등 추가 시공 (개소, 기구 별도)"],["electricSwitch","스위치 추가 시공 (개소, 이설 제외)"]]],
    ["기구비",[["electricFixtureEnabled","기구비 직접 입력"],["electricLightCost","조명기구 원가 (원)"],["electricSwitchCost","스위치 기구 원가 (원)"],["electricOutletCost","콘센트 기구 원가 (원)"]]],
  ],
  Wallpaper:[["도배 면적",[["wallpaperRoomPyeong","별도 벽지 시공 방 면적 합계 (평)"]]]],
  Film:[["필름 노무",[["filmWindow","창호 포함"],["filmWindowArea","창호 평형",{"50":"50평 이상"}],["filmDoorCount","방문 (개)"],["filmOneSideMm","가구 한 면 (mm)"],["filmBothSidesMm","가구 양면 (mm)"],["filmWallMm","벽체 (mm)"]]]],
  Furniture:[
    ["문짝교체",[["furnitureTallDoors","키큰장 문짝 (개)"],["furnitureSinkSmallDoors","싱크대 문짝 400mm 이하 (개)"],["furnitureSinkMediumDoors","싱크대 문짝 400mm 초과~600mm 이하 (개)"],["furnitureMoldingMm","가구 몰딩 길이 (mm)"]]],
    ["화장대",[["vanityMm","하부장 길이 (mm)"],["vanityDrawers","서랍 (개)"],["vanityTop","상판",{none:"없음",himacs:"인조대리석",khanstone:"칸스톤",ceramic:"세라믹"}],["vanityDepthMm","상판 깊이 (mm)"]]],
  ],
  Finish:[["소운반비",[["carryFloor","건물 층수"],["carryNoElevator","E/V 없음"],["carrySelected","소운반비 적용"]]]],
};

export function mountTradeRevisionInputs(document){
  const version=document.createElement("input");
  version.id="tradeFormulaVersion";version.type="hidden";version.value="v2";
  const legacyPartition=document.createElement("input");
  legacyPartition.id="demoPartitionMm";legacyPartition.type="hidden";legacyPartition.value=TRADE_REVISION_INPUTS.demoPartitionMm.value;
  document.getElementById("areaPyeong")?.after(version,legacyPartition);
  const panels=[];
  const checkedBlocks=new Map();
  let wallpaperRow;
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
      if(name==="화장대"||name==="문짝교체"){
        const vanity=name==="화장대";
        const block=document.createElement("div");block.className="furniture-block trade-revision-inputs";
        const label=document.createElement("label");label.className="check-title";
        const toggle=document.createElement("input");toggle.type="checkbox";toggle.id=vanity?"vanityToggle":"furnitureDoorsToggle";
        const caption=document.createElement("span");caption.textContent=name;
        const value=document.createElement("input");value.id=vanity?"vanityEnabled":"furnitureDoorsEnabled";value.type="hidden";value.value="auto";
        label.append(toggle,caption);fieldset.querySelector("legend").remove();
        block.append(label,fieldset,value);
        if(vanity)document.getElementById("builtInEnabled").closest(".furniture-block").after(block);
        else document.getElementById("sectionFinishEnabled").closest(".section-heading").before(block);
        checkedBlocks.set(name,{block,toggle,value,fieldset});
        toggle.addEventListener("change",()=>{
          value.value=toggle.checked?"on":"off";
          value.dispatchEvent(new document.defaultView.Event("change",{bubbles:true}));
        });
        continue;
      }
      if(trade==="Wallpaper"){wallpaperRow=fieldset.querySelector("label");continue;}
      if(name==="확장 공사"){
        const block=document.createElement("div");block.className="furniture-block trade-revision-inputs";
        block.append(fieldset);heading.after(block);continue;
      }
      if(trade==="Film"){
        const pair=document.createElement("div");pair.className="trade-toggle-pair";
        pair.append(...[...fieldset.querySelectorAll("label")].slice(0,2));fieldset.querySelector("legend").after(pair);
        const cabinetPair=document.createElement("div");cabinetPair.className="trade-field-pair";
        const oneSide=fieldset.querySelector("#filmOneSideMm").closest("label");
        oneSide.before(cabinetPair);
        cabinetPair.append(oneSide,fieldset.querySelector("#filmBothSidesMm").closest("label"));
      }
      pane.append(fieldset);
    }
    if(pane.childElementCount)heading.after(pane);
    panels.push({trade,pane,old});
  }
  const get=id=>document.getElementById(id);
  const hide=(id,value,selector="label")=>{const node=get(id)?.closest(selector);if(node)node.hidden=value;};
  const syncCountertops=mountCabinetCountertopInputs(document,get);
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
    const furniture=get("sectionFurnitureEnabled").checked;
    const vanity=checkedBlocks.get("화장대"),doors=checkedBlocks.get("문짝교체");
    vanity.toggle.checked=vanity.value.value==="on"||(vanity.value.value==="auto"&&Number(get("vanityMm").value)>0);
    doors.toggle.checked=furnitureDoorsSelected(Object.fromEntries(
      ["furnitureDoorsEnabled","furnitureTallDoors","furnitureSinkSmallDoors","furnitureSinkMediumDoors","furnitureMoldingMm"].map(id=>[id,get(id).value])));
    for(const {block,toggle,fieldset} of checkedBlocks.values()){
      block.hidden=!revised;toggle.disabled=!revised||!furniture;
      fieldset.disabled=toggle.disabled||!toggle.checked;
      for(const field of fieldset.querySelectorAll("input,select"))field.disabled=fieldset.disabled;
    }
    get("vanityDepthMm").disabled||=!areaTop("vanityTop");
    syncCountertops(revised,areaTop("baseCountertop"));
    hide("carrySelected",!get("carryNoElevator").checked||Number(get("carryFloor").value)<2);
    const room=get("wallpaperRoomPyeong");
    room.max=String(Number(get("areaPyeong").value)||0);
    room.setCustomValidity(Number(room.value)>Number(room.max)?"방 면적은 전체 평수 이하여야 합니다.":"");
  };
}

function mountCabinetCountertopInputs(document,get){
  function input(id,type){
    const field=document.createElement("input");
    field.id=id;field.type=type;
    if(type!=="checkbox")field.value=TRADE_REVISION_INPUTS[id].value;
    if(type==="number"){field.min="0";field.max=String(TRADE_REVISION_INPUTS[id].max);field.step="1";field.inputMode="numeric";}
    return field;
  }
  function label(title,field){
    const element=document.createElement("label");
    element.append(title,field);
    return element;
  }
  function select(id,names){
    const field=document.createElement("select");field.id=id;
    for(const value of TRADE_REVISION_INPUTS[id].choices){
      const option=document.createElement("option");option.value=value;option.textContent=names[value];field.append(option);
    }
    field.value=TRADE_REVISION_INPUTS[id].value;
    return field;
  }
  function check(title,field,style="inline-check"){
    const node=document.createElement("label");node.className=style;
    const caption=document.createElement("span");caption.textContent=title;node.append(field,caption);
    return node;
  }
  function bindPrefill(toggle,length,width,depth){
    const prefill=()=>{
      if(!toggle.checked)return;
      if(!(Number(width.value)>0))width.value=length.value;
      if(!(Number(depth.value)>0))depth.value=String(COUNTERTOP_DEFAULT_DEPTH_MM);
    };
    for(const event of ["input","change"])toggle.addEventListener(event,prefill);
  }
  const saved=document.createElement("div");saved.hidden=true;
  const mode=input("countertopLayoutMode","hidden");
  saved.append(mode,input("homebarCounterWidthMm","hidden"),input("homebarCounterDepthMm","hidden"),
    input("countertopTransport","checkbox"),input("countertopLadder","checkbox"));
  get("tradeFormulaVersion").after(saved);
  const base=document.createElement("div");base.className="trade-revision-inputs";
  const custom=input("baseCounterCustomSize","checkbox");
  const dimensions=document.createElement("fieldset");dimensions.className="control-grid compact-row-grid";
  dimensions.setAttribute("aria-label","상하부장 상판 별도 치수");
  const width=input("baseCounterWidthMm","number"),depth=input("baseCounterDepthMm","number");
  dimensions.append(label("상판 길이 (mm)",width),label("상판 깊이 (mm)",depth));
  base.append(check("상판 별도 치수",custom),dimensions);get("baseEnabled").closest(".furniture-block").append(base);
  bindPrefill(custom,get("lowerCabinetM"),width,depth);
  const homebarLength=get("homebarM"),homebarLabel=homebarLength.closest("label");
  const lengthCaption=document.createElement("span");homebarLabel.replaceChildren(lengthCaption,homebarLength);
  const tall=input("homebarTallLengthMm","number"),tallLabel=label("키큰장 길이 (mm)",tall);
  homebarLabel.after(tallLabel);
  const thicknessLabels={"12":"12T","20":"20T"};
  const thicknessControls=[
    ["baseCounterThickness","baseCountertop",()=>get("baseEnabled").checked&&get("baseCountertopEnabled").checked],
    ["islandCounterThickness","islandCountertop",()=>get("islandEnabled").checked],
    ["homebarCounterThickness","homebarCountertop",()=>get("homebarEnabled").checked],
    ["vanityCounterThickness","vanityTop",()=>get("vanityToggle").checked],
  ].map(([id,material,enabled])=>{
    const field=select(id,thicknessLabels);
    const node=label(id==="islandCounterThickness"?"칸스톤 상판·측판 두께":"칸스톤 상판 두께",field);
    get(material).closest("label").after(node);
    return {field,node,material,enabled};
  });
  const dry=document.createElement("div");dry.className="furniture-block trade-revision-inputs";
  const dryEnabled=input("dryVanityEnabled","checkbox"),dryLength=input("dryVanityLengthMm","number");
  const dryMaterial=select("dryVanityCountertop",{epPanel:"EP판",none:"없음",himacs:"하이막스",khanstone:"칸스톤",ceramic:"세라믹"});
  const dryThickness=select("dryVanityCounterThickness",thicknessLabels);
  const dryThicknessLabel=label("칸스톤 상판 두께",dryThickness);
  const dryCustom=input("dryVanityCounterCustomSize","checkbox");
  const dryCustomLabel=check("상판 별도 치수",dryCustom);
  const dryWidth=input("dryVanityCounterWidthMm","number"),dryDepth=input("dryVanityCounterDepthMm","number");
  const dryWidthLabel=label("상판 길이 (mm)",dryWidth),dryDepthLabel=label("상판 깊이 (mm)",dryDepth);
  const dryFields=document.createElement("div");dryFields.className="control-grid compact-row-grid";
  dryFields.append(label("하부장 종류",select("dryVanityCabinetType",{standard:"일반 가구장",foam:"발포 하부장"})),
    label("하부장 길이 (mm)",dryLength),label("상판 소재",dryMaterial),dryThicknessLabel,dryCustomLabel,dryWidthLabel,dryDepthLabel);
  dry.append(check("건식세면대",dryEnabled,"check-title"),dryFields);
  dry.dataset.lastTradeInput="";
  get("bathroomUnits").closest(".furniture-block").after(dry);
  bindPrefill(dryCustom,dryLength,dryWidth,dryDepth);
  return (revised,areaTop)=>{
    const furniture=get("sectionFurnitureEnabled").checked;
    const enabled=revised&&get("baseEnabled").checked&&get("baseCountertopEnabled").checked&&areaTop;
    base.hidden=!enabled;custom.disabled=!enabled||!furniture;
    dimensions.hidden=!custom.checked;
    width.disabled=depth.disabled=custom.disabled||!custom.checked;
    const split=revised&&mode.value!=="legacy";
    lengthCaption.textContent=split?"상하부장 길이 (mm)":"길이 (mm)";
    tallLabel.hidden=!split;
    tall.disabled=!split||!furniture||!get("homebarEnabled").checked;
    for(const {field,node,material,enabled:isEnabled} of thicknessControls){
      const khanstone=get(material).value==="khanstone"||(material==="islandCountertop"&&get("islandSideFinish").value==="khanstone"&&Number(get("islandSideFinishCount").value)>0);
      node.hidden=material==="vanityTop"?!split:!split||!isEnabled()||!khanstone;
      field.disabled=node.hidden||!furniture||!isEnabled()||!khanstone;
    }
    dry.hidden=!split;
    dryEnabled.disabled=!split||!get("sectionBathroomEnabled").checked;
    const dryOff=dryEnabled.disabled||!dryEnabled.checked;
    dryFields.querySelectorAll("input,select").forEach(field=>{field.disabled=dryOff;});
    dryThickness.disabled||=dryMaterial.value!=="khanstone";
    dryCustom.disabled||=!["himacs","khanstone","ceramic"].includes(dryMaterial.value);
    dryWidth.disabled||=dryCustom.disabled||!dryCustom.checked;
    dryDepth.disabled||=dryCustom.disabled||!dryCustom.checked;
  };
}
