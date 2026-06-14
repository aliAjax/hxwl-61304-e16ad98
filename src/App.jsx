import { useMemo, useState, useRef } from 'react';
import { Syringe, Plus, Search, Trash2, RotateCcw, CheckCircle2, AlertTriangle, ClipboardList, CalendarDays, PhoneCall, Clock, AlertCircle, CalendarCheck, MessageSquareText, X, User, Calendar, Upload, FileText, AlertOctagon, CheckCheck, Info, Users, PawPrint, ArrowLeft, ChevronRight, Settings, Save, Edit3 } from 'lucide-react';
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

function withIds(items) {
  return items.map((item) => ({ id: uid(), ...item, timeline: item.timeline || [{ status: item.status, at: today, by: '系统' }], notes: item.notes || [] }));
}

function loadRecords() {
  const raw = localStorage.getItem(appConfig.storage);
  if (raw) {
    try {
      return JSON.parse(raw);
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

function App() {
  const [records, setRecords] = useState(loadRecords);
  const [form, setForm] = useState(appConfig.defaultValues);
  const [filters, setFilters] = useState({ query: '', status: '全部' });
  const [selected, setSelected] = useState(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteOperator, setNewNoteOperator] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const fileInputRef = useRef(null);
  const [showBackupRestoreModal, setShowBackupRestoreModal] = useState(false);
  const [backupRestoreStep, setBackupRestoreStep] = useState('main');
  const [restorePreview, setRestorePreview] = useState(null);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreError, setRestoreError] = useState(null);
  const restoreFileInputRef = useRef(null);
  const [currentView, setCurrentView] = useState('records');
  const [ownerSearch, setOwnerSearch] = useState('');
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [templates, setTemplates] = useState(loadTemplates);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ species: '', vaccine: '', days: '' });
  const [nextDateManual, setNextDateManual] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);

  function persist(next) {
    setRecords(next);
    localStorage.setItem(appConfig.storage, JSON.stringify(next));
  }

  function saveTemplates(next) {
    setTemplates(next);
    persistTemplates(next);
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

  function addRecord(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedValues = Object.fromEntries(formData.entries());
    const submittedRecord = { ...form, ...submittedValues };
    const autoNext = calcNextDate(submittedRecord.lastDate, submittedRecord.species, submittedRecord.vaccine, templates);
    const finalNextDate = submittedRecord.nextDate || autoNext;
    const nextRecord = {
      id: uid(),
      ...submittedRecord,
      nextDate: finalNextDate,
      status: submittedRecord.status || appConfig.primaryStatus,
      createdAt: new Date().toISOString(),
      timeline: [{ status: submittedRecord.status || appConfig.primaryStatus, at: today, by: '录入' }],
      notes: []
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

  function removeRecord(id) {
    const next = records.filter((item) => item.id !== id);
    persist(next);
    if (selected?.id === id) setSelected(null);
  }

  function duplicateRecord(item) {
    const copied = { ...item, id: uid(), status: appConfig.primaryStatus, timeline: [{ status: appConfig.primaryStatus, at: today, by: '复制' }], notes: [] };
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

  function processCSVFile(file) {
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const { headers, rows } = parseCSV(text);
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
        const { fileDuplicates, existingDuplicates } = findDuplicates(validRows, records);
        const detectedFields = appConfig.fields.map(field => ({
          ...field,
          detected: fieldMapping[field.key] !== undefined,
          sourceColumn: fieldMapping[field.key] !== undefined ? headers[fieldMapping[field.key]] : null,
          required: requiredFields.includes(field.key)
        }));
        setImportPreview({
          fileName: file.name,
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
        });
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
    const newRecords = importPreview.validRows.map(row => ({
      id: uid(),
      ...row.data,
      status: appConfig.primaryStatus,
      createdAt: new Date().toISOString(),
      timeline: [{ status: appConfig.primaryStatus, at: today, by: '批量导入' }],
      notes: []
    }));
    persist([...newRecords, ...records]);
    setShowImportModal(false);
    setImportPreview(null);
    setImportFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    alert(`成功导入 ${newRecords.length} 条记录`);
  }

  function cancelImport() {
    setShowImportModal(false);
    setImportPreview(null);
    setImportFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function exportToJSON() {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      appId: appConfig.id,
      storageKey: appConfig.storage,
      recordCount: records.length,
      records: records
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

  function validateRestoreData(data) {
    const errors = [];
    const warnings = [];
    let recordsToProcess = [];

    if (!data || typeof data !== 'object') {
      errors.push('文件格式错误：不是有效的JSON对象');
      return { valid: false, errors, warnings, records: [] };
    }

    if (data.records && Array.isArray(data.records)) {
      recordsToProcess = data.records;
      if (data.appId && data.appId !== appConfig.id) {
        warnings.push(`备份文件来自不同应用(${data.appId})，可能存在字段不兼容`);
      }
      if (data.version && data.version > 1) {
        warnings.push(`备份文件版本(${data.version})高于当前版本，部分字段可能无法识别`);
      }
    } else if (Array.isArray(data)) {
      recordsToProcess = data;
      warnings.push('备份文件为旧版本格式（直接数组），正在自动转换');
    } else {
      errors.push('文件格式错误：未找到记录数据');
      return { valid: false, errors, warnings, records: [] };
    }

    if (recordsToProcess.length === 0) {
      warnings.push('备份文件中没有记录');
    }

    const requiredFields = ['pet', 'ownerPhone', 'vaccine', 'nextDate'];
    const validRecords = [];
    const invalidRecords = [];
    let migratedCount = 0;

    recordsToProcess.forEach((record, index) => {
      const recordErrors = [];
      const recordWarnings = [];

      if (!record || typeof record !== 'object') {
        invalidRecords.push({ index, error: '不是有效的对象' });
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
        recordWarnings.push(`上次接种日期格式不正确，将忽略：${record.lastDate}`);
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
        migratedRecord.nextDate = normalizeDate(migratedRecord.nextDate);
        if (migratedRecord.nextDate !== record.nextDate) needsMigration = true;
      }

      if (migratedRecord.ownerPhone) {
        const normalizedPhone = normalizePhone(migratedRecord.ownerPhone);
        if (normalizedPhone !== migratedRecord.ownerPhone) {
          migratedRecord.ownerPhone = normalizedPhone;
          needsMigration = true;
        }
      }

      if (needsMigration) migratedCount++;

      if (recordErrors.length > 0) {
        invalidRecords.push({ index, errors: recordErrors, warnings: recordWarnings, record });
      } else {
        validRecords.push({ record: migratedRecord, warnings: recordWarnings });
      }
    });

    if (migratedCount > 0) {
      warnings.push(`已自动迁移 ${migratedCount} 条旧版本记录（补充timeline等字段）`);
    }

    if (invalidRecords.length > 0) {
      errors.push(`${invalidRecords.length} 条记录存在错误，将被跳过`);
    }

    return {
      valid: errors.filter(e => !e.includes('条记录存在错误')).length === 0,
      errors,
      warnings,
      validRecords: validRecords.map(v => v.record),
      invalidRecords,
      allWarnings: [
        ...warnings,
        ...validRecords.flatMap((v, i) => v.warnings.map(w => `记录${i + 1}：${w}`))
      ]
    };
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
          setRestoreError({ type: 'format', message: 'JSON解析失败，请检查文件格式是否正确' });
          return;
        }

        const validation = validateRestoreData(data);

        if (!validation.valid && validation.validRecords.length === 0) {
          setRestoreError({
            type: 'validation',
            message: validation.errors.join('；'),
            details: validation
          });
          return;
        }

        const changes = calculateRestoreChanges(validation.validRecords);

        setRestoreFile(file);
        setRestorePreview({
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(2),
          exportedAt: data.exportedAt || null,
          version: data.version || 0,
          validation,
          changes
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

    const { changes } = restorePreview;
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
    cancelRestore();
    alert(`恢复完成：\n新增 ${changes.addCount} 条\n覆盖 ${changes.overwriteCount} 条\n跳过 ${changes.skipCount} 条`);
  }

  function cancelRestore() {
    setShowBackupRestoreModal(false);
    setBackupRestoreStep('main');
    setRestorePreview(null);
    setRestoreFile(null);
    setRestoreError(null);
    if (restoreFileInputRef.current) {
      restoreFileInputRef.current.value = '';
    }
  }

  const filteredRecords = useMemo(() => {
    return records
      .filter((item) => !filters.query || `${item.pet}${item.ownerPhone}`.includes(filters.query))
      .filter((item) => filters.status === '全部' || item.status === filters.status)
      .sort((a, b) => {
        if (appConfig.sort === 'priority') {
          const rank = priorityRank(a.priority) - priorityRank(b.priority);
          if (rank !== 0) return rank;
        }
        const aDate = a[appConfig.dateKey] || a.sentAt || a.createdAt || '';
        const bDate = b[appConfig.dateKey] || b.sentAt || b.createdAt || '';
        return String(aDate).localeCompare(String(bDate));
      });
  }, [records, filters]);

  const metrics = [
    { label: "宠物数", value: records.length },
    { label: "待联系", value: records.filter((item) => item.status === '待联系').length },
    { label: "本周提醒", value: records.filter((item) => inNextDays(item.nextDate, 7)).length },
  ];

  const contactListGroups = useMemo(() => {
    return {
      overdue: records
        .filter((item) => isOverdue(item.nextDate))
        .sort((a, b) => parseLocalDate(a.nextDate) - parseLocalDate(b.nextDate)),
      today: records
        .filter((item) => isToday(item.nextDate))
        .sort((a, b) => parseLocalDate(a.nextDate) - parseLocalDate(b.nextDate)),
      upcoming: records
        .filter((item) => isWithin7DaysExcludingToday(item.nextDate))
        .sort((a, b) => parseLocalDate(a.nextDate) - parseLocalDate(b.nextDate)),
    };
  }, [records]);

  const groupedByDate = useMemo(() => {
    return filteredRecords.reduce((acc, item) => {
      const key = item[appConfig.dateKey] || item.date || item.enrollDate || '未排期';
      (acc[key] ||= []).push(item);
      return acc;
    }, {});
  }, [filteredRecords]);

  const calendarRecords = useMemo(() => {
    return records
      .filter((item) => !filters.query || `${item.pet}${item.ownerPhone}`.includes(filters.query))
      .filter((item) => filters.status === '全部' || item.status === filters.status)
      .reduce((acc, item) => {
        const date = item.nextDate;
        if (date) {
          (acc[date] ||= []).push(item);
        }
        return acc;
      }, {});
  }, [records, filters]);

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
    return {
      total: items.length,
      pending: items.filter(i => i.status === '待联系').length,
      contacted: items.filter(i => i.status === '已联系').length,
      done: items.filter(i => i.status === '已接种').length,
      items,
    };
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
        groups[phone] = {
          ownerPhone: phone,
          pets: [],
          lastContactTime: null,
          pendingCount: 0,
          totalCount: 0
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
  }, [records]);

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
        <div className="port-card">
          <span>Local Port</span>
          <strong>{appConfig.port}</strong>
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
              <strong>{Object.entries(calendarRecords).filter(([date]) => {
                const d = new Date(date);
                return d.getFullYear() === calendarDate.getFullYear() && d.getMonth() === calendarDate.getMonth();
              }).reduce((sum, [, items]) => sum + items.length, 0)}</strong>
            </article>
            <article className="metric">
              <span>本月待联系</span>
              <strong>{Object.entries(calendarRecords).filter(([date]) => {
                const d = new Date(date);
                return d.getFullYear() === calendarDate.getFullYear() && d.getMonth() === calendarDate.getMonth();
              }).reduce((sum, [, items]) => sum + items.filter(i => i.status === '待联系').length, 0)}</strong>
            </article>
            <article className="metric">
              <span>本月已接种</span>
              <strong>{Object.entries(calendarRecords).filter(([date]) => {
                const d = new Date(date);
                return d.getFullYear() === calendarDate.getFullYear() && d.getMonth() === calendarDate.getMonth();
              }).reduce((sum, [, items]) => sum + items.filter(i => i.status === '已接种').length, 0)}</strong>
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
          <div className="contact-groups">
            <div className="contact-group overdue-group">
              <div className="contact-group-header">
                <div className="contact-group-title">
                  <AlertCircle size={16} className="contact-group-icon overdue-icon" />
                  <h3>已逾期</h3>
                  <span className="contact-count">{contactListGroups.overdue.length}</span>
                </div>
              </div>
              <div className="contact-records">
                {contactListGroups.overdue.length === 0 ? (
                  <p className="empty-group">暂无逾期记录</p>
                ) : (
                  contactListGroups.overdue.map((item) => (
                    <article className={'contact-record ' + (item.status === '已联系' ? 'contact-record-done' : '')} key={item.id}>
                      <div className="contact-record-main">
                        <div className="contact-record-info">
                          <h4>{item.pet}</h4>
                          <p className="contact-meta">{item.ownerPhone}</p>
                          <p className="contact-vaccine">{item.vaccine}</p>
                        </div>
                        <div className="contact-record-side">
                          <span className={'status ' + statusClass(item.status)}>{item.status}</span>
                          <span className="days-badge overdue-badge">逾期{Math.abs(daysDiff(item.nextDate))}天</span>
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

            <div className="contact-group today-group">
              <div className="contact-group-header">
                <div className="contact-group-title">
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
                    <article className={'contact-record ' + (item.status === '已联系' ? 'contact-record-done' : '')} key={item.id}>
                      <div className="contact-record-main">
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
                  <CalendarCheck size={16} className="contact-group-icon upcoming-icon" />
                  <h3>未来7天内</h3>
                  <span className="contact-count">{contactListGroups.upcoming.length}</span>
                </div>
              </div>
              <div className="contact-records">
                {contactListGroups.upcoming.length === 0 ? (
                  <p className="empty-group">暂无近期提醒</p>
                ) : (
                  contactListGroups.upcoming.map((item) => (
                    <article className={'contact-record ' + (item.status === '已联系' ? 'contact-record-done' : '')} key={item.id}>
                      <div className="contact-record-main">
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
                            {isWithin7DaysExcludingToday(pet.nextDate) && pet.status === '待联系' && (
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
                  <input value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="搜索宠物/主人" />
                </div>
                <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                  <option>全部</option>
                  {appConfig.statuses.map((status) => <option key={status}>{status}</option>)}
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
                  return (
                    <div
                      key={day.date}
                      className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${dayIsOverdue ? 'is-overdue' : ''} ${stats.total > 0 ? 'has-records' : ''}`}
                      onClick={() => stats.total > 0 ? setSelectedCalendarDay(day.date) : null}
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
                </div>
                <div className="day-records-list">
                  {getDayStats(selectedCalendarDay).items.length === 0 ? (
                    <p className="empty-group">当天暂无提醒记录</p>
                  ) : (
                    getDayStats(selectedCalendarDay).items.map((item) => (
                      <article
                        className={'day-record ' + (item.conflict || hasOverlap(item, records) ? 'conflict' : '')}
                        key={item.id}
                        onClick={() => { setSelected(item); setCurrentView('records'); }}
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
              <button className="primary" type="submit"><Plus size={18} />新增</button>
              <button type="button" className="import-btn" onClick={() => setShowImportModal(true)}><Upload size={18} />批量导入CSV</button>
              <button type="button" className="import-btn" onClick={() => { setShowBackupRestoreModal(true); setBackupRestoreStep('main'); }}><Save size={18} />数据备份与恢复</button>
              <p className="hint">{appConfig.note}</p>
            </form>

            <section className="panel list-panel">
              <div className="toolbar">
                <div className="search">
                  <Search size={16} />
                  <input value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder={appConfig.filters[0]?.label || '搜索'} />
                </div>
                <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                  <option>全部</option>
                  {appConfig.statuses.map((status) => <option key={status}>{status}</option>)}
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
                      <h3><AlertOctagon size={16} className="fatal-icon" />字段缺失</h3>
                      <p className="fatal-text">CSV文件缺少以下必填字段列，无法进行导入：</p>
                      <div className="missing-fields-list">
                        {importPreview.missingRequiredFields.map((field) => (
                          <span key={field} className="missing-field-item">{field}</span>
                        ))}
                      </div>
                      <p className="fatal-hint">请补充以上列后重新上传文件。</p>
                    </div>
                  )}

                  <div className="preview-section">
                    <h3><FileText size={16} />字段识别结果</h3>
                    <div className="field-mapping-grid">
                      {importPreview.detectedFields.map((field) => (
                        <div key={field.key} className={`field-mapping-item ${field.detected ? 'detected' : 'missing'}`}>
                          <span className="field-label">
                            {field.label}
                            {field.required && <span className="required-mark">*</span>}
                          </span>
                          <span className="field-status">
                            {field.detected ? (
                              <span className="detected-badge"><CheckCircle2 size={14} /> {field.sourceColumn}</span>
                            ) : (
                              <span className="missing-badge"><AlertTriangle size={14} /> 未识别</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="field-hint"><span className="required-mark">*</span> 标记为必填字段</p>
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
                    <p>将当前所有宠物疫苗提醒数据导出为JSON备份文件，包含完整的记录、时间线和备注信息。</p>
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
                    <p>选择之前导出的JSON备份文件恢复数据。恢复前将展示变更统计，确认后才会执行。</p>
                    <p className="warning-text">
                      <AlertTriangle size={14} />
                      注意：ID相同的记录将被覆盖，已存在相同宠物+疫苗的记录将被跳过
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

                {restorePreview.validation.warnings.length > 0 && (
                  <div className="warnings-section">
                    <h3><AlertTriangle size={16} className="warning-icon" />警告</h3>
                    <ul className="warnings-list">
                      {restorePreview.validation.allWarnings.slice(0, 10).map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                      {restorePreview.validation.allWarnings.length > 10 && (
                        <li>... 还有 {restorePreview.validation.allWarnings.length - 10} 条警告</li>
                      )}
                    </ul>
                  </div>
                )}

                {restorePreview.validation.invalidRecords.length > 0 && (
                  <div className="errors-section">
                    <h3><AlertOctagon size={16} className="error-icon" />无效记录（{restorePreview.validation.invalidRecords.length} 条）</h3>
                    <div className="invalid-records-list">
                      {restorePreview.validation.invalidRecords.slice(0, 5).map((item, i) => (
                        <div key={i} className="invalid-record-item">
                          <span className="record-index">第 {item.index + 1} 条：</span>
                          <span className="record-error">{item.errors.join('；')}</span>
                        </div>
                      ))}
                      {restorePreview.validation.invalidRecords.length > 5 && (
                        <p className="more-errors">... 还有 {restorePreview.validation.invalidRecords.length - 5} 条无效记录</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="restore-summary">
                  <h3><Info size={16} />恢复统计</h3>
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

                {restorePreview.changes.overwriteCount > 0 && (
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

                {restorePreview.changes.addCount > 0 && (
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

                {restorePreview.changes.skipCount > 0 && (
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
                  disabled={restorePreview.changes.addCount === 0 && restorePreview.changes.overwriteCount === 0}
                >
                  <CheckCheck size={16} />
                  确认恢复（新增 {restorePreview.changes.addCount}，覆盖 {restorePreview.changes.overwriteCount}）
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
