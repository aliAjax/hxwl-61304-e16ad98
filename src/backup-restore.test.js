import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  validateRestoreData,
  validateImportStoreData
} from './lib/restoreValidation.js';
import {
  isValidDate,
  normalizeDate
} from './lib/csvImport.js';
import {
  SCHEMA_VERSION
} from './lib/config.js';

const FIXTURE_DIR = join(process.cwd());

let normalBackup;
let missingFieldsBackup;
let oldVersionNoTimelineBackup;
let invalidFormatText;

beforeAll(() => {
  normalBackup = JSON.parse(readFileSync(join(FIXTURE_DIR, 'test-backup-normal.json'), 'utf-8'));
  missingFieldsBackup = JSON.parse(readFileSync(join(FIXTURE_DIR, 'test-backup-missing-fields.json'), 'utf-8'));
  oldVersionNoTimelineBackup = JSON.parse(readFileSync(join(FIXTURE_DIR, 'test-backup-old-version-no-timeline.json'), 'utf-8'));
  invalidFormatText = readFileSync(join(FIXTURE_DIR, 'test-backup-invalid-format.txt'), 'utf-8');
});

describe('test-backup-normal.json - 正常备份恢复', () => {
  let result;

  beforeAll(() => {
    result = validateRestoreData(normalBackup);
  });

  it('应通过验证', () => {
    expect(result.valid).toBe(true);
  });

  it('应有3条有效记录', () => {
    expect(result.validRecords.length).toBe(3);
  });

  it('不应有无效记录', () => {
    expect(result.invalidRecords.length).toBe(0);
  });

  it('应保留记录中的id', () => {
    expect(result.validRecords[0].id).toBe('test-new-1');
    expect(result.validRecords[1].id).toBe('test-new-2');
    expect(result.validRecords[2].id).toBe('test-new-3');
  });

  it('应保留宠物姓名', () => {
    const names = result.validRecords.map(r => r.pet);
    expect(names).toEqual(['测试猫1', '测试狗1', '测试兔1']);
  });

  it('应保留原始timeline', () => {
    result.validRecords.forEach(record => {
      expect(Array.isArray(record.timeline)).toBe(true);
      expect(record.timeline.length).toBeGreaterThan(0);
    });
  });

  it('记录schemaVersion应为当前版本', () => {
    result.validRecords.forEach(record => {
      expect(record.schemaVersion).toBe(SCHEMA_VERSION);
    });
  });

  it('迁移数应为3（备份记录缺少schemaVersion需要补齐）', () => {
    expect(result.migratedCount).toBe(3);
  });

  it('不应有致命错误', () => {
    expect(result.errors.some(e => !e.includes('条记录存在错误'))).toBe(false);
  });
});

describe('test-backup-missing-fields.json - 缺少必填字段的备份', () => {
  let result;

  beforeAll(() => {
    result = validateRestoreData(missingFieldsBackup);
  });

  it('应通过验证（非致命错误仍返回valid=true，但有无效记录）', () => {
    expect(result.valid).toBe(true);
  });

  it('应有1条有效记录（good-1）', () => {
    expect(result.validRecords.length).toBe(1);
    expect(result.validRecords[0].id).toBe('good-1');
    expect(result.validRecords[0].pet).toBe('有效记录');
  });

  it('应有3条无效记录', () => {
    expect(result.invalidRecords.length).toBe(3);
  });

  it('bad-1缺少ownerPhone应被标记', () => {
    const bad1 = result.invalidRecords.find(r => r.record.id === 'bad-1');
    expect(bad1).toBeDefined();
    expect(bad1.errors.some(e => e.includes('主人联系方式'))).toBe(true);
  });

  it('bad-2缺少pet应被标记', () => {
    const bad2 = result.invalidRecords.find(r => r.record.id === 'bad-2');
    expect(bad2).toBeDefined();
    expect(bad2.errors.some(e => e.includes('宠物姓名'))).toBe(true);
  });

  it('bad-3缺少vaccine应被标记', () => {
    const bad3 = result.invalidRecords.find(r => r.record.id === 'bad-3');
    expect(bad3).toBeDefined();
    expect(bad3.errors.some(e => e.includes('疫苗类型'))).toBe(true);
  });

  it('错误消息中应提及跳过的无效记录数', () => {
    expect(result.errors.some(e => e.includes('3 条记录存在错误'))).toBe(true);
  });

  it('有效记录应被完整迁移（补齐timeline、notes、schemaVersion）', () => {
    const validRec = result.validRecords[0];
    expect(Array.isArray(validRec.timeline)).toBe(true);
    expect(validRec.timeline.length).toBeGreaterThan(0);
    expect(Array.isArray(validRec.notes)).toBe(true);
    expect(validRec.schemaVersion).toBe(SCHEMA_VERSION);
  });
});

describe('test-backup-old-version-no-timeline.json - 旧版本无timeline备份迁移', () => {
  let result;

  beforeAll(() => {
    result = validateRestoreData(oldVersionNoTimelineBackup);
  });

  it('应通过验证', () => {
    expect(result.valid).toBe(true);
  });

  it('应有2条有效记录', () => {
    expect(result.validRecords.length).toBe(2);
  });

  it('应为所有记录自动生成timeline', () => {
    result.validRecords.forEach(record => {
      expect(Array.isArray(record.timeline)).toBe(true);
      expect(record.timeline.length).toBeGreaterThan(0);
    });
  });

  it('迁移的timeline应包含默认状态和迁移来源', () => {
    result.validRecords.forEach(record => {
      const lastTimeline = record.timeline[record.timeline.length - 1];
      expect(lastTimeline.by).toBe('数据迁移');
    });
  });

  it('迁移数应为2（两条记录都需要迁移）', () => {
    expect(result.migratedCount).toBe(2);
  });

  it('应为所有记录补齐notes数组', () => {
    result.validRecords.forEach(record => {
      expect(Array.isArray(record.notes)).toBe(true);
    });
  });

  it('应为所有记录设置schemaVersion', () => {
    result.validRecords.forEach(record => {
      expect(record.schemaVersion).toBe(SCHEMA_VERSION);
    });
  });

  it('缺少status的记录应获得默认状态', () => {
    const dogRecord = result.validRecords.find(r => r.pet === '旧版狗1');
    expect(dogRecord).toBeDefined();
    expect(dogRecord.status).toBeTruthy();
  });

  it('保留原始宠物姓名和联系方式', () => {
    const catRecord = result.validRecords.find(r => r.pet === '旧版猫1');
    expect(catRecord).toBeDefined();
    expect(catRecord.ownerPhone).toBe('13900001111');
    expect(catRecord.vaccine).toBe('猫三联');
  });

  it('应有旧版格式迁移提示', () => {
    expect(result.warnings.some(w => w.includes('迁移'))).toBe(true);
  });
});

describe('test-backup-invalid-format.txt - 非JSON文件', () => {
  it('JSON.parse应抛出语法错误', () => {
    expect(() => JSON.parse(invalidFormatText)).toThrow(SyntaxError);
  });
});

describe('备份边界场景', () => {
  it('null输入应返回无效结果', () => {
    const result = validateRestoreData(null);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('文件内容为空');
  });

  it('undefined输入应返回无效结果', () => {
    const result = validateRestoreData(undefined);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('文件内容为空');
  });

  it('字符串输入应返回无效结果', () => {
    const result = validateRestoreData('not an object');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('文件格式错误');
  });

  it('空数组输入应返回有效但警告无记录', () => {
    const result = validateRestoreData([]);
    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.includes('没有记录'))).toBe(true);
  });

  it('records为非数组的对象应返回无效', () => {
    const result = validateRestoreData({ records: 'not-array' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('records字段应为数组');
  });

  it('无records字段且非数组的对象应返回无效', () => {
    const result = validateRestoreData({ foo: 'bar' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('文件结构错误');
  });

  it('空records数组应有警告', () => {
    const result = validateRestoreData({ records: [] });
    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.includes('没有记录'))).toBe(true);
  });
});

describe('validateImportStoreData - 门店数据导入校验', () => {
  it('正常备份应能通过门店导入验证', () => {
    const result = validateImportStoreData(normalBackup);
    expect(result.valid).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data.records)).toBe(true);
  });

  it('旧版无timeline纯数组格式在门店导入中应返回无效（需通过validateRestoreData处理）', () => {
    const result = validateImportStoreData(oldVersionNoTimelineBackup);
    expect(result.valid).toBe(false);
  });

  it('非对象输入应返回无效', () => {
    const result = validateImportStoreData(null);
    expect(result.valid).toBe(false);
  });

  it('带data字段的门店格式应正确提取', () => {
    const storeFormat = {
      data: {
        records: normalBackup.records,
        templates: [],
        rules: []
      }
    };
    const result = validateImportStoreData(storeFormat);
    expect(result.valid).toBe(true);
    expect(result.data.records.length).toBe(3);
  });

  it('records字段应通过migrateRecord自动迁移', () => {
    const rawRecord = {
      pet: '迁移测试猫',
      ownerPhone: '13800009999',
      vaccine: '猫三联',
      nextDate: '2027-01-01'
    };
    const result = validateImportStoreData({ records: [rawRecord] });
    expect(result.valid).toBe(true);
    const migrated = result.data.records[0];
    expect(migrated.id).toBeTruthy();
    expect(migrated.status).toBeTruthy();
    expect(Array.isArray(migrated.timeline)).toBe(true);
    expect(Array.isArray(migrated.notes)).toBe(true);
    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
  });
});

describe('备份记录中的日期迁移', () => {
  it('nextDate中的非标准日期格式应在迁移时被标准化', () => {
    const backup = {
      version: 1,
      appId: 'hxwl-61304',
      records: [
        {
          id: 'date-test-1',
          pet: '日期猫',
          species: '猫',
          ownerPhone: '13800009999',
          vaccine: '猫三联',
          lastDate: '2026-05-01',
          nextDate: '2027-1-5',
          status: '待联系',
          timeline: [{ status: '待联系', at: '2026-06-01', by: '系统' }],
          notes: [],
          schemaVersion: SCHEMA_VERSION
        }
      ]
    };
    const result = validateRestoreData(backup);
    expect(result.valid).toBe(true);
    expect(result.validRecords[0].nextDate).toBe('2027-01-05');
  });

  it('ownerPhone中的空格和横线应在迁移时被清除', () => {
    const backup = {
      version: 1,
      appId: 'hxwl-61304',
      records: [
        {
          id: 'phone-test-1',
          pet: '电话猫',
          species: '猫',
          ownerPhone: '138-0000-9999',
          vaccine: '猫三联',
          lastDate: '2026-05-01',
          nextDate: '2027-01-05',
          status: '待联系',
          timeline: [{ status: '待联系', at: '2026-06-01', by: '系统' }],
          notes: [],
          schemaVersion: SCHEMA_VERSION
        }
      ]
    };
    const result = validateRestoreData(backup);
    expect(result.valid).toBe(true);
    expect(result.validRecords[0].ownerPhone).toBe('13800009999');
  });

  it('无效的lastDate应在迁移时被清空', () => {
    const backup = {
      version: 1,
      appId: 'hxwl-61304',
      records: [
        {
          id: 'bad-date-test',
          pet: '日期犬',
          species: '犬',
          ownerPhone: '13900008888',
          vaccine: '狂犬',
          lastDate: 'invalid-date',
          nextDate: '2027-01-05',
          status: '待联系',
          timeline: [{ status: '待联系', at: '2026-06-01', by: '系统' }],
          notes: [],
          schemaVersion: SCHEMA_VERSION
        }
      ]
    };
    const result = validateRestoreData(backup);
    expect(result.validRecords[0].lastDate).toBe('');
  });
});
