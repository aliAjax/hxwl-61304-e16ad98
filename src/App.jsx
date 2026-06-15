import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Syringe, Plus, Search, Trash2, RotateCcw, CheckCircle2, AlertTriangle, ClipboardList, CalendarDays, PhoneCall, Clock, AlertCircle, CalendarCheck, MessageSquareText, X, User, Calendar, Upload, FileText, AlertOctagon, CheckCheck, Info, Users, PawPrint, ArrowLeft, ChevronRight, Settings, Save, Edit3, Zap, Filter, PlusCircle, MinusCircle, Building2, Copy, Download, MoreHorizontal, GitBranch, Link2, Link2Off, History, ShieldCheck, RefreshCw } from 'lucide-react';
import './App.css';

const appConfig = {
  "id": "hxwl-61304",
  "port": 61304,
  "title": "宠物医院疫苗提醒",
  "subtitle": "单店宠物疫苗复种、联系状态和本周提醒清单",
  "domain": "宠物医院",
  "icon": "Syringe",
  "storage": "hxwl-61304-pet-vaccine",
  "accent": "#db2777",
  "statuses": [
    "待联系",
    "已联系",
    "已接种"
  ],
  "primaryStatus": "待联系",
  "fields": [
    {
      "key": "pet",
      "label": "宠物姓名",
      "type": "input",
      "placeholder": "奶盖",
      "options": []
    },
    {
      "key": "species",
      "label": "物种",
      "type": "select",
      "placeholder": "猫",
      "options": [
        "猫",
        "犬",
        "兔",
        "其他"
      ]
    },
    {
      "key": "ownerPhone",
      "label": "主人联系方式",
      "type": "input",
      "placeholder": "13800008888",
      "options": []
    },
    {
      "key": "vaccine",
      "label": "疫苗类型",
      "type": "select",
      "placeholder": "猫三联",
      "options": [
        "猫三联",
        "狂犬",
        "犬六联",
        "体内驱虫"
      ]
    },
    {
      "key": "lastDate",
      "label": "上次接种日期",
      "type": "date",
      "placeholder": "",
      "options": []
    },
    {
      "key": "nextDate",
      "label": "下次提醒日期",
      "type": "date",
      "placeholder": "",
      "options": []
    }
  ],
  "seed": [
    {
      "pet": "奶盖",
      "species": "猫",
      "ownerPhone": "13800008888",
      "vaccine": "猫三联",
      "lastDate": "2026-05-15",
      "nextDate": "2026-06-14",
      "status": "待联系"
    },
    {
      "pet": "旺财",
      "species": "犬",
      "ownerPhone": "13900006666",
      "vaccine": "狂犬",
      "lastDate": "2025-06-10",
      "nextDate": "2026-06-10",
      "status": "已联系"
    },
    {
      "pet": "团子",
      "species": "兔",
      "ownerPhone": "13700001111",
      "vaccine": "体内驱虫",
      "lastDate": "2026-05-13",
      "nextDate": "2026-06-13",
      "status": "待联系"
    },
    {
      "pet": "小白",
      "species": "猫",
      "ownerPhone": "13600002222",
      "vaccine": "狂犬",
      "lastDate": "2026-05-20",
      "nextDate": "2026-06-18",
      "status": "待联系"
    },
    {
      "pet": "豆豆",
      "species": "犬",
      "ownerPhone": "13500003333",
      "vaccine": "犬六联",
      "lastDate": "2026-06-01",
      "nextDate": "2026-06-28",
      "status": "已接种"
    }
  ],
  "metrics": [
    [
      "宠物数",
      "records.length"
    ],
    [
      "待联系",
      "records.filter((item) => item.status === '待联系').length"
    ],
    [
      "本周提醒",
      "records.filter((item) => inNextDays(item.nextDate, 7)).length"
    ]
  ],
  "filters": [
    {
      "key": "query",
      "label": "宠物/主人",
      "type": "search",
      "match": "`${item.pet}${item.ownerPhone}`.includes(filters.query)"
    },
    {
      "key": "status",
      "label": "提醒状态",
      "type": "status"
    }
  ],
  "cardTitle": "item.pet",
  "cardMeta": "`${item.species} · ${item.vaccine} · ${item.ownerPhone}`",
  "cardDetail": "`下次提醒：${item.nextDate}`",
  "dateKey": "nextDate",
  "note": "先做单店本地版，不需要短信接口。",
  "defaultValues": {
    "pet": "奶盖",
    "species": "猫",
    "ownerPhone": "13800008888",
    "vaccine": "猫三联",
    "lastDate": "",
    "nextDate": "",
    "status": "待联系"
  }
};

const defaultTemplates = [
  { id: 'tpl-1', species: '猫', vaccine: '猫三联', days: 365 },
  { id: 'tpl-2', species: '猫', vaccine: '狂犬', days: 365 },
  { id: 'tpl-3', species: '犬', vaccine: '狂犬', days: 365 },
  { id: 'tpl-4', species: '犬', vaccine: '犬六联', days: 365 },
  { id: 'tpl-5', species: '兔', vaccine: '体内驱虫', days: 90 },
  { id: 'tpl-6', species: '猫', vaccine: '体内驱虫', days: 90 },
  { id: 'tpl-7', species: '犬', vaccine: '体内驱虫', days: 90 },
  { id: 'tpl-8', species: '其他', vaccine: '狂犬', days: 365 },
  { id: 'tpl-9', species: '其他', vaccine: '体内驱虫', days: 90 },
];

const defaultRules = [
  {
    id: 'rule-1',
    vaccine: '猫三联',
    advanceDays: 7,
    overdueLevels: [
      { id: 'ol-1', label: '轻度逾期', min: 1, max: 7 },
      { id: 'ol-2', label: '中度逾期', min: 8, max: 30 },
      { id: 'ol-3', label: '重度逾期', min: 31, max: 9999 }
    ],
    defaultStatus: '待联系',
    autoGroup: 'overdue'
  },
  {
    id: 'rule-2',
    vaccine: '狂犬',
    advanceDays: 14,
    overdueLevels: [
      { id: 'ol-4', label: '轻度逾期', min: 1, max: 7 },
      { id: 'ol-5', label: '中度逾期', min: 8, max: 30 },
      { id: 'ol-6', label: '重度逾期', min: 31, max: 9999 }
    ],
    defaultStatus: '待联系',
    autoGroup: 'overdue'
  },
  {
    id: 'rule-3',
    vaccine: '犬六联',
    advanceDays: 7,
    overdueLevels: [
      { id: 'ol-7', label: '轻度逾期', min: 1, max: 7 },
      { id: 'ol-8', label: '中度逾期', min: 8, max: 30 },
      { id: 'ol-9', label: '重度逾期', min: 31, max: 9999 }
    ],
    defaultStatus: '待联系',
    autoGroup: 'overdue'
  },
  {
    id: 'rule-4',
    vaccine: '体内驱虫',
    advanceDays: 3,
    overdueLevels: [
      { id: 'ol-10', label: '轻度逾期', min: 1, max: 3 },
      { id: 'ol-11', label: '中度逾期', min: 4, max: 14 },
      { id: 'ol-12', label: '重度逾期', min: 15, max: 9999 }
    ],
    defaultStatus: '待联系',
    autoGroup: 'vaccine'
  }
];

const RULES_STORAGE_KEY = appConfig.storage + '-rules';

function loadRules() {
  const raw = localStorage.getItem(RULES_STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { return [...defaultRules]; }
  }
  return [...defaultRules];
}

function persistRules(rules) {
  localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
}

function getRuleForVaccine(vaccine, rules) {
  return rules.find(r => r.vaccine === vaccine) || null;
}

function getAdvanceDays(vaccine, rules) {
  const rule = getRuleForVaccine(vaccine, rules);
  return rule ? rule.advanceDays : 7;
}

function getDefaultStatusForVaccine(vaccine, rules) {
  const rule = getRuleForVaccine(vaccine, rules);
  return rule ? rule.defaultStatus : appConfig.primaryStatus;
}

function getOverdueLevel(overdueDays, vaccine, rules) {
  if (overdueDays <= 0) return null;
  const rule = getRuleForVaccine(vaccine, rules);
  if (!rule || !rule.overdueLevels || rule.overdueLevels.length === 0) {
    if (overdueDays <= 7) return { label: '轻度逾期', level: 0 };
    if (overdueDays <= 30) return { label: '中度逾期', level: 1 };
    return { label: '重度逾期', level: 2 };
  }
  for (let i = 0; i < rule.overdueLevels.length; i++) {
    const ol = rule.overdueLevels[i];
    if (overdueDays >= ol.min && overdueDays <= ol.max) {
      return { label: ol.label, level: i, id: ol.id };
    }
  }
  return { label: rule.overdueLevels[rule.overdueLevels.length - 1].label, level: rule.overdueLevels.length - 1, id: rule.overdueLevels[rule.overdueLevels.length - 1].id };
}

function getAutoGroupForVaccine(vaccine, rules) {
  const rule = getRuleForVaccine(vaccine, rules);
  return rule ? rule.autoGroup : 'overdue';
}

const TEMPLATE_STORAGE_KEY = appConfig.storage + '-templates';

function loadTemplates() {
  const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { return [...defaultTemplates]; }
  }
  return [...defaultTemplates];
}

function persistTemplates(templates) {
  localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
}

function calcNextDate(lastDate, species, vaccine, templates) {
  if (!lastDate) return '';
  const tpl = templates.find(t => t.species === species && t.vaccine === vaccine);
  if (!tpl) return '';
  const [y, m, d] = lastDate.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  if (isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + tpl.days);
  return formatLocalDate(date);
}

function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDate(dateText) {
  if (!dateText) return new Date(NaN);
  const [y, m, d] = dateText.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

const today = formatLocalDate(new Date());

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const SCHEMA_VERSION = 2;

function migrateRecord(record) {
  const migrated = { ...record };
  let needsPersist = false;

  if (!migrated.id) {
    migrated.id = uid();
    needsPersist = true;
  }

  if (!migrated.status) {
    migrated.status = appConfig.primaryStatus;
    needsPersist = true;
  }

  if (!migrated.timeline || !Array.isArray(migrated.timeline) || migrated.timeline.length === 0) {
    migrated.timeline = [{
      status: migrated.status || appConfig.primaryStatus,
      at: today,
      by: '数据迁移'
    }];
    needsPersist = true;
  }

  if (!migrated.notes || !Array.isArray(migrated.notes)) {
    migrated.notes = [];
    needsPersist = true;
  }

  if (!migrated.schemaVersion || migrated.schemaVersion < SCHEMA_VERSION) {
    migrated.schemaVersion = SCHEMA_VERSION;
    needsPersist = true;
  }

  return { record: migrated, needsPersist };
}

function migrateRecordsIfNeeded(records) {
  let hasChanges = false;
  const migrated = records.map(record => {
    const result = migrateRecord(record);
    if (result.needsPersist) hasChanges = true;
    return result.record;
  });
  return { records: migrated, hasChanges };
}

function withIds(items) {
  return items.map((item) => ({
    id: uid(),
    ...item,
    timeline: item.timeline || [{ status: item.status, at: today, by: '系统' }],
    notes: item.notes || [],
    schemaVersion: SCHEMA_VERSION
  }));
}

const STORES_META_KEY = appConfig.storage + '-stores-meta';
const STORE_DATA_KEY_PREFIX = appConfig.storage + '-store-';
const STORE_SCHEMA_VERSION = 1;
const BACKUP_FORMAT_VERSION = 2;

const CROSS_STORE_LINKS_KEY = appConfig.storage + '-cross-store-links';
const CROSS_STORE_IGNORED_KEY = appConfig.storage + '-cross-store-ignored';
const CROSS_STORE_AUDIT_KEY = appConfig.storage + '-cross-store-audit';

function loadCrossStoreLinks() {
  const raw = localStorage.getItem(CROSS_STORE_LINKS_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return {};
}

function persistCrossStoreLinks(links) {
  localStorage.setItem(CROSS_STORE_LINKS_KEY, JSON.stringify(links));
}

function loadCrossStoreIgnored() {
  const raw = localStorage.getItem(CROSS_STORE_IGNORED_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

function persistCrossStoreIgnored(ignored) {
  localStorage.setItem(CROSS_STORE_IGNORED_KEY, JSON.stringify(ignored));
}

function loadCrossStoreAudit() {
  const raw = localStorage.getItem(CROSS_STORE_AUDIT_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

function persistCrossStoreAudit(audit) {
  localStorage.setItem(CROSS_STORE_AUDIT_KEY, JSON.stringify(audit));
}

function addCrossStoreAuditLog(action, details) {
  const audit = loadCrossStoreAudit();
  audit.unshift({
    id: uid(),
    action,
    details,
    at: new Date().toISOString(),
    by: '操作员'
  });
  persistCrossStoreAudit(audit.slice(0, 500));
}

function levenshteinDistance(a, b) {
  if (!a || !b) return Math.max((a || '').length, (b || '').length);
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function stringSimilarity(a, b) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const strA = String(a).toLowerCase().trim();
  const strB = String(b).toLowerCase().trim();
  if (strA === strB) return 1;
  const maxLen = Math.max(strA.length, strB.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(strA, strB);
  return 1 - distance / maxLen;
}

function normalizePhoneGlobal(phone) {
  if (!phone) return '';
  return String(phone).replace(/\s|-/g, '');
}

function normalizePetName(name) {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[\s·・._-]/g, '');
}

function isPetNameSimilar(a, b, threshold = 0.75) {
  const normA = normalizePetName(a);
  const normB = normalizePetName(b);
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  if (normA.includes(normB) || normB.includes(normA)) return true;
  return stringSimilarity(normA, normB) >= threshold;
}

function scanAllStoresForDuplicates(currentStoreId) {
  const meta = loadStoresMeta();
  if (!meta || !meta.stores || meta.stores.length < 2) {
    return { groups: [], allRecords: [] };
  }

  const ignored = loadCrossStoreIgnored();
  const ignoredKeys = new Set(ignored.map(item => item.groupKey));

  const allRecords = [];
  meta.stores.forEach(store => {
    const storeData = loadStoreData(store.id);
    if (storeData && Array.isArray(storeData.records)) {
      storeData.records.forEach(record => {
        allRecords.push({
          ...record,
          _storeId: store.id,
          _storeName: store.name,
          _isDefault: store.isDefault || false
        });
      });
    }
  });

  const duplicateGroups = [];
  const usedRecordKeys = new Set();

  const phoneGroups = {};
  allRecords.forEach(record => {
    const phone = normalizePhoneGlobal(record.ownerPhone);
    if (phone) {
      if (!phoneGroups[phone]) phoneGroups[phone] = [];
      phoneGroups[phone].push(record);
    }
  });

  Object.entries(phoneGroups).forEach(([phone, records]) => {
    const storeIds = new Set(records.map(r => r._storeId));
    if (storeIds.size >= 2) {
      const groupKey = `phone:${phone}`;
      if (!ignoredKeys.has(groupKey)) {
        duplicateGroups.push({
          id: uid(),
          key: groupKey,
          type: 'phone',
          matchValue: phone,
          matchLabel: `手机号：${phone}`,
          records,
          storeIds: [...storeIds],
          confidence: 1.0
        });
        records.forEach(r => usedRecordKeys.add(`${r._storeId}:${r.id}`));
      }
    }
  });

  for (let i = 0; i < allRecords.length; i++) {
    for (let j = i + 1; j < allRecords.length; j++) {
      const r1 = allRecords[i];
      const r2 = allRecords[j];

      if (r1._storeId === r2._storeId) continue;
      if (r1.species && r2.species && r1.species !== r2.species) continue;

      const key1 = `${r1._storeId}:${r1.id}`;
      const key2 = `${r2._storeId}:${r2.id}`;

      const phone1 = normalizePhoneGlobal(r1.ownerPhone);
      const phone2 = normalizePhoneGlobal(r2.ownerPhone);
      if (phone1 && phone2 && phone1 === phone2) continue;

      const similarity = stringSimilarity(normalizePetName(r1.pet), normalizePetName(r2.pet));
      if (similarity >= 0.78) {
        const groupKey = `pet:${[r1._storeId, r2._storeId].sort().join('-')}:${[r1.id, r2.id].sort().join('-')}`;
        if (!ignoredKeys.has(groupKey)) {
          let targetGroup = duplicateGroups.find(g =>
            g.type === 'pet' && (
              g.records.some(r => r.id === r1.id && r._storeId === r1._storeId) ||
              g.records.some(r => r.id === r2.id && r._storeId === r2._storeId)
            )
          );

          if (targetGroup) {
            const hasR1 = targetGroup.records.some(r => r.id === r1.id && r._storeId === r1._storeId);
            const hasR2 = targetGroup.records.some(r => r.id === r2.id && r._storeId === r2._storeId);
            if (!hasR1) {
              targetGroup.records.push(r1);
              targetGroup.storeIds = [...new Set([...targetGroup.storeIds, r1._storeId])];
            }
            if (!hasR2) {
              targetGroup.records.push(r2);
              targetGroup.storeIds = [...new Set([...targetGroup.storeIds, r2._storeId])];
            }
            const minSim = Math.min(targetGroup.confidence, similarity);
            targetGroup.confidence = minSim;
          } else {
            duplicateGroups.push({
              id: uid(),
              key: groupKey,
              type: 'pet',
              matchValue: r1.pet,
              matchLabel: `宠物名相似：${r1.pet} ≈ ${r2.pet}（相似度 ${Math.round(similarity * 100)}%）`,
              records: [r1, r2],
              storeIds: [r1._storeId, r2._storeId],
              confidence: similarity
            });
          }
          usedRecordKeys.add(key1);
          usedRecordKeys.add(key2);
        }
      }
    }
  }

  duplicateGroups.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'phone' ? -1 : 1;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return b.records.length - a.records.length;
  });

  return { groups: duplicateGroups, allRecords };
}

function markAsCrossStoreCustomer(recordIdsWithStore, currentStoreId) {
  const links = loadCrossStoreLinks();
  const linkId = uid();
  const now = new Date().toISOString();

  links[linkId] = {
    id: linkId,
    records: recordIdsWithStore.map(({ storeId, recordId }) => ({ storeId, recordId })),
    createdAt: now,
    createdBy: '操作员'
  };

  persistCrossStoreLinks(links);
  addCrossStoreAuditLog('mark_cross_store', {
    linkId,
    records: recordIdsWithStore,
    fromStore: currentStoreId
  });

  return linkId;
}

function ignoreDuplicateGroup(groupKey, reason = '') {
  const ignored = loadCrossStoreIgnored();
  ignored.push({
    groupKey,
    reason,
    at: new Date().toISOString(),
    by: '操作员'
  });
  persistCrossStoreIgnored(ignored);
  addCrossStoreAuditLog('ignore_duplicate', { groupKey, reason });
}

function copyRecordToStore(sourceStoreId, sourceRecordId, targetStoreId) {
  const sourceData = loadStoreData(sourceStoreId);
  if (!sourceData || !sourceData.records) return null;

  const sourceRecord = sourceData.records.find(r => r.id === sourceRecordId);
  if (!sourceRecord) return null;

  const targetData = loadStoreData(targetStoreId) || createDefaultStoreData();
  const newStatus = getDefaultStatusForVaccine(sourceRecord.vaccine, targetData.rules || defaultRules);
  const copiedRecord = {
    ...sourceRecord,
    id: uid(),
    status: newStatus,
    timeline: [
      ...(sourceRecord.timeline || []),
      { status: newStatus, at: today, by: `从${sourceStoreId}复制`, note: `跨门店复制，原记录ID: ${sourceRecordId}` }
    ],
    notes: [
      ...(sourceRecord.notes || []),
      { id: uid(), content: `从门店复制，原门店ID: ${sourceStoreId}, 原记录ID: ${sourceRecordId}`, at: today, by: '系统' }
    ],
    schemaVersion: SCHEMA_VERSION,
    _crossStoreSource: {
      storeId: sourceStoreId,
      recordId: sourceRecordId,
      copiedAt: new Date().toISOString()
    }
  };

  targetData.records = [copiedRecord, ...(targetData.records || [])];
  persistStoreData(targetStoreId, targetData);

  addCrossStoreAuditLog('copy_record', {
    sourceStoreId,
    sourceRecordId,
    targetStoreId,
    newRecordId: copiedRecord.id
  });

  return copiedRecord;
}

function getStoreMetaStorageKey() {
  return STORES_META_KEY;
}

function getStoreDataKey(storeId) {
  return STORE_DATA_KEY_PREFIX + storeId;
}

function loadStoresMeta() {
  const raw = localStorage.getItem(STORES_META_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

function persistStoresMeta(meta) {
  localStorage.setItem(STORES_META_KEY, JSON.stringify(meta));
}

function loadStoreData(storeId) {
  const key = getStoreDataKey(storeId);
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

function persistStoreData(storeId, data) {
  const key = getStoreDataKey(storeId);
  localStorage.setItem(key, JSON.stringify(data));
}

function deleteStoreData(storeId) {
  const key = getStoreDataKey(storeId);
  localStorage.removeItem(key);
}

function createDefaultStoreData() {
  return {
    records: withIds(appConfig.seed),
    templates: [...defaultTemplates],
    rules: defaultRules.map(r => ({ ...r, overdueLevels: (r.overdueLevels || []).map(ol => ({ ...ol })) })),
    filters: { query: '', status: '全部', species: '全部', vaccine: '全部' },
    groupMode: 'auto',
    ownerInfo: {},
    schemaVersion: STORE_SCHEMA_VERSION
  };
}

function migrateFromSingleStore() {
  const hasOldRecords = localStorage.getItem(appConfig.storage) !== null;
  const hasOldTemplates = localStorage.getItem(TEMPLATE_STORAGE_KEY) !== null;
  const hasOldRules = localStorage.getItem(RULES_STORAGE_KEY) !== null;

  if (!hasOldRecords && !hasOldTemplates && !hasOldRules) {
    return null;
  }

  let records = [];
  try {
    const raw = localStorage.getItem(appConfig.storage);
    if (raw) {
      const parsed = JSON.parse(raw);
      const { records: migrated, hasChanges } = migrateRecordsIfNeeded(parsed);
      records = migrated;
      if (hasChanges) {
        localStorage.setItem(appConfig.storage, JSON.stringify(records));
      }
    }
  } catch {
    records = withIds(appConfig.seed);
  }

  let templates = [...defaultTemplates];
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (raw) {
      templates = JSON.parse(raw);
    }
  } catch {}

  let rules = defaultRules.map(r => ({ ...r, overdueLevels: (r.overdueLevels || []).map(ol => ({ ...ol })) }));
  try {
    const raw = localStorage.getItem(RULES_STORAGE_KEY);
    if (raw) {
      rules = JSON.parse(raw);
    }
  } catch {}

  const storeId = 'store-default';
  const storeData = {
    records,
    templates,
    rules,
    filters: { query: '', status: '全部', species: '全部', vaccine: '全部' },
    groupMode: 'auto',
    ownerInfo: {},
    schemaVersion: STORE_SCHEMA_VERSION
  };

  const meta = {
    version: 1,
    currentStoreId: storeId,
    stores: [
      {
        id: storeId,
        name: '默认门店',
        createdAt: new Date().toISOString(),
        isDefault: true,
        migrated: true
      }
    ]
  };

  persistStoreData(storeId, storeData);
  persistStoresMeta(meta);

  return { meta, storeData, storeId };
}

function initStores() {
  let meta = loadStoresMeta();

  if (meta && meta.stores && meta.stores.length > 0) {
    const currentStoreId = meta.currentStoreId || meta.stores[0].id;
    let storeData = loadStoreData(currentStoreId);
    if (!storeData) {
      storeData = createDefaultStoreData();
      persistStoreData(currentStoreId, storeData);
    }
    if (!meta.currentStoreId) {
      meta.currentStoreId = currentStoreId;
      persistStoresMeta(meta);
    }
    return { meta, storeData, storeId: currentStoreId };
  }

  const migrated = migrateFromSingleStore();
  if (migrated) {
    return migrated;
  }

  const storeId = 'store-default';
  const storeData = createDefaultStoreData();
  meta = {
    version: 1,
    currentStoreId: storeId,
    stores: [
      {
        id: storeId,
        name: '默认门店',
        createdAt: new Date().toISOString(),
        isDefault: true
      }
    ]
  };

  persistStoreData(storeId, storeData);
  persistStoresMeta(meta);

  return { meta, storeData, storeId };
}

function createStore(name, templateStoreId) {
  const meta = loadStoresMeta();
  if (!meta) return null;

  const storeId = 'store-' + uid();
  let storeData;

  if (templateStoreId) {
    storeData = loadStoreData(templateStoreId);
    if (storeData) {
      storeData = {
        ...storeData,
        records: storeData.records.map(r => ({ ...r, id: uid(), timeline: [...(r.timeline || [])], notes: [...(r.notes || [])] })),
        templates: (storeData.templates || []).map(t => ({ ...t })),
        rules: (storeData.rules || []).map(r => ({ ...r, overdueLevels: (r.overdueLevels || []).map(ol => ({ ...ol })) })),
        filters: { query: '', status: '全部', species: '全部', vaccine: '全部' },
        groupMode: storeData.groupMode || 'auto',
        ownerInfo: storeData.ownerInfo || {}
      };
    } else {
      storeData = createDefaultStoreData();
    }
  } else {
    storeData = createDefaultStoreData();
  }

  persistStoreData(storeId, storeData);

  const newStore = {
    id: storeId,
    name: name.trim() || '新门店',
    createdAt: new Date().toISOString(),
    isDefault: false
  };

  meta.stores.push(newStore);
  meta.currentStoreId = storeId;
  persistStoresMeta(meta);

  return { store: newStore, storeData };
}

function renameStore(storeId, newName) {
  const meta = loadStoresMeta();
  if (!meta || !meta.stores) return null;

  const storeIndex = meta.stores.findIndex(s => s.id === storeId);
  if (storeIndex === -1) return null;

  meta.stores[storeIndex].name = newName.trim() || '未命名门店';
  persistStoresMeta(meta);

  return meta.stores[storeIndex];
}

function deleteStore(storeId) {
  const meta = loadStoresMeta();
  if (!meta || !meta.stores || meta.stores.length <= 1) return false;

  const storeIndex = meta.stores.findIndex(s => s.id === storeId);
  if (storeIndex === -1) return false;

  const store = meta.stores[storeIndex];
  if (store.isDefault) return false;

  meta.stores.splice(storeIndex, 1);
  deleteStoreData(storeId);

  if (meta.currentStoreId === storeId) {
    meta.currentStoreId = meta.stores[0].id;
  }

  persistStoresMeta(meta);
  return true;
}

function switchStore(storeId) {
  const meta = loadStoresMeta();
  if (!meta || !meta.stores) return null;

  const store = meta.stores.find(s => s.id === storeId);
  if (!store) return null;

  meta.currentStoreId = storeId;
  persistStoresMeta(meta);

  const storeData = loadStoreData(storeId);
  return { store, storeData };
}

function exportStoreData(storeId, storeName) {
  const storeData = loadStoreData(storeId);
  if (!storeData) return null;

  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appId: appConfig.id,
    storeName: storeName,
    storeId: storeId,
    schemaVersion: STORE_SCHEMA_VERSION,
    recordCount: storeData.records?.length || 0,
    data: storeData
  };

  return exportData;
}

function validateImportStoreData(rawData) {
  const errors = [];
  const warnings = [];

  if (!rawData || typeof rawData !== 'object') {
    errors.push('文件格式错误：不是有效的JSON对象');
    return { valid: false, errors, warnings, data: null, modules: null };
  }

  let storeData = null;
  let sourceData = null;
  let isLegacyFormat = false;

  if (rawData.data && typeof rawData.data === 'object') {
    storeData = rawData.data;
    sourceData = rawData.data;
  } else if (rawData.records !== undefined || rawData.templates !== undefined) {
    storeData = rawData;
    sourceData = rawData;
  } else if (rawData.appId && rawData.records !== undefined) {
    storeData = {
      records: rawData.records,
      templates: [...defaultTemplates],
      rules: defaultRules.map(r => ({ ...r })),
      filters: { query: '', status: '全部', species: '全部', vaccine: '全部' },
      groupMode: 'auto'
    };
    sourceData = rawData;
    isLegacyFormat = true;
    warnings.push('检测到旧版数据格式，已自动转换为门店数据');
  }

  if (!storeData) {
    errors.push('未找到有效的门店数据');
    return { valid: false, errors, warnings, data: null, modules: null };
  }

  if (!Array.isArray(storeData.records)) {
    errors.push('数据格式错误：records字段应为数组');
    return { valid: false, errors, warnings, data: null, modules: null };
  }

  const modules = {
    records: true,
    templates: !isLegacyFormat && sourceData && Array.isArray(sourceData.templates) && sourceData.templates.length > 0,
    rules: !isLegacyFormat && sourceData && Array.isArray(sourceData.rules) && sourceData.rules.length > 0,
    filters: !isLegacyFormat && sourceData && sourceData.filters !== undefined && sourceData.filters !== null,
    groupMode: !isLegacyFormat && sourceData && sourceData.groupMode !== undefined && sourceData.groupMode !== null,
    isLegacyFormat: isLegacyFormat
  };

  const normalizedRecords = storeData.records.map(r => {
    const { record: migrated } = migrateRecord(r || {});
    return migrated;
  });

  const result = {
    records: normalizedRecords,
    templates: Array.isArray(storeData.templates) ? storeData.templates : [...defaultTemplates],
    rules: Array.isArray(storeData.rules) ? storeData.rules : defaultRules.map(r => ({ ...r })),
    filters: storeData.filters || { query: '', status: '全部', species: '全部', vaccine: '全部' },
    groupMode: storeData.groupMode || 'auto',
    ownerInfo: storeData.ownerInfo || {},
    schemaVersion: STORE_SCHEMA_VERSION
  };

  return { valid: true, errors, warnings, data: result, modules };
}

function importStoreData(storeId, importData) {
  const { valid, data } = validateImportStoreData(importData);
  if (!valid || !data) return false;

  persistStoreData(storeId, data);
  return true;
}

function loadRecords() {
  const raw = localStorage.getItem(appConfig.storage);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const { records, hasChanges } = migrateRecordsIfNeeded(parsed);
      if (hasChanges) {
        localStorage.setItem(appConfig.storage, JSON.stringify(records));
      }
      return records;
    } catch {
      return withIds(appConfig.seed);
    }
  }
  return withIds(appConfig.seed);
}

function avg(numbers) {
  const valid = numbers.filter((value) => Number.isFinite(value));
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function money(value) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(value || 0);
}

function inNextDays(dateText, days) {
  if (!dateText) return false;
  const date = parseLocalDate(dateText);
  const now = parseLocalDate(today);
  const diff = (date.getTime() - now.getTime()) / 86400000;
  return diff >= 0 && diff <= days;
}

function isOverdue(dateText) {
  if (!dateText) return false;
  const date = parseLocalDate(dateText);
  const now = parseLocalDate(today);
  return date.getTime() < now.getTime();
}

function isToday(dateText) {
  if (!dateText) return false;
  return dateText === today;
}

function isWithin7DaysExcludingToday(dateText) {
  if (!dateText) return false;
  const date = parseLocalDate(dateText);
  const now = parseLocalDate(today);
  const diff = (date.getTime() - now.getTime()) / 86400000;
  return diff > 0 && diff <= 7;
}

function isWithinNextDays(dateText, days) {
  if (!dateText) return false;
  const date = parseLocalDate(dateText);
  const now = parseLocalDate(today);
  const diff = (date.getTime() - now.getTime()) / 86400000;
  return diff > 0 && diff <= days;
}

function isWithinAdvanceDays(item, rules) {
  if (!item || !item.nextDate) return false;
  const adv = getAdvanceDays(item.vaccine, rules);
  return isWithinNextDays(item.nextDate, adv);
}

function daysDiff(dateText) {
  if (!dateText) return 0;
  const date = parseLocalDate(dateText);
  const now = parseLocalDate(today);
  return Math.round((date.getTime() - now.getTime()) / 86400000);
}

function latestTemp(item) {
  const temps = item.temps || [Number(item.temperature)];
  return temps[temps.length - 1];
}

function hasHotTemp(item) {
  const temps = item.temps || [Number(item.temperature)];
  return temps.some((value) => Number(value) > 2);
}

function priorityRank(value) {
  return { 危急: 0, 加急: 1, 常规: 2, 高: 0, 中: 1, 低: 2 }[value] ?? 9;
}

function hasOverlap(target, records) {
  if (!target.bed || !target.date || !target.start || !target.end) return false;
  return records.some((item) => item.id !== target.id && item.bed === target.bed && item.date === target.date && target.start < item.end && target.end > item.start);
}

function statusClass(status) {
  const index = appConfig.statuses.indexOf(status);
  return ['status-a', 'status-b', 'status-c', 'status-d'][index] || 'status-a';
}

function normalizeFilters(filters) {
  return {
    query: filters?.query ?? '',
    status: filters?.status ?? '全部',
    species: filters?.species ?? '全部',
    vaccine: filters?.vaccine ?? '全部'
  };
}

function App() {
  const initialStoreState = useMemo(() => initStores(), []);
  const [stores, setStores] = useState(initialStoreState.meta.stores);
  const [currentStoreId, setCurrentStoreId] = useState(initialStoreState.storeId);
  const [records, setRecords] = useState(initialStoreState.storeData.records);
  const [form, setForm] = useState(appConfig.defaultValues);
  const [filters, setFilters] = useState(normalizeFilters(initialStoreState.storeData.filters));
  const [selected, setSelected] = useState(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteOperator, setNewNoteOperator] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [rawCSVData, setRawCSVData] = useState(null);
  const fileInputRef = useRef(null);
  const [showBackupRestoreModal, setShowBackupRestoreModal] = useState(false);
  const [backupRestoreStep, setBackupRestoreStep] = useState('main');
  const [restorePreview, setRestorePreview] = useState(null);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreError, setRestoreError] = useState(null);
  const restoreFileInputRef = useRef(null);
  const [restoreRecords, setRestoreRecords] = useState(true);
  const [restoreTemplates, setRestoreTemplates] = useState(false);
  const [restoreRules, setRestoreRules] = useState(false);
  const [restoreFilters, setRestoreFilters] = useState(false);
  const [restoreGroupMode, setRestoreGroupMode] = useState(false);
  const [currentView, setCurrentView] = useState('records');
  const [ownerSearch, setOwnerSearch] = useState('');
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState(initialStoreState.storeData.ownerInfo || {});
  const [editingOwnerInfo, setEditingOwnerInfo] = useState(false);
  const [ownerNoteDraft, setOwnerNoteDraft] = useState('');
  const [ownerPreferredTimeDraft, setOwnerPreferredTimeDraft] = useState('');
  const [templates, setTemplates] = useState(initialStoreState.storeData.templates);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ species: '', vaccine: '', days: '' });
  const [rules, setRules] = useState(initialStoreState.storeData.rules);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    vaccine: '',
    advanceDays: 7,
    overdueLevels: [
      { id: uid(), label: '轻度逾期', min: 1, max: 7 },
      { id: uid(), label: '中度逾期', min: 8, max: 30 },
      { id: uid(), label: '重度逾期', min: 31, max: 9999 }
    ],
    defaultStatus: '待联系',
    autoGroup: 'overdue'
  });
  const [groupMode, setGroupMode] = useState(initialStoreState.storeData.groupMode);
  const [nextDateManual, setNextDateManual] = useState(false);
  const [recalcNotice, setRecalcNotice] = useState(null);
  const recalcTimerRef = useRef(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [storeModalTab, setStoreModalTab] = useState('list');
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreTemplateId, setNewStoreTemplateId] = useState('');
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [editingStoreName, setEditingStoreName] = useState('');
  const [storeImportPreview, setStoreImportPreview] = useState(null);
  const [storeImportFile, setStoreImportFile] = useState(null);
  const storeImportFileRef = useRef(null);
  const [storeImportTargetId, setStoreImportTargetId] = useState('');
  const [importRestoreRecords, setImportRestoreRecords] = useState(true);
  const [importRestoreTemplates, setImportRestoreTemplates] = useState(false);
  const [importRestoreRules, setImportRestoreRules] = useState(false);
  const [importRestoreFilters, setImportRestoreFilters] = useState(false);
  const [importRestoreGroupMode, setImportRestoreGroupMode] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState(new Set());
  const [showBatchContactModal, setShowBatchContactModal] = useState(false);
  const [batchContactOperator, setBatchContactOperator] = useState('');
  const [draggingRecordId, setDraggingRecordId] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);
  const justDraggedRef = useRef(false);
  const [crossStoreDuplicates, setCrossStoreDuplicates] = useState({ groups: [], allRecords: [] });
  const [crossStoreLinks, setCrossStoreLinks] = useState(() => loadCrossStoreLinks());
  const [crossStoreAudit, setCrossStoreAudit] = useState(() => loadCrossStoreAudit());
  const [selectedDuplicateGroup, setSelectedDuplicateGroup] = useState(null);
  const [crossStoreTab, setCrossStoreTab] = useState('duplicates');
  const [copySelectedIds, setCopySelectedIds] = useState(new Set());
  const [linkSelectedIds, setLinkSelectedIds] = useState(new Set());
  const [isScanningDuplicates, setIsScanningDuplicates] = useState(false);

  const currentStore = useMemo(() => {
    return stores.find(s => s.id === currentStoreId) || stores[0] || null;
  }, [stores, currentStoreId]);

  function saveCurrentStoreData(updates = {}) {
    const currentData = loadStoreData(currentStoreId) || createDefaultStoreData();
    const newData = {
      ...currentData,
      records,
      templates,
      rules,
      filters,
      groupMode,
      ownerInfo,
      ...updates
    };
    persistStoreData(currentStoreId, newData);
  }

  function persist(next) {
    setRecords(next);
    localStorage.setItem(appConfig.storage, JSON.stringify(next));
    const currentData = loadStoreData(currentStoreId) || createDefaultStoreData();
    persistStoreData(currentStoreId, { ...currentData, records: next });
  }

  function saveTemplates(next) {
    setTemplates(next);
    persistTemplates(next);
    const currentData = loadStoreData(currentStoreId) || createDefaultStoreData();
    persistStoreData(currentStoreId, { ...currentData, templates: next });
  }

  function saveFilters(next) {
    setFilters(next);
    const currentData = loadStoreData(currentStoreId) || createDefaultStoreData();
    persistStoreData(currentStoreId, { ...currentData, filters: next });
  }

  function saveGroupMode(next) {
    setGroupMode(next);
    const currentData = loadStoreData(currentStoreId) || createDefaultStoreData();
    persistStoreData(currentStoreId, { ...currentData, groupMode: next });
  }

  function saveOwnerInfo(next) {
    setOwnerInfo(next);
    const currentData = loadStoreData(currentStoreId) || createDefaultStoreData();
    persistStoreData(currentStoreId, { ...currentData, ownerInfo: next });
  }

  function handleUpdateOwnerInfo(phone, info) {
    const next = { ...ownerInfo, [phone]: { ...(ownerInfo[phone] || {}), ...info } };
    saveOwnerInfo(next);
  }

  function handleSwitchStore(storeId) {
    if (storeId === currentStoreId) return;

    saveCurrentStoreData();

    const result = switchStore(storeId);
    if (result && result.storeData) {
      setCurrentStoreId(storeId);
      setRecords(result.storeData.records || []);
      setTemplates(result.storeData.templates || [...defaultTemplates]);
      setRules(result.storeData.rules || defaultRules.map(r => ({ ...r })));
      setFilters(normalizeFilters(result.storeData.filters));
      setGroupMode(result.storeData.groupMode || 'auto');
      setOwnerInfo(result.storeData.ownerInfo || {});
      setSelected(null);
      setSelectedOwner(null);
      setSelectedCalendarDay(null);
    }
  }

  function handleCreateStore() {
    if (!newStoreName.trim()) {
      alert('请输入门店名称');
      return;
    }

    saveCurrentStoreData();

    const result = createStore(newStoreName, newStoreTemplateId || null);
    if (result) {
      const meta = loadStoresMeta();
      setStores(meta.stores);
      setCurrentStoreId(result.store.id);
      setRecords(result.storeData.records || []);
      setTemplates(result.storeData.templates || [...defaultTemplates]);
      setRules(result.storeData.rules || defaultRules.map(r => ({ ...r })));
      setFilters(normalizeFilters(result.storeData.filters));
      setGroupMode(result.storeData.groupMode || 'auto');
      setOwnerInfo(result.storeData.ownerInfo || {});
      setSelected(null);
      setSelectedOwner(null);
      setNewStoreName('');
      setNewStoreTemplateId('');
      setShowStoreModal(false);
      setStoreModalTab('list');
    }
  }

  function handleRenameStore() {
    if (!editingStoreName.trim()) {
      alert('请输入门店名称');
      return;
    }
    const updated = renameStore(editingStoreId, editingStoreName);
    if (updated) {
      const meta = loadStoresMeta();
      setStores(meta.stores);
    }
    setEditingStoreId(null);
    setEditingStoreName('');
  }

  function handleDeleteStore(storeId) {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;
    if (store.isDefault) {
      alert('默认门店不能删除');
      return;
    }
    if (!confirm(`确定要删除门店"${store.name}"吗？此操作不可恢复。`)) {
      return;
    }

    const wasCurrent = storeId === currentStoreId;
    const success = deleteStore(storeId);
    if (success) {
      const meta = loadStoresMeta();
      setStores(meta.stores);

      if (wasCurrent) {
        const newCurrentId = meta.currentStoreId;
        const newStoreData = loadStoreData(newCurrentId);
        if (newStoreData) {
          setCurrentStoreId(newCurrentId);
          setRecords(newStoreData.records || []);
          setTemplates(newStoreData.templates || [...defaultTemplates]);
          setRules(newStoreData.rules || defaultRules.map(r => ({ ...r })));
          setFilters(normalizeFilters(newStoreData.filters));
          setGroupMode(newStoreData.groupMode || 'auto');
          setOwnerInfo(newStoreData.ownerInfo || {});
          setSelected(null);
          setSelectedOwner(null);
        }
      }
    }
  }

  function handleScanCrossStoreDuplicates() {
    setIsScanningDuplicates(true);
    setTimeout(() => {
      const result = scanAllStoresForDuplicates(currentStoreId);
      setCrossStoreDuplicates(result);
      setIsScanningDuplicates(false);
    }, 100);
  }

  function handleIgnoreDuplicateGroup(groupKey) {
    if (!confirm('确定要忽略此重复分组吗？后续扫描将不再提示。')) return;
    ignoreDuplicateGroup(groupKey);
    handleScanCrossStoreDuplicates();
    setCrossStoreAudit(loadCrossStoreAudit());
    setSelectedDuplicateGroup(null);
  }

  function handleMarkAsCrossStore(group) {
    if (linkSelectedIds.size < 2) {
      alert('请至少选择两条记录进行关联');
      return;
    }
    const recordsToLink = group.records.filter(r =>
      linkSelectedIds.has(`${r._storeId}:${r.id}`)
    ).map(r => ({ storeId: r._storeId, recordId: r.id }));

    markAsCrossStoreCustomer(recordsToLink, currentStoreId);
    setCrossStoreLinks(loadCrossStoreLinks());
    setCrossStoreAudit(loadCrossStoreAudit());
    setLinkSelectedIds(new Set());
    alert('已成功标记为跨店客户');
  }

  function handleCopyRecordsToCurrentStore(group) {
    if (copySelectedIds.size === 0) {
      alert('请先选择要复制的记录');
      return;
    }
    const recordsToCopy = group.records.filter(r =>
      copySelectedIds.has(`${r._storeId}:${r.id}`) && r._storeId !== currentStoreId
    );

    if (recordsToCopy.length === 0) {
      alert('请选择其他门店的记录进行复制');
      return;
    }

    if (!confirm(`确定要将 ${recordsToCopy.length} 条记录复制到当前门店"${currentStore?.name}"吗？原门店数据将保留。`)) return;

    let copiedCount = 0;
    recordsToCopy.forEach(r => {
      const copied = copyRecordToStore(r._storeId, r.id, currentStoreId);
      if (copied) copiedCount++;
    });

    if (copiedCount > 0) {
      const currentData = loadStoreData(currentStoreId);
      if (currentData) {
        setRecords(currentData.records || []);
      }
      setCrossStoreAudit(loadCrossStoreAudit());
      setCopySelectedIds(new Set());
      alert(`成功复制 ${copiedCount} 条记录到当前门店`);
    }
  }

  function toggleCopySelection(storeId, recordId) {
    const key = `${storeId}:${recordId}`;
    const next = new Set(copySelectedIds);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setCopySelectedIds(next);
  }

  function toggleLinkSelection(storeId, recordId) {
    const key = `${storeId}:${recordId}`;
    const next = new Set(linkSelectedIds);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setLinkSelectedIds(next);
  }

  function handleExportStore(storeId, storeName) {
    const exportData = exportStoreData(storeId, storeName);
    if (!exportData) return;

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = formatLocalDate(new Date());
    link.download = `${storeName}_门店数据_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleStoreImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStoreImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const data = JSON.parse(text);
        const validation = validateImportStoreData(data);
        setStoreImportPreview({
          fileName: file.name,
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
          recordCount: validation.data?.records?.length || 0,
          templateCount: validation.data?.templates?.length || 0,
          ruleCount: validation.data?.rules?.length || 0,
          modules: validation.modules,
          rawData: data
        });
        if (validation.valid && validation.modules) {
          setImportRestoreRecords(true);
          setImportRestoreTemplates(validation.modules.templates);
          setImportRestoreRules(validation.modules.rules);
          setImportRestoreFilters(validation.modules.filters);
          setImportRestoreGroupMode(validation.modules.groupMode);
        }
      } catch (error) {
        setStoreImportPreview({
          fileName: file.name,
          valid: false,
          errors: ['JSON解析失败，请检查文件格式'],
          warnings: [],
          recordCount: 0,
          templateCount: 0,
          ruleCount: 0,
          modules: null,
          rawData: null
        });
        setImportRestoreRecords(true);
        setImportRestoreTemplates(false);
        setImportRestoreRules(false);
        setImportRestoreFilters(false);
        setImportRestoreGroupMode(false);
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  function handleConfirmStoreImport() {
    if (!storeImportPreview || !storeImportPreview.valid || !storeImportTargetId) return;
    if (!importRestoreRecords && !importRestoreTemplates && !importRestoreRules && !importRestoreFilters && !importRestoreGroupMode) {
      alert('请至少选择一个要恢复的模块');
      return;
    }

    const { valid, data, modules } = validateImportStoreData(storeImportPreview.rawData);
    if (!valid || !data) return;

    const isLegacy = modules?.isLegacyFormat;

    const existingData = loadStoreData(storeImportTargetId) || createDefaultStoreData();

    const mergedData = {
      ...existingData,
      schemaVersion: STORE_SCHEMA_VERSION
    };

    if (importRestoreRecords) {
      mergedData.records = data.records || [];
    }
    if (!isLegacy) {
      if (importRestoreTemplates) {
        mergedData.templates = data.templates || [...defaultTemplates];
      }
      if (importRestoreRules) {
        mergedData.rules = data.rules || defaultRules.map(r => ({ ...r }));
      }
      if (importRestoreFilters) {
        mergedData.filters = data.filters || { query: '', status: '全部', species: '全部', vaccine: '全部' };
      }
      if (importRestoreGroupMode) {
        mergedData.groupMode = data.groupMode || 'auto';
      }
    }

    persistStoreData(storeImportTargetId, mergedData);

    if (storeImportTargetId === currentStoreId) {
      if (importRestoreRecords) {
        setRecords(mergedData.records || []);
      }
      if (!isLegacy) {
        if (importRestoreTemplates) {
          setTemplates(mergedData.templates || [...defaultTemplates]);
        }
        if (importRestoreRules) {
          setRules(mergedData.rules || defaultRules.map(r => ({ ...r })));
        }
        if (importRestoreFilters) {
          setFilters(normalizeFilters(mergedData.filters));
        }
        if (importRestoreGroupMode) {
          setGroupMode(mergedData.groupMode || 'auto');
        }
      }
      setSelected(null);
      setSelectedOwner(null);
    }

    setShowStoreModal(false);
    setStoreImportPreview(null);
    setStoreImportFile(null);
    setStoreImportTargetId('');
    setImportRestoreRecords(true);
    setImportRestoreTemplates(false);
    setImportRestoreRules(false);
    setImportRestoreFilters(false);
    setImportRestoreGroupMode(false);
    if (storeImportFileRef.current) {
      storeImportFileRef.current.value = '';
    }
    alert('门店数据导入成功');
  }

  function handleCancelStoreImport() {
    setStoreImportPreview(null);
    setStoreImportFile(null);
    setStoreImportTargetId('');
    setImportRestoreRecords(true);
    setImportRestoreTemplates(false);
    setImportRestoreRules(false);
    setImportRestoreFilters(false);
    setImportRestoreGroupMode(false);
    if (storeImportFileRef.current) {
      storeImportFileRef.current.value = '';
    }
  }

  function saveRules(next) {
    setRules(next);
    persistRules(next);
    const currentData = loadStoreData(currentStoreId) || createDefaultStoreData();
    persistStoreData(currentStoreId, { ...currentData, rules: next });
  }

  function addTemplate(e) {
    e.preventDefault();
    const { species, vaccine, days } = templateForm;
    if (!species || !vaccine || !days || Number(days) <= 0) return;
    const existing = templates.find(t => t.species === species && t.vaccine === vaccine);
    if (existing) {
      const next = templates.map(t => t.id === existing.id ? { ...t, days: Number(days) } : t);
      saveTemplates(next);
    } else {
      const next = [...templates, { id: uid(), species, vaccine, days: Number(days) }];
      saveTemplates(next);
    }
    setTemplateForm({ species: '', vaccine: '', days: '' });
    setEditingTemplate(null);
  }

  function removeTemplate(id) {
    saveTemplates(templates.filter(t => t.id !== id));
  }

  function restoreDefaultTemplates() {
    saveTemplates([...defaultTemplates]);
    setEditingTemplate(null);
    setTemplateForm({ species: '', vaccine: '', days: '' });
  }

  function startEditTemplate(tpl) {
    setEditingTemplate(tpl.id);
    setTemplateForm({ species: tpl.species, vaccine: tpl.vaccine, days: String(tpl.days) });
  }

  function cancelEditTemplate() {
    setEditingTemplate(null);
    setTemplateForm({ species: '', vaccine: '', days: '' });
  }

  function addRule(e) {
    e.preventDefault();
    if (!ruleForm.vaccine || !ruleForm.advanceDays || Number(ruleForm.advanceDays) <= 0) return;
    const existing = rules.find(r => r.vaccine === ruleForm.vaccine);
    if (existing) {
      const next = rules.map(r => r.id === existing.id ? { ...r, ...ruleForm, advanceDays: Number(ruleForm.advanceDays) } : r);
      saveRules(next);
    } else {
      const next = [...rules, { id: uid(), ...ruleForm, advanceDays: Number(ruleForm.advanceDays) }];
      saveRules(next);
    }
    setRuleForm({
      vaccine: '',
      advanceDays: 7,
      overdueLevels: [
        { id: uid(), label: '轻度逾期', min: 1, max: 7 },
        { id: uid(), label: '中度逾期', min: 8, max: 30 },
        { id: uid(), label: '重度逾期', min: 31, max: 9999 }
      ],
      defaultStatus: '待联系',
      autoGroup: 'overdue'
    });
    setEditingRule(null);
  }

  function removeRule(id) {
    saveRules(rules.filter(r => r.id !== id));
  }

  function restoreDefaultRules() {
    saveRules(defaultRules.map(r => ({ ...r })));
    setEditingRule(null);
    setRuleForm({
      vaccine: '',
      advanceDays: 7,
      overdueLevels: [
        { id: uid(), label: '轻度逾期', min: 1, max: 7 },
        { id: uid(), label: '中度逾期', min: 8, max: 30 },
        { id: uid(), label: '重度逾期', min: 31, max: 9999 }
      ],
      defaultStatus: '待联系',
      autoGroup: 'overdue'
    });
  }

  function startEditRule(rule) {
    setEditingRule(rule.id);
    setRuleForm({
      vaccine: rule.vaccine,
      advanceDays: rule.advanceDays,
      overdueLevels: (rule.overdueLevels || []).map(ol => ({ ...ol })),
      defaultStatus: rule.defaultStatus,
      autoGroup: rule.autoGroup
    });
  }

  function cancelEditRule() {
    setEditingRule(null);
    setRuleForm({
      vaccine: '',
      advanceDays: 7,
      overdueLevels: [
        { id: uid(), label: '轻度逾期', min: 1, max: 7 },
        { id: uid(), label: '中度逾期', min: 8, max: 30 },
        { id: uid(), label: '重度逾期', min: 31, max: 9999 }
      ],
      defaultStatus: '待联系',
      autoGroup: 'overdue'
    });
  }

  function addOverdueLevelToForm() {
    setRuleForm({
      ...ruleForm,
      overdueLevels: [...ruleForm.overdueLevels, { id: uid(), label: '', min: 1, max: 9999 }]
    });
  }

  function removeOverdueLevelFromForm(levelId) {
    if (ruleForm.overdueLevels.length <= 1) return;
    setRuleForm({
      ...ruleForm,
      overdueLevels: ruleForm.overdueLevels.filter(ol => ol.id !== levelId)
    });
  }

  function updateOverdueLevelInForm(levelId, field, value) {
    setRuleForm({
      ...ruleForm,
      overdueLevels: ruleForm.overdueLevels.map(ol =>
        ol.id === levelId ? { ...ol, [field]: field === 'label' ? value : Number(value) } : ol
      )
    });
  }

  function repairRecords() {
    const next = records.map(item => {
      if (item.nextDate && item.lastDate) return item;
      if (!item.lastDate) return item;
      const autoNext = calcNextDate(item.lastDate, item.species, item.vaccine, templates);
      if (!autoNext) return item;
      return { ...item, nextDate: autoNext };
    });
    persist(next);
    const count = next.filter((r, i) => r.nextDate !== records[i].nextDate).length;
    alert(`已修复 ${count} 条记录的下次提醒日期`);
  }

  function handleRecalcByTemplate() {
    if (recalcTimerRef.current) {
      clearTimeout(recalcTimerRef.current);
      recalcTimerRef.current = null;
    }

    if (!form.lastDate) {
      setRecalcNotice({ type: 'warning', message: '请先选择上次接种日期' });
      recalcTimerRef.current = setTimeout(() => setRecalcNotice(null), 3000);
      return;
    }
    if (!form.species) {
      setRecalcNotice({ type: 'warning', message: '请先选择物种' });
      recalcTimerRef.current = setTimeout(() => setRecalcNotice(null), 3000);
      return;
    }
    if (!form.vaccine) {
      setRecalcNotice({ type: 'warning', message: '请先选择疫苗类型' });
      recalcTimerRef.current = setTimeout(() => setRecalcNotice(null), 3000);
      return;
    }

    const matched = templates.find(t => t.species === form.species && t.vaccine === form.vaccine);
    const autoNext = calcNextDate(form.lastDate, form.species, form.vaccine, templates);

    if (matched && autoNext) {
      setForm({ ...form, nextDate: autoNext });
      setNextDateManual(false);
      setRecalcNotice({
        type: 'success',
        message: `已按模板重新计算：${form.species} + ${form.vaccine}（${matched.days}天）→ ${autoNext}`
      });
    } else {
      setRecalcNotice({
        type: 'warning',
        message: `未找到匹配模板（物种：${form.species}，疫苗：${form.vaccine}），请在"复种周期模板"页面添加配置，或手动填写下次提醒日期`
      });
    }

    recalcTimerRef.current = setTimeout(() => setRecalcNotice(null), 5000);
  }

  function addRecord(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedValues = Object.fromEntries(formData.entries());
    const submittedRecord = { ...form, ...submittedValues };
    const autoNext = calcNextDate(submittedRecord.lastDate, submittedRecord.species, submittedRecord.vaccine, templates);
    const finalNextDate = submittedRecord.nextDate || autoNext;
    const ruleDefaultStatus = getDefaultStatusForVaccine(submittedRecord.vaccine, rules);
    const finalStatus = submittedRecord.status || ruleDefaultStatus;
    const nextRecord = {
      id: uid(),
      ...submittedRecord,
      nextDate: finalNextDate,
      status: finalStatus,
      createdAt: new Date().toISOString(),
      timeline: [{ status: finalStatus, at: today, by: '录入' }],
      notes: [],
      schemaVersion: SCHEMA_VERSION
    };

    if (appConfig.conflict === 'date-slot' && records.some((item) => item.date === nextRecord.date && item.slot === nextRecord.slot)) {
      nextRecord.conflict = true;
    }
    if (appConfig.conflict === 'bed-time' && hasOverlap(nextRecord, records)) {
      nextRecord.conflict = true;
    }
    if (appConfig.chart) {
      const temp = Number(nextRecord.temperature || 0);
      nextRecord.temps = [temp];
      if (temp > 2) nextRecord.status = '异常';
    }

    persist([nextRecord, ...records]);
    setForm(appConfig.defaultValues);
    setNextDateManual(false);
    setSelected(nextRecord);
  }

  function addNote(recordId) {
    if (!newNoteContent.trim()) return;
    const note = {
      id: uid(),
      content: newNoteContent.trim(),
      createdAt: new Date().toISOString(),
      createdBy: newNoteOperator.trim() || '未署名'
    };
    const next = records.map((item) => item.id === recordId ? {
      ...item,
      notes: [...(item.notes || []), note]
    } : item);
    persist(next);
    const updated = next.find((item) => item.id === recordId);
    if (selected?.id === recordId) setSelected(updated);
    setNewNoteContent('');
    setNewNoteOperator('');
  }

  function removeNote(recordId, noteId) {
    const next = records.map((item) => item.id === recordId ? {
      ...item,
      notes: (item.notes || []).filter((n) => n.id !== noteId)
    } : item);
    persist(next);
    const updated = next.find((item) => item.id === recordId);
    if (selected?.id === recordId) setSelected(updated);
  }

  function updateStatus(id, status) {
    const next = records.map((item) => item.id === id ? {
      ...item,
      status,
      timeline: [...(item.timeline || []), { status, at: today, by: '操作员' }]
    } : item);
    persist(next);
    if (selected?.id === id) setSelected(next.find((item) => item.id === id));
  }

  function rescheduleRecord(id, newDate) {
    const target = records.find((item) => item.id === id);
    if (!target || target.nextDate === newDate) return;
    const next = records.map((item) => item.id === id ? {
      ...item,
      nextDate: newDate,
      timeline: [...(item.timeline || []), { status: item.status, at: today, by: '改期', note: `改期至 ${newDate}` }]
    } : item);
    persist(next);
    if (selected?.id === id) setSelected(next.find((item) => item.id === id));
    setSelectedContactIds((prev) => {
      if (!prev.has(id)) return prev;
      const nextSet = new Set(prev);
      nextSet.delete(id);
      return nextSet;
    });
  }

  function batchUpdateStatus(ids, status, operator = '批量操作') {
    if (ids.size === 0) return;
    const batchTimelineEntry = { status, at: today, by: operator.trim() || '批量操作' };
    const next = records.map((item) => ids.has(item.id) ? {
      ...item,
      status,
      timeline: [...(item.timeline || []), batchTimelineEntry]
    } : item);
    persist(next);
    if (selected && ids.has(selected.id)) {
      setSelected(next.find((item) => item.id === selected.id));
    }
    setSelectedContactIds(new Set());
  }

  function toggleContactSelection(id) {
    const next = new Set(selectedContactIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedContactIds(next);
  }

  function toggleGroupSelection(items) {
    const allSelected = items.every(item => selectedContactIds.has(item.id));
    const next = new Set(selectedContactIds);
    if (allSelected) {
      items.forEach(item => next.delete(item.id));
    } else {
      items.forEach(item => next.add(item.id));
    }
    setSelectedContactIds(next);
  }

  function clearContactSelection() {
    setSelectedContactIds(new Set());
  }

  function removeRecord(id) {
    const next = records.filter((item) => item.id !== id);
    persist(next);
    if (selected?.id === id) setSelected(null);
  }

  function duplicateRecord(item) {
    const dupStatus = getDefaultStatusForVaccine(item.vaccine, rules);
    const copied = { ...item, id: uid(), status: dupStatus, timeline: [{ status: dupStatus, at: today, by: '复制' }], notes: [], schemaVersion: SCHEMA_VERSION };
    persist([copied, ...records]);
    setSelected(copied);
  }

  function addTemperature(item) {
    const value = Number(prompt('录入新的温度读数'));
    if (!Number.isFinite(value)) return;
    const next = records.map((record) => record.id === item.id ? {
      ...record,
      temps: [...(record.temps || []), value],
      temperature: String(value),
      status: value > 2 ? '异常' : record.status
    } : record);
    persist(next);
    setSelected(next.find((record) => record.id === item.id));
  }

  function parseCSV(text) {
    const lines = text.replace(/\r\n/g, '\n').split('\n').filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1).map(line => parseCSVLine(line));
    return { headers, rows };
  }

  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  function detectFieldMapping(headers) {
    const fieldMap = {};
    const headerLower = headers.map(h => h.toLowerCase().trim());
    const fieldRules = {
      vaccine: ['疫苗类型', '疫苗', 'vaccine', 'vaccination'],
      pet: ['宠物姓名', '宠物名', 'pet', 'name', '姓名'],
      species: ['物种', '种类', 'species', 'type'],
      ownerPhone: ['主人联系方式', '联系电话', '电话', '手机', 'ownerphone', 'phone', 'telephone', 'contact'],
      lastDate: ['上次接种日期', '上次接种', '最后接种', 'lastdate', 'last_date', 'last'],
      nextDate: ['下次提醒日期', '下次接种', '提醒日期', 'nextdate', 'next_date', 'next', 'due']
    };
    headerLower.forEach((header, index) => {
      for (const [field, keywords] of Object.entries(fieldRules)) {
        if (keywords.some(kw => header.includes(kw.toLowerCase()))) {
          fieldMap[field] = index;
          break;
        }
      }
    });
    return fieldMap;
  }

  function isValidDate(dateStr) {
    if (!dateStr) return false;
    const formats = [
      /^\d{4}-\d{1,2}-\d{1,2}$/,
      /^\d{4}\/\d{1,2}\/\d{1,2}$/,
      /^\d{4}年\d{1,2}月\d{1,2}日$/,
      /^\d{1,2}-\d{1,2}-\d{4}$/,
      /^\d{1,2}\/\d{1,2}\/\d{4}$/
    ];
    if (!formats.some(f => f.test(dateStr.trim()))) return false;
    const normalized = dateStr.trim().replace(/[年月]/g, '-').replace(/日/g, '').replace(/\//g, '-');
    const parts = normalized.split('-');
    let year, month, day;
    if (parts[0].length === 4) {
      [year, month, day] = parts;
    } else {
      [month, day, year] = parts;
    }
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    if (y <= 2000 || y >= 2100) return false;
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  }

  function normalizeDate(dateStr) {
    if (!dateStr) return '';
    const normalized = dateStr.trim().replace(/[年月]/g, '-').replace(/日/g, '').replace(/\//g, '-');
    const parts = normalized.split('-');
    let year, month, day;
    if (parts[0].length === 4) {
      [year, month, day] = parts;
    } else {
      [month, day, year] = parts;
    }
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  function isValidPhone(phone) {
    if (!phone) return false;
    const clean = String(phone).replace(/\s|-/g, '');
    return /^1[3-9]\d{9}$/.test(clean) || /^\d{7,8}$/.test(clean);
  }

  function normalizePhone(phone) {
    if (!phone) return '';
    return String(phone).replace(/\s|-/g, '');
  }

  function validateRow(row, fieldMapping, headers, rowIndex, missingRequiredFields) {
    const errors = [];
    const warnings = [];
    const data = {};
    if (missingRequiredFields.length > 0) {
      return { valid: false, errors: [], warnings, data: null, skipped: true };
    }
    for (const [field, colIndex] of Object.entries(fieldMapping)) {
      const rawValue = row[colIndex] || '';
      data[field] = rawValue;
    }
    if (fieldMapping.pet !== undefined) {
      if (!data.pet || !data.pet.trim()) {
        errors.push('宠物姓名不能为空');
      }
    }
    if (fieldMapping.ownerPhone !== undefined) {
      if (!data.ownerPhone || !data.ownerPhone.trim()) {
        errors.push('主人联系方式不能为空');
      } else if (!isValidPhone(data.ownerPhone)) {
        errors.push(`联系方式格式不正确：${data.ownerPhone}`);
      }
    }
    if (fieldMapping.vaccine !== undefined) {
      if (!data.vaccine || !data.vaccine.trim()) {
        errors.push('疫苗类型不能为空');
      } else if (!appConfig.fields.find(f => f.key === 'vaccine').options.includes(data.vaccine.trim())) {
        warnings.push(`疫苗类型"${data.vaccine}"不在预设选项中，将保留原值`);
      }
    }
    if (fieldMapping.species !== undefined && data.species && !appConfig.fields.find(f => f.key === 'species').options.includes(data.species.trim())) {
      warnings.push(`物种"${data.species}"不在预设选项中，将保留原值`);
    }
    if (fieldMapping.lastDate !== undefined && data.lastDate && !isValidDate(data.lastDate)) {
      errors.push(`上次接种日期格式不正确：${data.lastDate}（请使用YYYY-MM-DD格式）`);
    }
    if (fieldMapping.nextDate !== undefined) {
      if (!data.nextDate || !data.nextDate.trim()) {
        errors.push('下次提醒日期不能为空');
      } else if (!isValidDate(data.nextDate)) {
        errors.push(`下次提醒日期格式不正确：${data.nextDate}（请使用YYYY-MM-DD格式）`);
      }
    }
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      data: {
        pet: data.pet?.trim() || '',
        species: data.species?.trim() || appConfig.defaultValues.species,
        ownerPhone: normalizePhone(data.ownerPhone),
        vaccine: data.vaccine?.trim() || '',
        lastDate: data.lastDate ? normalizeDate(data.lastDate) : '',
        nextDate: data.nextDate ? normalizeDate(data.nextDate) : ''
      }
    };
  }

  function findDuplicates(validRows, existingRecords) {
    const phoneCounts = {};
    const existingPhones = new Set(existingRecords.map(r => normalizePhone(r.ownerPhone)));
    validRows.forEach(row => {
      const phone = row.data.ownerPhone;
      phoneCounts[phone] = (phoneCounts[phone] || 0) + 1;
    });
    const fileDuplicates = Object.entries(phoneCounts)
      .filter(([, count]) => count > 1)
      .map(([phone]) => phone);
    const existingDuplicates = validRows
      .filter(row => existingPhones.has(row.data.ownerPhone))
      .map(row => row.data.ownerPhone);
    return { fileDuplicates, existingDuplicates: [...new Set(existingDuplicates)] };
  }

  const requiredFields = ['pet', 'ownerPhone', 'vaccine', 'nextDate'];

  function buildImportPreview(fileName, headers, rows, fieldMapping) {
    const missingRequiredFields = requiredFields.filter(field => fieldMapping[field] === undefined);
    const missingRequiredFieldLabels = missingRequiredFields.map(
      field => appConfig.fields.find(f => f.key === field)?.label || field
    );
    const validatedRows = rows.map((row, index) => ({
      rowIndex: index + 2,
      ...validateRow(row, fieldMapping, headers, index + 2, missingRequiredFields),
      rawRow: row
    }));
    const validRows = validatedRows.filter(r => r.valid);
    const errorRows = validatedRows.filter(r => !r.valid && !r.skipped);
    const { fileDuplicates, existingDuplicates } = findDuplicates(validRows, records);
    const detectedFields = appConfig.fields.map(field => ({
      ...field,
      detected: fieldMapping[field.key] !== undefined,
      sourceColumn: fieldMapping[field.key] !== undefined ? headers[fieldMapping[field.key]] : null,
      required: requiredFields.includes(field.key)
    }));
    return {
      fileName,
      totalRows: rows.length,
      headers,
      fieldMapping,
      detectedFields,
      validRows,
      errorRows,
      fileDuplicates,
      existingDuplicates,
      missingRequiredFields: missingRequiredFieldLabels,
      allWarnings: validRows.flatMap(r => r.warnings.map(w => `第${r.rowIndex}行：${w}`))
    };
  }

  function handleFieldMappingChange(fieldKey, columnIndex) {
    if (!importPreview || !rawCSVData) return;
    const newMapping = { ...importPreview.fieldMapping };
    if (columnIndex === null || columnIndex === undefined || columnIndex === '') {
      delete newMapping[fieldKey];
    } else {
      newMapping[fieldKey] = Number(columnIndex);
    }
    const preview = buildImportPreview(
      importPreview.fileName,
      rawCSVData.headers,
      rawCSVData.rows,
      newMapping
    );
    setImportPreview(preview);
  }

  function processCSVFile(file) {
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const { headers, rows } = parseCSV(text);
        setRawCSVData({ headers, rows });
        const fieldMapping = detectFieldMapping(headers);
        const preview = buildImportPreview(file.name, headers, rows, fieldMapping);
        setImportPreview(preview);
      } catch (error) {
        alert('CSV文件解析失败，请检查文件格式');
        console.error(error);
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      processCSVFile(file);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      processCSVFile(file);
    } else {
      alert('请上传CSV格式的文件');
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function confirmImport() {
    if (!importPreview) return;
    const newRecords = importPreview.validRows.map(row => {
      const importStatus = getDefaultStatusForVaccine(row.data.vaccine, rules);
      return {
        id: uid(),
        ...row.data,
        status: importStatus,
        createdAt: new Date().toISOString(),
        timeline: [{ status: importStatus, at: today, by: '批量导入' }],
        notes: [],
        schemaVersion: SCHEMA_VERSION
      };
    });
    persist([...newRecords, ...records]);
    setShowImportModal(false);
    setImportPreview(null);
    setImportFile(null);
    setRawCSVData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    alert(`成功导入 ${newRecords.length} 条记录`);
  }

  function cancelImport() {
    setShowImportModal(false);
    setImportPreview(null);
    setImportFile(null);
    setRawCSVData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function exportToJSON() {
    const exportData = {
      version: BACKUP_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      appId: appConfig.id,
      storageKey: appConfig.storage,
      recordCount: records.length,
      records: records,
      templates: templates,
      rules: rules,
      filters: filters,
      groupMode: groupMode,
      ownerInfo: ownerInfo
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = formatLocalDate(new Date());
    link.download = `宠物疫苗提醒数据_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const EXPECTED_FORMAT_SAMPLE = [
    '{',
    '  "version": 1,',
    '  "appId": "hxwl-61304",',
    '  "records": [',
    '    {',
    '      "pet": "宠物姓名（必填）",',
    '      "ownerPhone": "13800008888（必填）",',
    '      "vaccine": "猫三联（必填）",',
    '      "nextDate": "2026-12-31（必填）",',
    '      "species": "猫（可选）",',
    '      "lastDate": "2025-12-31（可选）",',
    '      "status": "待联系（可选）"',
    '    }',
    '  ]',
    '}'
  ].join('\n');

  function getExpectedFormatHint(prefix) {
    return `${prefix}\n\n📋 正确格式示例：\n${EXPECTED_FORMAT_SAMPLE}`;
  }

  function buildValidationResult({ valid = true, errors = [], warnings = [], validRecords = [], invalidRecords = [], allWarnings = [], migratedCount = 0, totalRecords = 0, modules = null }) {
    return {
      valid,
      errors: [...errors],
      warnings: [...warnings],
      validRecords: [...validRecords],
      invalidRecords: [...invalidRecords],
      allWarnings: [...allWarnings],
      migratedCount,
      totalRecords: totalRecords || validRecords.length + invalidRecords.length,
      validCount: validRecords.length,
      invalidCount: invalidRecords.length,
      modules
    };
  }

  function validateRestoreData(data) {
    const errors = [];
    const warnings = [];
    const validRecords = [];
    const invalidRecords = [];
    const recordWarnings = [];
    let recordsToProcess = [];
    let migratedCount = 0;

    if (data === null || data === undefined) {
      errors.push(getExpectedFormatHint('❌ 文件内容为空：JSON解析结果为 null/undefined'));
      return buildValidationResult({
        valid: false,
        errors,
        warnings,
        validRecords: [],
        invalidRecords: [],
        allWarnings: [],
        migratedCount: 0,
        totalRecords: 0
      });
    }

    if (typeof data !== 'object') {
      errors.push(getExpectedFormatHint(`❌ 文件格式错误：JSON顶层应为对象或数组，实际为「${typeof data}」类型`));
      return buildValidationResult({
        valid: false,
        errors,
        warnings,
        validRecords: [],
        invalidRecords: [],
        allWarnings: [],
        migratedCount: 0,
        totalRecords: 0
      });
    }

    if (data.records !== undefined && data.records !== null) {
      if (Array.isArray(data.records)) {
        recordsToProcess = data.records;
        if (data.appId && data.appId !== appConfig.id) {
          warnings.push(`⚠️ 备份文件来自不同应用(${data.appId})，可能存在字段不兼容`);
        }
        if (data.version && data.version > BACKUP_FORMAT_VERSION) {
          warnings.push(`⚠️ 备份文件版本(v${data.version})高于当前版本，部分字段可能无法识别`);
        }
      } else {
        const valPreview = JSON.stringify(data.records).slice(0, 60);
        errors.push(getExpectedFormatHint(`❌ 数据格式错误：records字段应为数组，实际为「${typeof data.records}」${valPreview ? `（值：${valPreview}...）` : ''}`));
        return buildValidationResult({
          valid: false,
          errors,
          warnings,
          validRecords: [],
          invalidRecords: [],
          allWarnings: [...warnings],
          migratedCount: 0,
          totalRecords: 0
        });
      }
    } else if (Array.isArray(data)) {
      recordsToProcess = data;
      warnings.push('ℹ️ 备份文件为旧版本格式（直接数组），正在自动转换');
    } else {
      const keys = Object.keys(data);
      const keysInfo = keys.length > 0
        ? `发现顶层字段：${keys.map(k => `「${k}」`).join('、')}`
        : 'JSON对象为空';
      errors.push(getExpectedFormatHint(`❌ 文件结构错误：未找到 records 字段且不是数组格式（${keysInfo}）`));
      return buildValidationResult({
        valid: false,
        errors,
        warnings,
        validRecords: [],
        invalidRecords: [],
        allWarnings: [...warnings],
        migratedCount: 0,
        totalRecords: 0
      });
    }

    if (!Array.isArray(recordsToProcess)) {
      errors.push(getExpectedFormatHint(`❌ 数据格式错误：记录列表应为数组类型，实际为「${typeof recordsToProcess}」`));
      return buildValidationResult({
        valid: false,
        errors,
        warnings,
        validRecords: [],
        invalidRecords: [],
        allWarnings: [...warnings],
        migratedCount: 0,
        totalRecords: 0
      });
    }

    if (recordsToProcess.length === 0) {
      warnings.push('⚠️ 备份文件中没有记录');
    }

    const requiredFields = ['pet', 'ownerPhone', 'vaccine', 'nextDate'];
    const validatedWithWarnings = [];

    recordsToProcess.forEach((record, index) => {
      const recordErrors = [];
      const perRecordWarnings = [];

      if (!record || typeof record !== 'object') {
        invalidRecords.push({ index, errors: ['不是有效的对象'], warnings: [], record });
        return;
      }

      requiredFields.forEach(field => {
        if (!record[field] || String(record[field]).trim() === '') {
          const fieldLabel = appConfig.fields.find(f => f.key === field)?.label || field;
          recordErrors.push(`缺少必填字段：${fieldLabel}`);
        }
      });

      if (record.ownerPhone && !isValidPhone(record.ownerPhone)) {
        recordErrors.push(`联系方式格式不正确：${record.ownerPhone}`);
      }

      if (record.nextDate && !isValidDate(record.nextDate)) {
        recordErrors.push(`下次提醒日期格式不正确：${record.nextDate}`);
      }

      if (record.lastDate && !isValidDate(record.lastDate)) {
        perRecordWarnings.push(`上次接种日期格式不正确，将忽略：${record.lastDate}`);
      }

      const migratedRecord = { ...record };
      let needsMigration = false;

      if (!migratedRecord.timeline || !Array.isArray(migratedRecord.timeline) || migratedRecord.timeline.length === 0) {
        migratedRecord.timeline = [{
          status: migratedRecord.status || appConfig.primaryStatus,
          at: today,
          by: '数据迁移'
        }];
        needsMigration = true;
      }

      if (!migratedRecord.notes || !Array.isArray(migratedRecord.notes)) {
        migratedRecord.notes = [];
        needsMigration = true;
      }

      if (!migratedRecord.status) {
        migratedRecord.status = appConfig.primaryStatus;
        needsMigration = true;
      }

      if (!migratedRecord.id) {
        migratedRecord.id = uid();
        needsMigration = true;
      }

      if (migratedRecord.lastDate && !isValidDate(migratedRecord.lastDate)) {
        migratedRecord.lastDate = '';
        needsMigration = true;
      }

      if (migratedRecord.nextDate && isValidDate(migratedRecord.nextDate)) {
        const normalizedNext = normalizeDate(migratedRecord.nextDate);
        if (normalizedNext !== record.nextDate) {
          migratedRecord.nextDate = normalizedNext;
          needsMigration = true;
        }
      }

      if (migratedRecord.ownerPhone) {
        const normalizedPhone = normalizePhone(migratedRecord.ownerPhone);
        if (normalizedPhone !== migratedRecord.ownerPhone) {
          migratedRecord.ownerPhone = normalizedPhone;
          needsMigration = true;
        }
      }

      if (!migratedRecord.schemaVersion || migratedRecord.schemaVersion < SCHEMA_VERSION) {
        migratedRecord.schemaVersion = SCHEMA_VERSION;
        needsMigration = true;
      }

      if (needsMigration) migratedCount++;

      if (recordErrors.length > 0) {
        invalidRecords.push({ index, errors: recordErrors, warnings: perRecordWarnings, record });
      } else {
        validatedWithWarnings.push({ record: migratedRecord, warnings: perRecordWarnings });
        validRecords.push(migratedRecord);
      }
    });

    if (migratedCount > 0) {
      warnings.push(`✅ 已自动迁移 ${migratedCount} 条旧版本记录（补充timeline等字段）`);
    }

    if (invalidRecords.length > 0) {
      errors.push(`⚠️ ${invalidRecords.length} 条记录存在错误，将被跳过（可查看下方详细列表）`);
    }

    const allWarningsList = [
      ...warnings,
      ...validatedWithWarnings.flatMap((v, i) => v.warnings.map(w => `记录${i + 1}：${w}`))
    ];

    const hasFatalErrors = errors.some(e => !e.includes('条记录存在错误'));

    const hasTemplates = Array.isArray(data?.templates) && data.templates.length > 0;
    const hasRules = Array.isArray(data?.rules) && data.rules.length > 0;
    const hasFilters = data?.filters !== undefined && data?.filters !== null && typeof data.filters === 'object';
    const hasGroupMode = data?.groupMode !== undefined && data?.groupMode !== null;
    const isLegacyFormat = !(hasTemplates || hasRules || hasFilters || hasGroupMode);

    const modules = {
      records: true,
      templates: hasTemplates,
      rules: hasRules,
      filters: hasFilters,
      groupMode: hasGroupMode,
      isLegacyFormat: isLegacyFormat
    };

    return buildValidationResult({
      valid: !hasFatalErrors,
      errors,
      warnings,
      validRecords,
      invalidRecords,
      allWarnings: allWarningsList,
      migratedCount,
      totalRecords: recordsToProcess.length,
      modules
    });
  }

  function calculateRestoreChanges(validRecords) {
    const existingIds = new Set(records.map(r => r.id));
    const existingKeyMap = new Map();
    records.forEach(r => {
      const key = `${normalizePhone(r.ownerPhone)}-${r.pet}-${r.vaccine}`;
      existingKeyMap.set(key, r);
    });

    let addCount = 0;
    let overwriteCount = 0;
    let skipCount = 0;
    const addRecords = [];
    const overwriteRecords = [];
    const skipRecords = [];

    validRecords.forEach(record => {
      const normalizedRecord = {
        ...record,
        ownerPhone: normalizePhone(record.ownerPhone),
        lastDate: record.lastDate && isValidDate(record.lastDate) ? normalizeDate(record.lastDate) : '',
        nextDate: normalizeDate(record.nextDate)
      };

      if (existingIds.has(record.id)) {
        overwriteCount++;
        overwriteRecords.push({
          newRecord: normalizedRecord,
          existingRecord: records.find(r => r.id === record.id)
        });
      } else {
        const key = `${normalizedRecord.ownerPhone}-${normalizedRecord.pet}-${normalizedRecord.vaccine}`;
        const existingByKey = existingKeyMap.get(key);
        if (existingByKey) {
          skipCount++;
          skipRecords.push({
            newRecord: normalizedRecord,
            existingRecord: existingByKey,
            reason: '已存在相同宠物+疫苗的记录'
          });
        } else {
          addCount++;
          addRecords.push(normalizedRecord);
        }
      }
    });

    return {
      addCount,
      overwriteCount,
      skipCount,
      addRecords,
      overwriteRecords,
      skipRecords,
      totalValid: validRecords.length
    };
  }

  function processRestoreFile(file) {
    setRestoreError(null);
    setRestorePreview(null);

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setRestoreError({ type: 'format', message: '请上传JSON格式的备份文件' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          const parseHint = getExpectedFormatHint(
            `❌ JSON解析失败：文件内容不是有效的JSON格式\n` +
            `错误详情：${parseError instanceof Error ? parseError.message.replace(/^JSON\.parse: /, '') : String(parseError)}`
          );
          setRestoreError({ type: 'format', message: parseHint });
          return;
        }

        const validation = validateRestoreData(data);

        if (!validation.valid && validation.validRecords.length === 0) {
          setRestoreError({
            type: 'validation',
            message: validation.errors.join('\n\n'),
            details: validation
          });
          return;
        }

        const changes = calculateRestoreChanges(validation.validRecords);

        if (validation.modules) {
          setRestoreRecords(true);
          setRestoreTemplates(validation.modules.templates);
          setRestoreRules(validation.modules.rules);
          setRestoreFilters(validation.modules.filters);
          setRestoreGroupMode(validation.modules.groupMode);
        } else {
          setRestoreRecords(true);
          setRestoreTemplates(false);
          setRestoreRules(false);
          setRestoreFilters(false);
          setRestoreGroupMode(false);
        }

        setRestoreFile(file);
        setRestorePreview({
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(2),
          exportedAt: data.exportedAt || null,
          version: data.version || 0,
          validation,
          changes,
          rawData: data,
          modules: validation.modules
        });
        setBackupRestoreStep('preview');
      } catch (error) {
        setRestoreError({ type: 'unknown', message: '处理文件时发生未知错误' });
        console.error(error);
      }
    };
    reader.onerror = () => {
      setRestoreError({ type: 'io', message: '读取文件失败' });
    };
    reader.readAsText(file, 'UTF-8');
  }

  function handleRestoreFileUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      processRestoreFile(file);
    }
  }

  function handleRestoreDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processRestoreFile(file);
    } else {
      setRestoreError({ type: 'format', message: '请上传JSON格式的备份文件' });
    }
  }

  function handleRestoreDragOver(e) {
    e.preventDefault();
  }

  function confirmRestore() {
    if (!restorePreview) return;

    if (!restoreRecords && !restoreTemplates && !restoreRules && !restoreFilters && !restoreGroupMode) {
      alert('请至少选择一个要恢复的模块');
      return;
    }

    const { changes, rawData } = restorePreview;
    const isLegacy = restorePreview.modules?.isLegacyFormat;

    if (restoreRecords) {
      const mergedRecords = [...records];

      changes.overwriteRecords.forEach(({ newRecord }) => {
        const idx = mergedRecords.findIndex(r => r.id === newRecord.id);
        if (idx !== -1) {
          mergedRecords[idx] = newRecord;
        }
      });

      changes.addRecords.forEach(newRecord => {
        mergedRecords.unshift(newRecord);
      });

      persist(mergedRecords);
    }

    if (!isLegacy && rawData) {
      if (restoreTemplates && rawData.templates && Array.isArray(rawData.templates)) {
        saveTemplates(rawData.templates.map(t => ({ ...t })));
      }
      if (restoreRules && rawData.rules && Array.isArray(rawData.rules)) {
        saveRules(rawData.rules.map(r => ({ ...r, overdueLevels: (r.overdueLevels || []).map(ol => ({ ...ol })) })));
      }
      if (restoreFilters && rawData.filters && typeof rawData.filters === 'object') {
        saveFilters(normalizeFilters(rawData.filters));
      }
      if (restoreGroupMode && rawData.groupMode) {
        saveGroupMode(rawData.groupMode);
      }
    }

    const msgParts = [];
    if (restoreRecords) {
      msgParts.push(`记录：新增 ${changes.addCount} 条，覆盖 ${changes.overwriteCount} 条，跳过 ${changes.skipCount} 条`);
    }
    if (!isLegacy) {
      if (restoreTemplates) msgParts.push('模板：已覆盖');
      if (restoreRules) msgParts.push('规则：已覆盖');
      if (restoreFilters) msgParts.push('筛选条件：已覆盖');
      if (restoreGroupMode) msgParts.push('分组模式：已覆盖');
    }

    cancelRestore();
    alert(`恢复完成：\n${msgParts.join('\n')}`);
  }

  function cancelRestore() {
    setShowBackupRestoreModal(false);
    setBackupRestoreStep('main');
    setRestorePreview(null);
    setRestoreFile(null);
    setRestoreError(null);
    setRestoreRecords(true);
    setRestoreTemplates(false);
    setRestoreRules(false);
    setRestoreFilters(false);
    setRestoreGroupMode(false);
    if (restoreFileInputRef.current) {
      restoreFileInputRef.current.value = '';
    }
  }

  const filteredRecords = useMemo(() => {
    return records
      .filter((item) => !filters.query || `${item.pet}${item.ownerPhone}`.includes(filters.query))
      .filter((item) => filters.status === '全部' || item.status === filters.status)
      .filter((item) => filters.species === '全部' || item.species === filters.species)
      .filter((item) => filters.vaccine === '全部' || item.vaccine === filters.vaccine)
      .sort((a, b) => {
        if (appConfig.sort === 'priority') {
          const rank = priorityRank(a.priority) - priorityRank(b.priority);
          if (rank !== 0) return rank;
        }
        const aOverdue = isOverdue(a.nextDate);
        const bOverdue = isOverdue(b.nextDate);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        if (aOverdue && bOverdue) {
          const aDays = Math.abs(daysDiff(a.nextDate));
          const bDays = Math.abs(daysDiff(b.nextDate));
          const aLevel = getOverdueLevel(aDays, a.vaccine, rules);
          const bLevel = getOverdueLevel(bDays, b.vaccine, rules);
          if (aLevel && bLevel && aLevel.level !== bLevel.level) {
            return bLevel.level - aLevel.level;
          }
          return bDays - aDays;
        }
        const aDate = a[appConfig.dateKey] || a.sentAt || a.createdAt || '';
        const bDate = b[appConfig.dateKey] || b.sentAt || b.createdAt || '';
        return String(aDate).localeCompare(String(bDate));
      });
  }, [records, filters, rules]);

  const metrics = [
    { label: "宠物数", value: filteredRecords.length },
    { label: "待联系", value: filteredRecords.filter((item) => item.status === '待联系').length },
    { label: "即将到期", value: filteredRecords.filter((item) => {
      if (!item.nextDate) return false;
      const adv = getAdvanceDays(item.vaccine, rules);
      return inNextDays(item.nextDate, adv);
    }).length },
  ];

  const contactListGroups = useMemo(() => {
    const overdueByLevel = {};
    const todayList = [];
    const upcomingList = [];
    filteredRecords.forEach(item => {
      if (isOverdue(item.nextDate)) {
        const diff = Math.abs(daysDiff(item.nextDate));
        const level = getOverdueLevel(diff, item.vaccine, rules);
        const key = level ? level.label : '逾期';
        if (!overdueByLevel[key]) overdueByLevel[key] = [];
        overdueByLevel[key].push({ ...item, overdueDays: diff, overdueLevel: level });
      } else if (isToday(item.nextDate)) {
        todayList.push(item);
      } else {
        const adv = getAdvanceDays(item.vaccine, rules);
        if (isWithinNextDays(item.nextDate, adv)) {
          upcomingList.push(item);
        }
      }
    });
    Object.keys(overdueByLevel).forEach(key => {
      overdueByLevel[key].sort((a, b) => a.overdueDays - b.overdueDays);
    });
    todayList.sort((a, b) => parseLocalDate(a.nextDate) - parseLocalDate(b.nextDate));
    upcomingList.sort((a, b) => parseLocalDate(a.nextDate) - parseLocalDate(b.nextDate));
    return { overdueByLevel, today: todayList, upcoming: upcomingList };
  }, [filteredRecords, rules]);

  const allContactRecords = useMemo(() => {
    const all = [];
    Object.values(contactListGroups.overdueByLevel).forEach(items => all.push(...items));
    all.push(...contactListGroups.today);
    all.push(...contactListGroups.upcoming);
    return all;
  }, [contactListGroups]);

  const pendingContactRecords = useMemo(() => {
    return allContactRecords.filter(item => item.status === '待联系');
  }, [allContactRecords]);

  const selectedPendingCount = useMemo(() => {
    let count = 0;
    selectedContactIds.forEach(id => {
      const item = allContactRecords.find(r => r.id === id);
      if (item && item.status === '待联系') count++;
    });
    return count;
  }, [selectedContactIds, allContactRecords]);

  const groupedByDate = useMemo(() => {
    if (groupMode === 'auto') {
      return filteredRecords.reduce((acc, item) => {
        const autoGroup = getAutoGroupForVaccine(item.vaccine, rules);
        let key;
        if (autoGroup === 'vaccine') {
          key = item.vaccine || '未分类';
        } else if (autoGroup === 'status') {
          key = item.status || '未知';
        } else if (autoGroup === 'overdue') {
          if (isOverdue(item.nextDate)) {
            const diff = Math.abs(daysDiff(item.nextDate));
            const level = getOverdueLevel(diff, item.vaccine, rules);
            key = level ? level.label : '逾期';
          } else if (isToday(item.nextDate)) {
            key = '今日到期';
          } else {
            const adv = getAdvanceDays(item.vaccine, rules);
            if (isWithinNextDays(item.nextDate, adv)) {
              key = '即将到期';
            } else {
              key = '未到提醒期';
            }
          }
        } else {
          key = item[appConfig.dateKey] || item.date || item.enrollDate || '未排期';
        }
        (acc[key] ||= []).push(item);
        return acc;
      }, {});
    } else if (groupMode === 'vaccine') {
      return filteredRecords.reduce((acc, item) => {
        const key = item.vaccine || '未分类';
        (acc[key] ||= []).push(item);
        return acc;
      }, {});
    } else if (groupMode === 'status') {
      return filteredRecords.reduce((acc, item) => {
        const key = item.status || '未知';
        (acc[key] ||= []).push(item);
        return acc;
      }, {});
    } else if (groupMode === 'overdue') {
      return filteredRecords.reduce((acc, item) => {
        let key;
        if (isOverdue(item.nextDate)) {
          const diff = Math.abs(daysDiff(item.nextDate));
          const level = getOverdueLevel(diff, item.vaccine, rules);
          key = level ? level.label : '逾期';
        } else if (isToday(item.nextDate)) {
          key = '今日到期';
        } else {
          const adv = getAdvanceDays(item.vaccine, rules);
          if (isWithinNextDays(item.nextDate, adv)) {
            key = '即将到期';
          } else {
            key = '未到提醒期';
          }
        }
        (acc[key] ||= []).push(item);
        return acc;
      }, {});
    }
    return filteredRecords.reduce((acc, item) => {
      const key = item[appConfig.dateKey] || item.date || item.enrollDate || '未排期';
      (acc[key] ||= []).push(item);
      return acc;
    }, {});
  }, [filteredRecords, rules, groupMode]);

  const calendarRecords = useMemo(() => {
    return records
      .filter((item) => !filters.query || `${item.pet}${item.ownerPhone}`.includes(filters.query))
      .filter((item) => filters.status === '全部' || item.status === filters.status)
      .filter((item) => filters.species === '全部' || item.species === filters.species)
      .filter((item) => filters.vaccine === '全部' || item.vaccine === filters.vaccine)
      .reduce((acc, item) => {
        const date = item.nextDate;
        if (date) {
          (acc[date] ||= []).push(item);
        }
        return acc;
      }, {});
  }, [records, filters, rules]);

  function getCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const days = [];
    for (let i = 0; i < startDay; i++) {
      const d = new Date(year, month, -startDay + i + 1);
      days.push({
        date: formatLocalDate(d),
        day: d.getDate(),
        isCurrentMonth: false,
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: formatLocalDate(d),
        day: i,
        isCurrentMonth: true,
      });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: formatLocalDate(d),
        day: i,
        isCurrentMonth: false,
      });
    }
    return days;
  }

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    return getCalendarDays(year, month);
  }, [calendarDate]);

  function getDayStats(date) {
    const items = calendarRecords[date] || [];
    const pending = items.filter(i => i.status === '待联系').length;
    const contacted = items.filter(i => i.status === '已联系').length;
    const done = items.filter(i => i.status === '已接种').length;

    const upcoming = items.filter(i => {
      if (!i.nextDate) return false;
      if (isOverdue(i.nextDate) || isToday(i.nextDate)) return false;
      const adv = getAdvanceDays(i.vaccine, rules);
      return isWithinNextDays(i.nextDate, adv);
    }).length;

    const overdueByLevel = {};
    let highestOverdueLevel = -1;
    items.forEach(item => {
      if (isOverdue(item.nextDate) && item.status === '待联系') {
        const diff = Math.abs(daysDiff(item.nextDate));
        const level = getOverdueLevel(diff, item.vaccine, rules);
        const key = level ? level.label : '逾期';
        overdueByLevel[key] = (overdueByLevel[key] || 0) + 1;
        if (level && level.level > highestOverdueLevel) {
          highestOverdueLevel = level.level;
        }
      }
    });

    return {
      total: items.length,
      pending,
      contacted,
      done,
      upcoming,
      overdueByLevel,
      highestOverdueLevel,
      items,
    };
  }

  const calendarMonthStats = useMemo(() => {
    const stats = {
      total: 0,
      pending: 0,
      done: 0,
      upcoming: 0,
      overdue: 0,
      overdueByLevel: {}
    };

    Object.keys(calendarRecords).forEach(date => {
      const d = new Date(date);
      if (d.getFullYear() !== calendarDate.getFullYear() || d.getMonth() !== calendarDate.getMonth()) return;

      const dayStats = getDayStats(date);
      stats.total += dayStats.total;
      stats.pending += dayStats.pending;
      stats.done += dayStats.done;
      stats.upcoming += dayStats.upcoming;
      Object.entries(dayStats.overdueByLevel).forEach(([level, count]) => {
        stats.overdue += count;
        stats.overdueByLevel[level] = (stats.overdueByLevel[level] || 0) + count;
      });
    });

    return stats;
  }, [calendarRecords, calendarDate, rules]);

  function getGroupForRecordWithRule(item, ruleOverride) {
    const effectiveRule = ruleOverride && ruleOverride.vaccine === item.vaccine ? ruleOverride : getRuleForVaccine(item.vaccine, rules);
    const autoGroup = effectiveRule ? (effectiveRule.autoGroup || 'overdue') : getAutoGroupForVaccine(item.vaccine, rules);
    const effectiveRules = ruleOverride
      ? rules.map(r => r.vaccine === ruleOverride.vaccine ? ruleOverride : r)
      : rules;

    let key;
    if (autoGroup === 'vaccine') {
      key = item.vaccine || '未分类';
    } else if (autoGroup === 'status') {
      key = item.status || '未知';
    } else if (autoGroup === 'overdue') {
      if (isOverdue(item.nextDate)) {
        const diff = Math.abs(daysDiff(item.nextDate));
        const level = ruleOverride && ruleOverride.vaccine === item.vaccine
          ? (() => {
              if (!ruleOverride.overdueLevels || ruleOverride.overdueLevels.length === 0) {
                if (diff <= 7) return { label: '轻度逾期', level: 0 };
                if (diff <= 30) return { label: '中度逾期', level: 1 };
                return { label: '重度逾期', level: 2 };
              }
              for (let i = 0; i < ruleOverride.overdueLevels.length; i++) {
                const ol = ruleOverride.overdueLevels[i];
                if (diff >= ol.min && diff <= ol.max) {
                  return { label: ol.label, level: i };
                }
              }
              const last = ruleOverride.overdueLevels[ruleOverride.overdueLevels.length - 1];
              return { label: last.label, level: ruleOverride.overdueLevels.length - 1 };
            })()
          : getOverdueLevel(diff, item.vaccine, effectiveRules);
        key = level ? level.label : '逾期';
      } else if (isToday(item.nextDate)) {
        key = '今日到期';
      } else {
        const adv = ruleOverride && ruleOverride.vaccine === item.vaccine
          ? (ruleOverride.advanceDays || 7)
          : getAdvanceDays(item.vaccine, effectiveRules);
        if (isWithinNextDays(item.nextDate, adv)) {
          key = '即将到期';
        } else {
          key = '未到提醒期';
        }
      }
    } else {
      key = item[appConfig.dateKey] || item.date || item.enrollDate || '未排期';
    }
    return key;
  }

  const rulePreview = useMemo(() => {
    if (!editingRule || !ruleForm.vaccine) return null;

    const affectedVaccine = ruleForm.vaccine;
    const affectedRecords = records.filter(item => item.vaccine === affectedVaccine);

    const oldRule = rules.find(r => r.id === editingRule);
    const newRule = { ...ruleForm, advanceDays: Number(ruleForm.advanceDays) || 7 };

    const oldGroups = {};
    const newGroups = {};

    affectedRecords.forEach(item => {
      const oldGroup = oldRule ? getGroupForRecordWithRule(item, oldRule) : getGroupForRecordWithRule(item, null);
      const newGroup = getGroupForRecordWithRule(item, newRule);

      if (!oldGroups[oldGroup]) oldGroups[oldGroup] = [];
      oldGroups[oldGroup].push(item);

      if (!newGroups[newGroup]) newGroups[newGroup] = [];
      newGroups[newGroup].push(item);
    });

    const allGroupKeys = new Set([...Object.keys(oldGroups), ...Object.keys(newGroups)]);
    const comparison = [];
    allGroupKeys.forEach(key => {
      const oldCount = (oldGroups[key] || []).length;
      const newCount = (newGroups[key] || []).length;
      comparison.push({
        group: key,
        oldCount,
        newCount,
        diff: newCount - oldCount,
        sampleRecords: (newGroups[key] || []).slice(0, 5)
      });
    });

    const changedCount = affectedRecords.filter(item => {
      const oldGroup = oldRule ? getGroupForRecordWithRule(item, oldRule) : getGroupForRecordWithRule(item, null);
      const newGroup = getGroupForRecordWithRule(item, newRule);
      return oldGroup !== newGroup;
    }).length;

    return {
      vaccine: affectedVaccine,
      totalAffected: affectedRecords.length,
      changedCount,
      comparison: comparison.sort((a, b) => b.newCount - a.newCount),
      sampleAffected: affectedRecords.slice(0, 10)
    };
  }, [editingRule, ruleForm, records, rules]);

  function getGroupTagClass(groupName) {
    if (!groupName) return 'group-tag-default';
    const g = groupName;
    if (g.includes('重度') || g.includes('危急')) return 'group-tag-danger';
    if (g.includes('中度')) return 'group-tag-warning';
    if (g.includes('轻度') || g.includes('逾期')) return 'group-tag-caution';
    if (g.includes('今日到期') || g.includes('即将到期')) return 'group-tag-soon';
    if (g.includes('未到') || g.includes('未排期')) return 'group-tag-muted';
    if (g.includes('已接种') || g.includes('完成')) return 'group-tag-success';
    if (g.includes('已联系')) return 'group-tag-info';
    if (g.includes('待联系')) return 'group-tag-pending';
    return 'group-tag-default';
  }

  function prevMonth() {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
    setSelectedCalendarDay(null);
  }

  function nextMonth() {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
    setSelectedCalendarDay(null);
  }

  function goToToday() {
    setCalendarDate(new Date());
    setSelectedCalendarDay(today);
  }

  const directory = useMemo(() => {
    return records.reduce((acc, item) => {
      const key = item.issue || '未分类';
      (acc[key] ||= []).push(item);
      return acc;
    }, {});
  }, [records]);

  const ownerProfiles = useMemo(() => {
    const groups = {};
    records.forEach((record) => {
      const phone = record.ownerPhone || '未知';
      if (!groups[phone]) {
        const info = ownerInfo[phone] || {};
        groups[phone] = {
          ownerPhone: phone,
          pets: [],
          lastContactTime: null,
          pendingCount: 0,
          totalCount: 0,
          note: info.note || '',
          preferredContactTime: info.preferredContactTime || ''
        };
      }
      groups[phone].pets.push(record);
      groups[phone].totalCount++;
      if (record.status === '待联系') {
        groups[phone].pendingCount++;
      }
      const timelineDates = (record.timeline || []).map((t) => new Date(t.at).getTime());
      const noteDates = (record.notes || []).map((n) => new Date(n.createdAt).getTime());
      const allDates = [...timelineDates, ...noteDates];
      if (allDates.length > 0) {
        const latest = Math.max(...allDates);
        if (!groups[phone].lastContactTime || latest > groups[phone].lastContactTime) {
          groups[phone].lastContactTime = latest;
        }
      }
    });
    return Object.values(groups).sort((a, b) => {
      if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount;
      if (b.lastContactTime && a.lastContactTime) return b.lastContactTime - a.lastContactTime;
      return b.totalCount - a.totalCount;
    });
  }, [records, ownerInfo]);

  const filteredOwnerProfiles = useMemo(() => {
    if (!ownerSearch.trim()) return ownerProfiles;
    const query = ownerSearch.trim().toLowerCase();
    return ownerProfiles.filter((profile) => {
      if (profile.ownerPhone.toLowerCase().includes(query)) return true;
      return profile.pets.some((pet) => pet.pet.toLowerCase().includes(query));
    });
  }, [ownerProfiles, ownerSearch]);

  const selectedOwnerProfile = useMemo(() => {
    if (!selectedOwner) return null;
    return ownerProfiles.find((profile) => profile.ownerPhone === selectedOwner.ownerPhone) || selectedOwner;
  }, [ownerProfiles, selectedOwner]);

  useEffect(() => {
    setEditingOwnerInfo(false);
    setOwnerNoteDraft('');
    setOwnerPreferredTimeDraft('');
  }, [selectedOwner]);

  useEffect(() => {
    return () => {
      if (recalcTimerRef.current) {
        clearTimeout(recalcTimerRef.current);
        recalcTimerRef.current = null;
      }
    };
  }, []);

  function jumpToRecord(recordId) {
    const record = records.find((r) => r.id === recordId);
    if (record) {
      setSelected(record);
      setCurrentView('records');
    }
  }

  return (
    <main className="shell" style={{ '--accent': appConfig.accent }}>
      <section className="hero">
        <div>
          <div className="eyebrow"><Syringe size={18} />{appConfig.domain}</div>
          <h1>{appConfig.title}</h1>
          <p>{appConfig.subtitle}</p>
        </div>
        <div className="store-selector-card">
          <div className="store-current">
            <div className="store-icon"><Building2 size={24} /></div>
            <div className="store-info">
              <span className="store-label">当前门店</span>
              <strong className="store-name">{currentStore?.name || '默认门店'}</strong>
            </div>
            <button
              type="button"
              className="store-manage-btn"
              onClick={() => { setShowStoreModal(true); setStoreModalTab('list'); }}
              title="门店管理"
            >
              <Settings size={16} />
            </button>
          </div>
          <div className="store-switcher">
            {stores.map((store) => (
              <button
                key={store.id}
                type="button"
                className={`store-switch-btn ${store.id === currentStoreId ? 'active' : ''}`}
                onClick={() => handleSwitchStore(store.id)}
                title={store.name}
              >
                {store.isDefault && <span className="store-badge-default">默认</span>}
                <span className="store-switch-name">{store.name}</span>
              </button>
            ))}
            <button
              type="button"
              className="store-switch-btn add-store-btn"
              onClick={() => { setShowStoreModal(true); setStoreModalTab('create'); }}
            >
              <Plus size={14} />
              <span>新建门店</span>
            </button>
          </div>
        </div>
      </section>

      <div className="view-tabs">
        <button
          className={`view-tab ${currentView === 'records' ? 'active' : ''}`}
          onClick={() => { setCurrentView('records'); setSelectedOwner(null); setSelectedCalendarDay(null); }}
        >
          <ClipboardList size={16} />
          记录管理
        </button>
        <button
          className={`view-tab ${currentView === 'calendar' ? 'active' : ''}`}
          onClick={() => { setCurrentView('calendar'); setSelectedOwner(null); setSelected(null); }}
        >
          <CalendarDays size={16} />
          月历提醒
        </button>
        <button
          className={`view-tab ${currentView === 'owners' ? 'active' : ''}`}
          onClick={() => { setCurrentView('owners'); setSelected(null); setSelectedCalendarDay(null); }}
        >
          <Users size={16} />
          主人档案
        </button>
        <button
          className={`view-tab ${currentView === 'templates' ? 'active' : ''}`}
          onClick={() => { setCurrentView('templates'); setSelected(null); setSelectedOwner(null); setSelectedCalendarDay(null); }}
        >
          <Settings size={16} />
          复种周期模板
        </button>
        <button
          className={`view-tab ${currentView === 'rules' ? 'active' : ''}`}
          onClick={() => { setCurrentView('rules'); setSelected(null); setSelectedOwner(null); setSelectedCalendarDay(null); }}
        >
          <Zap size={16} />
          提醒规则引擎
        </button>
        <button
          className={`view-tab ${currentView === 'crossStore' ? 'active' : ''}`}
          onClick={() => {
            setCurrentView('crossStore');
            setSelected(null);
            setSelectedOwner(null);
            setSelectedCalendarDay(null);
            if (crossStoreDuplicates.groups.length === 0) {
              handleScanCrossStoreDuplicates();
            }
          }}
        >
          <GitBranch size={16} />
          跨店客户
        </button>
      </div>

      <section className="metrics">
        {currentView === 'records' ? metrics.map((metric) => (
          <article className="metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        )) : currentView === 'calendar' ? (
          <>
            <article className="metric">
              <span>本月提醒</span>
              <strong>{calendarMonthStats.total}</strong>
            </article>
            <article className="metric">
              <span>本月待联系</span>
              <strong>{calendarMonthStats.pending}</strong>
            </article>
            <article className="metric">
              <span>本月已接种</span>
              <strong>{calendarMonthStats.done}</strong>
            </article>
            <article className="metric">
              <span>本月即将到期</span>
              <strong>{calendarMonthStats.upcoming}</strong>
            </article>
            <article className="metric">
              <span>本月逾期</span>
              <strong>{calendarMonthStats.overdue}</strong>
            </article>
          </>
        ) : currentView === 'rules' ? (
          <>
            <article className="metric">
              <span>规则数量</span>
              <strong>{rules.length}</strong>
            </article>
            <article className="metric">
              <span>覆盖疫苗</span>
              <strong>{rules.filter(r => appConfig.fields.find(f => f.key === 'vaccine').options.includes(r.vaccine)).length}/{appConfig.fields.find(f => f.key === 'vaccine').options.length}</strong>
            </article>
            <article className="metric">
              <span>逾期分级总数</span>
              <strong>{rules.reduce((sum, r) => sum + (r.overdueLevels || []).length, 0)}</strong>
            </article>
          </>
        ) : currentView === 'crossStore' ? (
          <>
            <article className="metric">
              <span>疑似重复分组</span>
              <strong>{crossStoreDuplicates.groups.length}</strong>
            </article>
            <article className="metric">
              <span>涉及记录数</span>
              <strong>{crossStoreDuplicates.groups.reduce((sum, g) => sum + g.records.length, 0)}</strong>
            </article>
            <article className="metric">
              <span>已标记跨店客户</span>
              <strong>{Object.keys(crossStoreLinks).length}</strong>
            </article>
            <article className="metric">
              <span>操作记录</span>
              <strong>{crossStoreAudit.length}</strong>
            </article>
          </>
        ) : (
          <>
            <article className="metric">
              <span>主人数量</span>
              <strong>{ownerProfiles.length}</strong>
            </article>
            <article className="metric">
              <span>宠物总数</span>
              <strong>{records.length}</strong>
            </article>
            <article className="metric">
              <span>待联系主人</span>
              <strong>{ownerProfiles.filter((p) => p.pendingCount > 0).length}</strong>
            </article>
          </>
        )}
      </section>

      {currentView === 'records' && (
        <section className="panel contact-list-panel">
          <div className="panel-title">
            <PhoneCall size={18} />
            <h2>今日联系清单</h2>
          </div>

          {selectedContactIds.size > 0 && (
            <div className="batch-action-bar">
              <div className="batch-selection-info">
                <CheckCheck size={16} />
                <span>已选择 <strong>{selectedContactIds.size}</strong> 条记录</span>
                {selectedPendingCount > 0 && (
                  <span className="batch-pending-info">（其中 <strong>{selectedPendingCount}</strong> 条待联系）</span>
                )}
              </div>
              <div className="batch-actions">
                {selectedPendingCount > 0 && (
                  <button
                    type="button"
                    className="btn-primary batch-mark-btn"
                    onClick={() => setShowBatchContactModal(true)}
                  >
                    <CheckCircle2 size={14} />
                    批量标记为已联系
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={clearContactSelection}
                >
                  <X size={14} />
                  取消选择
                </button>
              </div>
            </div>
          )}

          <div className="contact-groups">
            {Object.entries(contactListGroups.overdueByLevel).length > 0 ? (
              Object.entries(contactListGroups.overdueByLevel).map(([levelLabel, items]) => (
                <div className={`contact-group overdue-group overdue-level-${items[0]?.overdueLevel?.level ?? 0}`} key={levelLabel}>
                  <div className="contact-group-header">
                    <div className="contact-group-title">
                      <label className="contact-group-checkbox">
                        <input
                          type="checkbox"
                          checked={items.length > 0 && items.every(item => selectedContactIds.has(item.id))}
                          onChange={() => toggleGroupSelection(items)}
                        />
                      </label>
                      <AlertCircle size={16} className="contact-group-icon overdue-icon" />
                      <h3>{levelLabel}</h3>
                      <span className="contact-count">{items.length}</span>
                    </div>
                  </div>
                  <div className="contact-records">
                    {items.map((item) => (
                      <article className={'contact-record ' + (item.status === '已联系' ? 'contact-record-done' : '') + (selectedContactIds.has(item.id) ? ' contact-record-selected' : '')} key={item.id}>
                        <div className="contact-record-main">
                          <label className="contact-record-checkbox" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedContactIds.has(item.id)}
                              onChange={() => toggleContactSelection(item.id)}
                            />
                          </label>
                          <div className="contact-record-info">
                            <h4>{item.pet}</h4>
                            <p className="contact-meta">{item.ownerPhone}</p>
                            <p className="contact-vaccine">{item.vaccine}</p>
                          </div>
                          <div className="contact-record-side">
                            <span className={'status ' + statusClass(item.status)}>{item.status}</span>
                            <span className={`days-badge overdue-badge level-badge-${item.overdueLevel?.level ?? 0}`}>逾期{item.overdueDays}天</span>
                          </div>
                        </div>
                        <div className="contact-actions">
                          {item.status === '已联系' ? (
                            <button className="mark-contact-btn revert-btn" type="button" onClick={() => updateStatus(item.id, '待联系')}>
                              <RotateCcw size={14} />重新标记为待联系
                            </button>
                          ) : (
                            <button className="mark-contact-btn" type="button" onClick={() => updateStatus(item.id, '已联系')}>
                              <CheckCircle2 size={14} />标记已联系
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="contact-group overdue-group">
                <div className="contact-group-header">
                  <div className="contact-group-title">
                    <AlertCircle size={16} className="contact-group-icon overdue-icon" />
                    <h3>已逾期</h3>
                    <span className="contact-count">0</span>
                  </div>
                </div>
                <div className="contact-records">
                  <p className="empty-group">暂无逾期记录</p>
                </div>
              </div>
            )}

            <div className="contact-group today-group">
              <div className="contact-group-header">
                <div className="contact-group-title">
                  {contactListGroups.today.length > 0 && (
                    <label className="contact-group-checkbox">
                      <input
                        type="checkbox"
                        checked={contactListGroups.today.length > 0 && contactListGroups.today.every(item => selectedContactIds.has(item.id))}
                        onChange={() => toggleGroupSelection(contactListGroups.today)}
                      />
                    </label>
                  )}
                  <Clock size={16} className="contact-group-icon today-icon" />
                  <h3>今日提醒</h3>
                  <span className="contact-count">{contactListGroups.today.length}</span>
                </div>
              </div>
              <div className="contact-records">
                {contactListGroups.today.length === 0 ? (
                  <p className="empty-group">今日暂无提醒</p>
                ) : (
                  contactListGroups.today.map((item) => (
                    <article className={'contact-record ' + (item.status === '已联系' ? 'contact-record-done' : '') + (selectedContactIds.has(item.id) ? ' contact-record-selected' : '')} key={item.id}>
                      <div className="contact-record-main">
                        <label className="contact-record-checkbox" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedContactIds.has(item.id)}
                            onChange={() => toggleContactSelection(item.id)}
                          />
                        </label>
                        <div className="contact-record-info">
                          <h4>{item.pet}</h4>
                          <p className="contact-meta">{item.ownerPhone}</p>
                          <p className="contact-vaccine">{item.vaccine}</p>
                        </div>
                        <div className="contact-record-side">
                          <span className={'status ' + statusClass(item.status)}>{item.status}</span>
                          <span className="days-badge today-badge">今天</span>
                        </div>
                      </div>
                      <div className="contact-actions">
                        {item.status === '已联系' ? (
                          <button className="mark-contact-btn revert-btn" type="button" onClick={() => updateStatus(item.id, '待联系')}>
                            <RotateCcw size={14} />重新标记为待联系
                          </button>
                        ) : (
                          <button className="mark-contact-btn" type="button" onClick={() => updateStatus(item.id, '已联系')}>
                            <CheckCircle2 size={14} />标记已联系
                          </button>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="contact-group upcoming-group">
              <div className="contact-group-header">
                <div className="contact-group-title">
                  {contactListGroups.upcoming.length > 0 && (
                    <label className="contact-group-checkbox">
                      <input
                        type="checkbox"
                        checked={contactListGroups.upcoming.length > 0 && contactListGroups.upcoming.every(item => selectedContactIds.has(item.id))}
                        onChange={() => toggleGroupSelection(contactListGroups.upcoming)}
                      />
                    </label>
                  )}
                  <CalendarCheck size={16} className="contact-group-icon upcoming-icon" />
                  <h3>即将到期</h3>
                  <span className="contact-count">{contactListGroups.upcoming.length}</span>
                </div>
              </div>
              <div className="contact-records">
                {contactListGroups.upcoming.length === 0 ? (
                  <p className="empty-group">暂无近期提醒</p>
                ) : (
                  contactListGroups.upcoming.map((item) => (
                    <article className={'contact-record ' + (item.status === '已联系' ? 'contact-record-done' : '') + (selectedContactIds.has(item.id) ? ' contact-record-selected' : '')} key={item.id}>
                      <div className="contact-record-main">
                        <label className="contact-record-checkbox" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedContactIds.has(item.id)}
                            onChange={() => toggleContactSelection(item.id)}
                          />
                        </label>
                        <div className="contact-record-info">
                          <h4>{item.pet}</h4>
                          <p className="contact-meta">{item.ownerPhone}</p>
                          <p className="contact-vaccine">{item.vaccine}</p>
                        </div>
                        <div className="contact-record-side">
                          <span className={'status ' + statusClass(item.status)}>{item.status}</span>
                          <span className="days-badge upcoming-badge">还有{daysDiff(item.nextDate)}天</span>
                        </div>
                      </div>
                      <div className="contact-actions">
                        {item.status === '已联系' ? (
                          <button className="mark-contact-btn revert-btn" type="button" onClick={() => updateStatus(item.id, '待联系')}>
                            <RotateCcw size={14} />重新标记为待联系
                          </button>
                        ) : (
                          <button className="mark-contact-btn" type="button" onClick={() => updateStatus(item.id, '已联系')}>
                            <CheckCircle2 size={14} />标记已联系
                          </button>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {currentView === 'owners' && (
        <section className="owner-section">
          {!selectedOwner ? (
            <div className="owner-list-panel">
              <div className="panel">
                <div className="panel-title">
                  <Users size={18} />
                  <h2>主人档案列表</h2>
                </div>
                <div className="owner-search">
                  <Search size={16} />
                  <input
                    value={ownerSearch}
                    onChange={(e) => setOwnerSearch(e.target.value)}
                    placeholder="搜索主人手机号或宠物名"
                  />
                </div>
                <div className="owner-list">
                  {filteredOwnerProfiles.length === 0 ? (
                    <p className="empty-group">暂无主人档案</p>
                  ) : (
                    filteredOwnerProfiles.map((profile) => (
                      <article
                        className="owner-card"
                        key={profile.ownerPhone}
                        onClick={() => setSelectedOwner(profile)}
                      >
                        <div className="owner-card-header">
                          <div className="owner-avatar">
                            <User size={24} />
                          </div>
                          <div className="owner-info">
                            <h3>{profile.ownerPhone}</h3>
                            <p>
                              <PawPrint size={12} />
                              {profile.totalCount} 只宠物
                              {profile.pendingCount > 0 && (
                                <span className="pending-badge">{profile.pendingCount} 待联系</span>
                              )}
                            </p>
                          </div>
                          <ChevronRight size={20} className="owner-arrow" />
                        </div>
                        <div className="owner-pet-preview">
                          {profile.pets.slice(0, 3).map((pet) => (
                            <span key={pet.id} className="pet-tag">
                              {pet.pet}
                            </span>
                          ))}
                          {profile.pets.length > 3 && (
                            <span className="pet-tag more">+{profile.pets.length - 3}</span>
                          )}
                        </div>
                        <div className="owner-last-contact">
                          <Clock size={12} />
                          最近联系：
                          {profile.lastContactTime
                            ? new Date(profile.lastContactTime).toLocaleDateString('zh-CN')
                            : '暂无记录'}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="owner-detail-panel">
              <div className="panel">
                <div className="owner-detail-header">
                  <button
                    className="back-btn"
                    onClick={() => setSelectedOwner(null)}
                  >
                    <ArrowLeft size={18} />
                    返回列表
                  </button>
                  <div className="owner-detail-info">
                    <div className="owner-avatar large">
                      <User size={32} />
                    </div>
                    <div>
                      <h2>{selectedOwnerProfile.ownerPhone}</h2>
                      <p>
                        共 {selectedOwnerProfile.totalCount} 只宠物
                        {selectedOwnerProfile.pendingCount > 0 && (
                          <span className="pending-badge">{selectedOwnerProfile.pendingCount} 只待联系</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="owner-detail-section">
                  <div className="section-title">
                    <PawPrint size={16} />
                    <h3>名下宠物</h3>
                  </div>
                  <div className="owner-pets-list">
                    {selectedOwnerProfile.pets.map((pet) => (
                      <div className="owner-pet-card" key={pet.id}>
                        <div className="pet-card-main">
                          <div className="pet-info">
                            <h4>{pet.pet}</h4>
                            <p className="pet-meta">{pet.species} · {pet.vaccine}</p>
                            <p className="pet-date">下次提醒：{pet.nextDate || '未设置'}</p>
                          </div>
                          <div className="pet-status">
                            <span className={'status ' + statusClass(pet.status)}>{pet.status}</span>
                            {isOverdue(pet.nextDate) && pet.status === '待联系' && (
                              <span className="days-badge overdue-badge">已逾期</span>
                            )}
                            {isToday(pet.nextDate) && pet.status === '待联系' && (
                              <span className="days-badge today-badge">今天</span>
                            )}
                            {isWithinAdvanceDays(pet, rules) && pet.status === '待联系' && (
                              <span className="days-badge upcoming-badge">{daysDiff(pet.nextDate)}天后</span>
                            )}
                          </div>
                        </div>
                        <div className="pet-card-actions">
                          {appConfig.statuses.map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); updateStatus(pet.id, status); }}
                            >
                              {status}
                            </button>
                          ))}
                          <button
                            className="view-record-btn"
                            type="button"
                            onClick={() => jumpToRecord(pet.id)}
                          >
                            <ClipboardList size={14} />
                            查看记录
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="owner-detail-section">
                  <div className="section-title">
                    <Clock size={16} />
                    <h3>最近联系时间</h3>
                  </div>
                  <div className="owner-contact-info">
                    {selectedOwnerProfile.lastContactTime ? (
                      <p>
                        最近一次联系：
                        <strong>
                          {new Date(selectedOwnerProfile.lastContactTime).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </strong>
                      </p>
                    ) : (
                      <p className="empty-text">暂无联系记录</p>
                    )}
                  </div>
                </div>

                <div className="owner-detail-section">
                  <div className="section-title">
                    <MessageSquareText size={16} />
                    <h3>主人信息</h3>
                    {!editingOwnerInfo && (
                      <button
                        type="button"
                        className="edit-owner-info-btn"
                        onClick={() => {
                          setOwnerNoteDraft(selectedOwnerProfile.note || '');
                          setOwnerPreferredTimeDraft(selectedOwnerProfile.preferredContactTime || '');
                          setEditingOwnerInfo(true);
                        }}
                      >
                        <Edit3 size={14} />
                        编辑
                      </button>
                    )}
                  </div>
                  {editingOwnerInfo ? (
                    <div className="owner-info-edit-form">
                      <div className="form-field">
                        <label>
                          <span>主人备注</span>
                          <textarea
                            value={ownerNoteDraft}
                            onChange={(e) => setOwnerNoteDraft(e.target.value)}
                            placeholder="输入主人备注信息，如：客户偏好、特殊说明等..."
                            rows={4}
                          />
                        </label>
                      </div>
                      <div className="form-field">
                        <label>
                          <span>首选联系时间</span>
                          <select
                            value={ownerPreferredTimeDraft}
                            onChange={(e) => setOwnerPreferredTimeDraft(e.target.value)}
                          >
                            <option value="">请选择</option>
                            <option value="上午 (9:00-12:00)">上午 (9:00-12:00)</option>
                            <option value="下午 (14:00-18:00)">下午 (14:00-18:00)</option>
                            <option value="晚上 (19:00-21:00)">晚上 (19:00-21:00)</option>
                            <option value="工作日">工作日</option>
                            <option value="周末">周末</option>
                            <option value="随时">随时</option>
                          </select>
                        </label>
                      </div>
                      <div className="form-actions">
                        <button
                          type="button"
                          className="primary"
                          onClick={() => {
                            handleUpdateOwnerInfo(selectedOwnerProfile.ownerPhone, {
                              note: ownerNoteDraft.trim(),
                              preferredContactTime: ownerPreferredTimeDraft
                            });
                            setEditingOwnerInfo(false);
                          }}
                        >
                          <Save size={14} />
                          保存
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setEditingOwnerInfo(false);
                            setOwnerNoteDraft('');
                            setOwnerPreferredTimeDraft('');
                          }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="owner-info-display">
                      <div className="owner-info-item">
                        <span className="info-label">主人备注</span>
                        <p className="info-value">
                          {selectedOwnerProfile.note || <span className="empty-text">暂无备注</span>}
                        </p>
                      </div>
                      <div className="owner-info-item">
                        <span className="info-label">首选联系时间</span>
                        <p className="info-value">
                          {selectedOwnerProfile.preferredContactTime || <span className="empty-text">未设置</span>}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="owner-detail-section">
                  <div className="section-title">
                    <CalendarCheck size={16} />
                    <h3>疫苗提醒概览</h3>
                  </div>
                  <div className="vaccine-overview">
                    <div className="overview-item">
                      <span className="overview-label">待联系</span>
                      <span className="overview-value pending">{selectedOwnerProfile.pets.filter(p => p.status === '待联系').length}</span>
                    </div>
                    <div className="overview-item">
                      <span className="overview-label">已联系</span>
                      <span className="overview-value contacted">{selectedOwnerProfile.pets.filter(p => p.status === '已联系').length}</span>
                    </div>
                    <div className="overview-item">
                      <span className="overview-label">已接种</span>
                      <span className="overview-value done">{selectedOwnerProfile.pets.filter(p => p.status === '已接种').length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {currentView === 'templates' && (
        <section className="template-section">
          <div className="template-layout">
            <div className="panel template-form-panel">
              <div className="panel-title">
                <Settings size={18} />
                <h2>复种周期模板</h2>
              </div>
              <p className="hint">为不同物种和疫苗类型配置默认复种周期（天数），新增记录选择疫苗后将自动计算下次提醒日期。</p>
              <form className="template-form" onSubmit={addTemplate}>
                <label>
                  <span>物种</span>
                  <select value={templateForm.species} onChange={(e) => setTemplateForm({ ...templateForm, species: e.target.value })}>
                    <option value="">选择物种</option>
                    {appConfig.fields.find(f => f.key === 'species').options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
                <label>
                  <span>疫苗类型</span>
                  <select value={templateForm.vaccine} onChange={(e) => setTemplateForm({ ...templateForm, vaccine: e.target.value })}>
                    <option value="">选择疫苗</option>
                    {appConfig.fields.find(f => f.key === 'vaccine').options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
                <label>
                  <span>复种周期（天）</span>
                  <input type="number" min="1" value={templateForm.days} onChange={(e) => setTemplateForm({ ...templateForm, days: e.target.value })} placeholder="365" />
                </label>
                <div className="template-form-actions">
                  <button className="primary" type="submit" disabled={!templateForm.species || !templateForm.vaccine || !templateForm.days || Number(templateForm.days) <= 0}>
                    <Save size={16} />
                    {editingTemplate ? '保存修改' : '添加模板'}
                  </button>
                  {editingTemplate && (
                    <button type="button" className="btn-secondary" onClick={cancelEditTemplate}>取消</button>
                  )}
                </div>
              </form>
              <div className="template-restore">
                <button type="button" className="restore-btn" onClick={restoreDefaultTemplates}>
                  <RotateCcw size={14} />
                  恢复默认模板
                </button>
              </div>
            </div>

            <div className="panel template-list-panel">
              <div className="panel-title">
                <ClipboardList size={18} />
                <h2>模板列表</h2>
                <span className="template-count">{templates.length}</span>
              </div>
              <div className="template-list">
                {templates.length === 0 ? (
                  <p className="empty-group">暂无模板，请添加</p>
                ) : (
                  templates.map((tpl) => (
                    <article className="template-item" key={tpl.id}>
                      <div className="template-item-main">
                        <div className="template-item-info">
                          <span className="template-species">{tpl.species}</span>
                          <span className="template-arrow">→</span>
                          <span className="template-vaccine">{tpl.vaccine}</span>
                        </div>
                        <span className="template-days">{tpl.days}天</span>
                      </div>
                      <div className="template-item-actions">
                        <button type="button" onClick={() => startEditTemplate(tpl)} title="编辑">
                          <Edit3 size={14} />
                        </button>
                        <button type="button" className="ghost-danger" onClick={() => removeTemplate(tpl.id)} title="删除">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="panel template-repair-panel">
            <div className="panel-title">
              <AlertCircle size={18} />
              <h2>记录修复</h2>
            </div>
            <p className="hint">对于已有记录中缺少下次提醒日期的条目，根据当前模板配置自动补充计算结果。已有下次提醒日期的记录不会被修改。</p>
            <button type="button" className="repair-btn" onClick={repairRecords}>
              <CheckCircle2 size={16} />
              修复缺失的提醒日期
            </button>
          </div>
        </section>
      )}

      {currentView === 'rules' && (
        <section className="rules-section">
          <div className="rules-layout">
            <div className="panel rules-form-panel">
              <div className="panel-title">
                <Zap size={18} />
                <h2>提醒规则引擎</h2>
              </div>
              <p className="hint">为不同疫苗类型配置提醒规则：提前提醒天数决定"即将到期"范围，逾期分级决定逾期严重程度划分，默认联系状态决定新增记录初始状态，自动分组规则决定分组视图默认分组方式。</p>
              <form className="rules-form" onSubmit={addRule}>
                <label>
                  <span>疫苗类型</span>
                  <select value={ruleForm.vaccine} onChange={(e) => setRuleForm({ ...ruleForm, vaccine: e.target.value })} disabled={!!editingRule}>
                    <option value="">选择疫苗</option>
                    {appConfig.fields.find(f => f.key === 'vaccine').options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
                <label>
                  <span>提前提醒天数</span>
                  <input type="number" min="1" value={ruleForm.advanceDays} onChange={(e) => setRuleForm({ ...ruleForm, advanceDays: e.target.value })} placeholder="7" />
                  <span className="field-hint">距下次提醒日期多少天内显示为"即将到期"</span>
                </label>
                <label>
                  <span>默认联系状态</span>
                  <select value={ruleForm.defaultStatus} onChange={(e) => setRuleForm({ ...ruleForm, defaultStatus: e.target.value })}>
                    {appConfig.statuses.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <span className="field-hint">新增该疫苗记录时的默认状态</span>
                </label>
                <label>
                  <span>自动分组规则</span>
                  <select value={ruleForm.autoGroup} onChange={(e) => setRuleForm({ ...ruleForm, autoGroup: e.target.value })}>
                    <option value="overdue">按逾期等级</option>
                    <option value="vaccine">按疫苗类型</option>
                    <option value="status">按联系状态</option>
                  </select>
                  <span className="field-hint">分组视图为"按规则引擎"时每条记录使用的分组方式</span>
                </label>
                <div className="overdue-levels-config">
                  <div className="overdue-levels-header">
                    <span>逾期分级</span>
                    <button type="button" className="add-level-btn" onClick={addOverdueLevelToForm}>
                      <PlusCircle size={14} />添加等级
                    </button>
                  </div>
                  <div className="overdue-levels-list">
                    {ruleForm.overdueLevels.map((ol, idx) => (
                      <div className="overdue-level-row" key={ol.id}>
                        <input
                          type="text"
                          value={ol.label}
                          onChange={(e) => updateOverdueLevelInForm(ol.id, 'label', e.target.value)}
                          placeholder="等级名称"
                          className="level-label-input"
                        />
                        <span className="level-range-label">{idx === 0 ? '逾期' : ''} ≥</span>
                        <input
                          type="number"
                          min="1"
                          value={ol.min}
                          onChange={(e) => updateOverdueLevelInForm(ol.id, 'min', e.target.value)}
                          className="level-num-input"
                        />
                        <span className="level-range-label">天</span>
                        <span className="level-range-label">且 ≤</span>
                        <input
                          type="number"
                          min="1"
                          value={ol.max}
                          onChange={(e) => updateOverdueLevelInForm(ol.id, 'max', e.target.value)}
                          className="level-num-input"
                        />
                        <span className="level-range-label">天</span>
                        {ruleForm.overdueLevels.length > 1 && (
                          <button type="button" className="remove-level-btn" onClick={() => removeOverdueLevelFromForm(ol.id)}>
                            <MinusCircle size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rules-form-actions">
                  <button className="primary" type="submit" disabled={!ruleForm.vaccine || !ruleForm.advanceDays || Number(ruleForm.advanceDays) <= 0}>
                    <Save size={16} />
                    {editingRule ? '保存修改' : '添加规则'}
                  </button>
                  {editingRule && (
                    <button type="button" className="btn-secondary" onClick={cancelEditRule}>取消</button>
                  )}
                </div>
              </form>
              <div className="rules-restore">
                <button type="button" className="restore-btn" onClick={restoreDefaultRules}>
                  <RotateCcw size={14} />
                  恢复默认规则
                </button>
              </div>

              {rulePreview && (
                <div className="rule-preview-panel">
                  <div className="panel-title">
                    <Zap size={18} />
                    <h2>规则生效预览</h2>
                    <span className="template-count">实时</span>
                  </div>
                  <div className="rule-preview-summary">
                    <div className="preview-summary-item">
                      <span className="preview-summary-icon">
                        <Info size={16} />
                      </span>
                      <div>
                        <p className="preview-summary-label">受影响疫苗</p>
                        <p className="preview-summary-value">{rulePreview.vaccine}</p>
                      </div>
                    </div>
                    <div className="preview-summary-item">
                      <span className="preview-summary-icon">
                        <Users size={16} />
                      </span>
                      <div>
                        <p className="preview-summary-label">门店受影响记录</p>
                        <p className="preview-summary-value">{rulePreview.totalAffected} 条</p>
                      </div>
                    </div>
                    <div className="preview-summary-item">
                      <span className={`preview-summary-icon ${rulePreview.changedCount > 0 ? 'icon-change' : ''}`}>
                        <CheckCheck size={16} />
                      </span>
                      <div>
                        <p className="preview-summary-label">分组将发生变化</p>
                        <p className={`preview-summary-value ${rulePreview.changedCount > 0 ? 'value-change' : ''}`}>
                          {rulePreview.changedCount} 条
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rule-preview-hint">
                    <AlertCircle size={14} />
                    <span>以下为新规则生效后的分组分布。保存前不会修改任何真实记录。</span>
                  </div>

                  <div className="preview-comparison-table">
                    <div className="comparison-header">
                      <span className="comparison-col-group">提醒分组</span>
                      <span className="comparison-col-num">原规则</span>
                      <span className="comparison-col-num">新规则</span>
                      <span className="comparison-col-num">变化</span>
                    </div>
                    {rulePreview.comparison.map((row) => (
                      <div className="comparison-row" key={row.group}>
                        <span className="comparison-col-group">
                          <span className={`group-tag ${getGroupTagClass(row.group)}`}>{row.group}</span>
                        </span>
                        <span className="comparison-col-num">{row.oldCount}</span>
                        <span className="comparison-col-num comparison-highlight">{row.newCount}</span>
                        <span className={`comparison-col-num ${row.diff > 0 ? 'diff-up' : row.diff < 0 ? 'diff-down' : ''}`}>
                          {row.diff > 0 ? `+${row.diff}` : row.diff === 0 ? '—' : row.diff}
                        </span>
                      </div>
                    ))}
                  </div>

                  {rulePreview.sampleAffected.length > 0 && (
                    <div className="preview-samples">
                      <p className="preview-samples-title">
                        <PawPrint size={14} /> 受影响记录示例（最多展示10条）
                      </p>
                      <div className="preview-samples-list">
                        {rulePreview.sampleAffected.map((item) => {
                          const oldRule = rules.find(r => r.id === editingRule);
                          const newRule = { ...ruleForm, advanceDays: Number(ruleForm.advanceDays) || 7 };
                          const oldGroup = oldRule ? getGroupForRecordWithRule(item, oldRule) : getGroupForRecordWithRule(item, null);
                          const newGroup = getGroupForRecordWithRule(item, newRule);
                          const hasChange = oldGroup !== newGroup;
                          return (
                            <div className={`preview-sample-item ${hasChange ? 'sample-changed' : ''}`} key={item.id}>
                              <div className="sample-info">
                                <p className="sample-pet">{item.pet}</p>
                                <p className="sample-meta">{item.species} · {item.ownerPhone}</p>
                              </div>
                              <div className="sample-date">
                                <CalendarDays size={12} />
                                <span>{item.nextDate || '无日期'}</span>
                              </div>
                              <div className="sample-group-transition">
                                <span className={`group-tag ${getGroupTagClass(oldGroup)}`}>{oldGroup}</span>
                                <ChevronRight size={14} className="arrow-icon" />
                                <span className={`group-tag ${getGroupTagClass(newGroup)}`}>{newGroup}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="panel rules-list-panel">
              <div className="panel-title">
                <ClipboardList size={18} />
                <h2>规则列表</h2>
                <span className="template-count">{rules.length}</span>
              </div>
              <div className="rules-list">
                {rules.length === 0 ? (
                  <p className="empty-group">暂无规则，请添加</p>
                ) : (
                  rules.map((rule) => (
                    <article className="rule-item" key={rule.id}>
                      <div className="rule-item-main">
                        <div className="rule-item-header">
                          <span className="rule-vaccine-tag">{rule.vaccine}</span>
                          <span className="rule-advance-tag">提前{rule.advanceDays}天</span>
                          <span className="rule-status-tag">{rule.defaultStatus}</span>
                          <span className="rule-group-tag">{rule.autoGroup === 'overdue' ? '按逾期等级' : rule.autoGroup === 'vaccine' ? '按疫苗类型' : '按联系状态'}</span>
                        </div>
                        <div className="rule-item-levels">
                          {(rule.overdueLevels || []).map((ol, idx) => (
                            <span key={ol.id || idx} className={`rule-level-tag level-tag-${idx}`}>{ol.label}({ol.min}-{ol.max === 9999 ? '∞' : ol.max}天)</span>
                          ))}
                        </div>
                      </div>
                      <div className="rule-item-actions">
                        <button type="button" onClick={() => startEditRule(rule)} title="编辑">
                          <Edit3 size={14} />
                        </button>
                        <button type="button" className="ghost-danger" onClick={() => removeRule(rule.id)} title="删除">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {currentView === 'crossStore' && (
        <section className="panel cross-store-panel">
          <div className="panel-title">
            <GitBranch size={18} />
            <h2>跨店客户管理</h2>
            <div className="panel-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleScanCrossStoreDuplicates}
                disabled={isScanningDuplicates}
              >
                <RefreshCw size={14} className={isScanningDuplicates ? 'spin' : ''} />
                {isScanningDuplicates ? '扫描中...' : '重新扫描'}
              </button>
            </div>
          </div>

          <div className="cross-store-tabs">
            <button
              className={`cross-store-tab ${crossStoreTab === 'duplicates' ? 'active' : ''}`}
              onClick={() => setCrossStoreTab('duplicates')}
            >
              <AlertTriangle size={14} />
              疑似重复客户
            </button>
            <button
              className={`cross-store-tab ${crossStoreTab === 'linked' ? 'active' : ''}`}
              onClick={() => setCrossStoreTab('linked')}
            >
              <Link2 size={14} />
              已标记跨店客户
            </button>
            <button
              className={`cross-store-tab ${crossStoreTab === 'audit' ? 'active' : ''}`}
              onClick={() => setCrossStoreTab('audit')}
            >
              <History size={14} />
              操作审计日志
            </button>
          </div>

          {crossStoreTab === 'duplicates' && (
            <div className="cross-store-content">
              {stores.length < 2 ? (
                <div className="empty-state">
                  <Building2 size={48} className="empty-icon" />
                  <p>请先创建多个门店后再使用跨店客户识别功能</p>
                </div>
              ) : crossStoreDuplicates.groups.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle2 size={48} className="success-icon" />
                  <p>{isScanningDuplicates ? '正在扫描所有门店数据...' : '未发现跨门店重复客户'}</p>
                  {!isScanningDuplicates && (
                    <button type="button" className="btn-primary" onClick={handleScanCrossStoreDuplicates}>
                      <RefreshCw size={14} />
                      立即扫描
                    </button>
                  )}
                </div>
              ) : (
                <div className="duplicate-groups">
                  {crossStoreDuplicates.groups.map((group) => (
                    <article key={group.id} className={`duplicate-group ${selectedDuplicateGroup?.id === group.id ? 'expanded' : ''}`}>
                      <div className="duplicate-group-header" onClick={() => {
                        if (selectedDuplicateGroup?.id === group.id) {
                          setSelectedDuplicateGroup(null);
                          setCopySelectedIds(new Set());
                          setLinkSelectedIds(new Set());
                        } else {
                          setSelectedDuplicateGroup(group);
                          setCopySelectedIds(new Set());
                          setLinkSelectedIds(new Set());
                        }
                      }}>
                        <div className="duplicate-group-info">
                          <div className={`duplicate-type-badge ${group.type}`}>
                            {group.type === 'phone' ? '手机号匹配' : '宠物名相似'}
                          </div>
                          <span className="duplicate-match-label">{group.matchLabel}</span>
                          <span className="duplicate-record-count">
                            {group.records.length} 条记录 · {group.storeIds.length} 个门店
                          </span>
                          {group.confidence < 1 && (
                            <span className="duplicate-confidence">
                              置信度 {Math.round(group.confidence * 100)}%
                            </span>
                          )}
                        </div>
                        <ChevronRight size={18} className={`chevron ${selectedDuplicateGroup?.id === group.id ? 'rotated' : ''}`} />
                      </div>

                      {selectedDuplicateGroup?.id === group.id && (
                        <div className="duplicate-group-detail">
                          <div className="duplicate-actions-bar">
                            <button
                              type="button"
                              className="btn-secondary ghost-danger"
                              onClick={() => handleIgnoreDuplicateGroup(group.key)}
                            >
                              <Link2Off size={14} />
                              忽略此分组
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => handleMarkAsCrossStore(group)}
                              disabled={linkSelectedIds.size < 2}
                            >
                              <Link2 size={14} />
                              标记为跨店客户 {linkSelectedIds.size > 0 && `(${linkSelectedIds.size})`}
                            </button>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => handleCopyRecordsToCurrentStore(group)}
                              disabled={copySelectedIds.size === 0}
                            >
                              <Copy size={14} />
                              复制到当前门店 {copySelectedIds.size > 0 && `(${copySelectedIds.size})`}
                            </button>
                          </div>

                          <div className="duplicate-records-list">
                            {group.records.map((record) => {
                              const recordKey = `${record._storeId}:${record.id}`;
                              const isCurrentStore = record._storeId === currentStoreId;
                              return (
                                <div key={recordKey} className={`duplicate-record-card ${isCurrentStore ? 'current-store' : ''}`}>
                                  <div className="duplicate-record-header">
                                    <label className="record-checkbox">
                                      <input
                                        type="checkbox"
                                        checked={copySelectedIds.has(recordKey)}
                                        onChange={() => toggleCopySelection(record._storeId, record.id)}
                                      />
                                      <span className="checkbox-label">复制</span>
                                    </label>
                                    <label className="record-checkbox">
                                      <input
                                        type="checkbox"
                                        checked={linkSelectedIds.has(recordKey)}
                                        onChange={() => toggleLinkSelection(record._storeId, record.id)}
                                      />
                                      <span className="checkbox-label">关联</span>
                                    </label>
                                    <div className="record-store-tag">
                                      <Building2 size={12} />
                                      {record._storeName}
                                      {isCurrentStore && <span className="current-badge">当前门店</span>}
                                    </div>
                                  </div>
                                  <div className="duplicate-record-body">
                                    <div className="record-main-info">
                                      <PawPrint size={16} className="record-icon" />
                                      <strong className="record-pet-name">{record.pet}</strong>
                                      <span className="record-species">{record.species}</span>
                                      <span className="record-vaccine">{record.vaccine}</span>
                                    </div>
                                    <div className="record-sub-info">
                                      <span><PhoneCall size={12} /> {record.ownerPhone || '无联系方式'}</span>
                                      <span><Calendar size={12} /> 下次提醒：{record.nextDate || '未设置'}</span>
                                      <span className={`record-status status-${appConfig.statuses.indexOf(record.status)}`}>
                                        {record.status}
                                      </span>
                                    </div>
                                    {record._crossStoreSource && (
                                      <div className="record-source-tag">
                                        <ShieldCheck size={12} />
                                        从其他门店复制而来
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="duplicate-group-footer">
                            <p className="hint-text">
                              <Info size={12} />
                              提示："复制"会在当前门店创建新记录，原门店数据保持不变；"标记为跨店客户"仅建立关联标识，不修改原始数据。
                            </p>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {crossStoreTab === 'linked' && (
            <div className="cross-store-content">
              {Object.keys(crossStoreLinks).length === 0 ? (
                <div className="empty-state">
                  <Link2 size={48} className="empty-icon" />
                  <p>暂无已标记的跨店客户</p>
                </div>
              ) : (
                <div className="linked-customers-list">
                  {Object.values(crossStoreLinks).map((link) => (
                    <article key={link.id} className="linked-customer-card">
                      <div className="linked-customer-header">
                        <Link2 size={16} />
                        <span className="linked-id">关联ID: {link.id}</span>
                        <span className="linked-date">
                          创建于 {new Date(link.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <div className="linked-customer-records">
                        {link.records.map((linked, idx) => {
                          const store = stores.find(s => s.id === linked.storeId);
                          const storeData = loadStoreData(linked.storeId);
                          const record = storeData?.records?.find(r => r.id === linked.recordId);
                          return (
                            <div key={idx} className={`linked-record-item ${linked.storeId === currentStoreId ? 'current-store' : ''}`}>
                              <Building2 size={12} />
                              <span className="linked-store-name">{store?.name || linked.storeId}</span>
                              {record && (
                                <>
                                  <span className="linked-pet-name">{record.pet}</span>
                                  <span className="linked-phone">{record.ownerPhone}</span>
                                </>
                              )}
                              {linked.storeId === currentStoreId && (
                                <span className="current-badge">当前门店</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {crossStoreTab === 'audit' && (
            <div className="cross-store-content">
              {crossStoreAudit.length === 0 ? (
                <div className="empty-state">
                  <History size={48} className="empty-icon" />
                  <p>暂无操作记录</p>
                </div>
              ) : (
                <div className="audit-log-list">
                  {crossStoreAudit.map((log) => (
                    <article key={log.id} className="audit-log-item">
                      <div className="audit-log-header">
                        <History size={14} />
                        <span className="audit-action">
                          {log.action === 'ignore_duplicate' && '忽略重复分组'}
                          {log.action === 'mark_cross_store' && '标记为跨店客户'}
                          {log.action === 'copy_record' && '复制记录到门店'}
                        </span>
                        <span className="audit-time">{new Date(log.at).toLocaleString('zh-CN')}</span>
                        <span className="audit-operator">{log.by}</span>
                      </div>
                      <div className="audit-log-details">
                        {log.action === 'ignore_duplicate' && (
                          <span>分组Key: {log.details.groupKey} {log.details.reason && `（原因: ${log.details.reason}）`}</span>
                        )}
                        {log.action === 'mark_cross_store' && (
                          <span>
                            关联ID: {log.details.linkId}，
                            涉及记录数: {log.details.records?.length || 0}
                          </span>
                        )}
                        {log.action === 'copy_record' && (
                          <span>
                            从 {log.details.sourceStoreId} 复制到 {log.details.targetStoreId}，
                            新记录ID: {log.details.newRecordId}
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {currentView === 'calendar' && (
        <>
          <section className="panel calendar-toolbar-panel">
            <div className="calendar-toolbar">
              <div className="calendar-nav">
                <button type="button" className="calendar-nav-btn" onClick={prevMonth}>
                  <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <h2 className="calendar-title">
                  {calendarDate.getFullYear()}年{calendarDate.getMonth() + 1}月
                </h2>
                <button type="button" className="calendar-nav-btn" onClick={nextMonth}>
                  <ChevronRight size={20} />
                </button>
                <button type="button" className="today-btn" onClick={goToToday}>
                  今天
                </button>
              </div>
              <div className="calendar-filter">
                <div className="search">
                  <Search size={16} />
                  <input value={filters.query} onChange={(event) => saveFilters({ ...filters, query: event.target.value })} placeholder="搜索宠物/主人" />
                </div>
                <select value={filters.status} onChange={(event) => saveFilters({ ...filters, status: event.target.value })}>
                  <option>全部</option>
                  {appConfig.statuses.map((status) => <option key={status}>{status}</option>)}
                </select>
                <select value={filters.species} onChange={(event) => saveFilters({ ...filters, species: event.target.value })}>
                  <option value="全部">全部物种</option>
                  {appConfig.fields.find(f => f.key === 'species').options.map((o) => <option key={o}>{o}</option>)}
                </select>
                <select value={filters.vaccine} onChange={(event) => saveFilters({ ...filters, vaccine: event.target.value })}>
                  <option value="全部">全部疫苗</option>
                  {appConfig.fields.find(f => f.key === 'vaccine').options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="calendar-legend">
              <span className="legend-item">
                <span className="legend-dot legend-pending"></span>
                待联系
              </span>
              <span className="legend-item">
                <span className="legend-dot legend-contacted"></span>
                已联系
              </span>
              <span className="legend-item">
                <span className="legend-dot legend-done"></span>
                已接种
              </span>
              <span className="legend-item">
                <span className="legend-dot legend-upcoming"></span>
                即将到期
              </span>
            </div>
          </section>

          <section className="calendar-main">
            <div className="panel calendar-panel">
              <div className="calendar-weekdays">
                {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                  <div key={day} className="calendar-weekday">{day}</div>
                ))}
              </div>
              <div className="calendar-grid">
                {calendarDays.map((day) => {
                  const stats = getDayStats(day.date);
                  const isToday = day.date === today;
                  const isSelected = day.date === selectedCalendarDay;
                  const dayIsOverdue = isOverdue(day.date) && stats.pending > 0;
                  const hasUpcoming = stats.upcoming > 0;
                  const highestLevel = stats.highestOverdueLevel;
                  const overdueClass = highestLevel >= 2 ? 'overdue-severe' : highestLevel === 1 ? 'overdue-moderate' : highestLevel === 0 ? 'overdue-mild' : '';
                  const isDragOver = dragOverDate === day.date;
                  return (
                    <div
                      key={day.date}
                      className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${dayIsOverdue ? 'is-overdue ' + overdueClass : ''} ${hasUpcoming ? 'has-upcoming' : ''} ${stats.total > 0 ? 'has-records' : ''} ${isDragOver ? 'is-drag-over' : ''}`}
                      onClick={() => {
                        if (justDraggedRef.current) {
                          justDraggedRef.current = false;
                          return;
                        }
                        if (stats.total > 0) setSelectedCalendarDay(day.date);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setDragOverDate(day.date);
                      }}
                      onDragLeave={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget)) return;
                        if (dragOverDate === day.date) {
                          setDragOverDate(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const recordId = e.dataTransfer.getData('text/plain');
                        if (recordId) {
                          rescheduleRecord(recordId, day.date);
                        }
                        setDragOverDate(null);
                      }}
                    >
                      <div className="calendar-day-header">
                        <span className="calendar-day-number">{day.day}</span>
                        {stats.total > 0 && (
                          <span className="calendar-day-total">{stats.total}</span>
                        )}
                      </div>
                      {stats.total > 0 && (
                        <div className="calendar-day-stats">
                          {stats.pending > 0 && (
                            <span className="day-stat stat-pending">{stats.pending}</span>
                          )}
                          {stats.contacted > 0 && (
                            <span className="day-stat stat-contacted">{stats.contacted}</span>
                          )}
                          {stats.done > 0 && (
                            <span className="day-stat stat-done">{stats.done}</span>
                          )}
                          {stats.upcoming > 0 && (
                            <span className="day-stat stat-upcoming">{stats.upcoming}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedCalendarDay && (
              <aside className="panel calendar-day-detail">
                <div className="panel-title">
                  <CalendarDays size={18} />
                  <h2>{selectedCalendarDay}</h2>
                  <button
                    type="button"
                    className="close-detail-btn"
                    onClick={() => setSelectedCalendarDay(null)}
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="day-detail-stats">
                  <div className="day-stat-item">
                    <span className="day-stat-label">待联系</span>
                    <span className="day-stat-value stat-pending">{getDayStats(selectedCalendarDay).pending}</span>
                  </div>
                  <div className="day-stat-item">
                    <span className="day-stat-label">已联系</span>
                    <span className="day-stat-value stat-contacted">{getDayStats(selectedCalendarDay).contacted}</span>
                  </div>
                  <div className="day-stat-item">
                    <span className="day-stat-label">已接种</span>
                    <span className="day-stat-value stat-done">{getDayStats(selectedCalendarDay).done}</span>
                  </div>
                  {getDayStats(selectedCalendarDay).upcoming > 0 && (
                    <div className="day-stat-item">
                      <span className="day-stat-label">即将到期</span>
                      <span className="day-stat-value stat-upcoming">{getDayStats(selectedCalendarDay).upcoming}</span>
                    </div>
                  )}
                </div>
                {Object.keys(getDayStats(selectedCalendarDay).overdueByLevel).length > 0 && (
                  <div className="day-detail-overdue">
                    <p className="overdue-title">
                      <AlertTriangle size={14} /> 逾期分布
                    </p>
                    <div className="overdue-level-list">
                      {Object.entries(getDayStats(selectedCalendarDay).overdueByLevel).map(([level, count]) => (
                        <div key={level} className="overdue-level-item">
                          <span className={`group-tag ${getGroupTagClass(level)}`}>{level}</span>
                          <span className="overdue-count">{count} 条</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="day-records-list">
                  {getDayStats(selectedCalendarDay).items.length === 0 ? (
                    <p className="empty-group">当天暂无提醒记录</p>
                  ) : (
                    getDayStats(selectedCalendarDay).items.map((item) => (
                      <article
                        className={'day-record ' + (item.conflict || hasOverlap(item, records) ? 'conflict' : '') + (draggingRecordId === item.id ? ' is-dragging' : '')}
                        key={item.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggingRecordId(item.id);
                          e.dataTransfer.setData('text/plain', item.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => {
                          setDraggingRecordId(null);
                          setDragOverDate(null);
                          justDraggedRef.current = true;
                          setTimeout(() => {
                            justDraggedRef.current = false;
                          }, 100);
                        }}
                        onClick={() => {
                          if (justDraggedRef.current) {
                            justDraggedRef.current = false;
                            return;
                          }
                          setSelected(item);
                          setCurrentView('records');
                        }}
                      >
                        <div className="day-record-head">
                          <div>
                            <h3>{item.pet}</h3>
                            <p>{`${item.species} · ${item.vaccine} · ${item.ownerPhone}`}</p>
                          </div>
                          <span className={'status ' + statusClass(item.status)}>{item.status}</span>
                        </div>
                        <p className="day-record-detail">{`上次接种：${item.lastDate || '未记录'}`}</p>
                        {(item.conflict || hasOverlap(item, records)) && <div className="warning"><AlertTriangle size={15} />发现冲突</div>}
                        <div className="day-record-actions" onClick={(event) => event.stopPropagation()}>
                          {appConfig.statuses.map((status) => (
                            <button key={status} type="button" onClick={() => updateStatus(item.id, status)}>{status}</button>
                          ))}
                          <button className="ghost-danger" type="button" onClick={() => removeRecord(item.id)}><Trash2 size={14} /></button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </aside>
            )}
          </section>
        </>
      )}

      {currentView === 'records' && (
        <>
          <section className="workspace">
            <form className="panel form-panel" onSubmit={addRecord}>
              <div className="panel-title">
                <ClipboardList size={18} />
                <h2>新增记录</h2>
              </div>
              <div className="form-grid">
                {appConfig.fields.map((field) => {
                  const isAutoField = field.key === 'nextDate';
                  const autoNext = calcNextDate(form.lastDate, form.species, form.vaccine, templates);
                  const isAutoCalculated = isAutoField && autoNext && form.nextDate === autoNext && !nextDateManual;
                  return (
                    <label key={field.key} className={field.type === 'textarea' ? 'wide' : ''}>
                      <span>
                        {field.label}
                        {isAutoField && isAutoCalculated && <span className="auto-badge">自动生成</span>}
                        {isAutoField && nextDateManual && form.nextDate && <span className="manual-badge">手动覆盖</span>}
                      </span>
                      {field.type === 'textarea' ? (
                        <textarea value={form[field.key] || ''} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} placeholder={field.placeholder} />
                      ) : field.type === 'select' ? (
                        <select value={form[field.key] || ''} onChange={(event) => {
                          const next = { ...form, [field.key]: event.target.value };
                          const newSpecies = field.key === 'species' ? event.target.value : form.species;
                          const newVaccine = field.key === 'vaccine' ? event.target.value : form.vaccine;
                          const newLastDate = form.lastDate;
                          const newAutoNext = calcNextDate(newLastDate, newSpecies, newVaccine, templates);
                          if (!nextDateManual) {
                            next.nextDate = newAutoNext || '';
                          }
                          if (field.key === 'vaccine') {
                            const ruleDefault = getDefaultStatusForVaccine(event.target.value, rules);
                            next.status = ruleDefault;
                          }
                          setForm(next);
                        }}>
                          {field.options.map((option) => <option key={option}>{option}</option>)}
                        </select>
                      ) : field.key === 'lastDate' ? (
                        <input
                          type={field.type}
                          value={form[field.key] || ''}
                          name={field.key}
                          onChange={(event) => {
                            const val = event.target.value;
                            const next = { ...form, [field.key]: val };
                            const newAutoNext = calcNextDate(val, form.species, form.vaccine, templates);
                            if (newAutoNext) {
                              next.nextDate = newAutoNext;
                              setNextDateManual(false);
                            } else if (!nextDateManual) {
                              next.nextDate = '';
                            }
                            setForm(next);
                          }}
                          placeholder={field.placeholder}
                        />
                      ) : field.key === 'nextDate' ? (
                        <div className="next-date-input-group">
                          <input
                            type={field.type}
                            value={form[field.key] || ''}
                            name={field.key}
                            onChange={(event) => {
                              setForm({ ...form, nextDate: event.target.value });
                              setNextDateManual(!!event.target.value && event.target.value !== autoNext);
                            }}
                            placeholder={field.placeholder}
                          />
                          <button
                            type="button"
                            className="recalc-btn"
                            onClick={handleRecalcByTemplate}
                            title="根据物种、疫苗和上次接种日期按模板重新计算下次提醒日期"
                          >
                            <RotateCcw size={14} />
                            按模板重新计算
                          </button>
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          value={form[field.key] || ''}
                          name={field.key}
                          onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                          placeholder={field.placeholder}
                        />
                      )}
                      {isAutoField && (
                        <span className="field-hint">
                          {autoNext ? `模板建议：${autoNext}` : '无匹配模板，请手动填写'}
                        </span>
                      )}
                    </label>
                  );
                })}
                <label>
                  <span>当前状态</span>
                  <select value={form.status || appConfig.primaryStatus} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                    {appConfig.statuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
              </div>
              {recalcNotice && (
                <div className={`recalc-notice recalc-notice-${recalcNotice.type}`}>
                  {recalcNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{recalcNotice.message}</span>
                  <button
                    type="button"
                    className="recalc-notice-close"
                    onClick={() => {
                      setRecalcNotice(null);
                      if (recalcTimerRef.current) {
                        clearTimeout(recalcTimerRef.current);
                        recalcTimerRef.current = null;
                      }
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <button className="primary" type="submit"><Plus size={18} />新增</button>
              <button type="button" className="import-btn" onClick={() => setShowImportModal(true)}><Upload size={18} />批量导入CSV</button>
              <button type="button" className="import-btn" onClick={() => { setShowBackupRestoreModal(true); setBackupRestoreStep('main'); }}><Save size={18} />数据备份与恢复</button>
              <p className="hint">{appConfig.note}</p>
            </form>

            <section className="panel list-panel">
              <div className="toolbar">
                <div className="search">
                  <Search size={16} />
                  <input value={filters.query} onChange={(event) => saveFilters({ ...filters, query: event.target.value })} placeholder={appConfig.filters[0]?.label || '搜索'} />
                </div>
                <select value={filters.status} onChange={(event) => saveFilters({ ...filters, status: event.target.value })}>
                  <option>全部</option>
                  {appConfig.statuses.map((status) => <option key={status}>{status}</option>)}
                </select>
                <select value={filters.species} onChange={(event) => saveFilters({ ...filters, species: event.target.value })}>
                  <option value="全部">全部物种</option>
                  {appConfig.fields.find(f => f.key === 'species').options.map((o) => <option key={o}>{o}</option>)}
                </select>
                <select value={filters.vaccine} onChange={(event) => saveFilters({ ...filters, vaccine: event.target.value })}>
                  <option value="全部">全部疫苗</option>
                  {appConfig.fields.find(f => f.key === 'vaccine').options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>

              <div className="records">
                {filteredRecords.map((item) => (
                  <article className={'record ' + (item.conflict || hasOverlap(item, records) ? 'conflict' : '')} key={item.id} onClick={() => setSelected(item)}>
                    <div className="record-head">
                      <div>
                        <h3>{item.pet}</h3>
                        <p>{`${item.species} · ${item.vaccine} · ${item.ownerPhone}`}</p>
                      </div>
                      <span className={'status ' + statusClass(item.status)}>{item.status}</span>
                    </div>
                    <p className="record-detail">{`下次提醒：${item.nextDate}`}</p>
                    {(item.conflict || hasOverlap(item, records)) && <div className="warning"><AlertTriangle size={15} />发现冲突</div>}
                    <div className="actions" onClick={(event) => event.stopPropagation()}>
                      {appConfig.statuses.map((status) => (
                        <button key={status} type="button" onClick={() => updateStatus(item.id, status)}>{status}</button>
                      ))}
                      {appConfig.action === 'copyRecipe' && <button type="button" onClick={() => duplicateRecord(item)}><RotateCcw size={14} />复制</button>}
                      {appConfig.chart && <button type="button" onClick={() => addTemperature(item)}>加温度</button>}
                      <button className="ghost-danger" type="button" onClick={() => removeRecord(item.id)}><Trash2 size={14} /></button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </section>

          <section className="insights">
            <div className="panel">
              <div className="panel-title">
                <CalendarDays size={18} />
                <h2>{appConfig.directory ? '证据目录预览' : appConfig.board ? '床位看板' : '分组视图'}</h2>
              </div>
              {!appConfig.directory && !appConfig.board && (
                <div className="group-mode-selector">
                  <Filter size={14} />
                  <span>分组方式：</span>
                  <button type="button" className={`group-mode-btn ${groupMode === 'auto' ? 'active' : ''}`} onClick={() => saveGroupMode('auto')}>按规则引擎</button>
                  <button type="button" className={`group-mode-btn ${groupMode === 'overdue' ? 'active' : ''}`} onClick={() => saveGroupMode('overdue')}>按逾期等级</button>
                  <button type="button" className={`group-mode-btn ${groupMode === 'vaccine' ? 'active' : ''}`} onClick={() => saveGroupMode('vaccine')}>按疫苗类型</button>
                  <button type="button" className={`group-mode-btn ${groupMode === 'status' ? 'active' : ''}`} onClick={() => saveGroupMode('status')}>按联系状态</button>
                  <button type="button" className={`group-mode-btn ${groupMode === 'date' ? 'active' : ''}`} onClick={() => saveGroupMode('date')}>按日期</button>
                </div>
              )}
              {appConfig.directory ? (
                <div className="directory">
                  {Object.entries(directory).map(([issue, items]) => (
                    <div key={issue} className="directory-group">
                      <strong>{issue}</strong>
                      {items.map((item, index) => <span key={item.id}>{index + 1}. {item.evidence}｜{item.purpose}</span>)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="date-groups">
                  {Object.entries(groupedByDate).map(([date, items]) => (
                    <div key={date} className="date-group">
                      <strong>{date}</strong>
                      <span>{items.length}条记录</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <aside className="panel detail-panel">
              <div className="panel-title">
                <CheckCircle2 size={18} />
                <h2>详情</h2>
              </div>
              {selected ? (
                <div className="detail">
                  <h3>{selected.pet}</h3>
                  <p>{`${selected.species} · ${selected.vaccine} · ${selected.ownerPhone}`}</p>
                  <p>{`下次提醒：${selected.nextDate}`}</p>
                  {selected.temps && (
                    <div className="temp-chart">
                      {selected.temps.map((value, index) => <i key={index} style={{ height: Math.max(10, 56 + Number(value) * 8) }} title={String(value)} />)}
                    </div>
                  )}
                  <div className="timeline">
                    {(selected.timeline || []).map((step, index) => (
                      <span key={index}>{step.at} · {step.status} · {step.by}</span>
                    ))}
                  </div>

                  <div className="notes-section">
                    <div className="notes-title">
                      <MessageSquareText size={18} />
                      <h4>联系备注</h4>
                      <span className="notes-count">{(selected.notes || []).length}条</span>
                    </div>

                    <div className="notes-add-form">
                      <label className="notes-input-label">
                        <User size={14} />
                        <input
                          type="text"
                          value={newNoteOperator}
                          onChange={(event) => setNewNoteOperator(event.target.value)}
                          placeholder="操作人姓名"
                        />
                      </label>
                      <textarea
                        className="notes-textarea"
                        value={newNoteContent}
                        onChange={(event) => setNewNoteContent(event.target.value)}
                        placeholder="输入备注内容..."
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            addNote(selected.id);
                          }
                        }}
                      />
                      <button
                        className="notes-add-btn"
                        type="button"
                        onClick={() => addNote(selected.id)}
                        disabled={!newNoteContent.trim()}
                      >
                        <Plus size={16} />
                        添加备注
                      </button>
                    </div>

                    <div className="notes-list">
                      {selected.notes && selected.notes.length > 0 &&
                        [...selected.notes].reverse().map((note) => (
                          <div className="note-item" key={note.id}>
                            <div className="note-header">
                              <span className="note-operator">
                                <User size={12} />
                                {note.createdBy}
                              </span>
                              <span className="note-date">
                                <Calendar size={12} />
                                {new Date(note.createdAt).toLocaleString('zh-CN', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <button
                                className="note-delete-btn"
                                type="button"
                                onClick={() => removeNote(selected.id, note.id)}
                                title="删除备注"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <div className="note-content">{note.content}</div>
                          </div>
                        ))
                      }
                      {(!selected.notes || selected.notes.length === 0) && (
                        <p className="notes-empty">暂无备注记录</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="empty">点击任意记录查看详情和状态流转。</p>
              )}
            </aside>
          </section>
        </>
      )}

      {showImportModal && (
        <div className="modal-overlay" onClick={cancelImport}>
          <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <FileText size={20} />
                <h2>批量导入宠物疫苗提醒记录</h2>
              </div>
              <button type="button" className="modal-close" onClick={cancelImport}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {!importPreview ? (
                <div
                  className="upload-area"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={48} className="upload-icon" />
                  <h3>点击或拖拽CSV文件到此处上传</h3>
                  <p>支持 .csv 格式文件</p>
                  <div className="csv-format-hint">
                    <p className="hint-title"><Info size={14} />CSV文件格式要求：</p>
                    <ul>
                      <li>必须包含列：宠物姓名、主人联系方式、疫苗类型、下次提醒日期</li>
                      <li>可选列：物种、上次接种日期</li>
                      <li>日期格式支持：YYYY-MM-DD、YYYY/MM/DD、YYYY年MM月DD日</li>
                      <li>手机号支持：11位手机号或7-8位固定电话</li>
                    </ul>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden-file-input"
                  />
                </div>
              ) : (
                <div className="import-preview">
                  <div className="preview-summary">
                    <div className="summary-item">
                      <span className="summary-label">文件名</span>
                      <span className="summary-value">{importPreview.fileName}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">总行数</span>
                      <span className="summary-value">{importPreview.totalRows}</span>
                    </div>
                    <div className="summary-item success">
                      <span className="summary-label"><CheckCheck size={16} />可导入行数</span>
                      <span className="summary-value">{importPreview.validRows.length}</span>
                    </div>
                    <div className="summary-item error">
                      <span className="summary-label"><AlertOctagon size={16} />错误行数</span>
                      <span className="summary-value">{importPreview.errorRows.length}</span>
                    </div>
                  </div>

                  {importPreview.missingRequiredFields && importPreview.missingRequiredFields.length > 0 && (
                    <div className="preview-section fatal-section">
                      <h3><AlertOctagon size={16} className="fatal-icon" />缺少必填字段映射</h3>
                      <p className="fatal-text">以下必填字段尚未映射到CSV列，无法进行导入：</p>
                      <div className="missing-fields-list">
                        {importPreview.missingRequiredFields.map((field) => (
                          <span key={field} className="missing-field-item">{field}</span>
                        ))}
                      </div>
                      <p className="fatal-hint">请在下方"字段映射设置"中为这些字段选择对应的CSV列。</p>
                    </div>
                  )}

                  <div className="preview-section">
                    <h3><Settings size={16} />字段映射设置</h3>
                    <p className="mapping-hint">系统已自动识别列名，您可以手动调整CSV列与系统字段的对应关系。</p>
                    <div className="field-mapping-editor">
                      {importPreview.detectedFields.map((field) => (
                        <div key={field.key} className={`field-mapping-row ${field.detected ? 'detected' : 'missing'}`}>
                          <div className="field-name-col">
                            <span className="field-label">
                              {field.label}
                              {field.required && <span className="required-mark">*</span>}
                            </span>
                          </div>
                          <div className="field-arrow-col">
                            <ChevronRight size={16} className="mapping-arrow" />
                          </div>
                          <div className="field-select-col">
                            <select
                              className="field-mapping-select"
                              value={importPreview.fieldMapping[field.key] !== undefined ? importPreview.fieldMapping[field.key] : ''}
                              onChange={(e) => handleFieldMappingChange(field.key, e.target.value)}
                            >
                              <option value="">-- 不映射 --</option>
                              {importPreview.headers.map((header, index) => (
                                <option key={index} value={index}>
                                  {header}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="field-hint"><span className="required-mark">*</span> 标记为必填字段，缺少必填字段时无法导入</p>
                  </div>

                  {importPreview.fileDuplicates.length > 0 && (
                    <div className="preview-section warning-section">
                      <h3><AlertTriangle size={16} className="warning-icon" />导入文件内重复联系方式</h3>
                      <p>以下号码在导入文件中出现多次，可能导致重复记录：</p>
                      <div className="duplicate-list">
                        {importPreview.fileDuplicates.map((phone) => (
                          <span key={phone} className="duplicate-item">{phone}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {importPreview.existingDuplicates.length > 0 && (
                    <div className="preview-section warning-section">
                      <h3><AlertTriangle size={16} className="warning-icon" />与现有记录重复的联系方式</h3>
                      <p>以下号码在系统中已存在，导入后将新增重复记录：</p>
                      <div className="duplicate-list">
                        {importPreview.existingDuplicates.map((phone) => (
                          <span key={phone} className="duplicate-item">{phone}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {importPreview.allWarnings.length > 0 && (
                    <div className="preview-section warning-section">
                      <h3><AlertTriangle size={16} className="warning-icon" />警告信息</h3>
                      <ul className="warning-list">
                        {importPreview.allWarnings.slice(0, 10).map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                        {importPreview.allWarnings.length > 10 && (
                          <li>... 还有 {importPreview.allWarnings.length - 10} 条警告</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {importPreview.errorRows.length > 0 && (
                    <div className="preview-section error-section">
                      <h3><AlertOctagon size={16} className="error-icon" />错误行摘要</h3>
                      <div className="error-list">
                        {importPreview.errorRows.slice(0, 10).map((row) => (
                          <div key={row.rowIndex} className="error-item">
                            <span className="error-row">第 {row.rowIndex} 行</span>
                            <ul>
                              {row.errors.map((error, idx) => (
                                <li key={idx}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        {importPreview.errorRows.length > 10 && (
                          <p className="more-errors">... 还有 {importPreview.errorRows.length - 10} 行错误，请修正后重新上传</p>
                        )}
                      </div>
                    </div>
                  )}

                  {importPreview.validRows.length > 0 && (
                    <div className="preview-section">
                      <h3><CheckCircle2 size={16} className="success-icon" />数据预览（前5条）</h3>
                      <div className="preview-table-container">
                        <table className="preview-table">
                          <thead>
                            <tr>
                              <th>宠物姓名</th>
                              <th>物种</th>
                              <th>联系方式</th>
                              <th>疫苗类型</th>
                              <th>上次接种</th>
                              <th>下次提醒</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importPreview.validRows.slice(0, 5).map((row) => (
                              <tr key={row.rowIndex}>
                                <td>{row.data.pet}</td>
                                <td>{row.data.species}</td>
                                <td>{row.data.ownerPhone}</td>
                                <td>{row.data.vaccine}</td>
                                <td>{row.data.lastDate || '-'}</td>
                                <td>{row.data.nextDate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {importPreview && (
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={cancelImport}>取消</button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={confirmImport}
                  disabled={importPreview.validRows.length === 0 || (importPreview.missingRequiredFields && importPreview.missingRequiredFields.length > 0)}
                >
                  <CheckCircle2 size={16} />
                  确认导入 {importPreview.validRows.length} 条记录
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showBackupRestoreModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && cancelRestore()}>
          <div className="modal-content import-modal">
            <div className="modal-header">
              <div className="modal-title">
                <Save size={20} />
                <h2>数据备份与恢复</h2>
              </div>
              <button type="button" className="modal-close" onClick={cancelRestore}>
                <X size={20} />
              </button>
            </div>

            {backupRestoreStep === 'main' && (
              <div className="modal-body">
                <div className="backup-restore-options">
                  <div className="backup-restore-card export-card">
                    <div className="card-icon">
                      <FileText size={32} />
                    </div>
                    <h3>导出数据</h3>
                    <p>将当前门店的完整数据导出为JSON备份文件，包含记录、模板、规则、筛选条件和分组模式等所有配置。</p>
                    <div className="record-count-info">
                      共 <strong>{records.length}</strong> 条记录将被导出
                    </div>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => {
                        exportToJSON();
                        cancelRestore();
                      }}
                    >
                      <FileText size={16} />
                      导出JSON文件
                    </button>
                  </div>

                  <div className="backup-restore-card import-card">
                    <div className="card-icon">
                      <Upload size={32} />
                    </div>
                    <h3>恢复数据</h3>
                    <p>选择之前导出的JSON备份文件恢复数据。可选择需要恢复的模块，恢复前将展示预览信息，确认后才会执行。</p>
                    <p className="warning-text">
                      <AlertTriangle size={14} />
                      注意：记录按ID覆盖、宠物+疫苗重复会跳过；配置类模块将整体覆盖
                    </p>
                    <div
                      className="drop-zone"
                      onDrop={handleRestoreDrop}
                      onDragOver={handleRestoreDragOver}
                      onClick={() => restoreFileInputRef.current?.click()}
                    >
                      <Upload size={24} />
                      <p>点击或拖拽JSON文件到此处</p>
                      <p className="drop-hint">仅支持 .json 格式文件</p>
                      <input
                        ref={restoreFileInputRef}
                        type="file"
                        accept=".json,application/json"
                        style={{ display: 'none' }}
                        onChange={handleRestoreFileUpload}
                      />
                    </div>

                    {restoreError && (
                      <div className="error-message">
                        <AlertOctagon size={16} />
                        <span>{restoreError.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {backupRestoreStep === 'preview' && restorePreview && (
              <div className="modal-body">
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => {
                    setBackupRestoreStep('main');
                    setRestorePreview(null);
                    setRestoreFile(null);
                    setRestoreError(null);
                    if (restoreFileInputRef.current) {
                      restoreFileInputRef.current.value = '';
                    }
                  }}
                >
                  <ArrowLeft size={16} />
                  返回
                </button>

                <div className="restore-file-info">
                  <h3>文件信息</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">文件名</span>
                      <span className="info-value">{restorePreview.fileName}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">文件大小</span>
                      <span className="info-value">{restorePreview.fileSize} KB</span>
                    </div>
                    {restorePreview.exportedAt && (
                      <div className="info-item">
                        <span className="info-label">导出时间</span>
                        <span className="info-value">
                          {new Date(restorePreview.exportedAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                    )}
                    <div className="info-item">
                      <span className="info-label">数据版本</span>
                      <span className="info-value">v{restorePreview.version}</span>
                    </div>
                  </div>
                </div>

                {restorePreview.modules?.isLegacyFormat ? (
                  <div className="restore-modules-section">
                    <h3><Info size={16} className="info-icon" />恢复模块</h3>
                    <div className="restore-modules-legacy">
                      <p className="legacy-hint">⚠️ 旧版备份仅包含记录数据，将按原有逻辑恢复（新增/覆盖/跳过）</p>
                      <label className="module-checkbox disabled">
                        <input
                          type="checkbox"
                          checked={restoreRecords}
                          disabled
                        />
                        <span className="module-label">
                          <span className="module-name">客户记录</span>
                          <span className="module-count">{restorePreview.changes.totalValid} 条有效记录</span>
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="restore-modules-section">
                    <h3><Info size={16} className="info-icon" />选择要恢复的模块</h3>
                    <div className="restore-modules-list">
                      <label className="module-checkbox">
                        <input
                          type="checkbox"
                          checked={restoreRecords}
                          onChange={(e) => setRestoreRecords(e.target.checked)}
                        />
                        <span className="module-label">
                          <span className="module-name">客户记录</span>
                          <span className="module-count">{restorePreview.changes.totalValid} 条记录（新增/覆盖/跳过）</span>
                        </span>
                      </label>
                      <label className={`module-checkbox ${!restorePreview.modules?.templates ? 'disabled' : ''}`}>
                        <input
                          type="checkbox"
                          checked={restorePreview.modules?.templates ? restoreTemplates : false}
                          disabled={!restorePreview.modules?.templates}
                          onChange={(e) => setRestoreTemplates(e.target.checked)}
                        />
                        <span className="module-label">
                          <span className="module-name">免疫模板</span>
                          <span className="module-count">
                            {restorePreview.modules?.templates
                              ? `${restorePreview.rawData?.templates?.length || 0} 个模板（将被覆盖）`
                              : '备份中不包含'}
                          </span>
                        </span>
                      </label>
                      <label className={`module-checkbox ${!restorePreview.modules?.rules ? 'disabled' : ''}`}>
                        <input
                          type="checkbox"
                          checked={restorePreview.modules?.rules ? restoreRules : false}
                          disabled={!restorePreview.modules?.rules}
                          onChange={(e) => setRestoreRules(e.target.checked)}
                        />
                        <span className="module-label">
                          <span className="module-name">提醒规则</span>
                          <span className="module-count">
                            {restorePreview.modules?.rules
                              ? `${restorePreview.rawData?.rules?.length || 0} 条规则（将被覆盖）`
                              : '备份中不包含'}
                          </span>
                        </span>
                      </label>
                      <label className={`module-checkbox ${!restorePreview.modules?.filters ? 'disabled' : ''}`}>
                        <input
                          type="checkbox"
                          checked={restorePreview.modules?.filters ? restoreFilters : false}
                          disabled={!restorePreview.modules?.filters}
                          onChange={(e) => setRestoreFilters(e.target.checked)}
                        />
                        <span className="module-label">
                          <span className="module-name">筛选条件</span>
                          <span className="module-count">
                            {restorePreview.modules?.filters
                              ? '包含（将被覆盖）'
                              : '备份中不包含'}
                          </span>
                        </span>
                      </label>
                      <label className={`module-checkbox ${!restorePreview.modules?.groupMode ? 'disabled' : ''}`}>
                        <input
                          type="checkbox"
                          checked={restorePreview.modules?.groupMode ? restoreGroupMode : false}
                          disabled={!restorePreview.modules?.groupMode}
                          onChange={(e) => setRestoreGroupMode(e.target.checked)}
                        />
                        <span className="module-label">
                          <span className="module-name">分组模式</span>
                          <span className="module-count">
                            {restorePreview.modules?.groupMode
                              ? '包含（将被覆盖）'
                              : '备份中不包含'}
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {restorePreview && restorePreview.validation && (restorePreview.validation.allWarnings || []).length > 0 && (
                  <div className="warnings-section">
                    <h3><AlertTriangle size={16} className="warning-icon" />警告</h3>
                    <ul className="warnings-list">
                      {(restorePreview.validation.allWarnings || []).slice(0, 10).map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                      {(restorePreview.validation.allWarnings || []).length > 10 && (
                        <li>... 还有 {(restorePreview.validation.allWarnings || []).length - 10} 条警告</li>
                      )}
                    </ul>
                  </div>
                )}

                {restorePreview && restorePreview.validation && (restorePreview.validation.invalidRecords || []).length > 0 && (
                  <div className="errors-section">
                    <h3><AlertOctagon size={16} className="error-icon" />无效记录（{(restorePreview.validation.invalidRecords || []).length} 条）</h3>
                    <div className="invalid-records-list">
                      {(restorePreview.validation.invalidRecords || []).slice(0, 5).map((item, i) => (
                        <div key={i} className="invalid-record-item">
                          <span className="record-index">第 {item.index + 1} 条：</span>
                          <span className="record-error">{(item.errors || []).join('；')}</span>
                        </div>
                      ))}
                      {(restorePreview.validation.invalidRecords || []).length > 5 && (
                        <p className="more-errors">... 还有 {(restorePreview.validation.invalidRecords || []).length - 5} 条无效记录</p>
                      )}
                    </div>
                  </div>
                )}

                {restoreRecords && (
                  <div className="restore-summary">
                    <h3><Info size={16} />记录恢复统计</h3>
                    <div className="summary-cards">
                      <div className="summary-card add-card">
                        <div className="summary-icon add-icon">
                          <Plus size={24} />
                        </div>
                        <div className="summary-content">
                          <span className="summary-label">新增记录</span>
                          <span className="summary-value">{restorePreview.changes.addCount}</span>
                        </div>
                      </div>
                      <div className="summary-card overwrite-card">
                        <div className="summary-icon overwrite-icon">
                          <Edit3 size={24} />
                        </div>
                        <div className="summary-content">
                          <span className="summary-label">覆盖记录</span>
                          <span className="summary-value">{restorePreview.changes.overwriteCount}</span>
                        </div>
                      </div>
                      <div className="summary-card skip-card">
                        <div className="summary-icon skip-icon">
                          <X size={24} />
                        </div>
                        <div className="summary-content">
                          <span className="summary-label">跳过记录</span>
                          <span className="summary-value">{restorePreview.changes.skipCount}</span>
                        </div>
                      </div>
                    </div>
                    <div className="summary-total">
                      有效记录：{restorePreview.changes.totalValid} 条 / 当前记录：{records.length} 条
                    </div>
                  </div>
                )}

                {restoreRecords && restorePreview.changes.overwriteCount > 0 && (
                  <div className="overwrite-preview-section">
                    <h3><AlertTriangle size={16} className="warning-icon" />将被覆盖的记录（前5条）</h3>
                    <div className="overwrite-table-container">
                      <table className="preview-table">
                        <thead>
                          <tr>
                            <th>宠物姓名</th>
                            <th>联系方式</th>
                            <th>疫苗类型</th>
                            <th>当前状态</th>
                            <th>新状态</th>
                            <th>当前下次提醒</th>
                            <th>新下次提醒</th>
                          </tr>
                        </thead>
                        <tbody>
                          {restorePreview.changes.overwriteRecords.slice(0, 5).map((item, i) => (
                            <tr key={i}>
                              <td>{item.existingRecord.pet}</td>
                              <td>{item.existingRecord.ownerPhone}</td>
                              <td>{item.existingRecord.vaccine}</td>
                              <td><span className={`status ${statusClass(item.existingRecord.status)}`}>{item.existingRecord.status}</span></td>
                              <td><span className={`status ${statusClass(item.newRecord.status)}`}>{item.newRecord.status}</span></td>
                              <td>{item.existingRecord.nextDate}</td>
                              <td>{item.newRecord.nextDate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {restoreRecords && restorePreview.changes.addCount > 0 && (
                  <div className="add-preview-section">
                    <h3><CheckCircle2 size={16} className="success-icon" />将新增的记录（前5条）</h3>
                    <div className="preview-table-container">
                      <table className="preview-table">
                        <thead>
                          <tr>
                            <th>宠物姓名</th>
                            <th>物种</th>
                            <th>联系方式</th>
                            <th>疫苗类型</th>
                            <th>下次提醒</th>
                            <th>状态</th>
                          </tr>
                        </thead>
                        <tbody>
                          {restorePreview.changes.addRecords.slice(0, 5).map((record, i) => (
                            <tr key={i}>
                              <td>{record.pet}</td>
                              <td>{record.species}</td>
                              <td>{record.ownerPhone}</td>
                              <td>{record.vaccine}</td>
                              <td>{record.nextDate}</td>
                              <td><span className={`status ${statusClass(record.status)}`}>{record.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {restoreRecords && restorePreview.changes.skipCount > 0 && (
                  <div className="skip-preview-section">
                    <h3><Info size={16} className="info-icon" />将跳过的记录（前5条）</h3>
                    <div className="skip-table-container">
                      <table className="preview-table">
                        <thead>
                          <tr>
                            <th>宠物姓名</th>
                            <th>联系方式</th>
                            <th>疫苗类型</th>
                            <th>跳过原因</th>
                          </tr>
                        </thead>
                        <tbody>
                          {restorePreview.changes.skipRecords.slice(0, 5).map((item, i) => (
                            <tr key={i}>
                              <td>{item.newRecord.pet}</td>
                              <td>{item.newRecord.ownerPhone}</td>
                              <td>{item.newRecord.vaccine}</td>
                              <td className="skip-reason">{item.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {backupRestoreStep === 'preview' && restorePreview && (
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={cancelRestore}>取消</button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={confirmRestore}
                  disabled={!restoreRecords && !restoreTemplates && !restoreRules && !restoreFilters && !restoreGroupMode}
                >
                  <CheckCheck size={16} />
                  确认恢复
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showBatchContactModal && (
        <div className="modal-overlay" onClick={() => { setShowBatchContactModal(false); setBatchContactOperator(''); }}>
          <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <CheckCircle2 size={20} />
                <h2>批量标记为已联系</h2>
              </div>
              <button type="button" className="modal-close" onClick={() => { setShowBatchContactModal(false); setBatchContactOperator(''); }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="batch-confirm-section">
                <div className="batch-impact-summary">
                  <div className="impact-card">
                    <div className="impact-icon">
                      <Users size={24} />
                    </div>
                    <div className="impact-content">
                      <span className="impact-label">影响记录数</span>
                      <span className="impact-value">{selectedPendingCount}</span>
                    </div>
                  </div>
                  <div className="impact-card">
                    <div className="impact-icon">
                      <PawPrint size={24} />
                    </div>
                    <div className="impact-content">
                      <span className="impact-label">涉及宠物</span>
                      <span className="impact-value">
                        {new Set(
                          Array.from(selectedContactIds)
                            .map(id => allContactRecords.find(r => r.id === id))
                            .filter(r => r && r.status === '待联系')
                            .map(r => r.ownerPhone)
                        ).size}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="batch-preview-section">
                  <div className="section-title">
                    <Info size={16} />
                    <h3>操作说明</h3>
                  </div>
                  <ul className="batch-hints">
                    <li>所有选中的 <strong>{selectedPendingCount}</strong> 条"待联系"记录将被标记为"已联系"</li>
                    <li>已处于"已联系"或"已接种"状态的记录不会被修改</li>
                    <li>所有记录将写入 <strong>同一条时间线记录</strong>，操作时间和操作人保持一致</li>
                    <li>操作完成后，详情、主人档案和统计数据将立即同步更新</li>
                  </ul>
                </div>

                <div className="batch-preview-section">
                  <div className="section-title">
                    <ClipboardList size={16} />
                    <h3>待处理记录预览（前10条）</h3>
                  </div>
                  <div className="preview-table-container">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th>宠物姓名</th>
                          <th>主人联系方式</th>
                          <th>疫苗类型</th>
                          <th>当前状态</th>
                          <th>分组</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(selectedContactIds)
                          .map(id => allContactRecords.find(r => r.id === id))
                          .filter(r => r && r.status === '待联系')
                          .slice(0, 10)
                          .map((item) => (
                            <tr key={item.id}>
                              <td>{item.pet}</td>
                              <td>{item.ownerPhone}</td>
                              <td>{item.vaccine}</td>
                              <td><span className={`status ${statusClass(item.status)}`}>{item.status}</span></td>
                              <td>
                                {isOverdue(item.nextDate) ? '逾期' : isToday(item.nextDate) ? '今日' : '即将到期'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {selectedPendingCount > 10 && (
                      <p className="more-records">... 还有 {selectedPendingCount - 10} 条记录</p>
                    )}
                  </div>
                </div>

                <div className="form-field">
                  <label>
                    <span>操作人姓名</span>
                    <input
                      type="text"
                      value={batchContactOperator}
                      onChange={(e) => setBatchContactOperator(e.target.value)}
                      placeholder="请输入操作人姓名（可选）"
                    />
                  </label>
                  <span className="field-hint">时间线记录中将显示操作人，留空则显示"批量操作"</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => { setShowBatchContactModal(false); setBatchContactOperator(''); }}>
                取消
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const pendingIds = new Set(
                    Array.from(selectedContactIds)
                      .filter(id => {
                        const item = allContactRecords.find(r => r.id === id);
                        return item && item.status === '待联系';
                      })
                  );
                  batchUpdateStatus(pendingIds, '已联系', batchContactOperator);
                  setShowBatchContactModal(false);
                  setBatchContactOperator('');
                }}
                disabled={selectedPendingCount === 0}
              >
                <CheckCheck size={16} />
                确认批量标记 {selectedPendingCount} 条记录为已联系
              </button>
            </div>
          </div>
        </div>
      )}

      {showStoreModal && (
        <div className="modal-overlay" onClick={() => { setShowStoreModal(false); handleCancelStoreImport(); setStoreModalTab('list'); setEditingStoreId(null); setEditingStoreName(''); setNewStoreName(''); setNewStoreTemplateId(''); }}>
          <div className="modal store-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Building2 size={20} />多门店离线数据空间</h2>
              <button type="button" className="modal-close-btn" onClick={() => { setShowStoreModal(false); handleCancelStoreImport(); setStoreModalTab('list'); setEditingStoreId(null); setEditingStoreName(''); setNewStoreName(''); setNewStoreTemplateId(''); }}>
                <X size={18} />
              </button>
            </div>

            <div className="store-modal-tabs">
              <button
                type="button"
                className={`store-tab-btn ${storeModalTab === 'list' ? 'active' : ''}`}
                onClick={() => setStoreModalTab('list')}
              >
                门店列表
              </button>
              <button
                type="button"
                className={`store-tab-btn ${storeModalTab === 'create' ? 'active' : ''}`}
                onClick={() => setStoreModalTab('create')}
              >
                <Plus size={14} />
                新建门店
              </button>
              <button
                type="button"
                className={`store-tab-btn ${storeModalTab === 'import' ? 'active' : ''}`}
                onClick={() => setStoreModalTab('import')}
              >
                <Upload size={14} />
                导入门店
              </button>
            </div>

            <div className="modal-body">
              {storeModalTab === 'list' && (
                <div className="store-list">
                  <p className="store-list-hint">共 {stores.length} 个门店，点击门店名称可快速切换</p>
                  <div className="store-list-items">
                    {stores.map((store) => {
                      const storeData = loadStoreData(store.id);
                      const recordCount = storeData?.records?.length || 0;
                      const isActive = store.id === currentStoreId;
                      return (
                        <div key={store.id} className={`store-item ${isActive ? 'active' : ''}`}>
                          <div className="store-item-main" onClick={() => { handleSwitchStore(store.id); setShowStoreModal(false); }}>
                            <div className="store-item-icon"><Building2 size={20} /></div>
                            <div className="store-item-info">
                              <div className="store-item-name">
                                {store.name}
                                {store.isDefault && <span className="store-badge-default">默认</span>}
                                {isActive && <span className="store-badge-active">当前</span>}
                              </div>
                              <div className="store-item-meta">
                                <span>{recordCount} 条记录</span>
                                <span>创建于 {new Date(store.createdAt).toLocaleDateString('zh-CN')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="store-item-actions">
                            {editingStoreId === store.id ? (
                              <div className="store-rename-form">
                                <input
                                  type="text"
                                  value={editingStoreName}
                                  onChange={(e) => setEditingStoreName(e.target.value)}
                                  placeholder="输入新名称"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <button type="button" className="btn-primary btn-sm" onClick={handleRenameStore}>确定</button>
                                <button type="button" className="btn-secondary btn-sm" onClick={() => { setEditingStoreId(null); setEditingStoreName(''); }}>取消</button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="store-action-btn"
                                  title="重命名"
                                  onClick={(e) => { e.stopPropagation(); setEditingStoreId(store.id); setEditingStoreName(store.name); }}
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="store-action-btn"
                                  title="复制为新门店"
                                  onClick={(e) => { e.stopPropagation(); setNewStoreName(store.name + ' 副本'); setNewStoreTemplateId(store.id); setStoreModalTab('create'); }}
                                >
                                  <Copy size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="store-action-btn"
                                  title="导出门店数据"
                                  onClick={(e) => { e.stopPropagation(); handleExportStore(store.id, store.name); }}
                                >
                                  <Download size={14} />
                                </button>
                                {!store.isDefault && (
                                  <button
                                    type="button"
                                    className="store-action-btn delete-btn"
                                    title="删除门店"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteStore(store.id); }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {storeModalTab === 'create' && (
                <div className="store-create-form">
                  <div className="form-grid">
                    <label className="wide">
                      门店名称
                      <input
                        type="text"
                        value={newStoreName}
                        onChange={(e) => setNewStoreName(e.target.value)}
                        placeholder="请输入门店名称"
                      />
                    </label>
                    <label className="wide">
                      复制模板（可选）
                      <select
                        value={newStoreTemplateId}
                        onChange={(e) => setNewStoreTemplateId(e.target.value)}
                      >
                        <option value="">不使用模板（空门店）</option>
                        {stores.map((s) => (
                          <option key={s.id} value={s.id}>复制自：{s.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="hint">
                    {newStoreTemplateId
                      ? '将从选中门店复制所有数据（记录、模板、规则等）到新门店'
                      : '新门店将使用默认模板和示例数据'}
                  </p>
                  <button
                    type="button"
                    className="primary"
                    onClick={handleCreateStore}
                    disabled={!newStoreName.trim()}
                  >
                    <Plus size={16} />
                    创建门店
                  </button>
                </div>
              )}

              {storeModalTab === 'import' && (
                <div className="store-import-form">
                  <label className="wide">
                    导入目标门店
                    <select
                      value={storeImportTargetId}
                      onChange={(e) => setStoreImportTargetId(e.target.value)}
                    >
                      <option value="">请选择要恢复的门店</option>
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </label>
                  <p className="hint">选择目标门店后，可选择需要恢复的模块分别进行恢复</p>

                  <div
                    className="import-drop-zone"
                    onDragOver={handleDragOver}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.name.endsWith('.json')) {
                        const newE = { target: { files: [file] } };
                        handleStoreImportFile(newE);
                      } else {
                        alert('请上传JSON格式的门店数据文件');
                      }
                    }}
                  >
                    <Upload size={32} className="drop-icon" />
                    <p>拖拽 JSON 文件到此处，或</p>
                    <button type="button" className="btn-secondary" onClick={() => storeImportFileRef.current?.click()}>
                      选择文件
                    </button>
                    <input
                      ref={storeImportFileRef}
                      type="file"
                      accept=".json,application/json"
                      style={{ display: 'none' }}
                      onChange={handleStoreImportFile}
                    />
                  </div>

                  {storeImportPreview && (
                    <div className={`import-preview ${storeImportPreview.valid ? 'valid' : 'invalid'}`}>
                      <h4>
                        {storeImportPreview.valid ? (
                          <><CheckCircle2 size={16} className="success-icon" /> 文件解析成功</>
                        ) : (
                          <><AlertTriangle size={16} className="warning-icon" /> 文件解析失败</>
                        )}
                      </h4>
                      <p>文件名：{storeImportPreview.fileName}</p>
                      {storeImportPreview.valid && (
                        <>
                          <div className="import-stats">
                            <span>记录数：{storeImportPreview.recordCount}</span>
                            {storeImportPreview.modules?.templates && <span>模板数：{storeImportPreview.templateCount}</span>}
                            {storeImportPreview.modules?.rules && <span>规则数：{storeImportPreview.ruleCount}</span>}
                          </div>
                          {storeImportPreview.modules?.isLegacyFormat ? (
                            <div className="import-modules-legacy">
                              <p className="legacy-hint">⚠️ 旧版备份仅包含记录数据，将按原有逻辑恢复</p>
                              <label className="module-checkbox disabled">
                                <input
                                  type="checkbox"
                                  checked={importRestoreRecords}
                                  disabled
                                />
                                <span className="module-label">
                                  <span className="module-name">客户记录</span>
                                  <span className="module-count">{storeImportPreview.recordCount} 条记录</span>
                                </span>
                              </label>
                            </div>
                          ) : (
                            <div className="import-modules">
                              <p className="modules-title">选择要恢复的模块：</p>
                              <label className="module-checkbox">
                                <input
                                  type="checkbox"
                                  checked={importRestoreRecords}
                                  onChange={(e) => setImportRestoreRecords(e.target.checked)}
                                />
                                <span className="module-label">
                                  <span className="module-name">客户记录</span>
                                  <span className="module-count">{storeImportPreview.recordCount} 条记录</span>
                                </span>
                              </label>
                              <label className={`module-checkbox ${!storeImportPreview.modules?.templates ? 'disabled' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={storeImportPreview.modules?.templates ? importRestoreTemplates : false}
                                  disabled={!storeImportPreview.modules?.templates}
                                  onChange={(e) => setImportRestoreTemplates(e.target.checked)}
                                />
                                <span className="module-label">
                                  <span className="module-name">免疫模板</span>
                                  <span className="module-count">
                                    {storeImportPreview.modules?.templates
                                      ? `${storeImportPreview.templateCount} 个模板（将被覆盖）`
                                      : '备份中不包含'}
                                  </span>
                                </span>
                              </label>
                              <label className={`module-checkbox ${!storeImportPreview.modules?.rules ? 'disabled' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={storeImportPreview.modules?.rules ? importRestoreRules : false}
                                  disabled={!storeImportPreview.modules?.rules}
                                  onChange={(e) => setImportRestoreRules(e.target.checked)}
                                />
                                <span className="module-label">
                                  <span className="module-name">提醒规则</span>
                                  <span className="module-count">
                                    {storeImportPreview.modules?.rules
                                      ? `${storeImportPreview.ruleCount} 条规则（将被覆盖）`
                                      : '备份中不包含'}
                                  </span>
                                </span>
                              </label>
                              <label className={`module-checkbox ${!storeImportPreview.modules?.filters ? 'disabled' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={storeImportPreview.modules?.filters ? importRestoreFilters : false}
                                  disabled={!storeImportPreview.modules?.filters}
                                  onChange={(e) => setImportRestoreFilters(e.target.checked)}
                                />
                                <span className="module-label">
                                  <span className="module-name">筛选条件</span>
                                  <span className="module-count">
                                    {storeImportPreview.modules?.filters
                                      ? '包含（将被覆盖）'
                                      : '备份中不包含'}
                                  </span>
                                </span>
                              </label>
                              <label className={`module-checkbox ${!storeImportPreview.modules?.groupMode ? 'disabled' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={storeImportPreview.modules?.groupMode ? importRestoreGroupMode : false}
                                  disabled={!storeImportPreview.modules?.groupMode}
                                  onChange={(e) => setImportRestoreGroupMode(e.target.checked)}
                                />
                                <span className="module-label">
                                  <span className="module-name">分组模式</span>
                                  <span className="module-count">
                                    {storeImportPreview.modules?.groupMode
                                      ? '包含（将被覆盖）'
                                      : '备份中不包含'}
                                  </span>
                                </span>
                              </label>
                            </div>
                          )}
                        </>
                      )}
                      {storeImportPreview.errors.length > 0 && (
                        <div className="import-errors">
                          {storeImportPreview.errors.map((err, i) => (
                            <p key={i} className="error-text">❌ {err}</p>
                          ))}
                        </div>
                      )}
                      {storeImportPreview.warnings.length > 0 && (
                        <div className="import-warnings">
                          {storeImportPreview.warnings.map((w, i) => (
                            <p key={i} className="warning-text">⚠️ {w}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {storeModalTab === 'import' && storeImportPreview?.valid && storeImportTargetId && (
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCancelStoreImport}>取消</button>
                <button type="button" className="btn-primary" onClick={handleConfirmStoreImport}>
                  <CheckCheck size={16} />
                  确认导入
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
