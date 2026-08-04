/**
 * ai.js - AI视频创作模块
 * 功能分区：
 *   1. 百度网盘素材库入口
 *   2. 模块长期总目标（近期/中期/远期/终极）
 *   3. 当日AI学习记录区
 *   4. 提示词记录收藏区（分类管理、搜索、收藏）
 *   5. AI工具列表
 */

const AiModule = (function() {
    'use strict';

    // ============================================================
    // 1. 数据结构与默认值
    // ============================================================
    const STORAGE_KEY = 'ai';

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
        { value: 'in_progress', label: '学习中', icon: '🤖', color: '#f5c89a' },
        { value: 'reviewing', label: '复习中', icon: '🔄', color: '#a8c9e8' },
        { value: 'completed', label: '已完成', icon: '✅', color: '#7ec8a7' },
    ];

    // 待办项定义
    const TODO_ITEMS = [
        { key: 'browse_bili', label: '浏览B站AI教程', icon: '📺' },
        { key: 'record_prompts', label: '记录实用提示词', icon: '💡' },
    ];

    // 提示词分类
    const PROMPT_CATEGORIES = [
        { id: 'cat1', name: '视频生成', icon: '🎬', color: '#a8c9e8' },
        { id: 'cat2', name: '图像生成', icon: '🖼️', color: '#f4b8c4' },
        { id: 'cat3', name: '文案创作', icon: '📝', color: '#7ec8a7' },
        { id: 'cat4', name: '音频处理', icon: '🎵', color: '#c9b8e0' },
        { id: 'cat5', name: '效率工具', icon: '⚡', color: '#f5c89a' },
    ];

    // 默认AI工具列表
    const DEFAULT_TOOLS = [
        {
            id: 'ait1',
            name: 'Runway',
            category: '视频生成',
            icon: '🎬',
            url: '',
            description: 'AI视频生成和编辑工具',
            color: '#a8c9e8',
            createdAt: Date.now(),
        },
        {
            id: 'ait2',
            name: 'Midjourney',
            category: '图像生成',
            icon: '🖼️',
            url: '',
            description: '高质量AI图像生成工具',
            color: '#f4b8c4',
            createdAt: Date.now(),
        },
        {
            id: 'ait3',
            name: 'Suno',
            category: '音频处理',
            icon: '🎵',
            url: '',
            description: 'AI音乐生成工具',
            color: '#c9b8e0',
            createdAt: Date.now(),
        },
        {
            id: 'ait4',
            name: 'ChatGPT',
            category: '文案创作',
            icon: '💬',
            url: '',
            description: '通用AI对话助手',
            color: '#7ec8a7',
            createdAt: Date.now(),
        },
    ];

    // 默认提示词
    const DEFAULT_PROMPTS = [
        {
            id: 'p1',
            title: '电影感运镜视频',
            content: 'Create a cinematic video with smooth camera movement, golden hour lighting, and 4K quality',
            category: 'cat1',
            favorite: true,
            tags: ['视频', '电影感', '运镜'],
            createdAt: Date.now(),
        },
        {
            id: 'p2',
            title: '赛博朋克城市',
            content: 'Cyberpunk city at night, neon lights, rain, reflective streets, ultra detailed, 8k',
            category: 'cat2',
            favorite: true,
            tags: ['图像', '赛博朋克', '城市'],
            createdAt: Date.now(),
        },
    ];

    // 默认数据
    function _getDefaultData() {
        return {
            // 长期目标 - 空白
            longTermGoals: {
                near: { title: '', content: '', progress: 0, icon: '🌱', color: '#a8c9e8' },
                mid: { title: '', content: '', progress: 0, icon: '🌿', color: '#c9b8e0' },
                far: { title: '', content: '', progress: 0, icon: '🌳', color: '#f4b8c4' },
                ultimate: { title: '', content: '', progress: 0, icon: '🏆', color: '#f5c89a' },
            },
            // 提示词收藏 - 空白
            prompts: [],
            // AI工具列表 - 空白
            tools: [],
            // 我的素材库（支持照片上传）
            materials: [],
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
    let currentPromptCategory = 'all';
    let promptSearchKeyword = '';

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
                notes: '',
                status: 'not_started',
                images: [],
                customTasks: [],
            };
        }
        return data.dailyRecords[dateStr];
    }

    function _renderAiCalendar() {
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
            const hasContent = record && (record.notes || (record.images && record.images.length > 0) || Object.keys(record.todos || {}).length > 0);

            html += `
                <div class="cal-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasContent ? 'has-content' : ''}"
                     data-date="${dateStr}" data-action="ai-cal-day">
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

    function _getCategoryInfo(catId) {
        return PROMPT_CATEGORIES.find(c => c.id === catId) || { name: '未分类', icon: '📁', color: '#a8a39d' };
    }

    /**
     * 获取今日学习记录
     */
    function _getTodayRecord() {
        const today = _today();
        if (!data.dailyRecords[today]) {
            data.dailyRecords[today] = {
                todos: {},
                notes: '',
                status: 'not_started',
                images: [],
                customTasks: [],
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
            <div class="ai-module">
                <!-- 快捷入口 -->
                <div class="quick-links-bar">
                    <a class="quick-link-btn bilibili" href="https://www.bilibili.com" target="_blank" rel="noopener">
                        <span class="ql-icon">📺</span>
                        <span class="ql-text">哔哩哔哩</span>
                        <span class="ql-arrow">↗</span>
                    </a>
                    <a class="quick-link-btn baidu" href="https://pan.baidu.com" target="_blank" rel="noopener">
                        <span class="ql-icon">☁️</span>
                        <span class="ql-text">百度网盘</span>
                        <span class="ql-arrow">↗</span>
                    </a>
                </div>

                <!-- 我的素材库 -->
                <div class="section-title">
                    <h2><span class="title-icon">📸</span>我的素材库</h2>
                    <span class="section-action" data-action="add-material">+ 上传</span>
                </div>
                <div class="materials-grid" id="aiMaterialsGrid">
                    ${_renderMaterials()}
                </div>
                <input type="file" id="materialFileInput" accept="image/*" style="display: none;" multiple>

                <!-- 模块长期总目标 -->
                <div class="section-title">
                    <h2><span class="title-icon">🎯</span>模块长期总目标</h2>
                    <span class="section-action" data-action="edit-goals">编辑</span>
                </div>
                <div class="goals-vertical" id="aiLongTermGoals"></div>

                <!-- 当日AI学习记录区 -->
                <div class="section-title">
                    <h2><span class="title-icon">📝</span><span id="aiRecordTitle">今日</span>AI学习记录</h2>
                    <span class="section-action" data-action="toggle-calendar">📆 日历</span>
                </div>
                <div class="record-date-nav">
                    <button class="btn-icon btn-sm" data-action="prev-day-ai">◀</button>
                    <span class="record-date-text" id="aiRecordDate">${_formatDateShort(currentDate)}</span>
                    <button class="btn-icon btn-sm" data-action="next-day-ai">▶</button>
                    ${currentDate !== _today() ? '<button class="btn-text" data-action="goto-today-ai">回到今天</button>' : ''}
                </div>
                ${showCalendar ? `
                <div class="card calendar-mini-card">
                    <div class="month-nav month-nav-sm">
                        <button class="btn-icon btn-sm" data-action="prev-month-ai">◀</button>
                        <div class="month-label-sm">${calendarYear}年${calendarMonth + 1}月</div>
                        <button class="btn-icon btn-sm" data-action="next-month-ai">▶</button>
                    </div>
                    <div class="ai-calendar-mini">
                        ${_renderAiCalendar()}
                    </div>
                </div>
                ` : ''}
                <div class="card daily-record-card" id="aiDailyRecord"></div>

                <!-- 提示词记录收藏区 -->
                <div class="section-title">
                    <h2><span class="title-icon">💡</span>提示词收藏库</h2>
                    <span class="section-action" data-action="add-prompt">+ 新增</span>
                </div>
                <div class="prompt-toolbar">
                    <div class="prompt-search">
                        <span class="search-icon">🔍</span>
                        <input type="text" class="form-input search-input" id="promptSearchInput" 
                               placeholder="搜索提示词..." value="${_esc(promptSearchKeyword)}">
                    </div>
                    <div class="prompt-category-filter">
                        <button class="cat-chip ${currentPromptCategory === 'all' ? 'active' : ''}" data-cat="all">
                            全部
                        </button>
                        ${PROMPT_CATEGORIES.map(cat => `
                            <button class="cat-chip ${currentPromptCategory === cat.id ? 'active' : ''}" 
                                    data-cat="${cat.id}"
                                    style="--cat-color: ${cat.color};">
                                ${cat.icon} ${cat.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="prompt-grid" id="aiPromptGrid"></div>

                <!-- AI工具列表 -->
                <div class="section-title">
                    <h2><span class="title-icon">🛠️</span>AI工具库</h2>
                    <span class="section-action" data-action="add-tool">+ 添加工具</span>
                </div>
                <div class="tools-grid" id="aiToolsGrid"></div>
            </div>
        `;

        _renderLongTermGoals();
        _renderDailyRecord();
        _renderPrompts();
        _renderTools();
        _bindEvents();
    }

    // ============================================================
    // 6. 素材库渲染
    // ============================================================

    function _renderMaterials() {
        if (!data.materials || data.materials.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🖼️</div>
                    <div class="empty-title">还没有素材</div>
                    <div class="empty-desc">点击右上角「上传」添加图片素材</div>
                </div>
            `;
        }

        return data.materials.map((item, index) => `
            <div class="material-item" data-index="${index}">
                <div class="material-image">
                    <img src="${item.imageData || ''}" alt="${_esc(item.title)}" onclick="_viewMaterialImage(${index})">
                    <div class="material-actions">
                        <button class="material-action-btn" data-action="delete-material" data-index="${index}" title="删除">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="material-title">${_esc(item.title || '未命名')}</div>
                <div class="material-date">${item.date || ''}</div>
            </div>
        `).join('');
    }

    function _refreshMaterials() {
        const grid = containerEl?.querySelector('#aiMaterialsGrid');
        if (grid) {
            grid.innerHTML = _renderMaterials();
            _bindMaterialEvents();
        }
    }

    function _bindMaterialEvents() {
        if (!containerEl) return;

        // 删除素材
        containerEl.querySelectorAll('[data-action="delete-material"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                App.confirmModal('删除素材', '确定要删除这个素材吗？', () => {
                    data.materials.splice(index, 1);
                    _saveData();
                    _refreshMaterials();
                    App.showToast('已删除');
                });
            });
        });
    }

    // 查看大图（全局函数，供onclick调用）
    window._viewMaterialImage = function(index) {
        const item = data.materials[index];
        if (!item || !item.imageData) return;
        App.openModal({
            title: item.title || '素材图片',
            content: `
                <div style="text-align: center;">
                    <img src="${item.imageData}" style="max-width: 100%; max-height: 70vh; border-radius: 12px;">
                    ${item.note ? `<p style="margin-top: 16px; color: var(--color-text-secondary);">${_esc(item.note)}</p>` : ''}
                </div>
            `,
            showFooter: false,
        });
    };

    // ============================================================
    // 7. 长期目标渲染
    // ============================================================
    // 按打卡天数自动计算目标进度
    // 近期: 90天, 中期: 180天, 远期: 365天, 终极: 730天
    function _calcGoalProgress(key) {
        const checkinDays = Object.keys(data.dailyRecords).filter(d => {
            const rec = data.dailyRecords[d];
            return rec && (rec.notes || (rec.images && rec.images.length > 0) || Object.keys(rec.todos || {}).some(k => rec.todos[k]));
        }).length;
        const dayMap = { near: 90, mid: 180, far: 365, ultimate: 730 };
        const targetDays = dayMap[key] || 90;
        const progress = Math.min(100, Math.round((checkinDays / targetDays) * 1000) / 10);
        return progress;
    }

    function _renderLongTermGoals() {
        const goalsEl = containerEl.querySelector('#aiLongTermGoals');
        if (!goalsEl) return;

        const goals = data.longTermGoals;
        const goalKeys = ['near', 'mid', 'far', 'ultimate'];

        const checkinDays = Object.keys(data.dailyRecords).filter(d => {
            const rec = data.dailyRecords[d];
            return rec && (rec.notes || (rec.images && rec.images.length > 0) || Object.keys(rec.todos || {}).some(k => rec.todos[k]));
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
    // 7. 当日学习记录渲染与操作
    // ============================================================

    function _renderDailyRecord() {
        const recEl = containerEl.querySelector('#aiDailyRecord');
        if (!recEl) return;

        const rec = _getDayRecord(currentDate);
        const statusInfo = _getStatusInfo(rec.status);

        // 更新标题
        const titleEl = containerEl.querySelector('#aiRecordTitle');
        if (titleEl) {
            titleEl.textContent = currentDate === _today() ? '今日' : _formatDateShort(currentDate);
        }
        const dateEl = containerEl.querySelector('#aiRecordDate');
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
                    <div class="record-section-title">学习笔记</div>
                    <div class="record-notes">${_esc(rec.notes || '暂无笔记')}</div>
                </div>
                ${rec.images && rec.images.length > 0 ? `
                    <div class="record-section">
                        <div class="record-section-title">图片记录</div>
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
                <label class="form-label">自定义任务</label>
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
                <label class="form-label">学习笔记</label>
                <textarea class="form-textarea" id="recNotes" placeholder="记录学习心得、发现的好用工具...">${_esc(rec.notes || '')}</textarea>
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
                <label class="form-label">上传图片</label>
                <div class="image-upload-area" id="imageUploadArea">
                    <div class="upload-placeholder">📷 点击上传图片</div>
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
                        notes: document.getElementById('recNotes').value.trim(),
                        status: document.getElementById('recStatus').value,
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
    // 8. 提示词收藏渲染与操作
    // ============================================================

    function _renderPrompts() {
        const grid = containerEl.querySelector('#aiPromptGrid');
        if (!grid) return;

        let prompts = data.prompts || [];

        // 分类过滤
        if (currentPromptCategory !== 'all') {
            prompts = prompts.filter(p => p.category === currentPromptCategory);
        }

        // 搜索过滤
        if (promptSearchKeyword) {
            const kw = promptSearchKeyword.toLowerCase();
            prompts = prompts.filter(p =>
                p.title.toLowerCase().includes(kw) ||
                p.content.toLowerCase().includes(kw) ||
                (p.tags || []).some(t => t.toLowerCase().includes(kw))
            );
        }

        if (prompts.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💡</div>
                    <div class="empty-state-text">
                        ${promptSearchKeyword ? '没有找到匹配的提示词' : '还没有收藏的提示词，点击上方新增'}
                    </div>
                </div>
            `;
            return;
        }

        grid.innerHTML = prompts.map(prompt => {
            const cat = _getCategoryInfo(prompt.category);
            return `
                <div class="card prompt-card" data-prompt-id="${prompt.id}">
                    <div class="prompt-card-header">
                        <div class="prompt-cat-badge" style="background: ${cat.color}20; color: ${cat.color};">
                            ${cat.icon} ${cat.name}
                        </div>
                        <div class="prompt-favorite ${prompt.favorite ? 'active' : ''}" data-action="toggle-favorite" data-id="${prompt.id}">
                            ${prompt.favorite ? '⭐' : '☆'}
                        </div>
                    </div>
                    <h3 class="prompt-title">${_esc(prompt.title)}</h3>
                    <div class="prompt-content">${_esc(prompt.content)}</div>
                    ${prompt.tags && prompt.tags.length > 0 ? `
                        <div class="prompt-tags">
                            ${prompt.tags.map(tag => `<span class="tag">#${_esc(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="prompt-actions">
                        <button class="btn btn-sm btn-outline" data-action="copy-prompt" data-id="${prompt.id}">
                            📋 复制
                        </button>
                        <button class="btn-icon btn-sm" data-action="edit-prompt" data-id="${prompt.id}" title="编辑">✏️</button>
                        <button class="btn-icon btn-sm" data-action="delete-prompt" data-id="${prompt.id}" title="删除">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function _openPromptModal(prompt = null) {
        const isEdit = !!prompt;
        const html = `
            <div class="form-group">
                <label class="form-label">提示词标题</label>
                <input type="text" class="form-input" id="promptTitle" value="${_esc(prompt?.title || '')}" placeholder="例如：电影感视频">
            </div>
            <div class="form-group">
                <label class="form-label">提示词内容</label>
                <textarea class="form-textarea" id="promptContent" rows="4" placeholder="输入提示词内容...">${_esc(prompt?.content || '')}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">分类</label>
                    <select class="form-select" id="promptCategory">
                        ${PROMPT_CATEGORIES.map(cat => `
                            <option value="${cat.id}" ${prompt?.category === cat.id ? 'selected' : ''}>
                                ${cat.icon} ${cat.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">收藏</label>
                    <label class="form-checkbox">
                        <input type="checkbox" id="promptFavorite" ${prompt?.favorite ? 'checked' : ''}>
                        <span>加入收藏</span>
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">标签（用逗号分隔）</label>
                <input type="text" class="form-input" id="promptTags" value="${_esc((prompt?.tags || []).join(', '))}" placeholder="例如：视频, 电影感, 运镜">
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="savePromptBtn">${isEdit ? '保存修改' : '添加提示词'}</button>
            </div>
        `;

        App.openModal(isEdit ? '编辑提示词' : '新增提示词', html, {
            onOpen: () => {
                document.getElementById('savePromptBtn')?.addEventListener('click', () => {
                    const title = document.getElementById('promptTitle').value.trim();
                    const content = document.getElementById('promptContent').value.trim();
                    if (!title) {
                        App.showError('请输入标题');
                        return;
                    }
                    if (!content) {
                        App.showError('请输入提示词内容');
                        return;
                    }

                    const tagsStr = document.getElementById('promptTags').value;
                    const tags = tagsStr ? tagsStr.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [];

                    const promptData = {
                        title,
                        content,
                        category: document.getElementById('promptCategory').value,
                        favorite: document.getElementById('promptFavorite').checked,
                        tags,
                    };

                    if (isEdit) {
                        const idx = data.prompts.findIndex(p => p.id === prompt.id);
                        if (idx > -1) {
                            data.prompts[idx] = { ...data.prompts[idx], ...promptData };
                        }
                        App.showSuccess('提示词已更新');
                    } else {
                        promptData.id = _genId('p');
                        promptData.createdAt = Date.now();
                        data.prompts.push(promptData);
                        App.showSuccess('提示词已添加');
                    }

                    _saveData();
                    _renderPrompts();
                    App.closeModal();
                });
            }
        });
    }

    function _toggleFavorite(id) {
        const prompt = data.prompts.find(p => p.id === id);
        if (prompt) {
            prompt.favorite = !prompt.favorite;
            _saveData();
            _renderPrompts();
        }
    }

    function _copyPrompt(id) {
        const prompt = data.prompts.find(p => p.id === id);
        if (prompt) {
            navigator.clipboard?.writeText(prompt.content).then(() => {
                App.showSuccess('已复制到剪贴板');
            }).catch(() => {
                App.showToast('复制成功', { type: 'success', duration: 2000 });
            });
        }
    }

    async function _deletePrompt(id) {
        const confirmed = await App.confirmModal('确认删除', '确定要删除这个提示词吗？');
        if (confirmed) {
            data.prompts = data.prompts.filter(p => p.id !== id);
            _saveData();
            _renderPrompts();
            App.showSuccess('已删除');
        }
    }

    // ============================================================
    // 9. AI工具列表渲染与操作
    // ============================================================

    function _renderTools() {
        const grid = containerEl.querySelector('#aiToolsGrid');
        if (!grid) return;

        const tools = data.tools || [];

        if (tools.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🛠️</div>
                    <div class="empty-state-text">还没有AI工具，点击上方添加</div>
                </div>
            `;
            return;
        }

        grid.innerHTML = tools.map(tool => {
            const cat = PROMPT_CATEGORIES.find(c => c.name === tool.category) || { color: tool.color || '#a8c9e8' };
            return `
                <div class="card tool-card card-clickable" data-tool-id="${tool.id}">
                    <div class="tool-icon" style="background: ${cat.color}20; color: ${cat.color};">
                        ${tool.icon || '🤖'}
                    </div>
                    <h3 class="tool-name">${_esc(tool.name)}</h3>
                    <div class="tool-category">${_esc(tool.category || '')}</div>
                    <div class="tool-desc">${_esc(tool.description || '')}</div>
                    <div class="tool-actions">
                        <button class="btn-icon btn-sm" data-action="edit-tool" data-id="${tool.id}" title="编辑">✏️</button>
                        <button class="btn-icon btn-sm" data-action="delete-tool" data-id="${tool.id}" title="删除">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function _openToolModal(tool = null) {
        const isEdit = !!tool;
        const html = `
            <div class="form-group">
                <label class="form-label">工具名称</label>
                <input type="text" class="form-input" id="toolName" value="${_esc(tool?.name || '')}" placeholder="例如：Runway">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">图标</label>
                    <input type="text" class="form-input" id="toolIcon" value="${_esc(tool?.icon || '🤖')}" placeholder="emoji图标">
                </div>
                <div class="form-group">
                    <label class="form-label">分类</label>
                    <input type="text" class="form-input" id="toolCategory" value="${_esc(tool?.category || '')}" placeholder="例如：视频生成">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">工具链接</label>
                <input type="text" class="form-input" id="toolUrl" value="${_esc(tool?.url || '')}" placeholder="https://">
            </div>
            <div class="form-group">
                <label class="form-label">工具描述</label>
                <textarea class="form-textarea" id="toolDesc" placeholder="简单描述这个工具的用途...">${_esc(tool?.description || '')}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">主题色</label>
                <div class="color-picker">
                    ${COLORS.map((c, i) => `
                        <button class="color-dot ${tool?.color === c ? 'selected' : ''}" 
                                data-color="${c}" 
                                style="background: ${c};"
                                title="${c}"></button>
                    `).join('')}
                </div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveToolBtn">${isEdit ? '保存修改' : '添加工具'}</button>
            </div>
        `;

        App.openModal(isEdit ? '编辑工具' : '添加工具', html, {
            onOpen: () => {
                let selectedColor = tool?.color || COLORS[0];

                document.querySelectorAll('.color-dot').forEach(dot => {
                    dot.addEventListener('click', () => {
                        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
                        dot.classList.add('selected');
                        selectedColor = dot.dataset.color;
                    });
                });

                document.getElementById('saveToolBtn')?.addEventListener('click', () => {
                    const name = document.getElementById('toolName').value.trim();
                    if (!name) {
                        App.showError('请输入工具名称');
                        return;
                    }

                    const toolData = {
                        name,
                        icon: document.getElementById('toolIcon').value.trim() || '🤖',
                        category: document.getElementById('toolCategory').value.trim(),
                        url: document.getElementById('toolUrl').value.trim(),
                        description: document.getElementById('toolDesc').value.trim(),
                        color: selectedColor,
                    };

                    if (isEdit) {
                        const idx = data.tools.findIndex(t => t.id === tool.id);
                        if (idx > -1) {
                            data.tools[idx] = { ...data.tools[idx], ...toolData };
                        }
                        App.showSuccess('工具已更新');
                    } else {
                        toolData.id = _genId('ait');
                        toolData.createdAt = Date.now();
                        data.tools.push(toolData);
                        App.showSuccess('工具已添加');
                    }

                    _saveData();
                    _renderTools();
                    App.closeModal();
                });
            }
        });
    }

    async function _deleteTool(id) {
        const confirmed = await App.confirmModal('确认删除', '确定要删除这个工具吗？');
        if (confirmed) {
            data.tools = data.tools.filter(t => t.id !== id);
            _saveData();
            _renderTools();
            App.showSuccess('已删除');
        }
    }

    // ============================================================
    // 10. 事件绑定
    // ============================================================

    function _bindEvents() {
        if (!containerEl) return;

        // 上传素材
        containerEl.querySelector('[data-action="add-material"]')?.addEventListener('click', () => {
            containerEl.querySelector('#materialFileInput')?.click();
        });

        const fileInput = containerEl.querySelector('#materialFileInput');
        fileInput?.addEventListener('change', (e) => {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;

            let processed = 0;
            files.forEach(file => {
                if (!file.type.startsWith('image/')) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    // 压缩图片
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        const maxSize = 1200;

                        if (width > height && width > maxSize) {
                            height = (height / width) * maxSize;
                            width = maxSize;
                        } else if (height > maxSize) {
                            width = (width / height) * maxSize;
                            height = maxSize;
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        const compressedData = canvas.toDataURL('image/jpeg', 0.8);
                        const today = new Date().toISOString().split('T')[0];

                        data.materials.unshift({
                            id: _genId('mat'),
                            title: file.name.replace(/\.[^/.]+$/, ''),
                            imageData: compressedData,
                            date: today,
                            note: '',
                            createdAt: Date.now(),
                        });

                        processed++;
                        if (processed === files.length) {
                            _saveData();
                            _refreshMaterials();
                            App.showToast(`已添加 ${files.length} 个素材`);
                        }
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });

            // 清空input，允许重复选择同一文件
            fileInput.value = '';
        });

        // 绑定素材操作事件
        _bindMaterialEvents();

        // 编辑长期目标
        containerEl.querySelector('[data-action="edit-goals"]')?.addEventListener('click', () => {
            _openGoalsModal();
        });

        // 编辑今日记录
        containerEl.querySelector('[data-action="edit-today"]')?.addEventListener('click', () => {
            _openTodayModal();
        });

        // 日历开关
        containerEl.querySelector('[data-action="toggle-calendar"]')?.addEventListener('click', () => {
            showCalendar = !showCalendar;
            render(containerEl);
        });

        // 日期导航
        containerEl.querySelector('[data-action="prev-day-ai"]')?.addEventListener('click', () => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() - 1);
            currentDate = App.formatDate(d);
            _renderDailyRecord();
            render(containerEl);
        });

        containerEl.querySelector('[data-action="next-day-ai"]')?.addEventListener('click', () => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() + 1);
            currentDate = App.formatDate(d);
            _renderDailyRecord();
            render(containerEl);
        });

        containerEl.querySelector('[data-action="goto-today-ai"]')?.addEventListener('click', () => {
            currentDate = _today();
            _renderDailyRecord();
            render(containerEl);
        });

        // 日历月份切换
        containerEl.querySelector('[data-action="prev-month-ai"]')?.addEventListener('click', () => {
            calendarMonth--;
            if (calendarMonth < 0) {
                calendarMonth = 11;
                calendarYear--;
            }
            render(containerEl);
        });

        containerEl.querySelector('[data-action="next-month-ai"]')?.addEventListener('click', () => {
            calendarMonth++;
            if (calendarMonth > 11) {
                calendarMonth = 0;
                calendarYear++;
            }
            render(containerEl);
        });

        // 日历日期点击
        containerEl.querySelectorAll('[data-action="ai-cal-day"]').forEach(day => {
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

        // 提示词搜索
        const searchInput = containerEl.querySelector('#promptSearchInput');
        searchInput?.addEventListener('input', (e) => {
            promptSearchKeyword = e.target.value.trim();
            _renderPrompts();
        });

        // 提示词分类切换
        containerEl.querySelectorAll('.cat-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                currentPromptCategory = chip.dataset.cat;
                containerEl.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                _renderPrompts();
            });
        });

        // 新增提示词
        containerEl.querySelector('[data-action="add-prompt"]')?.addEventListener('click', () => {
            _openPromptModal();
        });

        // 提示词操作
        containerEl.querySelectorAll('[data-action="toggle-favorite"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _toggleFavorite(btn.dataset.id);
            });
        });
        containerEl.querySelectorAll('[data-action="copy-prompt"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _copyPrompt(btn.dataset.id);
            });
        });
        containerEl.querySelectorAll('[data-action="edit-prompt"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const prompt = data.prompts.find(p => p.id === btn.dataset.id);
                if (prompt) _openPromptModal(prompt);
            });
        });
        containerEl.querySelectorAll('[data-action="delete-prompt"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _deletePrompt(btn.dataset.id);
            });
        });

        // 添加工具
        containerEl.querySelector('[data-action="add-tool"]')?.addEventListener('click', () => {
            _openToolModal();
        });

        // 工具操作
        containerEl.querySelectorAll('[data-action="edit-tool"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tool = data.tools.find(t => t.id === btn.dataset.id);
                if (tool) _openToolModal(tool);
            });
        });
        containerEl.querySelectorAll('[data-action="delete-tool"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _deleteTool(btn.dataset.id);
            });
        });
    }

    // ============================================================
    // 11. onAdd / onResume
    // ============================================================

    function onAdd() {
        _openPromptModal();
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
    App.registerModule('ai', AiModule);
}
