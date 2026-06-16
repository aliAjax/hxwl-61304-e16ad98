import { appConfig, SCHEMA_VERSION, STORE_SCHEMA_VERSION, defaultTemplates, defaultRules, today, uid } from './config.js';
import { validateImportStoreData, migrateRecord } from './restoreValidation.js';
import { normalizePhone } from './csvImport.js';
import { getTemplateStorageKey } from './templates.js';
import { getRulesStorageKey } from './rules.js';

const STORES_META_KEY = appConfig.storage + '-stores-meta';
const STORE_DATA_KEY_PREFIX = appConfig.storage + '-store-';

function getStoreMetaStorageKey() {
  return STORES_META_KEY;
}

function getStoreDataKey(storeId) {
  return STORE_DATA_KEY_PREFIX + storeId;
}

function loadStoresMeta() {
  const raw = localStorage.getItem(STORES_META_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

function persistStoresMeta(meta) {
  localStorage.setItem(STORES_META_KEY, JSON.stringify(meta));
}

function loadStoreData(storeId) {
  const key = getStoreDataKey(storeId);
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

function persistStoreData(storeId, data) {
  const key = getStoreDataKey(storeId);
  localStorage.setItem(key, JSON.stringify(data));
}

function deleteStoreData(storeId) {
  const key = getStoreDataKey(storeId);
  localStorage.removeItem(key);
}

function migrateRecordsIfNeeded(records) {
  let hasChanges = false;
  const migrated = records.map(record => {
    const result = migrateRecord(record);
    if (result.needsPersist) hasChanges = true;
    return result.record;
  });
  return { records: migrated, hasChanges };
}

function withIds(items) {
  return items.map((item) => ({
    id: uid(),
    ...item,
    timeline: item.timeline || [{ status: item.status, at: today, by: '系统' }],
    notes: item.notes || [],
    schemaVersion: SCHEMA_VERSION
  }));
}

function createDefaultStoreData() {
  return {
    records: withIds(appConfig.seed),
    templates: [...defaultTemplates],
    rules: defaultRules.map(r => ({ ...r, overdueLevels: (r.overdueLevels || []).map(ol => ({ ...ol })) })),
    filters: { query: '', status: '全部' },
    groupMode: 'auto',
    ownerInfo: {},
    schemaVersion: STORE_SCHEMA_VERSION
  };
}

function migrateFromSingleStore() {
  const TEMPLATE_KEY = getTemplateStorageKey();
  const RULES_KEY = getRulesStorageKey();

  const hasOldRecords = localStorage.getItem(appConfig.storage) !== null;
  const hasOldTemplates = localStorage.getItem(TEMPLATE_KEY) !== null;
  const hasOldRules = localStorage.getItem(RULES_KEY) !== null;

  if (!hasOldRecords && !hasOldTemplates && !hasOldRules) {
    return null;
  }

  let records = [];
  try {
    const raw = localStorage.getItem(appConfig.storage);
    if (raw) {
      const parsed = JSON.parse(raw);
      const { records: migrated, hasChanges } = migrateRecordsIfNeeded(parsed);
      records = migrated;
      if (hasChanges) {
        localStorage.setItem(appConfig.storage, JSON.stringify(records));
      }
    }
  } catch {
    records = withIds(appConfig.seed);
  }

  let templates = [...defaultTemplates];
  try {
    const raw = localStorage.getItem(TEMPLATE_KEY);
    if (raw) {
      templates = JSON.parse(raw);
    }
  } catch {}

  let rules = defaultRules.map(r => ({ ...r, overdueLevels: (r.overdueLevels || []).map(ol => ({ ...ol })) }));
  try {
    const raw = localStorage.getItem(RULES_KEY);
    if (raw) {
      rules = JSON.parse(raw);
    }
  } catch {}

  const storeId = 'store-default';
  const storeData = {
    records,
    templates,
    rules,
    filters: { query: '', status: '全部' },
    groupMode: 'auto',
    ownerInfo: {},
    schemaVersion: STORE_SCHEMA_VERSION
  };

  const meta = {
    version: 1,
    currentStoreId: storeId,
    stores: [
      {
        id: storeId,
        name: '默认门店',
        createdAt: new Date().toISOString(),
        isDefault: true,
        migrated: true
      }
    ]
  };

  persistStoreData(storeId, storeData);
  persistStoresMeta(meta);

  return { meta, storeData, storeId };
}

function initStores() {
  let meta = loadStoresMeta();

  if (meta && meta.stores && meta.stores.length > 0) {
    const currentStoreId = meta.currentStoreId || meta.stores[0].id;
    let storeData = loadStoreData(currentStoreId);
    if (!storeData) {
      storeData = createDefaultStoreData();
      persistStoreData(currentStoreId, storeData);
    }
    if (!meta.currentStoreId) {
      meta.currentStoreId = currentStoreId;
      persistStoresMeta(meta);
    }
    return { meta, storeData, storeId: currentStoreId };
  }

  const migrated = migrateFromSingleStore();
  if (migrated) {
    return migrated;
  }

  const storeId = 'store-default';
  const storeData = createDefaultStoreData();
  meta = {
    version: 1,
    currentStoreId: storeId,
    stores: [
      {
        id: storeId,
        name: '默认门店',
        createdAt: new Date().toISOString(),
        isDefault: true
      }
    ]
  };

  persistStoreData(storeId, storeData);
  persistStoresMeta(meta);

  return { meta, storeData, storeId };
}

function createStore(name, templateStoreId) {
  const meta = loadStoresMeta();
  if (!meta) return null;

  const storeId = 'store-' + uid();
  let storeData;

  if (templateStoreId) {
    storeData = loadStoreData(templateStoreId);
    if (storeData) {
      storeData = {
        ...storeData,
        records: storeData.records.map(r => ({ ...r, id: uid(), timeline: [...(r.timeline || [])], notes: [...(r.notes || [])] })),
        templates: (storeData.templates || []).map(t => ({ ...t })),
        rules: (storeData.rules || []).map(r => ({ ...r, overdueLevels: (r.overdueLevels || []).map(ol => ({ ...ol })) })),
        filters: { query: '', status: '全部' },
        groupMode: storeData.groupMode || 'auto',
        ownerInfo: storeData.ownerInfo || {}
      };
    } else {
      storeData = createDefaultStoreData();
    }
  } else {
    storeData = createDefaultStoreData();
  }

  persistStoreData(storeId, storeData);

  const newStore = {
    id: storeId,
    name: name.trim() || '新门店',
    createdAt: new Date().toISOString(),
    isDefault: false
  };

  meta.stores.push(newStore);
  meta.currentStoreId = storeId;
  persistStoresMeta(meta);

  return { store: newStore, storeData };
}

function renameStore(storeId, newName) {
  const meta = loadStoresMeta();
  if (!meta || !meta.stores) return null;

  const storeIndex = meta.stores.findIndex(s => s.id === storeId);
  if (storeIndex === -1) return null;

  meta.stores[storeIndex].name = newName.trim() || '未命名门店';
  persistStoresMeta(meta);

  return meta.stores[storeIndex];
}

function deleteStore(storeId) {
  const meta = loadStoresMeta();
  if (!meta || !meta.stores || meta.stores.length <= 1) return false;

  const storeIndex = meta.stores.findIndex(s => s.id === storeId);
  if (storeIndex === -1) return false;

  const store = meta.stores[storeIndex];
  if (store.isDefault) return false;

  meta.stores.splice(storeIndex, 1);
  deleteStoreData(storeId);

  if (meta.currentStoreId === storeId) {
    meta.currentStoreId = meta.stores[0].id;
  }

  persistStoresMeta(meta);
  return true;
}

function switchStore(storeId) {
  const meta = loadStoresMeta();
  if (!meta || !meta.stores) return null;

  const store = meta.stores.find(s => s.id === storeId);
  if (!store) return null;

  meta.currentStoreId = storeId;
  persistStoresMeta(meta);

  const storeData = loadStoreData(storeId);
  return { store, storeData };
}

function exportStoreData(storeId, storeName) {
  const storeData = loadStoreData(storeId);
  if (!storeData) return null;

  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appId: appConfig.id,
    storeName: storeName,
    storeId: storeId,
    schemaVersion: STORE_SCHEMA_VERSION,
    recordCount: storeData.records?.length || 0,
    data: storeData
  };

  return exportData;
}

function importStoreData(storeId, importData) {
  const { valid, data } = validateImportStoreData(importData);
  if (!valid || !data) return false;

  persistStoreData(storeId, data);
  return true;
}

export {
  getStoreMetaStorageKey,
  getStoreDataKey,
  loadStoresMeta,
  persistStoresMeta,
  loadStoreData,
  persistStoreData,
  deleteStoreData,
  migrateRecordsIfNeeded,
  withIds,
  createDefaultStoreData,
  migrateFromSingleStore,
  initStores,
  createStore,
  renameStore,
  deleteStore,
  switchStore,
  exportStoreData,
  importStoreData
};
