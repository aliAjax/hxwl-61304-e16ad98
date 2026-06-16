import { appConfig } from './config.js';

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

export {
  parseCSV,
  parseCSVLine,
  detectFieldMapping,
  isValidDate,
  normalizeDate,
  isValidPhone,
  normalizePhone,
  validateRow,
  findDuplicates,
  processCSVPipeline
};
