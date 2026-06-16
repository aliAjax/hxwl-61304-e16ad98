import { appConfig, defaultTemplates, formatLocalDate, uid } from './config.js';

const TEMPLATE_STORAGE_KEY = appConfig.storage + '-templates';

function getTemplateStorageKey() {
  return TEMPLATE_STORAGE_KEY;
}

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

function parseLocalDate(dateText) {
  if (!dateText) return new Date(NaN);
  const [y, m, d] = dateText.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

function upsertTemplate(templates, { species, vaccine, days }) {
  const existing = templates.find(t => t.species === species && t.vaccine === vaccine);
  if (existing) {
    return templates.map(t => t.id === existing.id ? { ...t, days: Number(days) } : t);
  }
  return [...templates, { id: uid(), species, vaccine, days: Number(days) }];
}

function removeTemplateById(templates, id) {
  return templates.filter(t => t.id !== id);
}

export {
  getTemplateStorageKey,
  loadTemplates,
  persistTemplates,
  calcNextDate,
  parseLocalDate,
  upsertTemplate,
  removeTemplateById
};
