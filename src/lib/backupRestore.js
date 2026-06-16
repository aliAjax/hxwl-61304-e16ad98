import { BACKUP_FORMAT_VERSION } from './config.js';
import { normalizePhone, normalizeDate, isValidDate } from './csvImport.js';

function buildExportData({ records, templates, rules, filters, groupMode, ownerInfo, storeName, storeId, appConfig }) {
  return {
    version: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    appId: appConfig.id,
    storageKey: appConfig.storage,
    storeName,
    storeId,
    recordCount: records.length,
    templateCount: templates.length,
    ruleCount: rules.length,
    records,
    templates: templates.map((item) => ({ ...item })),
    rules: rules.map((rule) => ({
      ...rule,
      overdueLevels: (rule.overdueLevels || []).map((level) => ({ ...level }))
    })),
    filters,
    groupMode,
    ownerInfo
  };
}

function calculateRestoreChanges(validRecords, existingRecords) {
  const existingIds = new Set(existingRecords.map(r => r.id));
  const existingKeyMap = new Map();
  existingRecords.forEach(r => {
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
        existingRecord: existingRecords.find(r => r.id === record.id)
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

function mergeRestoredData({ records, changes, validation, templates, rules, filters, groupMode, ownerInfo }) {
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

  const nextTemplates = Array.isArray(validation.templates) ? validation.templates : templates;
  const nextRules = Array.isArray(validation.rules) ? validation.rules : rules;
  const nextFilters = validation.filters ? { query: '', status: '全部', ...validation.filters } : filters;
  const nextGroupMode = validation.groupMode || groupMode;
  const nextOwnerInfo = validation.ownerInfo ? { ...validation.ownerInfo } : ownerInfo;

  return {
    mergedRecords,
    nextTemplates,
    nextRules,
    nextFilters,
    nextGroupMode,
    nextOwnerInfo
  };
}

function buildRestoreConfigSummary(validation) {
  return [
    Array.isArray(validation.templates) ? `模板 ${validation.templates.length} 个` : null,
    Array.isArray(validation.rules) ? `规则 ${validation.rules.length} 条` : null,
    validation.filters ? '筛选配置' : null,
    validation.groupMode ? '分组模式' : null,
    validation.ownerInfo ? '主人备注' : null
  ].filter(Boolean);
}

export {
  buildExportData,
  calculateRestoreChanges,
  mergeRestoredData,
  buildRestoreConfigSummary
};
