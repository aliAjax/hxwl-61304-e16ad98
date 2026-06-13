import { useMemo, useState } from 'react';
import { Syringe, Plus, Search, Trash2, RotateCcw, CheckCircle2, AlertTriangle, ClipboardList, CalendarDays, PhoneCall, Clock, AlertCircle, CalendarCheck, MessageSquareText, X, User, Calendar } from 'lucide-react';
import './App.css';

const appConfig = {
  "id": "hxwl-61304",
  "port": 61304,
  "title": "宠物医院疫苗提醒",
  "subtitle": "单店宠物疫苗复种、联系状态和本周提醒清单",
  "domain": "宠物医院",
  "icon": "Syringe",
  "storage": "hxwl-61304-pet-vaccine",
  "accent": "#db2777",
  "statuses": [
    "待联系",
    "已联系",
    "已接种"
  ],
  "primaryStatus": "待联系",
  "fields": [
    {
      "key": "pet",
      "label": "宠物姓名",
      "type": "input",
      "placeholder": "奶盖",
      "options": []
    },
    {
      "key": "species",
      "label": "物种",
      "type": "select",
      "placeholder": "猫",
      "options": [
        "猫",
        "犬",
        "兔",
        "其他"
      ]
    },
    {
      "key": "ownerPhone",
      "label": "主人联系方式",
      "type": "input",
      "placeholder": "13800008888",
      "options": []
    },
    {
      "key": "vaccine",
      "label": "疫苗类型",
      "type": "select",
      "placeholder": "猫三联",
      "options": [
        "猫三联",
        "狂犬",
        "犬六联",
        "体内驱虫"
      ]
    },
    {
      "key": "lastDate",
      "label": "上次接种日期",
      "type": "date",
      "placeholder": "",
      "options": []
    },
    {
      "key": "nextDate",
      "label": "下次提醒日期",
      "type": "date",
      "placeholder": "",
      "options": []
    }
  ],
  "seed": [
    {
      "pet": "奶盖",
      "species": "猫",
      "ownerPhone": "13800008888",
      "vaccine": "猫三联",
      "lastDate": "2026-05-15",
      "nextDate": "2026-06-14",
      "status": "待联系"
    },
    {
      "pet": "旺财",
      "species": "犬",
      "ownerPhone": "13900006666",
      "vaccine": "狂犬",
      "lastDate": "2025-06-10",
      "nextDate": "2026-06-10",
      "status": "已联系"
    },
    {
      "pet": "团子",
      "species": "兔",
      "ownerPhone": "13700001111",
      "vaccine": "体内驱虫",
      "lastDate": "2026-05-13",
      "nextDate": "2026-06-13",
      "status": "待联系"
    },
    {
      "pet": "小白",
      "species": "猫",
      "ownerPhone": "13600002222",
      "vaccine": "狂犬",
      "lastDate": "2026-05-20",
      "nextDate": "2026-06-18",
      "status": "待联系"
    },
    {
      "pet": "豆豆",
      "species": "犬",
      "ownerPhone": "13500003333",
      "vaccine": "犬六联",
      "lastDate": "2026-06-01",
      "nextDate": "2026-06-28",
      "status": "已接种"
    }
  ],
  "metrics": [
    [
      "宠物数",
      "records.length"
    ],
    [
      "待联系",
      "records.filter((item) => item.status === '待联系').length"
    ],
    [
      "本周提醒",
      "records.filter((item) => inNextDays(item.nextDate, 7)).length"
    ]
  ],
  "filters": [
    {
      "key": "query",
      "label": "宠物/主人",
      "type": "search",
      "match": "`${item.pet}${item.ownerPhone}`.includes(filters.query)"
    },
    {
      "key": "status",
      "label": "提醒状态",
      "type": "status"
    }
  ],
  "cardTitle": "item.pet",
  "cardMeta": "`${item.species} · ${item.vaccine} · ${item.ownerPhone}`",
  "cardDetail": "`下次提醒：${item.nextDate}`",
  "dateKey": "nextDate",
  "note": "先做单店本地版，不需要短信接口。",
  "defaultValues": {
    "pet": "奶盖",
    "species": "猫",
    "ownerPhone": "13800008888",
    "vaccine": "猫三联",
    "lastDate": "",
    "nextDate": "",
    "status": "待联系"
  }
};

const today = new Date().toISOString().slice(0, 10);

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function withIds(items) {
  return items.map((item) => ({ id: uid(), ...item, timeline: item.timeline || [{ status: item.status, at: today, by: '系统' }], notes: item.notes || [] }));
}

function loadRecords() {
  const raw = localStorage.getItem(appConfig.storage);
  if (raw) {
    try {
      return JSON.parse(raw);
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
  const date = new Date(dateText);
  const now = new Date(today);
  const diff = (date.getTime() - now.getTime()) / 86400000;
  return diff >= 0 && diff <= days;
}

function isOverdue(dateText) {
  if (!dateText) return false;
  const date = new Date(dateText);
  const now = new Date(today);
  return date.getTime() < now.getTime();
}

function isToday(dateText) {
  if (!dateText) return false;
  return dateText === today;
}

function isWithin7DaysExcludingToday(dateText) {
  if (!dateText) return false;
  const date = new Date(dateText);
  const now = new Date(today);
  const diff = (date.getTime() - now.getTime()) / 86400000;
  return diff > 0 && diff <= 7;
}

function daysDiff(dateText) {
  if (!dateText) return 0;
  const date = new Date(dateText);
  const now = new Date(today);
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

function App() {
  const [records, setRecords] = useState(loadRecords);
  const [form, setForm] = useState(appConfig.defaultValues);
  const [filters, setFilters] = useState({ query: '', status: '全部' });
  const [selected, setSelected] = useState(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteOperator, setNewNoteOperator] = useState('');

  function persist(next) {
    setRecords(next);
    localStorage.setItem(appConfig.storage, JSON.stringify(next));
  }

  function addRecord(event) {
    event.preventDefault();
    const nextRecord = {
      id: uid(),
      ...form,
      status: form.status || appConfig.primaryStatus,
      createdAt: new Date().toISOString(),
      timeline: [{ status: form.status || appConfig.primaryStatus, at: today, by: '录入' }],
      notes: []
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

    persist([nextRecord, ...records]);
    setForm(appConfig.defaultValues);
    setSelected(nextRecord);
  }

  function addNote(recordId) {
    if (!newNoteContent.trim()) return;
    const note = {
      id: uid(),
      content: newNoteContent.trim(),
      createdAt: new Date().toISOString(),
      createdBy: newNoteOperator.trim() || '未署名'
    };
    const next = records.map((item) => item.id === recordId ? {
      ...item,
      notes: [...(item.notes || []), note]
    } : item);
    persist(next);
    const updated = next.find((item) => item.id === recordId);
    if (selected?.id === recordId) setSelected(updated);
    setNewNoteContent('');
    setNewNoteOperator('');
  }

  function removeNote(recordId, noteId) {
    const next = records.map((item) => item.id === recordId ? {
      ...item,
      notes: (item.notes || []).filter((n) => n.id !== noteId)
    } : item);
    persist(next);
    const updated = next.find((item) => item.id === recordId);
    if (selected?.id === recordId) setSelected(updated);
  }

  function updateStatus(id, status) {
    const next = records.map((item) => item.id === id ? {
      ...item,
      status,
      timeline: [...(item.timeline || []), { status, at: today, by: '操作员' }]
    } : item);
    persist(next);
    if (selected?.id === id) setSelected(next.find((item) => item.id === id));
  }

  function removeRecord(id) {
    const next = records.filter((item) => item.id !== id);
    persist(next);
    if (selected?.id === id) setSelected(null);
  }

  function duplicateRecord(item) {
    const copied = { ...item, id: uid(), status: appConfig.primaryStatus, timeline: [{ status: appConfig.primaryStatus, at: today, by: '复制' }], notes: [] };
    persist([copied, ...records]);
    setSelected(copied);
  }

  function addTemperature(item) {
    const value = Number(prompt('录入新的温度读数'));
    if (!Number.isFinite(value)) return;
    const next = records.map((record) => record.id === item.id ? {
      ...record,
      temps: [...(record.temps || []), value],
      temperature: String(value),
      status: value > 2 ? '异常' : record.status
    } : record);
    persist(next);
    setSelected(next.find((record) => record.id === item.id));
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
        const aDate = a[appConfig.dateKey] || a.sentAt || a.createdAt || '';
        const bDate = b[appConfig.dateKey] || b.sentAt || b.createdAt || '';
        return String(aDate).localeCompare(String(bDate));
      });
  }, [records, filters]);

  const metrics = [
    { label: "宠物数", value: records.length },
    { label: "待联系", value: records.filter((item) => item.status === '待联系').length },
    { label: "本周提醒", value: records.filter((item) => inNextDays(item.nextDate, 7)).length },
  ];

  const contactListGroups = useMemo(() => {
    return {
      overdue: records
        .filter((item) => isOverdue(item.nextDate))
        .sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate)),
      today: records
        .filter((item) => isToday(item.nextDate))
        .sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate)),
      upcoming: records
        .filter((item) => isWithin7DaysExcludingToday(item.nextDate))
        .sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate)),
    };
  }, [records]);

  const groupedByDate = useMemo(() => {
    return filteredRecords.reduce((acc, item) => {
      const key = item[appConfig.dateKey] || item.date || item.enrollDate || '未排期';
      (acc[key] ||= []).push(item);
      return acc;
    }, {});
  }, [filteredRecords]);

  const directory = useMemo(() => {
    return records.reduce((acc, item) => {
      const key = item.issue || '未分类';
      (acc[key] ||= []).push(item);
      return acc;
    }, {});
  }, [records]);

  return (
    <main className="shell" style={{ '--accent': appConfig.accent }}>
      <section className="hero">
        <div>
          <div className="eyebrow"><Syringe size={18} />{appConfig.domain}</div>
          <h1>{appConfig.title}</h1>
          <p>{appConfig.subtitle}</p>
        </div>
        <div className="port-card">
          <span>Local Port</span>
          <strong>{appConfig.port}</strong>
        </div>
      </section>

      <section className="metrics">
        {metrics.map((metric) => (
          <article className="metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="panel contact-list-panel">
        <div className="panel-title">
          <PhoneCall size={18} />
          <h2>今日联系清单</h2>
        </div>
        <div className="contact-groups">
          <div className="contact-group overdue-group">
            <div className="contact-group-header">
              <div className="contact-group-title">
                <AlertCircle size={16} className="contact-group-icon overdue-icon" />
                <h3>已逾期</h3>
                <span className="contact-count">{contactListGroups.overdue.length}</span>
              </div>
            </div>
            <div className="contact-records">
              {contactListGroups.overdue.length === 0 ? (
                <p className="empty-group">暂无逾期记录</p>
              ) : (
                contactListGroups.overdue.map((item) => (
                  <article className={'contact-record ' + (item.status === '已联系' ? 'contact-record-done' : '')} key={item.id}>
                    <div className="contact-record-main">
                      <div className="contact-record-info">
                        <h4>{item.pet}</h4>
                        <p className="contact-meta">{item.ownerPhone}</p>
                        <p className="contact-vaccine">{item.vaccine}</p>
                      </div>
                      <div className="contact-record-side">
                        <span className={'status ' + statusClass(item.status)}>{item.status}</span>
                        <span className="days-badge overdue-badge">逾期{Math.abs(daysDiff(item.nextDate))}天</span>
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
                <h3>未来7天内</h3>
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

      <section className="workspace">
        <form className="panel form-panel" onSubmit={addRecord}>
          <div className="panel-title">
            <ClipboardList size={18} />
            <h2>新增记录</h2>
          </div>
          <div className="form-grid">
            {appConfig.fields.map((field) => (
              <label key={field.key} className={field.type === 'textarea' ? 'wide' : ''}>
                <span>{field.label}</span>
                {field.type === 'textarea' ? (
                  <textarea value={form[field.key] || ''} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} placeholder={field.placeholder} />
                ) : field.type === 'select' ? (
                  <select value={form[field.key] || ''} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}>
                    {field.options.map((option) => <option key={option}>{option}</option>)}
                  </select>
                ) : (
                  <input type={field.type} value={form[field.key] || ''} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} placeholder={field.placeholder} />
                )}
              </label>
            ))}
            <label>
              <span>当前状态</span>
              <select value={form.status || appConfig.primaryStatus} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {appConfig.statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
          </div>
          <button className="primary" type="submit"><Plus size={18} />新增</button>
          <p className="hint">{appConfig.note}</p>
        </form>

        <section className="panel list-panel">
          <div className="toolbar">
            <div className="search">
              <Search size={16} />
              <input value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder={appConfig.filters[0]?.label || '搜索'} />
            </div>
            <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
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
    </main>
  );
}

export default App;
