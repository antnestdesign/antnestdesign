// Explicit browsing-list registry: document bodies and quantity input forms are excluded.
export const LIST_VIEWPORTS = [
  ['#savedEstimateRows', '견적 목록'],
  ['#contractProjectRows', '계약 프로젝트 목록'],
  ['#allContractPackageRows', '전체 계약 문서 목록'],
  ['#contractPackageRows', '프로젝트 계약 문서 목록'],
  ['#systemDraftRows', '원가 변경 예정 목록'],
  ['#systemHistoryRows', '원가 변경 이력'],
  ['#systemPublishLogRows', '원가 게시 이력'],
  ['#userManagementRows', '사용자 목록'],
  ['#auditLogRows', '감사 이력'],
  ['.cost-standard-list', '표준 원가 품목'],
  ['.estimate-history-scroll', '견적 변경 이력'],
  ['.project-flow-history', '프로젝트 진행 이력'],
  ['.preliminary-version-list', '확정 견적 버전'],
  ['.detailed-version-list', '과거 발행 버전'],
  ['.policy-price-list', '가견적 단가 목록'],
  ['.policy-history-list', '산정 기준 게시 이력'],
  ['.item-builder-layout > nav', '등록 견적 항목'],
  ['.item-builder-editor > details > ul', '견적 항목 게시 이력'],
  ['.confirmed-contract-list', '확정 견적 계약 문서 버전'],
  ['.manual-work-list', '직접 추가 공사 목록'],
];

export function listGroups(list) {
  const groups = [];
  for (const item of list.children) {
    if (item.hidden || item.style.display === 'none') continue;
    if (item.classList.contains('admin-estimate-detail-row') && groups.length) groups.at(-1).push(item);
    else groups.push([item]);
  }
  return groups;
}

export function listViewportHeight(viewport, groups, limit = 5) {
  if (groups.length <= limit) return null;
  const last = groups[limit - 1].at(-1).getBoundingClientRect();
  const top = viewport.getBoundingClientRect().top;
  // scrollTop keeps the height stable while a user scrolls or edits a visible row.
  return Math.max(1, Math.ceil(last.bottom - top + viewport.scrollTop));
}

export function mountListViewports({ document, window }) {
  const entries = new Map(), observed = new Set();
  let frame = 0, stopped = false;
  const schedule = () => { if (!frame && !stopped) frame = window.requestAnimationFrame(refresh); };
  const resize = window.ResizeObserver ? new window.ResizeObserver(schedule) : null;
  function refresh() {
    frame = 0;
    for (const history of document.querySelectorAll('.policy-history')) {
      if (history.querySelector(':scope > .policy-history-list')) continue;
      const rows = [...history.children].filter(item => item.tagName !== 'SUMMARY');
      const list = document.createElement('div'); list.className = 'policy-history-list';
      list.append(...rows); history.append(list);
    }
    const active = new Set(), sizes = new Set();
    for (const [selector, label] of LIST_VIEWPORTS) for (const list of document.querySelectorAll(selector)) {
      const table = list.tagName === 'TBODY';
      const viewport = table ? list.closest('.table-wrap') : list;
      if (!viewport) continue;
      active.add(viewport);
      if (!entries.has(viewport)) {
        entries.set(viewport, { height: viewport.style.maxHeight });
        viewport.classList.add('os-list-viewport');
        viewport.tabIndex = 0;
        viewport.setAttribute('role', 'region');
        viewport.setAttribute('aria-label', label);
      }
      const groups = listGroups(list);
      const visible = viewport.getClientRects().length > 0;
      const height = visible ? listViewportHeight(viewport, groups) : null;
      const value = height === null ? 'none' : `${height}px`;
      if (viewport.style.maxHeight !== value) viewport.style.maxHeight = value;
      viewport.dataset.listCount = String(groups.length);
      viewport.dataset.listLimited = String(height !== null);
      sizes.add(list);
      for (const item of groups.slice(0, 5).flat()) sizes.add(item);
      if (table) { const head = list.closest('table')?.querySelector('thead'); if (head) sizes.add(head); }
    }
    for (const [viewport] of entries) if (!active.has(viewport)) entries.delete(viewport);
    if (resize) {
      for (const item of observed) if (!sizes.has(item)) { resize.unobserve(item); observed.delete(item); }
      for (const item of sizes) if (!observed.has(item)) { observed.add(item); resize.observe(item); }
    }
  }
  const mutations = new window.MutationObserver(schedule);
  mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'open', 'class'] });
  window.addEventListener('resize', schedule);
  document.addEventListener('toggle', schedule, true);
  document.fonts?.ready.then(schedule);
  schedule();
  return { refresh, destroy() {
    stopped = true; mutations.disconnect(); resize?.disconnect(); window.cancelAnimationFrame(frame);
    window.removeEventListener('resize', schedule); document.removeEventListener('toggle', schedule, true);
    for (const [viewport, original] of entries) { viewport.style.maxHeight = original.height; viewport.classList.remove('os-list-viewport'); }
  } };
}
