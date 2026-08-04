/**
 * todo.js - 每日待办清单模块
 * 简洁版：日期导航 + 待办列表 + 添加/删除/勾选完成
 */

const TodoModule = (function() {
    'use strict';

    // ============================================================
    // 1. 数据结构与默认值
    // ============================================================
    const STORAGE_KEY = 'todo';

    // 默认待办任务
    const DEFAULT_TASKS = [
        { id: 't_english', name: '英语学习', icon: '📚', completed: false, order: 0 },
        { id: 't_pr', name: 'PR剪辑学习', icon: '🎬', completed: false, order: 1 },
        { id: 't_ai', name: 'AI工具学习', icon: '🤖', completed: false, order: 2 },
        { id: 't_attendance', name: '上下班考勤', icon: '🕐', completed: false, order: 3 },
        { id: 't_mood', name: '记录今日心情', icon: '💭', completed: false, order: 4 },
    ];

    // ============================================================
    // 2. 状态管理
    // ============================================================
    let data = null;
    let currentDate = null;
    let containerEl = null;

    // ============================================================
    // 3. 初始化
    // ============================================================
    function init() {
        _loadData();
    }

    function _loadData() {
        const stored = AppStorage.getModule(STORAGE_KEY);
        if (stored && stored.tasks && typeof stored.tasks === 'object') {
            data = stored;
        } else {
            data = {
                tasks: {}, // { 'YYYY-MM-DD': [ {id, name, icon, completed, order} ] }
            };
            AppStorage.setModule(STORAGE_KEY, data);
        }
        currentDate = _today();
    }

    function _saveData() {
        AppStorage.setModule(STORAGE_KEY, data);
    }

    /**
     * 获取某日的任务列表，如果不存在则从默认模板初始化
     */
    function _getDayTasks(dateStr) {
        if (!data.tasks[dateStr]) {
            // 从默认模板初始化（如果今天的话）
            if (dateStr === _today()) {
                data.tasks[dateStr] = JSON.parse(JSON.stringify(DEFAULT_TASKS));
            } else {
                data.tasks[dateStr] = [];
            }
            _saveData();
        }
        return data.tasks[dateStr].sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    // ============================================================
    // 4. 工具函数
    // ============================================================
    function _today() {
        const d = new Date();
        return App.formatDate(d);
    }

    function _genId() {
        return 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    function _esc(text) {
        return App.escapeHtml(text || '');
    }

    function _formatDateShort(dateStr) {
        const d = new Date(dateStr);
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        return `${d.getMonth() + 1}月${d.getDate()}日 周${weekDays[d.getDay()]}`;
    }

    // ============================================================
    // 5. 主渲染
    // ============================================================
    function render(container) {
        containerEl = container;
        _render();
    }

    function _render() {
        if (!containerEl) return;

        const tasks = _getDayTasks(currentDate);
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        const isToday = currentDate === _today();

        containerEl.innerHTML = `
            <div class="todo-module">
                <!-- 日期导航 -->
                <div class="todo-header">
                    <button class="btn-icon" data-action="prev-day" title="前一天">◀</button>
                    <div class="todo-date-info">
                        <div class="todo-date">${_formatDateShort(currentDate)}</div>
                        <div class="todo-progress-text">${completed}/${total} 已完成 · ${percent}%</div>
                    </div>
                    <button class="btn-icon" data-action="next-day" title="后一天">▶</button>
                </div>

                <!-- 进度条 -->
                <div class="progress progress-lg mb-md">
                    <div class="progress-bar" style="width: ${percent}%; background: linear-gradient(90deg, #7ec8a7, #4ecdc4);"></div>
                </div>

                <!-- 全部完成提示 -->
                ${total > 0 && completed === total ? `
                    <div class="todo-all-done">
                        <span class="all-done-icon">🎉</span>
                        <span class="all-done-text">太棒了！今日任务全部完成</span>
                    </div>
                ` : ''}

                <!-- 待办列表 -->
                <div class="todo-list" id="todoList">
                    ${tasks.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">📝</div>
                            <div class="empty-state-text">暂无待办事项</div>
                            <div class="empty-state-desc">点击下方按钮添加任务</div>
                        </div>
                    ` : tasks.map(task => `
                        <div class="todo-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                            <label class="todo-checkbox">
                                <input type="checkbox" ${task.completed ? 'checked' : ''} data-action="toggle" data-id="${task.id}">
                                <span class="checkmark"></span>
                            </label>
                            <span class="todo-icon">${task.icon || '📌'}</span>
                            <span class="todo-name">${_esc(task.name)}</span>
                            <div class="todo-actions">
                                <button class="btn-icon btn-sm" data-action="edit" data-id="${task.id}" title="编辑">✏️</button>
                                <button class="btn-icon btn-sm" data-action="delete" data-id="${task.id}" title="删除">🗑️</button>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- 添加按钮 -->
                <div class="todo-add-section">
                    <button class="btn btn-outline btn-block" id="addTaskBtn">
                        <span style="margin-right: 6px;">+</span>添加待办
                    </button>
                </div>

                <!-- 最近7天统计 -->
                <div class="section-title mt-lg">
                    <h2><span class="title-icon">📊</span>最近7天</h2>
                </div>
                <div class="todo-week-stats" id="todoWeekStats">
                    ${_renderWeekStats()}
                </div>
            </div>
        `;

        _bindEvents();
    }

    /**
     * 渲染最近7天统计
     */
    function _renderWeekStats() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = App.formatDate(d);
            const tasks = data.tasks[dateStr] || [];
            const total = tasks.length;
            const completed = tasks.filter(t => t.completed).length;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
            const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
            days.push({
                date: dateStr,
                dayLabel: weekDays[d.getDay()],
                dayNum: d.getDate(),
                total,
                completed,
                percent,
                isToday: dateStr === _today(),
            });
        }

        return days.map(d => `
            <div class="week-stat-item ${d.isToday ? 'today' : ''}" data-date="${d.date}">
                <div class="ws-day">${d.dayLabel}</div>
                <div class="ws-bar-wrap">
                    <div class="ws-bar" style="height: ${Math.max(4, d.percent)}%;"></div>
                </div>
                <div class="ws-num">${d.completed}/${d.total}</div>
            </div>
        `).join('');
    }

    // ============================================================
    // 6. 事件绑定
    // ============================================================
    function _bindEvents() {
        if (!containerEl) return;

        // 前一天
        containerEl.querySelector('[data-action="prev-day"]')?.addEventListener('click', () => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() - 1);
            currentDate = App.formatDate(d);
            _render();
        });

        // 后一天
        containerEl.querySelector('[data-action="next-day"]')?.addEventListener('click', () => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() + 1);
            currentDate = App.formatDate(d);
            _render();
        });

        // 勾选/取消任务
        containerEl.querySelectorAll('[data-action="toggle"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const id = checkbox.dataset.id;
                _toggleTask(id);
            });
        });

        // 编辑任务
        containerEl.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                _openEditModal(id);
            });
        });

        // 删除任务
        containerEl.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                _deleteTask(id);
            });
        });

        // 添加任务
        document.getElementById('addTaskBtn')?.addEventListener('click', () => {
            _openAddModal();
        });

        // 点击周统计跳转到对应日期
        containerEl.querySelectorAll('.week-stat-item').forEach(item => {
            item.addEventListener('click', () => {
                currentDate = item.dataset.date;
                _render();
            });
        });
    }

    // ============================================================
    // 7. 任务操作
    // ============================================================

    /**
     * 切换任务完成状态
     */
    function _toggleTask(id) {
        const tasks = _getDayTasks(currentDate);
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        task.completed = !task.completed;
        _saveData();
        _render();

        // 全部完成时的小庆祝
        const allDone = tasks.every(t => t.completed);
        if (allDone && tasks.length > 0) {
            App.showToast('🎉 太棒了！今日任务全部完成');
        }
    }

    /**
     * 打开添加任务弹窗
     */
    function _openAddModal() {
        const icons = ['📚', '🎬', '🤖', '💼', '🏃', '🍎', '💭', '📝', '🎨', '🎵', '💪', '🧹', '🛒', '📞', '💰', '🕐'];

        const html = `
            <div class="form-group">
                <label class="form-label">任务名称</label>
                <input type="text" class="form-input" id="taskNameInput" placeholder="输入待办事项..." autofocus>
            </div>
            <div class="form-group">
                <label class="form-label">选择图标</label>
                <div class="icon-picker">
                    ${icons.map((icon, i) => `
                        <button type="button" class="icon-option ${i === 0 ? 'selected' : ''}" data-icon="${icon}">${icon}</button>
                    `).join('')}
                </div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="confirmAddBtn">添加任务</button>
            </div>
        `;

        let selectedIcon = icons[0];

        App.openModal('添加待办', html, {
            width: '90%',
            maxWidth: '400px',
            onOpen: () => {
                // 图标选择
                document.querySelectorAll('.icon-option').forEach(btn => {
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                        selectedIcon = btn.dataset.icon;
                    });
                });

                // 确认添加
                document.getElementById('confirmAddBtn')?.addEventListener('click', () => {
                    const name = document.getElementById('taskNameInput')?.value?.trim();
                    if (!name) {
                        App.showToast('请输入任务名称');
                        return;
                    }

                    const tasks = _getDayTasks(currentDate);
                    const newTask = {
                        id: _genId(),
                        name: name,
                        icon: selectedIcon,
                        completed: false,
                        order: tasks.length,
                    };
                    tasks.push(newTask);
                    _saveData();
                    _render();
                    App.closeModal();
                    App.showToast('已添加');
                });

                // 回车快速添加
                document.getElementById('taskNameInput')?.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        document.getElementById('confirmAddBtn')?.click();
                    }
                });
            },
        });
    }

    /**
     * 打开编辑任务弹窗
     */
    function _openEditModal(id) {
        const tasks = _getDayTasks(currentDate);
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const icons = ['📚', '🎬', '🤖', '💼', '🏃', '🍎', '💭', '📝', '🎨', '🎵', '💪', '🧹', '🛒', '📞', '💰', '🕐'];

        const html = `
            <div class="form-group">
                <label class="form-label">任务名称</label>
                <input type="text" class="form-input" id="taskNameInput" value="${_esc(task.name)}" autofocus>
            </div>
            <div class="form-group">
                <label class="form-label">选择图标</label>
                <div class="icon-picker">
                    ${icons.map(icon => `
                        <button type="button" class="icon-option ${icon === task.icon ? 'selected' : ''}" data-icon="${icon}">${icon}</button>
                    `).join('')}
                </div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="confirmEditBtn">保存修改</button>
            </div>
        `;

        let selectedIcon = task.icon;

        App.openModal('编辑待办', html, {
            width: '90%',
            maxWidth: '400px',
            onOpen: () => {
                // 图标选择
                document.querySelectorAll('.icon-option').forEach(btn => {
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                        selectedIcon = btn.dataset.icon;
                    });
                });

                // 确认保存
                document.getElementById('confirmEditBtn')?.addEventListener('click', () => {
                    const name = document.getElementById('taskNameInput')?.value?.trim();
                    if (!name) {
                        App.showToast('请输入任务名称');
                        return;
                    }

                    task.name = name;
                    task.icon = selectedIcon;
                    _saveData();
                    _render();
                    App.closeModal();
                    App.showToast('已保存');
                });

                // 回车快速保存
                document.getElementById('taskNameInput')?.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        document.getElementById('confirmEditBtn')?.click();
                    }
                });
            },
        });
    }

    /**
     * 删除任务
     */
    function _deleteTask(id) {
        App.confirmModal('确认删除', '确定要删除这个待办事项吗？', {
            confirmText: '删除',
            onConfirm: () => {
                const tasks = _getDayTasks(currentDate);
                const index = tasks.findIndex(t => t.id === id);
                if (index > -1) {
                    tasks.splice(index, 1);
                    _saveData();
                    _render();
                    App.showToast('已删除');
                }
            },
        });
    }

    // ============================================================
    // 8. 对外接口
    // ============================================================
    return {
        init: init,
        render: render,
        onAdd: function() {
            _openAddModal();
        },
        // 供仪表盘调用的内部方法
        _getDayTasks: _getDayTasks,
        _toggleTask: function(dateStr, taskId) {
            const savedDate = currentDate;
            currentDate = dateStr;
            _toggleTask(taskId);
            currentDate = savedDate;
        },
        _getTask: function(dateStr, taskId) {
            const tasks = _getDayTasks(dateStr);
            return tasks.find(t => t.id === taskId);
        },
        _saveData: _saveData,
        _getData: function() { return data; },
        _getCurrentDate: function() { return currentDate; },
        _setCurrentDate: function(d) { currentDate = d; },
        _today: _today,
    };
})();

// 注册到App
if (typeof App !== 'undefined' && typeof App.registerModule === 'function') {
    App.registerModule('todo', TodoModule);
}
