import { defaultTemplates, defaultRules } from './config.js';
import { loadStoreData, persistStoreData, createDefaultStoreData } from './storeStorage.js';

function extractStoreState(storeData) {
  return {
    records: storeData.records || [],
    templates: storeData.templates || [...defaultTemplates],
    rules: storeData.rules || defaultRules.map(r => ({ ...r, overdueLevels: (r.overdueLevels || []).map(ol => ({ ...ol })) })),
    filters: storeData.filters || { query: '', status: '全部' },
    groupMode: storeData.groupMode || 'auto',
    ownerInfo: storeData.ownerInfo || {}
  };
}

function persistCurrentStoreState(storeId, state, updates = {}) {
  const currentData = loadStoreData(storeId) || createDefaultStoreData();
  persistStoreData(storeId, {
    ...currentData,
    records: state.records,
    templates: state.templates,
    rules: state.rules,
    filters: state.filters,
    groupMode: state.groupMode,
    ownerInfo: state.ownerInfo,
    ...updates
  });
}

function persistStoreField(storeId, field, value) {
  const currentData = loadStoreData(storeId) || createDefaultStoreData();
  persistStoreData(storeId, { ...currentData, [field]: value });
}

export {
  extractStoreState,
  persistCurrentStoreState,
  persistStoreField
};
