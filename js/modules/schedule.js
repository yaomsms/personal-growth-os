/**
 * schedule.js - 时间规划模块
 * 两个Tab：工作日 / 周末（周六+周日）
 * 右侧：每日打卡（每个时间块可填写子任务+拍照）
 */

const ScheduleModule = (function() {
    'use strict';

    // ============================================================
    // 1. 数据结构与默认值
    // ============================================================
    const STORAGE_KEY = 'schedule';

    // 数据版本号
    const DATA_VERSION = 6;

    // 活动类型配置
    const ACTIVITY_TYPES = [
        { id: 'work',      label: '工作',   icon: '💼', color: '#5b9bd5' },
        { id: 'study',     label: '学习',   icon: '📚', color: '#7ec8a7' },
        { id: 'exercise',  label: '运动',   icon: '🏃', color: '#f4b8c4' },
        { id: 'rest',      label: '休息',   icon: '😴', color: '#c9b8e0' },
        { id: 'sleep',     label: '睡眠',   icon: '🌙', color: '#8e9cb8' },
        { id: 'commute',   label: '通勤',   icon: '🚇', color: '#a8c9e8' },
        { id: 'social',    label: '社交',   icon: '👥', color: '#f5c89a' },
        { id: 'hobby',     label: '爱好',   icon: '🎨', color: '#e8a0a0' },
        { id: 'entertainment', label: '娱乐', icon: '🎮', color: '#b5d99c' },
        { id: 'routine',   label: '日常',   icon: '🧹', color: '#d0d0d0' },
        { id: 'review',    label: '复盘',   icon: '📝', color: '#ffd966' },
        { id: 'meal',      label: '用餐',   icon: '🍱', color: '#f8b500' },
    ];

    // 默认工作日时间表
    const DEFAULT_WORKDAY_TIMELINE = [
        { id: 'wt1', time: '07:30', activity: '起床、洗漱、吃早餐', type: 'routine', duration: 45 },
        { id: 'wt2', time: '08:15', activity: '出门上班', type: 'commute', duration: 38 },
        { id: 'wt3', time: '08:53', activity: '到公司打卡', type: 'work', duration: 7 },
        { id: 'wt4', time: '09:00', activity: '上午工作', type: 'work', duration: 180 },
        { id: 'wt5', time: '12:00', activity: '午餐 + 午休', type: 'meal', duration: 90 },
        { id: 'wt6', time: '13:30', activity: '下午工作', type: 'work', duration: 270 },
        { id: 'wt7', time: '18:00', activity: '下班回家', type: 'commute', duration: 50 },
        { id: 'wt8', time: '18:50', activity: '晚餐 + 休息', type: 'meal', duration: 70 },
        { id: 'wt9', time: '20:00', activity: '学习/技能提升', type: 'study', duration: 90,
          defaultSubtasks: [
            { name: '英语学习', icon: '📚' },
            { name: '绘画练习', icon: '🎨' },
          ]
        },
        { id: 'wt10', time: '21:30', activity: '洗漱 + 放松', type: 'rest', duration: 60 },
        { id: 'wt11', time: '22:30', activity: '睡觉', type: 'sleep', duration: 30 },
    ];

    // 默认周六时间表
    const DEFAULT_SATURDAY_TIMELINE = [
        { id: 'st1', time: '10:00', activity: '起床 + 搞吃的', type: 'routine', duration: 90 },
        { id: 'st2', time: '11:30', activity: '出门', type: 'commute', duration: 60 },
        { id: 'st3', time: '12:30', activity: '到达目的地 + 午餐', type: 'meal', duration: 60 },
        { id: 'st4', time: '13:30', activity: '英语学习', type: 'study', duration: 120,
          defaultSubtasks: [
            { name: '单词背诵', icon: '📖' },
            { name: '听力练习', icon: '🎧' },
            { name: '课文阅读', icon: '📚' },
          ]
        },
        { id: 'st5', time: '15:30', activity: '休息 + 下午茶', type: 'rest', duration: 30 },
        { id: 'st6', time: '16:00', activity: 'PR剪辑 / AI视频', type: 'study', duration: 150,
          defaultSubtasks: [
            { name: 'PR剪辑学习', icon: '🎬' },
            { name: 'AI工具实践', icon: '🤖' },
          ]
        },
        { id: 'st7', time: '18:30', activity: '晚餐', type: 'meal', duration: 60 },
        { id: 'st8', time: '19:30', activity: '回家', type: 'commute', duration: 60 },
        { id: 'st9', time: '20:30', activity: '洗澡 + 放松', type: 'rest', duration: 90 },
        { id: 'st10', time: '22:00', activity: '睡觉', type: 'sleep', duration: 30 },
    ];

    // 默认周日时间表
    const DEFAULT_SUNDAY_TIMELINE = [
        { id: 'su1', time: '10:00', activity: '起床 + 早餐', type: 'routine', duration: 90 },
        { id: 'su2', time: '11:30', activity: '出门', type: 'commute', duration: 60 },
        { id: 'su3', time: '12:30', activity: '到达 + 午餐', type: 'meal', duration: 60 },
        { id: 'su4', time: '13:30', activity: '英语学习', type: 'study', duration: 120,
          defaultSubtasks: [
            { name: '单词复习', icon: '📖' },
            { name: '课文跟读', icon: '📚' },
          ]
        },
        { id: 'su5', time: '15:30', activity: '休息', type: 'rest', duration: 30 },
        { id: 'su6', time: '16:00', activity: 'PR剪辑 / AI视频', type: 'study', duration: 120,
          defaultSubtasks: [
            { name: '剪辑实操', icon: '🎬' },
            { name: 'AI生图', icon: '🤖' },
          ]
        },
        { id: 'su7', time: '18:00', activity: '每周复盘 + 下周规划', type: 'review', duration: 60 },
        { id: 'su8', time: '19:00', activity: '晚餐', type: 'meal', duration: 60 },
        { id: 'su9', time: '20:00', activity: '回家', type: 'commute', duration: 60 },
        { id: 'su10', time: '21:00', activity: '洗澡 + 放松', type: 'rest', duration: 90 },
        { id: 'su11', time: '22:30', activity: '睡觉', type: 'sleep', duration: 30 },
    ];

    // ============================================================
    // 2. 状态管理
    // ============================================================
    let data = null;
    let containerEl = null;
    let currentTab = 'workday'; // workday | weekend
    let checkinDate = null;
    let expandedBlockId = null; // 当前展开的打卡项

    // ============================================================
    // 3. 初始化
    // ============================================================
    function init() {
        _loadData();
    }

    function _loadData() {
        const stored = AppStorage.getModule(STORAGE_KEY);
        if (stored && typeof stored === 'object' && stored.workdayTimeline && stored.version === DATA_VERSION) {
            data = stored;
        } else {
            data = {
                version: DATA_VERSION,
                workdayTimeline: JSON.parse(JSON.stringify(DEFAULT_WORKDAY_TIMELINE)),
                saturdayTimeline: JSON.parse(JSON.stringify(DEFAULT_SATURDAY_TIMELINE)),
                sundayTimeline: JSON.parse(JSON.stringify(DEFAULT_SUNDAY_TIMELINE)),
                activityTypes: JSON.parse(JSON.stringify(ACTIVITY_TYPES)),
                dailyCheckins: {},
                dayTypes: {},
            };
            // 尝试从旧版本迁移数据
            if (stored && typeof stored === 'object' && stored.workdayTimeline) {
                data.workdayTimeline = stored.workdayTimeline;
                data.saturdayTimeline = stored.saturdayTimeline || data.saturdayTimeline;
                data.sundayTimeline = stored.sundayTimeline || data.sundayTimeline;
                data.activityTypes = stored.activityTypes || data.activityTypes;
                data.dailyCheckins = stored.dailyCheckins || {};
            }
            AppStorage.setModule(STORAGE_KEY, data);
        }
        if (!data.dailyCheckins) data.dailyCheckins = {};
        if (!data.dayTypes) data.dayTypes = {};
        checkinDate = _today();
    }

    function _saveData() {
        AppStorage.setModule(STORAGE_KEY, data);
    }

    function _today() {
        return App.formatDate(new Date());
    }

    // ============================================================
    // 4. 工具函数
    // ============================================================
    function _genId(prefix) {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    function _esc(text) {
        return App.escapeHtml(text || '');
    }

    function _getActivityType(typeId) {
        return data.activityTypes.find(t => t.id === typeId) || data.activityTypes[0];
    }

    function _timeToMinutes(time) {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }

    function _minutesToTime(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    function _getEndTime(block) {
        const startMin = _timeToMinutes(block.time);
        const endMin = startMin + block.duration;
        return _minutesToTime(endMin % 1440);
    }

    function _getCurrentTimeline() {
        return data.workdayTimeline.slice().sort((a, b) => _timeToMinutes(a.time) - _timeToMinutes(b.time));
    }

    function _getSaturdayTimeline() {
        return data.saturdayTimeline.slice().sort((a, b) => _timeToMinutes(a.time) - _timeToMinutes(b.time));
    }

    function _getSundayTimeline() {
        return data.sundayTimeline.slice().sort((a, b) => _timeToMinutes(a.time) - _timeToMinutes(b.time));
    }

    function _getTimelineForDate(dateStr) {
        const dayType = _getDayType(dateStr);
        const dayOfWeek = new Date(dateStr).getDay();
        if (dayType === 'workday') return _getCurrentTimeline();
        // restday：周日用周日时间线，其他用周六时间线
        if (dayOfWeek === 0) return _getSundayTimeline();
        return _getSaturdayTimeline();
    }

    /**
     * 获取某天的类型：workday（工作日）或 restday（休息日）
     * 优先读取手动设置，没有则按星期几默认判断
     */
    function _getDayType(dateStr) {
        // 手动设置优先
        if (data.dayTypes && data.dayTypes[dateStr]) {
            return data.dayTypes[dateStr];
        }
        // 默认按星期几判断（周一到周五工作日，周六周日休息日）
        const dayOfWeek = new Date(dateStr).getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) return 'workday';
        return 'restday';
    }

    /**
     * 手动设置某天的类型
     * @param {string} dateStr - YYYY-MM-DD
     * @param {string} type - 'workday' | 'restday'
     */
    function _setDayType(dateStr, type) {
        if (!data.dayTypes) data.dayTypes = {};
        // 如果设置和默认一致，则清除手动设置（节省存储空间）
        const dayOfWeek = new Date(dateStr).getDay();
        const defaultType = (dayOfWeek >= 1 && dayOfWeek <= 5) ? 'workday' : 'restday';
        if (type === defaultType) {
            delete data.dayTypes[dateStr];
        } else {
            data.dayTypes[dateStr] = type;
        }
        _saveData();
    }

    /**
     * 清除某天的手动设置，恢复默认判断
     */
    function _clearDayType(dateStr) {
        if (data.dayTypes && data.dayTypes[dateStr]) {
            delete data.dayTypes[dateStr];
            _saveData();
        }
    }

    /**
     * 判断某天是否是休息日
     */
    function _isRestDay(dateStr) {
        return _getDayType(dateStr) === 'restday';
    }

    /**
     * 判断某天的类型是否是手动设置的
     */
    function _isDayTypeManual(dateStr) {
        return !!(data.dayTypes && data.dayTypes[dateStr]);
    }

    /**
     * 获取某天对应的时间线 key（workday / saturday / sunday）
     * 用于编辑时间块等操作时定位到正确的时间线数组
     */
    function _getDayKeyForDate(dateStr) {
        const dayType = _getDayType(dateStr);
        const dayOfWeek = new Date(dateStr).getDay();
        if (dayType === 'workday') return 'workday';
        // 休息日：周日用周日时间线，其他用周六时间线
        if (dayOfWeek === 0) return 'sunday';
        return 'saturday';
    }

    function _calcStats(timeline) {
        const stats = {};
        let totalMinutes = 0;
        timeline.forEach(block => {
            const type = block.type;
            stats[type] = (stats[type] || 0) + block.duration;
            totalMinutes += block.duration;
        });
        return { stats, totalMinutes };
    }

    function _formatDuration(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0 && m > 0) return `${h}h${m}m`;
        if (h > 0) return `${h}h`;
        return `${m}m`;
    }

    // 图片压缩
    function _compressImage(file, maxSize, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
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
                    resolve(canvas.toDataURL('image/jpeg', quality || 0.75));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // ============================================================
    // 5. 每日打卡数据管理（增强版：每个时间块有子任务+照片+笔记）
    // ============================================================

    /**
     * 打卡数据结构：
     * dailyCheckins[dateStr] = {
     *   date: 'YYYY-MM-DD',
     *   blocks: {
     *     [blockId]: {
     *       completed: false,
     *       subtasks: [{id, name, icon, completed}],
     *       images: [{type, data, createdAt}],
     *       note: '',
     *     }
     *   },
     *   note: '', // 全天心得
     *   images: [], // 全天照片（保留兼容）
     * }
     */

    function _getCheckin(dateStr) {
        if (!data.dailyCheckins[dateStr]) {
            const timeline = _getTimelineForDate(dateStr);
            const blocks = {};

            // 为每个时间块初始化打卡记录
            timeline.forEach(block => {
                const subtasks = (block.defaultSubtasks || []).map((st, idx) => ({
                    id: 'sub_' + block.id + '_' + idx,
                    name: st.name,
                    icon: st.icon || '📌',
                    completed: false,
                }));
                blocks[block.id] = {
                    completed: false,
                    subtasks: subtasks,
                    images: [],
                    note: '',
                };
            });

            data.dailyCheckins[dateStr] = {
                date: dateStr,
                blocks: blocks,
                note: '',
                images: [],
                createdAt: Date.now(),
            };
            _saveData();
        }

        // 兼容旧数据（只有 completed 数组的）
        const checkin = data.dailyCheckins[dateStr];
        if (!checkin.blocks) {
            const timeline = _getTimelineForDate(dateStr);
            checkin.blocks = {};
            timeline.forEach(block => {
                const isCompleted = (checkin.completed || []).includes(block.id);
                const subtasks = (block.defaultSubtasks || []).map((st, idx) => ({
                    id: 'sub_' + block.id + '_' + idx,
                    name: st.name,
                    icon: st.icon || '📌',
                    completed: false,
                }));
                checkin.blocks[block.id] = {
                    completed: isCompleted,
                    subtasks: subtasks,
                    images: [],
                    note: '',
                };
            });
            _saveData();
        }

        // 确保当前时间线的所有 block 都已初始化（支持切换日期类型后自动补齐）
        const currentTimeline = _getTimelineForDate(dateStr);
        let needSave = false;
        currentTimeline.forEach(block => {
            if (!checkin.blocks[block.id]) {
                const subtasks = (block.defaultSubtasks || []).map((st, idx) => ({
                    id: 'sub_' + block.id + '_' + idx,
                    name: st.name,
                    icon: st.icon || '📌',
                    completed: false,
                }));
                checkin.blocks[block.id] = {
                    completed: false,
                    subtasks: subtasks,
                    images: [],
                    note: '',
                };
                needSave = true;
            }
        });
        if (needSave) _saveData();

        return checkin;
    }

    function _getBlockCheckin(dateStr, blockId) {
        const checkin = _getCheckin(dateStr);
        if (!checkin.blocks[blockId]) {
            checkin.blocks[blockId] = {
                completed: false,
                subtasks: [],
                images: [],
                note: '',
            };
            _saveData();
        }
        return checkin.blocks[blockId];
    }

    function _toggleBlockCheckin(dateStr, blockId) {
        const blockCheckin = _getBlockCheckin(dateStr, blockId);
        blockCheckin.completed = !blockCheckin.completed;

        // 如果勾选完成，自动勾选所有子任务
        if (blockCheckin.completed) {
            blockCheckin.subtasks.forEach(st => { st.completed = true; });
        }

        _saveData();
    }

    function _toggleSubtask(dateStr, blockId, subtaskId) {
        const blockCheckin = _getBlockCheckin(dateStr, blockId);
        const subtask = blockCheckin.subtasks.find(s => s.id === subtaskId);
        if (subtask) {
            subtask.completed = !subtask.completed;

            // 检查是否所有子任务都完成了
            const allDone = blockCheckin.subtasks.length > 0 &&
                blockCheckin.subtasks.every(s => s.completed);
            blockCheckin.completed = allDone;

            _saveData();
        }
    }

    function _addSubtask(dateStr, blockId, name, icon) {
        const blockCheckin = _getBlockCheckin(dateStr, blockId);
        blockCheckin.subtasks.push({
            id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: name,
            icon: icon || '📌',
            completed: false,
        });
        _saveData();
    }

    function _deleteSubtask(dateStr, blockId, subtaskId) {
        const blockCheckin = _getBlockCheckin(dateStr, blockId);
        const idx = blockCheckin.subtasks.findIndex(s => s.id === subtaskId);
        if (idx > -1) {
            blockCheckin.subtasks.splice(idx, 1);
            _saveData();
        }
    }

    function _addBlockImage(dateStr, blockId, imageData) {
        const blockCheckin = _getBlockCheckin(dateStr, blockId);
        if (!blockCheckin.images) blockCheckin.images = [];
        blockCheckin.images.push({
            type: 'image',
            data: imageData,
            createdAt: Date.now(),
        });
        _saveData();
    }

    function _deleteBlockImage(dateStr, blockId, index) {
        const blockCheckin = _getBlockCheckin(dateStr, blockId);
        if (blockCheckin.images && blockCheckin.images[index]) {
            blockCheckin.images.splice(index, 1);
            _saveData();
        }
    }

    function _updateBlockNote(dateStr, blockId, note) {
        const blockCheckin = _getBlockCheckin(dateStr, blockId);
        blockCheckin.note = note;
        _saveData();
    }

    function _updateDayNote(dateStr, note) {
        const checkin = _getCheckin(dateStr);
        checkin.note = note;
        _saveData();
    }

    // ============================================================
    // 6. 渲染入口
    // ============================================================
    function render(container) {
        containerEl = container;
        if (!data) _loadData();

        container.innerHTML = `
            <div class="schedule-module schedule-checkin-only">
                <!-- 标题与切换 -->
                <div class="section-title">
                    <h2><span class="title-icon">✅</span>每日打卡</h2>
                    <span class="section-action" data-action="add-block">
                        <span style="margin-right: 4px;">+</span>添加时间块
                    </span>
                </div>

                <!-- 日期导航 + 进度 -->
                <div class="card checkin-day-card">
                    <div class="checkin-day-header">
                        <div class="checkin-date-nav">
                            <button class="btn-icon btn-sm" id="prevCheckinDay">◀</button>
                            <span class="checkin-date-text-lg" id="checkinDateText"></span>
                            <button class="btn-icon btn-sm" id="nextCheckinDay">▶</button>
                        </div>
                        <div class="checkin-day-type" id="checkinDayType"></div>
                    </div>
                    <div class="checkin-progress-bar large">
                        <div class="progress">
                            <div class="progress-bar" id="checkinProgressBar" style="width: 0%;"></div>
                        </div>
                        <span class="checkin-progress-text" id="checkinProgressText">0/0</span>
                    </div>
                </div>

                <!-- 打卡项列表（增强版） -->
                <div class="checkin-items-list enhanced large" id="checkinItemsList"></div>

                <!-- 全天心得 -->
                <div class="card checkin-note-card">
                    <div class="checkin-section-label">📝 今日心得</div>
                    <textarea class="form-input checkin-note-input" id="checkinNoteInput"
                        placeholder="记录今天的感受和收获..." rows="3"></textarea>
                </div>
            </div>
        `;

        _renderCheckinPanel();
        _bindEvents();
    }

    // ============================================================
    // 7. 时间轴渲染
    // ============================================================
    function _renderTimeline() {
        const container = containerEl.querySelector('#timelineContainer');
        if (!container) return;

        if (currentTab === 'workday') {
            const timeline = _getCurrentTimeline();
            container.innerHTML = _renderOneTimeline(timeline, 'workday');
        } else {
            const saturday = _getSaturdayTimeline();
            const sunday = _getSundayTimeline();
            container.innerHTML = `
                <div class="weekend-section">
                    <div class="weekend-day-title">
                        <span class="weekend-day-icon">📅</span>
                        <span>周六</span>
                        <span class="weekend-day-count">${saturday.length}个时间块</span>
                    </div>
                    ${_renderOneTimeline(saturday, 'saturday')}
                </div>
                <div class="weekend-section">
                    <div class="weekend-day-title">
                        <span class="weekend-day-icon">☀️</span>
                        <span>周日</span>
                        <span class="weekend-day-count">${sunday.length}个时间块</span>
                    </div>
                    ${_renderOneTimeline(sunday, 'sunday')}
                </div>
            `;
        }
    }

    function _renderOneTimeline(timeline, dayKey) {
        if (timeline.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">⏰</div>
                    <div class="empty-state-text">暂无时间块</div>
                    <div class="empty-state-desc">点击下方按钮添加</div>
                </div>
            `;
        }

        return `
            <div class="timeline">
                ${timeline.map((block, index) => {
                    const type = _getActivityType(block.type);
                    const endTime = _getEndTime(block);
                    const isFirst = index === 0;
                    const isLast = index === timeline.length - 1;

                    return `
                        <div class="timeline-item" data-id="${block.id}" data-day="${dayKey}">
                            <div class="timeline-time-col">
                                <div class="timeline-start-time">${block.time}</div>
                                <div class="timeline-end-time">${endTime}</div>
                            </div>
                            <div class="timeline-dot-col">
                                <div class="timeline-dot" style="background: ${type.color};"></div>
                                ${!isLast ? '<div class="timeline-line" style="background: ' + type.color + '40;"></div>' : ''}
                            </div>
                            <div class="timeline-content-col">
                                <div class="timeline-card card" style="border-left: 3px solid ${type.color};">
                                    <div class="timeline-card-header">
                                        <span class="timeline-activity">${block.activity}</span>
                                        <span class="timeline-duration">${_formatDuration(block.duration)}</span>
                                    </div>
                                    <div class="timeline-card-footer">
                                        <span class="timeline-type-tag" style="background: ${type.color}20; color: ${type.color};">
                                            ${type.icon} ${type.label}
                                        </span>
                                        <div class="timeline-actions">
                                            <button class="btn-icon btn-sm" data-action="edit-block" data-id="${block.id}" data-day="${dayKey}" title="编辑">✏️</button>
                                            <button class="btn-icon btn-sm" data-action="delete-block" data-id="${block.id}" data-day="${dayKey}" title="删除">🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // ============================================================
    // 8. 打卡面板渲染（增强版）
    // ============================================================

    function _renderCheckinPanel() {
        const dateText = containerEl.querySelector('#checkinDateText');
        const dayType = containerEl.querySelector('#checkinDayType');
        const progressBar = containerEl.querySelector('#checkinProgressBar');
        const progressText = containerEl.querySelector('#checkinProgressText');
        const itemsList = containerEl.querySelector('#checkinItemsList');
        const noteInput = containerEl.querySelector('#checkinNoteInput');

        if (!dateText) return;

        const checkin = _getCheckin(checkinDate);
        const timeline = _getTimelineForDate(checkinDate);

        // 日期显示
        const d = new Date(checkinDate);
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        const dayOfWeek = d.getDay();
        dateText.textContent = `${d.getMonth() + 1}月${d.getDate()}日 · 周${weekDays[dayOfWeek]}`;

        // 日期类型标签（可点击切换）
        if (dayType) {
            const dayTypeValue = _getDayType(checkinDate);
            const isManual = _isDayTypeManual(checkinDate);
            const typeLabel = dayTypeValue === 'workday' ? '💼 工作日' : '🏖️ 休息日';
            const typeClass = dayTypeValue === 'workday' ? 'workday' : 'weekend';
            const manualIndicator = isManual ? ' ⚙️' : '';
            dayType.innerHTML = `<span class="day-tag ${typeClass}" data-action="toggle-day-type" style="cursor: pointer;" title="点击切换日期类型">${typeLabel}${manualIndicator}</span>`;
        }

        // 总进度
        const total = timeline.length;
        const completed = timeline.filter(b =>
            checkin.blocks[b.id] && checkin.blocks[b.id].completed
        ).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        if (progressBar) progressBar.style.width = percent + '%';
        if (progressText) progressText.textContent = `${completed}/${total}`;

        // 打卡项列表（增强版）
        if (itemsList) {
            itemsList.innerHTML = timeline.map(block => {
                const type = _getActivityType(block.type);
                const blockCheckin = checkin.blocks[block.id] || { completed: false, subtasks: [], images: [], note: '' };
                const isDone = blockCheckin.completed;
                const endTime = _getEndTime(block);
                const isExpanded = expandedBlockId === block.id;
                const subtaskDone = blockCheckin.subtasks.filter(s => s.completed).length;
                const subtaskTotal = blockCheckin.subtasks.length;
                const imgCount = (blockCheckin.images || []).length;

                return `
                    <div class="checkin-item enhanced ${isDone ? 'completed' : ''} ${isExpanded ? 'expanded' : ''}" data-block-id="${block.id}">
                        <!-- 主行 -->
                        <div class="checkin-item-main" data-action="toggle-expand" data-id="${block.id}">
                            <label class="checkin-item-checkbox">
                                <input type="checkbox" ${isDone ? 'checked' : ''} data-action="toggle-checkin" data-id="${block.id}" onclick="event.stopPropagation()">
                                <span class="checkmark"></span>
                            </label>
                            <div class="checkin-item-info">
                                <span class="checkin-item-name">${_esc(block.activity)}</span>
                                <span class="checkin-item-time">${block.time} - ${endTime}</span>
                            </div>
                            <div class="checkin-item-meta">
                                ${subtaskTotal > 0 ? `<span class="meta-badge">${subtaskDone}/${subtaskTotal}</span>` : ''}
                                ${imgCount > 0 ? `<span class="meta-badge photo">📷 ${imgCount}</span>` : ''}
                                <span class="checkin-item-type" style="background: ${type.color}20; color: ${type.color};">
                                    ${type.icon}
                                </span>
                                <span class="expand-arrow">${isExpanded ? '▼' : '▶'}</span>
                            </div>
                        </div>

                        <!-- 展开详情 -->
                        ${isExpanded ? `
                            <div class="checkin-item-detail">
                                <!-- 编辑栏 -->
                                <div class="detail-edit-bar">
                                    <button class="btn-text-sm" data-action="edit-block-item" data-block-id="${block.id}">
                                        ✏️ 编辑时间块
                                    </button>
                                    <button class="btn-text-sm danger" data-action="delete-block-item" data-block-id="${block.id}">
                                        🗑️ 删除
                                    </button>
                                </div>
                                <!-- 子任务 -->
                                <div class="detail-section">
                                    <div class="detail-section-title">
                                        <span>📋 打卡内容</span>
                                        <button class="btn-text-sm" data-action="add-subtask" data-block-id="${block.id}">+ 添加</button>
                                    </div>
                                    <div class="subtasks-list">
                                        ${blockCheckin.subtasks.length === 0 ?
                                            `<div class="no-subtasks-hint">暂无子任务，点击上方添加</div>` :
                                            blockCheckin.subtasks.map(st => `
                                                <div class="subtask-item ${st.completed ? 'done' : ''}" data-sub-id="${st.id}">
                                                    <label class="subtask-checkbox">
                                                        <input type="checkbox" ${st.completed ? 'checked' : ''}
                                                            data-action="toggle-subtask" data-block-id="${block.id}" data-sub-id="${st.id}">
                                                        <span class="checkmark-sm"></span>
                                                    </label>
                                                    <span class="subtask-icon">${st.icon}</span>
                                                    <span class="subtask-name">${_esc(st.name)}</span>
                                                    <button class="subtask-delete" data-action="delete-subtask" data-block-id="${block.id}" data-sub-id="${st.id}">×</button>
                                                </div>
                                            `).join('')
                                        }
                                    </div>
                                </div>

                                <!-- 照片 -->
                                <div class="detail-section">
                                    <div class="detail-section-title">
                                        <span>📷 打卡照片 (${imgCount})</span>
                                        <button class="btn-text-sm" data-action="add-block-photo" data-block-id="${block.id}">+ 上传</button>
                                    </div>
                                    <div class="block-photos-grid">
                                        ${imgCount === 0 ?
                                            `<div class="no-photos-hint-small">还没有照片</div>` :
                                            blockCheckin.images.map((img, idx) => `
                                                <div class="block-photo-item">
                                                    <img src="${img.data}" alt="照片${idx + 1}" data-action="view-block-photo" data-block-id="${block.id}" data-index="${idx}">
                                                    <button class="photo-delete-btn" data-action="delete-block-photo" data-block-id="${block.id}" data-index="${idx}">×</button>
                                                </div>
                                            `).join('')
                                        }
                                    </div>
                                </div>

                                <!-- 笔记 -->
                                <div class="detail-section">
                                    <div class="detail-section-title">
                                        <span>📝 备注</span>
                                    </div>
                                    <textarea class="form-input block-note-input"
                                        data-action="update-block-note" data-block-id="${block.id}"
                                        placeholder="写点什么..." rows="2">${_esc(blockCheckin.note || '')}</textarea>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }

        // 全天笔记
        if (noteInput) noteInput.value = checkin.note || '';
    }

    // ============================================================
    // 9. 统计渲染
    // ============================================================

    function _renderStatsSummary() {
        const el = containerEl.querySelector('#statsSummary');
        if (!el) return;

        let timeline;
        if (currentTab === 'workday') {
            timeline = _getCurrentTimeline();
        } else {
            timeline = _getSaturdayTimeline();
        }

        const { totalMinutes } = _calcStats(timeline);
        el.innerHTML = `共 <strong>${timeline.length}</strong> 个时间块 · 总时长 <strong>${_formatDuration(totalMinutes)}</strong>`;
    }

    function _renderStatsBars() {
        const barsEl = containerEl.querySelector('#statsBars');
        const legendEl = containerEl.querySelector('#statsLegend');
        if (!barsEl || !legendEl) return;

        let timeline;
        if (currentTab === 'workday') {
            timeline = _getCurrentTimeline();
        } else {
            timeline = _getSaturdayTimeline();
        }

        const { stats, totalMinutes } = _calcStats(timeline);

        const sortedTypes = Object.entries(stats)
            .sort((a, b) => b[1] - a[1])
            .map(([type, minutes]) => {
                const typeInfo = _getActivityType(type);
                return { type, minutes, ...typeInfo };
            });

        barsEl.innerHTML = sortedTypes.map(t => {
            const percent = totalMinutes > 0 ? Math.round((t.minutes / totalMinutes) * 100) : 0;
            return `
                <div class="stat-bar-row">
                    <span class="stat-bar-label">${t.icon} ${t.label}</span>
                    <div class="stat-bar-bg">
                        <div class="stat-bar-fill" style="width: ${percent}%; background: ${t.color};"></div>
                    </div>
                    <span class="stat-bar-value">${_formatDuration(t.minutes)}</span>
                </div>
            `;
        }).join('');

        legendEl.innerHTML = sortedTypes.map(t => `
            <div class="stat-legend-item">
                <span class="stat-legend-dot" style="background: ${t.color};"></span>
                <span>${t.label}</span>
            </div>
        `).join('');
    }

    // ============================================================
    // 10. 事件绑定
    // ============================================================

    function _bindEvents() {
        if (!containerEl) return;

        // 切换日期类型（点击类型标签）
        containerEl.addEventListener('click', (e) => {
            const tag = e.target.closest('[data-action="toggle-day-type"]');
            if (tag) {
                e.stopPropagation();
                _openDayTypeModal();
            }
        });

        // 添加时间块（根据当前查看的日期判断是工作日/周末）
        containerEl.querySelector('[data-action="add-block"]')?.addEventListener('click', () => {
            const dayKey = _getDayKeyForDate(checkinDate);
            _openBlockModal(null, dayKey);
        });

        // 打卡日期切换
        containerEl.querySelector('#prevCheckinDay')?.addEventListener('click', () => {
            const d = new Date(checkinDate);
            d.setDate(d.getDate() - 1);
            checkinDate = App.formatDate(d);
            expandedBlockId = null;
            _renderCheckinPanel();
        });

        containerEl.querySelector('#nextCheckinDay')?.addEventListener('click', () => {
            const d = new Date(checkinDate);
            d.setDate(d.getDate() + 1);
            checkinDate = App.formatDate(d);
            expandedBlockId = null;
            _renderCheckinPanel();
        });

        // 打卡项主勾选
        containerEl.addEventListener('change', (e) => {
            const checkbox = e.target.closest('[data-action="toggle-checkin"]');
            if (checkbox) {
                e.stopPropagation();
                const id = checkbox.dataset.id;
                _toggleBlockCheckin(checkinDate, id);
                _renderCheckinPanel();
            }
        });

        // 展开/收起打卡项
        containerEl.addEventListener('click', (e) => {
            const header = e.target.closest('[data-action="toggle-expand"]');
            if (header) {
                const id = header.dataset.id;
                if (expandedBlockId === id) {
                    expandedBlockId = null;
                } else {
                    expandedBlockId = id;
                }
                _renderCheckinPanel();
            }
        });

        // 子任务勾选
        containerEl.addEventListener('change', (e) => {
            const checkbox = e.target.closest('[data-action="toggle-subtask"]');
            if (checkbox) {
                e.stopPropagation();
                const blockId = checkbox.dataset.blockId;
                const subId = checkbox.dataset.subId;
                _toggleSubtask(checkinDate, blockId, subId);
                _renderCheckinPanel();
            }
        });

        // 添加子任务
        containerEl.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="add-subtask"]');
            if (btn) {
                e.stopPropagation();
                const blockId = btn.dataset.blockId;
                _openAddSubtaskModal(blockId);
            }
        });

        // 删除子任务
        containerEl.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="delete-subtask"]');
            if (btn) {
                e.stopPropagation();
                const blockId = btn.dataset.blockId;
                const subId = btn.dataset.subId;
                App.confirmModal('删除子任务', '确定要删除这个子任务吗？', {
                    confirmText: '删除',
                    onConfirm: () => {
                        _deleteSubtask(checkinDate, blockId, subId);
                        _renderCheckinPanel();
                        App.showToast('已删除');
                    },
                });
            }
        });

        // 上传时间块照片
        containerEl.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="add-block-photo"]');
            if (btn) {
                e.stopPropagation();
                const blockId = btn.dataset.blockId;
                // 触发隐藏的file input
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.multiple = true;
                input.onchange = async (ev) => {
                    const files = Array.from(ev.target.files || []);
                    if (files.length === 0) return;
                    try {
                        App.showToast(`正在处理 ${files.length} 张图片...`);
                        for (let i = 0; i < files.length; i++) {
                            const compressed = await _compressImage(files[i], 1280, 0.7);
                            _addBlockImage(checkinDate, blockId, compressed);
                        }
                        App.showToast(`📷 已上传 ${files.length} 张照片`);
                        _renderCheckinPanel();
                    } catch (err) {
                        console.error('图片上传失败:', err);
                        App.showToast('上传失败，请重试');
                    }
                };
                input.click();
            }
        });

        // 查看时间块照片
        containerEl.addEventListener('click', (e) => {
            const img = e.target.closest('[data-action="view-block-photo"]');
            if (img) {
                e.stopPropagation();
                const blockId = img.dataset.blockId;
                const index = parseInt(img.dataset.index);
                const blockCheckin = _getBlockCheckin(checkinDate, blockId);
                const photo = blockCheckin.images && blockCheckin.images[index];
                if (photo) {
                    App.openModal('打卡照片', `
                        <div style="text-align:center;">
                            <img src="${photo.data}" style="max-width:100%; max-height:70vh; border-radius:12px;">
                        </div>
                    `, { width: '95%' });
                }
            }
        });

        // 删除时间块照片
        containerEl.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="delete-block-photo"]');
            if (btn) {
                e.stopPropagation();
                const blockId = btn.dataset.blockId;
                const index = parseInt(btn.dataset.index);
                App.confirmModal('删除照片', '确定要删除这张照片吗？', {
                    confirmText: '删除',
                    onConfirm: () => {
                        _deleteBlockImage(checkinDate, blockId, index);
                        _renderCheckinPanel();
                        App.showToast('已删除');
                    },
                });
            }
        });

        // 时间块笔记输入（自动保存）
        containerEl.addEventListener('input', (e) => {
            const textarea = e.target.closest('[data-action="update-block-note"]');
            if (textarea) {
                const blockId = textarea.dataset.blockId;
                _updateBlockNote(checkinDate, blockId, textarea.value);
            }
        });

        // 全天笔记输入（自动保存）
        containerEl.querySelector('#checkinNoteInput')?.addEventListener('input', (e) => {
            _updateDayNote(checkinDate, e.target.value);
        });

        // 编辑时间块
        containerEl.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="edit-block-item"]');
            if (btn) {
                e.stopPropagation();
                const blockId = btn.dataset.blockId;
                const dayKey = _getDayKeyForDate(checkinDate);

                let timelineArr;
                if (dayKey === 'workday') timelineArr = data.workdayTimeline;
                else if (dayKey === 'saturday') timelineArr = data.saturdayTimeline;
                else timelineArr = data.sundayTimeline;

                const block = timelineArr.find(b => b.id === blockId);
                if (block) _openBlockModal(block, dayKey);
            }
        });

        // 删除时间块
        containerEl.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="delete-block-item"]');
            if (btn) {
                e.stopPropagation();
                const blockId = btn.dataset.blockId;
                const dayKey = _getDayKeyForDate(checkinDate);

                App.confirmModal('删除时间块', '确定要删除这个时间块吗？', {
                    confirmText: '删除',
                    onConfirm: () => {
                        let timelineArr;
                        if (dayKey === 'workday') timelineArr = data.workdayTimeline;
                        else if (dayKey === 'saturday') timelineArr = data.saturdayTimeline;
                        else timelineArr = data.sundayTimeline;

                        const idx = timelineArr.findIndex(b => b.id === blockId);
                        if (idx > -1) {
                            timelineArr.splice(idx, 1);
                            _saveData();
                            expandedBlockId = null;
                            _renderCheckinPanel();
                            App.showToast('已删除');
                        }
                    },
                });
            }
        });
    }

    // ============================================================
    // 11. 日期类型切换弹窗
    // ============================================================

    function _openDayTypeModal() {
        const currentType = _getDayType(checkinDate);
        const isManual = _isDayTypeManual(checkinDate);
        const d = new Date(checkinDate);
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        const dateDisplay = `${d.getMonth() + 1}月${d.getDate()}日 · 周${weekDays[d.getDay()]}`;

        const html = `
            <div style="text-align: center; margin-bottom: var(--spacing-md); color: var(--color-text-secondary); font-size: var(--font-sm);">
                ${dateDisplay}
            </div>
            <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                <button class="btn ${currentType === 'workday' ? 'btn-primary' : 'btn-outline'}" data-type-choice="workday" style="justify-content: center;">
                    💼 设为工作日
                </button>
                <button class="btn ${currentType === 'restday' ? 'btn-primary' : 'btn-outline'}" data-type-choice="restday" style="justify-content: center;">
                    🏖️ 设为休息日
                </button>
                ${isManual ? `
                    <button class="btn btn-text" data-type-choice="reset" style="justify-content: center; color: var(--color-text-secondary);">
                        ↩️ 恢复默认（按星期自动判断）
                    </button>
                ` : ''}
            </div>
            <div style="margin-top: var(--spacing-md); padding: var(--spacing-sm) var(--spacing-md); background: var(--color-bg-secondary); border-radius: 8px; font-size: var(--font-xs); color: var(--color-text-secondary); line-height: 1.5;">
                <div>💡 提示：切换后当天的打卡内容会切换到对应时间线</div>
                <div>工作日打卡和休息日打卡各自独立保存</div>
            </div>
        `;

        App.openModal('日期类型', html, {
            width: '90%',
            maxWidth: '340px',
            onOpen: () => {
                document.querySelectorAll('[data-type-choice]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const choice = btn.dataset.typeChoice;
                        if (choice === 'reset') {
                            _clearDayType(checkinDate);
                            App.showToast('已恢复默认');
                        } else {
                            _setDayType(checkinDate, choice);
                            App.showToast(choice === 'workday' ? '已设为工作日' : '已设为休息日');
                        }
                        expandedBlockId = null;
                        _renderCheckinPanel();
                        App.closeModal();
                    });
                });
            },
        });
    }

    // ============================================================
    // 12. 添加子任务弹窗
    // ============================================================

    function _openAddSubtaskModal(blockId) {
        const icons = ['📚', '🎬', '🤖', '🎨', '📖', '🎧', '✍️', '🏃', '💪', '🧘', '🍎', '💧', '🎯', '📝', '🔍', '💡'];

        const html = `
            <div class="form-group">
                <label class="form-label">子任务名称</label>
                <input type="text" class="form-input" id="subtaskNameInput" placeholder="如：英语单词30个" autofocus>
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
                <button class="btn btn-primary btn-block" id="confirmSubtaskBtn">添加子任务</button>
            </div>
        `;

        let selectedIcon = icons[0];

        App.openModal('添加子任务', html, {
            width: '90%',
            maxWidth: '380px',
            onOpen: () => {
                document.querySelectorAll('.icon-option').forEach(btn => {
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                        selectedIcon = btn.dataset.icon;
                    });
                });

                document.getElementById('confirmSubtaskBtn')?.addEventListener('click', () => {
                    const name = document.getElementById('subtaskNameInput')?.value?.trim();
                    if (!name) {
                        App.showToast('请输入子任务名称');
                        return;
                    }
                    _addSubtask(checkinDate, blockId, name, selectedIcon);
                    expandedBlockId = blockId;
                    _renderCheckinPanel();
                    App.closeModal();
                    App.showToast('已添加');
                });

                document.getElementById('subtaskNameInput')?.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        document.getElementById('confirmSubtaskBtn')?.click();
                    }
                });
            },
        });
    }

    // ============================================================
    // 13. 时间块编辑弹窗
    // ============================================================

    function _openBlockModal(block, dayKey) {
        const isEdit = !!block;
        const types = data.activityTypes;

        const html = `
            <div class="form-group">
                <label class="form-label">活动名称</label>
                <input type="text" class="form-input" id="blockActivityInput" value="${block ? _esc(block.activity) : ''}" placeholder="如：英语学习" autofocus>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">开始时间</label>
                    <input type="time" class="form-input" id="blockTimeInput" value="${block ? block.time : '09:00'}">
                </div>
                <div class="form-group">
                    <label class="form-label">时长（分钟）</label>
                    <input type="number" class="form-input" id="blockDurationInput" value="${block ? block.duration : 60}" min="5" step="5">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">活动类型</label>
                <div class="type-picker">
                    ${types.map((t, i) => `
                        <button type="button" class="type-option ${block && block.type === t.id ? 'selected' : ''}" data-type="${t.id}" style="border-color: ${t.color}40;">
                            <span class="type-option-icon" style="background: ${t.color}20; color: ${t.color};">${t.icon}</span>
                            <span class="type-option-label">${t.label}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="form-hint">
                ${dayKey === 'workday' ? '💼 应用到：工作日（周一至周五）' : (dayKey === 'saturday' ? '📅 应用到：周六' : '☀️ 应用到：周日')}
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="confirmBlockBtn">${isEdit ? '保存修改' : '添加时间块'}</button>
            </div>
        `;

        let selectedType = block ? block.type : 'study';

        App.openModal(isEdit ? '编辑时间块' : '添加时间块', html, {
            width: '90%',
            maxWidth: '420px',
            onOpen: () => {
                document.querySelectorAll('.type-option').forEach(btn => {
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.type-option').forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                        selectedType = btn.dataset.type;
                    });
                });

                document.getElementById('confirmBlockBtn')?.addEventListener('click', () => {
                    const activity = document.getElementById('blockActivityInput')?.value?.trim();
                    const time = document.getElementById('blockTimeInput')?.value;
                    const duration = parseInt(document.getElementById('blockDurationInput')?.value) || 60;

                    if (!activity) {
                        App.showToast('请输入活动名称');
                        return;
                    }
                    if (!time) {
                        App.showToast('请选择开始时间');
                        return;
                    }

                    let targetDay = dayKey;

                    let timelineArr;
                    if (targetDay === 'workday') timelineArr = data.workdayTimeline;
                    else if (targetDay === 'saturday') timelineArr = data.saturdayTimeline;
                    else timelineArr = data.sundayTimeline;

                    if (isEdit) {
                        const target = timelineArr.find(b => b.id === block.id);
                        if (target) {
                            target.activity = activity;
                            target.time = time;
                            target.duration = duration;
                            target.type = selectedType;
                        }
                    } else {
                        timelineArr.push({
                            id: _genId('blk'),
                            activity,
                            time,
                            duration,
                            type: selectedType,
                        });
                    }

                    _saveData();
                    _renderCheckinPanel();
                    App.closeModal();
                    App.showToast(isEdit ? '已保存' : '已添加');
                });
            },
        });
    }

    function _deleteBlock(blockId, dayKey) {
        App.confirmModal('删除时间块', '确定要删除这个时间块吗？', {
            confirmText: '删除',
            onConfirm: () => {
                let timelineArr;
                if (dayKey === 'workday') timelineArr = data.workdayTimeline;
                else if (dayKey === 'saturday') timelineArr = data.saturdayTimeline;
                else timelineArr = data.sundayTimeline;

                const idx = timelineArr.findIndex(b => b.id === blockId);
                if (idx > -1) {
                    timelineArr.splice(idx, 1);
                    _saveData();
                    _renderTimeline();
                    _renderStatsSummary();
                    _renderStatsBars();
                    App.showToast('已删除');
                }
            },
        });
    }

    // ============================================================
    // 14. 对外接口
    // ============================================================
    return {
        init: init,
        render: render,
        onAdd: function() {
            let dayKey = currentTab;
            if (currentTab === 'weekend') {
                dayKey = 'saturday';
            }
            _openBlockModal(null, dayKey);
        },
        _getCheckin: _getCheckin,
        _getCheckinPhotoCount: function(dateStr) {
            const checkin = _getCheckin(dateStr);
            let total = 0;
            if (checkin.blocks) {
                Object.values(checkin.blocks).forEach(b => {
                    total += (b.images || []).length;
                });
            }
            return total;
        },
        _isCompleted: function(dateStr) {
            const checkin = _getCheckin(dateStr);
            if (!checkin.blocks) return false;
            const completedCount = Object.values(checkin.blocks).filter(b => b.completed).length;
            return completedCount > 0;
        },
        _getBlockCheckin: _getBlockCheckin,
        _getDayType: _getDayType,
        _setDayType: _setDayType,
        _isRestDay: _isRestDay,
    };
})();

// 注册到App
if (typeof App !== 'undefined' && typeof App.registerModule === 'function') {
    App.registerModule('schedule', ScheduleModule);
}
