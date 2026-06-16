import { uid, today, SCHEMA_VERSION } from './config.js';
import { calcNextDate } from './templates.js';
import { getDefaultStatusForVaccine } from './rules.js';
import { hasOverlap } from './recordUtils.js';

function buildNewRecord({ form, submittedValues, templates, rules, records, appConfig }) {
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

  return nextRecord;
}

function buildNote(content, operator) {
  return {
    id: uid(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
    createdBy: operator.trim() || '未署名'
  };
}

function addNoteToRecords(records, recordId, note) {
  return records.map((item) => item.id === recordId ? {
    ...item,
    notes: [...(item.notes || []), note]
  } : item);
}

function removeNoteFromRecords(records, recordId, noteId) {
  return records.map((item) => item.id === recordId ? {
    ...item,
    notes: (item.notes || []).filter((n) => n.id !== noteId)
  } : item);
}

function updateStatusInRecords(records, id, status) {
  return records.map((item) => item.id === id ? {
    ...item,
    status,
    timeline: [...(item.timeline || []), { status, at: today, by: '操作员' }]
  } : item);
}

function removeRecordFromList(records, id) {
  return records.filter((item) => item.id !== id);
}

function duplicateRecordItem(item, rules) {
  const dupStatus = getDefaultStatusForVaccine(item.vaccine, rules);
  return { ...item, id: uid(), status: dupStatus, timeline: [{ status: dupStatus, at: today, by: '复制' }], notes: [], schemaVersion: SCHEMA_VERSION };
}

function addTemperatureToRecords(records, itemId, value) {
  return records.map((record) => record.id === itemId ? {
    ...record,
    temps: [...(record.temps || []), value],
    temperature: String(value),
    status: value > 2 ? '异常' : record.status
  } : record);
}

function repairRecordDates(records, templates) {
  return records.map(item => {
    if (item.nextDate && item.lastDate) return item;
    if (!item.lastDate) return item;
    const autoNext = calcNextDate(item.lastDate, item.species, item.vaccine, templates);
    if (!autoNext) return item;
    return { ...item, nextDate: autoNext };
  });
}

function buildCSVImportRecord(row, rules) {
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
}

export {
  buildNewRecord,
  buildNote,
  addNoteToRecords,
  removeNoteFromRecords,
  updateStatusInRecords,
  removeRecordFromList,
  duplicateRecordItem,
  addTemperatureToRecords,
  repairRecordDates,
  buildCSVImportRecord
};
