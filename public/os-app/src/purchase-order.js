export function purchaseOrderItems(estimate, groupLabels) {
  const orderGroups = new Set(["base", "island", "homebar", "shoe", "fridgeLaundry", "pantry", "builtIn", "hanger", "kitchen", "bathroom", "wallpaper", "film", "flooring", "standardLighting", "carpentry"]);
  const materialKeywords = [
    "자재", "MDF", "합판", "다루끼", "각재", "상판", "칸스톤", "세라믹", "하이막스", "EP",
    "싱크볼", "싱크수전", "후드", "도기", "수전", "장식장", "악세사리", "휴젠트",
    "벽지", "필름", "마루", "다운라이트", "매입등", "실린더", "콘센트", "스위치",
    "밥솥장", "서랍", "신발장", "팬트리", "붙박이", "헹거", "냉장고", "세탁기",
    "하부장", "상부장", "키큰장", "홈바장", "아일랜드", "제작"
  ];
  const excludedKeywords = ["인건비", "기공", "조공", "시공", "설치비", "철거", "방수", "양중", "폐기물", "청소", "보양", "허가", "동의서"];
  return (estimate?.internalDetails || [])
    .filter((item) => {
      const text = `${item.item} ${item.input} ${item.quantity}`;
      if (!orderGroups.has(item.group)) return false;
      return materialKeywords.some((keyword) => text.includes(keyword)) &&
        !excludedKeywords.some((keyword) => text.includes(keyword));
    })
    .map((item) => ({
      process: groupLabels[item.group] || item.group || "기타",
      item: item.item,
      spec: item.input,
      quantity: item.quantity,
      budget: item.cost,
    }));
}
