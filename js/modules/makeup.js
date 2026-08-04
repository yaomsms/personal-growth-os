/**
 * makeup.js - 补学计划板块模块
 * 功能分区：
 *   1. 统一规则说明（任务最多积压2天，超过无需强行补学，减少内耗）
 *   2. 未完成日期列表
 *   3. 待补齐任务（英语全套、剪辑课程+实操、绘画临摹练习）
 *   4. 补学分配（次日补学、第三日补学）
 *   5. 补学进度追踪
 *   6. 模块学习日配置
 *   7. 历史补学记录
 */

const MakeupModule = (function() {
    'use strict';

    // ============================================================
    // 1. 数据结构与默认值
    // ============================================================
    const STORAGE_KEY = 'makeup';

    // 模块配置
    const MODULES = [
        { id: 'english', name: '英语学习', icon: '📚', color: '#7ec8a7', priority: 1 },
        { id: 'pr', name: 'PR剪辑', icon: '🎬', color: '#a8c9e8', priority: 2 },
        { id: 'drawing', name: '绘画练习', icon: '🎨', color: '#c9b8e0', priority: 3 },
    ];

    // 模块学习日配置（默认值）
    const DEFAULT_MODULE_SCHEDULE = {
        english: { days: [1, 2, 3, 4, 5, 6, 0], label: '每日' },     // 每天
        pr: { days: [1, 3, 5], label: '周一/三/五' },                  // 周一、三、五
        drawing: { days: [2, 4, 6, 0], label: '周二/四+周末' },       // 周二、四 + 周末
    };

    // 待补学任务模板
    const TASK_TEMPLATES = {
        english: [
            { id: 'eng_words', name: '单词背诵', defaultMinutes: 20 },
            { id: 'eng_grammar', name: '语法学习', defaultMinutes: 20 },
            { id: 'eng_listening', name: '听力练习', defaultMinutes: 15 },
            { id: 'eng_reading', name: '阅读训练', defaultMinutes: 15 },
            { id: 'eng_full', name: '英语全套', defaultMinutes: 60 },
        ],
        pr: [
            { id: 'pr_course', name: '剪辑课程', defaultMinutes: 60 },
            { id: 'pr_practice', name: '实操练习', defaultMinutes: 60 },
            { id: 'pr_full', name: '课程+实操', defaultMinutes: 90 },
        ],
        drawing: [
            { id: 'draw_trace', name: '临摹练习', defaultMinutes: 60 },
            { id: 'draw_sketch', name: '速写练习', defaultMinutes: 30 },
            { id: 'draw_full', name: '完整绘画', defaultMinutes: 120 },
        ],
    };

    // ============================================================
    // 2. 状态管理
    // ============================================================
    let data = null;
    let containerEl = null;

    // ============================================================
    // 3. 初始化
    // ============================================================
    function init() {
        _loadData();
    }

    function _loadData() {
        const stored = AppStorage.getModule(STORAGE_KEY);
        if (stored && stored.missedDates && stored.settings && typeof stored.settings === 'object') {
            data = stored;
            // 确保 makeupHistory 存在
            if (!data.makeupHistory) data.makeupHistory = [];
            // 确保 moduleSchedule 存在
            if (!data.moduleSchedule) {
                data.moduleSchedule = JSON.parse(JSON.stringify(DEFAULT_MODULE_SCHEDULE));
            }
        } else {
            data = {
                missedDates: [],       // 未完成的学习日记录
                // { id, date, moduleId, taskId, taskName, reason, completed: false, assignedDay: null }
                // assignedDay: 1 = 次日补学, 2 = 第三日补学
                makeupHistory: [],     // 历史补学记录
                // { id, date, moduleId, taskName, makeupDate, duration, completed: true }
                moduleSchedule: JSON.parse(JSON.stringify(DEFAULT_MODULE_SCHEDULE)),
                settings: {
                    maxBacklogDays: 2,      // 最多积压2天
                    priorityOrder: ['english', 'pr', 'drawing'],
                },
            };
            AppStorage.setModule(STORAGE_KEY, data);
        }
        _cleanExpiredBacklog();
    }

    function _saveData() {
        AppStorage.setModule(STORAGE_KEY, data);
    }

    // ============================================================
    // 4. 工具函数
    // ============================================================

    function _genId(prefix) {
        return AppData.generateId(prefix);
    }

    function _esc(text) {
        return App.escapeHtml(text || '');
    }

    function _today() {
        return App.getToday();
    }

    function _formatDate(dateStr) {
        const d = new Date(dateStr);
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return `${month}月${day}日 ${weekDays[d.getDay()]}`;
    }

    function _addDays(dateStr, days) {
        const d = new Date(dateStr);
        d.setDate(d.getDate() + days);
        return App.formatDate(d);
    }

    function _getModuleById(id) {
        return MODULES.find(m => m.id === id) || MODULES[0];
    }

    function _isStudyDay(moduleId, dateStr) {
        const schedule = data.moduleSchedule[moduleId];
        if (!schedule) return false;
        const dayOfWeek = new Date(dateStr).getDay();
        return schedule.days.includes(dayOfWeek);
    }

    /**
     * 清理超过积压期限的任务（超过2天无需强行补学）
     */
    function _cleanExpiredBacklog() {
        const today = _today();
        const maxDays = data.settings?.maxBacklogDays || 2;
        let changed = false;

        data.missedDates = data.missedDates.filter(item => {
            if (item.completed) return false; // 已完成的从待办中移除

            const itemDate = new Date(item.date);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate - itemDate) / (1000 * 60 * 60 * 24));

            // 超过 maxBacklogDays + 1 天的，自动标记为过期（移入历史）
            if (diffDays > maxDays + 1) {
                // 移到历史记录，标记为已过期
                data.makeupHistory.push({
                    ...item,
                    completed: false,
                    expired: true,
                    makeupDate: today,
                });
                changed = true;
                return false;
            }
            return true;
        });

        if (changed) {
            _saveData();
        }
    }

    // ============================================================
    // 5. 渲染入口
    // ============================================================

    function render(container) {
        containerEl = container;
        if (!data) _loadData();

        container.innerHTML = `
            <div class="makeup-module">
                <!-- 规则说明 -->
                <div class="card rules-card">
                    <div class="rules-header">
                        <span class="rules-icon">📋</span>
                        <span class="rules-title">补学规则</span>
                    </div>
                    <div class="rules-content">
                        <p>🎯 <strong>任务最多积压${data.settings.maxBacklogDays}天</strong>，超过${data.settings.maxBacklogDays + 1}天自动过期，无需强行补学，减少内耗</p>
                        <p>⚡ <strong>优先级：</strong>${data.settings.priorityOrder.map(id => _getModuleById(id).name).join(' ＞ ')}</p>
                        <p>📅 <strong>学习日：</strong>英语（每日）、剪辑（周一/三/五）、绘画（周二/四+周末）</p>
                    </div>
                </div>

                <!-- 统计概览 -->
                <div class="section-title">
                    <h2><span class="title-icon">📊</span>补学概况</h2>
                </div>
                <div class="makeup-stats" id="makeupStats"></div>

                <!-- 未完成任务列表 -->
                <div class="section-title">
                    <h2><span class="title-icon">📝</span>待补学任务</h2>
                    <span class="section-action" data-action="add-missed">+ 添加</span>
                </div>
                <div class="missed-tasks-section" id="missedTasksSection"></div>

                <!-- 补学分配 -->
                <div class="section-title">
                    <h2><span class="title-icon">📅</span>补学分配</h2>
                </div>
                <div class="makeup-assignment" id="makeupAssignment"></div>

                <!-- 模块学习日配置 -->
                <div class="section-title">
                    <h2><span class="title-icon">⚙️</span>学习日配置</h2>
                </div>
                <div class="schedule-config" id="scheduleConfig"></div>

                <!-- 历史补学记录 -->
                <div class="section-title">
                    <h2><span class="title-icon">📜</span>历史记录</h2>
                </div>
                <div class="makeup-history" id="makeupHistory"></div>
            </div>
        `;

        _renderStats();
        _renderMissedTasks();
        _renderAssignment();
        _renderScheduleConfig();
        _renderHistory();
        _bindEvents();
    }

    // ============================================================
    // 6. 统计概览
    // ============================================================

    function _renderStats() {
        const statsEl = containerEl.querySelector('#makeupStats');
        if (!statsEl) return;

        const pending = data.missedDates.filter(m => !m.completed).length;
        const tomorrowAssigned = data.missedDates.filter(m => m.assignedDay === 1 && !m.completed).length;
        const dayAfterAssigned = data.missedDates.filter(m => m.assignedDay === 2 && !m.completed).length;

        const history = data.makeupHistory || [];
        const completed = history.filter(h => h.completed && !h.expired).length;
        const expired = history.filter(h => h.expired).length;

        statsEl.innerHTML = `
            <div class="stat-card" style="background: linear-gradient(135deg, #f4b8c430, #e8a0a030);">
                <div class="stat-icon">⏰</div>
                <div class="stat-value">${pending}</div>
                <div class="stat-label">待补学</div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #f5c89a30, #f0c98730);">
                <div class="stat-icon">📆</div>
                <div class="stat-value">${tomorrowAssigned}</div>
                <div class="stat-label">明日补学</div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #c9b8e030, #a29bfe30);">
                <div class="stat-icon">📅</div>
                <div class="stat-value">${dayAfterAssigned}</div>
                <div class="stat-label">后日补学</div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #7ec8a730, #4ecdc430);">
                <div class="stat-icon">✅</div>
                <div class="stat-value">${completed}</div>
                <div class="stat-label">已完成</div>
            </div>
        `;
    }

    // ============================================================
    // 7. 未完成任务列表
    // ============================================================

    function _renderMissedTasks() {
        const section = containerEl.querySelector('#missedTasksSection');
        if (!section) return;

        const pending = data.missedDates
            .filter(m => !m.completed)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (pending.length === 0) {
            section.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🎉</div>
                    <div class="empty-state-text">太棒了！没有待补学任务</div>
                    <div class="empty-state-desc">保持节奏，继续加油</div>
                </div>
            `;
            return;
        }

        // 按模块分组
        const grouped = {};
        for (const item of pending) {
            if (!grouped[item.moduleId]) grouped[item.moduleId] = [];
            grouped[item.moduleId].push(item);
        }

        section.innerHTML = MODULES.map(mod => {
            const items = grouped[mod.id] || [];
            if (items.length === 0) return '';
            return `
                <div class="missed-group">
                    <div class="missed-group-header" style="color: ${mod.color};">
                        ${mod.icon} ${mod.name}（${items.length}个）
                    </div>
                    <div class="missed-list">
                        ${items.map(item => {
                            const today = _today();
                            const diffDays = Math.floor((new Date(today) - new Date(item.date)) / (1000 * 60 * 60 * 24));
                            const daysLeft = (data.settings.maxBacklogDays + 1) - diffDays;
                            const isUrgent = daysLeft <= 1;

                            let assignedLabel = '';
                            if (item.assignedDay === 1) assignedLabel = '明日补学';
                            else if (item.assignedDay === 2) assignedLabel = '后日补学';

                            return `
                                <div class="card missed-task-card" data-id="${item.id}">
                                    <div class="missed-task-info">
                                        <div class="missed-task-title">${_esc(item.taskName)}</div>
                                        <div class="missed-task-meta">
                                            <span>📅 ${_formatDate(item.date)}</span>
                                            <span class="${isUrgent ? 'urgent' : ''}">⏳ 剩余${daysLeft}天</span>
                                            ${assignedLabel ? `<span class="assigned-badge" style="background: ${mod.color}20; color: ${mod.color};">${assignedLabel}</span>` : ''}
                                        </div>
                                        ${item.reason ? `<div class="missed-task-reason">💭 ${_esc(item.reason)}</div>` : ''}
                                    </div>
                                    <div class="missed-task-actions">
                                        <button class="btn-icon btn-sm" data-action="toggle-assign" data-id="${item.id}" data-day="1" title="分配到次日">1️⃣</button>
                                        <button class="btn-icon btn-sm" data-action="toggle-assign" data-id="${item.id}" data-day="2" title="分配到第三日">2️⃣</button>
                                        <button class="btn-icon btn-sm" data-action="complete-missed" data-id="${item.id}" title="标记完成">✅</button>
                                        <button class="btn-icon btn-sm" data-action="edit-missed" data-id="${item.id}" title="编辑">✏️</button>
                                        <button class="btn-icon btn-sm" data-action="delete-missed" data-id="${item.id}" title="删除">🗑️</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    // ============================================================
    // 8. 补学分配
    // ============================================================

    function _renderAssignment() {
        const section = containerEl.querySelector('#makeupAssignment');
        if (!section) return;

        const today = _today();
        const tomorrow = _addDays(today, 1);
        const dayAfter = _addDays(today, 2);

        const tomorrowTasks = data.missedDates.filter(m => m.assignedDay === 1 && !m.completed);
        const dayAfterTasks = data.missedDates.filter(m => m.assignedDay === 2 && !m.completed);

        section.innerHTML = `
            <div class="assignment-grid">
                <div class="card assignment-card">
                    <div class="assignment-header" style="background: linear-gradient(135deg, #f5c89a30, #f0c98730);">
                        <div class="assignment-day">明日补学</div>
                        <div class="assignment-date">${_formatDate(tomorrow)}</div>
                        <div class="assignment-count">${tomorrowTasks.length}项</div>
                    </div>
                    <div class="assignment-body">
                        ${tomorrowTasks.length === 0 ? `
                            <div class="assignment-empty">暂无安排</div>
                        ` : tomorrowTasks.map(t => {
                            const mod = _getModuleById(t.moduleId);
                            return `
                                <div class="assignment-item" data-id="${t.id}">
                                    <span class="assignment-mod-icon" style="background: ${mod.color}20; color: ${mod.color};">${mod.icon}</span>
                                    <span class="assignment-name">${_esc(t.taskName)}</span>
                                    <button class="btn-icon btn-xs" data-action="complete-missed" data-id="${t.id}" title="完成">✅</button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="card assignment-card">
                    <div class="assignment-header" style="background: linear-gradient(135deg, #c9b8e030, #a29bfe30);">
                        <div class="assignment-day">第三日补学</div>
                        <div class="assignment-date">${_formatDate(dayAfter)}</div>
                        <div class="assignment-count">${dayAfterTasks.length}项</div>
                    </div>
                    <div class="assignment-body">
                        ${dayAfterTasks.length === 0 ? `
                            <div class="assignment-empty">暂无安排</div>
                        ` : dayAfterTasks.map(t => {
                            const mod = _getModuleById(t.moduleId);
                            return `
                                <div class="assignment-item" data-id="${t.id}">
                                    <span class="assignment-mod-icon" style="background: ${mod.color}20; color: ${mod.color};">${mod.icon}</span>
                                    <span class="assignment-name">${_esc(t.taskName)}</span>
                                    <button class="btn-icon btn-xs" data-action="complete-missed" data-id="${t.id}" title="完成">✅</button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================================
    // 9. 学习日配置
    // ============================================================

    function _renderScheduleConfig() {
        const section = containerEl.querySelector('#scheduleConfig');
        if (!section) return;

        const weekDays = [
            { value: 1, label: '周一' },
            { value: 2, label: '周二' },
            { value: 3, label: '周三' },
            { value: 4, label: '周四' },
            { value: 5, label: '周五' },
            { value: 6, label: '周六' },
            { value: 0, label: '周日' },
        ];

        section.innerHTML = `
            <div class="schedule-cards">
                ${MODULES.map(mod => {
                    const schedule = data.moduleSchedule[mod.id] || { days: [] };
                    return `
                        <div class="card schedule-card" data-module="${mod.id}">
                            <div class="schedule-card-header">
                                <span class="schedule-icon" style="background: ${mod.color}20; color: ${mod.color};">${mod.icon}</span>
                                <span class="schedule-name">${mod.name}</span>
                            </div>
                            <div class="weekday-selector">
                                ${weekDays.map(d => `
                                    <button class="weekday-chip ${schedule.days.includes(d.value) ? 'active' : ''}"
                                            data-module="${mod.id}" data-day="${d.value}"
                                            style="${schedule.days.includes(d.value) ? `background: ${mod.color}20; color: ${mod.color}; border-color: ${mod.color};` : ''}">
                                        ${d.label}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // ============================================================
    // 10. 历史补学记录
    // ============================================================

    function _renderHistory() {
        const section = containerEl.querySelector('#makeupHistory');
        if (!section) return;

        const history = (data.makeupHistory || [])
            .sort((a, b) => (b.makeupDate || b.date).localeCompare(a.makeupDate || a.date))
            .slice(0, 20);

        if (history.length === 0) {
            section.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📜</div>
                    <div class="empty-state-text">暂无历史记录</div>
                </div>
            `;
            return;
        }

        section.innerHTML = `
            <div class="history-list">
                ${history.map(item => {
                    const mod = _getModuleById(item.moduleId);
                    const isCompleted = item.completed && !item.expired;
                    return `
                        <div class="card history-item ${item.expired ? 'expired' : ''}">
                            <div class="history-mod" style="background: ${mod.color}20; color: ${mod.color};">
                                ${mod.icon}
                            </div>
                            <div class="history-content">
                                <div class="history-name">${_esc(item.taskName)}</div>
                                <div class="history-meta">
                                    <span>原定：${_formatDate(item.date)}</span>
                                    ${item.makeupDate ? `<span>补于：${_formatDate(item.makeupDate)}</span>` : ''}
                                </div>
                            </div>
                            <div class="history-status ${isCompleted ? 'completed' : item.expired ? 'expired' : 'pending'}">
                                ${isCompleted ? '✅ 已完成' : item.expired ? '⏰ 已过期' : '⏳ 进行中'}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // ============================================================
    // 11. 新增/编辑未完成任务模态框
    // ============================================================

    function _openMissedModal(item = null) {
        const isEdit = !!item;
        const selectedModule = item?.moduleId || 'english';
        const templates = TASK_TEMPLATES[selectedModule] || [];

        const html = `
            <div class="form-group">
                <label class="form-label">学习模块</label>
                <div class="module-selector">
                    ${MODULES.map(mod => `
                        <button type="button" class="module-select-btn ${selectedModule === mod.id ? 'active' : ''}"
                                data-module="${mod.id}"
                                style="${selectedModule === mod.id ? `border-color: ${mod.color}; background: ${mod.color}20; color: ${mod.color};` : ''}">
                            ${mod.icon} ${mod.name}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">任务名称</label>
                <div class="task-templates" id="taskTemplates">
                    ${templates.map(t => `
                        <button type="button" class="task-template-btn" data-task="${t.id}" data-name="${t.name}">
                            ${t.name}
                        </button>
                    `).join('')}
                </div>
                <input type="text" class="form-input" id="taskName" value="${_esc(item?.taskName || '')}" placeholder="或手动输入任务名称">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">未完成日期</label>
                    <input type="date" class="form-input" id="missedDate" value="${item?.date || _today()}">
                </div>
                <div class="form-group">
                    <label class="form-label">分配到</label>
                    <select class="form-select" id="assignedDay">
                        <option value="0" ${item?.assignedDay === 0 || !item ? 'selected' : ''}>暂不分配</option>
                        <option value="1" ${item?.assignedDay === 1 ? 'selected' : ''}>次日补学</option>
                        <option value="2" ${item?.assignedDay === 2 ? 'selected' : ''}>第三日补学</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">未完成原因（可选）</label>
                <textarea class="form-textarea" id="missedReason" rows="2" placeholder="为什么没完成？">${_esc(item?.reason || '')}</textarea>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveMissedBtn">${isEdit ? '保存修改' : '添加任务'}</button>
            </div>
        `;

        App.openModal(isEdit ? '编辑补学任务' : '添加补学任务', html, {
            onOpen: () => {
                let currentModule = selectedModule;

                // 模块切换
                document.querySelectorAll('.module-select-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        currentModule = btn.dataset.module;
                        document.querySelectorAll('.module-select-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        MODULES.forEach(mod => {
                            if (mod.id === currentModule) {
                                btn.style.borderColor = mod.color;
                                btn.style.background = `${mod.color}20`;
                                btn.style.color = mod.color;
                            }
                        });

                        // 更新任务模板
                        const templatesEl = document.getElementById('taskTemplates');
                        const newTemplates = TASK_TEMPLATES[currentModule] || [];
                        templatesEl.innerHTML = newTemplates.map(t => `
                            <button type="button" class="task-template-btn" data-task="${t.id}" data-name="${t.name}">
                                ${t.name}
                            </button>
                        `).join('');
                        bindTemplateEvents();
                    });
                });

                function bindTemplateEvents() {
                    document.querySelectorAll('.task-template-btn').forEach(btn => {
                        btn.addEventListener('click', () => {
                            document.getElementById('taskName').value = btn.dataset.name;
                        });
                    });
                }
                bindTemplateEvents();

                // 保存
                document.getElementById('saveMissedBtn')?.addEventListener('click', () => {
                    const taskName = document.getElementById('taskName').value.trim();
                    if (!taskName) {
                        App.showError('请输入任务名称');
                        return;
                    }

                    const dateStr = document.getElementById('missedDate').value;
                    if (!dateStr) {
                        App.showError('请选择日期');
                        return;
                    }

                    // 将 YYYY-MM-DD 转为与 App.formatDate 一致的格式
                    const d = new Date(dateStr);
                    const formattedDate = App.formatDate(d);

                    const assignedDay = parseInt(document.getElementById('assignedDay').value) || 0;
                    const reason = document.getElementById('missedReason').value.trim();

                    const itemData = {
                        moduleId: currentModule,
                        taskName,
                        date: formattedDate,
                        assignedDay: assignedDay || null,
                        reason,
                        completed: false,
                    };

                    if (isEdit) {
                        const idx = data.missedDates.findIndex(m => m.id === item.id);
                        if (idx > -1) {
                            data.missedDates[idx] = { ...data.missedDates[idx], ...itemData };
                        }
                        App.showSuccess('已更新');
                    } else {
                        itemData.id = _genId('missed');
                        itemData.createdAt = Date.now();
                        data.missedDates.push(itemData);
                        App.showSuccess('已添加');
                    }

                    _saveData();
                    _renderStats();
                    _renderMissedTasks();
                    _renderAssignment();
                    App.closeModal();
                });
            }
        });
    }

    // ============================================================
    // 12. 操作函数
    // ============================================================

    function _toggleAssign(id, day) {
        const item = data.missedDates.find(m => m.id === id);
        if (!item) return;

        if (item.assignedDay === day) {
            item.assignedDay = null; // 取消分配
        } else {
            item.assignedDay = day;
        }

        _saveData();
        _renderStats();
        _renderMissedTasks();
        _renderAssignment();
    }

    function _completeMissed(id) {
        const item = data.missedDates.find(m => m.id === id);
        if (!item) return;

        item.completed = true;
        item.completedAt = Date.now();

        // 移到历史记录
        data.makeupHistory.push({
            ...item,
            makeupDate: _today(),
        });

        // 从待办中移除
        data.missedDates = data.missedDates.filter(m => m.id !== id);

        _saveData();
        _renderStats();
        _renderMissedTasks();
        _renderAssignment();
        _renderHistory();
        App.showSuccess('已完成，棒棒哒！🎉');
    }

    async function _deleteMissed(id) {
        const confirmed = await App.confirmModal('确认删除', '确定要删除这个补学任务吗？', {
            confirmText: '删除',
            cancelText: '取消',
        });
        if (confirmed) {
            data.missedDates = data.missedDates.filter(m => m.id !== id);
            _saveData();
            _renderStats();
            _renderMissedTasks();
            _renderAssignment();
            App.showSuccess('已删除');
        }
    }

    function _toggleScheduleDay(moduleId, day) {
        if (!data.moduleSchedule[moduleId]) {
            data.moduleSchedule[moduleId] = { days: [] };
        }
        const days = data.moduleSchedule[moduleId].days;
        const idx = days.indexOf(day);
        if (idx > -1) {
            days.splice(idx, 1);
        } else {
            days.push(day);
        }
        _saveData();
        _renderScheduleConfig();
    }

    // ============================================================
    // 13. 事件绑定
    // ============================================================

    function _bindEvents() {
        if (!containerEl) return;

        // 添加未完成任务
        containerEl.querySelector('[data-action="add-missed"]')?.addEventListener('click', () => {
            _openMissedModal();
        });

        // 编辑任务
        containerEl.querySelectorAll('[data-action="edit-missed"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const item = data.missedDates.find(m => m.id === id);
                if (item) _openMissedModal(item);
            });
        });

        // 删除任务
        containerEl.querySelectorAll('[data-action="delete-missed"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _deleteMissed(btn.dataset.id);
            });
        });

        // 分配任务
        containerEl.querySelectorAll('[data-action="toggle-assign"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _toggleAssign(btn.dataset.id, parseInt(btn.dataset.day));
            });
        });

        // 完成任务
        containerEl.querySelectorAll('[data-action="complete-missed"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _completeMissed(btn.dataset.id);
            });
        });

        // 学习日配置切换
        containerEl.querySelectorAll('.weekday-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const moduleId = chip.dataset.module;
                const day = parseInt(chip.dataset.day);
                _toggleScheduleDay(moduleId, day);
            });
        });
    }

    // ============================================================
    // 14. onAdd - 顶部添加按钮回调
    // ============================================================
    function onAdd() {
        _openMissedModal();
    }

    // ============================================================
    // 15. onResume - 页面恢复时刷新
    // ============================================================
    function onResume() {
        if (containerEl) {
            _loadData();
            render(containerEl);
        }
    }

    // ============================================================
    // 16. 导出
    // ============================================================
    return {
        init,
        render,
        onAdd,
        onResume,
    };
})();

// 注册模块
if (typeof App !== 'undefined' && App.registerModule) {
    App.registerModule('makeup', MakeupModule);
}
