/**
 * drawing.js - 平板绘画模块
 * 功能分区：
 *   1. 百度网盘绘画图库入口
 *   2. 模块长期总目标（近期/中期/远期/终极）
 *   3. 当日绘画记录区
 *   4. 作品展示画廊
 *   5. 绘画挑战进度
 */

const DrawingModule = (function() {
    'use strict';

    // ============================================================
    // 1. 数据结构与默认值
    // ============================================================
    const STORAGE_KEY = 'drawing';

    // 颜色调色板（柔和浅色系）
    const COLORS = [
        '#7ec8a7', // 薄荷绿
        '#f4b8c4', // 浅粉
        '#a8c9e8', // 浅蓝
        '#f5c89a', // 浅橙
        '#c9b8e0', // 浅紫
        '#f0c987', // 暖黄
        '#8bc9a8', // 青绿
        '#e8a0a0', // 浅红
    ];

    // 学习状态选项
    const STATUS_OPTIONS = [
        { value: 'not_started', label: '未开始', icon: '⏳', color: '#a8a39d' },
        { value: 'in_progress', label: '绘画中', icon: '🎨', color: '#f5c89a' },
        { value: 'reviewing', label: '修改中', icon: '🔄', color: '#a8c9e8' },
        { value: 'completed', label: '已完成', icon: '✅', color: '#7ec8a7' },
    ];

    // 待办项定义
    const TODO_ITEMS = [
        { key: 'line_practice', label: '控笔描边练习', icon: '✏️' },
        { key: 'full_copy', label: '完整临摹插画', icon: '🖼️' },
    ];

    // 默认绘画挑战
    const DEFAULT_CHALLENGES = [
        {
            id: 'ch1',
            title: '30天控笔挑战',
            description: '每天练习控笔30分钟，坚持30天',
            targetDays: 30,
            currentDays: 5,
            icon: '✏️',
            color: '#f4b8c4',
            active: true,
            createdAt: Date.now(),
        },
        {
            id: 'ch2',
            title: '100幅插画挑战',
            description: '完成100幅完整插画作品',
            targetDays: 100,
            currentDays: 12,
            icon: '🖼️',
            color: '#c9b8e0',
            active: true,
            createdAt: Date.now(),
        },
    ];

    // 默认作品画廊
    const DEFAULT_GALLERY = [
        {
            id: 'g1',
            title: '第一幅临摹作品',
            image: '',
            description: '第一次用平板画画，虽然很生涩但是个好开始',
            date: _getDateBefore(7),
            tags: ['临摹', '入门'],
            likes: 0,
            createdAt: Date.now() - 7 * 24 * 3600 * 1000,
        },
    ];

    function _getDateBefore(days) {
        const d = new Date();
        d.setDate(d.getDate() - days);
        return App.formatDate(d);
    }

    // 默认数据
    function _getDefaultData() {
        return {
            // 长期目标
            longTermGoals: {
                near: {
                    title: '近期目标（3个月）',
                    content: '掌握基础线条和造型，能独立完成简单插画',
                    progress: 35,
                    icon: '🌱',
                    color: '#c9b8e0',
                },
                mid: {
                    title: '中期目标（6个月）',
                    content: '熟练上色技巧，形成个人绘画风格',
                    progress: 15,
                    icon: '🌿',
                    color: '#f4b8c4',
                },
                far: {
                    title: '远期目标（1年）',
                    content: '能独立创作完整插画作品，接单约稿',
                    progress: 5,
                    icon: '🌳',
                    color: '#7ec8a7',
                },
                ultimate: {
                    title: '终极目标',
                    content: '成为职业插画师，出版个人画集',
                    progress: 2,
                    icon: '🏆',
                    color: '#f5c89a',
                },
            },
            // 作品画廊
            gallery: [...DEFAULT_GALLERY],
            // 绘画挑战
            challenges: [...DEFAULT_CHALLENGES],
            // 自定义任务
            customTasks: [],
            // 当日学习记录（按日期存储）
            dailyRecords: {},
        };
    }

    // ============================================================
    // 2. 状态管理
    // ============================================================
    let data = null;
    let containerEl = null;
    let currentDate = null;
    let calendarMonth = null;
    let calendarYear = null;
    let showCalendar = false;

    // ============================================================
    // 3. 初始化
    // ============================================================
    function init() {
        _loadData();
    }

    function _loadData() {
        const stored = AppStorage.getModule(STORAGE_KEY);
        if (stored && typeof stored === 'object' && stored.longTermGoals) {
            data = stored;
        } else {
            data = _getDefaultData();
            AppStorage.setModule(STORAGE_KEY, data);
        }
        const now = new Date();
        currentDate = _today();
        calendarMonth = now.getMonth();
        calendarYear = now.getFullYear();
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

    function _today() {
        return App.getToday();
    }

    function _esc(text) {
        return App.escapeHtml(text || '');
    }

    function _formatDateShort(dateStr) {
        const d = new Date(dateStr);
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        return `${d.getMonth() + 1}月${d.getDate()}日 周${weekDays[d.getDay()]}`;
    }

    function _getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function _getDayRecord(dateStr) {
        if (!data.dailyRecords[dateStr]) {
            data.dailyRecords[dateStr] = {
                todos: {},
                thoughts: '',
                status: 'not_started',
                images: [],
                customTasks: [],
                syncToPan: false,
            };
        }
        return data.dailyRecords[dateStr];
    }

    function _renderDrawingCalendar() {
        const year = calendarYear;
        const month = calendarMonth;
        const daysInMonth = _getDaysInMonth(year, month);
        const firstDay = new Date(year, month, 1).getDay();
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

        let html = '<div class="cal-weekdays cal-weekdays-sm">';
        weekDays.forEach(d => {
            html += `<div class="cal-weekday">${d}</div>`;
        });
        html += '</div><div class="cal-days cal-days-sm">';

        for (let i = 0; i < firstDay; i++) {
            html += '<div class="cal-day empty"></div>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === _today();
            const isSelected = dateStr === currentDate;
            const record = data.dailyRecords[dateStr];
            const hasContent = record && (record.thoughts || (record.images && record.images.length > 0) || Object.keys(record.todos || {}).length > 0);

            html += `
                <div class="cal-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasContent ? 'has-content' : ''}"
                     data-date="${dateStr}" data-action="draw-cal-day">
                    <div class="cal-day-num">${day}</div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    function _getStatusInfo(status) {
        return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    }

    /**
     * 获取今日学习记录
     */
    function _getTodayRecord() {
        const today = _today();
        if (!data.dailyRecords[today]) {
            data.dailyRecords[today] = {
                todos: {},
                thoughts: '',
                status: 'not_started',
                images: [],
                customTasks: [],
                syncToPan: false,
            };
            _saveData();
        }
        return data.dailyRecords[today];
    }

    // ============================================================
    // 5. 渲染入口
    // ============================================================

    function render(container) {
        containerEl = container;
        if (!data) _loadData();

        container.innerHTML = `
            <div class="drawing-module">
                <!-- 快捷入口 -->
                <div class="quick-links-bar single">
                    <a class="quick-link-btn baidu" href="https://pan.baidu.com" target="_blank" rel="noopener">
                        <span class="ql-icon">☁️</span>
                        <span class="ql-text">百度网盘</span>
                        <span class="ql-arrow">↗</span>
                    </a>
                </div>

                <!-- 百度网盘绘画图库入口 -->
                <div class="section-title">
                    <h2><span class="title-icon">☁️</span>百度网盘绘画图库</h2>
                    <span class="section-action" data-action="open-pan">打开网盘 →</span>
                </div>
                <div class="card pan-entry-card card-clickable" data-action="open-pan">
                    <div class="pan-entry-icon">🎨</div>
                    <div class="pan-entry-content">
                        <div class="pan-entry-title">绘画作品与素材库</div>
                        <div class="pan-entry-desc">点击打开百度网盘，浏览绘画教程、参考素材和作品集</div>
                    </div>
                    <div class="pan-entry-arrow">→</div>
                </div>

                <!-- 模块长期总目标 -->
                <div class="section-title">
                    <h2><span class="title-icon">🎯</span>模块长期总目标</h2>
                    <span class="section-action" data-action="edit-goals">编辑</span>
                </div>
                <div class="goals-vertical" id="drawingLongTermGoals"></div>

                <!-- 当日绘画记录区 -->
                <div class="section-title">
                    <h2><span class="title-icon">📝</span><span id="drawingRecordTitle">今日</span>绘画记录</h2>
                    <span class="section-action" data-action="toggle-calendar">📆 日历</span>
                </div>
                <div class="record-date-nav">
                    <button class="btn-icon btn-sm" data-action="prev-day-draw">◀</button>
                    <span class="record-date-text" id="drawingRecordDate">${_formatDateShort(currentDate)}</span>
                    <button class="btn-icon btn-sm" data-action="next-day-draw">▶</button>
                    ${currentDate !== _today() ? '<button class="btn-text" data-action="goto-today-draw">回到今天</button>' : ''}
                </div>
                ${showCalendar ? `
                <div class="card calendar-mini-card">
                    <div class="month-nav month-nav-sm">
                        <button class="btn-icon btn-sm" data-action="prev-month-draw">◀</button>
                        <div class="month-label-sm">${calendarYear}年${calendarMonth + 1}月</div>
                        <button class="btn-icon btn-sm" data-action="next-month-draw">▶</button>
                    </div>
                    <div class="drawing-calendar-mini">
                        ${_renderDrawingCalendar()}
                    </div>
                </div>
                ` : ''}
                <div class="card daily-record-card" id="drawingDailyRecord"></div>

                <!-- 作品展示画廊 -->
                <div class="section-title">
                    <h2><span class="title-icon">🖼️</span>作品展示画廊</h2>
                    <span class="section-action" data-action="add-gallery">+ 上传作品</span>
                </div>
                <div class="section-subtitle">记录每一幅作品，见证成长轨迹</div>
                <div class="gallery-grid" id="drawingGallery"></div>

                <!-- 绘画挑战进度 -->
                <div class="section-title">
                    <h2><span class="title-icon">🏅</span>绘画挑战进度</h2>
                    <span class="section-action" data-action="add-challenge">+ 新建挑战</span>
                </div>
                <div class="challenge-list" id="drawingChallenges"></div>
            </div>
        `;

        _renderLongTermGoals();
        _renderDailyRecord();
        _renderGallery();
        _renderChallenges();
        _bindEvents();
    }

    // ============================================================
    // 6. 长期目标渲染
    // ============================================================
    // 按打卡天数自动计算目标进度
    // 近期: 90天, 中期: 180天, 远期: 365天, 终极: 730天
    function _calcGoalProgress(key) {
        const checkinDays = Object.keys(data.dailyRecords).filter(d => {
            const rec = data.dailyRecords[d];
            return rec && (rec.thoughts || (rec.images && rec.images.length > 0) || Object.keys(rec.todos || {}).some(k => rec.todos[k]));
        }).length;
        const dayMap = { near: 90, mid: 180, far: 365, ultimate: 730 };
        const targetDays = dayMap[key] || 90;
        const progress = Math.min(100, Math.round((checkinDays / targetDays) * 1000) / 10);
        return progress;
    }

    function _renderLongTermGoals() {
        const goalsEl = containerEl.querySelector('#drawingLongTermGoals');
        if (!goalsEl) return;

        const goals = data.longTermGoals;
        const goalKeys = ['near', 'mid', 'far', 'ultimate'];

        const checkinDays = Object.keys(data.dailyRecords).filter(d => {
            const rec = data.dailyRecords[d];
            return rec && (rec.thoughts || (rec.images && rec.images.length > 0) || Object.keys(rec.todos || {}).some(k => rec.todos[k]));
        }).length;

        goalsEl.innerHTML = goalKeys.map(key => {
            const g = goals[key];
            const progress = _calcGoalProgress(key);
            const dayMap = { near: 90, mid: 180, far: 365, ultimate: 730 };
            const targetDays = dayMap[key] || 90;
            const daysLabel = `${checkinDays}/${targetDays}天`;

            return `
                <div class="goal-item-vertical" data-goal-key="${key}">
                    <div class="goal-v-header">
                        <div class="goal-v-icon" style="background: ${g.color}20; color: ${g.color};">
                            ${g.icon}
                        </div>
                        <div class="goal-v-info">
                            <div class="goal-v-title">${_esc(g.title)}</div>
                            <div class="goal-v-desc">${_esc(g.content)}</div>
                            <div class="goal-v-days">📅 ${daysLabel}</div>
                        </div>
                        <div class="goal-v-progress" style="color: ${g.color};">${progress}%</div>
                    </div>
                    <div class="progress progress-sm">
                        <div class="progress-bar" style="width: ${progress}%; background: linear-gradient(90deg, ${g.color}88, ${g.color});"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function _openGoalsModal() {
        const goals = data.longTermGoals;
        const goalKeys = ['near', 'mid', 'far', 'ultimate'];

        const html = `
            ${goalKeys.map(key => {
                const g = goals[key];
                return `
                    <div class="goal-edit-block" data-key="${key}">
                        <div class="form-row">
                            <div class="form-group" style="flex: 2;">
                                <label class="form-label">${_esc(g.title)}</label>
                                <input type="text" class="form-input goal-title-input" data-key="${key}" 
                                       value="${_esc(g.content)}" placeholder="目标内容">
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label class="form-label">进度 ${g.progress}%</label>
                                <input type="range" class="slider goal-progress-input" data-key="${key}"
                                       min="0" max="100" value="${g.progress}">
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveGoalsBtn">保存目标</button>
            </div>
        `;

        App.openModal('编辑长期目标', html, {
            onOpen: () => {
                document.getElementById('saveGoalsBtn')?.addEventListener('click', () => {
                    goalKeys.forEach(key => {
                        const titleInput = document.querySelector(`.goal-title-input[data-key="${key}"]`);
                        const progressInput = document.querySelector(`.goal-progress-input[data-key="${key}"]`);
                        if (titleInput) data.longTermGoals[key].content = titleInput.value.trim();
                        if (progressInput) data.longTermGoals[key].progress = parseInt(progressInput.value) || 0;
                    });
                    _saveData();
                    _renderLongTermGoals();
                    App.closeModal();
                    App.showSuccess('目标已更新');
                });
            }
        });
    }

    // ============================================================
    // 7. 当日绘画记录渲染与操作
    // ============================================================

    function _renderDailyRecord() {
        const recEl = containerEl.querySelector('#drawingDailyRecord');
        if (!recEl) return;

        const rec = _getDayRecord(currentDate);
        const statusInfo = _getStatusInfo(rec.status);

        // 更新标题
        const titleEl = containerEl.querySelector('#drawingRecordTitle');
        if (titleEl) {
            titleEl.textContent = currentDate === _today() ? '今日' : _formatDateShort(currentDate);
        }
        const dateEl = containerEl.querySelector('#drawingRecordDate');
        if (dateEl) {
            dateEl.textContent = _formatDateShort(currentDate);
        }

        recEl.innerHTML = `
            <div class="daily-record-header">
                <div class="record-date">${currentDate}</div>
                <div class="record-status-badge" style="background: ${statusInfo.color}20; color: ${statusInfo.color};">
                    ${statusInfo.icon} ${statusInfo.label}
                </div>
            </div>
            <div class="daily-record-body">
                <div class="record-section">
                    <div class="record-section-title">待办事项</div>
                    <div class="todo-list">
                        ${TODO_ITEMS.map(item => `
                            <div class="todo-item ${rec.todos[item.key] ? 'done' : ''}">
                                <span class="todo-check">${rec.todos[item.key] ? '☑️' : '⬜'}</span>
                                <span class="todo-icon">${item.icon}</span>
                                <span class="todo-label">${item.label}</span>
                            </div>
                        `).join('')}
                        ${(rec.customTasks || []).map((task, idx) => `
                            <div class="todo-item ${task.done ? 'done' : ''}">
                                <span class="todo-check">${task.done ? '☑️' : '⬜'}</span>
                                <span class="todo-icon">✏️</span>
                                <span class="todo-label">${_esc(task.name)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="record-section">
                    <div class="record-section-title">绘画心得</div>
                    <div class="record-notes">${_esc(rec.thoughts || '暂无心得记录')}</div>
                </div>
                ${rec.syncToPan ? `
                    <div class="record-section">
                        <div class="record-section-title">网盘同步</div>
                        <div class="sync-status synced">☁️ 已同步到百度网盘</div>
                    </div>
                ` : ''}
                ${rec.images && rec.images.length > 0 ? `
                    <div class="record-section">
                        <div class="record-section-title">作品图片</div>
                        <div class="image-gallery">
                            ${rec.images.map((img, idx) => `
                                <div class="gallery-item" style="background-image: url('${img}');"></div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    function _openTodayModal() {
        const rec = _getDayRecord(currentDate);
        const isToday = currentDate === _today();

        const html = `
            <div class="form-group">
                <label class="form-label">待办完成情况</label>
                <div class="todo-edit-list">
                    ${TODO_ITEMS.map(item => `
                        <label class="form-checkbox todo-checkbox">
                            <input type="checkbox" class="todo-check-input" data-key="${item.key}" 
                                   ${rec.todos[item.key] ? 'checked' : ''}>
                            <span>${item.icon} ${item.label}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">自定义绘画任务</label>
                <div id="customTasksList">
                    ${(rec.customTasks || []).map((task, idx) => `
                        <div class="custom-task-item" data-idx="${idx}">
                            <input type="checkbox" class="custom-task-check" ${task.done ? 'checked' : ''}>
                            <input type="text" class="form-input custom-task-name" value="${_esc(task.name)}">
                            <button class="btn-icon btn-sm" data-action="remove-custom-task" data-idx="${idx}">🗑️</button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-sm btn-outline btn-block mt-sm" data-action="add-custom-task">
                    + 添加自定义任务
                </button>
            </div>
            <div class="form-group">
                <label class="form-label">绘画心得</label>
                <textarea class="form-textarea" id="recThoughts" placeholder="记录今天的绘画心得、技巧感悟...">${_esc(rec.thoughts || '')}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">学习状态</label>
                <select class="form-select" id="recStatus">
                    ${STATUS_OPTIONS.map(opt => `
                        <option value="${opt.value}" ${rec.status === opt.value ? 'selected' : ''}>
                            ${opt.icon} ${opt.label}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-checkbox">
                    <input type="checkbox" id="recSyncPan" ${rec.syncToPan ? 'checked' : ''}>
                    <span>同步到百度网盘</span>
                </label>
            </div>
            <div class="form-group">
                <label class="form-label">上传作品图片</label>
                <div class="image-upload-area" id="imageUploadArea">
                    <div class="upload-placeholder">🖼️ 点击上传作品图片</div>
                    <input type="file" id="imageInput" accept="image/*" multiple style="display: none;">
                </div>
                <div class="image-preview-list" id="imagePreviewList"></div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveRecBtn">保存记录</button>
            </div>
        `;

        App.openModal(isToday ? '编辑今日记录' : `编辑 ${_formatDateShort(currentDate)} 记录`, html, {
            onOpen: () => {
                const tempImages = [...(rec.images || [])];
                let customTasks = JSON.parse(JSON.stringify(rec.customTasks || []));
                _renderImagePreview(tempImages);
                _renderCustomTaskList(customTasks);

                // 添加自定义任务
                document.querySelector('[data-action="add-custom-task"]')?.addEventListener('click', () => {
                    customTasks.push({ name: '', done: false });
                    _renderCustomTaskList(customTasks);
                });

                // 移除自定义任务
                document.getElementById('customTasksList')?.addEventListener('click', (e) => {
                    const removeBtn = e.target.closest('[data-action="remove-custom-task"]');
                    if (removeBtn) {
                        const idx = parseInt(removeBtn.dataset.idx);
                        customTasks.splice(idx, 1);
                        _renderCustomTaskList(customTasks);
                    }
                });

                // 自定义任务输入
                document.getElementById('customTasksList')?.addEventListener('input', (e) => {
                    if (e.target.classList.contains('custom-task-name')) {
                        const item = e.target.closest('.custom-task-item');
                        const idx = parseInt(item.dataset.idx);
                        customTasks[idx].name = e.target.value;
                    }
                    if (e.target.classList.contains('custom-task-check')) {
                        const item = e.target.closest('.custom-task-item');
                        const idx = parseInt(item.dataset.idx);
                        customTasks[idx].done = e.target.checked;
                    }
                });

                // 图片上传
                const uploadArea = document.getElementById('imageUploadArea');
                const imageInput = document.getElementById('imageInput');
                uploadArea?.addEventListener('click', () => imageInput?.click());
                imageInput?.addEventListener('change', (e) => {
                    const files = e.target.files;
                    for (const file of files) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            tempImages.push(ev.target.result);
                            _renderImagePreview(tempImages);
                        };
                        reader.readAsDataURL(file);
                    }
                });

                // 图片预览删除
                document.getElementById('imagePreviewList')?.addEventListener('click', (e) => {
                    const removeBtn = e.target.closest('[data-remove-idx]');
                    if (removeBtn) {
                        const idx = parseInt(removeBtn.dataset.removeIdx);
                        tempImages.splice(idx, 1);
                        _renderImagePreview(tempImages);
                    }
                });

                document.getElementById('saveRecBtn')?.addEventListener('click', () => {
                    const todos = {};
                    document.querySelectorAll('.todo-check-input').forEach(cb => {
                        todos[cb.dataset.key] = cb.checked;
                    });

                    data.dailyRecords[currentDate] = {
                        ...(data.dailyRecords[currentDate] || {}),
                        todos,
                        customTasks: customTasks.filter(t => t.name.trim()),
                        thoughts: document.getElementById('recThoughts').value.trim(),
                        status: document.getElementById('recStatus').value,
                        syncToPan: document.getElementById('recSyncPan').checked,
                        images: tempImages,
                    };

                    _saveData();
                    _renderDailyRecord();
                    App.closeModal();
                    App.showSuccess('记录已保存');
                });
            }
        });
    }

    function _renderCustomTaskList(tasks) {
        const list = document.getElementById('customTasksList');
        if (!list) return;
        list.innerHTML = tasks.map((task, idx) => `
            <div class="custom-task-item" data-idx="${idx}">
                <input type="checkbox" class="custom-task-check" ${task.done ? 'checked' : ''}>
                <input type="text" class="form-input custom-task-name" value="${_esc(task.name)}" placeholder="任务名称">
                <button class="btn-icon btn-sm" data-action="remove-custom-task" data-idx="${idx}">🗑️</button>
            </div>
        `).join('');
    }

    function _renderImagePreview(images) {
        const list = document.getElementById('imagePreviewList');
        if (!list) return;
        list.innerHTML = images.map((img, idx) => `
            <div class="preview-item">
                <img src="${img}" alt="预览">
                <button class="preview-remove" data-remove-idx="${idx}">×</button>
            </div>
        `).join('');
    }

    // ============================================================
    // 8. 作品画廊渲染与操作
    // ============================================================

    function _renderGallery() {
        const grid = containerEl.querySelector('#drawingGallery');
        if (!grid) return;

        const gallery = data.gallery || [];

        if (gallery.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🖼️</div>
                    <div class="empty-state-text">还没有作品，点击上方上传第一幅作品</div>
                </div>
            `;
            return;
        }

        // 按时间倒序
        const sorted = [...gallery].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        grid.innerHTML = sorted.map(item => `
            <div class="card gallery-item-card" data-gallery-id="${item.id}">
                <div class="gallery-image-wrapper">
                    ${item.image 
                        ? `<div class="gallery-image" style="background-image: url('${item.image}');"></div>`
                        : `<div class="gallery-image placeholder">
                             <div class="placeholder-icon">🖼️</div>
                             <div class="placeholder-text">暂无图片</div>
                           </div>`
                    }
                </div>
                <div class="gallery-item-info">
                    <h3 class="gallery-item-title">${_esc(item.title)}</h3>
                    <div class="gallery-item-date">${item.date || ''}</div>
                    ${item.tags && item.tags.length > 0 ? `
                        <div class="gallery-item-tags">
                            ${item.tags.map(tag => `<span class="tag">#${_esc(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                    ${item.description ? `<p class="gallery-item-desc">${_esc(item.description.substring(0, 40))}${item.description.length > 40 ? '...' : ''}</p>` : ''}
                </div>
                <div class="gallery-item-actions">
                    <button class="btn-icon btn-sm" data-action="edit-gallery" data-id="${item.id}" title="编辑">✏️</button>
                    <button class="btn-icon btn-sm" data-action="delete-gallery" data-id="${item.id}" title="删除">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    function _openGalleryModal(item = null) {
        const isEdit = !!item;
        const html = `
            <div class="form-group">
                <label class="form-label">作品名称</label>
                <input type="text" class="form-input" id="galleryTitle" value="${_esc(item?.title || '')}" placeholder="给作品起个名字">
            </div>
            <div class="form-group">
                <label class="form-label">作品图片</label>
                <div class="image-upload-area" id="galleryUploadArea">
                    <div class="upload-placeholder">🖼️ 点击上传作品图片</div>
                    <input type="file" id="galleryImageInput" accept="image/*" style="display: none;">
                </div>
                <div class="image-preview-list" id="galleryPreviewList"></div>
            </div>
            <div class="form-group">
                <label class="form-label">创作日期</label>
                <input type="date" class="form-input" id="galleryDate" value="${item?.date || _today()}">
            </div>
            <div class="form-group">
                <label class="form-label">作品描述</label>
                <textarea class="form-textarea" id="galleryDesc" placeholder="记录创作过程和感悟...">${_esc(item?.description || '')}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">标签（用逗号分隔）</label>
                <input type="text" class="form-input" id="galleryTags" value="${_esc((item?.tags || []).join(', '))}" placeholder="例如：临摹, 风景, 水彩">
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveGalleryBtn">${isEdit ? '保存修改' : '上传作品'}</button>
            </div>
        `;

        App.openModal(isEdit ? '编辑作品' : '上传作品', html, {
            onOpen: () => {
                let galleryImage = item?.image || '';
                if (galleryImage) {
                    _renderGalleryPreview([galleryImage]);
                }

                const uploadArea = document.getElementById('galleryUploadArea');
                const imageInput = document.getElementById('galleryImageInput');
                uploadArea?.addEventListener('click', () => imageInput?.click());
                imageInput?.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            galleryImage = ev.target.result;
                            _renderGalleryPreview([galleryImage]);
                        };
                        reader.readAsDataURL(file);
                    }
                });

                document.getElementById('saveGalleryBtn')?.addEventListener('click', () => {
                    const title = document.getElementById('galleryTitle').value.trim();
                    if (!title) {
                        App.showError('请输入作品名称');
                        return;
                    }

                    const tagsStr = document.getElementById('galleryTags').value;
                    const tags = tagsStr ? tagsStr.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [];

                    const itemData = {
                        title,
                        image: galleryImage,
                        date: document.getElementById('galleryDate').value || _today(),
                        description: document.getElementById('galleryDesc').value.trim(),
                        tags,
                    };

                    if (isEdit) {
                        const idx = data.gallery.findIndex(g => g.id === item.id);
                        if (idx > -1) {
                            data.gallery[idx] = { ...data.gallery[idx], ...itemData };
                        }
                        App.showSuccess('作品已更新');
                    } else {
                        itemData.id = _genId('g');
                        itemData.likes = 0;
                        itemData.createdAt = Date.now();
                        data.gallery.push(itemData);
                        App.showSuccess('作品已上传');
                    }

                    _saveData();
                    _renderGallery();
                    App.closeModal();
                });
            }
        });
    }

    function _renderGalleryPreview(images) {
        const list = document.getElementById('galleryPreviewList');
        if (!list) return;
        list.innerHTML = images.map((img, idx) => `
            <div class="preview-item">
                <img src="${img}" alt="预览">
            </div>
        `).join('');
    }

    async function _deleteGalleryItem(id) {
        const confirmed = await App.confirmModal('确认删除', '确定要删除这幅作品吗？');
        if (confirmed) {
            data.gallery = data.gallery.filter(g => g.id !== id);
            _saveData();
            _renderGallery();
            App.showSuccess('已删除');
        }
    }

    // ============================================================
    // 9. 绘画挑战渲染与操作
    // ============================================================

    function _renderChallenges() {
        const list = containerEl.querySelector('#drawingChallenges');
        if (!list) return;

        const challenges = data.challenges || [];

        if (challenges.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏅</div>
                    <div class="empty-state-text">还没有挑战，点击上方新建一个挑战</div>
                </div>
            `;
            return;
        }

        list.innerHTML = challenges.map(ch => {
            const percent = ch.targetDays > 0 ? Math.min(100, Math.round((ch.currentDays / ch.targetDays) * 100)) : 0;
            const mediaCount = (ch.dailyRecords && Object.keys(ch.dailyRecords).length) || 0;
            return `
                <div class="card challenge-card" data-challenge-id="${ch.id}">
                    <div class="challenge-header" data-action="view-challenge" data-id="${ch.id}">
                        <div class="challenge-icon" style="background: ${ch.color}20; color: ${ch.color};">
                            ${ch.icon || '🏅'}
                        </div>
                        <div class="challenge-info">
                            <h3 class="challenge-title">${_esc(ch.title)}</h3>
                            <p class="challenge-desc">${_esc(ch.description || '')}</p>
                            ${mediaCount > 0 ? `<div class="challenge-media-count">📷 ${mediaCount} 天有作品</div>` : ''}
                        </div>
                        <div class="challenge-actions">
                            <button class="btn-icon btn-sm" data-action="edit-challenge" data-id="${ch.id}" title="编辑">✏️</button>
                            <button class="btn-icon btn-sm" data-action="delete-challenge" data-id="${ch.id}" title="删除">🗑️</button>
                        </div>
                    </div>
                    <div class="challenge-progress-info">
                        <span class="challenge-current">${ch.currentDays || 0}</span>
                        <span class="challenge-sep">/</span>
                        <span class="challenge-target">${ch.targetDays || 0} 天</span>
                        <span class="challenge-percent" style="color: ${ch.color};">${percent}%</span>
                    </div>
                    <div class="progress progress-lg">
                        <div class="progress-bar" style="width: ${percent}%; background: linear-gradient(90deg, ${ch.color}88, ${ch.color});"></div>
                    </div>
                    <div class="challenge-footer">
                        <button class="btn btn-sm btn-outline" data-action="challenge-checkin" data-id="${ch.id}">
                            ✅ 今日打卡 (+1)
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" data-action="challenge-undo" data-id="${ch.id}">
                            ↩️ 撤销
                        </button>
                        <button class="btn btn-sm btn-outline" data-action="view-challenge" data-id="${ch.id}">
                            📷 作品
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function _openChallengeModal(challenge = null) {
        const isEdit = !!challenge;
        const html = `
            <div class="form-group">
                <label class="form-label">挑战名称</label>
                <input type="text" class="form-input" id="chTitle" value="${_esc(challenge?.title || '')}" placeholder="例如：30天控笔挑战">
            </div>
            <div class="form-group">
                <label class="form-label">挑战描述</label>
                <textarea class="form-textarea" id="chDesc" placeholder="描述这个挑战...">${_esc(challenge?.description || '')}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">目标天数</label>
                    <input type="number" class="form-input" id="chTarget" value="${challenge?.targetDays || 30}" min="1">
                </div>
                <div class="form-group">
                    <label class="form-label">当前进度</label>
                    <input type="number" class="form-input" id="chCurrent" value="${challenge?.currentDays || 0}" min="0">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">图标</label>
                    <input type="text" class="form-input" id="chIcon" value="${_esc(challenge?.icon || '🏅')}" placeholder="emoji图标">
                </div>
                <div class="form-group">
                    <label class="form-label">主题色</label>
                    <div class="color-picker">
                        ${COLORS.map((c, i) => `
                            <button class="color-dot ${challenge?.color === c ? 'selected' : ''}" 
                                    data-color="${c}" 
                                    style="background: ${c};"
                                    title="${c}"></button>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveChBtn">${isEdit ? '保存修改' : '创建挑战'}</button>
            </div>
        `;

        App.openModal(isEdit ? '编辑挑战' : '新建挑战', html, {
            onOpen: () => {
                let selectedColor = challenge?.color || COLORS[0];

                document.querySelectorAll('.color-dot').forEach(dot => {
                    dot.addEventListener('click', () => {
                        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
                        dot.classList.add('selected');
                        selectedColor = dot.dataset.color;
                    });
                });

                document.getElementById('saveChBtn')?.addEventListener('click', () => {
                    const title = document.getElementById('chTitle').value.trim();
                    if (!title) {
                        App.showError('请输入挑战名称');
                        return;
                    }

                    const chData = {
                        title,
                        description: document.getElementById('chDesc').value.trim(),
                        targetDays: parseInt(document.getElementById('chTarget').value) || 30,
                        currentDays: parseInt(document.getElementById('chCurrent').value) || 0,
                        icon: document.getElementById('chIcon').value.trim() || '🏅',
                        color: selectedColor,
                        active: true,
                    };

                    if (isEdit) {
                        const idx = data.challenges.findIndex(c => c.id === challenge.id);
                        if (idx > -1) {
                            data.challenges[idx] = { ...data.challenges[idx], ...chData };
                        }
                        App.showSuccess('挑战已更新');
                    } else {
                        chData.id = _genId('ch');
                        chData.createdAt = Date.now();
                        data.challenges.push(chData);
                        App.showSuccess('挑战已创建');
                    }

                    _saveData();
                    _renderChallenges();
                    App.closeModal();
                });
            }
        });
    }

    function _challengeCheckin(id) {
        const ch = data.challenges.find(c => c.id === id);
        if (ch) {
            ch.currentDays = (ch.currentDays || 0) + 1;
            if (ch.currentDays >= ch.targetDays) {
                App.showToast(`🎉 恭喜完成「${ch.title}」挑战！`, { type: 'success', duration: 3000 });
            } else {
                App.showSuccess(`打卡成功！已坚持 ${ch.currentDays} 天`);
            }
            _saveData();
            _renderChallenges();
        }
    }

    function _challengeUndo(id) {
        const ch = data.challenges.find(c => c.id === id);
        if (ch && ch.currentDays > 0) {
            ch.currentDays--;
            _saveData();
            _renderChallenges();
            App.showToast('已撤销打卡', { type: 'info', duration: 2000 });
        }
    }

    // 查看挑战详情（含作品照片视频）
    function _viewChallenge(id) {
        const ch = data.challenges.find(c => c.id === id);
        if (!ch) return;

        if (!ch.dailyRecords) ch.dailyRecords = {};

        const today = _today();
        const todayRecord = ch.dailyRecords[today] || { media: [], note: '' };

        // 获取最近7天的记录
        const recentDays = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = App.formatDate(d);
            recentDays.push({ date: dateStr, record: ch.dailyRecords[dateStr] });
        }

        const allMedia = [];
        Object.values(ch.dailyRecords).forEach(rec => {
            if (rec.media) allMedia.push(...rec.media);
        });

        const html = `
            <div class="challenge-detail">
                <div style="text-align: center; margin-bottom: var(--spacing-md);">
                    <div style="font-size: 32px; margin-bottom: 8px;">${ch.icon}</div>
                    <div style="font-size: 18px; font-weight: 600;">${_esc(ch.title)}</div>
                    <div style="font-size: 13px; color: var(--color-text-secondary); margin-top: 4px;">${_esc(ch.description || '')}</div>
                </div>

                <div style="display: flex; justify-content: space-around; text-align: center; margin-bottom: var(--spacing-md); padding: var(--spacing-sm); background: var(--color-bg-secondary); border-radius: 10px;">
                    <div>
                        <div style="font-size: 20px; font-weight: 700; color: ${ch.color};">${ch.currentDays || 0}</div>
                        <div style="font-size: 12px; color: var(--color-text-secondary);">已打卡</div>
                    </div>
                    <div>
                        <div style="font-size: 20px; font-weight: 700;">${ch.targetDays || 0}</div>
                        <div style="font-size: 12px; color: var(--color-text-secondary);">目标天数</div>
                    </div>
                    <div>
                        <div style="font-size: 20px; font-weight: 700;">${allMedia.length}</div>
                        <div style="font-size: 12px; color: var(--color-text-secondary);">作品数</div>
                    </div>
                </div>

                <!-- 编辑打卡天数 -->
                <div style="display: flex; gap: 8px; margin-bottom: var(--spacing-md);">
                    <button class="btn btn-outline btn-sm" id="chEditDaysBtn" style="flex: 1;" type="button">✏️ 调整打卡天数</button>
                    <button class="btn btn-outline btn-sm" id="chEditTargetBtn" style="flex: 1;" type="button">🎯 修改目标天数</button>
                </div>

                <!-- 今日打卡上传 -->
                <div class="form-group">
                    <label class="form-label">今日作品上传</label>
                    <div class="media-upload-area">
                        <button class="btn btn-outline btn-sm" id="chUploadImgBtn" type="button">📷 添加照片</button>
                        <button class="btn btn-outline btn-sm" id="chUploadVideoBtn" type="button">🎬 添加视频</button>
                        <input type="file" id="chImageInput" accept="image/*" style="display:none;" multiple>
                        <input type="file" id="chVideoInput" accept="video/*" style="display:none;">
                    </div>
                    <div class="media-preview-grid" id="chMediaPreview"></div>
                </div>
                <div class="form-group">
                    <label class="form-label">今日心得</label>
                    <textarea class="form-textarea" id="chTodayNote" rows="2" placeholder="今天画画的心得...">${_esc(todayRecord.note || '')}</textarea>
                </div>
                <button class="btn btn-primary btn-block" id="chSaveTodayBtn">保存今日打卡作品</button>

                <!-- 最近作品 -->
                <div style="margin-top: var(--spacing-md);">
                    <div class="form-label">最近作品</div>
                    <div class="challenge-recent-media">
                        ${allMedia.length === 0 ? `
                            <div style="text-align: center; padding: var(--spacing-lg); color: var(--color-text-tertiary); font-size: 13px;">
                                还没有上传作品
                            </div>
                        ` : allMedia.slice(0, 12).map((m, idx) => `
                            <div class="media-thumb" data-action="ch-view-media" data-idx="${idx}">
                                ${m.type === 'image' 
                                    ? `<img src="${m.data}" alt="">` 
                                    : `<div class="video-thumb-sm"><span class="play-icon">▶</span></div>`
                                }
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        App.openModal('挑战详情', html, {
            width: '90%',
            maxWidth: '500px',
            onOpen: () => {
                let todayMedia = [...(todayRecord.media || [])];

                function renderPreview() {
                    const container = document.getElementById('chMediaPreview');
                    if (!container) return;
                    if (todayMedia.length === 0) {
                        container.innerHTML = '<div class="empty-state-sm">今日还没有上传作品</div>';
                        return;
                    }
                    container.innerHTML = todayMedia.map((m, idx) => `
                        <div class="media-thumb-item">
                            <div class="media-thumb">
                                ${m.type === 'image' 
                                    ? `<img src="${m.data}" alt="">` 
                                    : `<div class="video-thumb-sm"><span class="play-icon">▶</span></div>`
                                }
                            </div>
                            <button class="media-remove" data-idx="${idx}">×</button>
                        </div>
                    `).join('');
                    container.querySelectorAll('.media-remove').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const idx = parseInt(btn.dataset.idx);
                            todayMedia.splice(idx, 1);
                            renderPreview();
                        });
                    });
                }

                renderPreview();

                // 上传图片
                document.getElementById('chUploadImgBtn')?.addEventListener('click', () => {
                    document.getElementById('chImageInput')?.click();
                });
                document.getElementById('chImageInput')?.addEventListener('change', (e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(file => {
                        if (!file.type.startsWith('image/')) return;
                        _compressImage(file, 1200, 0.75).then(compressedData => {
                            todayMedia.push({
                                type: 'image',
                                data: compressedData,
                                name: file.name,
                                createdAt: Date.now(),
                            });
                            renderPreview();
                        });
                    });
                    e.target.value = '';
                });

                // 上传视频
                document.getElementById('chUploadVideoBtn')?.addEventListener('click', () => {
                    document.getElementById('chVideoInput')?.click();
                });
                document.getElementById('chVideoInput')?.addEventListener('change', (e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(file => {
                        if (!file.type.startsWith('video/')) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            todayMedia.push({
                                type: 'video',
                                data: ev.target.result,
                                name: file.name,
                                size: file.size,
                                createdAt: Date.now(),
                            });
                            renderPreview();
                        };
                        reader.readAsDataURL(file);
                    });
                    e.target.value = '';
                });

                // 保存今日
                document.getElementById('chSaveTodayBtn')?.addEventListener('click', () => {
                    const note = document.getElementById('chTodayNote')?.value?.trim() || '';
                    if (!ch.dailyRecords) ch.dailyRecords = {};
                    ch.dailyRecords[today] = {
                        media: todayMedia,
                        note,
                        createdAt: Date.now(),
                    };
                    // 如果今天有内容但还没打卡，自动+1天
                    if ((todayMedia.length > 0 || note) && !ch.dailyRecords[today]?.checkedIn) {
                        // 不自动加天数，用户手动打卡
                    }
                    _saveData();
                    _renderChallenges();
                    App.showToast('已保存今日作品');
                    App.closeModal();
                });

                // 调整打卡天数
                document.getElementById('chEditDaysBtn')?.addEventListener('click', async () => {
                    const html = `
                        <div class="form-group">
                            <label class="form-label">当前打卡天数</label>
                            <input type="number" class="form-input" id="editDaysInput" value="${ch.currentDays || 0}" min="0">
                            <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 6px;">
                                可以手动调整已打卡的天数，比如补卡或修正
                            </div>
                        </div>
                        <div class="mt-lg">
                            <button class="btn btn-primary btn-block" id="confirmEditDaysBtn">确认修改</button>
                        </div>
                    `;
                    App.openModal('调整打卡天数', html, {
                        width: '80%',
                        maxWidth: '360px',
                        onOpen: () => {
                            document.getElementById('confirmEditDaysBtn')?.addEventListener('click', () => {
                                const newDays = parseInt(document.getElementById('editDaysInput')?.value) || 0;
                                ch.currentDays = Math.max(0, newDays);
                                _saveData();
                                _renderChallenges();
                                App.closeModal();
                                App.closeModal(); // 关闭两层modal
                                _viewChallenge(ch.id); // 重新打开详情刷新显示
                                App.showToast('已更新打卡天数');
                            });
                        },
                    });
                });

                // 修改目标天数
                document.getElementById('chEditTargetBtn')?.addEventListener('click', async () => {
                    const html = `
                        <div class="form-group">
                            <label class="form-label">目标天数</label>
                            <input type="number" class="form-input" id="editTargetInput" value="${ch.targetDays || 30}" min="1">
                            <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 6px;">
                                设置这个挑战的目标总天数
                            </div>
                        </div>
                        <div class="mt-lg">
                            <button class="btn btn-primary btn-block" id="confirmEditTargetBtn">确认修改</button>
                        </div>
                    `;
                    App.openModal('修改目标天数', html, {
                        width: '80%',
                        maxWidth: '360px',
                        onOpen: () => {
                            document.getElementById('confirmEditTargetBtn')?.addEventListener('click', () => {
                                const newTarget = parseInt(document.getElementById('editTargetInput')?.value) || 30;
                                ch.targetDays = Math.max(1, newTarget);
                                _saveData();
                                _renderChallenges();
                                App.closeModal();
                                App.closeModal(); // 关闭两层modal
                                _viewChallenge(ch.id); // 重新打开详情刷新显示
                                App.showToast('已更新目标天数');
                            });
                        },
                    });
                });

                // 查看媒体
                document.querySelectorAll('[data-action="ch-view-media"]').forEach(item => {
                    item.addEventListener('click', () => {
                        const idx = parseInt(item.dataset.idx);
                        const m = allMedia[idx];
                        if (!m) return;
                        let content;
                        if (m.type === 'image') {
                            content = `<div style="text-align:center;"><img src="${m.data}" style="max-width:100%; max-height:70vh; border-radius:12px;"></div>`;
                        } else {
                            content = `<video src="${m.data}" controls style="width:100%; max-height:70vh; border-radius:12px;"></video>`;
                        }
                        App.openModal(m.name || '作品', content, { width: '95%' });
                    });
                });
            },
        });
    }

    async function _deleteChallenge(id) {
        const confirmed = await App.confirmModal('确认删除', '确定要删除这个挑战吗？进度将无法恢复。');
        if (confirmed) {
            data.challenges = data.challenges.filter(c => c.id !== id);
            _saveData();
            _renderChallenges();
            App.showSuccess('已删除');
        }
    }

    // ============================================================
    // 10. 事件绑定
    // ============================================================

    function _bindEvents() {
        if (!containerEl) return;

        // 网盘入口
        containerEl.querySelectorAll('[data-action="open-pan"]').forEach(el => {
            el.addEventListener('click', () => {
                App.showToast('正在打开百度网盘...', { type: 'info', duration: 2000 });
            });
        });

        // 编辑长期目标
        containerEl.querySelector('[data-action="edit-goals"]')?.addEventListener('click', () => {
            _openGoalsModal();
        });

        // 编辑今日记录
        containerEl.querySelector('[data-action="edit-today"]')?.addEventListener('click', () => {
            _openTodayModal();
        });

        // 画廊操作
        containerEl.querySelector('[data-action="add-gallery"]')?.addEventListener('click', () => {
            _openGalleryModal();
        });
        containerEl.querySelectorAll('[data-action="edit-gallery"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = data.gallery.find(g => g.id === btn.dataset.id);
                if (item) _openGalleryModal(item);
            });
        });
        containerEl.querySelectorAll('[data-action="delete-gallery"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _deleteGalleryItem(btn.dataset.id);
            });
        });

        // 挑战操作
        containerEl.querySelector('[data-action="add-challenge"]')?.addEventListener('click', () => {
            _openChallengeModal();
        });
        containerEl.querySelectorAll('[data-action="challenge-checkin"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _challengeCheckin(btn.dataset.id);
            });
        });
        containerEl.querySelectorAll('[data-action="challenge-undo"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _challengeUndo(btn.dataset.id);
            });
        });
        containerEl.querySelectorAll('[data-action="edit-challenge"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const ch = data.challenges.find(c => c.id === btn.dataset.id);
                if (ch) _openChallengeModal(ch);
            });
        });
        containerEl.querySelectorAll('[data-action="delete-challenge"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _deleteChallenge(btn.dataset.id);
            });
        });

        // 查看挑战详情
        containerEl.querySelectorAll('[data-action="view-challenge"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _viewChallenge(btn.dataset.id);
            });
        });

        // 日历开关
        containerEl.querySelector('[data-action="toggle-calendar"]')?.addEventListener('click', () => {
            showCalendar = !showCalendar;
            render(containerEl);
        });

        // 日期导航
        containerEl.querySelector('[data-action="prev-day-draw"]')?.addEventListener('click', () => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() - 1);
            currentDate = App.formatDate(d);
            _renderDailyRecord();
            render(containerEl);
        });

        containerEl.querySelector('[data-action="next-day-draw"]')?.addEventListener('click', () => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() + 1);
            currentDate = App.formatDate(d);
            _renderDailyRecord();
            render(containerEl);
        });

        containerEl.querySelector('[data-action="goto-today-draw"]')?.addEventListener('click', () => {
            currentDate = _today();
            _renderDailyRecord();
            render(containerEl);
        });

        // 日历月份切换
        containerEl.querySelector('[data-action="prev-month-draw"]')?.addEventListener('click', () => {
            calendarMonth--;
            if (calendarMonth < 0) {
                calendarMonth = 11;
                calendarYear--;
            }
            render(containerEl);
        });

        containerEl.querySelector('[data-action="next-month-draw"]')?.addEventListener('click', () => {
            calendarMonth++;
            if (calendarMonth > 11) {
                calendarMonth = 0;
                calendarYear++;
            }
            render(containerEl);
        });

        // 日历日期点击
        containerEl.querySelectorAll('[data-action="draw-cal-day"]').forEach(day => {
            day.addEventListener('click', (e) => {
                e.stopPropagation();
                const date = day.dataset.date;
                if (date) {
                    currentDate = date;
                    showCalendar = false;
                    render(containerEl);
                }
            });
        });
    }

    // ============================================================
    // 11. onAdd / onResume
    // ============================================================

    function onAdd() {
        _openGalleryModal();
    }

    function onResume() {
        if (containerEl) {
            _loadData();
            render(containerEl);
        }
    }

    // ============================================================
    // 12. 导出
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
    App.registerModule('drawing', DrawingModule);
}
