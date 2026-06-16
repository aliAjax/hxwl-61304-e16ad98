import { appConfig, BACKUP_FORMAT_VERSION, STORE_SCHEMA_VERSION, SCHEMA_VERSION, today, uid } from './config.js';
import { normalizePhone } from './csvImport.js';
import {
  getStoreMetaStorageKey,
  getStoreDataKey,
  loadStoresMeta,
  persistStoresMeta,
  loadStoreData,
  persistStoreData,
  initStores,
  createDefaultStoreData
} from './storeStorage.js';

function safeParseStorageValue(key) {
  const raw = localStorage.getItem(key);
  if (raw === null) return { exists: false, value: null, error: null };
  try {
    return { exists: true, value: JSON.parse(raw), error: null };
  } catch (error) {
    return { exists: true, value: null, error };
  }
}

function compareConfigList(a, b) {
  return JSON.stringify(a || []) === JSON.stringify(b || []);
}

function detectDataHealthIssues() {
  const issues = [];
  const META_KEY = getStoreMetaStorageKey();
  const metaCheck = safeParseStorageValue(META_KEY);
  const oldRecordCheck = safeParseStorageValue(appConfig.storage);

  if (oldRecordCheck.exists && Array.isArray(oldRecordCheck.value) && oldRecordCheck.value.length > 0) {
    issues.push({
      id: 'legacy-single-store',
      severity: 'warning',
      title: '旧版单店数据残留',
      risk: '旧版记录仍保留在单店存储键中，可能让导入恢复或旧逻辑读取到过期数据。',
      action: '迁移到默认门店并清理旧版记录键',
      fixable: true,
      count: oldRecordCheck.value.length
    });
  } else if (oldRecordCheck.error) {
    issues.push({
      id: 'legacy-single-store-damaged',
      severity: 'critical',
      title: '旧版单店数据损坏',
      risk: '旧版记录键不是有效JSON，无法确认其中是否还有未迁移数据。',
      action: '导出安全备份后清理损坏的旧版记录键',
      fixable: true,
      count: 1
    });
  }

  if (!metaCheck.exists || metaCheck.error || !metaCheck.value || !Array.isArray(metaCheck.value.stores) || metaCheck.value.stores.length === 0) {
    issues.push({
      id: 'stores-meta-missing',
      severity: 'critical',
      title: '多门店元数据缺失或损坏',
      risk: '门店列表或当前门店指针不可用，门店切换与数据隔离可能失效。',
      action: '重建默认门店元数据，并保留可读取的现有记录',
      fixable: true,
      count: 1
    });
    return issues;
  }

  const stores = metaCheck.value.stores;
  const baseStore = stores[0];
  const baseData = baseStore ? loadStoreData(baseStore.id) : null;

  stores.forEach((store) => {
    const key = getStoreDataKey(store.id);
    const dataCheck = safeParseStorageValue(key);
    if (!dataCheck.exists || dataCheck.error || !dataCheck.value || !Array.isArray(dataCheck.value.records)) {
      issues.push({
        id: `store-data-damaged:${store.id}`,
        severity: 'critical',
        title: `门店数据缺失或损坏：${store.name}`,
        risk: '该门店记录无法读取，切换到此门店时会出现空数据或默认数据覆盖风险。',
        action: '重建该门店的数据结构',
        fixable: true,
        storeId: store.id,
        count: 1
      });
      return;
    }

    const data = dataCheck.value;
    const missingTimeline = (data.records || []).filter((record) => !Array.isArray(record.timeline) || record.timeline.length === 0);
    if (missingTimeline.length > 0) {
      issues.push({
        id: `records-missing-timeline:${store.id}`,
        severity: 'warning',
        title: `记录缺少timeline：${store.name}`,
        risk: '状态流转历史不完整，恢复或审计时无法追踪原始状态来源。',
        action: '为缺失记录补充当前状态的迁移时间线',
        fixable: true,
        storeId: store.id,
        count: missingTimeline.length,
        samples: missingTimeline.slice(0, 3).map((record) => record.pet || record.ownerPhone || record.id)
      });
    }

    const missingNotes = (data.records || []).filter((record) => !Array.isArray(record.notes));
    if (missingNotes.length > 0) {
      issues.push({
        id: `records-missing-notes:${store.id}`,
        severity: 'warning',
        title: `记录缺少notes：${store.name}`,
        risk: '备注结构缺失会导致详情页备注区域和备份恢复数据结构不一致。',
        action: '为缺失记录补充空备注数组',
        fixable: true,
        storeId: store.id,
        count: missingNotes.length,
        samples: missingNotes.slice(0, 3).map((record) => record.pet || record.ownerPhone || record.id)
      });
    }

    if ((data.schemaVersion || 0) < STORE_SCHEMA_VERSION) {
      issues.push({
        id: `store-schema-old:${store.id}`,
        severity: 'info',
        title: `门店Schema版本过旧：${store.name}`,
        risk: '旧Schema会让后续修复难以判断数据是否已经迁移。',
        action: '更新门店Schema版本',
        fixable: true,
        storeId: store.id,
        count: 1
      });
    }

    if (baseData && store.id !== baseStore.id && !compareConfigList(data.templates, baseData.templates)) {
      issues.push({
        id: `templates-out-of-sync:${store.id}`,
        severity: 'info',
        title: `模板配置不同步：${store.name}`,
        risk: '不同门店复种周期不一致时，同类记录可能计算出不同提醒日期。',
        action: '同步为当前默认门店模板',
        fixable: true,
        storeId: store.id,
        count: Math.max(data.templates?.length || 0, baseData.templates?.length || 0)
      });
    }

    if (baseData && store.id !== baseStore.id && !compareConfigList(data.rules, baseData.rules)) {
      issues.push({
        id: `rules-out-of-sync:${store.id}`,
        severity: 'info',
        title: `规则配置不同步：${store.name}`,
        risk: '提醒提前量、默认状态或逾期分级不一致会影响分组和联系优先级。',
        action: '同步为当前默认门店规则',
        fixable: true,
        storeId: store.id,
        count: Math.max(data.rules?.length || 0, baseData.rules?.length || 0)
      });
    }
  });

  return issues;
}

function severityLabel(severity) {
  return {
    critical: '高风险',
    warning: '需关注',
    info: '提示'
  }[severity] || '提示';
}

function exportFullHealthBackup() {
  const snapshot = {};
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key && key.startsWith(appConfig.storage)) {
      snapshot[key] = localStorage.getItem(key);
    }
  }

  const jsonStr = JSON.stringify({
    version: BACKUP_FORMAT_VERSION,
    type: 'health-snapshot',
    exportedAt: new Date().toISOString(),
    appId: appConfig.id,
    storagePrefix: appConfig.storage,
    snapshot
  }, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  link.download = `健康备份_完整快照_${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function applyHealthFix(issue) {
  const meta = loadStoresMeta();
  const store = issue.storeId && meta?.stores?.find((item) => item.id === issue.storeId);

  if (issue.id === 'legacy-single-store') {
    const oldRecordCheck = safeParseStorageValue(appConfig.storage);
    if (Array.isArray(oldRecordCheck.value) && oldRecordCheck.value.length > 0) {
      const targetStoreId = meta?.currentStoreId || meta?.stores?.[0]?.id || initStores().storeId;
      const targetData = loadStoreData(targetStoreId) || createDefaultStoreData();
      const existingIds = new Set((targetData.records || []).map((record) => record.id));
      const existingKeys = new Set((targetData.records || []).map((record) => `${normalizePhone(record.ownerPhone)}-${record.pet}-${record.vaccine}`));
      const migratedRecords = oldRecordCheck.value
        .map((record) => ({
          ...record,
          id: record.id || uid(),
          ownerPhone: normalizePhone(record.ownerPhone || ''),
          timeline: Array.isArray(record.timeline) && record.timeline.length > 0
            ? record.timeline
            : [{ status: record.status || appConfig.primaryStatus, at: today, by: '健康修复' }],
          notes: Array.isArray(record.notes) ? record.notes : [],
          status: record.status || appConfig.primaryStatus,
          schemaVersion: record.schemaVersion || SCHEMA_VERSION
        }))
        .filter((record) => {
          const key = `${record.ownerPhone}-${record.pet}-${record.vaccine}`;
          if (existingIds.has(record.id) || existingKeys.has(key)) return false;
          existingIds.add(record.id);
          existingKeys.add(key);
          return true;
        });
      persistStoreData(targetStoreId, {
        ...targetData,
        records: [...migratedRecords, ...(targetData.records || [])]
      });
    }
    localStorage.removeItem(appConfig.storage);
    return '已迁移并清理旧版单店存储键';
  }

  if (issue.id === 'legacy-single-store-damaged') {
    localStorage.removeItem(appConfig.storage);
    return '已清理损坏的旧版单店存储键';
  }

  if (issue.id === 'stores-meta-missing') {
    const current = initStores();
    persistStoresMeta(current.meta);
    persistStoreData(current.storeId, current.storeData);
    return '已重建默认门店元数据';
  }

  if (!store) return '未找到目标门店，已跳过';

  const data = loadStoreData(store.id) || createDefaultStoreData();

  if (issue.id.startsWith('store-data-damaged:')) {
    persistStoreData(store.id, createDefaultStoreData());
    return `已重建${store.name}的数据结构`;
  }

  if (issue.id.startsWith('records-missing-timeline:')) {
    data.records = (data.records || []).map((record) => ({
      ...record,
      timeline: Array.isArray(record.timeline) && record.timeline.length > 0
        ? record.timeline
        : [{ status: record.status || appConfig.primaryStatus, at: today, by: '健康修复' }]
    }));
    persistStoreData(store.id, data);
    return `已为${store.name}补齐timeline`;
  }

  if (issue.id.startsWith('records-missing-notes:')) {
    data.records = (data.records || []).map((record) => ({
      ...record,
      notes: Array.isArray(record.notes) ? record.notes : []
    }));
    persistStoreData(store.id, data);
    return `已为${store.name}补齐notes`;
  }

  if (issue.id.startsWith('store-schema-old:')) {
    persistStoreData(store.id, { ...data, schemaVersion: STORE_SCHEMA_VERSION });
    return `已更新${store.name}的Schema版本`;
  }

  const baseStore = meta?.stores?.[0];
  const baseData = baseStore ? loadStoreData(baseStore.id) : null;
  if (!baseData) return '缺少基准门店数据，已跳过';

  if (issue.id.startsWith('templates-out-of-sync:')) {
    persistStoreData(store.id, { ...data, templates: (baseData.templates || []).map((item) => ({ ...item })) });
    return `已同步${store.name}的模板`;
  }

  if (issue.id.startsWith('rules-out-of-sync:')) {
    persistStoreData(store.id, {
      ...data,
      rules: (baseData.rules || []).map((rule) => ({
        ...rule,
        overdueLevels: (rule.overdueLevels || []).map((level) => ({ ...level }))
      }))
    });
    return `已同步${store.name}的规则`;
  }

  return '未识别修复项，已跳过';
}

export {
  safeParseStorageValue,
  compareConfigList,
  detectDataHealthIssues,
  severityLabel,
  exportFullHealthBackup,
  applyHealthFix
};
