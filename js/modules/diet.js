/**
 * diet.js - 减脂饮食记录模块
 * 功能分区：
 *   1. 固定规则提示（每周奶茶上限2杯，不吃晚餐可少量无糖零食）
 *   2. 今日饮食记录：早餐、午餐、晚餐、饮品、零食
 *   3. 当日饮食反思 + 次日调整
 *   4. 历史记录查看
 *   5. 花费自动同步财务模块
 */

const DietModule = (function() {
    'use strict';

    // ============================================================
    // 1. 数据结构与默认值
    // ============================================================
    const STORAGE_KEY = 'diet';

    // 颜色调色板（柔和浅色系）
    const COLORS = {
        primary: '#7ec8a7',    // 薄荷绿 - 主色
        breakfast: '#f5c89a',  // 浅橙 - 早餐
        lunch: '#a8c9e8',      // 浅蓝 - 午餐
        dinner: '#c9b8e0',     // 浅紫 - 晚餐
        drink: '#f4b8c4',      // 浅粉 - 饮品
        snack: '#f0c987',      // 暖黄 - 零食
        warning: '#e8a0a0',    // 浅红 - 警告
        water: '#8bc9e8',      // 水蓝
    };

    // 饮食规则
    const DIET_RULES = [
        { icon: '🧋', text: '每周奶茶上限 2 杯', type: 'warning' },
        { icon: '🌙', text: '不吃晚餐可少量无糖零食', type: 'info' },
        { icon: '💧', text: '每日喝够 8 杯水', type: 'info' },
    ];

    // 零食选项
    const SNACK_OPTIONS = [
        { value: 'none', label: '无零食', icon: '✅' },
        { value: 'light', label: '少量饼干/无糖零食', icon: '🍪' },
        { value: 'heavy', label: '高糖膨化零食', icon: '🍟' },
    ];

    // 餐次类型
    const MEAL_TYPES = {
        breakfast: { label: '早餐', icon: '🌅', color: COLORS.breakfast, key: 'breakfast' },
        lunch: { label: '午餐', icon: '☀️', color: COLORS.lunch, key: 'lunch' },
        dinner: { label: '晚餐', icon: '🌙', color: COLORS.dinner, key: 'dinner' },
    };

    // 默认今日饮食记录结构
    function _getDefaultDayRecord(dateStr) {
        return {
            date: dateStr,
            breakfast: { content: '', image: '', cost: 0, recorded: false },
            lunch: { content: '', image: '', cost: 0, recorded: false },
            dinner: { content: '', image: '', cost: 0, skipDinner: false, recorded: false },
            drinks: {
                milkTea: 0,      // 奶茶/含糖饮料杯数
                water: 0,        // 白水/无糖茶杯数
                milkTeaList: [], // 奶茶记录 [{id, name, amount, note}]
            },
            snack: {
                type: 'none',    // none / light / heavy
                cost: 0,
                note: '',
            },
            reflection: '',       // 当日饮食反思
            nextDayPlan: '',      // 次日调整计划
            totalCost: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
    }

    // ============================================================
    // 2. 状态管理
    // ============================================================
    let data = null;
    let currentDate = null;
    let containerEl = null;
    let historyView = false; // 是否在历史记录视图
    let calendarMonth = null;
    let calendarYear = null;

    // ============================================================
    // 3. 初始化
    // ============================================================
    function init() {
        _loadData();
    }

    /**
     * 加载数据
     */
    function _loadData() {
        const stored = AppStorage.getModule(STORAGE_KEY);
        if (stored && stored.records && typeof stored.records === 'object' && !Array.isArray(stored.records)) {
            data = stored;
            // 确保 settings 存在
            if (!data.settings) {
                data.settings = {
                    weeklyMilkTeaLimit: 2,
                    skipDinnerSnackAllowed: true,
                    dailyWaterGoal: 8,
                };
            }
        } else {
            data = {
                records: {},  // { 'YYYY-MM-DD': { ...dayRecord } }
                settings: {
                    weeklyMilkTeaLimit: 2,
                    skipDinnerSnackAllowed: true,
                    dailyWaterGoal: 8,
                },
            };
            AppStorage.setModule(STORAGE_KEY, data);
        }
        currentDate = _today();
        const now = new Date();
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
     * 获取某日记录，不存在则创建默认
     */
    function _getDayRecord(dateStr) {
        if (!data.records[dateStr]) {
            data.records[dateStr] = _getDefaultDayRecord(dateStr);
            _saveData();
        }
        return data.records[dateStr];
    }

    /**
     * 更新某日记录
     */
    function _updateDayRecord(dateStr, updates) {
        const record = _getDayRecord(dateStr);
        data.records[dateStr] = { ...record, ...updates, updatedAt: Date.now() };
        _recalculateTotalCost(dateStr);
        _saveData();
    }

    /**
     * 重新计算当日总花费
     */
    function _recalculateTotalCost(dateStr) {
        const r = data.records[dateStr];
        if (!r) return;
        let total = 0;
        if (r.breakfast?.cost) total += parseFloat(r.breakfast.cost) || 0;
        if (r.lunch?.cost) total += parseFloat(r.lunch.cost) || 0;
        if (r.dinner?.cost) total += parseFloat(r.dinner.cost) || 0;
        if (r.snack?.cost) total += parseFloat(r.snack.cost) || 0;
        if (r.drinks?.milkTeaList) {
            r.drinks.milkTeaList.forEach(item => {
                total += parseFloat(item.amount) || 0;
            });
        }
        r.totalCost = Math.round(total * 100) / 100;
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

    function _formatDate(dateStr) {
        const d = new Date(dateStr);
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return `${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`;
    }

    /**
     * 获取本周奶茶总杯数
     */
    function _getWeeklyMilkTeaCount(dateStr) {
        const d = new Date(dateStr);
        const day = d.getDay() || 7; // 周日为7
        const monday = new Date(d);
        monday.setDate(d.getDate() - day + 1);
        
        let count = 0;
        for (let i = 0; i < 7; i++) {
            const checkDate = new Date(monday);
            checkDate.setDate(monday.getDate() + i);
            const dateKey = App.formatDate(checkDate);
            const record = data.records[dateKey];
            if (record && record.drinks) {
                count += record.drinks.milkTea || 0;
            }
        }
        return count;
    }

    /**
     * 同步到财务模块
     */
    function _syncToFinance(dateStr, mealType, cost, note) {
        if (!cost || cost <= 0) return;
        
        const financeData = AppStorage.getModule('finance') || {};
        if (!financeData.transactions) financeData.transactions = [];
        if (!financeData.monthlyBudget) {
            // 财务模块未初始化则跳过
            return;
        }

        // 查找是否已有该餐次的同步记录（用 diet 标记）
        const existingIdx = financeData.transactions.findIndex(t => 
            t.dietSyncId && t.dietSyncId === `${dateStr}_${mealType}`
        );

        const categoryMap = {
            breakfast: { name: '餐饮', id: 'fbc1' },
            lunch: { name: '餐饮', id: 'fbc1' },
            dinner: { name: '餐饮', id: 'fbc1' },
            snack: { name: '餐饮', id: 'fbc1' },
            milktea: { name: '餐饮', id: 'fbc1' },
        };

        const cat = categoryMap[mealType] || { name: '餐饮', id: 'fbc1' };
        const mealLabels = {
            breakfast: '早餐',
            lunch: '午餐',
            dinner: '晚餐',
            snack: '零食',
            milktea: '奶茶',
        };

        const transaction = {
            id: existingIdx > -1 ? financeData.transactions[existingIdx].id : _genId('tx'),
            amount: parseFloat(cost) || 0,
            type: 'expense',
            categoryId: cat.id,
            categoryName: cat.name,
            note: note || `饮食记录 - ${mealLabels[mealType] || mealType}`,
            date: dateStr,
            dietSyncId: `${dateStr}_${mealType}`,
            createdAt: existingIdx > -1 ? financeData.transactions[existingIdx].createdAt : Date.now(),
        };

        if (existingIdx > -1) {
            financeData.transactions[existingIdx] = transaction;
        } else {
            financeData.transactions.push(transaction);
        }

        // 更新月度预算花费
        const budgetCat = financeData.monthlyBudget?.categories?.find(c => c.id === cat.id);
        if (budgetCat) {
            // 重新计算该分类的总支出
            const monthStart = new Date(dateStr);
            monthStart.setDate(1);
            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            
            let catSpent = 0;
            financeData.transactions.forEach(t => {
                if (t.type === 'expense' && t.categoryId === cat.id) {
                    const tDate = new Date(t.date);
                    if (tDate >= monthStart && tDate < monthEnd) {
                        catSpent += parseFloat(t.amount) || 0;
                    }
                }
            });
            budgetCat.spent = Math.round(catSpent * 100) / 100;
        }

        AppStorage.setModule('finance', financeData);
    }

    // ============================================================
    // 5. 渲染入口
    // ============================================================

    function render(container) {
        containerEl = container;
        if (!data) _loadData();

        if (historyView) {
            _renderHistoryView();
        } else {
            _renderTodayView();
        }
        _bindEvents();
    }

    /**
     * 渲染今日视图
     */
    function _renderTodayView() {
        const record = _getDayRecord(currentDate);
        const weeklyMilkTea = _getWeeklyMilkTeaCount(currentDate);
        const milkTeaLimit = data.settings.weeklyMilkTeaLimit;
        const milkTeaOver = weeklyMilkTea >= milkTeaLimit;

        containerEl.innerHTML = `
            <div class="diet-module">
                <!-- 日期切换 -->
                <div class="diet-date-nav">
                    <button class="btn-icon" data-action="prev-day" title="前一天">◀</button>
                    <div class="diet-date-display">
                        <span class="date-main">${_formatDate(currentDate)}</span>
                        ${currentDate === _today() ? '<span class="date-tag today-tag">今天</span>' : ''}
                        <button class="btn-text" data-action="goto-today" style="${currentDate === _today() ? 'display:none;' : ''}">回到今天</button>
                    </div>
                    <button class="btn-icon" data-action="next-day" title="后一天">▶</button>
                </div>

                <!-- 固定规则提示 -->
                <div class="section-title">
                    <h2><span class="title-icon">📋</span>饮食规则</h2>
                    <span class="section-action" data-action="view-history">历史记录</span>
                </div>
                <div class="rules-card">
                    ${DIET_RULES.map(rule => `
                        <div class="rule-item ${rule.type}">
                            <span class="rule-icon">${rule.icon}</span>
                            <span class="rule-text">${rule.text}</span>
                        </div>
                    `).join('')}
                    <div class="rule-item ${milkTeaOver ? 'warning' : 'info'}">
                        <span class="rule-icon">🧋</span>
                        <span class="rule-text">本周已喝 <strong style="color:${milkTeaOver ? COLORS.warning : COLORS.primary}">${weeklyMilkTea}/${milkTeaLimit}</strong> 杯奶茶</span>
                    </div>
                </div>

                <!-- 今日花费概览 -->
                <div class="diet-cost-overview card" style="background: linear-gradient(135deg, ${COLORS.primary}20, ${COLORS.breakfast}20);">
                    <div class="cost-overview-item">
                        <div class="cost-label">今日饮食花费</div>
                        <div class="cost-value">¥${record.totalCost?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div class="cost-overview-item">
                        <div class="cost-label">本周奶茶</div>
                        <div class="cost-value" style="color: ${milkTeaOver ? COLORS.warning : COLORS.primary}">${weeklyMilkTea}/${milkTeaLimit} 杯</div>
                    </div>
                </div>

                <!-- 三餐记录 -->
                <div class="section-title">
                    <h2><span class="title-icon">🍽️</span>三餐记录</h2>
                </div>
                <div class="meals-grid">
                    ${_renderMealCard('breakfast', record.breakfast)}
                    ${_renderMealCard('lunch', record.lunch)}
                    ${_renderDinnerCard(record.dinner)}
                </div>

                <!-- 饮品统计 -->
                <div class="section-title">
                    <h2><span class="title-icon">🥤</span>饮品统计</h2>
                </div>
                <div class="card drinks-card">
                    <div class="drinks-row">
                        <div class="drink-item">
                            <div class="drink-icon" style="background: ${COLORS.drink}20;">🧋</div>
                            <div class="drink-info">
                                <div class="drink-label">奶茶/含糖饮料</div>
                                <div class="drink-value" style="color: ${milkTeaOver ? COLORS.warning : COLORS.drink}">
                                    ${record.drinks.milkTea || 0} 杯
                                </div>
                            </div>
                            <div class="drink-actions">
                                <button class="btn-icon btn-sm" data-action="edit-milktea" title="编辑奶茶记录">✏️</button>
                            </div>
                        </div>
                        <div class="drink-item">
                            <div class="drink-icon" style="background: ${COLORS.water}20;">💧</div>
                            <div class="drink-info">
                                <div class="drink-label">白水/无糖茶</div>
                                <div class="drink-value" style="color: ${COLORS.water}">
                                    ${record.drinks.water || 0} / ${data.settings.dailyWaterGoal} 杯
                                </div>
                            </div>
                            <div class="drink-actions">
                                <button class="btn-icon btn-sm" data-action="water-minus" title="减少">−</button>
                                <button class="btn-icon btn-sm" data-action="water-plus" title="增加">+</button>
                            </div>
                        </div>
                    </div>
                    ${record.drinks.milkTeaList && record.drinks.milkTeaList.length > 0 ? `
                        <div class="milktea-list">
                            <div class="milktea-list-title">奶茶明细</div>
                            ${record.drinks.milkTeaList.map(item => `
                                <div class="milktea-item" data-milktea-id="${item.id}">
                                    <span class="milktea-name">${_esc(item.name || '奶茶')}</span>
                                    <span class="milktea-amount">¥${(parseFloat(item.amount) || 0).toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>

                <!-- 零食情况 -->
                <div class="section-title">
                    <h2><span class="title-icon">🍪</span>零食情况</h2>
                </div>
                <div class="card snack-card">
                    <div class="snack-display">
                        <div class="snack-icon">${SNACK_OPTIONS.find(o => o.value === record.snack.type)?.icon || '✅'}</div>
                        <div class="snack-info">
                            <div class="snack-type">${SNACK_OPTIONS.find(o => o.value === record.snack.type)?.label || '无零食'}</div>
                            ${record.snack.cost > 0 ? `<div class="snack-cost">花费 ¥${parseFloat(record.snack.cost).toFixed(2)}</div>` : ''}
                            ${record.snack.note ? `<div class="snack-note">${_esc(record.snack.note)}</div>` : ''}
                        </div>
                        <button class="btn-icon" data-action="edit-snack" title="编辑">✏️</button>
                    </div>
                </div>

                <!-- 饮食反思 -->
                <div class="section-title">
                    <h2><span class="title-icon">💭</span>饮食反思</h2>
                </div>
                <div class="card reflection-card" data-action="edit-reflection">
                    ${record.reflection ? `
                        <div class="reflection-content">${_esc(record.reflection)}</div>
                    ` : `
                        <div class="reflection-placeholder">点击记录今日饮食反思...</div>
                    `}
                    ${record.nextDayPlan ? `
                        <div class="next-day-plan">
                            <div class="plan-label">📝 次日调整</div>
                            <div class="plan-content">${_esc(record.nextDayPlan)}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 渲染单个餐次卡片
     */
    function _renderMealCard(type, meal) {
        const info = MEAL_TYPES[type];
        return `
            <div class="card meal-card" data-meal="${type}">
                <div class="meal-header">
                    <div class="meal-icon" style="background: ${info.color}20;">${info.icon}</div>
                    <div class="meal-title">${info.label}</div>
                    <button class="btn-icon btn-sm" data-action="edit-meal" data-meal="${type}" title="编辑">✏️</button>
                </div>
                ${meal.recorded && meal.content ? `
                    <div class="meal-content">${_esc(meal.content)}</div>
                ` : `
                    <div class="meal-empty">点击记录${info.label}</div>
                `}
                ${meal.image ? `<div class="meal-image"><img src="${_esc(meal.image)}" alt="${info.label}"></div>` : ''}
                <div class="meal-footer">
                    ${meal.cost > 0 ? `<span class="meal-cost">¥${parseFloat(meal.cost).toFixed(2)}</span>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 渲染晚餐卡片（特殊：有不吃晚餐选项）
     */
    function _renderDinnerCard(dinner) {
        const info = MEAL_TYPES.dinner;
        return `
            <div class="card meal-card" data-meal="dinner">
                <div class="meal-header">
                    <div class="meal-icon" style="background: ${info.color}20;">${info.icon}</div>
                    <div class="meal-title">${info.label}</div>
                    <button class="btn-icon btn-sm" data-action="edit-meal" data-meal="dinner" title="编辑">✏️</button>
                </div>
                ${dinner.skipDinner ? `
                    <div class="skip-dinner-badge">🌙 不吃晚餐</div>
                    ${dinner.content ? `<div class="meal-content">${_esc(dinner.content)}</div>` : ''}
                ` : dinner.recorded && dinner.content ? `
                    <div class="meal-content">${_esc(dinner.content)}</div>
                ` : `
                    <div class="meal-empty">点击记录晚餐</div>
                `}
                ${dinner.image ? `<div class="meal-image"><img src="${_esc(dinner.image)}" alt="晚餐"></div>` : ''}
                <div class="meal-footer">
                    ${dinner.cost > 0 ? `<span class="meal-cost">¥${parseFloat(dinner.cost).toFixed(2)}</span>` : ''}
                    ${dinner.skipDinner ? '<span class="meal-tag">少量无糖零食可</span>' : ''}
                </div>
            </div>
        `;
    }

    /**
     * 渲染历史记录视图
     */
    function _renderHistoryView() {
        const records = Object.values(data.records)
            .filter(r => r.date !== currentDate || true)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const monthLabel = `${calendarYear}年${calendarMonth + 1}月`;
        const monthStats = _getMonthDietStats(calendarYear, calendarMonth);

        containerEl.innerHTML = `
            <div class="diet-module">
                <div class="section-title">
                    <h2><span class="title-icon">📅</span>历史记录</h2>
                    <span class="section-action" data-action="back-today">← 返回今日</span>
                </div>

                <!-- 日历 -->
                <div class="diet-calendar-section">
                    <div class="month-nav">
                        <button class="btn-icon" data-action="prev-month-diet">◀</button>
                        <div class="month-label">${monthLabel}</div>
                        <button class="btn-icon" data-action="next-month-diet">▶</button>
                    </div>
                    <div class="month-mini-stats">
                        <span>📝 ${monthStats.recordDays} 天有记录</span>
                        <span>💰 ¥${monthStats.totalCost.toFixed(0)} 花费</span>
                        <span>🧋 ${monthStats.milkTeaCount} 杯奶茶</span>
                    </div>
                    <div class="diet-calendar-mini">
                        ${_renderDietCalendar(calendarYear, calendarMonth)}
                    </div>
                </div>

                ${records.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-text">还没有历史记录</div>
                    </div>
                ` : `
                    <div class="section-title" style="margin-top: var(--spacing-lg);">
                        <h3><span class="title-icon">📋</span>详细记录</h3>
                    </div>
                    <div class="history-list">
                        ${records.map(r => `
                            <div class="card history-item" data-date="${r.date}" data-action="view-day">
                                <div class="history-date">
                                    <div class="history-date-main">${_formatDate(r.date)}</div>
                                    <div class="history-date-sub">花费 ¥${r.totalCost?.toFixed(2) || '0.00'}</div>
                                </div>
                                <div class="history-summary">
                                    <div class="history-meals">
                                        ${r.breakfast?.recorded ? '<span class="meal-dot" style="background:' + COLORS.breakfast + ';" title="早餐">🌅</span>' : ''}
                                        ${r.lunch?.recorded ? '<span class="meal-dot" style="background:' + COLORS.lunch + ';" title="午餐">☀️</span>' : ''}
                                        ${r.dinner?.skipDinner ? '<span class="meal-dot skip" title="不吃晚餐">🌙</span>' : (r.dinner?.recorded ? '<span class="meal-dot" style="background:' + COLORS.dinner + ';" title="晚餐">🌙</span>' : '')}
                                    </div>
                                    ${r.drinks?.milkTea > 0 ? `<span class="history-tag milktea">🧋 ${r.drinks.milkTea}</span>` : ''}
                                    ${r.snack?.type === 'heavy' ? '<span class="history-tag snack-heavy">🍟 零食</span>' : r.snack?.type === 'light' ? '<span class="history-tag snack-light">🍪 零食</span>' : ''}
                                </div>
                                <div class="history-arrow">›</div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    }

    function _getMonthDietStats(year, month) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let stats = { recordDays: 0, totalCost: 0, milkTeaCount: 0 };

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const record = data.records[dateStr];
            if (record) {
                let hasContent = false;
                if (record.breakfast?.recorded || record.lunch?.recorded || record.dinner?.recorded) hasContent = true;
                if (record.drinks?.milkTea > 0) hasContent = true;
                if (record.snack?.type) hasContent = true;
                if (record.reflection) hasContent = true;
                if (hasContent) {
                    stats.recordDays++;
                    stats.totalCost += record.totalCost || 0;
                    stats.milkTeaCount += record.drinks?.milkTea || 0;
                }
            }
        }

        return stats;
    }

    function _renderDietCalendar(year, month) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

        let html = '<div class="cal-weekdays">';
        weekDays.forEach(d => {
            html += `<div class="cal-weekday">${d}</div>`;
        });
        html += '</div><div class="cal-days">';

        for (let i = 0; i < firstDay; i++) {
            html += '<div class="cal-day empty"></div>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === _today();
            const isSelected = dateStr === currentDate;
            const record = data.records[dateStr];
            let hasContent = false;
            let mealCount = 0;
            let hasMilkTea = false;

            if (record) {
                if (record.breakfast?.recorded) { hasContent = true; mealCount++; }
                if (record.lunch?.recorded) { hasContent = true; mealCount++; }
                if (record.dinner?.recorded) { hasContent = true; mealCount++; }
                if (record.drinks?.milkTea > 0) { hasContent = true; hasMilkTea = true; }
                if (record.snack?.type) hasContent = true;
            }

            html += `
                <div class="cal-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasContent ? 'has-content' : ''}"
                     data-date="${dateStr}" data-action="diet-cal-day">
                    <div class="cal-day-num">${day}</div>
                    ${hasContent ? `
                        <div class="cal-dots">
                            ${mealCount >= 2 ? '<div class="cal-dot" style="background:#7ec8a7;"></div>' : ''}
                            ${hasMilkTea ? '<div class="cal-dot" style="background:#f5c89a;"></div>' : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    // ============================================================
    // 6. 模态框编辑
    // ============================================================

    /**
     * 编辑餐次模态框
     */
    function _openMealModal(mealType) {
        const record = _getDayRecord(currentDate);
        const meal = record[mealType] || {};
        const info = MEAL_TYPES[mealType];
        const isDinner = mealType === 'dinner';

        const html = `
            <div class="form-group">
                <label class="form-label">${info.label}内容</label>
                <textarea class="form-textarea" id="mealContent" placeholder="记录${info.label}吃了什么...">${_esc(meal.content || '')}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">花费 (元)</label>
                <input type="number" class="form-input" id="mealCost" value="${meal.cost || ''}" min="0" step="0.01" placeholder="0.00">
            </div>
            <div class="form-group">
                <label class="form-label">图片上传</label>
                <div class="image-upload-area" id="imageUploadArea">
                    ${meal.image ? `
                        <img src="${_esc(meal.image)}" id="mealPreviewImg" class="preview-image">
                        <button class="btn-text" id="removeImageBtn">移除图片</button>
                    ` : `
                        <input type="file" id="mealImageInput" accept="image/*" style="display:none;">
                        <div class="upload-placeholder">
                            <div class="upload-icon">📷</div>
                            <div class="upload-text">点击上传图片</div>
                        </div>
                    `}
                </div>
            </div>
            ${isDinner ? `
                <div class="form-group">
                    <label class="form-switch">
                        <input type="checkbox" id="skipDinner" ${meal.skipDinner ? 'checked' : ''}>
                        <span>不吃晚餐（可少量无糖零食）</span>
                    </label>
                </div>
            ` : ''}
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveMealBtn">保存记录</button>
            </div>
        `;

        App.openModal(`记录${info.label}`, html, {
            onOpen: () => {
                let imageData = meal.image || '';

                // 图片上传
                const uploadArea = document.getElementById('imageUploadArea');
                const fileInput = document.getElementById('mealImageInput');
                
                uploadArea?.addEventListener('click', () => {
                    fileInput?.click();
                });

                fileInput?.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                            App.showError('图片大小不能超过5MB');
                            return;
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            imageData = ev.target.result;
                            uploadArea.innerHTML = `
                                <img src="${imageData}" class="preview-image">
                                <button class="btn-text" id="removeImageBtn">移除图片</button>
                            `;
                            document.getElementById('removeImageBtn')?.addEventListener('click', (e) => {
                                e.stopPropagation();
                                imageData = '';
                                uploadArea.innerHTML = `
                                    <input type="file" id="mealImageInput" accept="image/*" style="display:none;">
                                    <div class="upload-placeholder">
                                        <div class="upload-icon">📷</div>
                                        <div class="upload-text">点击上传图片</div>
                                    </div>
                                `;
                                document.getElementById('mealImageInput')?.addEventListener('change', arguments.callee);
                            });
                        };
                        reader.readAsDataURL(file);
                    }
                });

                document.getElementById('removeImageBtn')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    imageData = '';
                    uploadArea.innerHTML = `
                        <input type="file" id="mealImageInput" accept="image/*" style="display:none;">
                        <div class="upload-placeholder">
                            <div class="upload-icon">📷</div>
                            <div class="upload-text">点击上传图片</div>
                        </div>
                    `;
                    document.getElementById('mealImageInput')?.addEventListener('change', (ev) => {
                        const file = ev.target.files[0];
                        if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                                App.showError('图片大小不能超过5MB');
                                return;
                            }
                            const reader = new FileReader();
                            reader.onload = (ev2) => {
                                imageData = ev2.target.result;
                                uploadArea.innerHTML = `
                                    <img src="${imageData}" class="preview-image">
                                    <button class="btn-text" id="removeImageBtn2">移除图片</button>
                                `;
                            };
                            reader.readAsDataURL(file);
                        }
                    });
                });

                document.getElementById('saveMealBtn')?.addEventListener('click', () => {
                    const content = document.getElementById('mealContent').value.trim();
                    const cost = parseFloat(document.getElementById('mealCost').value) || 0;
                    const skipDinner = isDinner ? document.getElementById('skipDinner').checked : false;

                    const mealData = {
                        content,
                        cost,
                        image: imageData,
                        recorded: true,
                    };
                    if (isDinner) {
                        mealData.skipDinner = skipDinner;
                    }

                    const updatedMeal = { ...record[mealType], ...mealData };
                    record[mealType] = updatedMeal;
                    _updateDayRecord(currentDate, { [mealType]: updatedMeal });

                    // 同步到财务模块
                    _syncToFinance(currentDate, mealType, cost, content ? `${info.label}: ${content}` : info.label);

                    App.showSuccess(`${info.label}记录已保存`);
                    _renderTodayView();
                    _bindEvents();
                    App.closeModal();
                });
            }
        });
    }

    /**
     * 编辑奶茶记录模态框
     */
    function _openMilkTeaModal() {
        const record = _getDayRecord(currentDate);
        const milkTeaList = record.drinks.milkTeaList || [];

        const html = `
            <div class="form-group">
                <label class="form-label">今日奶茶/含糖饮料</label>
                <div class="milktea-editor-list" id="milkteaEditorList">
                    ${milkTeaList.map(item => `
                        <div class="milktea-editor-item" data-id="${item.id}">
                            <input type="text" class="form-input milktea-name-input" value="${_esc(item.name || '')}" placeholder="名称">
                            <input type="number" class="form-input milktea-amount-input" value="${item.amount || 0}" min="0" step="0.01" placeholder="价格">
                            <button class="btn-icon btn-sm" data-action="remove-milktea-item" data-id="${item.id}">🗑️</button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn-text mt-sm" data-action="add-milktea-item">+ 添加一杯</button>
            </div>
            <div class="form-group">
                <label class="form-label">快速调整杯数</label>
                <div class="counter-control">
                    <button class="btn-icon" data-action="milktea-dec">−</button>
                    <span class="counter-value" id="milkteaCountDisplay">${record.drinks.milkTea || 0} 杯</span>
                    <button class="btn-icon" data-action="milktea-inc">+</button>
                </div>
            </div>
            <div class="form-hint">
                ⚠️ 每周奶茶上限 ${data.settings.weeklyMilkTeaLimit} 杯，本周已喝 ${_getWeeklyMilkTeaCount(currentDate)} 杯
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveMilkTeaBtn">保存</button>
            </div>
        `;

        App.openModal('编辑饮品记录', html, {
            onOpen: () => {
                let localList = [...milkTeaList];

                function _renderList() {
                    const listEl = document.getElementById('milkteaEditorList');
                    if (!listEl) return;
                    listEl.innerHTML = localList.map(item => `
                        <div class="milktea-editor-item" data-id="${item.id}">
                            <input type="text" class="form-input milktea-name-input" value="${_esc(item.name || '')}" placeholder="名称">
                            <input type="number" class="form-input milktea-amount-input" value="${item.amount || 0}" min="0" step="0.01" placeholder="价格">
                            <button class="btn-icon btn-sm" data-action="remove-milktea-item" data-id="${item.id}">🗑️</button>
                        </div>
                    `).join('');
                    _bindListEvents();
                }

                function _bindListEvents() {
                    // 名称输入
                    document.querySelectorAll('.milktea-name-input').forEach(input => {
                        input.addEventListener('input', (e) => {
                            const item = e.target.closest('.milktea-editor-item');
                            const id = item?.dataset.id;
                            if (id) {
                                const found = localList.find(i => i.id === id);
                                if (found) found.name = e.target.value;
                            }
                        });
                    });
                    // 价格输入
                    document.querySelectorAll('.milktea-amount-input').forEach(input => {
                        input.addEventListener('input', (e) => {
                            const item = e.target.closest('.milktea-editor-item');
                            const id = item?.dataset.id;
                            if (id) {
                                const found = localList.find(i => i.id === id);
                                if (found) found.amount = parseFloat(e.target.value) || 0;
                            }
                        });
                    });
                    // 删除
                    document.querySelectorAll('[data-action="remove-milktea-item"]').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = btn.dataset.id;
                            localList = localList.filter(i => i.id !== id);
                            _updateCountDisplay();
                            _renderList();
                        });
                    });
                }

                function _updateCountDisplay() {
                    const display = document.getElementById('milkteaCountDisplay');
                    if (display) display.textContent = localList.length + ' 杯';
                }

                // 添加一杯
                document.querySelector('[data-action="add-milktea-item"]')?.addEventListener('click', () => {
                    localList.push({
                        id: _genId('mt'),
                        name: '',
                        amount: 0,
                    });
                    _renderList();
                    _updateCountDisplay();
                });

                // 加减按钮
                document.querySelector('[data-action="milktea-inc"]')?.addEventListener('click', () => {
                    localList.push({ id: _genId('mt'), name: '奶茶', amount: 0 });
                    _renderList();
                    _updateCountDisplay();
                });

                document.querySelector('[data-action="milktea-dec"]')?.addEventListener('click', () => {
                    if (localList.length > 0) {
                        localList.pop();
                        _renderList();
                        _updateCountDisplay();
                    }
                });

                _bindListEvents();

                document.getElementById('saveMilkTeaBtn')?.addEventListener('click', () => {
                    const drinks = { ...record.drinks, milkTeaList: localList, milkTea: localList.length };
                    record.drinks = drinks;
                    _updateDayRecord(currentDate, { drinks });

                    // 同步奶茶花费到财务
                    let totalMilkTeaCost = 0;
                    let milkteaNames = [];
                    localList.forEach(item => {
                        totalMilkTeaCost += parseFloat(item.amount) || 0;
                        if (item.name) milkteaNames.push(item.name);
                    });
                    if (totalMilkTeaCost > 0) {
                        _syncToFinance(currentDate, 'milktea', totalMilkTeaCost, 
                            milkteaNames.length > 0 ? '奶茶: ' + milkteaNames.join('、') : '奶茶');
                    }

                    App.showSuccess('饮品记录已保存');
                    _renderTodayView();
                    _bindEvents();
                    App.closeModal();
                });
            }
        });
    }

    /**
     * 编辑零食模态框
     */
    function _openSnackModal() {
        const record = _getDayRecord(currentDate);
        const snack = record.snack || { type: 'none', cost: 0, note: '' };

        const html = `
            <div class="form-group">
                <label class="form-label">零食情况</label>
                <div class="snack-options">
                    ${SNACK_OPTIONS.map(opt => `
                        <label class="snack-option ${snack.type === opt.value ? 'selected' : ''}" data-value="${opt.value}">
                            <span class="snack-option-icon">${opt.icon}</span>
                            <span class="snack-option-label">${opt.label}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">花费 (元)</label>
                <input type="number" class="form-input" id="snackCost" value="${snack.cost || ''}" min="0" step="0.01" placeholder="0.00">
            </div>
            <div class="form-group">
                <label class="form-label">备注</label>
                <textarea class="form-textarea" id="snackNote" placeholder="吃了什么零食...">${_esc(snack.note || '')}</textarea>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveSnackBtn">保存</button>
            </div>
        `;

        App.openModal('编辑零食记录', html, {
            onOpen: () => {
                let selectedType = snack.type;

                document.querySelectorAll('.snack-option').forEach(opt => {
                    opt.addEventListener('click', () => {
                        document.querySelectorAll('.snack-option').forEach(o => o.classList.remove('selected'));
                        opt.classList.add('selected');
                        selectedType = opt.dataset.value;
                    });
                });

                document.getElementById('saveSnackBtn')?.addEventListener('click', () => {
                    const cost = parseFloat(document.getElementById('snackCost').value) || 0;
                    const note = document.getElementById('snackNote').value.trim();

                    const snackData = {
                        type: selectedType,
                        cost,
                        note,
                    };

                    record.snack = snackData;
                    _updateDayRecord(currentDate, { snack: snackData });

                    // 同步到财务
                    if (cost > 0) {
                        const snackLabel = SNACK_OPTIONS.find(o => o.value === selectedType)?.label || '零食';
                        _syncToFinance(currentDate, 'snack', cost, note || snackLabel);
                    }

                    App.showSuccess('零食记录已保存');
                    _renderTodayView();
                    _bindEvents();
                    App.closeModal();
                });
            }
        });
    }

    /**
     * 编辑反思模态框
     */
    function _openReflectionModal() {
        const record = _getDayRecord(currentDate);

        const html = `
            <div class="form-group">
                <label class="form-label">今日饮食反思</label>
                <textarea class="form-textarea" id="reflectionText" rows="4" placeholder="今天饮食怎么样？有哪些做得好/需要改进的地方？">${_esc(record.reflection || '')}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">次日调整计划</label>
                <textarea class="form-textarea" id="nextDayPlanText" rows="3" placeholder="明天打算怎么调整？">${_esc(record.nextDayPlan || '')}</textarea>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveReflectionBtn">保存反思</button>
            </div>
        `;

        App.openModal('饮食反思', html, {
            onOpen: () => {
                document.getElementById('saveReflectionBtn')?.addEventListener('click', () => {
                    const reflection = document.getElementById('reflectionText').value.trim();
                    const nextDayPlan = document.getElementById('nextDayPlanText').value.trim();

                    _updateDayRecord(currentDate, { reflection, nextDayPlan });

                    App.showSuccess('反思已保存');
                    _renderTodayView();
                    _bindEvents();
                    App.closeModal();
                });
            }
        });
    }

    // ============================================================
    // 7. 事件绑定
    // ============================================================

    function _bindEvents() {
        if (!containerEl) return;

        // 日期导航
        containerEl.querySelector('[data-action="prev-day"]')?.addEventListener('click', () => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() - 1);
            currentDate = App.formatDate(d);
            _renderTodayView();
            _bindEvents();
        });

        containerEl.querySelector('[data-action="next-day"]')?.addEventListener('click', () => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() + 1);
            currentDate = App.formatDate(d);
            _renderTodayView();
            _bindEvents();
        });

        containerEl.querySelector('[data-action="goto-today"]')?.addEventListener('click', () => {
            currentDate = _today();
            _renderTodayView();
            _bindEvents();
        });

        // 历史记录
        containerEl.querySelector('[data-action="view-history"]')?.addEventListener('click', () => {
            historyView = true;
            _renderHistoryView();
            _bindEvents();
        });

        containerEl.querySelector('[data-action="back-today"]')?.addEventListener('click', () => {
            historyView = false;
            currentDate = _today();
            _renderTodayView();
            _bindEvents();
        });

        // 日历月份切换
        containerEl.querySelector('[data-action="prev-month-diet"]')?.addEventListener('click', () => {
            calendarMonth--;
            if (calendarMonth < 0) {
                calendarMonth = 11;
                calendarYear--;
            }
            _renderHistoryView();
            _bindEvents();
        });

        containerEl.querySelector('[data-action="next-month-diet"]')?.addEventListener('click', () => {
            calendarMonth++;
            if (calendarMonth > 11) {
                calendarMonth = 0;
                calendarYear++;
            }
            _renderHistoryView();
            _bindEvents();
        });

        // 日历日期点击
        containerEl.querySelectorAll('[data-action="diet-cal-day"]').forEach(day => {
            day.addEventListener('click', () => {
                const date = day.dataset.date;
                if (date) {
                    currentDate = date;
                    historyView = false;
                    _renderTodayView();
                    _bindEvents();
                }
            });
        });

        // 历史记录点击查看
        containerEl.querySelectorAll('[data-action="view-day"]').forEach(item => {
            item.addEventListener('click', () => {
                const date = item.dataset.date;
                if (date) {
                    currentDate = date;
                    historyView = false;
                    _renderTodayView();
                    _bindEvents();
                }
            });
        });

        // 编辑餐次
        containerEl.querySelectorAll('[data-action="edit-meal"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mealType = btn.dataset.meal;
                if (mealType) _openMealModal(mealType);
            });
        });

        // 点击餐卡也可以编辑
        containerEl.querySelectorAll('.meal-card').forEach(card => {
            card.addEventListener('click', () => {
                const mealType = card.dataset.meal;
                if (mealType) _openMealModal(mealType);
            });
        });

        // 奶茶编辑
        containerEl.querySelector('[data-action="edit-milktea"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            _openMilkTeaModal();
        });

        // 水量加减
        containerEl.querySelector('[data-action="water-plus"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const record = _getDayRecord(currentDate);
            const water = (record.drinks.water || 0) + 1;
            record.drinks.water = water;
            _updateDayRecord(currentDate, { drinks: { ...record.drinks, water } });
            _renderTodayView();
            _bindEvents();
        });

        containerEl.querySelector('[data-action="water-minus"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const record = _getDayRecord(currentDate);
            const water = Math.max(0, (record.drinks.water || 0) - 1);
            record.drinks.water = water;
            _updateDayRecord(currentDate, { drinks: { ...record.drinks, water } });
            _renderTodayView();
            _bindEvents();
        });

        // 零食编辑
        containerEl.querySelector('[data-action="edit-snack"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            _openSnackModal();
        });

        // 反思编辑
        containerEl.querySelector('[data-action="edit-reflection"]')?.addEventListener('click', () => {
            _openReflectionModal();
        });
    }

    // ============================================================
    // 8. onAdd - 顶部添加按钮回调
    // ============================================================
    function onAdd() {
        // 默认添加早餐记录
        _openMealModal('breakfast');
    }

    // ============================================================
    // 9. onResume - 页面恢复时刷新
    // ============================================================
    function onResume() {
        if (containerEl) {
            _loadData();
            render(containerEl);
        }
    }

    // ============================================================
    // 10. 导出
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
    App.registerModule('diet', DietModule);
}
