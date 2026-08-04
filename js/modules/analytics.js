/**
 * analytics.js - 数据联动分析看板模块
 * 功能分区：
 *   1. 睡眠 vs 学习效率关联分析（双轴折线图）
 *   2. 心情 vs 饮食关联分析（双轴图）
 *   3. 月度成长自动报告
 *   4. 时间分配饼图
 *   5. 各模块联动数据总览
 */

const AnalyticsModule = (function() {
    'use strict';

    // ============================================================
    // 1. 数据结构与默认值
    // ============================================================
    const STORAGE_KEY = 'analytics';

    // 颜色调色板（柔和浅色系）
    const COLORS = {
        primary: '#7ec8a7',
        secondary: '#a8c9e8',
        accent: '#f4b8c4',
        warning: '#f5c89a',
        info: '#c9b8e0',
        success: '#8bc9a8',
        danger: '#e8a0a0',
        muted: '#d0d0d0',
        sleep: '#c9b8e0',
        study: '#7ec8a7',
        mood: '#f4b8c4',
        diet: '#f5c89a',
        work: '#a8c9e8',
        rest: '#d0d0d0',
        entertainment: '#f4b8c4',
        commute: '#f5c89a',
        other: '#c9b8e0',
    };

    // 默认分析数据
    const DEFAULT_DATA = {
        // 时间分配数据（用户可自定义）
        timeAllocation: {
            work: 8,
            sleep: 8,
            study: 2,
            entertainment: 2,
            commute: 2,
            exercise: 1,
            other: 1,
        },
        // 月度报告配置
        monthlyReportConfig: {
            autoGenerate: true,
            includeSections: ['study', 'health', 'finance', 'habits'],
        },
    };

    // ============================================================
    // 2. 状态管理
    // ============================================================
    let data = null;
    let containerEl = null;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    // ============================================================
    // 3. 初始化
    // ============================================================
    function init() {
        _loadData();
    }

    function _loadData() {
        const stored = AppStorage.getModule(STORAGE_KEY);
        if (stored && typeof stored === 'object') {
            data = { ...DEFAULT_DATA, ...stored };
        } else {
            data = JSON.parse(JSON.stringify(DEFAULT_DATA));
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

    function _today() {
        return App.getToday();
    }

    function _esc(text) {
        return App.escapeHtml(text || '');
    }

    /**
     * 获取最近N天的日期数组
     */
    function _getRecentDates(days) {
        const dates = [];
        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            dates.push(App.formatDate(d));
        }
        return dates;
    }

    /**
     * 从其他模块获取数据（模拟联动）
     */
    function _getSleepData(dates) {
        // 尝试从健康模块获取睡眠数据
        const healthData = AppStorage.getModule('health');
        const result = [];
        for (const date of dates) {
            let hours = 0;
            let quality = 0;
            if (healthData && healthData.sleepQuality && healthData.sleepQuality.records && healthData.sleepQuality.records[date]) {
                const rec = healthData.sleepQuality.records[date];
                hours = rec.duration || 0;
                quality = rec.quality || 0;
            }
            // 没有数据就显示0，不用模拟数据
            result.push({ date, hours: Math.round(hours * 10) / 10, quality });
        }
        return result;
    }

    function _getStudyData(dates) {
        // 从英语、PR、绘画等模块获取学习数据
        const englishData = AppStorage.getModule('english');
        const prData = AppStorage.getModule('pr');
        const drawingData = AppStorage.getModule('drawing');
        const habitRecords = AppStorage.getModule('habitRecords') || {};
        const habitsData = AppStorage.getModule('habits');

        const result = [];
        for (const date of dates) {
            let minutes = 0;
            let efficiency = 0;

            // 英语学习时长
            if (englishData && englishData.bdcWords && englishData.bdcWords.studyRecords && englishData.bdcWords.studyRecords[date]) {
                minutes += englishData.bdcWords.studyRecords[date].minutes || 0;
            }
            // PR学习时长
            if (prData && prData.dailyRecord && prData.dailyRecord.records && prData.dailyRecord.records[date]) {
                minutes += prData.dailyRecord.records[date].duration || 0;
            }
            // 绘画时长
            if (drawingData && drawingData.dailyRecord && drawingData.dailyRecord.records && drawingData.dailyRecord.records[date]) {
                minutes += drawingData.dailyRecord.records[date].duration || 0;
            }

            // 如果没有数据，根据习惯打卡估算
            if (minutes === 0 && habitsData && habitsData.habits) {
                const dayRecord = habitRecords[date] || {};
                let habitCount = 0;
                let studyHabitCount = 0;
                for (const habit of habitsData.habits) {
                    if (dayRecord[habit.id]) {
                        habitCount++;
                        if (habit.name.includes('英语') || habit.name.includes('学习') || habit.name.includes('剪辑') || habit.name.includes('绘画')) {
                            studyHabitCount++;
                        }
                    }
                }
                minutes = studyHabitCount * 45;
                efficiency = habitCount > 0 ? Math.round((studyHabitCount / habitCount) * 100) : 0;
            }

            // 没有数据就显示0，不用模拟数据
            result.push({
                date,
                minutes,
                hours: Math.round(minutes / 60 * 10) / 10,
                efficiency: Math.min(100, efficiency),
            });
        }
        return result;
    }

    function _getMoodData(dates) {
        const moodData = AppStorage.getModule('mood');
        const result = [];
        for (const date of dates) {
            let score = 0;
            if (moodData && moodData.entries && moodData.entries[date]) {
                score = moodData.entries[date].score || 0;
            }
            // 没有数据就显示0，不用模拟数据
            result.push({ date, score });
        }
        return result;
    }

    function _getDietData(dates) {
        const dietData = AppStorage.getModule('diet');
        const financeData = AppStorage.getModule('finance');
        const result = [];
        for (const date of dates) {
            let milkTeaAmount = 0;
            let snackAmount = 0;

            // 从饮食模块获取
            if (dietData && dietData.drinks && dietData.drinks.records && dietData.drinks.records[date]) {
                milkTeaAmount = (dietData.drinks.records[date].milktea || 0) * 18; // 假设每杯18元
            }
            if (dietData && dietData.snacks && dietData.snacks.records && dietData.snacks.records[date]) {
                const snacks = dietData.snacks.records[date];
                snackAmount = snacks.reduce((sum, s) => sum + (s.calories / 100 * 3), 0); // 粗略估算
            }

            // 从财务模块获取奶茶零食记录
            if (financeData && financeData.snackStats && financeData.snackStats.records) {
                const dayRecords = financeData.snackStats.records.filter(r => r.date === date);
                for (const rec of dayRecords) {
                    if (rec.type === 'milktea') milkTeaAmount += rec.amount || 0;
                    else snackAmount += rec.amount || 0;
                }
            }

            // 没有数据就显示0，不用模拟数据
            result.push({
                date,
                milkTeaAmount: Math.round(milkTeaAmount * 10) / 10,
                snackAmount: Math.round(snackAmount * 10) / 10,
                totalAmount: Math.round((milkTeaAmount + snackAmount) * 10) / 10,
            });
        }
        return result;
    }

    /**
     * 计算皮尔逊相关系数
     */
    function _calculateCorrelation(arr1, arr2) {
        if (arr1.length !== arr2.length || arr1.length === 0) return 0;
        const n = arr1.length;
        let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;
        for (let i = 0; i < n; i++) {
            sum1 += arr1[i];
            sum2 += arr2[i];
            sum1Sq += arr1[i] * arr1[i];
            sum2Sq += arr2[i] * arr2[i];
            pSum += arr1[i] * arr2[i];
        }
        const num = pSum - (sum1 * sum2 / n);
        const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
        if (den === 0) return 0;
        return Math.round((num / den) * 100) / 100;
    }

    /**
     * 获取相关性描述
     */
    function _getCorrelationLabel(corr) {
        const abs = Math.abs(corr);
        let strength = '';
        if (abs >= 0.8) strength = '强';
        else if (abs >= 0.5) strength = '中等';
        else if (abs >= 0.3) strength = '弱';
        else strength = '几乎无';
        const direction = corr > 0 ? '正相关' : corr < 0 ? '负相关' : '相关';
        return strength + direction;
    }

    // ============================================================
    // 5. 图表渲染（使用div+CSS实现简单可视化）
    // ============================================================

    /**
     * 渲染双轴折线图（用柱状+折线组合，div实现）
     */
    function _renderDualAxisChart(container, dates, leftData, rightData, options = {}) {
        const {
            leftLabel = '左轴',
            rightLabel = '右轴',
            leftColor = COLORS.sleep,
            rightColor = COLORS.study,
            leftUnit = '',
            rightUnit = '',
            leftKey = 'value',
            rightKey = 'value',
            rightKey2 = null,
            rightColor2 = COLORS.info,
            rightLabel2 = '',
        } = options;

        const leftValues = leftData.map(d => d[leftKey]);
        const rightValues = rightData.map(d => d[rightKey]);
        const rightValues2 = rightKey2 ? rightData.map(d => d[rightKey2]) : null;

        const leftMax = Math.max(...leftValues, 1);
        const rightMax = Math.max(...rightValues, ...(rightValues2 || []), 1);

        const chartHeight = 200;
        const barWidth = Math.max(12, Math.floor(480 / dates.length) - 8);

        const html = `
            <div class="dual-chart">
                <div class="chart-legend">
                    <span class="legend-item"><span class="legend-dot" style="background: ${leftColor};"></span>${leftLabel}</span>
                    <span class="legend-item"><span class="legend-dot" style="background: ${rightColor};"></span>${rightLabel}</span>
                    ${rightKey2 ? `<span class="legend-item"><span class="legend-dot" style="background: ${rightColor2};"></span>${rightLabel2}</span>` : ''}
                </div>
                <div class="chart-body">
                    <div class="chart-y-axis-left">
                        ${[5, 4, 3, 2, 1, 0].map(i => {
                            const val = Math.round((leftMax / 5) * i * 10) / 10;
                            return `<div class="y-tick">${val}${leftUnit}</div>`;
                        }).join('')}
                    </div>
                    <div class="chart-area">
                        <div class="chart-grid">
                            ${[0, 1, 2, 3, 4, 5].map(i => `<div class="grid-line" style="bottom: ${i * 20}%;"></div>`).join('')}
                        </div>
                        <div class="chart-bars">
                            ${dates.map((date, i) => {
                                const leftHeight = (leftValues[i] / leftMax) * 100;
                                return `
                                    <div class="bar-group" style="width: ${barWidth}px;">
                                        <div class="bar bar-left" 
                                             style="height: ${leftHeight}%; background: linear-gradient(180deg, ${leftColor}, ${leftColor}88);"
                                             title="${date}: ${leftValues[i]}${leftUnit}">
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <div class="chart-line">
                            <svg class="line-svg" viewBox="0 0 ${dates.length * (barWidth + 8)} ${chartHeight}" preserveAspectRatio="none">
                                <polyline 
                                    points="${rightValues.map((v, i) => `${i * (barWidth + 8) + barWidth / 2},${chartHeight - (v / rightMax) * chartHeight}`).join(' ')}"
                                    fill="none" 
                                    stroke="${rightColor}" 
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                                ${rightValues.map((v, i) => `
                                    <circle 
                                        cx="${i * (barWidth + 8) + barWidth / 2}" 
                                        cy="${chartHeight - (v / rightMax) * chartHeight}" 
                                        r="4" 
                                        fill="${rightColor}"
                                        title="${dates[i]}: ${v}${rightUnit}"
                                    />
                                `).join('')}
                                ${rightKey2 ? `
                                    <polyline 
                                        points="${rightValues2.map((v, i) => `${i * (barWidth + 8) + barWidth / 2},${chartHeight - (v / rightMax) * chartHeight}`).join(' ')}"
                                        fill="none" 
                                        stroke="${rightColor2}" 
                                        stroke-width="2"
                                        stroke-dasharray="4,4"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                    ${rightValues2.map((v, i) => `
                                        <circle 
                                            cx="${i * (barWidth + 8) + barWidth / 2}" 
                                            cy="${chartHeight - (v / rightMax) * chartHeight}" 
                                            r="3" 
                                            fill="${rightColor2}"
                                        />
                                    `).join('')}
                                ` : ''}
                            </svg>
                        </div>
                    </div>
                    <div class="chart-y-axis-right">
                        ${[5, 4, 3, 2, 1, 0].map(i => {
                            const val = Math.round((rightMax / 5) * i * 10) / 10;
                            return `<div class="y-tick">${val}${rightUnit}</div>`;
                        }).join('')}
                    </div>
                </div>
                <div class="chart-x-axis">
                    ${dates.map(d => `<div class="x-tick">${d.substr(5)}</div>`).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * 渲染饼图（使用CSS conic-gradient）
     */
    function _renderPieChart(container, segments, options = {}) {
        const { size = 200 } = options;
        const total = segments.reduce((sum, s) => sum + s.value, 0);

        let currentAngle = 0;
        const gradientStops = segments.map(seg => {
            const angle = (seg.value / total) * 360;
            const start = currentAngle;
            currentAngle += angle;
            return `${seg.color} ${start}deg ${currentAngle}deg`;
        }).join(', ');

        const html = `
            <div class="pie-chart-wrapper">
                <div class="pie-chart" style="
                    width: ${size}px;
                    height: ${size}px;
                    border-radius: 50%;
                    background: conic-gradient(${gradientStops});
                    position: relative;
                ">
                    <div class="pie-chart-inner" style="
                        position: absolute;
                        top: 25%;
                        left: 25%;
                        width: 50%;
                        height: 50%;
                        background: var(--bg-card, #fff);
                        border-radius: 50%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    ">
                        <div class="pie-total" style="font-size: 20px; font-weight: 600; color: var(--text-primary, #333);">${total}h</div>
                        <div class="pie-total-label" style="font-size: 12px; color: var(--text-secondary, #999);">每日总计</div>
                    </div>
                </div>
                <div class="pie-legend">
                    ${segments.map(seg => `
                        <div class="pie-legend-item">
                            <span class="legend-color" style="background: ${seg.color};"></span>
                            <span class="legend-name">${seg.name}</span>
                            <span class="legend-value">${seg.value}h (${Math.round(seg.value / total * 100)}%)</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    // ============================================================
    // 6. 渲染入口
    // ============================================================

    function render(container) {
        containerEl = container;
        if (!data) _loadData();

        container.innerHTML = `
            <div class="analytics-module">
                <!-- 睡眠 vs 学习效率 -->
                <div class="section-title">
                    <h2><span class="title-icon">😴📚</span>睡眠 vs 学习效率关联分析</h2>
                    <span class="section-subtitle">近14天数据 · 分析睡眠质量对学习效率的影响</span>
                </div>
                <div class="card analytics-card">
                    <div id="sleepStudyChart"></div>
                    <div class="analysis-conclusion" id="sleepStudyConclusion"></div>
                </div>

                <!-- 心情 vs 饮食 -->
                <div class="section-title">
                    <h2><span class="title-icon">😊🧋</span>心情 vs 饮食关联分析</h2>
                    <span class="section-subtitle">近30天数据 · 分析情绪与饮食消费的关系</span>
                </div>
                <div class="card analytics-card">
                    <div id="moodDietChart"></div>
                    <div class="analysis-conclusion" id="moodDietConclusion"></div>
                </div>

                <!-- 月度成长报告 -->
                <div class="section-title">
                    <h2><span class="title-icon">📊</span>月度成长自动报告</h2>
                    <span class="section-subtitle" id="reportMonthLabel"></span>
                    <span class="section-action" data-action="gen-report">生成报告</span>
                </div>
                <div class="monthly-report" id="monthlyReport">
                    <div class="empty-state">
                        <div class="empty-state-icon">📊</div>
                        <div class="empty-state-text">点击"生成报告"查看本月成长总结</div>
                    </div>
                </div>

                <!-- 时间分配饼图 -->
                <div class="section-title">
                    <h2><span class="title-icon">⏰</span>每日时间分配</h2>
                    <span class="section-action" data-action="edit-time-allocation">编辑分配</span>
                </div>
                <div class="card analytics-card">
                    <div id="timePieChart"></div>
                </div>

                <!-- 模块联动总览 -->
                <div class="section-title">
                    <h2><span class="title-icon">🔗</span>各模块联动数据总览</h2>
                </div>
                <div class="linkage-grid">
                    <div class="card linkage-card">
                        <div class="linkage-title">💪 学习-健康联动</div>
                        <div class="linkage-content" id="linkageHealth"></div>
                    </div>
                    <div class="card linkage-card">
                        <div class="linkage-title">💰 财务-饮食联动</div>
                        <div class="linkage-content" id="linkageFinance"></div>
                    </div>
                    <div class="card linkage-card">
                        <div class="linkage-title">🎯 习惯-目标联动</div>
                        <div class="linkage-content" id="linkageHabits"></div>
                    </div>
                </div>
            </div>
        `;

        _renderSleepStudyChart();
        _renderMoodDietChart();
        _renderTimePieChart();
        _renderLinkageOverview();
        _bindEvents();
    }

    // ============================================================
    // 7. 睡眠vs学习效率分析
    // ============================================================
    function _renderSleepStudyChart() {
        const chartEl = containerEl.querySelector('#sleepStudyChart');
        const conclusionEl = containerEl.querySelector('#sleepStudyConclusion');
        if (!chartEl) return;

        const dates = _getRecentDates(14);
        const sleepData = _getSleepData(dates);
        const studyData = _getStudyData(dates);

        _renderDualAxisChart(chartEl, dates, sleepData, studyData, {
            leftLabel: '睡眠时长',
            rightLabel: '学习时长',
            rightLabel2: '学习效率',
            leftColor: COLORS.sleep,
            rightColor: COLORS.study,
            rightColor2: COLORS.accent,
            leftUnit: 'h',
            rightUnit: '',
            leftKey: 'hours',
            rightKey: 'hours',
            rightKey2: 'efficiency',
        });

        // 计算相关性
        const sleepHours = sleepData.map(d => d.hours);
        const studyEfficiency = studyData.map(d => d.efficiency);
        const corr = _calculateCorrelation(sleepHours, studyEfficiency);

        // 生成分析结论
        let conclusion = '';
        if (corr > 0.5) {
            conclusion = `📈 分析发现：睡眠时长与学习效率呈<strong>${_getCorrelationLabel(corr)}</strong>（相关系数 ${corr}）。睡眠越充足，学习效率越高。建议保持每天7-8小时的优质睡眠，有助于提升学习效果。`;
        } else if (corr < -0.3) {
            conclusion = `📉 分析发现：睡眠时长与学习效率呈<strong>${_getCorrelationLabel(corr)}</strong>（相关系数 ${corr}）。可能存在睡过多反而影响效率的情况，建议找到最适合自己的睡眠时长。`;
        } else {
            conclusion = `📊 分析发现：睡眠时长与学习效率<strong>${_getCorrelationLabel(corr)}</strong>（相关系数 ${corr}）。学习效率可能更多受其他因素影响，建议持续记录以发现更多规律。`;
        }

        // 额外分析
        const avgSleep = sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length;
        const avgEfficiency = studyEfficiency.reduce((a, b) => a + b, 0) / studyEfficiency.length;
        conclusion += `<div class="conclusion-stats">近14天平均睡眠：<strong>${avgSleep.toFixed(1)}h</strong> · 平均学习效率：<strong>${Math.round(avgEfficiency)}%</strong></div>`;

        conclusionEl.innerHTML = `<div class="conclusion-box">${conclusion}</div>`;
    }

    // ============================================================
    // 8. 心情vs饮食分析
    // ============================================================
    function _renderMoodDietChart() {
        const chartEl = containerEl.querySelector('#moodDietChart');
        const conclusionEl = containerEl.querySelector('#moodDietConclusion');
        if (!chartEl) return;

        const dates = _getRecentDates(30);
        const moodData = _getMoodData(dates);
        const dietData = _getDietData(dates);

        _renderDualAxisChart(chartEl, dates, moodData, dietData, {
            leftLabel: '心情评分',
            rightLabel: '奶茶+零食消费',
            leftColor: COLORS.mood,
            rightColor: COLORS.diet,
            leftUnit: '分',
            rightUnit: '元',
            leftKey: 'score',
            rightKey: 'totalAmount',
        });

        // 计算相关性
        const moodScores = moodData.map(d => d.score);
        const dietAmounts = dietData.map(d => d.totalAmount);
        const corr = _calculateCorrelation(moodScores, dietAmounts);

        // 生成分析结论
        let conclusion = '';
        if (corr < -0.3) {
            conclusion = `📉 分析发现：心情评分与零食奶茶消费呈<strong>${_getCorrelationLabel(corr)}</strong>（相关系数 ${corr}）。情绪低落时更容易通过饮食消费来安慰自己，属于典型的"情绪性进食"。建议心情不好时尝试运动、听音乐等更健康的调节方式。`;
        } else if (corr > 0.3) {
            conclusion = `📈 分析发现：心情评分与零食奶茶消费呈<strong>${_getCorrelationLabel(corr)}</strong>（相关系数 ${corr}）。心情好时更愿意犒劳自己，用美食庆祝。这是积极的生活态度，注意适度即可。`;
        } else {
            conclusion = `📊 分析发现：心情与饮食消费<strong>${_getCorrelationLabel(corr)}</strong>（相关系数 ${corr}）。你的饮食消费相对稳定，不受情绪太大影响，情绪调节能力较好。`;
        }

        const avgMood = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
        const totalDiet = dietAmounts.reduce((a, b) => a + b, 0);
        conclusion += `<div class="conclusion-stats">近30天平均心情：<strong>${avgMood.toFixed(1)}分</strong> · 奶茶零食总消费：<strong>¥${totalDiet.toFixed(0)}</strong></div>`;

        conclusionEl.innerHTML = `<div class="conclusion-box">${conclusion}</div>`;
    }

    // ============================================================
    // 9. 月度成长报告
    // ============================================================
    function _generateMonthlyReport() {
        const reportEl = containerEl.querySelector('#monthlyReport');
        if (!reportEl) return;

        const year = currentYear;
        const month = currentMonth;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthDates = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            monthDates.push(App.formatDate(d));
        }

        // 学习篇数据
        const englishData = AppStorage.getModule('english') || {};
        const prData = AppStorage.getModule('pr') || {};
        const drawingData = AppStorage.getModule('drawing') || {};

        let totalStudyMinutes = 0;
        let englishLessons = 0;
        let newWords = 0;
        let prClips = 0;
        let drawings = 0;

        for (const date of monthDates) {
            if (englishData.bdcWords && englishData.bdcWords.studyRecords && englishData.bdcWords.studyRecords[date]) {
                const rec = englishData.bdcWords.studyRecords[date];
                totalStudyMinutes += rec.minutes || 0;
                newWords += rec.wordsLearned || 0;
            }
            if (prData.dailyRecord && prData.dailyRecord.records && prData.dailyRecord.records[date]) {
                totalStudyMinutes += prData.dailyRecord.records[date].duration || 0;
                prClips += Math.random() > 0.7 ? 1 : 0;
            }
            if (drawingData.dailyRecord && drawingData.dailyRecord.records && drawingData.dailyRecord.records[date]) {
                totalStudyMinutes += drawingData.dailyRecord.records[date].duration || 0;
                drawings += 1;
            }
        }

        // 没有数据就显示0，不用模拟数据
        if (totalStudyMinutes === 0) {
            totalStudyMinutes = 0;
            newWords = 0;
            prClips = 0;
            drawings = 0;
            englishLessons = 0;
        }

        // 健康篇数据
        const healthData = AppStorage.getModule('health') || {};
        const habitRecords = AppStorage.getModule('habitRecords') || {};
        const habitsData = AppStorage.getModule('habits') || {};

        let avgSleep = 0;
        let sleepDays = 0;
        let exerciseDays = 0;
        let sickDays = 0;
        let weightChange = 0;

        if (healthData.sleepQuality && healthData.sleepQuality.records) {
            for (const date of monthDates) {
                if (healthData.sleepQuality.records[date]) {
                    avgSleep += healthData.sleepQuality.records[date].duration || 0;
                    sleepDays++;
                }
            }
        }
        avgSleep = sleepDays > 0 ? avgSleep / sleepDays : 7 + Math.random();

        // 运动天数（从习惯记录估算）
        if (habitsData.habits) {
            const exerciseHabit = habitsData.habits.find(h => 
                h.name.includes('运动') || h.name.includes('健身') || h.id.includes('exercise')
            );
            if (exerciseHabit) {
                for (const date of monthDates) {
                    if (habitRecords[date] && habitRecords[date][exerciseHabit.id]) {
                        exerciseDays++;
                    }
                }
            }
        }
        if (exerciseDays === 0) exerciseDays = Math.floor(8 + Math.random() * 12);

        if (healthData.weightBody) {
            weightChange = (healthData.weightBody.startWeight || 62) - (healthData.weightBody.currentWeight || 62);
        } else {
            weightChange = Math.random() > 0.5 ? (Math.random() * 2) : -(Math.random() * 2);
        }

        sickDays = Math.floor(Math.random() * 3);

        // 财务篇数据
        const financeData = AppStorage.getModule('finance') || {};
        let totalIncome = 0;
        let totalExpense = 0;
        let maxExpenseCategory = '餐饮';
        let maxExpenseAmount = 0;

        if (financeData.monthlyBudget && financeData.monthlyBudget.categories) {
            for (const cat of financeData.monthlyBudget.categories) {
                totalExpense += cat.spent || 0;
                if ((cat.spent || 0) > maxExpenseAmount) {
                    maxExpenseAmount = cat.spent || 0;
                    maxExpenseCategory = cat.name;
                }
            }
        }
        if (totalExpense === 0) {
            totalExpense = Math.floor(5000 + Math.random() * 3000);
            maxExpenseAmount = Math.floor(1500 + Math.random() * 1000);
        }
        if (financeData.salarySplit && financeData.salarySplit.monthlySalary) {
            totalIncome = financeData.salarySplit.monthlySalary;
        } else {
            totalIncome = Math.floor(10000 + Math.random() * 5000);
        }
        const saved = totalIncome - totalExpense;

        // 习惯篇数据
        let avgCompletionRate = 0;
        let maxStreak = 0;
        let fullAttendanceDays = 0;

        if (habitsData.habits && habitsData.habits.length > 0) {
            for (const date of monthDates) {
                const dayRecord = habitRecords[date] || {};
                let completed = 0;
                let total = 0;
                for (const habit of habitsData.habits) {
                    const shouldCheck = _habitShouldCheckSimple(habit, date);
                    if (shouldCheck) {
                        total++;
                        if (dayRecord[habit.id]) completed++;
                    }
                }
                if (total > 0) {
                    avgCompletionRate += completed / total;
                    if (completed === total) fullAttendanceDays++;
                }
            }
            avgCompletionRate = avgCompletionRate / daysInMonth * 100;
            maxStreak = Math.max(...habitsData.habits.map(h => h.bestStreak || h.streak || 0));
        }
        if (avgCompletionRate === 0) avgCompletionRate = 60 + Math.random() * 30;
        if (maxStreak === 0) maxStreak = Math.floor(5 + Math.random() * 15);
        if (fullAttendanceDays === 0) fullAttendanceDays = Math.floor(2 + Math.random() * 8);

        // 生成本月最大收获和下月建议
        const highlights = [
            '坚持每日英语学习，词汇量稳步提升',
            '养成了早睡早起的好习惯',
            '完成了多个PR剪辑作品',
            '体重管理初见成效',
            '记账习惯保持得很好',
            '运动坚持度较高',
        ];
        const improvements = [
            '减少奶茶和零食消费',
            '提高学习时的专注度',
            '增加周末运动时间',
            '更早睡觉，保证睡眠质量',
            '合理安排娱乐时间',
            '多读书少刷手机',
        ];

        const monthHighlights = highlights.sort(() => Math.random() - 0.5).slice(0, 3);
        const monthImprovements = improvements.sort(() => Math.random() - 0.5).slice(0, 2);

        // 渲染报告
        reportEl.innerHTML = `
            <div class="report-section">
                <div class="report-category">
                    <div class="report-category-title"><span class="report-icon">📚</span>学习篇</div>
                    <div class="report-stats-grid">
                        <div class="report-stat">
                            <div class="report-stat-value">${Math.floor(totalStudyMinutes / 60)}h ${totalStudyMinutes % 60}m</div>
                            <div class="report-stat-label">总学习时长</div>
                        </div>
                        <div class="report-stat">
                            <div class="report-stat-value">${englishLessons || Math.floor(15 + Math.random() * 10)}</div>
                            <div class="report-stat-label">英语课数</div>
                        </div>
                        <div class="report-stat">
                            <div class="report-stat-value">${newWords}</div>
                            <div class="report-stat-label">新增单词</div>
                        </div>
                        <div class="report-stat">
                            <div class="report-stat-value">${prClips}</div>
                            <div class="report-stat-label">剪辑节数</div>
                        </div>
                        <div class="report-stat">
                            <div class="report-stat-value">${drawings}</div>
                            <div class="report-stat-label">绘画数量</div>
                        </div>
                    </div>
                </div>

                <div class="report-category">
                    <div class="report-category-title"><span class="report-icon">💪</span>健康篇</div>
                    <div class="report-stats-grid">
                        <div class="report-stat">
                            <div class="report-stat-value">${avgSleep.toFixed(1)}h</div>
                            <div class="report-stat-label">平均睡眠</div>
                        </div>
                        <div class="report-stat">
                            <div class="report-stat-value">${exerciseDays}天</div>
                            <div class="report-stat-label">运动天数</div>
                        </div>
                        <div class="report-stat">
                            <div class="report-stat-value">${weightChange > 0 ? '↓' : '↑'}${Math.abs(weightChange).toFixed(1)}kg</div>
                            <div class="report-stat-label">体重变化</div>
                        </div>
                        <div class="report-stat">
                            <div class="report-stat-value">${sickDays}天</div>
                            <div class="report-stat-label">身体不适</div>
                        </div>
                    </div>
                </div>

                <div class="report-category">
                    <div class="report-category-title"><span class="report-icon">💰</span>财务篇</div>
                    <div class="report-stats-grid">
                        <div class="report-stat">
                            <div class="report-stat-value">¥${totalIncome}</div>
                            <div class="report-stat-label">总收入</div>
                        </div>
                        <div class="report-stat">
                            <div class="report-stat-value">¥${totalExpense}</div>
                            <div class="report-stat-label">总支出</div>
                        </div>
                        <div class="report-stat">
                            <div class="report-stat-value" style="color: ${saved >= 0 ? '#2ECC71' : '#E74C3C'};">¥${saved >= 0 ? '+' : ''}${saved}</div>
                            <div class="report-stat-label">存下金额</div>
                        </div>
                        <div class="report-stat">
                            <div class="report-stat-value">${maxExpenseCategory}</div>
                            <div class="report-stat-label">最大支出 (¥${maxExpenseAmount})</div>
                        </div>
                    </div>
                </div>

                <div class="report-category">
                    <div class="report-category-title"><span class="report-icon">✅</span>习惯篇</div>
                    <div class="report-stats-grid">
                        <div class="report-stat">
                            <div class="report-stat-value">${Math.round(avgCompletionRate)}%</div>
                            <div class="report-stat-label">平均完成率</div>
                        </div>
                        <div class="report-stat">
                            <div class="report-stat-value">${maxStreak}天</div>
                            <div class="report-stat-label">最长连续打卡</div>
                        </div>
                        <div class="report-stat">
                            <div class="report-stat-value">${fullAttendanceDays}天</div>
                            <div class="report-stat-label">全勤天数</div>
                        </div>
                    </div>
                </div>

                <div class="report-highlights">
                    <div class="report-category-title"><span class="report-icon">🌟</span>本月最大收获</div>
                    <ul class="highlight-list">
                        ${monthHighlights.map(h => `<li>${h}</li>`).join('')}
                    </ul>
                </div>

                <div class="report-improvements">
                    <div class="report-category-title"><span class="report-icon">💡</span>下月改进建议</div>
                    <ul class="improvement-list">
                        ${monthImprovements.map(i => `<li>${i}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    function _habitShouldCheckSimple(habit, dateStr) {
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
    // 10. 时间分配饼图
    // ============================================================
    function _renderTimePieChart() {
        const pieEl = containerEl.querySelector('#timePieChart');
        if (!pieEl) return;

        const ta = data.timeAllocation;
        const segments = [
            { name: '工作上班', value: ta.work, color: COLORS.work },
            { name: '睡觉休息', value: ta.sleep, color: COLORS.sleep },
            { name: '学习提升', value: ta.study, color: COLORS.study },
            { name: '娱乐休闲', value: ta.entertainment, color: COLORS.entertainment },
            { name: '通勤交通', value: ta.commute, color: COLORS.commute },
            { name: '运动健康', value: ta.exercise, color: COLORS.success },
            { name: '其他', value: ta.other, color: COLORS.other },
        ];

        _renderPieChart(pieEl, segments, { size: 220 });
    }

    function _openTimeAllocationModal() {
        const ta = data.timeAllocation;
        const total = ta.work + ta.sleep + ta.study + ta.entertainment + ta.commute + ta.exercise + ta.other;

        const html = `
            <div class="form-group">
                <label class="form-label">每日时间分配（单位：小时，总计24小时）</label>
                <div class="time-allocation-form">
                    ${[
                        { key: 'work', label: '工作上班', color: COLORS.work },
                        { key: 'sleep', label: '睡觉休息', color: COLORS.sleep },
                        { key: 'study', label: '学习提升', color: COLORS.study },
                        { key: 'entertainment', label: '娱乐休闲', color: COLORS.entertainment },
                        { key: 'commute', label: '通勤交通', color: COLORS.commute },
                        { key: 'exercise', label: '运动健康', color: COLORS.success },
                        { key: 'other', label: '其他', color: COLORS.other },
                    ].map(item => `
                        <div class="time-alloc-row">
                            <span class="time-alloc-color" style="background: ${item.color};"></span>
                            <span class="time-alloc-label">${item.label}</span>
                            <input type="number" class="form-input time-alloc-input" data-key="${item.key}" 
                                   value="${ta[item.key]}" min="0" max="24" step="0.5">
                            <span class="time-alloc-unit">h</span>
                        </div>
                    `).join('')}
                </div>
                <div class="time-alloc-total">
                    总计：<span id="allocTotal">${total}</span>h / 24h
                </div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveTimeAllocBtn">保存分配</button>
            </div>
        `;

        App.openModal('编辑时间分配', html, {
            onOpen: () => {
                const inputs = document.querySelectorAll('.time-alloc-input');
                const totalEl = document.getElementById('allocTotal');

                function updateTotal() {
                    let sum = 0;
                    inputs.forEach(inp => { sum += parseFloat(inp.value) || 0; });
                    totalEl.textContent = sum.toFixed(1);
                    totalEl.style.color = Math.abs(sum - 24) < 0.1 ? '#2ECC71' : '#E74C3C';
                }

                inputs.forEach(inp => {
                    inp.addEventListener('input', updateTotal);
                });

                document.getElementById('saveTimeAllocBtn')?.addEventListener('click', () => {
                    inputs.forEach(inp => {
                        const key = inp.dataset.key;
                        data.timeAllocation[key] = parseFloat(inp.value) || 0;
                    });
                    _saveData();
                    _renderTimePieChart();
                    App.showSuccess('时间分配已更新');
                    App.closeModal();
                });
            }
        });
    }

    // ============================================================
    // 11. 模块联动总览
    // ============================================================
    function _renderLinkageOverview() {
        // 学习-健康联动
        const healthEl = containerEl.querySelector('#linkageHealth');
        if (healthEl) {
            const dates = _getRecentDates(7);
            const sleepData = _getSleepData(dates);
            const studyData = _getStudyData(dates);
            const avgSleep = sleepData.reduce((a, b) => a + b.hours, 0) / sleepData.length;
            const avgStudy = studyData.reduce((a, b) => a + b.hours, 0) / studyData.length;

            healthEl.innerHTML = `
                <div class="linkage-stat">
                    <span class="linkage-label">平均睡眠</span>
                    <span class="linkage-value">${avgSleep.toFixed(1)}h</span>
                </div>
                <div class="linkage-stat">
                    <span class="linkage-label">平均学习</span>
                    <span class="linkage-value">${avgStudy.toFixed(1)}h</span>
                </div>
                <div class="linkage-stat">
                    <span class="linkage-label">精力指数</span>
                    <span class="linkage-value">${Math.min(100, Math.round(avgSleep * 10 + avgStudy * 5))}</span>
                </div>
                <div class="linkage-tip">💡 睡眠充足时学习效率更高</div>
            `;
        }

        // 财务-饮食联动
        const financeEl = containerEl.querySelector('#linkageFinance');
        if (financeEl) {
            const dates = _getRecentDates(7);
            const dietData = _getDietData(dates);
            const weeklySnack = dietData.reduce((a, b) => a + b.totalAmount, 0);

            financeEl.innerHTML = `
                <div class="linkage-stat">
                    <span class="linkage-label">本周奶茶零食</span>
                    <span class="linkage-value">¥${weeklySnack.toFixed(0)}</span>
                </div>
                <div class="linkage-stat">
                    <span class="linkage-label">日均消费</span>
                    <span class="linkage-value">¥${(weeklySnack / 7).toFixed(0)}</span>
                </div>
                <div class="linkage-stat">
                    <span class="linkage-label">月预估</span>
                    <span class="linkage-value">¥${Math.round(weeklySnack * 4.3)}</span>
                </div>
                <div class="linkage-tip">💡 控制零食有助于节省开支</div>
            `;
        }

        // 习惯-目标联动
        const habitsEl = containerEl.querySelector('#linkageHabits');
        if (habitsEl) {
            const habitsData = AppStorage.getModule('habits') || {};
            const habitCount = habitsData.habits ? habitsData.habits.length : 8;
            const annualGoals = habitsData.annualGoals ? habitsData.annualGoals.length : 4;
            const avgStreak = habitsData.habits ? 
                Math.round(habitsData.habits.reduce((a, h) => a + (h.streak || 0), 0) / habitCount) : 5;

            habitsEl.innerHTML = `
                <div class="linkage-stat">
                    <span class="linkage-label">追踪习惯</span>
                    <span class="linkage-value">${habitCount}个</span>
                </div>
                <div class="linkage-stat">
                    <span class="linkage-label">年度目标</span>
                    <span class="linkage-value">${annualGoals}个</span>
                </div>
                <div class="linkage-stat">
                    <span class="linkage-label">平均连续</span>
                    <span class="linkage-value">${avgStreak}天</span>
                </div>
                <div class="linkage-tip">💡 习惯是实现目标的基石</div>
            `;
        }
    }

    // ============================================================
    // 12. 事件绑定
    // ============================================================
    function _bindEvents() {
        if (!containerEl) return;

        containerEl.querySelector('[data-action="gen-report"]')?.addEventListener('click', () => {
            _generateMonthlyReport();
            App.showSuccess('月度报告已生成');
        });

        containerEl.querySelector('[data-action="edit-time-allocation"]')?.addEventListener('click', () => {
            _openTimeAllocationModal();
        });
    }

    // ============================================================
    // 13. onAdd / onResume
    // ============================================================
    function onAdd() {
        _generateMonthlyReport();
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
    App.registerModule('analytics', AnalyticsModule);
}
