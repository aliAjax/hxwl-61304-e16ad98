import { useMemo, useState, useRef, useEffect } from 'react';
import { Syringe, Plus, Search, Trash2, RotateCcw, CheckCircle2, AlertTriangle, ClipboardList, CalendarDays, PhoneCall, Clock, AlertCircle, CalendarCheck, MessageSquareText, X, User, Calendar, Upload, FileText, AlertOctagon, CheckCheck, Info, Users, PawPrint, ArrowLeft, ChevronRight, Settings, Save, Edit3, Zap, Filter, PlusCircle, MinusCircle, Building2, Copy, Download, MoreHorizontal, ShieldCheck } from 'lucide-react';
import './App.css';
import { appConfig, defaultTemplates, defaultRules, formatLocalDate, today, uid } from './lib/config.js';
import { parseCSV, detectFieldMapping, validateRow, findDuplicates } from './lib/csvImport.js';
import { validateRestoreData, validateImportStoreData, getExpectedFormatHint } from './lib/restoreValidation.js';
import { persistRules, getAdvanceDays, getDefaultStatusForVaccine, getOverdueLevel, getAutoGroupForVaccine, upsertRule, removeRuleById, createDefaultRuleForm } from './lib/rules.js';
import { persistTemplates, calcNextDate, parseLocalDate, upsertTemplate, removeTemplateById } from './lib/templates.js';
import {
  loadStoresMeta,
  loadStoreData,
  persistStoreData,
  initStores,
  createStore,
  renameStore,
  deleteStore,
  switchStore,
  exportStoreData
} from './lib/storeStorage.js';
import {
  detectDataHealthIssues,
  severityLabel,
  exportFullHealthBackup,
  applyHealthFix
} from './lib/healthCheck.js';
import {
  inNextDays,
  isOverdue,
  isToday,
  isWithinNextDays,
  isWithinAdvanceDays,
  daysDiff,
  priorityRank,
  hasOverlap,
  statusClass
} from './lib/recordUtils.js';
import {
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
} from './lib/recordActions.js';
import {
  buildExportData,
  calculateRestoreChanges,
  mergeRestoredData,
  buildRestoreConfigSummary
} from './lib/backupRestore.js';
import {
  extractStoreState,
  persistCurrentStoreState,
  persistStoreField
} from './lib/storeHelpers.js';

function App() {
  const initialStoreState = useMemo(() => initStores(), []);
  const [stores, setStores] = useState(initialStoreState.meta.stores);
  const [currentStoreId, setCurrentStoreId] = useState(initialStoreState.storeId);
  const [records, setRecords] = useState(initialStoreState.storeData.records);
  const [form, setForm] = useState(appConfig.defaultValues);
  const [filters, setFilters] = useState(initialStoreState.storeData.filters);
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
  const [ownerInfo, setOwnerInfo] = useState(initialStoreState.storeData.ownerInfo || {});
  const [editingOwnerInfo, setEditingOwnerInfo] = useState(false);
  const [ownerNoteDraft, setOwnerNoteDraft] = useState('');
  const [ownerPreferredTimeDraft, setOwnerPreferredTimeDraft] = useState('');
  const [templates, setTemplates] = useState(initialStoreState.storeData.templates);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ species: '', vaccine: '', days: '' });
  const [rules, setRules] = useState(initialStoreState.storeData.rules);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState(createDefaultRuleForm());
  const [groupMode, setGroupMode] = useState(initialStoreState.storeData.groupMode);
  const [nextDateManual, setNextDateManual] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [storeModalTab, setStoreModalTab] = useState('list');
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreTemplateId, setNewStoreTemplateId] = useState('');
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [editingStoreName, setEditingStoreName] = useState('');
  const [storeImportPreview, setStoreImportPreview] = useState(null);
  const [storeImportFile, setStoreImportFile] = useState(null);
  const storeImportFileRef = useRef(null);
  const [storeImportTargetId, setStoreImportTargetId] = useState('');
  const [healthIssues, setHealthIssues] = useState([]);
  const [healthHasScanned, setHealthHasScanned] = useState(false);
  const [healthFixSummary, setHealthFixSummary] = useState([]);

  const currentStore = useMemo(() => {
    return stores.find(s => s.id === currentStoreId) || stores[0] || null;
  }, [stores, currentStoreId]);

  function saveCurrentStoreData(updates = {}) {
    persistCurrentStoreState(currentStoreId, { records, templates, rules, filters, groupMode, ownerInfo }, updates);
  }

  function persist(next) {
    setRecords(next);
    persistStoreField(currentStoreId, 'records', next);
  }

  function saveTemplates(next) {
    setTemplates(next);
    persistTemplates(next);
    persistStoreField(currentStoreId, 'templates', next);
  }

  function saveFilters(next) {
    setFilters(next);
    persistStoreField(currentStoreId, 'filters', next);
  }

  function saveGroupMode(next) {
    setGroupMode(next);
    persistStoreField(currentStoreId, 'groupMode', next);
  }

  function saveOwnerInfo(next) {
    setOwnerInfo(next);
    persistStoreField(currentStoreId, 'ownerInfo', next);
  }

  function handleUpdateOwnerInfo(phone, info) {
    const next = { ...ownerInfo, [phone]: { ...(ownerInfo[phone] || {}), ...info } };
    saveOwnerInfo(next);
  }

  function refreshCurrentStoreState() {
    const meta = loadStoresMeta();
    if (meta?.stores) setStores(meta.stores);
    const nextStoreId = meta?.currentStoreId || currentStoreId;
    const data = loadStoreData(nextStoreId);
    if (data) {
      const state = extractStoreState(data);
      setCurrentStoreId(nextStoreId);
      setRecords(state.records);
      setTemplates(state.templates);
      setRules(state.rules);
      setFilters(state.filters);
      setGroupMode(state.groupMode);
      setOwnerInfo(state.ownerInfo);
    }
  }

  function runHealthScan() {
    const issues = detectDataHealthIssues();
    setHealthIssues(issues);
    setHealthHasScanned(true);
    return issues;
  }

  function handleExportHealthBackup() {
    exportFullHealthBackup();
  }

  function handleFixHealthIssues() {
    const targets = healthIssues.filter((issue) => issue.fixable);
    if (targets.length === 0) return;
    exportFullHealthBackup();
    const summary = targets.map((issue) => {
      try {
        return { id: issue.id, title: issue.title, status: 'success', message: applyHealthFix(issue) };
      } catch (error) {
        return { id: issue.id, title: issue.title, status: 'failed', message: error instanceof Error ? error.message : '修复失败' };
      }
    });
    refreshCurrentStoreState();
    setHealthFixSummary(summary);
    setHealthIssues(detectDataHealthIssues());
    setHealthHasScanned(true);
  }

  function handleSwitchStore(storeId) {
    if (storeId === currentStoreId) return;

    saveCurrentStoreData();

    const result = switchStore(storeId);
    if (result && result.storeData) {
      const state = extractStoreState(result.storeData);
      setCurrentStoreId(storeId);
      setRecords(state.records);
      setTemplates(state.templates);
      setRules(state.rules);
      setFilters(state.filters);
      setGroupMode(state.groupMode);
      setOwnerInfo(state.ownerInfo);
      setSelected(null);
      setSelectedOwner(null);
      setSelectedCalendarDay(null);
    }
  }

  function handleCreateStore() {
    if (!newStoreName.trim()) {
      alert('请输入门店名称');
      return;
    }

    saveCurrentStoreData();

    const result = createStore(newStoreName, newStoreTemplateId || null);
    if (result) {
      const meta = loadStoresMeta();
      const state = extractStoreState(result.storeData);
      setStores(meta.stores);
      setCurrentStoreId(result.store.id);
      setRecords(state.records);
      setTemplates(state.templates);
      setRules(state.rules);
      setFilters(state.filters);
      setGroupMode(state.groupMode);
      setOwnerInfo(state.ownerInfo);
      setSelected(null);
      setSelectedOwner(null);
      setNewStoreName('');
      setNewStoreTemplateId('');
      setShowStoreModal(false);
      setStoreModalTab('list');
    }
  }

  function handleRenameStore() {
    if (!editingStoreName.trim()) {
      alert('请输入门店名称');
      return;
    }
    const updated = renameStore(editingStoreId, editingStoreName);
    if (updated) {
      const meta = loadStoresMeta();
      setStores(meta.stores);
    }
    setEditingStoreId(null);
    setEditingStoreName('');
  }

  function handleDeleteStore(storeId) {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;
    if (store.isDefault) {
      alert('默认门店不能删除');
      return;
    }
    if (!confirm(`确定要删除门店"${store.name}"吗？此操作不可恢复。`)) {
      return;
    }

    const wasCurrent = storeId === currentStoreId;
    const success = deleteStore(storeId);
    if (success) {
      const meta = loadStoresMeta();
      setStores(meta.stores);

      if (wasCurrent) {
        const newCurrentId = meta.currentStoreId;
        const newStoreData = loadStoreData(newCurrentId);
        if (newStoreData) {
          const state = extractStoreState(newStoreData);
          setCurrentStoreId(newCurrentId);
          setRecords(state.records);
          setTemplates(state.templates);
          setRules(state.rules);
          setFilters(state.filters);
          setGroupMode(state.groupMode);
          setOwnerInfo(state.ownerInfo);
          setSelected(null);
          setSelectedOwner(null);
        }
      }
    }
  }

  function handleExportStore(storeId, storeName) {
    const exportData = exportStoreData(storeId, storeName);
    if (!exportData) return;

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = formatLocalDate(new Date());
    link.download = `${storeName}_门店数据_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleStoreImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStoreImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const data = JSON.parse(text);
        const validation = validateImportStoreData(data);
        setStoreImportPreview({
          fileName: file.name,
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
          recordCount: validation.data?.records?.length || 0,
          templateCount: validation.data?.templates?.length || 0,
          ruleCount: validation.data?.rules?.length || 0,
          rawData: data
        });
      } catch (error) {
        setStoreImportPreview({
          fileName: file.name,
          valid: false,
          errors: ['JSON解析失败，请检查文件格式'],
          warnings: [],
          recordCount: 0,
          templateCount: 0,
          ruleCount: 0,
          rawData: null
        });
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  function handleConfirmStoreImport() {
    if (!storeImportPreview || !storeImportPreview.valid || !storeImportTargetId) return;

    const { valid, data } = validateImportStoreData(storeImportPreview.rawData);
    if (!valid || !data) return;

    persistStoreData(storeImportTargetId, data);

    if (storeImportTargetId === currentStoreId) {
      const state = extractStoreState(data);
      setRecords(state.records);
      setTemplates(state.templates);
      setRules(state.rules);
      setFilters(state.filters);
      setGroupMode(state.groupMode);
      setOwnerInfo(state.ownerInfo);
      setSelected(null);
      setSelectedOwner(null);
    }

    setShowStoreModal(false);
    setStoreImportPreview(null);
    setStoreImportFile(null);
    setStoreImportTargetId('');
    if (storeImportFileRef.current) {
      storeImportFileRef.current.value = '';
    }
    alert('门店数据导入成功');
  }

  function handleCancelStoreImport() {
    setStoreImportPreview(null);
    setStoreImportFile(null);
    setStoreImportTargetId('');
    if (storeImportFileRef.current) {
      storeImportFileRef.current.value = '';
    }
  }

  function saveRules(next) {
    setRules(next);
    persistRules(next);
    persistStoreField(currentStoreId, 'rules', next);
  }

  function addTemplate(e) {
    e.preventDefault();
    const { species, vaccine, days } = templateForm;
    if (!species || !vaccine || !days || Number(days) <= 0) return;
    const next = upsertTemplate(templates, templateForm);
    saveTemplates(next);
    setTemplateForm({ species: '', vaccine: '', days: '' });
    setEditingTemplate(null);
  }

  function removeTemplate(id) {
    saveTemplates(removeTemplateById(templates, id));
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

  function addRule(e) {
    e.preventDefault();
    if (!ruleForm.vaccine || !ruleForm.advanceDays || Number(ruleForm.advanceDays) <= 0) return;
    const next = upsertRule(rules, ruleForm);
    saveRules(next);
    setRuleForm(createDefaultRuleForm());
    setEditingRule(null);
  }

  function removeRule(id) {
    saveRules(removeRuleById(rules, id));
  }

  function restoreDefaultRules() {
    saveRules(defaultRules.map(r => ({ ...r })));
    setEditingRule(null);
    setRuleForm(createDefaultRuleForm());
  }

  function startEditRule(rule) {
    setEditingRule(rule.id);
    setRuleForm({
      vaccine: rule.vaccine,
      advanceDays: rule.advanceDays,
      overdueLevels: (rule.overdueLevels || []).map(ol => ({ ...ol })),
      defaultStatus: rule.defaultStatus,
      autoGroup: rule.autoGroup
    });
  }

  function cancelEditRule() {
    setEditingRule(null);
    setRuleForm(createDefaultRuleForm());
  }

  function addOverdueLevelToForm() {
    setRuleForm({
      ...ruleForm,
      overdueLevels: [...ruleForm.overdueLevels, { id: uid(), label: '', min: 1, max: 9999 }]
    });
  }

  function removeOverdueLevelFromForm(levelId) {
    if (ruleForm.overdueLevels.length <= 1) return;
    setRuleForm({
      ...ruleForm,
      overdueLevels: ruleForm.overdueLevels.filter(ol => ol.id !== levelId)
    });
  }

  function updateOverdueLevelInForm(levelId, field, value) {
    setRuleForm({
      ...ruleForm,
      overdueLevels: ruleForm.overdueLevels.map(ol =>
        ol.id === levelId ? { ...ol, [field]: field === 'label' ? value : Number(value) } : ol
      )
    });
  }

  function repairRecords() {
    const next = repairRecordDates(records, templates);
    persist(next);
    const count = next.filter((r, i) => r.nextDate !== records[i].nextDate).length;
    alert(`已修复 ${count} 条记录的下次提醒日期`);
  }

  function addRecord(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedValues = Object.fromEntries(formData.entries());
    const nextRecord = buildNewRecord({ form, submittedValues, templates, rules, records, appConfig });
    persist([nextRecord, ...records]);
    setForm(appConfig.defaultValues);
    setNextDateManual(false);
    setSelected(nextRecord);
  }

  function addNote(recordId) {
    if (!newNoteContent.trim()) return;
    const note = buildNote(newNoteContent, newNoteOperator);
    const next = addNoteToRecords(records, recordId, note);
    persist(next);
    const updated = next.find((item) => item.id === recordId);
    if (selected?.id === recordId) setSelected(updated);
    setNewNoteContent('');
    setNewNoteOperator('');
  }

  function removeNote(recordId, noteId) {
    const next = removeNoteFromRecords(records, recordId, noteId);
    persist(next);
    const updated = next.find((item) => item.id === recordId);
    if (selected?.id === recordId) setSelected(updated);
  }

  function updateStatus(id, status) {
    const next = updateStatusInRecords(records, id, status);
    persist(next);
    if (selected?.id === id) setSelected(next.find((item) => item.id === id));
  }

  function removeRecord(id) {
    const next = removeRecordFromList(records, id);
    persist(next);
    if (selected?.id === id) setSelected(null);
  }

  function duplicateRecord(item) {
    const copied = duplicateRecordItem(item, rules);
    persist([copied, ...records]);
    setSelected(copied);
  }

  function addTemperature(item) {
    const value = Number(prompt('录入新的温度读数'));
    if (!Number.isFinite(value)) return;
    const next = addTemperatureToRecords(records, item.id, value);
    persist(next);
    setSelected(next.find((record) => record.id === item.id));
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
    const newRecords = importPreview.validRows.map(row => buildCSVImportRecord(row, rules));
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
    const exportData = buildExportData({
      records, templates, rules, filters, groupMode, ownerInfo,
      storeName: currentStore?.name || '默认门店',
      storeId: currentStoreId,
      appConfig
    });
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = formatLocalDate(new Date());
    link.download = `宠物疫苗提醒数据_${currentStore?.name || '默认门店'}_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          const parseHint = getExpectedFormatHint(
            `❌ JSON解析失败：文件内容不是有效的JSON格式\n` +
            `错误详情：${parseError instanceof Error ? parseError.message.replace(/^JSON\.parse: /, '') : String(parseError)}`
          );
          setRestoreError({ type: 'format', message: parseHint });
          return;
        }

        const validation = validateRestoreData(data);

        if (!validation.valid && validation.validRecords.length === 0) {
          setRestoreError({
            type: 'validation',
            message: validation.errors.join('\n\n'),
            details: validation
          });
          return;
        }

        const changes = calculateRestoreChanges(validation.validRecords, records);

        setRestoreFile(file);
        setRestorePreview({
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(2),
          exportedAt: data.exportedAt || null,
          version: data.version || 0,
          storeName: data.storeName || null,
          recordCount: data.recordCount ?? validation.totalRecords,
          templateCount: validation.templates?.length || 0,
          ruleCount: validation.rules?.length || 0,
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

    const { changes, validation } = restorePreview;
    const { mergedRecords, nextTemplates, nextRules, nextFilters, nextGroupMode, nextOwnerInfo } = mergeRestoredData({
      records, changes, validation, templates, rules, filters, groupMode, ownerInfo
    });

    setRecords(mergedRecords);
    setTemplates(nextTemplates);
    setRules(nextRules);
    setFilters(nextFilters);
    setGroupMode(nextGroupMode);
    setOwnerInfo(nextOwnerInfo);

    persistCurrentStoreState(currentStoreId, {
      records: mergedRecords,
      templates: nextTemplates,
      rules: nextRules,
      filters: nextFilters,
      groupMode: nextGroupMode,
      ownerInfo: nextOwnerInfo
    });

    persistTemplates(nextTemplates);
    persistRules(nextRules);

    const configSummary = buildRestoreConfigSummary(validation);

    cancelRestore();
    alert(`恢复完成：\n新增 ${changes.addCount} 条\n覆盖 ${changes.overwriteCount} 条\n跳过 ${changes.skipCount} 条${configSummary.length ? `\n恢复模块：${configSummary.join('、')}` : ''}`);
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
        const aOverdue = isOverdue(a.nextDate);
        const bOverdue = isOverdue(b.nextDate);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        if (aOverdue && bOverdue) {
          const aDays = Math.abs(daysDiff(a.nextDate));
          const bDays = Math.abs(daysDiff(b.nextDate));
          const aLevel = getOverdueLevel(aDays, a.vaccine, rules);
          const bLevel = getOverdueLevel(bDays, b.vaccine, rules);
          if (aLevel && bLevel && aLevel.level !== bLevel.level) {
            return bLevel.level - aLevel.level;
          }
          return bDays - aDays;
        }
        const aDate = a[appConfig.dateKey] || a.sentAt || a.createdAt || '';
        const bDate = b[appConfig.dateKey] || b.sentAt || b.createdAt || '';
        return String(aDate).localeCompare(String(bDate));
      });
  }, [records, filters, rules]);

  const metrics = [
    { label: "宠物数", value: records.length },
    { label: "待联系", value: records.filter((item) => item.status === '待联系').length },
    { label: "即将到期", value: records.filter((item) => {
      if (!item.nextDate) return false;
      const adv = getAdvanceDays(item.vaccine, rules);
      return inNextDays(item.nextDate, adv);
    }).length },
  ];

  const contactListGroups = useMemo(() => {
    const overdueByLevel = {};
    const todayList = [];
    const upcomingList = [];
    records.forEach(item => {
      if (isOverdue(item.nextDate)) {
        const diff = Math.abs(daysDiff(item.nextDate));
        const level = getOverdueLevel(diff, item.vaccine, rules);
        const key = level ? level.label : '逾期';
        if (!overdueByLevel[key]) overdueByLevel[key] = [];
        overdueByLevel[key].push({ ...item, overdueDays: diff, overdueLevel: level });
      } else if (isToday(item.nextDate)) {
        todayList.push(item);
      } else {
        const adv = getAdvanceDays(item.vaccine, rules);
        if (isWithinNextDays(item.nextDate, adv)) {
          upcomingList.push(item);
        }
      }
    });
    Object.keys(overdueByLevel).forEach(key => {
      overdueByLevel[key].sort((a, b) => a.overdueDays - b.overdueDays);
    });
    todayList.sort((a, b) => parseLocalDate(a.nextDate) - parseLocalDate(b.nextDate));
    upcomingList.sort((a, b) => parseLocalDate(a.nextDate) - parseLocalDate(b.nextDate));
    return { overdueByLevel, today: todayList, upcoming: upcomingList };
  }, [records, rules]);

  const groupedByDate = useMemo(() => {
    if (groupMode === 'auto') {
      return filteredRecords.reduce((acc, item) => {
        const autoGroup = getAutoGroupForVaccine(item.vaccine, rules);
        let key;
        if (autoGroup === 'vaccine') {
          key = item.vaccine || '未分类';
        } else if (autoGroup === 'status') {
          key = item.status || '未知';
        } else if (autoGroup === 'overdue') {
          if (isOverdue(item.nextDate)) {
            const diff = Math.abs(daysDiff(item.nextDate));
            const level = getOverdueLevel(diff, item.vaccine, rules);
            key = level ? level.label : '逾期';
          } else if (isToday(item.nextDate)) {
            key = '今日到期';
          } else {
            const adv = getAdvanceDays(item.vaccine, rules);
            if (isWithinNextDays(item.nextDate, adv)) {
              key = '即将到期';
            } else {
              key = '未到提醒期';
            }
          }
        } else {
          key = item[appConfig.dateKey] || item.date || item.enrollDate || '未排期';
        }
        (acc[key] ||= []).push(item);
        return acc;
      }, {});
    } else if (groupMode === 'vaccine') {
      return filteredRecords.reduce((acc, item) => {
        const key = item.vaccine || '未分类';
        (acc[key] ||= []).push(item);
        return acc;
      }, {});
    } else if (groupMode === 'status') {
      return filteredRecords.reduce((acc, item) => {
        const key = item.status || '未知';
        (acc[key] ||= []).push(item);
        return acc;
      }, {});
    } else if (groupMode === 'overdue') {
      return filteredRecords.reduce((acc, item) => {
        let key;
        if (isOverdue(item.nextDate)) {
          const diff = Math.abs(daysDiff(item.nextDate));
          const level = getOverdueLevel(diff, item.vaccine, rules);
          key = level ? level.label : '逾期';
        } else if (isToday(item.nextDate)) {
          key = '今日到期';
        } else {
          const adv = getAdvanceDays(item.vaccine, rules);
          if (isWithinNextDays(item.nextDate, adv)) {
            key = '即将到期';
          } else {
            key = '未到提醒期';
          }
        }
        (acc[key] ||= []).push(item);
        return acc;
      }, {});
    }
    return filteredRecords.reduce((acc, item) => {
      const key = item[appConfig.dateKey] || item.date || item.enrollDate || '未排期';
      (acc[key] ||= []).push(item);
      return acc;
    }, {});
  }, [filteredRecords, rules, groupMode]);

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
        const info = ownerInfo[phone] || {};
        groups[phone] = {
          ownerPhone: phone,
          pets: [],
          lastContactTime: null,
          pendingCount: 0,
          totalCount: 0,
          note: info.note || '',
          preferredContactTime: info.preferredContactTime || ''
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
  }, [records, ownerInfo]);

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

  useEffect(() => {
    setEditingOwnerInfo(false);
    setOwnerNoteDraft('');
    setOwnerPreferredTimeDraft('');
  }, [selectedOwner]);

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
        <div className="store-selector-card">
          <div className="store-current">
            <div className="store-icon"><Building2 size={24} /></div>
            <div className="store-info">
              <span className="store-label">当前门店</span>
              <strong className="store-name">{currentStore?.name || '默认门店'}</strong>
            </div>
            <button
              type="button"
              className="store-manage-btn"
              onClick={() => { setShowStoreModal(true); setStoreModalTab('list'); }}
              title="门店管理"
            >
              <Settings size={16} />
            </button>
          </div>
          <div className="store-switcher">
            {stores.map((store) => (
              <button
                key={store.id}
                type="button"
                className={`store-switch-btn ${store.id === currentStoreId ? 'active' : ''}`}
                onClick={() => handleSwitchStore(store.id)}
                title={store.name}
              >
                {store.isDefault && <span className="store-badge-default">默认</span>}
                <span className="store-switch-name">{store.name}</span>
              </button>
            ))}
            <button
              type="button"
              className="store-switch-btn add-store-btn"
              onClick={() => { setShowStoreModal(true); setStoreModalTab('create'); }}
            >
              <Plus size={14} />
              <span>新建门店</span>
            </button>
          </div>
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
        <button
          className={`view-tab ${currentView === 'rules' ? 'active' : ''}`}
          onClick={() => { setCurrentView('rules'); setSelected(null); setSelectedOwner(null); setSelectedCalendarDay(null); }}
        >
          <Zap size={16} />
          提醒规则引擎
        </button>
        <button
          className={`view-tab ${currentView === 'health' ? 'active' : ''}`}
          onClick={() => {
            setCurrentView('health');
            setSelected(null);
            setSelectedOwner(null);
            setSelectedCalendarDay(null);
            runHealthScan();
          }}
        >
          <ShieldCheck size={16} />
          数据健康检查
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
        ) : currentView === 'rules' ? (
          <>
            <article className="metric">
              <span>规则数量</span>
              <strong>{rules.length}</strong>
            </article>
            <article className="metric">
              <span>覆盖疫苗</span>
              <strong>{rules.filter(r => appConfig.fields.find(f => f.key === 'vaccine').options.includes(r.vaccine)).length}/{appConfig.fields.find(f => f.key === 'vaccine').options.length}</strong>
            </article>
            <article className="metric">
              <span>逾期分级总数</span>
              <strong>{rules.reduce((sum, r) => sum + (r.overdueLevels || []).length, 0)}</strong>
            </article>
          </>
        ) : currentView === 'health' ? (
          <>
            <article className="metric">
              <span>风险项</span>
              <strong>{healthIssues.length}</strong>
            </article>
            <article className="metric">
              <span>高风险</span>
              <strong>{healthIssues.filter((issue) => issue.severity === 'critical').length}</strong>
            </article>
            <article className="metric">
              <span>已修复</span>
              <strong>{healthFixSummary.filter((item) => item.status === 'success').length}</strong>
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
            {Object.entries(contactListGroups.overdueByLevel).length > 0 ? (
              Object.entries(contactListGroups.overdueByLevel).map(([levelLabel, items]) => (
                <div className={`contact-group overdue-group overdue-level-${items[0]?.overdueLevel?.level ?? 0}`} key={levelLabel}>
                  <div className="contact-group-header">
                    <div className="contact-group-title">
                      <AlertCircle size={16} className="contact-group-icon overdue-icon" />
                      <h3>{levelLabel}</h3>
                      <span className="contact-count">{items.length}</span>
                    </div>
                  </div>
                  <div className="contact-records">
                    {items.map((item) => (
                      <article className={'contact-record ' + (item.status === '已联系' ? 'contact-record-done' : '')} key={item.id}>
                        <div className="contact-record-main">
                          <div className="contact-record-info">
                            <h4>{item.pet}</h4>
                            <p className="contact-meta">{item.ownerPhone}</p>
                            <p className="contact-vaccine">{item.vaccine}</p>
                          </div>
                          <div className="contact-record-side">
                            <span className={'status ' + statusClass(item.status)}>{item.status}</span>
                            <span className={`days-badge overdue-badge level-badge-${item.overdueLevel?.level ?? 0}`}>逾期{item.overdueDays}天</span>
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
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="contact-group overdue-group">
                <div className="contact-group-header">
                  <div className="contact-group-title">
                    <AlertCircle size={16} className="contact-group-icon overdue-icon" />
                    <h3>已逾期</h3>
                    <span className="contact-count">0</span>
                  </div>
                </div>
                <div className="contact-records">
                  <p className="empty-group">暂无逾期记录</p>
                </div>
              </div>
            )}

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
                  <h3>即将到期</h3>
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
                            {isWithinAdvanceDays(pet, rules) && pet.status === '待联系' && (
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
                    <MessageSquareText size={16} />
                    <h3>主人信息</h3>
                    {!editingOwnerInfo && (
                      <button
                        type="button"
                        className="edit-owner-info-btn"
                        onClick={() => {
                          setOwnerNoteDraft(selectedOwnerProfile.note || '');
                          setOwnerPreferredTimeDraft(selectedOwnerProfile.preferredContactTime || '');
                          setEditingOwnerInfo(true);
                        }}
                      >
                        <Edit3 size={14} />
                        编辑
                      </button>
                    )}
                  </div>
                  {editingOwnerInfo ? (
                    <div className="owner-info-edit-form">
                      <div className="form-field">
                        <label>
                          <span>主人备注</span>
                          <textarea
                            value={ownerNoteDraft}
                            onChange={(e) => setOwnerNoteDraft(e.target.value)}
                            placeholder="输入主人备注信息，如：客户偏好、特殊说明等..."
                            rows={4}
                          />
                        </label>
                      </div>
                      <div className="form-field">
                        <label>
                          <span>首选联系时间</span>
                          <select
                            value={ownerPreferredTimeDraft}
                            onChange={(e) => setOwnerPreferredTimeDraft(e.target.value)}
                          >
                            <option value="">请选择</option>
                            <option value="上午 (9:00-12:00)">上午 (9:00-12:00)</option>
                            <option value="下午 (14:00-18:00)">下午 (14:00-18:00)</option>
                            <option value="晚上 (19:00-21:00)">晚上 (19:00-21:00)</option>
                            <option value="工作日">工作日</option>
                            <option value="周末">周末</option>
                            <option value="随时">随时</option>
                          </select>
                        </label>
                      </div>
                      <div className="form-actions">
                        <button
                          type="button"
                          className="primary"
                          onClick={() => {
                            handleUpdateOwnerInfo(selectedOwnerProfile.ownerPhone, {
                              note: ownerNoteDraft.trim(),
                              preferredContactTime: ownerPreferredTimeDraft
                            });
                            setEditingOwnerInfo(false);
                          }}
                        >
                          <Save size={14} />
                          保存
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setEditingOwnerInfo(false);
                            setOwnerNoteDraft('');
                            setOwnerPreferredTimeDraft('');
                          }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="owner-info-display">
                      <div className="owner-info-item">
                        <span className="info-label">主人备注</span>
                        <p className="info-value">
                          {selectedOwnerProfile.note || <span className="empty-text">暂无备注</span>}
                        </p>
                      </div>
                      <div className="owner-info-item">
                        <span className="info-label">首选联系时间</span>
                        <p className="info-value">
                          {selectedOwnerProfile.preferredContactTime || <span className="empty-text">未设置</span>}
                        </p>
                      </div>
                    </div>
                  )}
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

      {currentView === 'rules' && (
        <section className="rules-section">
          <div className="rules-layout">
            <div className="panel rules-form-panel">
              <div className="panel-title">
                <Zap size={18} />
                <h2>提醒规则引擎</h2>
              </div>
              <p className="hint">为不同疫苗类型配置提醒规则：提前提醒天数决定"即将到期"范围，逾期分级决定逾期严重程度划分，默认联系状态决定新增记录初始状态，自动分组规则决定分组视图默认分组方式。</p>
              <form className="rules-form" onSubmit={addRule}>
                <label>
                  <span>疫苗类型</span>
                  <select value={ruleForm.vaccine} onChange={(e) => setRuleForm({ ...ruleForm, vaccine: e.target.value })} disabled={!!editingRule}>
                    <option value="">选择疫苗</option>
                    {appConfig.fields.find(f => f.key === 'vaccine').options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
                <label>
                  <span>提前提醒天数</span>
                  <input type="number" min="1" value={ruleForm.advanceDays} onChange={(e) => setRuleForm({ ...ruleForm, advanceDays: e.target.value })} placeholder="7" />
                  <span className="field-hint">距下次提醒日期多少天内显示为"即将到期"</span>
                </label>
                <label>
                  <span>默认联系状态</span>
                  <select value={ruleForm.defaultStatus} onChange={(e) => setRuleForm({ ...ruleForm, defaultStatus: e.target.value })}>
                    {appConfig.statuses.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <span className="field-hint">新增该疫苗记录时的默认状态</span>
                </label>
                <label>
                  <span>自动分组规则</span>
                  <select value={ruleForm.autoGroup} onChange={(e) => setRuleForm({ ...ruleForm, autoGroup: e.target.value })}>
                    <option value="overdue">按逾期等级</option>
                    <option value="vaccine">按疫苗类型</option>
                    <option value="status">按联系状态</option>
                  </select>
                  <span className="field-hint">分组视图为"按规则引擎"时每条记录使用的分组方式</span>
                </label>
                <div className="overdue-levels-config">
                  <div className="overdue-levels-header">
                    <span>逾期分级</span>
                    <button type="button" className="add-level-btn" onClick={addOverdueLevelToForm}>
                      <PlusCircle size={14} />添加等级
                    </button>
                  </div>
                  <div className="overdue-levels-list">
                    {ruleForm.overdueLevels.map((ol, idx) => (
                      <div className="overdue-level-row" key={ol.id}>
                        <input
                          type="text"
                          value={ol.label}
                          onChange={(e) => updateOverdueLevelInForm(ol.id, 'label', e.target.value)}
                          placeholder="等级名称"
                          className="level-label-input"
                        />
                        <span className="level-range-label">{idx === 0 ? '逾期' : ''} ≥</span>
                        <input
                          type="number"
                          min="1"
                          value={ol.min}
                          onChange={(e) => updateOverdueLevelInForm(ol.id, 'min', e.target.value)}
                          className="level-num-input"
                        />
                        <span className="level-range-label">天</span>
                        <span className="level-range-label">且 ≤</span>
                        <input
                          type="number"
                          min="1"
                          value={ol.max}
                          onChange={(e) => updateOverdueLevelInForm(ol.id, 'max', e.target.value)}
                          className="level-num-input"
                        />
                        <span className="level-range-label">天</span>
                        {ruleForm.overdueLevels.length > 1 && (
                          <button type="button" className="remove-level-btn" onClick={() => removeOverdueLevelFromForm(ol.id)}>
                            <MinusCircle size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rules-form-actions">
                  <button className="primary" type="submit" disabled={!ruleForm.vaccine || !ruleForm.advanceDays || Number(ruleForm.advanceDays) <= 0}>
                    <Save size={16} />
                    {editingRule ? '保存修改' : '添加规则'}
                  </button>
                  {editingRule && (
                    <button type="button" className="btn-secondary" onClick={cancelEditRule}>取消</button>
                  )}
                </div>
              </form>
              <div className="rules-restore">
                <button type="button" className="restore-btn" onClick={restoreDefaultRules}>
                  <RotateCcw size={14} />
                  恢复默认规则
                </button>
              </div>
            </div>

            <div className="panel rules-list-panel">
              <div className="panel-title">
                <ClipboardList size={18} />
                <h2>规则列表</h2>
                <span className="template-count">{rules.length}</span>
              </div>
              <div className="rules-list">
                {rules.length === 0 ? (
                  <p className="empty-group">暂无规则，请添加</p>
                ) : (
                  rules.map((rule) => (
                    <article className="rule-item" key={rule.id}>
                      <div className="rule-item-main">
                        <div className="rule-item-header">
                          <span className="rule-vaccine-tag">{rule.vaccine}</span>
                          <span className="rule-advance-tag">提前{rule.advanceDays}天</span>
                          <span className="rule-status-tag">{rule.defaultStatus}</span>
                          <span className="rule-group-tag">{rule.autoGroup === 'overdue' ? '按逾期等级' : rule.autoGroup === 'vaccine' ? '按疫苗类型' : '按联系状态'}</span>
                        </div>
                        <div className="rule-item-levels">
                          {(rule.overdueLevels || []).map((ol, idx) => (
                            <span key={ol.id || idx} className={`rule-level-tag level-tag-${idx}`}>{ol.label}({ol.min}-{ol.max === 9999 ? '∞' : ol.max}天)</span>
                          ))}
                        </div>
                      </div>
                      <div className="rule-item-actions">
                        <button type="button" onClick={() => startEditRule(rule)} title="编辑">
                          <Edit3 size={14} />
                        </button>
                        <button type="button" className="ghost-danger" onClick={() => removeRule(rule.id)} title="删除">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {currentView === 'health' && (
        <section className="health-section">
          <div className="panel health-panel">
            <div className="health-header">
              <div className="panel-title">
                <ShieldCheck size={18} />
                <h2>离线数据健康检查与修复中心</h2>
              </div>
              <div className="health-toolbar">
                <button type="button" className="btn-secondary" onClick={runHealthScan}>
                  <Search size={16} />
                  重新检查
                </button>
                <button type="button" className="btn-secondary" onClick={handleExportHealthBackup}>
                  <Download size={16} />
                  导出安全备份
                </button>
                <button type="button" className="primary" onClick={handleFixHealthIssues} disabled={!healthIssues.some((issue) => issue.fixable)}>
                  <CheckCircle2 size={16} />
                  修复可处理项
                </button>
              </div>
            </div>

            <div className="health-risk-strip">
              <div>
                <strong>修复前会自动导出完整本地快照。</strong>
                <span>检查范围包含旧版单店数据、多门店元数据、门店数据结构、记录timeline/notes、模板与规则同步状态。</span>
              </div>
            </div>

            {!healthHasScanned ? (
              <div className="health-empty">
                <ShieldCheck size={32} />
                <p>点击检查后会读取浏览器本地存储，并列出风险说明与可执行修复项。</p>
                <button type="button" className="primary" onClick={runHealthScan}>开始检查</button>
              </div>
            ) : healthIssues.length === 0 ? (
              <div className="health-ok">
                <CheckCircle2 size={28} />
                <div>
                  <strong>当前离线数据结构健康</strong>
                  <span>未发现需要修复的旧数据、损坏数据或配置不同步项。</span>
                </div>
              </div>
            ) : (
              <div className="health-issue-list">
                {healthIssues.map((issue) => (
                  <article className={`health-issue-card severity-${issue.severity}`} key={issue.id}>
                    <div className="health-issue-top">
                      <span className="health-severity">{severityLabel(issue.severity)}</span>
                      <strong>{issue.title}</strong>
                      <span className="health-count">{issue.count} 项</span>
                    </div>
                    <p>{issue.risk}</p>
                    <div className="health-action-row">
                      <span>{issue.action}</span>
                      {issue.samples?.length > 0 && <small>样例：{issue.samples.join('、')}</small>}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {healthFixSummary.length > 0 && (
              <div className="health-fix-summary">
                <h3>修复摘要</h3>
                {healthFixSummary.map((item) => (
                  <div className={`health-fix-item ${item.status}`} key={item.id}>
                    <span>{item.title}</span>
                    <strong>{item.message}</strong>
                  </div>
                ))}
              </div>
            )}
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
                  <input value={filters.query} onChange={(event) => saveFilters({ ...filters, query: event.target.value })} placeholder="搜索宠物/主人" />
                </div>
                <select value={filters.status} onChange={(event) => saveFilters({ ...filters, status: event.target.value })}>
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
                          if (field.key === 'vaccine') {
                            const ruleDefault = getDefaultStatusForVaccine(event.target.value, rules);
                            next.status = ruleDefault;
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
                  <input value={filters.query} onChange={(event) => saveFilters({ ...filters, query: event.target.value })} placeholder={appConfig.filters[0]?.label || '搜索'} />
                </div>
                <select value={filters.status} onChange={(event) => saveFilters({ ...filters, status: event.target.value })}>
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
              {!appConfig.directory && !appConfig.board && (
                <div className="group-mode-selector">
                  <Filter size={14} />
                  <span>分组方式：</span>
                  <button type="button" className={`group-mode-btn ${groupMode === 'auto' ? 'active' : ''}`} onClick={() => saveGroupMode('auto')}>按规则引擎</button>
                  <button type="button" className={`group-mode-btn ${groupMode === 'overdue' ? 'active' : ''}`} onClick={() => saveGroupMode('overdue')}>按逾期等级</button>
                  <button type="button" className={`group-mode-btn ${groupMode === 'vaccine' ? 'active' : ''}`} onClick={() => saveGroupMode('vaccine')}>按疫苗类型</button>
                  <button type="button" className={`group-mode-btn ${groupMode === 'status' ? 'active' : ''}`} onClick={() => saveGroupMode('status')}>按联系状态</button>
                  <button type="button" className={`group-mode-btn ${groupMode === 'date' ? 'active' : ''}`} onClick={() => saveGroupMode('date')}>按日期</button>
                </div>
              )}
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
                    <p>将当前门店数据导出为JSON备份文件，包含记录、时间线、备注、复种周期模板和提醒规则。</p>
                    <div className="backup-count-grid">
                      <span>门店<strong>{currentStore?.name || '默认门店'}</strong></span>
                      <span>记录<strong>{records.length}</strong></span>
                      <span>模板<strong>{templates.length}</strong></span>
                      <span>规则<strong>{rules.length}</strong></span>
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
                    <p>选择之前导出的JSON备份文件恢复数据。恢复前将展示记录变更与模板规则模块，确认后才会执行。</p>
                    <p className="warning-text">
                      <AlertTriangle size={14} />
                      注意：ID相同的记录将被覆盖，模板和规则会随备份同步恢复
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
                    {restorePreview.storeName && (
                      <div className="info-item">
                        <span className="info-label">来源门店</span>
                        <span className="info-value">{restorePreview.storeName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {restorePreview && restorePreview.validation && (restorePreview.validation.allWarnings || []).length > 0 && (
                  <div className="warnings-section">
                    <h3><AlertTriangle size={16} className="warning-icon" />警告</h3>
                    <ul className="warnings-list">
                      {(restorePreview.validation.allWarnings || []).slice(0, 10).map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                      {(restorePreview.validation.allWarnings || []).length > 10 && (
                        <li>... 还有 {(restorePreview.validation.allWarnings || []).length - 10} 条警告</li>
                      )}
                    </ul>
                  </div>
                )}

                {restorePreview && restorePreview.validation && (restorePreview.validation.invalidRecords || []).length > 0 && (
                  <div className="errors-section">
                    <h3><AlertOctagon size={16} className="error-icon" />无效记录（{(restorePreview.validation.invalidRecords || []).length} 条）</h3>
                    <div className="invalid-records-list">
                      {(restorePreview.validation.invalidRecords || []).slice(0, 5).map((item, i) => (
                        <div key={i} className="invalid-record-item">
                          <span className="record-index">第 {item.index + 1} 条：</span>
                          <span className="record-error">{(item.errors || []).join('；')}</span>
                        </div>
                      ))}
                      {(restorePreview.validation.invalidRecords || []).length > 5 && (
                        <p className="more-errors">... 还有 {(restorePreview.validation.invalidRecords || []).length - 5} 条无效记录</p>
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

                <div className="config-restore-summary">
                  <h3><Settings size={16} />配置模块</h3>
                  <div className="config-summary-grid">
                    <div className={restorePreview.validation.templates ? 'config-summary-item active' : 'config-summary-item'}>
                      <span>复种模板</span>
                      <strong>{restorePreview.validation.templates?.length ?? templates.length}</strong>
                      <small>{restorePreview.validation.templates ? '将随备份恢复' : '备份未包含，保持当前'}</small>
                    </div>
                    <div className={restorePreview.validation.rules ? 'config-summary-item active' : 'config-summary-item'}>
                      <span>提醒规则</span>
                      <strong>{restorePreview.validation.rules?.length ?? rules.length}</strong>
                      <small>{restorePreview.validation.rules ? '将随备份恢复' : '备份未包含，保持当前'}</small>
                    </div>
                    <div className={restorePreview.validation.ownerInfo ? 'config-summary-item active' : 'config-summary-item'}>
                      <span>主人备注</span>
                      <strong>{restorePreview.validation.ownerInfo ? Object.keys(restorePreview.validation.ownerInfo).length : Object.keys(ownerInfo).length}</strong>
                      <small>{restorePreview.validation.ownerInfo ? '将随备份恢复' : '备份未包含，保持当前'}</small>
                    </div>
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
                  disabled={
                    restorePreview.changes.addCount === 0 &&
                    restorePreview.changes.overwriteCount === 0 &&
                    !restorePreview.validation.templates &&
                    !restorePreview.validation.rules &&
                    !restorePreview.validation.filters &&
                    !restorePreview.validation.groupMode &&
                    !restorePreview.validation.ownerInfo
                  }
                >
                  <CheckCheck size={16} />
                  确认恢复（新增 {restorePreview.changes.addCount}，覆盖 {restorePreview.changes.overwriteCount}）
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showStoreModal && (
        <div className="modal-overlay" onClick={() => { setShowStoreModal(false); handleCancelStoreImport(); setStoreModalTab('list'); setEditingStoreId(null); setEditingStoreName(''); setNewStoreName(''); setNewStoreTemplateId(''); }}>
          <div className="modal store-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Building2 size={20} />多门店离线数据空间</h2>
              <button type="button" className="modal-close-btn" onClick={() => { setShowStoreModal(false); handleCancelStoreImport(); setStoreModalTab('list'); setEditingStoreId(null); setEditingStoreName(''); setNewStoreName(''); setNewStoreTemplateId(''); }}>
                <X size={18} />
              </button>
            </div>

            <div className="store-modal-tabs">
              <button
                type="button"
                className={`store-tab-btn ${storeModalTab === 'list' ? 'active' : ''}`}
                onClick={() => setStoreModalTab('list')}
              >
                门店列表
              </button>
              <button
                type="button"
                className={`store-tab-btn ${storeModalTab === 'create' ? 'active' : ''}`}
                onClick={() => setStoreModalTab('create')}
              >
                <Plus size={14} />
                新建门店
              </button>
              <button
                type="button"
                className={`store-tab-btn ${storeModalTab === 'import' ? 'active' : ''}`}
                onClick={() => setStoreModalTab('import')}
              >
                <Upload size={14} />
                导入门店
              </button>
            </div>

            <div className="modal-body">
              {storeModalTab === 'list' && (
                <div className="store-list">
                  <p className="store-list-hint">共 {stores.length} 个门店，点击门店名称可快速切换</p>
                  <div className="store-list-items">
                    {stores.map((store) => {
                      const storeData = loadStoreData(store.id);
                      const recordCount = storeData?.records?.length || 0;
                      const isActive = store.id === currentStoreId;
                      return (
                        <div key={store.id} className={`store-item ${isActive ? 'active' : ''}`}>
                          <div className="store-item-main" onClick={() => { handleSwitchStore(store.id); setShowStoreModal(false); }}>
                            <div className="store-item-icon"><Building2 size={20} /></div>
                            <div className="store-item-info">
                              <div className="store-item-name">
                                {store.name}
                                {store.isDefault && <span className="store-badge-default">默认</span>}
                                {isActive && <span className="store-badge-active">当前</span>}
                              </div>
                              <div className="store-item-meta">
                                <span>{recordCount} 条记录</span>
                                <span>创建于 {new Date(store.createdAt).toLocaleDateString('zh-CN')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="store-item-actions">
                            {editingStoreId === store.id ? (
                              <div className="store-rename-form">
                                <input
                                  type="text"
                                  value={editingStoreName}
                                  onChange={(e) => setEditingStoreName(e.target.value)}
                                  placeholder="输入新名称"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <button type="button" className="btn-primary btn-sm" onClick={handleRenameStore}>确定</button>
                                <button type="button" className="btn-secondary btn-sm" onClick={() => { setEditingStoreId(null); setEditingStoreName(''); }}>取消</button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="store-action-btn"
                                  title="重命名"
                                  onClick={(e) => { e.stopPropagation(); setEditingStoreId(store.id); setEditingStoreName(store.name); }}
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="store-action-btn"
                                  title="复制为新门店"
                                  onClick={(e) => { e.stopPropagation(); setNewStoreName(store.name + ' 副本'); setNewStoreTemplateId(store.id); setStoreModalTab('create'); }}
                                >
                                  <Copy size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="store-action-btn"
                                  title="导出门店数据"
                                  onClick={(e) => { e.stopPropagation(); handleExportStore(store.id, store.name); }}
                                >
                                  <Download size={14} />
                                </button>
                                {!store.isDefault && (
                                  <button
                                    type="button"
                                    className="store-action-btn delete-btn"
                                    title="删除门店"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteStore(store.id); }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {storeModalTab === 'create' && (
                <div className="store-create-form">
                  <div className="form-grid">
                    <label className="wide">
                      门店名称
                      <input
                        type="text"
                        value={newStoreName}
                        onChange={(e) => setNewStoreName(e.target.value)}
                        placeholder="请输入门店名称"
                      />
                    </label>
                    <label className="wide">
                      复制模板（可选）
                      <select
                        value={newStoreTemplateId}
                        onChange={(e) => setNewStoreTemplateId(e.target.value)}
                      >
                        <option value="">不使用模板（空门店）</option>
                        {stores.map((s) => (
                          <option key={s.id} value={s.id}>复制自：{s.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="hint">
                    {newStoreTemplateId
                      ? '将从选中门店复制所有数据（记录、模板、规则等）到新门店'
                      : '新门店将使用默认模板和示例数据'}
                  </p>
                  <button
                    type="button"
                    className="primary"
                    onClick={handleCreateStore}
                    disabled={!newStoreName.trim()}
                  >
                    <Plus size={16} />
                    创建门店
                  </button>
                </div>
              )}

              {storeModalTab === 'import' && (
                <div className="store-import-form">
                  <label className="wide">
                    导入目标门店
                    <select
                      value={storeImportTargetId}
                      onChange={(e) => setStoreImportTargetId(e.target.value)}
                    >
                      <option value="">请选择要覆盖的门店</option>
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </label>
                  <p className="hint">选择目标门店后，导入的数据将覆盖该门店的所有现有数据</p>

                  <div
                    className="import-drop-zone"
                    onDragOver={handleDragOver}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.name.endsWith('.json')) {
                        const newE = { target: { files: [file] } };
                        handleStoreImportFile(newE);
                      } else {
                        alert('请上传JSON格式的门店数据文件');
                      }
                    }}
                  >
                    <Upload size={32} className="drop-icon" />
                    <p>拖拽 JSON 文件到此处，或</p>
                    <button type="button" className="btn-secondary" onClick={() => storeImportFileRef.current?.click()}>
                      选择文件
                    </button>
                    <input
                      ref={storeImportFileRef}
                      type="file"
                      accept=".json,application/json"
                      style={{ display: 'none' }}
                      onChange={handleStoreImportFile}
                    />
                  </div>

                  {storeImportPreview && (
                    <div className={`import-preview ${storeImportPreview.valid ? 'valid' : 'invalid'}`}>
                      <h4>
                        {storeImportPreview.valid ? (
                          <><CheckCircle2 size={16} className="success-icon" /> 文件解析成功</>
                        ) : (
                          <><AlertTriangle size={16} className="warning-icon" /> 文件解析失败</>
                        )}
                      </h4>
                      <p>文件名：{storeImportPreview.fileName}</p>
                      {storeImportPreview.valid && (
                        <div className="import-stats">
                          <span>记录数：{storeImportPreview.recordCount}</span>
                          <span>模板数：{storeImportPreview.templateCount}</span>
                          <span>规则数：{storeImportPreview.ruleCount}</span>
                        </div>
                      )}
                      {storeImportPreview.errors.length > 0 && (
                        <div className="import-errors">
                          {storeImportPreview.errors.map((err, i) => (
                            <p key={i} className="error-text">❌ {err}</p>
                          ))}
                        </div>
                      )}
                      {storeImportPreview.warnings.length > 0 && (
                        <div className="import-warnings">
                          {storeImportPreview.warnings.map((w, i) => (
                            <p key={i} className="warning-text">⚠️ {w}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {storeModalTab === 'import' && storeImportPreview?.valid && storeImportTargetId && (
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCancelStoreImport}>取消</button>
                <button type="button" className="btn-primary" onClick={handleConfirmStoreImport}>
                  <CheckCheck size={16} />
                  确认导入
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
