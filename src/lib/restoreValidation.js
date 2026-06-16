import { appConfig, SCHEMA_VERSION, today, uid, defaultTemplates, defaultRules, STORE_SCHEMA_VERSION } from './config.js';
import { isValidDate, normalizeDate, isValidPhone, normalizePhone } from './csvImport.js';

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

function buildValidationResult({
  valid = true,
  errors = [],
  warnings = [],
  validRecords = [],
  invalidRecords = [],
  allWarnings = [],
  migratedCount = 0,
  totalRecords = 0,
  templates: backupTemplates = null,
  rules: backupRules = null,
  filters: backupFilters = null,
  groupMode: backupGroupMode = null,
  ownerInfo: backupOwnerInfo = null
} = {}) {
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
    templates: backupTemplates,
    rules: backupRules,
    filters: backupFilters,
    groupMode: backupGroupMode,
    ownerInfo: backupOwnerInfo
  };
}

function validateRestoreData(data) {
  const errors = [];
  const warnings = [];
  const validRecords = [];
  const invalidRecords = [];
  const validatedWithWarnings = [];
  let recordsToProcess = [];
  let migratedCount = 0;

  if (data === null || data === undefined) {
    errors.push(getExpectedFormatHint('❌ 文件内容为空：JSON解析结果为 null/undefined'));
    return buildValidationResult({
      valid: false, errors, warnings, validRecords, invalidRecords, allWarnings: [], migratedCount: 0, totalRecords: 0
    });
  }

  if (typeof data !== 'object') {
    errors.push(getExpectedFormatHint(`❌ 文件格式错误：JSON顶层应为对象或数组，实际为「${typeof data}」类型`));
    return buildValidationResult({
      valid: false, errors, warnings, validRecords, invalidRecords, allWarnings: [], migratedCount: 0, totalRecords: 0
    });
  }

  if (data.records !== undefined && data.records !== null) {
    if (Array.isArray(data.records)) {
      recordsToProcess = data.records;
      if (data.appId && data.appId !== appConfig.id) {
        warnings.push(`⚠️ 备份文件来自不同应用(${data.appId})，可能存在字段不兼容`);
      }
      if (data.version && data.version > 1) {
        warnings.push(`⚠️ 备份文件版本(v${data.version})高于当前版本，部分字段可能无法识别`);
      }
    } else {
      const valPreview = JSON.stringify(data.records).slice(0, 60);
      errors.push(getExpectedFormatHint(`❌ 数据格式错误：records字段应为数组，实际为「${typeof data.records}」${valPreview ? `（值：${valPreview}...）` : ''}`));
      return buildValidationResult({
        valid: false, errors, warnings, validRecords, invalidRecords, allWarnings: [...warnings], migratedCount: 0, totalRecords: 0
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
      valid: false, errors, warnings, validRecords, invalidRecords, allWarnings: [...warnings], migratedCount: 0, totalRecords: 0
    });
  }

  if (!Array.isArray(recordsToProcess)) {
    errors.push(getExpectedFormatHint(`❌ 数据格式错误：记录列表应为数组类型，实际为「${typeof recordsToProcess}」`));
    return buildValidationResult({
      valid: false, errors, warnings, validRecords, invalidRecords, allWarnings: [...warnings], migratedCount: 0, totalRecords: 0
    });
  }

  if (recordsToProcess.length === 0) {
    warnings.push('⚠️ 备份文件中没有记录');
  }

  const requiredFields = ['pet', 'ownerPhone', 'vaccine', 'nextDate'];

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

  const hasFatalErrors = errors.some(e => !e.includes('条记录存在错误'));
  const backupTemplates = Array.isArray(data.templates) ? data.templates.map(item => ({ ...item })) : null;
  const backupRules = Array.isArray(data.rules)
    ? data.rules.map(rule => ({
      ...rule,
      overdueLevels: (rule.overdueLevels || []).map(level => ({ ...level }))
    }))
    : null;
  const backupFilters = data.filters && typeof data.filters === 'object' ? data.filters : null;
  const backupGroupMode = data.groupMode || null;
  const backupOwnerInfo = data.ownerInfo && typeof data.ownerInfo === 'object' ? data.ownerInfo : null;

  if (data.templates !== undefined && !Array.isArray(data.templates)) {
    warnings.push('⚠️ 备份中的templates不是数组，已跳过模板恢复');
  }
  if (data.rules !== undefined && !Array.isArray(data.rules)) {
    warnings.push('⚠️ 备份中的rules不是数组，已跳过规则恢复');
  }

  const allWarningsList = [
    ...warnings,
    ...validatedWithWarnings.flatMap((v, i) => v.warnings.map(w => `记录${i + 1}：${w}`))
  ];

  return buildValidationResult({
    valid: !hasFatalErrors,
    errors,
    warnings,
    validRecords,
    invalidRecords,
    allWarnings: allWarningsList,
    migratedCount,
    totalRecords: recordsToProcess.length,
    templates: backupTemplates,
    rules: backupRules,
    filters: backupFilters,
    groupMode: backupGroupMode,
    ownerInfo: backupOwnerInfo
  });
}

function validateImportStoreData(rawData) {
  const errors = [];
  const warnings = [];

  if (!rawData || typeof rawData !== 'object') {
    errors.push('文件格式错误：不是有效的JSON对象');
    return { valid: false, errors, warnings, data: null };
  }

  let storeData = null;

  if (rawData.data && typeof rawData.data === 'object') {
    storeData = rawData.data;
  } else if (rawData.records !== undefined || rawData.templates !== undefined) {
    storeData = rawData;
  } else if (rawData.appId && rawData.records !== undefined) {
    storeData = {
      records: rawData.records,
      templates: [...defaultTemplates],
      rules: defaultRules.map(r => ({ ...r })),
      filters: { query: '', status: '全部' },
      groupMode: 'auto'
    };
    warnings.push('检测到旧版数据格式，已自动转换为门店数据');
  }

  if (!storeData) {
    errors.push('未找到有效的门店数据');
    return { valid: false, errors, warnings, data: null };
  }

  if (!Array.isArray(storeData.records)) {
    errors.push('数据格式错误：records字段应为数组');
    return { valid: false, errors, warnings, data: null };
  }

  const normalizedRecords = storeData.records.map(r => {
    const { record: migrated } = migrateRecord(r || {});
    return migrated;
  });

  const result = {
    records: normalizedRecords,
    templates: Array.isArray(storeData.templates) ? storeData.templates : [...defaultTemplates],
    rules: Array.isArray(storeData.rules) ? storeData.rules : defaultRules.map(r => ({ ...r })),
    filters: storeData.filters || { query: '', status: '全部' },
    groupMode: storeData.groupMode || 'auto',
    ownerInfo: storeData.ownerInfo || {},
    schemaVersion: STORE_SCHEMA_VERSION
  };

  return { valid: true, errors, warnings, data: result };
}

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

export {
  EXPECTED_FORMAT_SAMPLE,
  getExpectedFormatHint,
  buildValidationResult,
  validateRestoreData,
  validateImportStoreData,
  migrateRecord
};
