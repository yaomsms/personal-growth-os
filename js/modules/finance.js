/**
 * finance.js - 财务存钱管理模块
 * 功能分区：
 *   1. 存钱进度总览（年度目标、已存金额、进度条、存钱速度曲线）
 *   2. 月度预算分配（可自定义分类，进度条）
 *   3. 每日收支流水（今日收入/支出、明细、结余）
 *   4. 奶茶零食消费专项统计（联动减脂模块）
 *   5. 剁手冷静区（7天冷静期）
 *   6. 工资到账自动拆分模板
 */

const FinanceModule = (function() {
    'use strict';

    // ============================================================
    // 1. 数据结构与默认值
    // ============================================================
    const STORAGE_KEY = 'finance';

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

    // 默认预算分类
    const DEFAULT_BUDGET_CATEGORIES = [
        { id: 'fbc_rent', name: '房租水电', icon: '🏠', budget: 3000, spent: 0, color: '#a8c9e8' },
        { id: 'fbc_food', name: '饮食三餐', icon: '🍜', budget: 2000, spent: 0, color: '#f5c89a' },
        { id: 'fbc_milktea', name: '奶茶零食', icon: '🧋', budget: 300, spent: 0, color: '#f4b8c4' },
        { id: 'fbc_transport', name: '交通通勤', icon: '🚗', budget: 500, spent: 0, color: '#8bc9a8' },
        { id: 'fbc_study', name: '学习投入', icon: '📚', budget: 500, spent: 0, color: '#c9b8e0' },
        { id: 'fbc_daily', name: '日用百货', icon: '🛒', budget: 500, spent: 0, color: '#f0c987' },
        { id: 'fbc_entertainment', name: '娱乐休闲', icon: '🎮', budget: 500, spent: 0, color: '#e8a0a0' },
        { id: 'fbc_savings', name: '强制储蓄', icon: '🏦', budget: 3000, spent: 0, color: '#7ec8a7' },
    ];

    // 支出分类（用于每日记账）
    const EXPENSE_CATEGORIES = [
        { id: 'breakfast', name: '早餐', icon: '🥐', color: '#f5c89a' },
        { id: 'lunch', name: '午餐', icon: '🍱', color: '#f0c987' },
        { id: 'dinner', name: '晚餐', icon: '🍲', color: '#e8a0a0' },
        { id: 'milktea', name: '奶茶/饮料', icon: '🧋', color: '#f4b8c4' },
        { id: 'snack', name: '零食', icon: '🍿', color: '#c9b8e0' },
        { id: 'transport', name: '交通', icon: '🚇', color: '#8bc9a8' },
        { id: 'other', name: '其他', icon: '📦', color: '#a8c9e8' },
    ];

    // 默认工资拆分模板
    const DEFAULT_SALARY_SPLITS = [
        { id: 'ss_rent', name: '房租水电', percentage: 25, color: '#a8c9e8' },
        { id: 'ss_savings', name: '强制储蓄', percentage: 30, color: '#7ec8a7' },
        { id: 'ss_food', name: '饮食预算', percentage: 20, color: '#f5c89a' },
        { id: 'ss_transport', name: '交通通勤', percentage: 5, color: '#8bc9a8' },
        { id: 'ss_study', name: '学习投入', percentage: 5, color: '#c9b8e0' },
        { id: 'ss_flexible', name: '剩余灵活', percentage: 15, color: '#f0c987' },
    ];

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

        if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
            data = stored;
            // 数据完整性检查
            if (!data.savingsProgress) data.savingsProgress = _getDefaultSavings();
            if (!data.monthlyBudget) data.monthlyBudget = _getDefaultBudget();
            if (!data.transactions) data.transactions = [];
            if (!data.snackStats) data.snackStats = _getDefaultSnackStats();
            if (!data.impulseControlZone) data.impulseControlZone = [];
            if (!data.salarySplit) data.salarySplit = _getDefaultSalarySplit();
            if (!data.longTermGoals) {
                data.longTermGoals = {
                    near: { title: '近期目标（3个月）', content: '养成每日记账习惯，控制不必要开支', progress: 0, icon: '🌱', color: '#7ec8a7' },
                    mid: { title: '中期目标（6个月）', content: '建立稳定储蓄习惯，月存固定金额', progress: 0, icon: '🌿', color: '#a8c9e8' },
                    far: { title: '远期目标（1年）', content: '实现年度存钱目标，财务自由第一步', progress: 0, icon: '🌳', color: '#f5c89a' },
                    ultimate: { title: '终极目标', content: '财务独立，拥有被动收入和投资组合', progress: 0, icon: '🏆', color: '#c9b8e0' },
                };
            }
        } else {
            data = {
                savingsProgress: _getDefaultSavings(),
                monthlyBudget: _getDefaultBudget(),
                transactions: [],
                snackStats: _getDefaultSnackStats(),
                impulseControlZone: [],
                salarySplit: _getDefaultSalarySplit(),
                longTermGoals: {
                    near: {
                        title: '近期目标（3个月）',
                        content: '养成每日记账习惯，控制不必要开支',
                        progress: 0,
                        icon: '🌱',
                        color: '#7ec8a7',
                    },
                    mid: {
                        title: '中期目标（6个月）',
                        content: '建立稳定储蓄习惯，月存固定金额',
                        progress: 0,
                        icon: '🌿',
                        color: '#a8c9e8',
                    },
                    far: {
                        title: '远期目标（1年）',
                        content: '实现年度存钱目标，财务自由第一步',
                        progress: 0,
                        icon: '🌳',
                        color: '#f5c89a',
                    },
                    ultimate: {
                        title: '终极目标',
                        content: '财务独立，拥有被动收入和投资组合',
                        progress: 0,
                        icon: '🏆',
                        color: '#c9b8e0',
                    },
                },
            };
            AppStorage.setModule(STORAGE_KEY, data);
        }

        const now = new Date();
        currentDate = _today();
        calendarMonth = now.getMonth();
        calendarYear = now.getFullYear();
    }

    function _getDefaultSavings() {
        return {
            yearlyTarget: 50000,
            currentSavings: 0,
            monthlySavingsTarget: 4000,
            monthlySaved: 0,
            savingStreak: 0,
            monthlyHistory: [], // [{ month: '2025-01', amount: 4000 }]
        };
    }

    function _getDefaultBudget() {
        const now = new Date();
        return {
            totalBudget: 8000,
            currentMonth: now.getMonth() + 1,
            currentYear: now.getFullYear(),
            categories: [...DEFAULT_BUDGET_CATEGORIES],
        };
    }

    function _getDefaultSnackStats() {
        return {
            milkTeaCount: 0,
            milkTeaBudget: 4,
            snackSpent: 0,
            snackBudget: 200,
            records: [],
        };
    }

    function _getDefaultSalarySplit() {
        return {
            monthlySalary: 12000,
            splits: [...DEFAULT_SALARY_SPLITS],
        };
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

    function _formatMoney(amount) {
        return '¥' + parseFloat(amount).toFixed(2);
    }

    function _formatDateShort(dateStr) {
        const d = new Date(dateStr);
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        return (d.getMonth() + 1) + '月' + d.getDate() + '日 周' + weekDays[d.getDay()];
    }

    function _getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function _getDayTransactions(dateStr) {
        return data.transactions.filter(t => t.date === dateStr);
    }

    function _getDayBalance(dateStr) {
        const dayTrans = _getDayTransactions(dateStr);
        const income = dayTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = dayTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return { income, expense, balance: income - expense };
    }

    function _renderFinanceCalendar() {
        const el = containerEl.querySelector('#financeCalendar');
        if (!el) return;

        const daysInMonth = _getDaysInMonth(calendarYear, calendarMonth);
        const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        const today = _today();

        // 计算当月收支汇总
        const monthStr = calendarYear + '-' + String(calendarMonth + 1).padStart(2, '0');
        const monthTrans = data.transactions.filter(t => t.date && t.date.startsWith(monthStr));
        const monthIncome = monthTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const monthExpense = monthTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        // 计算日均预算（总预算 / 当月天数）
        const totalBudget = data.monthlyBudget.categories.reduce((sum, c) => sum + c.budget, 0);
        const dailyBudget = totalBudget / daysInMonth;

        let daysHtml = '';

        // 填充月初空白
        for (let i = 0; i < firstDay; i++) {
            daysHtml += '<div class="cal-day cal-day empty"></div>';
        }

        // 填充日期
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = calendarYear + '-' + String(calendarMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
            const dayTrans = _getDayTransactions(dateStr);
            const dayBalance = _getDayBalance(dateStr);
            const hasContent = dayTrans.length > 0;
            const isToday = dateStr === today;
            const isOverBudget = dayBalance.expense > dailyBudget;

            daysHtml += `
                <div class="cal-day cal-day ${hasContent ? 'has-content' : ''} ${isToday ? 'today' : ''}" 
                     data-action="finance-cal-day" data-date="${dateStr}">
                    <div class="cal-day-num">${day}</div>
                    ${hasContent ? `
                        <div class="cal-day-amount" style="color: ${isOverBudget ? '#e8a0a0' : '#7ec8a7'};">
                            ${dayBalance.expense > 0 ? '-' + dayBalance.expense.toFixed(0) : '+' + dayBalance.income.toFixed(0)}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        el.innerHTML = `
            <div class="card finance-calendar-card">
                <div class="cal-header">
                    <button class="btn-icon btn-sm" data-action="prev-month-fin">◀</button>
                    <div class="cal-title">${calendarYear}年${calendarMonth + 1}月</div>
                    <button class="btn-icon btn-sm" data-action="next-month-fin">▶</button>
                </div>
                <div class="cal-summary">
                    <span class="cal-summary-income">收入 ${_formatMoney(monthIncome)}</span>
                    <span class="cal-summary-expense">支出 ${_formatMoney(monthExpense)}</span>
                </div>
                <div class="cal-weekdays">
                    ${weekDays.map(w => `<div class="cal-weekday">${w}</div>`).join('')}
                </div>
                <div class="cal-days">
                    ${daysHtml}
                </div>
            </div>
        `;
    }

    function _getMonthStr(date) {
        const d = date || new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }

    function _getTodayTransactions() {
        const today = _today();
        return data.transactions.filter(t => t.date === today);
    }

    function _getMonthTransactions() {
        const now = new Date();
        const monthStr = _getMonthStr(now);
        return data.transactions.filter(t => t.date && t.date.startsWith(monthStr));
    }

    function _updateBudgetSpent() {
        const monthTransactions = _getMonthTransactions();
        const expenses = monthTransactions.filter(t => t.type === 'expense');

        for (const cat of data.monthlyBudget.categories) {
            let spent = 0;
            for (const t of expenses) {
                if (t.budgetCategoryId === cat.id || t.categoryName === cat.name) {
                    spent += t.amount;
                }
            }
            cat.spent = spent;
        }

        // 更新奶茶零食统计
        const milkteaExpenses = expenses.filter(t =>
            t.categoryId === 'milktea' || t.categoryName === '奶茶/饮料' || t.categoryName === '奶茶零食'
        );
        const snackExpenses = expenses.filter(t =>
            t.categoryId === 'snack' || t.categoryName === '零食'
        );

        data.snackStats.milkTeaCount = milkteaExpenses.length;
        data.snackStats.snackSpent = snackExpenses.reduce((sum, t) => sum + t.amount, 0)
            + milkteaExpenses.reduce((sum, t) => sum + t.amount, 0);
    }

    function _updateMonthlySaved() {
        const monthTransactions = _getMonthTransactions();
        const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        data.savingsProgress.monthlySaved = Math.max(0, income - expense);
    }

    // ============================================================
    // 5. 渲染入口
    // ============================================================
    function render(container) {
        containerEl = container;
        if (!data) _loadData();

        _updateBudgetSpent();
        _updateMonthlySaved();

        container.innerHTML = `
            <div class="finance-module">
                <!-- 模块长期总目标 -->
                <div class="section-title">
                    <h2><span class="title-icon">🎯</span>模块长期总目标</h2>
                    <span class="section-action" data-action="edit-goals">编辑</span>
                </div>
                <div class="goals-vertical" id="finLongTermGoals"></div>

                <!-- 存钱进度总览 -->
                <div class="section-title">
                    <h2><span class="title-icon">💰</span>存钱进度总览</h2>
                    <span class="section-action" data-action="edit-savings-target">编辑目标</span>
                </div>
                <div id="savingsOverview"></div>

                <!-- 月度预算分配 -->
                <div class="section-title">
                    <h2><span class="title-icon">📊</span>月度预算分配</h2>
                    <span class="section-action" data-action="add-budget-category">+ 添加分类</span>
                </div>
                <div id="monthlyBudget"></div>

                <!-- 日历账单 -->
                <div class="section-title">
                    <h2><span class="title-icon">📅</span>日历账单</h2>
                    <span class="section-action" data-action="toggle-calendar">📆 ${showCalendar ? '收起' : '展开'}</span>
                </div>
                ${showCalendar ? '<div id="financeCalendar"></div>' : ''}

                <!-- 每日收支流水 -->
                <div class="section-title">
                    <h2><span class="title-icon">📝</span>每日收支流水</h2>
                    <span class="section-action" data-action="add-transaction">+ 记一笔</span>
                </div>
                <div id="dailyTransactions"></div>

                <!-- 奶茶零食消费专项统计 -->
                <div class="section-title">
                    <h2><span class="title-icon">🧋</span>奶茶零食消费统计</h2>
                </div>
                <div id="snackStats"></div>

                <!-- 剁手冷静区 -->
                <div class="section-title">
                    <h2><span class="title-icon">🛒</span>剁手冷静区</h2>
                    <span class="section-action" data-action="add-impulse">+ 添加</span>
                </div>
                <div id="impulseZone"></div>

                <!-- 工资到账自动拆分 -->
                <div class="section-title">
                    <h2><span class="title-icon">💼</span>工资拆分模板</h2>
                    <span class="section-action" data-action="edit-salary">编辑模板</span>
                </div>
                <div id="salarySplit"></div>
            </div>
        `;

        _renderLongTermGoals();
        _renderSavingsOverview();
        _renderMonthlyBudget();
        if (showCalendar) _renderFinanceCalendar();
        _renderDailyTransactions();
        _renderSnackStats();
        _renderImpulseZone();
        _renderSalarySplit();
        _bindEvents();
    }

    // ============================================================
    // 5.5 长期总目标
    // ============================================================

    // 按记账天数自动计算目标进度
    // 近期: 90天, 中期: 180天, 远期: 365天, 终极: 730天
    function _calcGoalProgress(key) {
        // 用有交易记录的日期数作为打卡天数
        const dateSet = new Set();
        data.transactions.forEach(t => {
            if (t.date) dateSet.add(t.date);
        });
        const checkinDays = dateSet.size;
        const dayMap = { near: 90, mid: 180, far: 365, ultimate: 730 };
        const targetDays = dayMap[key] || 90;
        const progress = Math.min(100, Math.round((checkinDays / targetDays) * 1000) / 10);
        return progress;
    }

    function _renderLongTermGoals() {
        const goalsEl = containerEl?.querySelector('#finLongTermGoals');
        if (!goalsEl) return;

        const goals = data.longTermGoals;
        const goalKeys = ['near', 'mid', 'far', 'ultimate'];

        const dateSet = new Set();
        data.transactions.forEach(t => {
            if (t.date) dateSet.add(t.date);
        });
        const checkinDays = dateSet.size;

        goalsEl.innerHTML = goalKeys.map(key => {
            const g = goals[key];
            if (!g) return '';
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
    // 6. 存钱进度总览
    // ============================================================
    function _renderSavingsOverview() {
        const el = containerEl.querySelector('#savingsOverview');
        if (!el) return;

        const sp = data.savingsProgress;
        const percent = sp.yearlyTarget > 0 ? Math.min(100, Math.round((sp.currentSavings / sp.yearlyTarget) * 100)) : 0;
        const remaining = Math.max(0, sp.yearlyTarget - sp.currentSavings);
        const monthPercent = sp.monthlySavingsTarget > 0 ? Math.min(100, Math.round((sp.monthlySaved / sp.monthlySavingsTarget) * 100)) : 0;

        // 近6个月存钱数据
        const monthlyHistory = sp.monthlyHistory || [];
        const last6Months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStr = _getMonthStr(d);
            const record = monthlyHistory.find(m => m.month === monthStr);
            last6Months.push({
                month: monthStr,
                label: (d.getMonth() + 1) + '月',
                amount: record ? record.amount : (i === 0 ? sp.monthlySaved : 0),
            });
        }
        const maxAmount = Math.max(...last6Months.map(m => m.amount), sp.monthlySavingsTarget, 1);

        el.innerHTML = `
            <div class="card savings-card">
                <div class="savings-header">
                    <div class="savings-main">
                        <div class="savings-label">年度存款目标</div>
                        <div class="savings-target">${_formatMoney(sp.yearlyTarget)}</div>
                    </div>
                    <div class="savings-streak">
                        <span class="streak-icon">🔥</span>
                        <span class="streak-num">${sp.savingStreak}</span>
                        <span class="streak-label">连续存</span>
                    </div>
                </div>
                <div class="savings-progress-section">
                    <div class="savings-amount-row">
                        <div class="amount-item">
                            <div class="amount-label">已存金额</div>
                            <div class="amount-value" style="color: #7ec8a7;">${_formatMoney(sp.currentSavings)}</div>
                        </div>
                        <div class="amount-item">
                            <div class="amount-label">距目标还差</div>
                            <div class="amount-value" style="color: #e8a0a0;">${_formatMoney(remaining)}</div>
                        </div>
                        <div class="amount-item">
                            <div class="amount-label">本月已存</div>
                            <div class="amount-value" style="color: #f5c89a;">${_formatMoney(sp.monthlySaved)}</div>
                        </div>
                    </div>
                    <div class="progress progress-lg">
                        <div class="progress-bar" style="width: ${percent}%; background: linear-gradient(90deg, #7ec8a788, #7ec8a7);"></div>
                    </div>
                    <div class="progress-info">
                        <span>年度进度 ${percent}%</span>
                        <span>月目标 ${_formatMoney(sp.monthlySavingsTarget)} · ${monthPercent}%</span>
                    </div>
                </div>
                <div class="savings-chart-section">
                    <div class="chart-title">存钱速度曲线（近6个月）</div>
                    <div class="line-chart">
                        <svg viewBox="0 0 300 100" class="chart-svg">
                            ${last6Months.map((m, i) => {
                                const x = 20 + i * 48;
                                const y = 80 - (m.amount / maxAmount) * 60;
                                return `<circle cx="${x}" cy="${y}" r="4" fill="#7ec8a7" />`;
                            }).join('')}
                            <polyline
                                points="${last6Months.map((m, i) => {
                                    const x = 20 + i * 48;
                                    const y = 80 - (m.amount / maxAmount) * 60;
                                    return `${x},${y}`;
                                }).join(' ')}"
                                fill="none" stroke="#7ec8a7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            />
                            ${last6Months.map((m, i) => {
                                const x = 20 + i * 48;
                                return `<text x="${x}" y="95" text-anchor="middle" class="chart-label">${m.label}</text>`;
                            }).join('')}
                        </svg>
                    </div>
                </div>
            </div>
        `;
    }

    function _openSavingsTargetModal() {
        const sp = data.savingsProgress;
        const html = `
            <div class="form-group">
                <label class="form-label">年度存款目标（元）</label>
                <input type="number" class="form-input" id="yearlyTarget" value="${sp.yearlyTarget}" min="0">
            </div>
            <div class="form-group">
                <label class="form-label">当前存款（元）</label>
                <input type="number" class="form-input" id="currentSavings" value="${sp.currentSavings}" min="0">
            </div>
            <div class="form-group">
                <label class="form-label">每月存款目标（元）</label>
                <input type="number" class="form-input" id="monthlyTarget" value="${sp.monthlySavingsTarget}" min="0">
            </div>
            <div class="form-group">
                <label class="form-label">连续存钱月数</label>
                <input type="number" class="form-input" id="savingStreak" value="${sp.savingStreak}" min="0">
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveSavingsBtn">保存设置</button>
            </div>
        `;

        App.openModal('编辑存钱目标', html, {
            onOpen: () => {
                document.getElementById('saveSavingsBtn')?.addEventListener('click', () => {
                    sp.yearlyTarget = parseFloat(document.getElementById('yearlyTarget').value) || 0;
                    sp.currentSavings = parseFloat(document.getElementById('currentSavings').value) || 0;
                    sp.monthlySavingsTarget = parseFloat(document.getElementById('monthlyTarget').value) || 0;
                    sp.savingStreak = parseInt(document.getElementById('savingStreak').value) || 0;
                    _saveData();
                    _renderSavingsOverview();
                    App.closeModal();
                    App.showSuccess('已保存');
                });
            }
        });
    }

    // ============================================================
    // 7. 月度预算分配
    // ============================================================
    function _renderMonthlyBudget() {
        const el = containerEl.querySelector('#monthlyBudget');
        if (!el) return;

        const mb = data.monthlyBudget;
        const totalSpent = mb.categories.reduce((sum, c) => sum + c.spent, 0);
        const totalBudget = mb.categories.reduce((sum, c) => sum + c.budget, 0);
        const totalRemaining = totalBudget - totalSpent;
        const totalPercent = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

        el.innerHTML = `
            <div class="card budget-summary-card">
                <div class="budget-summary-header">
                    <div>
                        <div class="budget-month">${mb.currentYear}年${mb.currentMonth}月</div>
                        <div class="budget-total">总预算：${_formatMoney(totalBudget)}</div>
                    </div>
                    <div class="budget-remaining ${totalRemaining >= 0 ? 'positive' : 'negative'}">
                        <div class="remaining-label">剩余</div>
                        <div class="remaining-value">${_formatMoney(totalRemaining)}</div>
                    </div>
                </div>
                <div class="progress progress-lg">
                    <div class="progress-bar" style="width: ${totalPercent}%; background: linear-gradient(90deg, #f5c89a88, #f5c89a);"></div>
                </div>
                <div class="budget-summary-info">
                    <span>已花费 ${_formatMoney(totalSpent)}</span>
                    <span>${totalPercent}%</span>
                </div>
            </div>
            <div class="budget-categories-grid">
                ${mb.categories.map(cat => {
                    const percent = cat.budget > 0 ? Math.min(100, Math.round((cat.spent / cat.budget) * 100)) : 0;
                    const remaining = cat.budget - cat.spent;
                    const isOver = remaining < 0;
                    return `
                        <div class="card budget-category-card card-clickable" data-cat-id="${cat.id}">
                            <div class="budget-cat-header">
                                <div class="budget-cat-icon" style="background: ${cat.color}20; color: ${cat.color};">
                                    ${cat.icon || '📦'}
                                </div>
                                <div class="budget-cat-actions">
                                    <button class="btn-icon btn-sm" data-action="edit-budget" data-id="${cat.id}" title="编辑">✏️</button>
                                    <button class="btn-icon btn-sm" data-action="delete-budget" data-id="${cat.id}" title="删除">🗑️</button>
                                </div>
                            </div>
                            <div class="budget-cat-name">${_esc(cat.name)}</div>
                            <div class="budget-cat-amounts">
                                <span class="spent">${_formatMoney(cat.spent)}</span>
                                <span class="budget-sep">/</span>
                                <span class="budget">${_formatMoney(cat.budget)}</span>
                            </div>
                            <div class="progress progress-sm">
                                <div class="progress-bar" style="width: ${percent}%; background: ${isOver ? '#e8a0a0' : cat.color};"></div>
                            </div>
                            <div class="budget-cat-remaining ${isOver ? 'over' : ''}">
                                ${isOver ? '超支 ' + _formatMoney(Math.abs(remaining)) : '剩余 ' + _formatMoney(remaining)}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function _openBudgetModal(cat = null) {
        const isEdit = !!cat;
        const html = `
            <div class="form-group">
                <label class="form-label">分类名称</label>
                <input type="text" class="form-input" id="budgetName" value="${_esc(cat?.name || '')}" placeholder="例如：餐饮">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">图标</label>
                    <input type="text" class="form-input" id="budgetIcon" value="${_esc(cat?.icon || '📦')}" placeholder="emoji">
                </div>
                <div class="form-group">
                    <label class="form-label">预算金额</label>
                    <input type="number" class="form-input" id="budgetAmount" value="${cat?.budget ?? 500}" min="0">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">颜色</label>
                <div class="color-picker">
                    ${COLORS.map(c => `
                        <button class="color-dot ${cat?.color === c ? 'selected' : ''}" 
                                data-color="${c}" 
                                style="background: ${c};"></button>
                    `).join('')}
                </div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveBudgetBtn">${isEdit ? '保存修改' : '添加分类'}</button>
            </div>
        `;

        App.openModal(isEdit ? '编辑预算分类' : '添加预算分类', html, {
            onOpen: () => {
                let selectedColor = cat?.color || COLORS[0];

                document.querySelectorAll('.color-dot').forEach(dot => {
                    dot.addEventListener('click', () => {
                        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
                        dot.classList.add('selected');
                        selectedColor = dot.dataset.color;
                    });
                });

                document.getElementById('saveBudgetBtn')?.addEventListener('click', () => {
                    const name = document.getElementById('budgetName').value.trim();
                    if (!name) {
                        App.showError('请输入分类名称');
                        return;
                    }

                    const catData = {
                        name,
                        icon: document.getElementById('budgetIcon').value.trim() || '📦',
                        budget: parseFloat(document.getElementById('budgetAmount').value) || 0,
                        color: selectedColor,
                    };

                    if (isEdit) {
                        const idx = data.monthlyBudget.categories.findIndex(c => c.id === cat.id);
                        if (idx > -1) {
                            data.monthlyBudget.categories[idx] = { ...data.monthlyBudget.categories[idx], ...catData };
                        }
                        App.showSuccess('已更新');
                    } else {
                        catData.id = _genId('fbc');
                        catData.spent = 0;
                        data.monthlyBudget.categories.push(catData);
                        App.showSuccess('已添加');
                    }

                    _saveData();
                    _renderMonthlyBudget();
                    App.closeModal();
                });
            }
        });
    }

    async function _deleteBudgetCategory(id) {
        const confirmed = await App.confirmModal('确认删除', '确定要删除这个预算分类吗？', {
            confirmText: '删除',
            cancelText: '取消',
        });
        if (confirmed) {
            data.monthlyBudget.categories = data.monthlyBudget.categories.filter(c => c.id !== id);
            _saveData();
            _renderMonthlyBudget();
            App.showSuccess('已删除');
        }
    }

    // ============================================================
    // 8. 每日收支流水
    // ============================================================
    function _renderDailyTransactions() {
        const el = containerEl.querySelector('#dailyTransactions');
        if (!el) return;

        const today = _today();
        const todayTransactions = _getTodayTransactions();
        const income = todayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = todayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expense;

        // 支出按分类分组
        const expenseByCat = {};
        EXPENSE_CATEGORIES.forEach(cat => {
            expenseByCat[cat.id] = { ...cat, items: [], total: 0 };
        });

        todayTransactions.filter(t => t.type === 'expense').forEach(t => {
            const catId = t.categoryId || 'other';
            if (expenseByCat[catId]) {
                expenseByCat[catId].items.push(t);
                expenseByCat[catId].total += t.amount;
            } else {
                expenseByCat.other.items.push(t);
                expenseByCat.other.total += t.amount;
            }
        });

        el.innerHTML = `
            <div class="card daily-trans-card">
                <div class="daily-trans-header">
                    <div class="daily-date">${today}</div>
                    <div class="daily-balance ${balance >= 0 ? 'positive' : 'negative'}">
                        结余：${_formatMoney(balance)}
                    </div>
                </div>
                <div class="daily-trans-summary">
                    <div class="trans-summary-item income">
                        <div class="summary-label">今日收入</div>
                        <div class="summary-value">${_formatMoney(income)}</div>
                    </div>
                    <div class="trans-summary-item expense">
                        <div class="summary-label">今日支出</div>
                        <div class="summary-value">${_formatMoney(expense)}</div>
                    </div>
                </div>
                <div class="daily-expense-detail">
                    <div class="detail-title">支出明细</div>
                    <div class="expense-cat-list">
                        ${EXPENSE_CATEGORIES.map(cat => {
                            const catData = expenseByCat[cat.id];
                            const hasItems = catData && catData.items.length > 0;
                            return `
                                <div class="expense-cat-item ${hasItems ? 'has-items' : ''}">
                                    <div class="expense-cat-icon" style="background: ${cat.color}20; color: ${cat.color};">
                                        ${cat.icon}
                                    </div>
                                    <div class="expense-cat-info">
                                        <div class="expense-cat-name">${cat.name}</div>
                                        <div class="expense-cat-items">
                                            ${hasItems ? catData.items.map(t => `
                                                <span class="expense-item-tag">${_esc(t.note || cat.name)} ${_formatMoney(t.amount)}</span>
                                            `).join('') : '<span class="expense-empty">未记录</span>'}
                                        </div>
                                    </div>
                                    <div class="expense-cat-amount">
                                        ${hasItems ? _formatMoney(catData.total) : '-'}
                                    </div>
                                    <button class="btn-icon btn-sm" data-action="add-expense-cat" data-cat="${cat.id}" title="记一笔">+</button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                ${todayTransactions.length > 0 ? `
                    <div class="trans-list">
                        <div class="detail-title">今日记录</div>
                        ${todayTransactions.map(t => `
                            <div class="trans-item" data-trans-id="${t.id}">
                                <div class="trans-left">
                                    <div class="trans-icon" style="background: ${t.type === 'income' ? '#7ec8a720' : '#e8a0a020'};">
                                        ${t.type === 'income' ? '💰' : '💸'}
                                    </div>
                                    <div class="trans-info">
                                        <div class="trans-name">${_esc(t.categoryName || t.note || (t.type === 'income' ? '收入' : '支出'))}</div>
                                        <div class="trans-note">${_esc(t.note || '')}</div>
                                    </div>
                                </div>
                                <div class="trans-right">
                                    <div class="trans-amount ${t.type === 'income' ? 'income' : 'expense'}">
                                        ${t.type === 'income' ? '+' : '-'}${_formatMoney(t.amount)}
                                    </div>
                                    <button class="btn-icon btn-sm" data-action="delete-trans" data-id="${t.id}" title="删除">🗑️</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    function _openTransactionModal(defaultType = 'expense', defaultCatId = null) {
        const budgetCategories = data.monthlyBudget.categories;
        const html = `
            <div class="form-group">
                <label class="form-label">类型</label>
                <div class="type-tabs">
                    <button class="type-tab ${defaultType === 'expense' ? 'active' : ''}" data-type="expense">支出</button>
                    <button class="type-tab ${defaultType === 'income' ? 'active' : ''}" data-type="income">收入</button>
                </div>
            </div>
            <div class="form-group" id="expenseCatGroup">
                <label class="form-label">支出分类</label>
                <select class="form-select" id="transCategory">
                    ${EXPENSE_CATEGORIES.map(cat => `
                        <option value="${cat.id}" ${defaultCatId === cat.id ? 'selected' : ''}>${cat.icon} ${cat.name}</option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group" id="budgetCatGroup">
                <label class="form-label">预算分类（统计用）</label>
                <select class="form-select" id="budgetCategory">
                    <option value="">不归类</option>
                    ${budgetCategories.map(cat => `
                        <option value="${cat.id}">${cat.icon} ${cat.name}</option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">金额（元）</label>
                <input type="number" class="form-input" id="transAmount" value="" placeholder="0.00" step="0.01" min="0">
            </div>
            <div class="form-group">
                <label class="form-label">备注</label>
                <input type="text" class="form-input" id="transNote" placeholder="例如：楼下便利店">
            </div>
            <div class="form-group">
                <label class="form-label">日期</label>
                <input type="date" class="form-input" id="transDate" value="${_today()}">
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveTransBtn">保存</button>
            </div>
        `;

        App.openModal('记一笔', html, {
            onOpen: () => {
                let currentType = defaultType;

                // 类型切换
                document.querySelectorAll('.type-tab').forEach(tab => {
                    tab.addEventListener('click', () => {
                        document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
                        tab.classList.add('active');
                        currentType = tab.dataset.type;
                        const expGroup = document.getElementById('expenseCatGroup');
                        const budGroup = document.getElementById('budgetCatGroup');
                        if (expGroup) expGroup.style.display = currentType === 'expense' ? '' : 'none';
                        if (budGroup) budGroup.style.display = currentType === 'expense' ? '' : 'none';
                    });
                });

                document.getElementById('saveTransBtn')?.addEventListener('click', () => {
                    const amount = parseFloat(document.getElementById('transAmount').value);
                    if (!amount || amount <= 0) {
                        App.showError('请输入有效金额');
                        return;
                    }

                    const categoryId = currentType === 'expense' ? document.getElementById('transCategory').value : null;
                    const catInfo = EXPENSE_CATEGORIES.find(c => c.id === categoryId);
                    const budgetCatId = document.getElementById('budgetCategory').value || null;

                    const transaction = {
                        id: _genId('trans'),
                        type: currentType,
                        amount,
                        categoryId,
                        categoryName: catInfo ? catInfo.name : (currentType === 'income' ? '收入' : '其他'),
                        budgetCategoryId: budgetCatId,
                        note: document.getElementById('transNote').value.trim(),
                        date: document.getElementById('transDate').value || _today(),
                        createdAt: Date.now(),
                    };

                    data.transactions.push(transaction);
                    _saveData();
                    _updateBudgetSpent();
                    _updateMonthlySaved();
                    _renderDailyTransactions();
                    _renderMonthlyBudget();
                    _renderSavingsOverview();
                    _renderSnackStats();
                    App.closeModal();
                    App.showSuccess('已记录');
                });
            }
        });
    }

    async function _deleteTransaction(id) {
        const confirmed = await App.confirmModal('确认删除', '确定要删除这条记录吗？', {
            confirmText: '删除',
            cancelText: '取消',
        });
        if (confirmed) {
            data.transactions = data.transactions.filter(t => t.id !== id);
            _saveData();
            _updateBudgetSpent();
            _updateMonthlySaved();
            _renderDailyTransactions();
            _renderMonthlyBudget();
            _renderSavingsOverview();
            _renderSnackStats();
            App.showSuccess('已删除');
        }
    }

    // ============================================================
    // 9. 奶茶零食消费专项统计
    // ============================================================
    function _renderSnackStats() {
        const el = containerEl.querySelector('#snackStats');
        if (!el) return;

        const ss = data.snackStats;
        const milkteaPercent = ss.milkTeaBudget > 0 ? Math.min(100, Math.round((ss.milkTeaCount / ss.milkTeaBudget) * 100)) : 0;
        const snackPercent = ss.snackBudget > 0 ? Math.min(100, Math.round((ss.snackSpent / ss.snackBudget) * 100)) : 0;
        const isMilkteaOver = ss.milkTeaCount > ss.milkTeaBudget;
        const isSnackOver = ss.snackSpent > ss.snackBudget;

        // 近30天趋势（简化：按周分组）
        const now = new Date();
        const weekData = [];
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - i * 7 - 6);
            const weekEnd = new Date(now);
            weekEnd.setDate(now.getDate() - i * 7);
            const startStr = App.formatDate(weekStart);
            const endStr = App.formatDate(weekEnd);

            const weekRecords = ss.records.filter(r => r.date >= startStr && r.date <= endStr);
            const milkteaCount = weekRecords.filter(r => r.type === 'milktea').length;
            const snackAmount = weekRecords.filter(r => r.type === 'snack').reduce((sum, r) => sum + r.amount, 0);

            weekData.push({
                label: `第${4 - i}周`,
                milktea: milkteaCount,
                snack: snackAmount,
            });
        }
        const maxMilktea = Math.max(...weekData.map(w => w.milktea), ss.milkTeaBudget, 1);
        const maxSnack = Math.max(...weekData.map(w => w.snack), ss.snackBudget / 4, 1);

        el.innerHTML = `
            <div class="card snack-stats-card">
                <div class="snack-stats-row">
                    <div class="snack-stat-item">
                        <div class="snack-stat-icon">🧋</div>
                        <div class="snack-stat-info">
                            <div class="snack-stat-name">本月奶茶</div>
                            <div class="snack-stat-value">
                                <span class="${isMilkteaOver ? 'over' : ''}">${ss.milkTeaCount}</span>
                                <span class="snack-stat-unit">/ ${ss.milkTeaBudget} 杯</span>
                            </div>
                        </div>
                    </div>
                    <div class="snack-stat-item">
                        <div class="snack-stat-icon">🍿</div>
                        <div class="snack-stat-info">
                            <div class="snack-stat-name">本月零食</div>
                            <div class="snack-stat-value">
                                <span class="${isSnackOver ? 'over' : ''}">${_formatMoney(ss.snackSpent)}</span>
                                <span class="snack-stat-unit">/ ${_formatMoney(ss.snackBudget)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                ${isMilkteaOver || isSnackOver ? `
                    <div class="snack-warning">
                        ⚠️ ${isMilkteaOver ? '奶茶已超标！' : ''}${isSnackOver ? '零食花费已超标！' : ''} 注意控制哦～
                    </div>
                ` : ''}
                <div class="progress-row">
                    <div class="progress-item">
                        <div class="progress-label">奶茶杯数</div>
                        <div class="progress progress-sm">
                            <div class="progress-bar" style="width: ${milkteaPercent}%; background: ${isMilkteaOver ? '#e8a0a0' : '#f4b8c4'};"></div>
                        </div>
                    </div>
                    <div class="progress-item">
                        <div class="progress-label">零食花费</div>
                        <div class="progress progress-sm">
                            <div class="progress-bar" style="width: ${snackPercent}%; background: ${isSnackOver ? '#e8a0a0' : '#c9b8e0'};"></div>
                        </div>
                    </div>
                </div>
                <div class="snack-chart-title">近30天趋势</div>
                <div class="snack-chart">
                    ${weekData.map(w => `
                        <div class="chart-bar-group">
                            <div class="chart-bars">
                                <div class="chart-bar milktea-bar" style="height: ${(w.milktea / maxMilktea) * 100}%;" title="奶茶${w.milktea}杯"></div>
                                <div class="chart-bar snack-bar" style="height: ${(w.snack / maxSnack) * 100}%;" title="零食${_formatMoney(w.snack)}"></div>
                            </div>
                            <div class="chart-bar-label">${w.label}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="snack-chart-legend">
                    <span><i class="legend-dot" style="background: #f4b8c4;"></i>奶茶杯数</span>
                    <span><i class="legend-dot" style="background: #c9b8e0;"></i>零食花费</span>
                </div>
            </div>
        `;
    }

    // ============================================================
    // 10. 剁手冷静区
    // ============================================================
    function _renderImpulseZone() {
        const el = containerEl.querySelector('#impulseZone');
        if (!el) return;

        const items = data.impulseControlZone || [];
        const waitingItems = items.filter(i => i.status === 'waiting');
        const decidedItems = items.filter(i => i.status !== 'waiting').slice(-5).reverse();

        el.innerHTML = `
            ${waitingItems.length === 0 && decidedItems.length === 0 ? `
                <div class="empty-state" style="padding: var(--spacing-xl);">
                    <div class="empty-state-icon">🛒</div>
                    <div class="empty-state-text">还没有想买的东西，理性消费棒棒哒！</div>
                </div>
            ` : ''}
            ${waitingItems.length > 0 ? `
                <div class="impulse-waiting-list">
                    ${waitingItems.map(item => {
                        const addedDate = new Date(item.addedDate);
                        const now = new Date();
                        const daysPassed = Math.floor((now - addedDate) / (1000 * 60 * 60 * 24));
                        const cooldownDays = item.cooldownDays || 7;
                        const daysLeft = Math.max(0, cooldownDays - daysPassed);
                        const progress = Math.min(100, Math.round((daysPassed / cooldownDays) * 100));
                        const canDecide = daysLeft === 0;

                        return `
                            <div class="card impulse-card">
                                <div class="impulse-header">
                                    <div class="impulse-name">${_esc(item.name)}</div>
                                    <div class="impulse-price">${_formatMoney(item.price)}</div>
                                </div>
                                <div class="impulse-reason">${_esc(item.reason || '想买的理由...')}</div>
                                <div class="impulse-timeline">
                                    <div class="impulse-date">加入：${item.addedDate}</div>
                                    <div class="impulse-days-left ${canDecide ? 'can-decide' : ''}">
                                        ${canDecide ? '⏰ 冷静期已到，快做决定！' : `还有 ${daysLeft} 天冷静期`}
                                    </div>
                                </div>
                                <div class="progress progress-sm">
                                    <div class="progress-bar" style="width: ${progress}%; background: linear-gradient(90deg, #a8c9e888, #a8c9e8);"></div>
                                </div>
                                <div class="impulse-actions">
                                    <button class="btn btn-sm btn-success" data-action="impulse-buy" data-id="${item.id}" ${canDecide ? '' : 'disabled'}>买它</button>
                                    <button class="btn btn-sm btn-danger" data-action="impulse-cancel" data-id="${item.id}" ${canDecide ? '' : 'disabled'}>不买</button>
                                    <button class="btn-icon btn-sm" data-action="delete-impulse" data-id="${item.id}" title="删除">🗑️</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : ''}
            ${decidedItems.length > 0 ? `
                <div class="impulse-history">
                    <div class="section-subtitle">历史决定</div>
                    <div class="impulse-history-list">
                        ${decidedItems.map(item => `
                            <div class="impulse-history-item">
                                <span class="impulse-history-name">${_esc(item.name)}</span>
                                <span class="impulse-history-price">${_formatMoney(item.price)}</span>
                                <span class="impulse-history-status ${item.status === 'purchased' ? 'bought' : 'cancelled'}">
                                    ${item.status === 'purchased' ? '已买' : '忍住了'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    function _openImpulseModal() {
        const html = `
            <div class="form-group">
                <label class="form-label">想买的东西</label>
                <input type="text" class="form-input" id="impulseName" placeholder="例如：新款耳机">
            </div>
            <div class="form-group">
                <label class="form-label">价格（元）</label>
                <input type="number" class="form-input" id="impulsePrice" placeholder="0.00" step="0.01" min="0">
            </div>
            <div class="form-group">
                <label class="form-label">想买的理由</label>
                <textarea class="form-textarea" id="impulseReason" placeholder="为什么想买？真的需要吗？"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">冷静期（天）</label>
                <input type="number" class="form-input" id="impulseDays" value="7" min="1" max="30">
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveImpulseBtn">加入冷静区</button>
            </div>
        `;

        App.openModal('添加剁手冷静', html, {
            onOpen: () => {
                document.getElementById('saveImpulseBtn')?.addEventListener('click', () => {
                    const name = document.getElementById('impulseName').value.trim();
                    const price = parseFloat(document.getElementById('impulsePrice').value);
                    if (!name) {
                        App.showError('请输入商品名称');
                        return;
                    }
                    if (!price || price <= 0) {
                        App.showError('请输入有效价格');
                        return;
                    }

                    const item = {
                        id: _genId('imp'),
                        name,
                        price,
                        reason: document.getElementById('impulseReason').value.trim(),
                        addedDate: _today(),
                        cooldownDays: parseInt(document.getElementById('impulseDays').value) || 7,
                        status: 'waiting',
                        createdAt: Date.now(),
                    };

                    data.impulseControlZone.push(item);
                    _saveData();
                    _renderImpulseZone();
                    App.closeModal();
                    App.showSuccess('已加入冷静区');
                });
            }
        });
    }

    function _decideImpulse(id, decision) {
        const item = data.impulseControlZone.find(i => i.id === id);
        if (!item) return;

        item.status = decision;
        item.decidedDate = _today();
        _saveData();
        _renderImpulseZone();

        if (decision === 'cancelled') {
            App.showSuccess(`太棒了！又省下了 ${_formatMoney(item.price)} 🎉`);
        } else {
            App.showSuccess('已记录购买决定');
        }
    }

    async function _deleteImpulse(id) {
        const confirmed = await App.confirmModal('确认删除', '确定要删除这条记录吗？', {
            confirmText: '删除',
            cancelText: '取消',
        });
        if (confirmed) {
            data.impulseControlZone = data.impulseControlZone.filter(i => i.id !== id);
            _saveData();
            _renderImpulseZone();
            App.showSuccess('已删除');
        }
    }

    // ============================================================
    // 11. 工资拆分模板
    // ============================================================
    function _renderSalarySplit() {
        const el = containerEl.querySelector('#salarySplit');
        if (!el) return;

        const ss = data.salarySplit;
        const totalPercent = ss.splits.reduce((sum, s) => sum + s.percentage, 0);

        el.innerHTML = `
            <div class="card salary-split-card">
                <div class="salary-header">
                    <div class="salary-amount">
                        <span class="salary-label">工资总额</span>
                        <span class="salary-value">${_formatMoney(ss.monthlySalary)}</span>
                    </div>
                    <div class="salary-total-percent ${totalPercent === 100 ? 'ok' : 'warn'}">
                        分配：${totalPercent}%
                    </div>
                </div>
                <div class="salary-visual">
                    <div class="salary-bar">
                        ${ss.splits.map(s => `
                            <div class="salary-segment" 
                                 style="width: ${s.percentage}%; background: ${s.color};"
                                 title="${s.name}: ${s.percentage}% (${_formatMoney(ss.monthlySalary * s.percentage / 100)})">
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="salary-splits-list">
                    ${ss.splits.map(s => {
                        const amount = ss.monthlySalary * s.percentage / 100;
                        return `
                            <div class="salary-split-item">
                                <div class="split-color" style="background: ${s.color};"></div>
                                <div class="split-info">
                                    <div class="split-name">${_esc(s.name)}</div>
                                    <div class="split-percent">${s.percentage}%</div>
                                </div>
                                <div class="split-amount">${_formatMoney(amount)}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    function _openSalaryModal() {
        const ss = data.salarySplit;
        const html = `
            <div class="form-group">
                <label class="form-label">月工资总额（元）</label>
                <input type="number" class="form-input" id="salaryAmount" value="${ss.monthlySalary}" min="0">
            </div>
            <div class="form-group">
                <label class="form-label">拆分比例</label>
                <div class="salary-split-editor" id="salarySplitEditor">
                    ${ss.splits.map((s, idx) => `
                        <div class="split-editor-row" data-idx="${idx}">
                            <div class="split-color-preview" style="background: ${s.color};"></div>
                            <input type="text" class="form-input split-name-input" value="${_esc(s.name)}" placeholder="分类名">
                            <input type="number" class="form-input split-percent-input" value="${s.percentage}" min="0" max="100" placeholder="%">
                            <span class="percent-sign">%</span>
                            <button class="btn-icon btn-sm" data-action="remove-split" data-idx="${idx}">🗑️</button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-sm btn-outline mt-sm" id="addSplitBtn">+ 添加分类</button>
            </div>
            <div class="salary-total-check" id="salaryTotalCheck">
                合计：<span id="totalPercent">${ss.splits.reduce((sum, s) => sum + s.percentage, 0)}</span>%
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveSalaryBtn">保存模板</button>
            </div>
        `;

        App.openModal('编辑工资拆分模板', html, {
            onOpen: () => {
                function updateTotal() {
                    let total = 0;
                    document.querySelectorAll('.split-percent-input').forEach(input => {
                        total += parseFloat(input.value) || 0;
                    });
                    const totalEl = document.getElementById('totalPercent');
                    if (totalEl) {
                        totalEl.textContent = total;
                        totalEl.style.color = total === 100 ? '#7ec8a7' : (total > 100 ? '#e8a0a0' : '#f5c89a');
                    }
                }

                // 百分比变化时更新合计
                document.querySelectorAll('.split-percent-input').forEach(input => {
                    input.addEventListener('input', updateTotal);
                });

                // 添加分类
                document.getElementById('addSplitBtn')?.addEventListener('click', () => {
                    const editor = document.getElementById('salarySplitEditor');
                    const colorIdx = editor.querySelectorAll('.split-editor-row').length % COLORS.length;
                    const newRow = document.createElement('div');
                    newRow.className = 'split-editor-row';
                    newRow.innerHTML = `
                        <div class="split-color-preview" style="background: ${COLORS[colorIdx]};"></div>
                        <input type="text" class="form-input split-name-input" value="" placeholder="分类名">
                        <input type="number" class="form-input split-percent-input" value="0" min="0" max="100" placeholder="%">
                        <span class="percent-sign">%</span>
                        <button class="btn-icon btn-sm" data-action="remove-split">🗑️</button>
                    `;
                    editor.appendChild(newRow);

                    newRow.querySelector('.split-percent-input')?.addEventListener('input', updateTotal);
                    newRow.querySelector('[data-action="remove-split"]')?.addEventListener('click', () => {
                        newRow.remove();
                        updateTotal();
                    });
                });

                // 删除分类
                document.querySelectorAll('[data-action="remove-split"]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const row = btn.closest('.split-editor-row');
                        if (row) {
                            row.remove();
                            updateTotal();
                        }
                    });
                });

                document.getElementById('saveSalaryBtn')?.addEventListener('click', () => {
                    const salary = parseFloat(document.getElementById('salaryAmount').value) || 0;
                    const rows = document.querySelectorAll('.split-editor-row');
                    const splits = [];

                    rows.forEach((row, idx) => {
                        const name = row.querySelector('.split-name-input')?.value.trim();
                        const percent = parseFloat(row.querySelector('.split-percent-input')?.value) || 0;
                        const color = row.querySelector('.split-color-preview')?.style.background || COLORS[idx % COLORS.length];
                        if (name && percent >= 0) {
                            splits.push({
                                id: ss.splits[idx]?.id || _genId('ss'),
                                name,
                                percentage: percent,
                                color,
                            });
                        }
                    });

                    if (splits.length === 0) {
                        App.showError('至少保留一个分类');
                        return;
                    }

                    ss.monthlySalary = salary;
                    ss.splits = splits;
                    _saveData();
                    _renderSalarySplit();
                    App.closeModal();
                    App.showSuccess('已保存');
                });
            }
        });
    }

    // ============================================================
    // 12. 日历账单详情
    // ============================================================
    function _viewFinanceDay(dateStr) {
        const dayTrans = _getDayTransactions(dateStr);
        const dayBalance = _getDayBalance(dateStr);
        const incomeList = dayTrans.filter(t => t.type === 'income');
        const expenseList = dayTrans.filter(t => t.type === 'expense');

        const html = `
            <div class="fin-day-detail">
                <div class="fin-day-date">${_formatDateShort(dateStr)}</div>
                <div class="fin-day-summary">
                    <div class="fin-day-item income">
                        <div class="fin-day-label">收入</div>
                        <div class="fin-day-value">${_formatMoney(dayBalance.income)}</div>
                    </div>
                    <div class="fin-day-item expense">
                        <div class="fin-day-label">支出</div>
                        <div class="fin-day-value">${_formatMoney(dayBalance.expense)}</div>
                    </div>
                    <div class="fin-day-item balance">
                        <div class="fin-day-label">结余</div>
                        <div class="fin-day-value ${dayBalance.balance >= 0 ? 'positive' : 'negative'}">${_formatMoney(dayBalance.balance)}</div>
                    </div>
                </div>
                ${incomeList.length > 0 ? `
                    <div class="fin-day-section">
                        <div class="fin-day-section-title">收入明细（${incomeList.length}笔）</div>
                        <div class="fin-day-trans-list">
                            ${incomeList.map(t => `
                                <div class="fin-day-trans-item">
                                    <div class="fin-day-trans-left">
                                        <div class="fin-day-trans-icon" style="background: #7ec8a720;">💰</div>
                                        <div class="fin-day-trans-info">
                                            <div class="fin-day-trans-name">${_esc(t.categoryName || t.note || '收入')}</div>
                                            <div class="fin-day-trans-note">${_esc(t.note || '')}</div>
                                        </div>
                                    </div>
                                    <div class="fin-day-trans-amount income">+${_formatMoney(t.amount)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                ${expenseList.length > 0 ? `
                    <div class="fin-day-section">
                        <div class="fin-day-section-title">支出明细（${expenseList.length}笔）</div>
                        <div class="fin-day-trans-list">
                            ${expenseList.map(t => `
                                <div class="fin-day-trans-item">
                                    <div class="fin-day-trans-left">
                                        <div class="fin-day-trans-icon" style="background: #e8a0a020;">💸</div>
                                        <div class="fin-day-trans-info">
                                            <div class="fin-day-trans-name">${_esc(t.categoryName || t.note || '支出')}</div>
                                            <div class="fin-day-trans-note">${_esc(t.note || '')}</div>
                                        </div>
                                    </div>
                                    <div class="fin-day-trans-amount expense">-${_formatMoney(t.amount)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                ${dayTrans.length === 0 ? `
                    <div class="empty-state" style="padding: var(--spacing-xl);">
                        <div class="empty-state-icon">📭</div>
                        <div class="empty-state-text">这一天没有账单记录</div>
                    </div>
                ` : ''}
            </div>
        `;

        App.openModal(_formatDateShort(dateStr) + ' 账单', html, {});
    }

    // ============================================================
    // 13. 事件绑定
    // ============================================================
    function _bindEvents() {
        if (!containerEl) return;

        // 编辑长期目标
        containerEl.querySelector('[data-action="edit-goals"]')?.addEventListener('click', () => {
            _openGoalsModal();
        });

        // 存钱目标编辑
        containerEl.querySelector('[data-action="edit-savings-target"]')?.addEventListener('click', () => {
            _openSavingsTargetModal();
        });

        // 预算分类操作
        containerEl.querySelector('[data-action="add-budget-category"]')?.addEventListener('click', () => {
            _openBudgetModal();
        });
        containerEl.querySelectorAll('[data-action="edit-budget"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const cat = data.monthlyBudget.categories.find(c => c.id === id);
                if (cat) _openBudgetModal(cat);
            });
        });
        containerEl.querySelectorAll('[data-action="delete-budget"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _deleteBudgetCategory(btn.dataset.id);
            });
        });

        // 交易记录操作
        containerEl.querySelector('[data-action="add-transaction"]')?.addEventListener('click', () => {
            _openTransactionModal();
        });
        containerEl.querySelectorAll('[data-action="add-expense-cat"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _openTransactionModal('expense', btn.dataset.cat);
            });
        });
        containerEl.querySelectorAll('[data-action="delete-trans"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _deleteTransaction(btn.dataset.id);
            });
        });

        // 剁手冷静区操作
        containerEl.querySelector('[data-action="add-impulse"]')?.addEventListener('click', () => {
            _openImpulseModal();
        });
        containerEl.querySelectorAll('[data-action="impulse-buy"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _decideImpulse(btn.dataset.id, 'purchased');
            });
        });
        containerEl.querySelectorAll('[data-action="impulse-cancel"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _decideImpulse(btn.dataset.id, 'cancelled');
            });
        });
        containerEl.querySelectorAll('[data-action="delete-impulse"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _deleteImpulse(btn.dataset.id);
            });
        });

        // 工资拆分
        containerEl.querySelector('[data-action="edit-salary"]')?.addEventListener('click', () => {
            _openSalaryModal();
        });

        // 日历账单
        containerEl.querySelector('[data-action="toggle-calendar"]')?.addEventListener('click', () => {
            showCalendar = !showCalendar;
            render(containerEl);
        });

        containerEl.querySelector('[data-action="prev-month-fin"]')?.addEventListener('click', () => {
            calendarMonth--;
            if (calendarMonth < 0) {
                calendarMonth = 11;
                calendarYear--;
            }
            _renderFinanceCalendar();
        });

        containerEl.querySelector('[data-action="next-month-fin"]')?.addEventListener('click', () => {
            calendarMonth++;
            if (calendarMonth > 11) {
                calendarMonth = 0;
                calendarYear++;
            }
            _renderFinanceCalendar();
        });

        containerEl.querySelectorAll('[data-action="finance-cal-day"]').forEach(day => {
            day.addEventListener('click', (e) => {
                e.stopPropagation();
                const dateStr = day.dataset.date;
                if (dateStr) {
                    _viewFinanceDay(dateStr);
                }
            });
        });
    }

    // ============================================================
    // 13. onAdd / onResume
    // ============================================================
    function onAdd() {
        _openTransactionModal();
    }

    function onResume() {
        if (containerEl) {
            _loadData();
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
    App.registerModule('finance', FinanceModule);
}
