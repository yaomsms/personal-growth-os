/**
 * health.js - 健康管理中心模块
 * 功能分区：
 *   1. 顶部数据同步区（华为运动健康、蚂蚁阿福）
 *   2. 经期追踪日历
 *   3. 保健品/药物服用打卡
 *   4. 当前观察期专区（健康实验记录）
 *   5. 症状日记
 *   6. 睡眠质量细分
 *   7. 体重/围度追踪
 *   8. 每日健康问卷
 */

const HealthModule = (function() {
    'use strict';

    // ============================================================
    // 1. 数据结构与默认值
    // ============================================================
    const STORAGE_KEY = 'health';

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

    // 默认保健品列表
    const DEFAULT_SUPPLEMENTS = [
        { id: 'sup_d3', name: '阳光瓶D3', dosage: '1粒/天', time: '早餐后', icon: '☀️', color: '#f5c89a', status: 'active', streak: 0 },
        { id: 'sup_omega3', name: '鱼油Omega-3', dosage: '1粒/天', time: '晚餐后', icon: '🐟', color: '#a8c9e8', status: 'paused', streak: 0, note: '暂停观察中' },
        { id: 'sup_probiotic', name: '益生菌', dosage: '1袋/天', time: '早餐前', icon: '🦠', color: '#7ec8a7', status: 'paused', streak: 0, note: '暂停观察中' },
        { id: 'sup_herb', name: '黄芪/玫瑰茯苓', dosage: '1包/天', time: '下午', icon: '🌹', color: '#f4b8c4', status: 'active', streak: 0 },
    ];

    // 默认观察项目
    const DEFAULT_OBSERVATIONS = [
        {
            id: 'obs1',
            name: '暂停Omega-3，观察早醒情况',
            supplement: '鱼油Omega-3',
            action: '暂停',
            startDate: null,
            endDate: null,
            durationDays: 14,
            purpose: '观察暂停后早醒情况是否改善',
            status: 'ongoing', // not_started | ongoing | completed
            observationType: 'morning_wake', // 早醒观察
            dailyRecords: {}, // { '2025-01-01': { wakeTime: '5:30', wokeUpEarly: true, sleepQuality: 3, notes: '' } }
            conclusion: '',
        },
        {
            id: 'obs2',
            name: '暂停益生菌，观察便秘是否改善',
            supplement: '益生菌',
            action: '暂停',
            startDate: null,
            endDate: null,
            durationDays: 14,
            purpose: '观察暂停后便秘情况是否改善',
            status: 'ongoing',
            observationType: 'digestion', // 消化观察
            dailyRecords: {}, // { '2025-01-01': { bowelMovement: true, consistency: 'normal', bloating: 2, notes: '' } }
            conclusion: '',
        },
    ];

    // 常见症状
    const COMMON_SYMPTOMS = [
        '头痛', '头晕', '恶心', '腹痛', '腹胀', '便秘', '腹泻',
        '疲劳', '失眠', '焦虑', '情绪低落', '肌肉酸痛', '关节痛',
        '皮肤问题', '喉咙痛', '咳嗽', '发热', '发冷', '心悸',
        '胸闷', '食欲不振', '水肿', '长痘', '过敏',
    ];

    // 经期症状
    const PERIOD_SYMPTOMS = [
        '痛经', '腰酸', '头痛', '乳房胀痛', '疲劳',
        '情绪波动', '长痘', '水肿', '腹泻', '便秘',
    ];

    // 睡眠质量评分选项
    const SLEEP_QUALITY_LABELS = ['很差', '较差', '一般', '较好', '很好'];

    // 健康问卷问题
    const HEALTH_QUESTIONS = [
        { id: 'q_sleep', label: '睡眠质量', icon: '😴', max: 5 },
        { id: 'q_body', label: '身体状态', icon: '💪', max: 5 },
        { id: 'q_mood', label: '心情指数', icon: '😊', max: 5 },
        { id: 'q_water', label: '喝水够不够', icon: '💧', max: 5 },
        { id: 'q_exercise', label: '运动情况', icon: '🏃', max: 5 },
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
            if (!data.syncStatus) data.syncStatus = _getDefaultSyncStatus();
            if (!data.periodTracker) data.periodTracker = _getDefaultPeriod();
            if (!data.supplements) data.supplements = [...DEFAULT_SUPPLEMENTS];
            if (!data.supplementRecords) data.supplementRecords = {};
            if (!data.observations) data.observations = [...DEFAULT_OBSERVATIONS];
            if (!data.symptomDiary) data.symptomDiary = { records: [] };
            if (!data.sleepQuality) data.sleepQuality = _getDefaultSleep();
            if (!data.weightBody) data.weightBody = _getDefaultWeight();
            if (!data.dailyQuestionnaire) data.dailyQuestionnaire = { records: {} };
            if (!data.longTermGoals) {
                data.longTermGoals = {
                    near: { title: '近期目标（3个月）', content: '建立健康生活习惯，规律作息和饮食', progress: 0, icon: '🌱', color: '#7ec8a7' },
                    mid: { title: '中期目标（6个月）', content: '改善身体素质，体重/体脂达到理想范围', progress: 0, icon: '🌿', color: '#a8c9e8' },
                    far: { title: '远期目标（1年）', content: '养成健康生活方式，精力充沛状态佳', progress: 0, icon: '🌳', color: '#f5c89a' },
                    ultimate: { title: '终极目标', content: '身心健康平衡，逆龄生长活力满满', progress: 0, icon: '🏆', color: '#c9b8e0' },
                };
            }
        } else {
            data = {
                syncStatus: _getDefaultSyncStatus(),
                periodTracker: _getDefaultPeriod(),
                supplements: [...DEFAULT_SUPPLEMENTS],
                supplementRecords: {},
                observations: [...DEFAULT_OBSERVATIONS],
                symptomDiary: { records: [] },
                sleepQuality: _getDefaultSleep(),
                weightBody: _getDefaultWeight(),
                dailyQuestionnaire: { records: {} },
                longTermGoals: {
                    near: {
                        title: '近期目标（3个月）',
                        content: '建立健康生活习惯，规律作息和饮食',
                        progress: 0,
                        icon: '🌱',
                        color: '#7ec8a7',
                    },
                    mid: {
                        title: '中期目标（6个月）',
                        content: '改善身体素质，体重/体脂达到理想范围',
                        progress: 0,
                        icon: '🌿',
                        color: '#a8c9e8',
                    },
                    far: {
                        title: '远期目标（1年）',
                        content: '养成健康生活方式，精力充沛状态佳',
                        progress: 0,
                        icon: '🌳',
                        color: '#f5c89a',
                    },
                    ultimate: {
                        title: '终极目标',
                        content: '身心健康平衡，逆龄生长活力满满',
                        progress: 0,
                        icon: '🏆',
                        color: '#c9b8e0',
                    },
                },
            };
            AppStorage.setModule(STORAGE_KEY, data);
        }

        _calculateSupplementStreaks();

        const now = new Date();
        currentDate = _today();
        calendarMonth = now.getMonth();
        calendarYear = now.getFullYear();
    }

    function _getDefaultSyncStatus() {
        return {
            huaweiHealth: {
                lastSync: null,
                sleep: null,
                steps: null,
                heartRate: null,
            },
            antFu: {
                lastSync: null,
                healthDiary: null,
            },
        };
    }

    function _getDefaultPeriod() {
        return {
            lastPeriodStart: null,
            lastPeriodEnd: null,
            cycleLength: 28,
            periodLength: 5,
            records: [],
            symptoms: [...PERIOD_SYMPTOMS],
        };
    }

    function _getDefaultSleep() {
        return {
            records: {},
            goalHours: 8,
            goalBedtime: '23:00',
            goalWakeTime: '07:00',
        };
    }

    function _getDefaultWeight() {
        return {
            targetWeight: 55,
            startWeight: 62,
            currentWeight: 62,
            height: 165,
            records: [],
            weighInFrequency: 'weekly',
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

    function _formatDateShort(dateStr) {
        const d = new Date(dateStr);
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        return (d.getMonth() + 1) + '月' + d.getDate() + '日 周' + weekDays[d.getDay()];
    }

    function _formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return App.formatDate(d);
    }

    function _calculateSupplementStreaks() {
        const today = new Date();
        for (const sup of data.supplements) {
            let streak = 0;
            let current = new Date(today);
            while (true) {
                const dateStr = App.formatDate(current);
                if (data.supplementRecords[dateStr] && data.supplementRecords[dateStr][sup.id]) {
                    streak++;
                    current.setDate(current.getDate() - 1);
                } else {
                    // 今天还没打卡，不中断
                    if (streak === 0 && dateStr === _today()) {
                        current.setDate(current.getDate() - 1);
                        continue;
                    }
                    break;
                }
                if (streak > 365) break;
            }
            sup.streak = streak;
        }
    }

    function _getDayHealthInfo(dateStr) {
        const info = {
            hasSupplement: false,
            hasSleep: false,
            hasQuestionnaire: false,
            hasSymptom: false,
            supplementCount: 0,
        };

        // 保健品打卡
        if (data.supplementRecords[dateStr]) {
            const rec = data.supplementRecords[dateStr];
            const count = Object.values(rec).filter(v => v).length;
            if (count > 0) {
                info.hasSupplement = true;
                info.supplementCount = count;
            }
        }

        // 睡眠记录
        if (data.sleepQuality.records[dateStr]) {
            info.hasSleep = true;
        }

        // 每日问卷
        if (data.dailyQuestionnaire.records[dateStr]) {
            const qRec = data.dailyQuestionnaire.records[dateStr];
            if (Object.keys(qRec).length > 0) {
                info.hasQuestionnaire = true;
            }
        }

        // 症状日记
        if (data.symptomDiary.records) {
            const hasSymptom = data.symptomDiary.records.some(r => r.date === dateStr);
            if (hasSymptom) info.hasSymptom = true;
        }

        return info;
    }

    function _renderHealthCalendar() {
        const daysInMonth = _getDaysInMonth(calendarYear, calendarMonth);
        const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
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
            const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === _today();
            const isSelected = dateStr === currentDate;
            const info = _getDayHealthInfo(dateStr);
            const hasContent = info.hasSupplement || info.hasSleep || info.hasQuestionnaire || info.hasSymptom;

            html += `
                <div class="cal-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasContent ? 'has-content' : ''}"
                     data-date="${dateStr}" data-action="health-cal-day">
                    <div class="cal-day-num">${day}</div>
                    ${hasContent ? `
                        <div class="cal-dots">
                            ${info.hasSupplement ? '<div class="cal-dot" style="background:#a8c9e8;"></div>' : ''}
                            ${info.hasSleep ? '<div class="cal-dot" style="background:#c9b8e0;"></div>' : ''}
                            ${info.hasQuestionnaire ? '<div class="cal-dot" style="background:#7ec8a7;"></div>' : ''}
                            ${info.hasSymptom ? '<div class="cal-dot" style="background:#e8a0a0;"></div>' : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    function _getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function _getPeriodStatus() {
        const pt = data.periodTracker;
        if (!pt.lastPeriodStart) return { status: 'unknown', label: '未设置', color: '#95a5a6' };

        const today = new Date();
        const lastStart = new Date(pt.lastPeriodStart);
        const cycleMs = pt.cycleLength * 24 * 60 * 60 * 1000;
        const nextStart = new Date(lastStart.getTime() + cycleMs);

        const daysSinceStart = Math.floor((today - lastStart) / (1000 * 60 * 60 * 24));
        const daysUntilNext = Math.ceil((nextStart - today) / (1000 * 60 * 60 * 24));

        // 经期中
        if (daysSinceStart < pt.periodLength) {
            return { status: 'period', label: '经期中', color: '#e8a0a0', day: daysSinceStart + 1 };
        }

        // 预测临近（前3天）
        if (daysUntilNext <= 3 && daysUntilNext >= 0) {
            return { status: 'approaching', label: `预测临近（${daysUntilNext}天后）`, color: '#f4b8c4' };
        }

        // 排卵期（下次月经前14天左右）
        const ovulationDay = pt.cycleLength - 14;
        const daysSincePeriodStart = daysSinceStart % pt.cycleLength;
        if (Math.abs(daysSincePeriodStart - ovulationDay) <= 2) {
            return { status: 'ovulation', label: '排卵期', color: '#c9b8e0' };
        }

        // 安全期
        return { status: 'safe', label: '安全期', color: '#7ec8a7', daysUntilNext };
    }

    // ============================================================
    // 5. 渲染入口
    // ============================================================
    function render(container) {
        containerEl = container;
        if (!data) _loadData();

        container.innerHTML = `
            <div class="health-module">
                <!-- 模块长期总目标 -->
                <div class="section-title">
                    <h2><span class="title-icon">🎯</span>模块长期总目标</h2>
                    <span class="section-action" data-action="edit-goals">编辑</span>
                </div>
                <div class="goals-vertical" id="healthLongTermGoals"></div>

                <!-- 数据同步区 -->
                <div class="section-title">
                    <h2><span class="title-icon">📱</span>健康数据同步</h2>
                    <span class="section-action" data-action="sync-health">同步数据</span>
                </div>
                <div id="syncStatus"></div>

                <!-- 健康日历回顾 -->
                <div class="section-title">
                    <h2><span class="title-icon">📅</span>健康日历</h2>
                    <span class="section-action" data-action="toggle-calendar">${showCalendar ? '📆 收起' : '📆 展开'}</span>
                </div>
                ${showCalendar ? `
                <div class="card calendar-card">
                    <div class="calendar-header">
                        <span class="cal-nav" data-action="prev-month-health">◀</span>
                        <span class="cal-title">${calendarYear}年${calendarMonth + 1}月</span>
                        <span class="cal-nav" data-action="next-month-health">▶</span>
                    </div>
                    <div id="healthCalendar"></div>
                    <div class="calendar-legend">
                        <span class="legend-item"><span class="cal-dot" style="background:#a8c9e8;"></span>保健品</span>
                        <span class="legend-item"><span class="cal-dot" style="background:#c9b8e0;"></span>睡眠</span>
                        <span class="legend-item"><span class="cal-dot" style="background:#7ec8a7;"></span>问卷</span>
                        <span class="legend-item"><span class="cal-dot" style="background:#e8a0a0;"></span>症状</span>
                    </div>
                </div>
                ` : ''}

                <!-- 经期追踪日历 -->
                <div class="section-title">
                    <h2><span class="title-icon">🩸</span>经期追踪</h2>
                    <span class="section-action" data-action="edit-period">设置</span>
                </div>
                <div id="periodTracker"></div>

                <!-- 保健品服用打卡 -->
                <div class="section-title">
                    <h2><span class="title-icon">💊</span>保健品/药物打卡</h2>
                    <span class="section-action" data-action="add-supplement">+ 添加</span>
                </div>
                <div id="supplements"></div>

                <!-- 观察期专区 -->
                <div class="section-title">
                    <h2><span class="title-icon">🔬</span>观察期专区</h2>
                    <span class="section-action" data-action="add-observation">+ 新观察</span>
                </div>
                <div id="observationZone"></div>

                <!-- 症状日记 -->
                <div class="section-title">
                    <h2><span class="title-icon">📋</span>症状日记</h2>
                    <span class="section-action" data-action="add-symptom">+ 记录</span>
                </div>
                <div id="symptomDiary"></div>

                <!-- 睡眠质量 -->
                <div class="section-title">
                    <h2><span class="title-icon">😴</span>睡眠质量追踪</h2>
                    <span class="section-action" data-action="add-sleep">+ 记录</span>
                </div>
                <div id="sleepQuality"></div>

                <!-- 体重围度追踪 -->
                <div class="section-title">
                    <h2><span class="title-icon">⚖️</span>体重/围度追踪</h2>
                    <span class="section-action" data-action="add-weight">+ 记录</span>
                </div>
                <div id="weightBody"></div>

                <!-- 每日健康问卷 -->
                <div class="section-title">
                    <h2><span class="title-icon">📝</span>每日健康问卷</h2>
                </div>
                <div id="dailyQuestionnaire"></div>
            </div>
        `;

        _renderLongTermGoals();
        _renderSyncStatus();
        if (showCalendar) {
            const calEl = containerEl.querySelector('#healthCalendar');
            if (calEl) calEl.innerHTML = _renderHealthCalendar();
        }
        _renderPeriodTracker();
        _renderSupplements();
        _renderObservationZone();
        _renderSymptomDiary();
        _renderSleepQuality();
        _renderWeightBody();
        _renderDailyQuestionnaire();
        _bindEvents();
    }

    // ============================================================
    // 5.5 长期总目标
    // ============================================================

    // 按健康打卡天数自动计算目标进度
    // 近期: 90天, 中期: 180天, 远期: 365天, 终极: 730天
    function _calcGoalProgress(key) {
        // 用保健品打卡天数作为健康打卡天数
        const checkinDays = Object.keys(data.supplementRecords || {}).length;
        const dayMap = { near: 90, mid: 180, far: 365, ultimate: 730 };
        const targetDays = dayMap[key] || 90;
        const progress = Math.min(100, Math.round((checkinDays / targetDays) * 1000) / 10);
        return progress;
    }

    function _renderLongTermGoals() {
        const goalsEl = containerEl?.querySelector('#healthLongTermGoals');
        if (!goalsEl) return;

        const goals = data.longTermGoals;
        const goalKeys = ['near', 'mid', 'far', 'ultimate'];

        const checkinDays = Object.keys(data.supplementRecords || {}).length;

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
    // 6. 数据同步区
    // ============================================================
    function _renderSyncStatus() {
        const el = containerEl.querySelector('#syncStatus');
        if (!el) return;

        const sync = data.syncStatus;

        el.innerHTML = `
            <div class="card sync-card">
                <div class="sync-item">
                    <div class="sync-app-icon">🏃</div>
                    <div class="sync-info">
                        <div class="sync-app-name">华为运动健康</div>
                        <div class="sync-detail">
                            <span>睡眠：${sync.huaweiHealth.sleep || '暂无数据'}</span>
                            <span>步数：${sync.huaweiHealth.steps || '暂无数据'}</span>
                            <span>心率：${sync.huaweiHealth.heartRate || '暂无数据'}</span>
                        </div>
                    </div>
                    <div class="sync-time">
                        ${sync.huaweiHealth.lastSync ? '上次：' + sync.huaweiHealth.lastSync : '未同步'}
                    </div>
                </div>
                <div class="sync-item">
                    <div class="sync-app-icon" style="background: #8bc9a820; color: #8bc9a8;">🐜</div>
                    <div class="sync-info">
                        <div class="sync-app-name">蚂蚁阿福</div>
                        <div class="sync-detail">
                            <span>健康日记：${sync.antFu.healthDiary ? '已记录' : '暂无数据'}</span>
                        </div>
                    </div>
                    <div class="sync-time">
                        ${sync.antFu.lastSync ? '上次：' + sync.antFu.lastSync : '未同步'}
                    </div>
                </div>
            </div>
        `;
    }

    function _openSyncModal() {
        const sync = data.syncStatus;
        const html = `
            <div class="form-group">
                <label class="form-label">华为运动健康 - 睡眠（小时）</label>
                <input type="number" class="form-input" id="syncSleep" value="${sync.huaweiHealth.sleep || ''}" placeholder="例如：7.5">
            </div>
            <div class="form-group">
                <label class="form-label">华为运动健康 - 步数</label>
                <input type="number" class="form-input" id="syncSteps" value="${sync.huaweiHealth.steps || ''}" placeholder="例如：8000">
            </div>
            <div class="form-group">
                <label class="form-label">华为运动健康 - 心率（次/分）</label>
                <input type="number" class="form-input" id="syncHeart" value="${sync.huaweiHealth.heartRate || ''}" placeholder="例如：72">
            </div>
            <div class="form-group">
                <label class="form-label">蚂蚁阿福 - 健康日记</label>
                <select class="form-select" id="syncDiary">
                    <option value="1" ${sync.antFu.healthDiary ? 'selected' : ''}>已记录</option>
                    <option value="0" ${!sync.antFu.healthDiary ? 'selected' : ''}>未记录</option>
                </select>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveSyncBtn">手动同步</button>
            </div>
        `;

        App.openModal('健康数据同步', html, {
            onOpen: () => {
                document.getElementById('saveSyncBtn')?.addEventListener('click', () => {
                    const now = _today();
                    sync.huaweiHealth.sleep = document.getElementById('syncSleep').value || null;
                    sync.huaweiHealth.steps = document.getElementById('syncSteps').value || null;
                    sync.huaweiHealth.heartRate = document.getElementById('syncHeart').value || null;
                    sync.huaweiHealth.lastSync = now;
                    sync.antFu.healthDiary = document.getElementById('syncDiary').value === '1';
                    sync.antFu.lastSync = now;
                    _saveData();
                    _renderSyncStatus();
                    App.closeModal();
                    App.showSuccess('同步完成');
                });
            }
        });
    }

    // ============================================================
    // 7. 经期追踪日历
    // ============================================================
    function _renderPeriodTracker() {
        const el = containerEl.querySelector('#periodTracker');
        if (!el) return;

        const pt = data.periodTracker;
        const status = _getPeriodStatus();
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const today = now.getDate();
        const daysInMonth = _getDaysInMonth(year, month);
        const firstDay = new Date(year, month, 1).getDay();
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

        // 生成日历格子
        let calendarCells = [];
        for (let i = 0; i < firstDay; i++) {
            calendarCells.push({ day: '', type: 'empty' });
        }

        let lastStartDate = pt.lastPeriodStart ? new Date(pt.lastPeriodStart) : null;
        let nextStartDate = null;
        if (lastStartDate) {
            nextStartDate = new Date(lastStartDate.getTime() + pt.cycleLength * 24 * 60 * 60 * 1000);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const currentDate = new Date(year, month, d);
            let cellType = 'normal';
            let isToday = d === today;

            // 检查是否在经期
            if (lastStartDate) {
                const daysFromLastStart = Math.floor((currentDate - lastStartDate) / (1000 * 60 * 60 * 24));
                const cycleDay = ((daysFromLastStart % pt.cycleLength) + pt.cycleLength) % pt.cycleLength;

                if (cycleDay < pt.periodLength) {
                    cellType = 'period';
                } else if (cycleDay >= pt.cycleLength - 16 && cycleDay <= pt.cycleLength - 12) {
                    cellType = 'ovulation';
                } else if (cycleDay >= pt.cycleLength - 3) {
                    cellType = 'approaching';
                }
            }

            calendarCells.push({ day: d, type: cellType, isToday, dateStr });
        }

        el.innerHTML = `
            <div class="card period-card">
                <div class="period-status-row">
                    <div class="period-status-badge" style="background: ${status.color}20; color: ${status.color};">
                        ${status.label}
                        ${status.day ? `第${status.day}天` : ''}
                    </div>
                    <div class="period-info">
                        <div>上次：${pt.lastPeriodStart || '未设置'}</div>
                        <div>周期：${pt.cycleLength}天 · 经期：${pt.periodLength}天</div>
                        ${nextStartDate ? `<div>预测下次：${App.formatDate(nextStartDate)}</div>` : ''}
                    </div>
                </div>
                <div class="period-calendar">
                    <div class="calendar-header">
                        ${weekDays.map(w => `<div class="calendar-weekday">${w}</div>`).join('')}
                    </div>
                    <div class="calendar-body">
                        ${calendarCells.map(cell => `
                            <div class="calendar-cell ${cell.type} ${cell.isToday ? 'today' : ''}" 
                                 ${cell.dateStr ? `data-date="${cell.dateStr}"` : ''}>
                                ${cell.day}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="period-legend">
                    <span><i class="legend-dot" style="background: #e8a0a0;"></i>经期</span>
                    <span><i class="legend-dot" style="background: #c9b8e0;"></i>排卵期</span>
                    <span><i class="legend-dot" style="background: #f4b8c4;"></i>预测临近</span>
                    <span><i class="legend-dot" style="border: 2px solid #7ec8a7;"></i>今日</span>
                </div>
                ${status.status === 'period' ? `
                    <div class="period-symptoms-section">
                        <div class="section-subtitle">今日症状记录</div>
                        <div class="symptom-chips">
                            ${PERIOD_SYMPTOMS.map(s => `
                                <span class="symptom-chip" data-symptom="${s}">${s}</span>
                            `).join('')}
                        </div>
                        <div class="pain-level">
                            <span>痛经程度：</span>
                            <div class="pain-stars">
                                ${[1,2,3,4,5].map(n => `<span class="pain-star" data-pain="${n}">${n <= 3 ? '🤍' : '❤️'}</span>`).join('')}
                            </div>
                        </div>
                        <div class="form-group mt-sm">
                            <input type="text" class="form-input" id="periodNote" placeholder="缓解方式/备注...">
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    function _openPeriodModal() {
        const pt = data.periodTracker;
        const html = `
            <div class="form-group">
                <label class="form-label">上次经期开始日期</label>
                <input type="date" class="form-input" id="periodStart" value="${pt.lastPeriodStart || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">上次经期结束日期</label>
                <input type="date" class="form-input" id="periodEnd" value="${pt.lastPeriodEnd || ''}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">周期长度（天）</label>
                    <input type="number" class="form-input" id="cycleLength" value="${pt.cycleLength}" min="20" max="45">
                </div>
                <div class="form-group">
                    <label class="form-label">经期天数</label>
                    <input type="number" class="form-input" id="periodLength" value="${pt.periodLength}" min="2" max="10">
                </div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="savePeriodBtn">保存设置</button>
            </div>
        `;

        App.openModal('经期设置', html, {
            onOpen: () => {
                document.getElementById('savePeriodBtn')?.addEventListener('click', () => {
                    pt.lastPeriodStart = document.getElementById('periodStart').value || null;
                    pt.lastPeriodEnd = document.getElementById('periodEnd').value || null;
                    pt.cycleLength = parseInt(document.getElementById('cycleLength').value) || 28;
                    pt.periodLength = parseInt(document.getElementById('periodLength').value) || 5;

                    // 记录到历史
                    if (pt.lastPeriodStart) {
                        const exists = pt.records.some(r => r.startDate === pt.lastPeriodStart);
                        if (!exists) {
                            pt.records.push({
                                id: _genId('prd'),
                                startDate: pt.lastPeriodStart,
                                endDate: pt.lastPeriodEnd,
                                recordedAt: Date.now(),
                            });
                        }
                    }

                    _saveData();
                    _renderPeriodTracker();
                    App.closeModal();
                    App.showSuccess('已保存');
                });
            }
        });
    }

    // ============================================================
    // 8. 保健品服用打卡
    // ============================================================
    function _renderSupplements() {
        const el = containerEl.querySelector('#supplements');
        if (!el) return;

        const today = _today();
        const todayRecord = data.supplementRecords[today] || {};
        const activeSups = data.supplements.filter(s => s.status === 'active');
        const pausedSups = data.supplements.filter(s => s.status === 'paused');

        el.innerHTML = `
            <div class="supplement-grid">
                ${data.supplements.map(sup => {
                    const isTaken = todayRecord[sup.id] === true;
                    const isPaused = sup.status === 'paused';
                    return `
                        <div class="card supplement-card ${isTaken ? 'taken' : ''} ${isPaused ? 'paused' : ''}" data-sup-id="${sup.id}">
                            <div class="supplement-header">
                                <div class="supplement-icon" style="background: ${sup.color}20; color: ${sup.color};">
                                    ${sup.icon || '💊'}
                                </div>
                                <div class="supplement-actions">
                                    <button class="btn-icon btn-sm" data-action="edit-sup" data-id="${sup.id}" title="编辑">✏️</button>
                                    <button class="btn-icon btn-sm" data-action="delete-sup" data-id="${sup.id}" title="删除">🗑️</button>
                                </div>
                            </div>
                            <div class="supplement-name">${_esc(sup.name)}</div>
                            <div class="supplement-detail">
                                <span>${_esc(sup.dosage || '')}</span>
                                <span>${_esc(sup.time || '')}</span>
                            </div>
                            <div class="supplement-streak">
                                ${sup.streak > 0 ? `🔥 连续 ${sup.streak} 天` : ''}
                                ${isPaused ? `<span class="paused-label">${sup.note || '暂停中'}</span>` : ''}
                            </div>
                            ${!isPaused ? `
                                <div class="supplement-check">
                                    <button class="btn btn-sm ${isTaken ? 'btn-success' : 'btn-outline'}" 
                                            data-action="toggle-sup" data-id="${sup.id}">
                                        ${isTaken ? '✓ 已服用' : '未服用'}
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function _toggleSupplement(id) {
        const today = _today();
        if (!data.supplementRecords[today]) {
            data.supplementRecords[today] = {};
        }
        if (data.supplementRecords[today][id]) {
            delete data.supplementRecords[today][id];
            if (Object.keys(data.supplementRecords[today]).length === 0) {
                delete data.supplementRecords[today];
            }
        } else {
            data.supplementRecords[today][id] = true;
        }
        _saveData();
        _calculateSupplementStreaks();
        _renderSupplements();
    }

    function _openSupplementModal(sup = null) {
        const isEdit = !!sup;
        const html = `
            <div class="form-group">
                <label class="form-label">名称</label>
                <input type="text" class="form-input" id="supName" value="${_esc(sup?.name || '')}" placeholder="例如：维生素C">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">图标</label>
                    <input type="text" class="form-input" id="supIcon" value="${_esc(sup?.icon || '💊')}" placeholder="emoji">
                </div>
                <div class="form-group">
                    <label class="form-label">剂量</label>
                    <input type="text" class="form-input" id="supDosage" value="${_esc(sup?.dosage || '')}" placeholder="例如：1粒/天">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">服用时间</label>
                <input type="text" class="form-input" id="supTime" value="${_esc(sup?.time || '')}" placeholder="例如：早餐后">
            </div>
            <div class="form-group">
                <label class="form-label">状态</label>
                <select class="form-select" id="supStatus">
                    <option value="active" ${sup?.status === 'active' ? 'selected' : ''}>服用中</option>
                    <option value="paused" ${sup?.status === 'paused' ? 'selected' : ''}>暂停观察</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">颜色</label>
                <div class="color-picker">
                    ${COLORS.map(c => `
                        <button class="color-dot ${sup?.color === c ? 'selected' : ''}" 
                                data-color="${c}" 
                                style="background: ${c};"></button>
                    `).join('')}
                </div>
            </div>
            <div class="form-group" id="supNoteGroup" style="${sup?.status === 'paused' ? '' : 'display: none;'}">
                <label class="form-label">备注</label>
                <input type="text" class="form-input" id="supNote" value="${_esc(sup?.note || '')}" placeholder="暂停原因等">
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveSupBtn">${isEdit ? '保存修改' : '添加'}</button>
            </div>
        `;

        App.openModal(isEdit ? '编辑保健品' : '添加保健品', html, {
            onOpen: () => {
                let selectedColor = sup?.color || COLORS[0];

                document.querySelectorAll('.color-dot').forEach(dot => {
                    dot.addEventListener('click', () => {
                        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
                        dot.classList.add('selected');
                        selectedColor = dot.dataset.color;
                    });
                });

                document.getElementById('supStatus')?.addEventListener('change', (e) => {
                    const noteGroup = document.getElementById('supNoteGroup');
                    if (noteGroup) {
                        noteGroup.style.display = e.target.value === 'paused' ? '' : 'none';
                    }
                });

                document.getElementById('saveSupBtn')?.addEventListener('click', () => {
                    const name = document.getElementById('supName').value.trim();
                    if (!name) {
                        App.showError('请输入名称');
                        return;
                    }

                    const supData = {
                        name,
                        icon: document.getElementById('supIcon').value.trim() || '💊',
                        dosage: document.getElementById('supDosage').value.trim(),
                        time: document.getElementById('supTime').value.trim(),
                        status: document.getElementById('supStatus').value,
                        note: document.getElementById('supNote')?.value.trim() || '',
                        color: selectedColor,
                    };

                    if (isEdit) {
                        const idx = data.supplements.findIndex(s => s.id === sup.id);
                        if (idx > -1) {
                            data.supplements[idx] = { ...data.supplements[idx], ...supData };
                        }
                        App.showSuccess('已更新');
                    } else {
                        supData.id = _genId('sup');
                        supData.streak = 0;
                        data.supplements.push(supData);
                        App.showSuccess('已添加');
                    }

                    _saveData();
                    _calculateSupplementStreaks();
                    _renderSupplements();
                    App.closeModal();
                });
            }
        });
    }

    async function _deleteSupplement(id) {
        const confirmed = await App.confirmModal('确认删除', '确定要删除这个保健品吗？', {
            confirmText: '删除',
            cancelText: '取消',
        });
        if (confirmed) {
            data.supplements = data.supplements.filter(s => s.id !== id);
            _saveData();
            _renderSupplements();
            App.showSuccess('已删除');
        }
    }

    // ============================================================
    // 9. 观察期专区（重点功能）
    // ============================================================
    function _renderObservationZone() {
        const el = containerEl.querySelector('#observationZone');
        if (!el) return;

        const obs = data.observations;
        const activeObs = obs.filter(o => o.status === 'ongoing');
        const completedObs = obs.filter(o => o.status === 'completed');

        el.innerHTML = `
            ${activeObs.length > 0 ? `
                <div class="observation-active-list">
                    ${activeObs.map(o => _renderObservationCard(o)).join('')}
                </div>
            ` : `
                <div class="empty-state" style="padding: var(--spacing-lg);">
                    <div class="empty-state-icon">🔬</div>
                    <div class="empty-state-text">暂无进行中的观察项目</div>
                </div>
            `}
            ${completedObs.length > 0 ? `
                <div class="section-subtitle">已完成观察</div>
                <div class="observation-history">
                    ${completedObs.slice(0, 3).map(o => `
                        <div class="card observation-history-card" data-obs-id="${o.id}">
                            <div class="obs-history-header">
                                <span class="obs-history-name">${_esc(o.name)}</span>
                                <span class="obs-history-status completed">已完成</span>
                            </div>
                            <div class="obs-history-dates">${o.startDate} ~ ${o.endDate}</div>
                            ${o.conclusion ? `<div class="obs-history-conclusion">结论：${_esc(o.conclusion)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    }

    function _renderObservationCard(obs) {
        const today = _today();
        const startDate = obs.startDate ? new Date(obs.startDate) : new Date();
        const daysPassed = obs.startDate
            ? Math.floor((new Date() - new Date(obs.startDate)) / (1000 * 60 * 60 * 24)) + 1
            : 0;
        const progress = Math.min(100, Math.round((daysPassed / obs.durationDays) * 100));
        const todayRecord = obs.dailyRecords[today] || null;

        let tableRows = '';
        const daysToShow = Math.min(daysPassed, 7);
        for (let i = daysToShow - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = App.formatDate(d);
            const record = obs.dailyRecords[dateStr];

            if (obs.observationType === 'morning_wake') {
                tableRows += `
                    <tr data-date="${dateStr}">
                        <td>${dateStr.slice(5)}</td>
                        <td>${record?.wakeTime || '-'}</td>
                        <td>${record?.wokeUpEarly ? '是' : '否'}</td>
                        <td>${'⭐'.repeat(record?.sleepQuality || 0) || '-'}</td>
                        <td>${_esc(record?.notes || '')}</td>
                        <td><button class="btn-icon btn-sm" data-action="edit-obs-record" data-obs="${obs.id}" data-date="${dateStr}">✏️</button></td>
                    </tr>
                `;
            } else if (obs.observationType === 'digestion') {
                tableRows += `
                    <tr data-date="${dateStr}">
                        <td>${dateStr.slice(5)}</td>
                        <td>${record?.bowelMovement ? '有' : '无'}</td>
                        <td>${record?.consistency || '-'}</td>
                        <td>${record?.bloating || 0}/5</td>
                        <td>${_esc(record?.notes || '')}</td>
                        <td><button class="btn-icon btn-sm" data-action="edit-obs-record" data-obs="${obs.id}" data-date="${dateStr}">✏️</button></td>
                    </tr>
                `;
            }
        }

        const tableHeaders = obs.observationType === 'morning_wake'
            ? ['日期', '起床时间', '早醒', '睡眠质量', '备注', '操作']
            : ['日期', '排便', '性状', '腹胀', '备注', '操作'];

        return `
            <div class="card observation-card">
                <div class="obs-header">
                    <div class="obs-title-row">
                        <h3 class="obs-name">${_esc(obs.name)}</h3>
                        <div class="obs-actions">
                            <button class="btn-icon btn-sm" data-action="edit-obs" data-id="${obs.id}" title="编辑">✏️</button>
                            <button class="btn-icon btn-sm" data-action="delete-obs" data-id="${obs.id}" title="删除">🗑️</button>
                        </div>
                    </div>
                    <div class="obs-meta">
                        <span>${obs.action} ${obs.supplement}</span>
                        <span>${obs.durationDays}天观察期</span>
                        <span>第 ${daysPassed}/${obs.durationDays} 天</span>
                    </div>
                    <div class="progress progress-sm">
                        <div class="progress-bar" style="width: ${progress}%; background: linear-gradient(90deg, #c9b8e088, #c9b8e0);"></div>
                    </div>
                </div>
                <div class="obs-purpose">目的：${_esc(obs.purpose)}</div>
                <div class="obs-today-record">
                    <div class="section-subtitle">
                        今日观察记录
                        ${todayRecord ? '<span class="record-status done">已记录</span>' : '<span class="record-status pending">待记录</span>'}
                        <button class="btn btn-sm btn-outline" data-action="add-obs-record" data-id="${obs.id}">
                            ${todayRecord ? '编辑' : '记录'}
                        </button>
                    </div>
                </div>
                <div class="obs-table-wrapper">
                    <table class="obs-table">
                        <thead>
                            <tr>${tableHeaders.map(h => `<th>${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${tableRows || '<tr><td colspan="6" class="empty-cell">暂无记录</td></tr>'}
                        </tbody>
                    </table>
                </div>
                <div class="obs-reminder-section">
                    <div class="section-subtitle">提醒设置</div>
                    <div class="reminder-options">
                        <label class="reminder-chip"><input type="checkbox" checked> 每天早上</label>
                        <label class="reminder-chip"><input type="checkbox" checked> 每天晚上</label>
                        <label class="reminder-chip"><input type="checkbox"> 第7天</label>
                        <label class="reminder-chip"><input type="checkbox"> 第14天</label>
                    </div>
                </div>
                ${daysPassed >= obs.durationDays ? `
                    <div class="obs-complete-action">
                        <button class="btn btn-primary btn-sm" data-action="complete-obs" data-id="${obs.id}">完成观察，填写结论</button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    function _openObservationModal(obs = null) {
        const isEdit = !!obs;
        const html = `
            <div class="form-group">
                <label class="form-label">观察项目名称</label>
                <input type="text" class="form-input" id="obsName" value="${_esc(obs?.name || '')}" placeholder="例如：暂停Omega-3观察">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">相关保健品/药物</label>
                    <input type="text" class="form-input" id="obsSupplement" value="${_esc(obs?.supplement || '')}" placeholder="例如：鱼油Omega-3">
                </div>
                <div class="form-group">
                    <label class="form-label">操作类型</label>
                    <select class="form-select" id="obsAction">
                        <option value="暂停" ${obs?.action === '暂停' ? 'selected' : ''}>暂停</option>
                        <option value="开始服用" ${obs?.action === '开始服用' ? 'selected' : ''}>开始服用</option>
                        <option value="替换" ${obs?.action === '替换' ? 'selected' : ''}>替换</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">观察目的</label>
                <textarea class="form-textarea" id="obsPurpose" placeholder="观察什么变化？">${_esc(obs?.purpose || '')}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">观察类型</label>
                    <select class="form-select" id="obsType">
                        <option value="morning_wake" ${obs?.observationType === 'morning_wake' ? 'selected' : ''}>早醒观察</option>
                        <option value="digestion" ${obs?.observationType === 'digestion' ? 'selected' : ''}>消化观察</option>
                        <option value="general" ${obs?.observationType === 'general' ? 'selected' : ''}>通用观察</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">观察天数</label>
                    <input type="number" class="form-input" id="obsDuration" value="${obs?.durationDays || 14}" min="3" max="90">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">开始日期</label>
                <input type="date" class="form-input" id="obsStartDate" value="${obs?.startDate || _today()}">
            </div>
            <div class="form-group">
                <label class="form-label">状态</label>
                <select class="form-select" id="obsStatus">
                    <option value="not_started" ${obs?.status === 'not_started' ? 'selected' : ''}>未开始</option>
                    <option value="ongoing" ${obs?.status === 'ongoing' ? 'selected' : ''}>进行中</option>
                    <option value="completed" ${obs?.status === 'completed' ? 'selected' : ''}>已完成</option>
                </select>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveObsBtn">${isEdit ? '保存修改' : '开始观察'}</button>
            </div>
        `;

        App.openModal(isEdit ? '编辑观察项目' : '新建观察项目', html, {
            onOpen: () => {
                document.getElementById('saveObsBtn')?.addEventListener('click', () => {
                    const name = document.getElementById('obsName').value.trim();
                    if (!name) {
                        App.showError('请输入观察项目名称');
                        return;
                    }

                    const obsData = {
                        name,
                        supplement: document.getElementById('obsSupplement').value.trim(),
                        action: document.getElementById('obsAction').value,
                        purpose: document.getElementById('obsPurpose').value.trim(),
                        observationType: document.getElementById('obsType').value,
                        durationDays: parseInt(document.getElementById('obsDuration').value) || 14,
                        startDate: document.getElementById('obsStartDate').value || _today(),
                        status: document.getElementById('obsStatus').value,
                    };

                    if (isEdit) {
                        const idx = data.observations.findIndex(o => o.id === obs.id);
                        if (idx > -1) {
                            data.observations[idx] = { ...data.observations[idx], ...obsData };
                        }
                        App.showSuccess('已更新');
                    } else {
                        obsData.id = _genId('obs');
                        obsData.dailyRecords = {};
                        obsData.conclusion = '';
                        data.observations.push(obsData);
                        App.showSuccess('观察已开始');
                    }

                    _saveData();
                    _renderObservationZone();
                    App.closeModal();
                });
            }
        });
    }

    function _openObsRecordModal(obsId, dateStr) {
        const obs = data.observations.find(o => o.id === obsId);
        if (!obs) return;

        const record = obs.dailyRecords[dateStr || _today()] || {};
        const today = dateStr || _today();

        let formFields = '';

        if (obs.observationType === 'morning_wake') {
            formFields = `
                <div class="form-group">
                    <label class="form-label">起床时间</label>
                    <input type="time" class="form-input" id="obsWakeTime" value="${record.wakeTime || '07:00'}">
                </div>
                <div class="form-group">
                    <label class="form-label">是否早醒</label>
                    <select class="form-select" id="obsEarlyWake">
                        <option value="0" ${!record.wokeUpEarly ? 'selected' : ''}>否</option>
                        <option value="1" ${record.wokeUpEarly ? 'selected' : ''}>是</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">睡眠质量（1-5）：<span id="sleepQualityVal">${record.sleepQuality || 3}</span></label>
                    <div class="slider-container">
                        <input type="range" class="slider" id="obsSleepQuality" min="1" max="5" value="${record.sleepQuality || 3}">
                    </div>
                </div>
            `;
        } else if (obs.observationType === 'digestion') {
            formFields = `
                <div class="form-group">
                    <label class="form-label">今日排便</label>
                    <select class="form-select" id="obsBowel">
                        <option value="0" ${!record.bowelMovement ? 'selected' : ''}>无</option>
                        <option value="1" ${record.bowelMovement ? 'selected' : ''}>有</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">粪便性状</label>
                    <select class="form-select" id="obsConsistency">
                        <option value="" ${!record.consistency ? 'selected' : ''}>请选择</option>
                        <option value="hard" ${record.consistency === 'hard' ? 'selected' : ''}>干硬</option>
                        <option value="normal" ${record.consistency === 'normal' ? 'selected' : ''}>正常</option>
                        <option value="soft" ${record.consistency === 'soft' ? 'selected' : ''}>偏软</option>
                        <option value="loose" ${record.consistency === 'loose' ? 'selected' : ''}>稀溏</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">腹胀程度（1-5）：<span id="bloatingVal">${record.bloating || 0}</span></label>
                    <div class="slider-container">
                        <input type="range" class="slider" id="obsBloating" min="0" max="5" value="${record.bloating || 0}">
                    </div>
                </div>
            `;
        } else {
            formFields = `
                <div class="form-group">
                    <label class="form-label">今日感受</label>
                    <textarea class="form-textarea" id="obsFeeling" placeholder="记录今日感受...">${_esc(record.feeling || '')}</textarea>
                </div>
            `;
        }

        const html = `
            <div class="form-group">
                <label class="form-label">日期</label>
                <input type="date" class="form-input" id="obsRecordDate" value="${today}">
            </div>
            ${formFields}
            <div class="form-group">
                <label class="form-label">备注</label>
                <textarea class="form-textarea" id="obsNotes" placeholder="其他想说的...">${_esc(record.notes || '')}</textarea>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveObsRecordBtn">保存记录</button>
            </div>
        `;

        App.openModal(`${obs.name} - 每日记录`, html, {
            onOpen: () => {
                // 滑块实时更新
                const sleepSlider = document.getElementById('obsSleepQuality');
                const sleepVal = document.getElementById('sleepQualityVal');
                sleepSlider?.addEventListener('input', () => {
                    if (sleepVal) sleepVal.textContent = sleepSlider.value;
                });

                const bloatingSlider = document.getElementById('obsBloating');
                const bloatingVal = document.getElementById('bloatingVal');
                bloatingSlider?.addEventListener('input', () => {
                    if (bloatingVal) bloatingVal.textContent = bloatingSlider.value;
                });

                document.getElementById('saveObsRecordBtn')?.addEventListener('click', () => {
                    const date = document.getElementById('obsRecordDate').value || _today();
                    const newRecord = {
                        notes: document.getElementById('obsNotes').value.trim(),
                    };

                    if (obs.observationType === 'morning_wake') {
                        newRecord.wakeTime = document.getElementById('obsWakeTime')?.value || '';
                        newRecord.wokeUpEarly = document.getElementById('obsEarlyWake')?.value === '1';
                        newRecord.sleepQuality = parseInt(document.getElementById('obsSleepQuality')?.value) || 0;
                    } else if (obs.observationType === 'digestion') {
                        newRecord.bowelMovement = document.getElementById('obsBowel')?.value === '1';
                        newRecord.consistency = document.getElementById('obsConsistency')?.value || '';
                        newRecord.bloating = parseInt(document.getElementById('obsBloating')?.value) || 0;
                    } else {
                        newRecord.feeling = document.getElementById('obsFeeling')?.value || '';
                    }

                    obs.dailyRecords[date] = newRecord;
                    _saveData();
                    _renderObservationZone();
                    App.closeModal();
                    App.showSuccess('已记录');
                });
            }
        });
    }

    function _completeObservation(id) {
        const obs = data.observations.find(o => o.id === id);
        if (!obs) return;

        const html = `
            <div class="form-group">
                <label class="form-label">观察结论</label>
                <textarea class="form-textarea" id="obsConclusion" placeholder="总结一下观察结果...">${_esc(obs.conclusion || '')}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">是否恢复/继续服用</label>
                <select class="form-select" id="obsResume">
                    <option value="resume">恢复服用</option>
                    <option value="continue_pause">继续暂停</option>
                    <option value="stop">停止服用</option>
                </select>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="completeObsBtn">完成观察</button>
            </div>
        `;

        App.openModal('完成观察', html, {
            onOpen: () => {
                document.getElementById('completeObsBtn')?.addEventListener('click', () => {
                    obs.status = 'completed';
                    obs.endDate = _today();
                    obs.conclusion = document.getElementById('obsConclusion').value.trim();
                    _saveData();
                    _renderObservationZone();
                    App.closeModal();
                    App.showSuccess('观察已完成');
                });
            }
        });
    }

    async function _deleteObservation(id) {
        const confirmed = await App.confirmModal('确认删除', '确定要删除这个观察项目吗？所有记录都会被清除。', {
            confirmText: '删除',
            cancelText: '取消',
        });
        if (confirmed) {
            data.observations = data.observations.filter(o => o.id !== id);
            _saveData();
            _renderObservationZone();
            App.showSuccess('已删除');
        }
    }

    // ============================================================
    // 10. 症状日记
    // ============================================================
    function _renderSymptomDiary() {
        const el = containerEl.querySelector('#symptomDiary');
        if (!el) return;

        const records = data.symptomDiary.records || [];
        const recentRecords = records.slice(-5).reverse();

        el.innerHTML = `
            <div class="card symptom-card">
                <div class="symptom-quick-entry">
                    <div class="section-subtitle">快速记录</div>
                    <div class="symptom-chips">
                        ${COMMON_SYMPTOMS.slice(0, 12).map(s => `
                            <span class="symptom-chip" data-symptom="${s}">${s}</span>
                        `).join('')}
                    </div>
                </div>
                ${recentRecords.length > 0 ? `
                    <div class="symptom-timeline">
                        <div class="section-subtitle">近期症状时间线</div>
                        ${recentRecords.map(r => `
                            <div class="timeline-item">
                                <div class="timeline-date">${r.date}</div>
                                <div class="timeline-content">
                                    <div class="timeline-symptoms">
                                        ${(r.symptoms || []).map(s => `<span class="symptom-tag">${s.name || s}</span>`).join('')}
                                    </div>
                                    ${r.notes ? `<div class="timeline-notes">${_esc(r.notes)}</div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    function _openSymptomModal() {
        const html = `
            <div class="form-group">
                <label class="form-label">日期</label>
                <input type="date" class="form-input" id="symptomDate" value="${_today()}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">体温（℃）</label>
                    <input type="number" class="form-input" id="symptomTemp" placeholder="例如：36.5" step="0.1">
                </div>
                <div class="form-group">
                    <label class="form-label">整体状态</label>
                    <select class="form-select" id="symptomOverall">
                        <option value="5">很好</option>
                        <option value="4" selected>较好</option>
                        <option value="3">一般</option>
                        <option value="2">较差</option>
                        <option value="1">很差</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">不适症状（可多选）</label>
                <div class="symptom-multi-select">
                    ${COMMON_SYMPTOMS.map(s => `
                        <label class="symptom-chip-select">
                            <input type="checkbox" value="${s}">
                            <span>${s}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">症状描述</label>
                <textarea class="form-textarea" id="symptomDesc" placeholder="详细描述一下症状..."></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">处理方式</label>
                <input type="text" class="form-input" id="symptomRemedy" placeholder="例如：休息、服药、就医">
            </div>
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" id="symptomDoctor"> 是否就医
                </label>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveSymptomBtn">保存记录</button>
            </div>
        `;

        App.openModal('记录症状', html, {
            onOpen: () => {
                document.getElementById('saveSymptomBtn')?.addEventListener('click', () => {
                    const symptoms = [];
                    document.querySelectorAll('.symptom-multi-select input:checked').forEach(cb => {
                        symptoms.push({ name: cb.value });
                    });

                    const record = {
                        id: _genId('sym'),
                        date: document.getElementById('symptomDate').value || _today(),
                        temperature: parseFloat(document.getElementById('symptomTemp').value) || null,
                        overall: parseInt(document.getElementById('symptomOverall').value) || 3,
                        symptoms,
                        description: document.getElementById('symptomDesc').value.trim(),
                        remedy: document.getElementById('symptomRemedy').value.trim(),
                        sawDoctor: document.getElementById('symptomDoctor').checked,
                        createdAt: Date.now(),
                    };

                    data.symptomDiary.records.push(record);
                    _saveData();
                    _renderSymptomDiary();
                    App.closeModal();
                    App.showSuccess('已记录');
                });
            }
        });
    }

    // ============================================================
    // 11. 睡眠质量追踪（重点功能）
    // ============================================================
    function _renderSleepQuality() {
        const el = containerEl.querySelector('#sleepQuality');
        if (!el) return;

        const sq = data.sleepQuality;
        const today = _today();
        const todayRecord = sq.records[today];

        // 近7天数据
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = App.formatDate(d);
            const record = sq.records[dateStr];
            last7Days.push({
                date: dateStr,
                label: (d.getMonth() + 1) + '/' + d.getDate(),
                duration: record?.duration || 0,
                quality: record?.quality || 0,
                deepSleep: record?.deepSleep || 0,
                lightSleep: record?.lightSleep || 0,
            });
        }

        const avgDuration = last7Days.reduce((sum, d) => sum + d.duration, 0) / (last7Days.filter(d => d.duration > 0).length || 1);
        const avgQuality = last7Days.reduce((sum, d) => sum + d.quality, 0) / (last7Days.filter(d => d.quality > 0).length || 1);
        const maxDuration = Math.max(...last7Days.map(d => d.duration), sq.goalHours, 1);

        el.innerHTML = `
            <div class="card sleep-card">
                ${todayRecord ? `
                    <div class="sleep-today">
                        <div class="sleep-today-header">
                            <span class="sleep-date">今日睡眠</span>
                            <span class="sleep-quality-badge" style="background: ${_getQualityColor(todayRecord.quality)}20; color: ${_getQualityColor(todayRecord.quality)};">
                                ${todayRecord.quality ? SLEEP_QUALITY_LABELS[todayRecord.quality - 1] + '（' + todayRecord.quality + '分）' : '未评分'}
                            </span>
                        </div>
                        <div class="sleep-times">
                            <span>🌙 ${todayRecord.bedTime || '--:--'}</span>
                            <span class="sleep-arrow">→</span>
                            <span>☀️ ${todayRecord.wakeTime || '--:--'}</span>
                        </div>
                        <div class="sleep-duration">
                            <span class="duration-value">${todayRecord.duration || '--'}</span>
                            <span class="duration-unit">小时</span>
                        </div>
                    </div>
                ` : `
                    <div class="sleep-today empty">
                        <div class="empty-state-icon" style="font-size: 2rem;">😴</div>
                        <div class="empty-state-text">今日还没记录睡眠</div>
                    </div>
                `}
                <div class="sleep-detail-grid">
                    <div class="sleep-detail-item">
                        <div class="detail-icon" style="background: #7ec8a720; color: #7ec8a7;">💤</div>
                        <div class="detail-info">
                            <div class="detail-label">深睡</div>
                            <div class="detail-value">${todayRecord?.deepSleep || '--'}h</div>
                        </div>
                    </div>
                    <div class="sleep-detail-item">
                        <div class="detail-icon" style="background: #a8c9e820; color: #a8c9e8;">🌙</div>
                        <div class="detail-info">
                            <div class="detail-label">浅睡</div>
                            <div class="detail-value">${todayRecord?.lightSleep || '--'}h</div>
                        </div>
                    </div>
                    <div class="sleep-detail-item">
                        <div class="detail-icon" style="background: #e8a0a020; color: #e8a0a0;">👀</div>
                        <div class="detail-info">
                            <div class="detail-label">夜醒</div>
                            <div class="detail-value">${todayRecord?.awakeTimes ?? '--'}次</div>
                        </div>
                    </div>
                    <div class="sleep-detail-item">
                        <div class="detail-icon" style="background: #c9b8e020; color: #c9b8e0;">💭</div>
                        <div class="detail-info">
                            <div class="detail-label">做梦</div>
                            <div class="detail-value">${todayRecord?.dreaming ? '有' : '无'}</div>
                        </div>
                    </div>
                </div>
                ${todayRecord?.wakeFeeling ? `
                    <div class="sleep-wake-feeling">
                        <span>起床感受：</span>
                        <span>${todayRecord.wakeFeeling}</span>
                    </div>
                ` : ''}
                ${todayRecord?.notes ? `
                    <div class="sleep-notes">
                        <span>备注：</span>
                        <span>${_esc(todayRecord.notes)}</span>
                    </div>
                ` : ''}
                <div class="sleep-weekly">
                    <div class="section-subtitle">
                        近7天趋势
                        <span class="sleep-avg">平均 ${avgDuration.toFixed(1)}h · 质量 ${avgQuality.toFixed(1)}</span>
                    </div>
                    <div class="sleep-chart">
                        ${last7Days.map(d => `
                            <div class="sleep-chart-day">
                                <div class="sleep-bar-container">
                                    <div class="sleep-bar" style="height: ${(d.duration / maxDuration) * 100}%;">
                                        ${d.duration > 0 ? `<div class="sleep-bar-label">${d.duration}h</div>` : ''}
                                    </div>
                                </div>
                                <div class="sleep-day-label">${d.label}</div>
                                <div class="sleep-quality-dots">
                                    ${d.quality > 0 ? '⭐'.repeat(d.quality) : '·'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="sleep-goal">
                    <div class="goal-info">
                        <span>目标：${sq.goalHours}h / 晚</span>
                        <span>${sq.goalBedtime} ~ ${sq.goalWakeTime}</span>
                    </div>
                </div>
            </div>
        `;
    }

    function _getQualityColor(quality) {
        const colors = ['#e8a0a0', '#f4b8c4', '#f5c89a', '#8bc9a8', '#7ec8a7'];
        return colors[Math.max(0, Math.min(4, (quality || 3) - 1))];
    }

    function _openSleepModal(dateStr) {
        const today = dateStr || _today();
        const record = data.sleepQuality.records[today] || {};

        const html = `
            <div class="form-group">
                <label class="form-label">日期</label>
                <input type="date" class="form-input" id="sleepDate" value="${today}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">入睡时间</label>
                    <input type="time" class="form-input" id="sleepBedTime" value="${record.bedTime || '23:00'}">
                </div>
                <div class="form-group">
                    <label class="form-label">起床时间</label>
                    <input type="time" class="form-input" id="sleepWakeTime" value="${record.wakeTime || '07:00'}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">总睡眠时长（小时）：<span id="sleepDurationVal">${record.duration || 8}</span></label>
                <div class="slider-container">
                    <input type="range" class="slider" id="sleepDuration" min="0" max="12" step="0.5" value="${record.duration || 8}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">深睡时长（h）</label>
                    <input type="number" class="form-input" id="sleepDeep" value="${record.deepSleep || 2}" step="0.5" min="0" max="8">
                </div>
                <div class="form-group">
                    <label class="form-label">浅睡时长（h）</label>
                    <input type="number" class="form-input" id="sleepLight" value="${record.lightSleep || 5}" step="0.5" min="0" max="10">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">夜醒次数</label>
                    <input type="number" class="form-input" id="sleepAwake" value="${record.awakeTimes ?? 0}" min="0" max="10">
                </div>
                <div class="form-group">
                    <label class="form-label">做梦情况</label>
                    <select class="form-select" id="sleepDream">
                        <option value="0" ${!record.dreaming ? 'selected' : ''}>无</option>
                        <option value="1" ${record.dreaming ? 'selected' : ''}>有</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">睡眠质量：<span id="sleepQualityVal">${record.quality || 3}</span> 分 - ${SLEEP_QUALITY_LABELS[(record.quality || 3) - 1]}</label>
                <div class="slider-container">
                    <input type="range" class="slider" id="sleepQuality" min="1" max="5" value="${record.quality || 3}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">起床感受</label>
                <select class="form-select" id="sleepWakeFeeling">
                    <option value="" ${!record.wakeFeeling ? 'selected' : ''}>请选择</option>
                    <option value="精力充沛" ${record.wakeFeeling === '精力充沛' ? 'selected' : ''}>精力充沛</option>
                    <option value="还不错" ${record.wakeFeeling === '还不错' ? 'selected' : ''}>还不错</option>
                    <option value="有点累" ${record.wakeFeeling === '有点累' ? 'selected' : ''}>有点累</option>
                    <option value="很疲惫" ${record.wakeFeeling === '很疲惫' ? 'selected' : ''}>很疲惫</option>
                    <option value="头昏脑胀" ${record.wakeFeeling === '头昏脑胀' ? 'selected' : ''}>头昏脑胀</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">备注</label>
                <textarea class="form-textarea" id="sleepNotes" placeholder="影响睡眠的因素、梦境等...">${_esc(record.notes || '')}</textarea>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveSleepBtn">保存记录</button>
            </div>
        `;

        App.openModal('睡眠记录', html, {
            onOpen: () => {
                // 滑块实时更新
                const durationSlider = document.getElementById('sleepDuration');
                const durationVal = document.getElementById('sleepDurationVal');
                durationSlider?.addEventListener('input', () => {
                    if (durationVal) durationVal.textContent = durationSlider.value;
                });

                const qualitySlider = document.getElementById('sleepQuality');
                const qualityVal = document.getElementById('sleepQualityVal');
                qualitySlider?.addEventListener('input', () => {
                    if (qualityVal) {
                        qualityVal.textContent = qualitySlider.value;
                        const label = SLEEP_QUALITY_LABELS[parseInt(qualitySlider.value) - 1];
                        const parent = qualityVal.parentElement;
                        const labelEl = parent.querySelector('.quality-label');
                        if (labelEl) labelEl.textContent = label;
                    }
                });

                document.getElementById('saveSleepBtn')?.addEventListener('click', () => {
                    const date = document.getElementById('sleepDate').value || _today();
                    const sleepData = {
                        bedTime: document.getElementById('sleepBedTime').value,
                        wakeTime: document.getElementById('sleepWakeTime').value,
                        duration: parseFloat(document.getElementById('sleepDuration').value) || 0,
                        deepSleep: parseFloat(document.getElementById('sleepDeep').value) || 0,
                        lightSleep: parseFloat(document.getElementById('sleepLight').value) || 0,
                        awakeTimes: parseInt(document.getElementById('sleepAwake').value) || 0,
                        dreaming: document.getElementById('sleepDream').value === '1',
                        quality: parseInt(document.getElementById('sleepQuality').value) || 3,
                        wakeFeeling: document.getElementById('sleepWakeFeeling').value,
                        notes: document.getElementById('sleepNotes').value.trim(),
                    };

                    data.sleepQuality.records[date] = sleepData;
                    _saveData();
                    _renderSleepQuality();
                    App.closeModal();
                    App.showSuccess('已记录');
                });
            }
        });
    }

    // ============================================================
    // 12. 体重/围度追踪
    // ============================================================
    function _renderWeightBody() {
        const el = containerEl.querySelector('#weightBody');
        if (!el) return;

        const wb = data.weightBody;
        const records = wb.records || [];
        const latest = records.length > 0 ? records[records.length - 1] : null;
        const diff = latest ? (latest.weight - wb.startWeight).toFixed(1) : 0;
        const toTarget = latest ? (latest.weight - wb.targetWeight).toFixed(1) : 0;

        // 近5次记录用于曲线
        const recentRecords = records.slice(-7);
        const maxWeight = Math.max(...recentRecords.map(r => r.weight), wb.startWeight, wb.currentWeight, wb.targetWeight + 5);
        const minWeight = Math.min(...recentRecords.map(r => r.weight), wb.targetWeight - 2);
        const weightRange = maxWeight - minWeight || 1;

        el.innerHTML = `
            <div class="card weight-card">
                <div class="weight-main">
                    <div class="weight-current">
                        <span class="weight-value">${latest ? latest.weight : wb.currentWeight}</span>
                        <span class="weight-unit">kg</span>
                    </div>
                    <div class="weight-diff">
                        <span class="${diff < 0 ? 'loss' : 'gain'}">
                            ${diff > 0 ? '+' : ''}${diff} kg
                        </span>
                        <span class="weight-diff-label">较起始</span>
                    </div>
                </div>
                <div class="weight-target">
                    <span>目标：${wb.targetWeight} kg</span>
                    <span>距目标还差 ${toTarget > 0 ? toTarget : Math.abs(toTarget) + '（已超越）'} kg</span>
                </div>
                <div class="progress progress-sm">
                    <div class="progress-bar" style="width: ${_calcWeightProgress(wb)}%; background: linear-gradient(90deg, #f4b8c488, #f4b8c4);"></div>
                </div>
                ${latest ? `
                    <div class="measurements-grid">
                        <div class="measurement-item">
                            <div class="meas-label">腰围</div>
                            <div class="meas-value">${latest.waist || '--'} cm</div>
                        </div>
                        <div class="measurement-item">
                            <div class="meas-label">臀围</div>
                            <div class="meas-value">${latest.hip || '--'} cm</div>
                        </div>
                        <div class="measurement-item">
                            <div class="meas-label">大腿围</div>
                            <div class="meas-value">${latest.thigh || '--'} cm</div>
                        </div>
                        <div class="measurement-item">
                            <div class="meas-label">BMI</div>
                            <div class="meas-value">${wb.height ? (latest.weight / ((wb.height / 100) ** 2)).toFixed(1) : '--'}</div>
                        </div>
                    </div>
                ` : ''}
                ${recentRecords.length > 1 ? `
                    <div class="weight-chart-title">体重变化曲线</div>
                    <div class="weight-chart">
                        <svg viewBox="0 0 280 80" class="chart-svg">
                            ${recentRecords.map((r, i) => {
                                const x = 20 + i * (240 / (recentRecords.length - 1 || 1));
                                const y = 70 - ((r.weight - minWeight) / weightRange) * 55;
                                return `<circle cx="${x}" cy="${y}" r="3" fill="#f4b8c4" />`;
                            }).join('')}
                            <polyline
                                points="${recentRecords.map((r, i) => {
                                    const x = 20 + i * (240 / (recentRecords.length - 1 || 1));
                                    const y = 70 - ((r.weight - minWeight) / weightRange) * 55;
                                    return `${x},${y}`;
                                }).join(' ')}"
                                fill="none" stroke="#f4b8c4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                            />
                            ${recentRecords.map((r, i) => {
                                const x = 20 + i * (240 / (recentRecords.length - 1 || 1));
                                return `<text x="${x}" y="78" text-anchor="middle" class="chart-label">${new Date(r.date).getDate()}日</text>`;
                            }).join('')}
                        </svg>
                    </div>
                ` : ''}
            </div>
        `;
    }

    function _calcWeightProgress(wb) {
        const total = wb.startWeight - wb.targetWeight;
        if (total === 0) return 0;
        const lost = wb.startWeight - wb.currentWeight;
        return Math.max(0, Math.min(100, Math.round((lost / total) * 100)));
    }

    function _openWeightModal() {
        const wb = data.weightBody;
        const html = `
            <div class="form-group">
                <label class="form-label">日期</label>
                <input type="date" class="form-input" id="weightDate" value="${_today()}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">体重（kg）</label>
                    <input type="number" class="form-input" id="weightValue" value="${wb.currentWeight}" step="0.1" min="30" max="200">
                </div>
                <div class="form-group">
                    <label class="form-label">体脂率（%）</label>
                    <input type="number" class="form-input" id="weightBodyFat" value="" step="0.1" min="5" max="50" placeholder="可选">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">腰围（cm）</label>
                    <input type="number" class="form-input" id="weightWaist" value="" step="0.5" placeholder="可选">
                </div>
                <div class="form-group">
                    <label class="form-label">臀围（cm）</label>
                    <input type="number" class="form-input" id="weightHip" value="" step="0.5" placeholder="可选">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">大腿围（cm）</label>
                    <input type="number" class="form-input" id="weightThigh" value="" step="0.5" placeholder="可选">
                </div>
                <div class="form-group">
                    <label class="form-label">胸围（cm）</label>
                    <input type="number" class="form-input" id="weightChest" value="" step="0.5" placeholder="可选">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">备注</label>
                <input type="text" class="form-input" id="weightNote" placeholder="例如：早起空腹">
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveWeightBtn">保存记录</button>
            </div>
        `;

        App.openModal('记录体重围度', html, {
            onOpen: () => {
                document.getElementById('saveWeightBtn')?.addEventListener('click', () => {
                    const weight = parseFloat(document.getElementById('weightValue').value);
                    if (!weight || weight <= 0) {
                        App.showError('请输入有效体重');
                        return;
                    }

                    const record = {
                        id: _genId('wt'),
                        date: document.getElementById('weightDate').value || _today(),
                        weight,
                        bodyFat: parseFloat(document.getElementById('weightBodyFat').value) || null,
                        waist: parseFloat(document.getElementById('weightWaist').value) || null,
                        hip: parseFloat(document.getElementById('weightHip').value) || null,
                        thigh: parseFloat(document.getElementById('weightThigh').value) || null,
                        chest: parseFloat(document.getElementById('weightChest').value) || null,
                        note: document.getElementById('weightNote').value.trim(),
                        createdAt: Date.now(),
                    };

                    wb.records.push(record);
                    wb.currentWeight = weight;
                    _saveData();
                    _renderWeightBody();
                    App.closeModal();
                    App.showSuccess('已记录');
                });
            }
        });
    }

    // ============================================================
    // 13. 每日健康问卷
    // ============================================================
    function _renderDailyQuestionnaire() {
        const el = containerEl.querySelector('#dailyQuestionnaire');
        if (!el) return;

        const today = _today();
        const todayRecord = data.dailyQuestionnaire.records[today];

        el.innerHTML = `
            <div class="card questionnaire-card">
                <div class="questionnaire-header">
                    <span>今日健康自评</span>
                    ${todayRecord ? '<span class="record-status done">已完成</span>' : '<span class="record-status pending">待完成</span>'}
                </div>
                <div class="questionnaire-list">
                    ${HEALTH_QUESTIONS.map(q => {
                        const value = todayRecord?.[q.id] || 0;
                        return `
                            <div class="question-item" data-qid="${q.id}">
                                <div class="question-icon">${q.icon}</div>
                                <div class="question-label">${q.label}</div>
                                <div class="question-stars">
                                    ${[1,2,3,4,5].map(n => `
                                        <span class="question-star ${n <= value ? 'filled' : ''}" 
                                              data-qid="${q.id}" data-value="${n}">${n <= value ? '⭐' : '☆'}</span>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                ${todayRecord ? `
                    <div class="questionnaire-avg">
                        综合评分：${(HEALTH_QUESTIONS.reduce((sum, q) => sum + (todayRecord[q.id] || 0), 0) / HEALTH_QUESTIONS.length).toFixed(1)} 分
                    </div>
                ` : ''}
            </div>
        `;
    }

    function _setQuestionScore(qid, value) {
        const today = _today();
        if (!data.dailyQuestionnaire.records[today]) {
            data.dailyQuestionnaire.records[today] = {};
        }
        data.dailyQuestionnaire.records[today][qid] = value;
        _saveData();
        _renderDailyQuestionnaire();
    }

    // ============================================================
    // 13.5 日历回顾 - 日期详情
    // ============================================================
    function _viewHealthDay(dateStr) {
        currentDate = dateStr;
        const info = _getDayHealthInfo(dateStr);
        const weekDay = _formatDateShort(dateStr);

        let html = `<div class="health-day-detail">`;
        html += `<div class="health-day-date">${weekDay}</div>`;

        // 保健品打卡
        html += `<div class="health-day-section">
            <div class="health-day-section-title">💊 保健品打卡</div>`;
        if (info.hasSupplement) {
            const rec = data.supplementRecords[dateStr];
            html += `<div class="health-day-list">`;
            data.supplements.forEach(sup => {
                if (rec[sup.id]) {
                    html += `<div class="health-day-item done">
                        <span class="item-icon">${sup.icon}</span>
                        <span class="item-name">${_esc(sup.name)}</span>
                        <span class="item-status">✓ 已服用</span>
                    </div>`;
                }
            });
            html += `</div>`;
        } else {
            html += `<div class="empty-tip">暂无记录</div>`;
        }
        html += `</div>`;

        // 睡眠记录
        html += `<div class="health-day-section">
            <div class="health-day-section-title">😴 睡眠记录</div>`;
        if (info.hasSleep) {
            const sleep = data.sleepQuality.records[dateStr];
            html += `<div class="sleep-detail">
                <div class="sleep-detail-row">
                    <span>入睡时间</span><span>${sleep.bedtime || '—'}</span>
                </div>
                <div class="sleep-detail-row">
                    <span>起床时间</span><span>${sleep.wakeTime || '—'}</span>
                </div>
                <div class="sleep-detail-row">
                    <span>睡眠时长</span><span>${sleep.hours ? sleep.hours + ' 小时' : '—'}</span>
                </div>
                <div class="sleep-detail-row">
                    <span>睡眠质量</span><span>${sleep.quality ? SLEEP_QUALITY_LABELS[sleep.quality - 1] || sleep.quality + '分' : '—'}</span>
                </div>
                ${sleep.notes ? `<div class="sleep-detail-row"><span>备注</span><span>${_esc(sleep.notes)}</span></div>` : ''}
            </div>`;
        } else {
            html += `<div class="empty-tip">暂无记录</div>`;
        }
        html += `</div>`;

        // 每日健康问卷
        html += `<div class="health-day-section">
            <div class="health-day-section-title">📋 健康问卷</div>`;
        if (info.hasQuestionnaire) {
            const qRec = data.dailyQuestionnaire.records[dateStr];
            html += `<div class="questionnaire-day-list">`;
            HEALTH_QUESTIONS.forEach(q => {
                const value = qRec[q.id] || 0;
                html += `<div class="question-day-item">
                    <span class="q-icon">${q.icon}</span>
                    <span class="q-label">${q.label}</span>
                    <span class="q-stars">${'⭐'.repeat(value)}${'☆'.repeat(q.max - value)}</span>
                </div>`;
            });
            const avg = HEALTH_QUESTIONS.reduce((sum, q) => sum + (qRec[q.id] || 0), 0) / HEALTH_QUESTIONS.length;
            html += `<div class="questionnaire-day-avg">综合评分：${avg.toFixed(1)} 分</div>`;
            html += `</div>`;
        } else {
            html += `<div class="empty-tip">暂无记录</div>`;
        }
        html += `</div>`;

        // 症状日记
        html += `<div class="health-day-section">
            <div class="health-day-section-title">📝 症状日记</div>`;
        if (info.hasSymptom) {
            const records = data.symptomDiary.records.filter(r => r.date === dateStr);
            records.forEach(rec => {
                html += `<div class="symptom-day-card">
                    <div class="symptom-day-header">
                        ${rec.temperature ? `<span>体温：${rec.temperature}℃</span>` : ''}
                        <span>整体状态：${'⭐'.repeat(rec.overall || 3)}</span>
                    </div>
                    ${rec.symptoms && rec.symptoms.length > 0 ? `
                        <div class="symptom-day-tags">
                            ${rec.symptoms.map(s => `<span class="symptom-tag">${_esc(s.name)}</span>`).join('')}
                        </div>
                    ` : ''}
                    ${rec.description ? `<div class="symptom-day-desc">${_esc(rec.description)}</div>` : ''}
                    ${rec.remedy ? `<div class="symptom-day-remedy">处理：${_esc(rec.remedy)}</div>` : ''}
                </div>`;
            });
        } else {
            html += `<div class="empty-tip">暂无记录</div>`;
        }
        html += `</div>`;

        html += `</div>`;

        App.openModal(weekDay + ' 健康记录', html, {});
    }

    // ============================================================
    // 14. 事件绑定
    // ============================================================
    function _bindEvents() {
        if (!containerEl) return;

        // 编辑长期目标
        containerEl.querySelector('[data-action="edit-goals"]')?.addEventListener('click', () => {
            _openGoalsModal();
        });

        // 数据同步
        containerEl.querySelector('[data-action="sync-health"]')?.addEventListener('click', () => {
            _openSyncModal();
        });

        // 经期追踪
        containerEl.querySelector('[data-action="edit-period"]')?.addEventListener('click', () => {
            _openPeriodModal();
        });

        // 保健品操作
        containerEl.querySelector('[data-action="add-supplement"]')?.addEventListener('click', () => {
            _openSupplementModal();
        });
        containerEl.querySelectorAll('[data-action="toggle-sup"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _toggleSupplement(btn.dataset.id);
            });
        });
        containerEl.querySelectorAll('[data-action="edit-sup"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const sup = data.supplements.find(s => s.id === id);
                if (sup) _openSupplementModal(sup);
            });
        });
        containerEl.querySelectorAll('[data-action="delete-sup"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _deleteSupplement(btn.dataset.id);
            });
        });

        // 观察期操作
        containerEl.querySelector('[data-action="add-observation"]')?.addEventListener('click', () => {
            _openObservationModal();
        });
        containerEl.querySelectorAll('[data-action="edit-obs"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const obs = data.observations.find(o => o.id === id);
                if (obs) _openObservationModal(obs);
            });
        });
        containerEl.querySelectorAll('[data-action="delete-obs"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _deleteObservation(btn.dataset.id);
            });
        });
        containerEl.querySelectorAll('[data-action="add-obs-record"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _openObsRecordModal(btn.dataset.id);
            });
        });
        containerEl.querySelectorAll('[data-action="edit-obs-record"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _openObsRecordModal(btn.dataset.obs, btn.dataset.date);
            });
        });
        containerEl.querySelectorAll('[data-action="complete-obs"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _completeObservation(btn.dataset.id);
            });
        });

        // 症状日记
        containerEl.querySelector('[data-action="add-symptom"]')?.addEventListener('click', () => {
            _openSymptomModal();
        });

        // 睡眠质量
        containerEl.querySelector('[data-action="add-sleep"]')?.addEventListener('click', () => {
            _openSleepModal();
        });

        // 体重围度
        containerEl.querySelector('[data-action="add-weight"]')?.addEventListener('click', () => {
            _openWeightModal();
        });

        // 健康问卷
        containerEl.querySelectorAll('.question-star').forEach(star => {
            star.addEventListener('click', () => {
                const qid = star.dataset.qid;
                const value = parseInt(star.dataset.value);
                _setQuestionScore(qid, value);
            });
        });

        // 健康日历
        containerEl.querySelector('[data-action="toggle-calendar"]')?.addEventListener('click', () => {
            showCalendar = !showCalendar;
            render(containerEl);
        });

        containerEl.querySelector('[data-action="prev-month-health"]')?.addEventListener('click', () => {
            calendarMonth--;
            if (calendarMonth < 0) {
                calendarMonth = 11;
                calendarYear--;
            }
            const calEl = containerEl.querySelector('#healthCalendar');
            if (calEl) calEl.innerHTML = _renderHealthCalendar();
            _bindCalendarDayEvents();
        });

        containerEl.querySelector('[data-action="next-month-health"]')?.addEventListener('click', () => {
            calendarMonth++;
            if (calendarMonth > 11) {
                calendarMonth = 0;
                calendarYear++;
            }
            const calEl = containerEl.querySelector('#healthCalendar');
            if (calEl) calEl.innerHTML = _renderHealthCalendar();
            _bindCalendarDayEvents();
        });

        _bindCalendarDayEvents();
    }

    function _bindCalendarDayEvents() {
        if (!containerEl) return;
        containerEl.querySelectorAll('[data-action="health-cal-day"]').forEach(day => {
            day.addEventListener('click', () => {
                const dateStr = day.dataset.date;
                _viewHealthDay(dateStr);
            });
        });
    }

    // ============================================================
    // 15. onAdd / onResume
    // ============================================================
    function onAdd() {
        _openSleepModal();
    }

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
    App.registerModule('health', HealthModule);
}
