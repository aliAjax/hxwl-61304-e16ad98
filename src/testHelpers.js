const appConfig = {
  id: 'hxwl-61304',
  storage: 'hxwl-61304-pet-vaccine',
  accent: '#db2777',
  statuses: ['待联系', '已联系', '已接种'],
  primaryStatus: '待联系',
  fields: [
    { key: 'pet', label: '宠物姓名', type: 'input', options: [] },
    { key: 'species', label: '物种', type: 'select', options: ['猫', '犬', '兔', '其他'] },
    { key: 'ownerPhone', label: '主人联系方式', type: 'input', options: [] },
    { key: 'vaccine', label: '疫苗类型', type: 'select', options: ['猫三联', '狂犬', '犬六联', '体内驱虫'] },
    { key: 'lastDate', label: '上次接种日期', type: 'date', options: [] },
    { key: 'nextDate', label: '下次提醒日期', type: 'date', options: [] }
  ],
  defaultValues: {
    pet: '奶盖',
    species: '猫',
    ownerPhone: '13800008888',
    vaccine: '猫三联',
    lastDate: '',
    nextDate: '',
    status: '待联系'
  }
};

const SCHEMA_VERSION = 2;

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

function processCSVPipeline(csvText, existingRecords = []) {
  const { headers, rows } = parseCSV(csvText);
  const fieldMapping = detectFieldMapping(headers);
  const requiredFields = ['pet', 'ownerPhone', 'vaccine', 'nextDate'];
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
  const { fileDuplicates, existingDuplicates } = findDuplicates(validRows, existingRecords);
  return {
    totalRows: rows.length,
    headers,
    fieldMapping,
    validRows,
    errorRows,
    fileDuplicates,
    existingDuplicates,
    missingRequiredFields: missingRequiredFieldLabels
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
  const today = new Date().toISOString().slice(0, 10);

  if (data === null || data === undefined) {
    errors.push('❌ 文件内容为空');
    return { valid: false, errors, warnings, validRecords, invalidRecords, allWarnings: [], migratedCount: 0, totalRecords: 0 };
  }

  if (typeof data !== 'object') {
    errors.push('❌ 文件格式错误');
    return { valid: false, errors, warnings, validRecords, invalidRecords, allWarnings: [], migratedCount: 0, totalRecords: 0 };
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
      errors.push('❌ 数据格式错误：records字段应为数组');
      return { valid: false, errors, warnings, validRecords, invalidRecords, allWarnings: [...warnings], migratedCount: 0, totalRecords: 0 };
    }
  } else if (Array.isArray(data)) {
    recordsToProcess = data;
    warnings.push('ℹ️ 备份文件为旧版本格式（直接数组），正在自动转换');
  } else {
    errors.push('❌ 文件结构错误：未找到 records 字段且不是数组格式');
    return { valid: false, errors, warnings, validRecords, invalidRecords, allWarnings: [...warnings], migratedCount: 0, totalRecords: 0 };
  }

  if (!Array.isArray(recordsToProcess)) {
    errors.push('❌ 数据格式错误');
    return { valid: false, errors, warnings, validRecords, invalidRecords, allWarnings: [...warnings], migratedCount: 0, totalRecords: 0 };
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
      migratedRecord.id = 'test-' + Math.random().toString(36).slice(2, 10);
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
  const backupTemplates = Array.isArray(data.templates) ? data.templates.map((item) => ({ ...item })) : null;
  const backupRules = Array.isArray(data.rules) ? data.rules.map((rule) => ({ ...rule, overdueLevels: (rule.overdueLevels || []).map((level) => ({ ...level })) })) : null;
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

  return {
    valid: !hasFatalErrors,
    errors,
    warnings,
    validRecords,
    invalidRecords,
    allWarnings: allWarningsList,
    migratedCount,
    totalRecords: recordsToProcess.length,
    validCount: validRecords.length,
    invalidCount: invalidRecords.length,
    templates: backupTemplates,
    rules: backupRules,
    filters: backupFilters,
    groupMode: backupGroupMode,
    ownerInfo: backupOwnerInfo
  };
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

  return { valid: true, errors, warnings, data: storeData };
}

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
  { id: 'rule-1', vaccine: '猫三联', advanceDays: 7, overdueLevels: [], defaultStatus: '待联系', autoGroup: 'overdue' },
  { id: 'rule-2', vaccine: '狂犬', advanceDays: 14, overdueLevels: [], defaultStatus: '待联系', autoGroup: 'overdue' },
  { id: 'rule-3', vaccine: '犬六联', advanceDays: 7, overdueLevels: [], defaultStatus: '待联系', autoGroup: 'overdue' },
  { id: 'rule-4', vaccine: '体内驱虫', advanceDays: 3, overdueLevels: [], defaultStatus: '待联系', autoGroup: 'vaccine' }
];

export {
  appConfig,
  SCHEMA_VERSION,
  parseCSV,
  parseCSVLine,
  detectFieldMapping,
  isValidDate,
  normalizeDate,
  isValidPhone,
  normalizePhone,
  validateRow,
  findDuplicates,
  processCSVPipeline,
  validateRestoreData,
  validateImportStoreData,
  defaultTemplates,
  defaultRules
};
