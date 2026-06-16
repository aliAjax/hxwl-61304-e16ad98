import { appConfig, defaultRules, uid } from './config.js';

const RULES_STORAGE_KEY = appConfig.storage + '-rules';

function getRulesStorageKey() {
  return RULES_STORAGE_KEY;
}

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

function upsertRule(rules, ruleForm) {
  const existing = rules.find(r => r.vaccine === ruleForm.vaccine);
  if (existing) {
    return rules.map(r => r.id === existing.id ? { ...r, ...ruleForm, advanceDays: Number(ruleForm.advanceDays) } : r);
  }
  return [...rules, { id: uid(), ...ruleForm, advanceDays: Number(ruleForm.advanceDays) }];
}

function removeRuleById(rules, id) {
  return rules.filter(r => r.id !== id);
}

function createDefaultRuleForm() {
  return {
    vaccine: '',
    advanceDays: 7,
    overdueLevels: [
      { id: uid(), label: '轻度逾期', min: 1, max: 7 },
      { id: uid(), label: '中度逾期', min: 8, max: 30 },
      { id: uid(), label: '重度逾期', min: 31, max: 9999 }
    ],
    defaultStatus: '待联系',
    autoGroup: 'overdue'
  };
}

export {
  getRulesStorageKey,
  loadRules,
  persistRules,
  getRuleForVaccine,
  getAdvanceDays,
  getDefaultStatusForVaccine,
  getOverdueLevel,
  getAutoGroupForVaccine,
  upsertRule,
  removeRuleById,
  createDefaultRuleForm
};
