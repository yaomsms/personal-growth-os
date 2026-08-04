/**
 * habits.js - 目标与习惯追踪模块
 * 功能分区：
 *   1. 年度目标总览看板（可自定义增减，进度条）
 *   2. 本月目标拆解（可自定义增减）
 *   3. 每日习惯打卡矩阵（习惯项目、完成状态、连续打卡天数，可新增）
 *   4. 成就徽章墙（已解锁徽章自动点亮）
 */

const HabitsModule = (function() {
    'use strict';

    // ============================================================
    // 1. 数据结构与默认值
    // ============================================================
    const STORAGE_KEY = 'habits';
    const RECORDS_KEY = 'habitRecords';

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

    // 频率选项
    const FREQUENCY_OPTIONS = [
        { value: 'daily', label: '每天' },
        { value: 'weekday', label: '工作日' },
        { value: 'weekend', label: '周末' },
        { value: 'custom', label: '自定义' },
    ];

    // 星期选项
    const WEEKDAY_OPTIONS = [
        { value: 1, label: '周一' },
        { value: 2, label: '周二' },
        { value: 3, label: '周三' },
        { value: 4, label: '周四' },
        { value: 5, label: '周五' },
        { value: 6, label: '周六' },
        { value: 0, label: '周日' },
    ];

    // 默认习惯列表
    const DEFAULT_HABITS = [
        { id: 'h_english', name: '英语学习', icon: '📚', frequency: 'daily', customDays: [], streak: 0, bestStreak: 0, color: '#7ec8a7', createdAt: Date.now() },
        { id: 'h_pr', name: 'PR剪辑', icon: '🎬', frequency: 'custom', customDays: [1, 3, 5], streak: 0, bestStreak: 0, color: '#a8c9e8', createdAt: Date.now() },
        { id: 'h_drawing', name: '绘画控笔', icon: '🎨', frequency: 'daily', customDays: [], streak: 0, bestStreak: 0, color: '#c9b8e0', createdAt: Date.now() },
        { id: 'h_water', name: '喝够8杯水', icon: '💧', frequency: 'daily', customDays: [], streak: 0, bestStreak: 0, color: '#a8c9e8', createdAt: Date.now() },
        { id: 'h_supplement', name: '保健品', icon: '💊', frequency: 'daily', customDays: [], streak: 0, bestStreak: 0, color: '#f5c89a', createdAt: Date.now() },
        { id: 'h_sleep', name: '23:30前睡觉', icon: '🌙', frequency: 'daily', customDays: [], streak: 0, bestStreak: 0, color: '#c9b8e0', createdAt: Date.now() },
        { id: 'h_accounting', name: '今日记账', icon: '💰', frequency: 'daily', customDays: [], streak: 0, bestStreak: 0, color: '#f5c89a', createdAt: Date.now() },
        { id: 'h_attendance', name: '上下班打卡', icon: '🕐', frequency: 'weekday', customDays: [], streak: 0, bestStreak: 0, color: '#8bc9a8', createdAt: Date.now() },
    ];

    // 默认年度目标
    const DEFAULT_ANNUAL_GOALS = [
        { id: 'ag1', title: '英语能力提升', targetValue: 365, currentValue: 0, unit: '天', icon: '📚', color: '#7ec8a7', description: '坚持每日英语学习', createdAt: Date.now() },
        { id: 'ag2', title: 'PR剪辑技能', targetValue: 50, currentValue: 0, unit: '个作品', icon: '🎬', color: '#a8c9e8', description: '完成50个剪辑作品', createdAt: Date.now() },
        { id: 'ag3', title: '绘画练习', targetValue: 100, currentValue: 0, unit: '幅', icon: '🎨', color: '#c9b8e0', description: '完成100幅绘画练习', createdAt: Date.now() },
        { id: 'ag4', title: '健康生活', targetValue: 300, currentValue: 0, unit: '天', icon: '💪', color: '#f5c89a', description: '坚持健康作息300天', createdAt: Date.now() },
    ];

    // 默认本月目标
    const DEFAULT_MONTHLY_GOALS = [
        { id: 'mg1', title: '完成英语基础课程', progress: 0, icon: '📖', color: '#7ec8a7', description: '学完基础语法和词汇', createdAt: Date.now() },
        { id: 'mg2', title: '剪辑3条视频', progress: 0, icon: '🎞️', color: '#a8c9e8', description: '每周至少1条', createdAt: Date.now() },
        { id: 'mg3', title: '坚持每日打卡', progress: 0, icon: '✅', color: '#f5c89a', description: '全勤打卡', createdAt: Date.now() },
    ];

    // 徽章定义（习惯相关）
    const HABIT_BADGES = [
        { id: 'badge_habit_1', name: '初心者', description: '完成首次习惯打卡', icon: '🌱', condition: { type: 'total_checkins', value: 1 } },
        { id: 'badge_habit_7', name: '一周坚持', description: '连续打卡7天', icon: '🌿', condition: { type: 'streak', value: 7 } },
        { id: 'badge_habit_21', name: '习惯养成', description: '连续打卡21天', icon: '🌳', condition: { type: 'streak', value: 21 } },
        { id: 'badge_habit_30', name: '月度达人', description: '连续打卡30天', icon: '🏆', condition: { type: 'streak', value: 30 } },
        { id: 'badge_habit_100', name: '百日坚持', description: '连续打卡100天', icon: '🔥', condition: { type: 'streak', value: 100 } },
        { id: 'badge_habit_all', name: '全能自律', description: '单日所有习惯全部完成', icon: '⭐', condition: { type: 'all_habits_one_day' } },
        { id: 'badge_habit_5_habits', name: '习惯达人', description: '同时追踪5个以上习惯', icon: '🎯', condition: { type: 'habit_count', value: 5 } },
        { id: 'badge_habit_annual', name: '年度目标推进者', description: '完成一个年度目标的50%', icon: '🎖️', condition: { type: 'annual_goal_half' } },
    ];

    // ============================================================
    // 2. 状态管理
    // ============================================================
    let data = null;
    let records = null;
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
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
        _checkAndAwardBadges();
    }

    /**
     * 加载数据
     */
    function _loadData() {
        const stored = AppStorage.getModule(STORAGE_KEY);
        const storedRecords = AppStorage.getModule(RECORDS_KEY);

        // 处理习惯数据
        if (stored && !Array.isArray(stored)) {
            // 新格式：对象结构
            data = stored;
        } else if (Array.isArray(stored)) {
            // 旧格式：纯数组，迁移
            data = {
                annualGoals: [...DEFAULT_ANNUAL_GOALS],
                monthlyGoals: [...DEFAULT_MONTHLY_GOALS],
                habits: stored.length > 0 ? stored : [...DEFAULT_HABITS],
            };
            AppStorage.setModule(STORAGE_KEY, data);
        } else {
            // 全新初始化
            data = {
                annualGoals: [...DEFAULT_ANNUAL_GOALS],
                monthlyGoals: [...DEFAULT_MONTHLY_GOALS],
                habits: [...DEFAULT_HABITS],
                longTermGoals: {
                    near: {
                        title: '近期目标（3个月）',
                        content: '建立基础习惯，养成每日打卡的习惯',
                        progress: 0,
                        icon: '🌱',
                        color: '#7ec8a7',
                    },
                    mid: {
                        title: '中期目标（6个月）',
                        content: '巩固习惯体系，实现5个以上稳定习惯',
                        progress: 0,
                        icon: '🌿',
                        color: '#a8c9e8',
                    },
                    far: {
                        title: '远期目标（1年）',
                        content: '习惯自然融入生活，成为自律的人',
                        progress: 0,
                        icon: '🌳',
                        color: '#f5c89a',
                    },
                    ultimate: {
                        title: '终极目标',
                        content: '持续自我提升，活出理想中的自己',
                        progress: 0,
                        icon: '🏆',
                        color: '#c9b8e0',
                    },
                },
            };
            AppStorage.setModule(STORAGE_KEY, data);
        }

        // 处理打卡记录
        records = storedRecords || {};
        if (!storedRecords) {
            AppStorage.setModule(RECORDS_KEY, records);
        }

        // 计算所有习惯的连续打卡天数
        _calculateAllStreaks();

        // 兼容旧数据：长期总目标
        if (!data.longTermGoals) {
            data.longTermGoals = {
                near: { title: '近期目标（3个月）', content: '建立基础习惯，养成每日打卡的习惯', progress: 0, icon: '🌱', color: '#7ec8a7' },
                mid: { title: '中期目标（6个月）', content: '巩固习惯体系，实现5个以上稳定习惯', progress: 0, icon: '🌿', color: '#a8c9e8' },
                far: { title: '远期目标（1年）', content: '习惯自然融入生活，成为自律的人', progress: 0, icon: '🌳', color: '#f5c89a' },
                ultimate: { title: '终极目标', content: '持续自我提升，活出理想中的自己', progress: 0, icon: '🏆', color: '#c9b8e0' },
            };
        }

        // 初始化日历相关日期
        const now = new Date();
        currentDate = _today();
        calendarMonth = now.getMonth();
        calendarYear = now.getFullYear();
    }

    /**
     * 保存数据
     */
    function _saveData() {
        AppStorage.setModule(STORAGE_KEY, data);
    }

    /**
     * 保存打卡记录
     */
    function _saveRecords() {
        AppStorage.setModule(RECORDS_KEY, records);
    }

    // ============================================================
    // 4. 工具函数
    // ============================================================

    /**
     * 生成ID
     */
    function _genId(prefix) {
        return AppData.generateId(prefix);
    }

    /**
     * 获取今日日期字符串
     */
    function _today() {
        return App.getToday();
    }

    /**
     * 判断习惯在某天是否应该打卡
     */
    function _habitShouldCheck(habit, dateStr) {
        const d = new Date(dateStr);
        const dayOfWeek = d.getDay();

        switch (habit.frequency) {
            case 'daily':
                return true;
            case 'weekday':
                return dayOfWeek >= 1 && dayOfWeek <= 5;
            case 'weekend':
                return dayOfWeek === 0 || dayOfWeek === 6;
            case 'custom':
                return habit.customDays && habit.customDays.includes(dayOfWeek);
            default:
                return true;
        }
    }

    /**
     * 获取习惯在某天的完成状态
     */
    function _getHabitStatus(habitId, dateStr) {
        return records[dateStr] && records[dateStr][habitId] === true;
    }

    /**
     * 切换习惯打卡状态
     */
    function _toggleHabit(habitId, dateStr) {
        if (!records[dateStr]) {
            records[dateStr] = {};
        }
        records[dateStr][habitId] = !records[dateStr][habitId];
        if (records[dateStr][habitId] === false) {
            delete records[dateStr][habitId];
        }
        if (Object.keys(records[dateStr]).length === 0) {
            delete records[dateStr];
        }
        _saveRecords();
        _calculateAllStreaks();
        _checkAndAwardBadges();
    }

    /**
     * 计算所有习惯的连续打卡天数
     */
    function _calculateAllStreaks() {
        if (!data || !data.habits) return;

        const today = new Date();
        let changed = false;

        for (const habit of data.habits) {
            const streak = _calculateStreak(habit, today);
            if (habit.streak !== streak) {
                habit.streak = streak;
                changed = true;
            }
            if (streak > (habit.bestStreak || 0)) {
                habit.bestStreak = streak;
                changed = true;
            }
        }

        if (changed) {
            _saveData();
        }
    }

    /**
     * 计算单个习惯的连续打卡天数
     */
    function _calculateStreak(habit, fromDate) {
        let streak = 0;
        let current = new Date(fromDate);

        // 从今天往前数
        while (true) {
            const dateStr = App.formatDate(current);

            if (_habitShouldCheck(habit, dateStr)) {
                if (_getHabitStatus(habit.id, dateStr)) {
                    streak++;
                } else {
                    // 如果是今天还没打卡，不中断连续计数（看昨天）
                    if (streak === 0 && dateStr === _today()) {
                        current.setDate(current.getDate() - 1);
                        continue;
                    }
                    break;
                }
            }
            // 非打卡日也往前继续数

            current.setDate(current.getDate() - 1);

            // 防止死循环，最多算365天
            if (streak > 365) break;
        }

        return streak;
    }

    /**
     * 获取本周日期数组
     */
    function _getWeekDates() {
        const { start, end } = App.getWeekRange();
        const dates = [];
        const current = new Date(start);
        const endDate = new Date(end);

        while (current <= endDate) {
            dates.push(App.formatDate(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }

    /**
     * 获取频率描述文字
     */
    function _getFrequencyLabel(habit) {
        const opt = FREQUENCY_OPTIONS.find(o => o.value === habit.frequency);
        if (habit.frequency === 'custom' && habit.customDays && habit.customDays.length > 0) {
            const dayLabels = habit.customDays
                .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                .map(d => WEEKDAY_OPTIONS.find(w => w.value === d)?.label || '')
                .join('/');
            return dayLabels;
        }
        return opt ? opt.label : '每天';
    }

    /**
     * 转义HTML
     */
    function _esc(text) {
        return App.escapeHtml(text || '');
    }

    /**
     * 格式化日期为"X月X日 周X"
     */
    function _formatDateShort(dateStr) {
        const d = new Date(dateStr);
        const weekDayLabels = ['日', '一', '二', '三', '四', '五', '六'];
        return `${d.getMonth() + 1}月${d.getDate()}日 周${weekDayLabels[d.getDay()]}`;
    }

    /**
     * 获取某月的天数
     */
    function _getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    /**
     * 获取某天的习惯打卡统计
     */
    function _getDayHabitStats(dateStr) {
        if (!data || !data.habits) return { completed: 0, total: 0, rate: 0 };

        const activeHabits = data.habits.filter(h => _habitShouldCheck(h, dateStr));
        const total = activeHabits.length;
        const completed = activeHabits.filter(h => _getHabitStatus(h.id, dateStr)).length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { completed, total, rate };
    }

    /**
     * 渲染习惯日历
     */
    function _renderHabitCalendar() {
        const calContainer = containerEl.querySelector('#habitCalendar');
        if (!calContainer) return;

        const daysInMonth = _getDaysInMonth(calendarYear, calendarMonth);
        const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
        const today = _today();
        const weekDayLabels = ['日', '一', '二', '三', '四', '五', '六'];

        let daysHtml = '';

        // 第一行前面的空白
        for (let i = 0; i < firstDay; i++) {
            daysHtml += `<div class="cal-day cal-day-empty"></div>`;
        }

        // 每天的日期格子
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(calendarYear, calendarMonth, day);
            const dateStr = App.formatDate(dateObj);
            const stats = _getDayHabitStats(dateStr);
            const isToday = dateStr === today;
            const hasContent = stats.total > 0;
            const isAllDone = stats.total > 0 && stats.completed === stats.total;
            const isPartial = stats.total > 0 && stats.completed > 0 && stats.completed < stats.total;

            let statusClass = '';
            if (isAllDone) {
                statusClass = 'cal-day-success';
            } else if (isPartial) {
                statusClass = 'cal-day-warning';
            } else if (hasContent) {
                statusClass = 'cal-day-muted';
            }

            daysHtml += `
                <div class="cal-day ${hasContent ? 'has-content' : ''} ${statusClass} ${isToday ? 'today' : ''}"
                     data-action="habit-cal-day" data-date="${dateStr}">
                    <div class="cal-day-num">${day}</div>
                    ${hasContent ? `<div class="cal-day-stat">${stats.completed}/${stats.total}</div>` : ''}
                </div>
            `;
        }

        calContainer.innerHTML = `
            <div class="cal-weekdays">
                ${weekDayLabels.map(label => `<div class="cal-weekday">${label}</div>`).join('')}
            </div>
            <div class="cal-days">
                ${daysHtml}
            </div>
        `;
    }

    // ============================================================
    // 5. 徽章系统
    // ============================================================

    /**
     * 检查并授予徽章
     */
    function _checkAndAwardBadges() {
        if (!data || !data.habits) return;

        const today = _today();
        const todayRecord = records[today] || {};

        for (const badge of HABIT_BADGES) {
            if (AppStorage.hasBadge(badge.id)) continue;

            let earned = false;
            const cond = badge.condition;

            switch (cond.type) {
                case 'total_checkins': {
                    let total = 0;
                    for (const date in records) {
                        total += Object.keys(records[date]).length;
                    }
                    earned = total >= cond.value;
                    break;
                }
                case 'streak': {
                    const maxStreak = Math.max(...data.habits.map(h => h.streak || 0));
                    earned = maxStreak >= cond.value;
                    break;
                }
                case 'all_habits_one_day': {
                    const activeHabits = data.habits.filter(h => _habitShouldCheck(h, today));
                    const completedToday = activeHabits.filter(h => todayRecord[h.id]).length;
                    earned = activeHabits.length > 0 && completedToday === activeHabits.length;
                    break;
                }
                case 'habit_count': {
                    earned = data.habits.length >= cond.value;
                    break;
                }
                case 'annual_goal_half': {
                    earned = data.annualGoals.some(g => g.targetValue > 0 && (g.currentValue / g.targetValue) >= 0.5);
                    break;
                }
            }

            if (earned) {
                AppStorage.awardBadge(badge.id);
                App.showToast(`🎉 解锁徽章：${badge.name}`, { type: 'success', duration: 3000 });
            }
        }
    }

    // ============================================================
    // 6. 渲染入口
    // ============================================================

    function render(container) {
        containerEl = container;
        if (!data) _loadData();

        container.innerHTML = `
            <div class="habits-module">
                <!-- 模块长期总目标 -->
                <div class="section-title">
                    <h2><span class="title-icon">🎯</span>模块长期总目标</h2>
                    <span class="section-action" data-action="edit-goals">编辑</span>
                </div>
                <div class="goals-vertical" id="habitLongTermGoals"></div>

                <!-- 年度目标总览 -->
                <div class="section-title">
                    <h2><span class="title-icon">🎯</span>年度目标总览</h2>
                    <span class="section-action" data-action="add-annual-goal">+ 添加</span>
                </div>
                <div class="annual-goals-grid" id="annualGoalsGrid"></div>

                <!-- 本月目标拆解 -->
                <div class="section-title">
                    <h2><span class="title-icon">📅</span>本月目标拆解</h2>
                    <span class="section-action" data-action="add-monthly-goal">+ 添加</span>
                </div>
                <div class="monthly-goals-list" id="monthlyGoalsList"></div>

                <!-- 每日习惯打卡矩阵 -->
                <div class="section-title">
                    <h2><span class="title-icon">✅</span>每日习惯打卡</h2>
                    <span class="section-action" data-action="add-habit">+ 新增习惯</span>
                </div>
                <div class="section-subtitle">本周打卡记录 · 点击圆点可切换状态</div>
                <div class="habit-matrix" id="habitMatrix"></div>

                <!-- 日历回顾 -->
                <div class="section-title">
                    <h2><span class="title-icon">📆</span>日历回顾</h2>
                    <span class="section-action" data-action="toggle-calendar">${showCalendar ? '收起' : '📆 展开'}</span>
                </div>
                ${showCalendar ? `
                <div class="card calendar-card" id="habitCalendarCard">
                    <div class="calendar-header">
                        <button class="btn-icon btn-sm" data-action="prev-month-habit" title="上个月">◀</button>
                        <div class="calendar-title">${calendarYear}年${calendarMonth + 1}月</div>
                        <button class="btn-icon btn-sm" data-action="next-month-habit" title="下个月">▶</button>
                    </div>
                    <div class="habit-calendar" id="habitCalendar"></div>
                    <div class="calendar-legend">
                        <span class="legend-item"><span class="legend-dot legend-success"></span>全部完成</span>
                        <span class="legend-item"><span class="legend-dot legend-warning"></span>部分完成</span>
                        <span class="legend-item"><span class="legend-dot legend-muted"></span>未打卡</span>
                    </div>
                </div>
                ` : ''}

                <!-- 成就徽章墙 -->
                <div class="section-title">
                    <h2><span class="title-icon">🏅</span>成就徽章墙</h2>
                </div>
                <div class="badge-wall" id="badgeWall"></div>
            </div>
        `;

        _renderLongTermGoals();
        _renderAnnualGoals();
        _renderMonthlyGoals();
        _renderHabitMatrix();
        if (showCalendar) {
            _renderHabitCalendar();
        }
        _renderBadgeWall();
        _bindEvents();
    }

    // ============================================================
    // 6.5 长期总目标
    // ============================================================

    // 按打卡天数自动计算目标进度
    // 近期: 90天, 中期: 180天, 远期: 365天, 终极: 730天
    function _calcGoalProgress(key) {
        const checkinDays = Object.keys(records).length;
        const dayMap = { near: 90, mid: 180, far: 365, ultimate: 730 };
        const targetDays = dayMap[key] || 90;
        const progress = Math.min(100, Math.round((checkinDays / targetDays) * 1000) / 10);
        return progress;
    }

    function _renderLongTermGoals() {
        const goalsEl = containerEl?.querySelector('#habitLongTermGoals');
        if (!goalsEl) return;

        const goals = data.longTermGoals;
        const goalKeys = ['near', 'mid', 'far', 'ultimate'];

        goalsEl.innerHTML = goalKeys.map(key => {
            const g = goals[key];
            if (!g) return '';
            const progress = _calcGoalProgress(key);
            const dayMap = { near: 90, mid: 180, far: 365, ultimate: 730 };
            const targetDays = dayMap[key] || 90;
            const checkinDays = Object.keys(records).length;
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
                        <div class="goal-v-progress-num" style="color: ${g.color};">${progress}%</div>
                    </div>
                    <div class="progress progress-goal">
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
            <div class="form-group">
                <label class="form-label">${g.icon} ${g.title}</label>
                <input type="text" class="form-input" id="goalTitle_${key}" value="${_esc(g.title)}">
                <textarea class="form-textarea mt-sm" id="goalContent_${key}" rows="2" placeholder="目标描述">${_esc(g.content)}</textarea>
                <div class="mt-sm">
                    <label class="form-label-sm">进度：<span id="progressVal_${key}">${g.progress || 0}%</span></label>
                    <input type="range" id="goalProgress_${key}" min="0" max="100" value="${g.progress || 0}" 
                           style="width: 100%;" data-key="${key}">
                </div>
            </div>
            `;
            }).join('')}
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveGoalsBtn">保存目标</button>
            </div>
        `;

        App.openModal('编辑长期目标', html, {
            width: '90%',
            maxWidth: '480px',
            onOpen: () => {
                // 实时更新进度显示
                goalKeys.forEach(key => {
                    const slider = document.getElementById(`goalProgress_${key}`);
                    const valEl = document.getElementById(`progressVal_${key}`);
                    slider?.addEventListener('input', () => {
                        if (valEl) valEl.textContent = slider.value + '%';
                    });
                });

                document.getElementById('saveGoalsBtn')?.addEventListener('click', () => {
                    goalKeys.forEach(key => {
                        const title = document.getElementById(`goalTitle_${key}`)?.value?.trim();
                        const content = document.getElementById(`goalContent_${key}`)?.value?.trim();
                        const progress = parseInt(document.getElementById(`goalProgress_${key}`)?.value) || 0;
                        if (data.longTermGoals[key]) {
                            data.longTermGoals[key].title = title || data.longTermGoals[key].title;
                            data.longTermGoals[key].content = content || '';
                            data.longTermGoals[key].progress = progress;
                        }
                    });
                    _saveData();
                    _renderLongTermGoals();
                    App.closeModal();
                    App.showToast('已保存');
                });
            },
        });
    }

    function _esc(text) {
        return App.escapeHtml(text || '');
    }

    // ============================================================
    // 7. 年度目标渲染与操作
    // ============================================================

    function _renderAnnualGoals() {
        const grid = containerEl.querySelector('#annualGoalsGrid');
        if (!grid) return;

        if (!data.annualGoals || data.annualGoals.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="padding: var(--spacing-xl);">
                    <div class="empty-state-icon">🎯</div>
                    <div class="empty-state-text">还没有年度目标，点击上方添加</div>
                </div>
            `;
            return;
        }

        grid.innerHTML = data.annualGoals.map(goal => {
            const percent = goal.targetValue > 0 ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0;
            return `
                <div class="card goal-card card-clickable" data-goal-id="${goal.id}" data-type="annual">
                    <div class="goal-card-header">
                        <div class="goal-icon" style="background: ${goal.color}20; color: ${goal.color};">
                            ${goal.icon || '🎯'}
                        </div>
                        <div class="goal-actions">
                            <button class="btn-icon btn-sm" data-action="edit-annual" data-id="${goal.id}" title="编辑">✏️</button>
                            <button class="btn-icon btn-sm" data-action="delete-annual" data-id="${goal.id}" title="删除">🗑️</button>
                        </div>
                    </div>
                    <h3 class="goal-title">${_esc(goal.title)}</h3>
                    <p class="goal-desc">${_esc(goal.description || '')}</p>
                    <div class="goal-progress-info">
                        <span class="goal-current">${goal.currentValue}</span>
                        <span class="goal-sep">/</span>
                        <span class="goal-target">${goal.targetValue} ${_esc(goal.unit || '')}</span>
                        <span class="goal-percent" style="color: ${goal.color};">${percent}%</span>
                    </div>
                    <div class="progress progress-lg">
                        <div class="progress-bar" style="width: ${percent}%; background: linear-gradient(90deg, ${goal.color}88, ${goal.color});"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * 编辑年度目标模态框
     */
    function _openAnnualGoalModal(goal = null) {
        const isEdit = !!goal;
        const html = `
            <div class="form-group">
                <label class="form-label">目标名称</label>
                <input type="text" class="form-input" id="goalTitle" value="${_esc(goal?.title || '')}" placeholder="例如：英语能力提升">
            </div>
            <div class="form-group">
                <label class="form-label">目标描述</label>
                <textarea class="form-textarea" id="goalDesc" placeholder="描述你的目标...">${_esc(goal?.description || '')}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">当前进度</label>
                    <input type="number" class="form-input" id="goalCurrent" value="${goal?.currentValue ?? 0}" min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">目标值</label>
                    <input type="number" class="form-input" id="goalTarget" value="${goal?.targetValue ?? 100}" min="1">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">单位</label>
                    <input type="text" class="form-input" id="goalUnit" value="${_esc(goal?.unit || '个')}" placeholder="天/个/次">
                </div>
                <div class="form-group">
                    <label class="form-label">图标</label>
                    <input type="text" class="form-input" id="goalIcon" value="${_esc(goal?.icon || '🎯')}" placeholder="emoji图标">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">颜色</label>
                <div class="color-picker">
                    ${COLORS.map((c, i) => `
                        <button class="color-dot ${goal?.color === c ? 'selected' : ''}" 
                                data-color="${c}" 
                                style="background: ${c};"
                                title="${c}"></button>
                    `).join('')}
                </div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveGoalBtn">${isEdit ? '保存修改' : '添加目标'}</button>
            </div>
        `;

        App.openModal(isEdit ? '编辑年度目标' : '添加年度目标', html, {
            onOpen: () => {
                let selectedColor = goal?.color || COLORS[0];

                // 颜色选择
                containerEl.querySelectorAll('.color-dot').forEach(dot => {
                    dot.addEventListener('click', () => {
                        containerEl.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
                        dot.classList.add('selected');
                        selectedColor = dot.dataset.color;
                    });
                });

                document.getElementById('saveGoalBtn')?.addEventListener('click', () => {
                    const title = document.getElementById('goalTitle').value.trim();
                    if (!title) {
                        App.showError('请输入目标名称');
                        return;
                    }

                    const goalData = {
                        title,
                        description: document.getElementById('goalDesc').value.trim(),
                        currentValue: parseFloat(document.getElementById('goalCurrent').value) || 0,
                        targetValue: parseFloat(document.getElementById('goalTarget').value) || 100,
                        unit: document.getElementById('goalUnit').value.trim() || '个',
                        icon: document.getElementById('goalIcon').value.trim() || '🎯',
                        color: selectedColor,
                    };

                    if (isEdit) {
                        const idx = data.annualGoals.findIndex(g => g.id === goal.id);
                        if (idx > -1) {
                            data.annualGoals[idx] = { ...data.annualGoals[idx], ...goalData };
                        }
                        App.showSuccess('目标已更新');
                    } else {
                        goalData.id = _genId('ag');
                        goalData.createdAt = Date.now();
                        data.annualGoals.push(goalData);
                        App.showSuccess('目标已添加');
                    }

                    _saveData();
                    _checkAndAwardBadges();
                    _renderAnnualGoals();
                    App.closeModal();
                });
            }
        });
    }

    /**
     * 删除年度目标
     */
    async function _deleteAnnualGoal(id) {
        const confirmed = await App.confirmModal('确认删除', '确定要删除这个年度目标吗？删除后无法恢复。', {
            confirmText: '删除',
            cancelText: '取消',
        });
        if (confirmed) {
            data.annualGoals = data.annualGoals.filter(g => g.id !== id);
            _saveData();
            _renderAnnualGoals();
            App.showSuccess('已删除');
        }
    }

    // ============================================================
    // 8. 本月目标渲染与操作
    // ============================================================

    function _renderMonthlyGoals() {
        const list = containerEl.querySelector('#monthlyGoalsList');
        if (!list) return;

        if (!data.monthlyGoals || data.monthlyGoals.length === 0) {
            list.innerHTML = `
                <div class="empty-state" style="padding: var(--spacing-xl);">
                    <div class="empty-state-icon">📅</div>
                    <div class="empty-state-text">还没有本月目标，点击上方添加</div>
                </div>
            `;
            return;
        }

        list.innerHTML = `
            <div class="list-group">
                ${data.monthlyGoals.map((goal, idx) => `
                    <div class="list-item" data-monthly-id="${goal.id}">
                        <div class="list-item-icon" style="background: ${goal.color}20; color: ${goal.color};">
                            ${goal.icon || '🎯'}
                        </div>
                        <div class="list-item-content">
                            <div class="list-item-title">${_esc(goal.title)}</div>
                            <div class="list-item-subtitle">${_esc(goal.description || '')}</div>
                            <div class="list-item-meta">
                                <div class="progress progress-sm" style="width: 120px;">
                                    <div class="progress-bar" style="width: ${goal.progress || 0}%; background: linear-gradient(90deg, ${goal.color}88, ${goal.color});"></div>
                                </div>
                                <span>${goal.progress || 0}%</span>
                            </div>
                        </div>
                        <div class="list-item-right">
                            <button class="btn-icon btn-sm" data-action="edit-monthly" data-id="${goal.id}" title="编辑">✏️</button>
                            <button class="btn-icon btn-sm" data-action="delete-monthly" data-id="${goal.id}" title="删除">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * 编辑本月目标模态框
     */
    function _openMonthlyGoalModal(goal = null) {
        const isEdit = !!goal;
        const html = `
            <div class="form-group">
                <label class="form-label">目标名称</label>
                <input type="text" class="form-input" id="mgTitle" value="${_esc(goal?.title || '')}" placeholder="本月要完成什么？">
            </div>
            <div class="form-group">
                <label class="form-label">目标描述</label>
                <textarea class="form-textarea" id="mgDesc" placeholder="详细描述...">${_esc(goal?.description || '')}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">完成进度：<span id="mgProgressVal">${goal?.progress ?? 0}%</span></label>
                <div class="slider-container">
                    <input type="range" class="slider" id="mgProgress" min="0" max="100" value="${goal?.progress ?? 0}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">图标</label>
                    <input type="text" class="form-input" id="mgIcon" value="${_esc(goal?.icon || '🎯')}" placeholder="emoji图标">
                </div>
                <div class="form-group">
                    <label class="form-label">颜色</label>
                    <div class="color-picker">
                        ${COLORS.map((c, i) => `
                            <button class="color-dot ${goal?.color === c ? 'selected' : ''}" 
                                    data-color="${c}" 
                                    style="background: ${c};"
                                    title="${c}"></button>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveMgBtn">${isEdit ? '保存修改' : '添加目标'}</button>
            </div>
        `;

        App.openModal(isEdit ? '编辑本月目标' : '添加本月目标', html, {
            onOpen: () => {
                let selectedColor = goal?.color || COLORS[0];

                // 滑块实时更新
                const slider = document.getElementById('mgProgress');
                const valDisplay = document.getElementById('mgProgressVal');
                slider?.addEventListener('input', () => {
                    valDisplay.textContent = slider.value + '%';
                });

                // 颜色选择
                document.querySelectorAll('.color-dot').forEach(dot => {
                    dot.addEventListener('click', () => {
                        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
                        dot.classList.add('selected');
                        selectedColor = dot.dataset.color;
                    });
                });

                document.getElementById('saveMgBtn')?.addEventListener('click', () => {
                    const title = document.getElementById('mgTitle').value.trim();
                    if (!title) {
                        App.showError('请输入目标名称');
                        return;
                    }

                    const goalData = {
                        title,
                        description: document.getElementById('mgDesc').value.trim(),
                        progress: parseInt(document.getElementById('mgProgress').value) || 0,
                        icon: document.getElementById('mgIcon').value.trim() || '🎯',
                        color: selectedColor,
                    };

                    if (isEdit) {
                        const idx = data.monthlyGoals.findIndex(g => g.id === goal.id);
                        if (idx > -1) {
                            data.monthlyGoals[idx] = { ...data.monthlyGoals[idx], ...goalData };
                        }
                        App.showSuccess('目标已更新');
                    } else {
                        goalData.id = _genId('mg');
                        goalData.createdAt = Date.now();
                        data.monthlyGoals.push(goalData);
                        App.showSuccess('目标已添加');
                    }

                    _saveData();
                    _renderMonthlyGoals();
                    App.closeModal();
                });
            }
        });
    }

    /**
     * 删除本月目标
     */
    async function _deleteMonthlyGoal(id) {
        const confirmed = await App.confirmModal('确认删除', '确定要删除这个本月目标吗？', {
            confirmText: '删除',
            cancelText: '取消',
        });
        if (confirmed) {
            data.monthlyGoals = data.monthlyGoals.filter(g => g.id !== id);
            _saveData();
            _renderMonthlyGoals();
            App.showSuccess('已删除');
        }
    }

    // ============================================================
    // 9. 习惯打卡矩阵渲染与操作
    // ============================================================

    function _renderHabitMatrix() {
        const matrix = containerEl.querySelector('#habitMatrix');
        if (!matrix) return;

        const weekDates = _getWeekDates();
        const today = _today();
        const weekDayLabels = ['日', '一', '二', '三', '四', '五', '六'];

        if (!data.habits || data.habits.length === 0) {
            matrix.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <div class="empty-state-text">还没有习惯，点击上方新增习惯</div>
                </div>
            `;
            return;
        }

        matrix.innerHTML = `
            <div class="habit-matrix-table">
                <div class="habit-matrix-header">
                    <div class="habit-name-col">习惯</div>
                    <div class="habit-days-row">
                        ${weekDates.map(d => {
                            const dayOfWeek = new Date(d).getDay();
                            const isToday = d === today;
                            return `
                                <div class="habit-day-header ${isToday ? 'today' : ''}">
                                    <div class="day-label">${weekDayLabels[dayOfWeek]}</div>
                                    <div class="day-num">${new Date(d).getDate()}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                <div class="habit-matrix-body">
                    ${data.habits.map(habit => {
                        const shouldCheckToday = _habitShouldCheck(habit, today);
                        const isDoneToday = _getHabitStatus(habit.id, today);
                        return `
                            <div class="habit-row" data-habit-id="${habit.id}">
                                <div class="habit-name-col">
                                    <div class="habit-info">
                                        <div class="habit-icon" style="background: ${habit.color}20;">
                                            ${habit.icon || '✅'}
                                        </div>
                                        <div class="habit-detail">
                                            <div class="habit-name">${_esc(habit.name)}</div>
                                            <div class="habit-meta">
                                                <span class="habit-freq">${_getFrequencyLabel(habit)}</span>
                                                ${habit.streak > 0 ? `<span class="habit-streak"><span class="flame-icon">🔥</span>${habit.streak}天</span>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="habit-actions">
                                        <button class="btn-icon btn-sm" data-action="edit-habit" data-id="${habit.id}" title="编辑">✏️</button>
                                        <button class="btn-icon btn-sm" data-action="delete-habit" data-id="${habit.id}" title="删除">🗑️</button>
                                    </div>
                                </div>
                                <div class="habit-days-row">
                                    ${weekDates.map(d => {
                                        const shouldCheck = _habitShouldCheck(habit, d);
                                        const isDone = _getHabitStatus(habit.id, d);
                                        const isToday = d === today;
                                        return `
                                            <div class="habit-day-cell ${isToday ? 'today' : ''} ${!shouldCheck ? 'off-day' : ''}" 
                                                 data-date="${d}" data-habit="${habit.id}">
                                                ${shouldCheck ? `
                                                    <div class="habit-check-dot ${isDone ? 'done' : ''}" 
                                                         style="${isDone ? `background: ${habit.color}; border-color: ${habit.color};` : ''}">
                                                        ${isDone ? '✓' : ''}
                                                    </div>
                                                ` : `<span class="off-day-mark">—</span>`}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 新增/编辑习惯模态框
     */
    function _openHabitModal(habit = null) {
        const isEdit = !!habit;
        const customDays = habit?.customDays || [];

        const html = `
            <div class="form-group">
                <label class="form-label">习惯名称</label>
                <input type="text" class="form-input" id="habitName" value="${_esc(habit?.name || '')}" placeholder="例如：每日阅读">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">图标</label>
                    <input type="text" class="form-input" id="habitIcon" value="${_esc(habit?.icon || '✅')}" placeholder="emoji">
                </div>
                <div class="form-group">
                    <label class="form-label">颜色</label>
                    <div class="color-picker">
                        ${COLORS.map(c => `
                            <button class="color-dot ${habit?.color === c ? 'selected' : ''}" 
                                    data-color="${c}" 
                                    style="background: ${c};"></button>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">打卡频率</label>
                <select class="form-select" id="habitFrequency">
                    ${FREQUENCY_OPTIONS.map(opt => `
                        <option value="${opt.value}" ${habit?.frequency === opt.value ? 'selected' : ''}>${opt.label}</option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group" id="customDaysGroup" style="${habit?.frequency === 'custom' ? '' : 'display: none;'}">
                <label class="form-label">选择打卡日</label>
                <div class="weekday-selector">
                    ${WEEKDAY_OPTIONS.map(opt => `
                        <label class="weekday-chip ${customDays.includes(opt.value) ? 'active' : ''}">
                            <input type="checkbox" value="${opt.value}" ${customDays.includes(opt.value) ? 'checked' : ''}>
                            <span>${opt.label}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveHabitBtn">${isEdit ? '保存修改' : '添加习惯'}</button>
            </div>
        `;

        App.openModal(isEdit ? '编辑习惯' : '新增习惯', html, {
            onOpen: () => {
                let selectedColor = habit?.color || COLORS[0];

                // 频率切换
                const freqSelect = document.getElementById('habitFrequency');
                const customGroup = document.getElementById('customDaysGroup');
                freqSelect?.addEventListener('change', () => {
                    customGroup.style.display = freqSelect.value === 'custom' ? '' : 'none';
                });

                // 颜色选择
                document.querySelectorAll('.color-dot').forEach(dot => {
                    dot.addEventListener('click', () => {
                        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
                        dot.classList.add('selected');
                        selectedColor = dot.dataset.color;
                    });
                });

                // 星期选择
                document.querySelectorAll('.weekday-chip').forEach(chip => {
                    chip.addEventListener('click', (e) => {
                        e.preventDefault();
                        const checkbox = chip.querySelector('input');
                        checkbox.checked = !checkbox.checked;
                        chip.classList.toggle('active', checkbox.checked);
                    });
                });

                document.getElementById('saveHabitBtn')?.addEventListener('click', () => {
                    const name = document.getElementById('habitName').value.trim();
                    if (!name) {
                        App.showError('请输入习惯名称');
                        return;
                    }

                    const frequency = document.getElementById('habitFrequency').value;
                    const customDays = [];
                    document.querySelectorAll('.weekday-chip input:checked').forEach(cb => {
                        customDays.push(parseInt(cb.value));
                    });

                    const habitData = {
                        name,
                        icon: document.getElementById('habitIcon').value.trim() || '✅',
                        color: selectedColor,
                        frequency,
                        customDays: frequency === 'custom' ? customDays : [],
                    };

                    if (isEdit) {
                        const idx = data.habits.findIndex(h => h.id === habit.id);
                        if (idx > -1) {
                            data.habits[idx] = { ...data.habits[idx], ...habitData };
                        }
                        App.showSuccess('习惯已更新');
                    } else {
                        habitData.id = _genId('h');
                        habitData.streak = 0;
                        habitData.bestStreak = 0;
                        habitData.createdAt = Date.now();
                        data.habits.push(habitData);
                        App.showSuccess('习惯已添加');
                    }

                    _saveData();
                    _calculateAllStreaks();
                    _checkAndAwardBadges();
                    _renderHabitMatrix();
                    App.closeModal();
                });
            }
        });
    }

    /**
     * 删除习惯
     */
    async function _deleteHabit(id) {
        const confirmed = await App.confirmModal('确认删除', '确定要删除这个习惯吗？相关打卡记录也会被清除。', {
            confirmText: '删除',
            cancelText: '取消',
        });
        if (confirmed) {
            data.habits = data.habits.filter(h => h.id !== id);
            // 清除相关打卡记录
            for (const date in records) {
                if (records[date][id]) {
                    delete records[date][id];
                    if (Object.keys(records[date]).length === 0) {
                        delete records[date];
                    }
                }
            }
            _saveData();
            _saveRecords();
            _renderHabitMatrix();
            App.showSuccess('已删除');
        }
    }

    // ============================================================
    // 10. 日历回顾
    // ============================================================

    /**
     * 查看某天的习惯打卡详情
     */
    function _viewHabitDay(dateStr) {
        if (!data || !data.habits) return;

        const stats = _getDayHabitStats(dateStr);
        const activeHabits = data.habits.filter(h => _habitShouldCheck(h, dateStr));
        const dateDisplay = _formatDateShort(dateStr);

        const html = `
            <div class="habit-day-detail">
                <div class="habit-day-header">
                    <div class="habit-day-date">${dateDisplay}</div>
                    <div class="habit-day-summary">
                        <span class="habit-day-completed">${stats.completed}</span>
                        <span class="habit-day-sep">/</span>
                        <span class="habit-day-total">${stats.total}</span>
                        <span class="habit-day-rate">完成率 ${stats.rate}%</span>
                    </div>
                    <div class="progress progress-lg" style="margin-top: 12px;">
                        <div class="progress-bar" style="width: ${stats.rate}%; background: ${stats.rate === 100 ? '#7ec8a7' : stats.rate > 0 ? '#f5c89a' : '#ddd'};"></div>
                    </div>
                </div>
                <div class="habit-day-list" style="margin-top: 16px;">
                    ${activeHabits.length === 0 ? `
                        <div class="empty-state-text" style="text-align: center; padding: 20px; color: var(--text-secondary);">
                            当天没有需要打卡的习惯
                        </div>
                    ` : activeHabits.map(habit => {
                        const isDone = _getHabitStatus(habit.id, dateStr);
                        return `
                            <div class="habit-day-item ${isDone ? 'done' : ''}">
                                <div class="habit-day-icon" style="background: ${habit.color}20; color: ${habit.color};">
                                    ${habit.icon || '✅'}
                                </div>
                                <div class="habit-day-name">${_esc(habit.name)}</div>
                                <div class="habit-day-status">
                                    ${isDone ? '<span style="color: var(--success-color);">✓ 已完成</span>' : '<span style="color: var(--text-secondary);">未完成</span>'}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        App.openModal('习惯详情', html, {});
    }

    // ============================================================
    // 11. 徽章墙渲染
    // ============================================================

    function _renderBadgeWall() {
        const wall = containerEl.querySelector('#badgeWall');
        if (!wall) return;

        wall.innerHTML = HABIT_BADGES.map(badge => {
            const earned = AppStorage.hasBadge(badge.id);
            return `
                <div class="badge-item ${earned ? 'earned' : 'locked'}" title="${earned ? badge.description : '未解锁：' + badge.description}">
                    <div class="badge-icon">${earned ? badge.icon : '🔒'}</div>
                    <div class="badge-name">${earned ? badge.name : '???'}</div>
                    <div class="badge-desc">${earned ? badge.description : '未解锁'}</div>
                </div>
            `;
        }).join('');
    }

    // ============================================================
    // 11. 事件绑定
    // ============================================================

    function _bindEvents() {
        if (!containerEl) return;

        // 编辑长期目标
        containerEl.querySelector('[data-action="edit-goals"]')?.addEventListener('click', () => {
            _openGoalsModal();
        });

        // 区域标题上的添加按钮
        containerEl.querySelector('[data-action="add-annual-goal"]')?.addEventListener('click', () => {
            _openAnnualGoalModal();
        });
        containerEl.querySelector('[data-action="add-monthly-goal"]')?.addEventListener('click', () => {
            _openMonthlyGoalModal();
        });
        containerEl.querySelector('[data-action="add-habit"]')?.addEventListener('click', () => {
            _openHabitModal();
        });

        // 年度目标操作
        containerEl.querySelectorAll('[data-action="edit-annual"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const goal = data.annualGoals.find(g => g.id === id);
                if (goal) _openAnnualGoalModal(goal);
            });
        });
        containerEl.querySelectorAll('[data-action="delete-annual"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _deleteAnnualGoal(btn.dataset.id);
            });
        });

        // 本月目标操作
        containerEl.querySelectorAll('[data-action="edit-monthly"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const goal = data.monthlyGoals.find(g => g.id === id);
                if (goal) _openMonthlyGoalModal(goal);
            });
        });
        containerEl.querySelectorAll('[data-action="delete-monthly"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _deleteMonthlyGoal(btn.dataset.id);
            });
        });

        // 习惯操作
        containerEl.querySelectorAll('[data-action="edit-habit"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const habit = data.habits.find(h => h.id === id);
                if (habit) _openHabitModal(habit);
            });
        });
        containerEl.querySelectorAll('[data-action="delete-habit"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _deleteHabit(btn.dataset.id);
            });
        });

        // 习惯打卡点点击
        containerEl.querySelectorAll('.habit-check-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                const cell = dot.closest('.habit-day-cell');
                const habitId = cell?.dataset.habit;
                const date = cell?.dataset.date;
                if (habitId && date) {
                    _toggleHabit(habitId, date);
                    // 更新年度目标进度（英语学习习惯 -> 英语年度目标）
                    _updateAnnualGoalsFromHabits();
                    _renderHabitMatrix();
                    _renderBadgeWall();
                }
            });
        });

        // 日历回顾：切换显示
        containerEl.querySelector('[data-action="toggle-calendar"]')?.addEventListener('click', () => {
            showCalendar = !showCalendar;
            render(containerEl);
        });

        // 日历回顾：上个月
        containerEl.querySelector('[data-action="prev-month-habit"]')?.addEventListener('click', () => {
            calendarMonth--;
            if (calendarMonth < 0) {
                calendarMonth = 11;
                calendarYear--;
            }
            _renderHabitCalendar();
            // 更新月份标题
            const titleEl = containerEl.querySelector('.calendar-title');
            if (titleEl) {
                titleEl.textContent = `${calendarYear}年${calendarMonth + 1}月`;
            }
        });

        // 日历回顾：下个月
        containerEl.querySelector('[data-action="next-month-habit"]')?.addEventListener('click', () => {
            calendarMonth++;
            if (calendarMonth > 11) {
                calendarMonth = 0;
                calendarYear++;
            }
            _renderHabitCalendar();
            // 更新月份标题
            const titleEl = containerEl.querySelector('.calendar-title');
            if (titleEl) {
                titleEl.textContent = `${calendarYear}年${calendarMonth + 1}月`;
            }
        });

        // 日历日期点击：查看当天习惯详情
        containerEl.querySelectorAll('[data-action="habit-cal-day"]').forEach(day => {
            day.addEventListener('click', () => {
                const dateStr = day.dataset.date;
                if (dateStr) {
                    _viewHabitDay(dateStr);
                }
            });
        });
    }

    /**
     * 根据习惯打卡更新年度目标进度
     */
    function _updateAnnualGoalsFromHabits() {
        // 简单映射：统计总打卡天数更新到"健康生活"等年度目标
        // 这里做一个简单的关联：统计所有习惯的总打卡天数
        let totalCheckins = 0;
        for (const date in records) {
            totalCheckins += Object.keys(records[date]).length;
        }

        // 更新第一个年度目标（健康生活）的进度
        const healthGoal = data.annualGoals.find(g => g.title === '健康生活');
        if (healthGoal) {
            let healthDays = 0;
            const healthHabits = data.habits.filter(h => 
                ['h_water', 'h_sleep', 'h_supplement'].includes(h.id) || 
                ['喝够8杯水', '23:30前睡觉', '保健品'].includes(h.name)
            );
            for (const date in records) {
                const allDone = healthHabits.every(h => records[date][h.id]);
                if (allDone) healthDays++;
            }
            healthGoal.currentValue = healthDays;
        }

        // 更新英语学习目标
        const englishGoal = data.annualGoals.find(g => g.title === '英语能力提升');
        if (englishGoal) {
            const englishHabit = data.habits.find(h => h.id === 'h_english' || h.name === '英语学习');
            if (englishHabit) {
                let englishDays = 0;
                for (const date in records) {
                    if (records[date][englishHabit.id]) englishDays++;
                }
                englishGoal.currentValue = englishDays;
            }
        }

        _saveData();
    }

    // ============================================================
    // 12. onAdd - 顶部添加按钮回调
    // ============================================================
    function onAdd() {
        // 默认添加习惯
        _openHabitModal();
    }

    // ============================================================
    // 13. onResume - 页面恢复时刷新
    // ============================================================
    function onResume() {
        if (containerEl) {
            _loadData();
            _checkAndAwardBadges();
            render(containerEl);
        }
    }

    // ============================================================
    // 14. 导出
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
    App.registerModule('habits', HabitsModule);
}
