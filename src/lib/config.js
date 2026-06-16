const appConfig = {
  id: 'hxwl-61304',
  port: 61304,
  title: '宠物医院疫苗提醒',
  subtitle: '单店宠物疫苗复种、联系状态和本周提醒清单',
  domain: '宠物医院',
  icon: 'Syringe',
  storage: 'hxwl-61304-pet-vaccine',
  accent: '#db2777',
  statuses: ['待联系', '已联系', '已接种'],
  primaryStatus: '待联系',
  fields: [
    { key: 'pet', label: '宠物姓名', type: 'input', placeholder: '奶盖', options: [] },
    { key: 'species', label: '物种', type: 'select', placeholder: '猫', options: ['猫', '犬', '兔', '其他'] },
    { key: 'ownerPhone', label: '主人联系方式', type: 'input', placeholder: '13800008888', options: [] },
    { key: 'vaccine', label: '疫苗类型', type: 'select', placeholder: '猫三联', options: ['猫三联', '狂犬', '犬六联', '体内驱虫'] },
    { key: 'lastDate', label: '上次接种日期', type: 'date', placeholder: '', options: [] },
    { key: 'nextDate', label: '下次提醒日期', type: 'date', placeholder: '', options: [] }
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
const STORE_SCHEMA_VERSION = 1;
const BACKUP_FORMAT_VERSION = 2;

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
  {
    id: 'rule-1', vaccine: '猫三联', advanceDays: 7,
    overdueLevels: [
      { id: 'ol-1', label: '轻度逾期', min: 1, max: 7 },
      { id: 'ol-2', label: '中度逾期', min: 8, max: 30 },
      { id: 'ol-3', label: '重度逾期', min: 31, max: 9999 }
    ],
    defaultStatus: '待联系', autoGroup: 'overdue'
  },
  {
    id: 'rule-2', vaccine: '狂犬', advanceDays: 14,
    overdueLevels: [
      { id: 'ol-4', label: '轻度逾期', min: 1, max: 7 },
      { id: 'ol-5', label: '中度逾期', min: 8, max: 30 },
      { id: 'ol-6', label: '重度逾期', min: 31, max: 9999 }
    ],
    defaultStatus: '待联系', autoGroup: 'overdue'
  },
  {
    id: 'rule-3', vaccine: '犬六联', advanceDays: 7,
    overdueLevels: [
      { id: 'ol-7', label: '轻度逾期', min: 1, max: 7 },
      { id: 'ol-8', label: '中度逾期', min: 8, max: 30 },
      { id: 'ol-9', label: '重度逾期', min: 31, max: 9999 }
    ],
    defaultStatus: '待联系', autoGroup: 'overdue'
  },
  {
    id: 'rule-4', vaccine: '体内驱虫', advanceDays: 3,
    overdueLevels: [
      { id: 'ol-10', label: '轻度逾期', min: 1, max: 3 },
      { id: 'ol-11', label: '中度逾期', min: 4, max: 14 },
      { id: 'ol-12', label: '重度逾期', min: 15, max: 9999 }
    ],
    defaultStatus: '待联系', autoGroup: 'vaccine'
  }
];

function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const today = formatLocalDate(new Date());

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export {
  appConfig,
  SCHEMA_VERSION,
  STORE_SCHEMA_VERSION,
  BACKUP_FORMAT_VERSION,
  defaultTemplates,
  defaultRules,
  formatLocalDate,
  today,
  uid
};
