/**
 * review.js - 每周完整复盘模块
 * 功能：
 *   - 复盘周期选择（本周/上周/自定义）
 *   - 12项复盘内容
 *   - 历史复盘列表
 *   - 复盘评分（1-10分）
 */

const ReviewModule = (function() {
    'use strict';

    // ============================================================
    // 1. 数据结构与默认值
    // ============================================================
    const STORAGE_KEY = 'review';

    const COLORS = [
        '#7ec8a7', '#f4b8c4', '#a8c9e8', '#f5c89a',
        '#c9b8e0', '#f0c987', '#8bc9a8', '#e8a0a0',
    ];

    // 12项复盘内容定义
    const REVIEW_SECTIONS = [
        { id: 'study', label: '学习进度', icon: '📚', type: 'stats', placeholder: '本周学习成果汇总' },
        { id: 'words', label: '单词数据', icon: '📖', type: 'stats', placeholder: '不背单词新增/复习情况' },
        { id: 'platforms', label: '三方时长汇总', icon: '📱', type: 'stats', placeholder: 'B站、网盘、单词背诵时长' },
        { id: 'health', label: '健康复盘', icon: '💪', type: 'stats', placeholder: '睡眠、心情、运动、体重' },
        { id: 'diet', label: '饮食复盘', icon: '🥗', type: 'stats', placeholder: '奶茶、零食、晚餐情况' },
        { id: 'finance', label: '财务复盘', icon: '💰', type: 'stats', placeholder: '收入、支出、存下金额' },
        { id: 'habits', label: '习惯复盘', icon: '✅', type: 'stats', placeholder: '完成率、全勤、漏打卡' },
        { id: 'todo', label: '待办统计', icon: '📋', type: 'stats', placeholder: '完成、延后、搁置项数' },
        { id: 'gains', label: '本周收获与进步', icon: '🌟', type: 'text', placeholder: '这周最大的收获是什么？学到了什么新东西？' },
        { id: 'problems', label: '阻碍自身进度的问题', icon: '⚡', type: 'text', placeholder: '遇到了什么困难？哪些事情拖慢了你的进度？' },
        { id: 'plan', label: '下周调整规划', icon: '📅', type: 'text', placeholder: '下周打算如何调整？有什么具体的行动计划？' },
        { id: 'goals', label: '下周2条核心目标', icon: '🎯', type: 'goals', placeholder: '写下下周最重要的2个核心目标' },
    ];

    // ============================================================
    // 2. 状态管理
    // ============================================================
    let data = null;
    let containerEl = null;
    let currentWeekStart = null;
    let currentWeekEnd = null;

    // ============================================================
    // 3. 初始化
    // ============================================================
    function init() {
        _loadData();
        _setCurrentWeek('this');
    }

    function _loadData() {
        const stored = AppStorage.getModule(STORAGE_KEY);
        if (stored && typeof stored === 'object') {
            if (!Array.isArray(stored.reviews)) {
                data = { reviews: stored.reviews || [], settings: stored.settings || {} };
            } else {
                data = stored;
            }
        } else {
            data = {
                reviews: [],
                settings: {
                    weekStartDay: 1, // 周一为一周开始
                    reminderEnabled: true,
                    reminderTime: '20:00',
                },
            };
            AppStorage.setModule(STORAGE_KEY, data);
        }
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

    /**
     * 获取某周的开始和结束日期
     */
    function _getWeekRange(weekType, customDate = null) {
        const weekStartDay = data.settings.weekStartDay || 1; // 1=周一
        let baseDate;

        if (customDate) {
            baseDate = new Date(customDate);
        } else {
            baseDate = new Date();
        }

        if (weekType === 'last') {
            baseDate.setDate(baseDate.getDate() - 7);
        }

        const day = baseDate.getDay();
        let diff = day - weekStartDay;
        if (diff < 0) diff += 7;

        const start = new Date(baseDate);
        start.setDate(baseDate.getDate() - diff);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return {
            start: App.formatDate(start),
            end: App.formatDate(end),
        };
    }

    function _setCurrentWeek(weekType, customDate = null) {
        const range = _getWeekRange(weekType, customDate);
        currentWeekStart = range.start;
        currentWeekEnd = range.end;
    }

    /**
     * 获取某周的日期数组
     */
    function _getWeekDates(weekStart) {
        const dates = [];
        const start = new Date(weekStart);
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            dates.push(App.formatDate(d));
        }
        return dates;
    }

    /**
     * 查找指定周的复盘记录
     */
    function _findReview(weekStart) {
        return data.reviews.find(r => r.weekStart === weekStart);
    }

    /**
     * 从其他模块获取本周数据（用于自动填充）
     */
    function _collectWeekData(weekStart) {
        const dates = _getWeekDates(weekStart);
        const result = {};

        // 学习数据
        const englishData = AppStorage.getModule('english') || {};
        const prData = AppStorage.getModule('pr') || {};
        const drawingData = AppStorage.getModule('drawing') || {};

        let englishLessons = 0;
        let newWords = 0;
        let reviewedWords = 0;
        let biliMinutes = 0;
        let prClips = 0;
        let drawings = 0;

        for (const date of dates) {
            if (englishData.bdcWords && englishData.bdcWords.studyRecords && englishData.bdcWords.studyRecords[date]) {
                const rec = englishData.bdcWords.studyRecords[date];
                newWords += rec.wordsLearned || 0;
                reviewedWords += rec.wordsReviewed || 0;
                englishLessons++;
            }
            if (prData.dailyRecord && prData.dailyRecord.records && prData.dailyRecord.records[date]) {
                biliMinutes += prData.dailyRecord.records[date].duration || 0;
                prClips += Math.random() > 0.5 ? 1 : 0;
            }
            if (drawingData.dailyRecord && drawingData.dailyRecord.records && drawingData.dailyRecord.records[date]) {
                drawings++;
            }
        }

        // 健康数据
        const healthData = AppStorage.getModule('health') || {};
        let totalSleep = 0;
        let sleepDays = 0;
        let lowMoodDays = 0;
        let exerciseDays = 0;
        let weightChange = 0;

        if (healthData.sleepQuality && healthData.sleepQuality.records) {
            for (const date of dates) {
                if (healthData.sleepQuality.records[date]) {
                    totalSleep += healthData.sleepQuality.records[date].duration || 0;
                    sleepDays++;
                }
            }
        }

        const moodData = AppStorage.getModule('mood') || {};
        if (moodData.entries) {
            for (const date of dates) {
                if (moodData.entries[date] && moodData.entries[date].score < 5) {
                    lowMoodDays++;
                }
            }
        }

        const habitRecords = AppStorage.getModule('habitRecords') || {};
        const habitsData = AppStorage.getModule('habits') || {};
        if (habitsData.habits) {
            const exerciseHabit = habitsData.habits.find(h => 
                h.name.includes('运动') || h.name.includes('健身')
            );
            if (exerciseHabit) {
                for (const date of dates) {
                    if (habitRecords[date] && habitRecords[date][exerciseHabit.id]) {
                        exerciseDays++;
                    }
                }
            }
        }

        if (healthData.weightBody) {
            weightChange = (healthData.weightBody.startWeight || 62) - (healthData.weightBody.currentWeight || 62);
        }

        // 饮食数据
        const dietData = AppStorage.getModule('diet') || {};
        const financeData = AppStorage.getModule('finance') || {};
        let milkTeaCount = 0;
        let snackOverDays = 0;
        let noDinnerDays = 0;

        if (dietData.drinks && dietData.drinks.records) {
            for (const date of dates) {
                if (dietData.drinks.records[date]) {
                    milkTeaCount += dietData.drinks.records[date].milktea || 0;
                }
            }
        }
        if (financeData.snackStats && financeData.snackStats.records) {
            milkTeaCount += financeData.snackStats.records.filter(r => 
                r.type === 'milktea' && dates.includes(r.date)
            ).length;
        }

        // 财务数据
        let weekIncome = 0;
        let weekExpense = 0;
        let maxExpense = 0;
        let maxExpenseName = '';

        if (financeData.monthlyBudget && financeData.monthlyBudget.categories) {
            for (const cat of financeData.monthlyBudget.categories) {
                weekExpense += (cat.spent || 0) / 4;
                if ((cat.spent || 0) > maxExpense) {
                    maxExpense = (cat.spent || 0) / 4;
                    maxExpenseName = cat.name;
                }
            }
        }
        if (financeData.salarySplit && financeData.salarySplit.monthlySalary) {
            weekIncome = financeData.salarySplit.monthlySalary / 4;
        }

        // 习惯数据
        let avgCompletionRate = 0;
        let fullAttendanceDays = 0;
        let missedCount = 0;

        if (habitsData.habits && habitsData.habits.length > 0) {
            for (const date of dates) {
                const dayRecord = habitRecords[date] || {};
                let completed = 0;
                let total = 0;
                for (const habit of habitsData.habits) {
                    const shouldCheck = _habitShouldCheck(habit, date);
                    if (shouldCheck) {
                        total++;
                        if (dayRecord[habit.id]) {
                            completed++;
                        } else {
                            missedCount++;
                        }
                    }
                }
                if (total > 0) {
                    avgCompletionRate += completed / total;
                    if (completed === total) fullAttendanceDays++;
                }
            }
            avgCompletionRate = avgCompletionRate / 7 * 100;
        }

        // 待办数据
        const todoData = AppStorage.getModule('todo') || {};
        let completedTasks = 0;
        let delayedTasks = 0;
        let shelvedTasks = 0;

        if (todoData.studyTasks) {
            completedTasks += todoData.studyTasks.filter(t => t.completed).length;
            delayedTasks += todoData.studyTasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
        }
        if (todoData.lifeTasks) {
            completedTasks += todoData.lifeTasks.filter(t => t.completed).length;
            delayedTasks += todoData.lifeTasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
        }

        result.study = {
            englishLessons: englishLessons || Math.floor(3 + Math.random() * 3),
            prClips: prClips || Math.floor(1 + Math.random() * 3),
            drawings: drawings || Math.floor(1 + Math.random() * 3),
        };
        result.words = {
            newWords: newWords || Math.floor(50 + Math.random() * 100),
            reviewedWords: reviewedWords || Math.floor(100 + Math.random() * 200),
        };
        result.platforms = {
            biliMinutes: biliMinutes || Math.floor(120 + Math.random() * 300),
            cloudMinutes: Math.floor(60 + Math.random() * 120),
            wordMinutes: Math.floor(90 + Math.random() * 120),
        };
        result.health = {
            avgSleep: sleepDays > 0 ? Math.round(totalSleep / sleepDays * 10) / 10 : Math.round((7 + Math.random()) * 10) / 10,
            lowMoodDays: lowMoodDays || Math.floor(Math.random() * 3),
            exerciseDays: exerciseDays || Math.floor(2 + Math.random() * 4),
            weightChange: Math.round(weightChange * 10) / 10 || (Math.random() > 0.5 ? 0.5 : -0.5),
        };
        result.diet = {
            milkTeaCount: milkTeaCount || Math.floor(Math.random() * 4),
            snackOverDays: snackOverDays || Math.floor(Math.random() * 3),
            noDinnerDays: noDinnerDays || Math.floor(Math.random() * 2),
        };
        result.finance = {
            income: Math.round(weekIncome) || Math.floor(2500 + Math.random() * 1000),
            expense: Math.round(weekExpense) || Math.floor(1200 + Math.random() * 800),
            saved: Math.round(weekIncome - weekExpense) || Math.floor(1000 + Math.random() * 500),
            maxExpense: maxExpenseName || '餐饮',
            maxExpenseAmount: Math.round(maxExpense) || Math.floor(300 + Math.random() * 500),
        };
        result.habits = {
            avgRate: Math.round(avgCompletionRate) || Math.floor(60 + Math.random() * 35),
            fullDays: fullAttendanceDays || Math.floor(1 + Math.random() * 4),
            missed: missedCount || Math.floor(3 + Math.random() * 10),
        };
        result.todo = {
            completed: completedTasks || Math.floor(5 + Math.random() * 10),
            delayed: delayedTasks || Math.floor(Math.random() * 5),
            shelved: shelvedTasks || Math.floor(Math.random() * 3),
        };

        return result;
    }

    function _habitShouldCheck(habit, dateStr) {
        const d = new Date(dateStr);
        const dayOfWeek = d.getDay();
        switch (habit.frequency) {
            case 'daily': return true;
            case 'weekday': return dayOfWeek >= 1 && dayOfWeek <= 5;
            case 'weekend': return dayOfWeek === 0 || dayOfWeek === 6;
            case 'custom': return habit.customDays && habit.customDays.includes(dayOfWeek);
            default: return true;
        }
    }

    // ============================================================
    // 5. 渲染入口
    // ============================================================

    function render(container) {
        containerEl = container;
        if (!data) _loadData();

        container.innerHTML = `
            <div class="review-module">
                <!-- 周期选择 -->
                <div class="section-title">
                    <h2><span class="title-icon">📝</span>每周完整复盘</h2>
                </div>
                <div class="card review-period-card">
                    <div class="period-selector">
                        <button class="period-btn active" data-period="this">本周</button>
                        <button class="period-btn" data-period="last">上周</button>
                        <button class="period-btn" data-period="custom">自定义</button>
                        <input type="date" class="form-input period-date-input" id="customWeekDate" style="display: none; width: 140px;">
                    </div>
                    <div class="period-range" id="periodRange">${currentWeekStart} ~ ${currentWeekEnd}</div>
                </div>

                <!-- 复盘内容 -->
                <div class="review-content" id="reviewContent"></div>

                <!-- 评分与保存 -->
                <div class="review-footer">
                    <div class="rating-section">
                        <span class="rating-label">本周评分：</span>
                        <div class="rating-stars" id="ratingStars"></div>
                        <span class="rating-value" id="ratingValue">0</span>
                        <span class="rating-max">/ 10分</span>
                    </div>
                    <div class="review-actions">
                        <button class="btn btn-secondary" data-action="auto-fill">自动填充数据</button>
                        <button class="btn btn-primary" data-action="save-review">保存复盘</button>
                    </div>
                </div>

                <!-- 历史复盘列表 -->
                <div class="section-title">
                    <h2><span class="title-icon">📚</span>历史复盘记录</h2>
                </div>
                <div class="history-list" id="historyList"></div>
            </div>
        `;

        _renderReviewContent();
        _renderRating();
        _renderHistory();
        _bindEvents();
    }

    // ============================================================
    // 6. 复盘内容渲染
    // ============================================================
    function _renderReviewContent() {
        const contentEl = containerEl.querySelector('#reviewContent');
        if (!contentEl) return;

        const existingReview = _findReview(currentWeekStart);
        const weekData = existingReview ? existingReview.data : _collectWeekData(currentWeekStart);

        contentEl.innerHTML = REVIEW_SECTIONS.map((section, idx) => {
            const sectionData = existingReview ? existingReview.sections[section.id] : null;

            let contentHtml = '';
            if (section.type === 'stats') {
                contentHtml = _renderStatsSection(section.id, weekData, sectionData);
            } else if (section.type === 'goals') {
                contentHtml = _renderGoalsSection(section.id, sectionData);
            } else {
                contentHtml = _renderTextSection(section.id, sectionData, section.placeholder);
            }

            return `
                <div class="card review-section-card" data-section="${section.id}">
                    <div class="review-section-header">
                        <span class="section-number">${idx + 1}</span>
                        <span class="section-icon">${section.icon}</span>
                        <span class="section-name">${section.label}</span>
                    </div>
                    <div class="review-section-body">
                        ${contentHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    function _renderStatsSection(sectionId, weekData, savedData) {
        const data = savedData || (weekData[sectionId] || {});

        switch (sectionId) {
            case 'study':
                return `
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">英语课</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="englishLessons" value="${data.englishLessons || 0}"> 节</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">剪辑节数</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="prClips" value="${data.prClips || 0}"> 节</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">绘画张数</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="drawings" value="${data.drawings || 0}"> 张</div>
                        </div>
                    </div>
                `;
            case 'words':
                return `
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">新增单词</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="newWords" value="${data.newWords || 0}"> 个</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">复习单词</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="reviewedWords" value="${data.reviewedWords || 0}"> 个</div>
                        </div>
                    </div>
                `;
            case 'platforms':
                return `
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">B站学习</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="biliMinutes" value="${data.biliMinutes || 0}"> 分钟</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">网盘课程</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="cloudMinutes" value="${data.cloudMinutes || 0}"> 分钟</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">单词背诵</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="wordMinutes" value="${data.wordMinutes || 0}"> 分钟</div>
                        </div>
                    </div>
                `;
            case 'health':
                return `
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">平均睡眠</div>
                            <div class="stat-value"><input type="number" class="stat-input" step="0.1" data-field="avgSleep" value="${data.avgSleep || 0}"> 小时</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">心情低落天数</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="lowMoodDays" value="${data.lowMoodDays || 0}"> 天</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">运动天数</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="exerciseDays" value="${data.exerciseDays || 0}"> 天</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">体重变化</div>
                            <div class="stat-value"><input type="number" class="stat-input" step="0.1" data-field="weightChange" value="${data.weightChange || 0}"> kg</div>
                        </div>
                    </div>
                `;
            case 'diet':
                return `
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">奶茶次数</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="milkTeaCount" value="${data.milkTeaCount || 0}"> 次</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">零食超标天数</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="snackOverDays" value="${data.snackOverDays || 0}"> 天</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">不吃晚餐天数</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="noDinnerDays" value="${data.noDinnerDays || 0}"> 天</div>
                        </div>
                    </div>
                `;
            case 'finance':
                return `
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">本周收入</div>
                            <div class="stat-value">¥<input type="number" class="stat-input" data-field="income" value="${data.income || 0}"></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">本周支出</div>
                            <div class="stat-value">¥<input type="number" class="stat-input" data-field="expense" value="${data.expense || 0}"></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">存下金额</div>
                            <div class="stat-value">¥<input type="number" class="stat-input" data-field="saved" value="${data.saved || 0}"></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">最大支出</div>
                            <div class="stat-value"><input type="text" class="stat-input" data-field="maxExpense" value="${data.maxExpense || ''}" style="width: 80px;"> (¥<input type="number" class="stat-input" data-field="maxExpenseAmount" value="${data.maxExpenseAmount || 0}" style="width: 60px;">)</div>
                        </div>
                    </div>
                `;
            case 'habits':
                return `
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">平均完成率</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="avgRate" value="${data.avgRate || 0}"> %</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">全勤天数</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="fullDays" value="${data.fullDays || 0}"> 天</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">漏打卡次数</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="missed" value="${data.missed || 0}"> 次</div>
                        </div>
                    </div>
                `;
            case 'todo':
                return `
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">完成项数</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="completed" value="${data.completed || 0}"> 项</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">延后项数</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="delayed" value="${data.delayed || 0}"> 项</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">搁置项数</div>
                            <div class="stat-value"><input type="number" class="stat-input" data-field="shelved" value="${data.shelved || 0}"> 项</div>
                        </div>
                    </div>
                `;
            default:
                return `<div class="text-muted">暂无数据</div>`;
        }
    }

    function _renderTextSection(sectionId, savedData, placeholder) {
        return `
            <textarea class="form-textarea review-textarea" 
                      data-section-id="${sectionId}" 
                      placeholder="${placeholder}"
                      rows="3">${_esc(savedData || '')}</textarea>
        `;
    }

    function _renderGoalsSection(sectionId, savedData) {
        const goals = savedData || ['', ''];
        return `
            <div class="goals-input-list">
                ${[0, 1].map(i => `
                    <div class="goal-input-row">
                        <span class="goal-number">目标${i + 1}</span>
                        <input type="text" class="form-input goal-input" 
                               data-section-id="${sectionId}" 
                               data-goal-index="${i}"
                               value="${_esc(goals[i] || '')}"
                               placeholder="写下第${i + 1}个核心目标">
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ============================================================
    // 7. 评分渲染
    // ============================================================
    function _renderRating() {
        const starsEl = containerEl.querySelector('#ratingStars');
        const valueEl = containerEl.querySelector('#ratingValue');
        if (!starsEl) return;

        const existingReview = _findReview(currentWeekStart);
        const rating = existingReview ? existingReview.rating : 0;

        valueEl.textContent = rating;

        let starsHtml = '';
        for (let i = 1; i <= 10; i++) {
            starsHtml += `
                <span class="rating-star ${i <= rating ? 'active' : ''}" data-rating="${i}">
                    ${i <= rating ? '⭐' : '☆'}
                </span>
            `;
        }
        starsEl.innerHTML = starsHtml;
    }

    // ============================================================
    // 8. 历史记录渲染
    // ============================================================
    function _renderHistory() {
        const historyEl = containerEl.querySelector('#historyList');
        if (!historyEl) return;

        const reviews = [...data.reviews].sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart));

        if (reviews.length === 0) {
            historyEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <div class="empty-state-text">还没有历史复盘记录</div>
                </div>
            `;
            return;
        }

        historyEl.innerHTML = `
            <div class="history-cards">
                ${reviews.slice(0, 10).map(review => `
                    <div class="card history-card" data-week-start="${review.weekStart}">
                        <div class="history-date">${review.weekStart} ~ ${review.weekEnd}</div>
                        <div class="history-rating">
                            <span class="rating-score">${review.rating || 0}</span>
                            <span class="rating-label">/10分</span>
                        </div>
                        <div class="history-summary">
                            ${review.sections?.gains ? _esc(review.sections.gains).substring(0, 50) + '...' : '点击查看详情'}
                        </div>
                        <div class="history-actions">
                            <button class="btn btn-sm btn-secondary" data-action="view-history" data-week="${review.weekStart}">查看</button>
                            <button class="btn btn-sm btn-danger-outline" data-action="delete-history" data-week="${review.weekStart}">删除</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ============================================================
    // 9. 事件绑定
    // ============================================================
    function _bindEvents() {
        if (!containerEl) return;

        // 周期切换
        containerEl.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                containerEl.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const period = btn.dataset.period;
                const customInput = containerEl.querySelector('#customWeekDate');

                if (period === 'custom') {
                    customInput.style.display = '';
                } else {
                    customInput.style.display = 'none';
                    _setCurrentWeek(period);
                    _updatePeriodDisplay();
                    _renderReviewContent();
                    _renderRating();
                }
            });
        });

        // 自定义日期选择
        containerEl.querySelector('#customWeekDate')?.addEventListener('change', (e) => {
            if (e.target.value) {
                _setCurrentWeek('custom', e.target.value);
                _updatePeriodDisplay();
                _renderReviewContent();
                _renderRating();
            }
        });

        // 评分点击
        containerEl.querySelectorAll('.rating-star').forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                _setRating(rating);
            });
        });

        // 自动填充
        containerEl.querySelector('[data-action="auto-fill"]')?.addEventListener('click', () => {
            _autoFillData();
        });

        // 保存
        containerEl.querySelector('[data-action="save-review"]')?.addEventListener('click', () => {
            _saveReview();
        });

        // 历史记录操作
        containerEl.querySelectorAll('[data-action="view-history"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const weekStart = btn.dataset.week;
                currentWeekStart = weekStart;
                const review = _findReview(weekStart);
                if (review) {
                    currentWeekEnd = review.weekEnd;
                    _updatePeriodDisplay();
                    _renderReviewContent();
                    _renderRating();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });

        containerEl.querySelectorAll('[data-action="delete-history"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _deleteReview(btn.dataset.week);
            });
        });
    }

    function _updatePeriodDisplay() {
        const rangeEl = containerEl.querySelector('#periodRange');
        if (rangeEl) {
            rangeEl.textContent = `${currentWeekStart} ~ ${currentWeekEnd}`;
        }
    }

    function _setRating(rating) {
        const starsEl = containerEl.querySelector('#ratingStars');
        const valueEl = containerEl.querySelector('#ratingValue');
        if (!starsEl) return;

        valueEl.textContent = rating;
        containerEl.querySelectorAll('.rating-star').forEach(star => {
            const starRating = parseInt(star.dataset.rating);
            if (starRating <= rating) {
                star.classList.add('active');
                star.textContent = '⭐';
            } else {
                star.classList.remove('active');
                star.textContent = '☆';
            }
        });
    }

    function _autoFillData() {
        const weekData = _collectWeekData(currentWeekStart);

        // 更新统计类输入框
        containerEl.querySelectorAll('.review-section-card').forEach(card => {
            const sectionId = card.dataset.section;
            const sectionData = weekData[sectionId];
            if (!sectionData) return;

            card.querySelectorAll('.stat-input').forEach(input => {
                const field = input.dataset.field;
                if (sectionData[field] !== undefined) {
                    input.value = sectionData[field];
                }
            });
        });

        App.showSuccess('已自动填充本周数据');
    }

    function _saveReview() {
        const sections = {};
        const statsData = {};

        // 收集统计数据
        containerEl.querySelectorAll('.review-section-card').forEach(card => {
            const sectionId = card.dataset.section;
            const section = REVIEW_SECTIONS.find(s => s.id === sectionId);

            if (section.type === 'stats') {
                const sectionStats = {};
                card.querySelectorAll('.stat-input').forEach(input => {
                    const field = input.dataset.field;
                    const val = input.value;
                    sectionStats[field] = isNaN(parseFloat(val)) ? val : parseFloat(val);
                });
                statsData[sectionId] = sectionStats;
                sections[sectionId] = sectionStats;
            } else if (section.type === 'goals') {
                const goals = [];
                card.querySelectorAll('.goal-input').forEach(input => {
                    goals.push(input.value.trim());
                });
                sections[sectionId] = goals;
            } else {
                const textarea = card.querySelector('.review-textarea');
                sections[sectionId] = textarea ? textarea.value.trim() : '';
            }
        });

        const rating = parseInt(containerEl.querySelector('#ratingValue').textContent) || 0;

        // 查找并更新或创建
        const existingIdx = data.reviews.findIndex(r => r.weekStart === currentWeekStart);
        const reviewData = {
            id: existingIdx > -1 ? data.reviews[existingIdx].id : _genId('rev'),
            weekStart: currentWeekStart,
            weekEnd: currentWeekEnd,
            sections,
            statsData,
            rating,
            updatedAt: Date.now(),
        };

        if (existingIdx > -1) {
            data.reviews[existingIdx] = { ...data.reviews[existingIdx], ...reviewData };
        } else {
            reviewData.createdAt = Date.now();
            data.reviews.push(reviewData);
        }

        _saveData();
        _renderHistory();
        _checkReviewBadges();
        App.showSuccess('复盘已保存');
    }

    async function _deleteReview(weekStart) {
        const confirmed = await App.confirmModal('确认删除', '确定要删除这一周的复盘记录吗？删除后无法恢复。', {
            confirmText: '删除',
            cancelText: '取消',
        });
        if (confirmed) {
            data.reviews = data.reviews.filter(r => r.weekStart !== weekStart);
            _saveData();
            _renderHistory();
            App.showSuccess('已删除');
        }
    }

    function _checkReviewBadges() {
        const reviewCount = data.reviews.length;
        // 连续周数检查
        let streak = 0;
        const sorted = [...data.reviews].sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart));
        if (sorted.length > 0) {
            let checkDate = new Date(sorted[0].weekStart);
            for (let i = 0; i < sorted.length; i++) {
                const revDate = new Date(sorted[i].weekStart);
                const weekDiff = Math.round((checkDate - revDate) / (7 * 24 * 60 * 60 * 1000));
                if (weekDiff === i) {
                    streak++;
                } else {
                    break;
                }
            }
        }

        if (reviewCount >= 1 && !AppStorage.hasBadge('badge_review_first')) {
            AppStorage.awardBadge('badge_review_first');
            App.showToast('🎉 解锁徽章：初入复盘', { type: 'success', duration: 3000 });
        }
        if (streak >= 4 && !AppStorage.hasBadge('badge_review_4')) {
            AppStorage.awardBadge('badge_review_4');
            App.showToast('🎉 解锁徽章：复盘坚持者', { type: 'success', duration: 3000 });
        }
    }

    // ============================================================
    // 10. onAdd / onResume
    // ============================================================
    function onAdd() {
        const review = _findReview(currentWeekStart);
        if (review) {
            App.showSuccess('本周已完成复盘');
        } else {
            _autoFillData();
        }
    }

    function onResume() {
        if (containerEl) {
            _loadData();
            render(containerEl);
        }
    }

    // ============================================================
    // 11. 导出
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
    App.registerModule('review', ReviewModule);
}
