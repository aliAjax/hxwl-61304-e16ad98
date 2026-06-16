import { appConfig, SCHEMA_VERSION, today, uid } from './config.js';
import { migrateRecordsIfNeeded, withIds } from './storeStorage.js';
import { parseLocalDate } from './templates.js';
import { getAdvanceDays } from './rules.js';

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

export {
  loadRecords,
  avg,
  money,
  inNextDays,
  isOverdue,
  isToday,
  isWithin7DaysExcludingToday,
  isWithinNextDays,
  isWithinAdvanceDays,
  daysDiff,
  latestTemp,
  hasHotTemp,
  priorityRank,
  hasOverlap,
  statusClass
};
