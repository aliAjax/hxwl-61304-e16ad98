import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  parseCSV,
  detectFieldMapping,
  isValidDate,
  normalizeDate,
  isValidPhone,
  normalizePhone,
  validateRow,
  findDuplicates,
  processCSVPipeline
} from './testHelpers.js';

const FIXTURE_DIR = join(process.cwd());

let csvText;

beforeAll(() => {
  csvText = readFileSync(join(FIXTURE_DIR, 'test-import.csv'), 'utf-8');
});

describe('CSV解析', () => {
  it('应正确解析CSV表头', () => {
    const { headers } = parseCSV(csvText);
    expect(headers).toEqual([
      '宠物姓名', '物种', '主人联系方式', '疫苗类型', '上次接种日期', '下次提醒日期'
    ]);
  });

  it('应解析出8行数据（不含表头）', () => {
    const { rows } = parseCSV(csvText);
    expect(rows.length).toBe(8);
  });
});

describe('字段映射检测', () => {
  it('应正确映射test-import.csv的所有字段', () => {
    const { headers } = parseCSV(csvText);
    const fieldMapping = detectFieldMapping(headers);
    expect(fieldMapping.pet).toBe(0);
    expect(fieldMapping.species).toBe(1);
    expect(fieldMapping.ownerPhone).toBe(2);
    expect(fieldMapping.vaccine).toBe(3);
    expect(fieldMapping.lastDate).toBe(4);
    expect(fieldMapping.nextDate).toBe(5);
  });
});

describe('日期格式验证', () => {
  it('应识别YYYY-MM-DD格式', () => {
    expect(isValidDate('2026-05-01')).toBe(true);
  });

  it('应识别YYYY/MM/DD格式', () => {
    expect(isValidDate('2026/04/15')).toBe(true);
  });

  it('应识别YYYY年M月D日格式', () => {
    expect(isValidDate('2026年5月10日')).toBe(true);
  });

  it('应拒绝无效日期字符串', () => {
    expect(isValidDate('invalid-date')).toBe(false);
  });

  it('应拒绝空字符串', () => {
    expect(isValidDate('')).toBe(false);
  });

  it('应拒绝不存在日期如2月30日', () => {
    expect(isValidDate('2026-02-30')).toBe(false);
  });
});

describe('日期标准化', () => {
  it('应将YYYY/MM/DD标准化为YYYY-MM-DD', () => {
    expect(normalizeDate('2026/04/15')).toBe('2026-04-15');
  });

  it('应将YYYY年M月D日标准化为YYYY-MM-DD', () => {
    expect(normalizeDate('2026年5月10日')).toBe('2026-05-10');
  });

  it('应保持YYYY-MM-DD格式不变', () => {
    expect(normalizeDate('2026-05-01')).toBe('2026-05-01');
  });

  it('应补零对齐月份和日期', () => {
    expect(normalizeDate('2026-1-5')).toBe('2026-01-05');
  });
});

describe('联系方式验证', () => {
  it('应识别有效手机号', () => {
    expect(isValidPhone('13811112222')).toBe(true);
  });

  it('应识别有效座机号', () => {
    expect(isValidPhone('12345678')).toBe(true);
  });

  it('应拒绝无效短号', () => {
    expect(isValidPhone('12345')).toBe(false);
  });

  it('应拒绝空字符串', () => {
    expect(isValidPhone('')).toBe(false);
  });
});

describe('CSV行级验证 - test-import.csv', () => {
  let result;

  beforeAll(() => {
    result = processCSVPipeline(csvText, []);
  });

  it('第2行（花花）：标准YYYY-MM-DD格式应通过验证', () => {
    const row = result.validRows.find(r => r.data?.pet === '花花');
    expect(row).toBeDefined();
    expect(row.valid).toBe(true);
    expect(row.data.lastDate).toBe('2026-05-01');
    expect(row.data.nextDate).toBe('2026-06-20');
  });

  it('第3行（小黑）：YYYY/MM/DD格式应标准化为YYYY-MM-DD', () => {
    const row = result.validRows.find(r => r.data?.pet === '小黑');
    expect(row).toBeDefined();
    expect(row.valid).toBe(true);
    expect(row.data.lastDate).toBe('2026-04-15');
    expect(row.data.nextDate).toBe('2026-07-15');
  });

  it('第4行（毛毛）：中文日期格式应标准化为YYYY-MM-DD', () => {
    const row = result.validRows.find(r => r.data?.pet === '毛毛');
    expect(row).toBeDefined();
    expect(row.valid).toBe(true);
    expect(row.data.lastDate).toBe('2026-05-10');
    expect(row.data.nextDate).toBe('2026-06-25');
  });

  it('第5行（贝贝）：与现有记录电话重复应检测到', () => {
    const existingRecords = [{ ownerPhone: '13800008888', pet: '奶盖' }];
    const dupResult = processCSVPipeline(csvText, existingRecords);
    expect(dupResult.existingDuplicates).toContain('13800008888');
  });

  it('第6行（坏数据1）：无效电话和未知疫苗应报错/警告', () => {
    const row = result.errorRows.find(r => r.rowIndex === 6);
    expect(row).toBeDefined();
    expect(row.errors.some(e => e.includes('联系方式格式不正确'))).toBe(true);
    expect(row.warnings.some(w => w.includes('未知疫苗') || w.includes('不在预设选项中'))).toBe(true);
  });

  it('第7行（坏数据2）：缺少下次提醒日期应报错', () => {
    const row = result.errorRows.find(r => r.rowIndex === 7);
    expect(row).toBeDefined();
    expect(row.errors).toContain('下次提醒日期不能为空');
  });

  it('第8行（坏数据3）：缺少疫苗类型应报错', () => {
    const row = result.errorRows.find(r => r.rowIndex === 8);
    expect(row).toBeDefined();
    expect(row.errors).toContain('疫苗类型不能为空');
  });

  it('第9行（坏数据4）：无效日期格式应报错', () => {
    const row = result.errorRows.find(r => r.rowIndex === 9);
    expect(row).toBeDefined();
    expect(row.errors.some(e => e.includes('下次提醒日期格式不正确'))).toBe(true);
  });

  it('应有4条有效行（花花、小黑、毛毛、贝贝）', () => {
    expect(result.validRows.length).toBe(4);
  });

  it('应有3条错误行（坏数据1/3/4）', () => {
    expect(result.errorRows.length).toBe(4);
  });
});

describe('CSV重复联系方式检测', () => {
  it('文件内部重复电话应被检测', () => {
    const csv = `宠物姓名,物种,主人联系方式,疫苗类型,上次接种日期,下次提醒日期
猫A,猫,13800001111,猫三联,2026-01-01,2027-01-01
猫B,猫,13800001111,狂犬,2026-02-01,2027-02-01`;
    const result = processCSVPipeline(csv, []);
    expect(result.fileDuplicates).toContain('13800001111');
  });

  it('与已有记录重复应被检测', () => {
    const csv = `宠物姓名,物种,主人联系方式,疫苗类型,上次接种日期,下次提醒日期
猫A,猫,13900009999,猫三联,2026-01-01,2027-01-01`;
    const existing = [{ ownerPhone: '13900009999', pet: '已有猫' }];
    const result = processCSVPipeline(csv, existing);
    expect(result.existingDuplicates).toContain('13900009999');
  });
});

describe('CSV缺少必填字段列场景', () => {
  it('缺少疫苗类型列时所有行应被标记为skipped', () => {
    const csv = `宠物姓名,物种,主人联系方式,上次接种日期,下次提醒日期
猫A,猫,13800001111,2026-01-01,2027-01-01`;
    const result = processCSVPipeline(csv, []);
    expect(result.missingRequiredFields).toContain('疫苗类型');
    expect(result.validRows.length).toBe(0);
  });
});
