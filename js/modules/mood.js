/**
 * mood.js - 情绪随笔日记模块
 * 功能分区：
 *   1. 今日情绪记录（情绪标签、心情评分、随笔、感恩列表、天气）
 *   2. 历史情绪记录（时间线展示，按日期筛选）
 *   3. 情绪统计（本月情绪分布饼图、情绪趋势折线图）
 */

const MoodModule = (function() {
    'use strict';

    // ============================================================
    // 1. 数据结构与默认值
    // ============================================================
    const STORAGE_KEY = 'mood';

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

    // 预设情绪标签（可多选）
    const MOOD_TAGS = [
        { id: 'tired', label: '疲惫', icon: '😫', color: '#95A5A6' },
        { id: 'anxious', label: '焦虑', icon: '😰', color: '#A29BFE' },
        { id: 'calm', label: '平静', icon: '😌', color: '#4ECDC4' },
        { id: 'motivated', label: '动力充足', icon: '💪', color: '#FFD93D' },
        { id: 'low', label: '低落', icon: '😔', color: '#74B9FF' },
        { id: 'happy', label: '开心', icon: '😊', color: '#FD79A8' },
        { id: 'angry', label: '生气', icon: '😠', color: '#E17055' },
        { id: 'relaxed', label: '放松', icon: '😎', color: '#74B9FF' },
        { id: 'stressed', label: '压力大', icon: '😤', color: '#E74C3C' },
        { id: 'grateful', label: '感恩', icon: '🥰', color: '#FD79A8' },
        { id: 'lonely', label: '孤独', icon: '😔', color: '#B2BEC3' },
        { id: 'excited', label: '兴奋', icon: '🤩', color: '#FF6B6B' },
    ];

    // 天气选项
    const WEATHER_OPTIONS = [
        { id: 'sunny', label: '晴', icon: '☀️' },
        { id: 'cloudy', label: '多云', icon: '⛅' },
        { id: 'rainy', label: '雨', icon: '🌧️' },
        { id: 'snowy', label: '雪', icon: '❄️' },
        { id: 'windy', label: '风', icon: '💨' },
        { id: 'foggy', label: '雾', icon: '🌫️' },
        { id: 'thunder', label: '雷', icon: '⛈️' },
    ];

    // ============================================================
    // AI 日记模板池
    // ============================================================

    // 心情总结模板
    const MOOD_SUMMARY_TEMPLATES = [
        '过去一周，你的平均心情评分为{avgScore}分，整体呈现{trend}态势。{bestDayText}{worstDayText}看来这段时间你的情绪{overallFeeling}。',
        '回顾这七天，你的心情在{minScore}到{maxScore}分之间波动，平均为{avgScore}分。{trendDesc}高频出现的情绪标签是{topMood}，这说明你最近{topMoodInterpretation}。',
        '一周的情绪画卷徐徐展开：你记录了{recordedDays}天心情，平均分{avgScore}。{streakText}{trendAnalysis}总的来说，你正处在一个{overallState}的阶段。',
        '从数据来看，这周你的心情指数平均为{avgScore}分。{peakDesc}{valleyDesc}{trendDesc}继续保持觉察，情绪的流动本身就是一种成长。',
    ];

    // 模式发现模板
    const PATTERN_TEMPLATES = [
        '仔细观察你的记录，我发现了一些有趣的模式。{tagPattern}{weatherPattern}{timePattern}这些反复出现的元素，或许正反映着你当下的生活节奏。',
        '数据不会说谎。在过去一周里，{frequentActivity}{contentPattern}{gratitudePattern}生活就是由这些重复的小事构成的，而它们也在悄悄塑造着你。',
        '你的生活中有一些恒定的"锚点"：{anchorPatterns}。它们像节拍器一样，为你的日子提供着稳定的节奏感。{patternInsight}',
    ];

    // 洞察与建议模板
    const INSIGHT_TEMPLATES = [
        '基于这一周的数据，我有一些观察想和你分享：{insight1}{insight2}{insight3}当然，这些只是数据层面的解读，真正的答案还在你心里。',
        '如果说数据是一面镜子，那么它映照出的你是这样的：{mirrorDesc}{suggestion1}{suggestion2}{suggestion3}试试看，说不定会有新的发现。',
        '从情绪和行为的关联中，我看到了一些可能性：{connectionDesc}{actionSuggestion}{selfCareTip}记住，照顾好自己永远是第一位的。',
    ];

    // 思考问题模板
    const THINKING_QUESTIONS = [
        // 个人成长类
        '如果用一个词来定义你想要成为的人，那会是什么？你现在做的事情在朝着那个方向前进吗？',
        '五年后的你，会感谢今天的自己做了什么？又会遗憾今天没有做什么？',
        '你最近一次感到"心流"状态是在做什么？怎样才能让那种状态更频繁地出现？',
        '如果把你的人生比作一个产品，你现在处于哪个版本？下一个版本你想迭代什么功能？',
        // 开发/技术类
        '如果让你从零开始做一个解决自己痛点的小工具，你会做什么？它的核心功能是什么？',
        '你最近学的新技术，如果要教给一个完全不懂的人，你会怎么用三句话讲清楚它的价值？',
        '在你日常的工作流中，哪个环节最让你觉得低效？有没有想过用代码来自动化它？',
        '如果给你一周时间做一个副业项目，你会选择什么方向？为什么是这个方向？',
        // 创意类
        '如果今天只能用三种颜色来表达你的心情，你会选哪三种？它们会以什么形态呈现？',
        '假设你要为自己的2025年设计一个主题曲，它会是什么风格的？歌词的第一句是什么？',
        '如果你的生活是一本书，这一周的章节标题会是什么？下一章你想写什么？',
        '给你一个空白画布和一小时，你最想画/创造什么？哪怕它"没有用"？',
        // 生活方式类
        '你理想中的"完美一天"是什么样的？从醒来到入睡，每个小时你在做什么？',
        '如果要从生活中去掉一件事来腾出更多时间，你会选择去掉什么？为什么还没有去掉？',
        '你最近一次真正"什么都不做"是什么时候？那种感觉怎么样？',
        '什么样的小事会让你一天都觉得开心？你有没有主动为自己创造这些小事？',
    ];

    // 灵感问题库（AI分析页面用）
    const INSPIRATION_QUESTIONS = [
        { category: '产品思考', question: '如果你现在的App只能保留3个功能，你会留哪3个？为什么？' },
        { category: '产品思考', question: '你的用户最痛的那个点是什么？你真的理解了吗？' },
        { category: '产品思考', question: '如果这个产品是为你自己一个人做的，哪些功能会被你立刻砍掉？' },
        { category: '技术学习', question: '最近学的技术里，哪个概念让你有"哇原来是这样"的感觉？' },
        { category: '技术学习', question: '如果要给初学者写一份你现在正在学的技术的入门指南，第一章你会写什么？' },
        { category: '技术学习', question: '有什么技术是你一直想学但总说"没时间"的？如果每天只学15分钟，会怎么样？' },
        { category: '生活方式', question: '你的"能量来源"是什么？做什么事会让你忘记时间的流逝？' },
        { category: '生活方式', question: '如果今天不用工作/学习，你会怎么度过这一天？' },
        { category: '生活方式', question: '你最近一次发自内心地笑是什么时候？因为什么？' },
        { category: '创意点子', question: '如果给你100块钱启动资金，你能想到什么在一周内赚到1000块的方法？' },
        { category: '创意点子', question: '有没有什么事是你觉得"肯定有人做过了"但其实你可以做得更好的？' },
        { category: '创意点子', question: '如果把两个完全不相关的东西结合起来，你会选哪两个？会产生什么新东西？' },
        { category: '自我反思', question: '过去三个月，你最大的变化是什么？是变好还是变坏？' },
        { category: '自我反思', question: '你有没有一直在逃避的事情？如果今天必须面对它，第一步是什么？' },
        { category: '自我反思', question: '你对自己最满意的一点是什么？最想改进的一点又是什么？' },
    ];

    // ============================================================
    // 2. 状态管理
    // ============================================================
    let data = null;
    let containerEl = null;
    let historyFilterDate = null; // 历史筛选日期（月份）
    let currentDate = null;
    let calendarMonth = null;
    let calendarYear = null;
    let showCalendar = false;
    let currentAiDiaryDate = null; // 当前查看的AI日记日期
    let aiAnalysisCurrentInspiration = null; // 当前显示的灵感问题

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
        if (stored && stored.entries) {
            data = stored;
        } else {
            data = {
                entries: {},
                customTags: ['工作', '学习', '感情', '家庭', '朋友', '健康', '金钱', '天气', '运动', '美食', '旅行', '追剧'],
                stats: {
                    totalEntries: 0,
                    streak: 0,
                    avgMoodScore: 0,
                    mostCommonMood: '',
                },
                aiDiary: {
                    enabled: true,
                    generateTime: '04:00',
                    entries: {},
                },
                aiAnalysis: {
                    lastGenerated: null,
                    cache: {},
                },
            };
            AppStorage.setModule(STORAGE_KEY, data);
        }

        // 确保AI数据结构存在（兼容旧数据）
        if (!data.aiDiary) {
            data.aiDiary = {
                enabled: true,
                generateTime: '04:00',
                entries: {},
            };
        }
        if (!data.aiDiary.entries) data.aiDiary.entries = {};
        if (!data.aiAnalysis) {
            data.aiAnalysis = {
                lastGenerated: null,
                cache: {},
            };
        }
        if (!data.aiAnalysis.cache) data.aiAnalysis.cache = {};

        _updateStats();

        const now = new Date();
        currentDate = _today();
        calendarMonth = now.getMonth();
        calendarYear = now.getFullYear();
        currentAiDiaryDate = _today();

        // 检查是否需要生成今日AI日记
        _checkAndGenerateAiDiary();
    }

    /**
     * 保存数据
     */
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
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return `${month}月${day}日 ${weekDays[d.getDay()]}`;
    }

    function _getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function _getEntry(dateStr) {
        return data && data.entries[dateStr] ? data.entries[dateStr] : null;
    }

    function _getMoodCalendarScoreColor(score) {
        if (score >= 7) return '#4ECDC4';
        if (score >= 4) return '#FDCB6E';
        return '#E74C3C';
    }

    function _renderMoodCalendar() {
        const year = calendarYear;
        const month = calendarMonth;
        const daysInMonth = _getDaysInMonth(year, month);
        const firstDay = new Date(year, month, 1).getDay();
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        const today = _today();

        let daysHtml = '';

        // 前面的空白
        for (let i = 0; i < firstDay; i++) {
            daysHtml += `<div class="cal-day cal-day-empty"></div>`;
        }

        // 日期
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const dateStr = App.formatDate(dateObj);
            const entry = _getEntry(dateStr);
            const isToday = dateStr === today;
            const isSelected = dateStr === currentDate;

            let classes = 'cal-day';
            if (entry) classes += ' has-content';
            if (isToday) classes += ' is-today';
            if (isSelected) classes += ' is-selected';

            const dotColor = entry ? _getMoodCalendarScoreColor(entry.score || 5) : '';

            daysHtml += `
                <div class="${classes}" data-action="mood-cal-day" data-date="${dateStr}">
                    <span class="cal-day-number">${day}</span>
                    ${entry ? `<span class="cal-day-dot" style="background: ${dotColor};"></span>` : ''}
                </div>
            `;
        }

        return `
            <div class="mood-calendar">
                <div class="cal-weekdays">
                    ${weekDays.map(w => `<div class="cal-weekday">${w}</div>`).join('')}
                </div>
                <div class="cal-days">
                    ${daysHtml}
                </div>
            </div>
        `;
    }

    function _formatDate(dateStr) {
        const d = new Date(dateStr);
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return `${month}月${day}日 ${weekDays[d.getDay()]}`;
    }

    function _getMonthDates(year, month) {
        const dates = [];
        const lastDay = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= lastDay; i++) {
            const d = new Date(year, month, i);
            dates.push(App.formatDate(d));
        }
        return dates;
    }

    function _getMoodTagById(id) {
        return MOOD_TAGS.find(t => t.id === id);
    }

    function _getWeatherById(id) {
        return WEATHER_OPTIONS.find(w => w.id === id);
    }

    // ============================================================
    // 5.1 AI 日记生成核心逻辑
    // ============================================================

    /**
     * 检查并生成今日AI日记
     */
    function _checkAndGenerateAiDiary() {
        if (!data.aiDiary.enabled) return;

        const today = _today();
        const now = new Date();
        const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const generateTime = data.aiDiary.generateTime || '04:00';

        // 如果今天已经生成过，跳过
        if (data.aiDiary.entries[today]) return;

        // 如果还没到生成时间，跳过
        if (currentTimeStr < generateTime) return;

        // 异步生成，不阻塞页面加载
        setTimeout(() => {
            _generateAiDiaryForDate(today);
        }, 1000);
    }

    /**
     * 生成指定日期的AI日记
     */
    function _generateAiDiaryForDate(dateStr) {
        const weekData = _getRecentWeekData(dateStr);

        if (weekData.recordedDays === 0) {
            // 没有数据，生成鼓励性内容
            data.aiDiary.entries[dateStr] = {
                content: _generateEmptyAiDiary(),
                generatedAt: Date.now(),
                moodSummary: {
                    avgScore: 0,
                    recordedDays: 0,
                    trend: 'neutral',
                },
            };
            _saveData();
            return;
        }

        const moodSummary = _generateMoodSummaryParagraph(weekData);
        const patternDiscovery = _generatePatternParagraph(weekData);
        const insightAdvice = _generateInsightParagraph(weekData);
        const thinkingQuestion = _generateThinkingQuestion(weekData);

        const fullContent = {
            moodSummary,
            patternDiscovery,
            insightAdvice,
            thinkingQuestion,
        };

        data.aiDiary.entries[dateStr] = {
            content: fullContent,
            generatedAt: Date.now(),
            moodSummary: {
                avgScore: weekData.avgScore,
                recordedDays: weekData.recordedDays,
                trend: weekData.trend,
            },
        };

        _saveData();
    }

    /**
     * 获取最近一周的数据
     */
    function _getRecentWeekData(endDateStr) {
        const entries = data.entries;
        const weekEntries = [];
        const endDate = new Date(endDateStr);

        for (let i = 6; i >= 0; i--) {
            const d = new Date(endDate);
            d.setDate(endDate.getDate() - i);
            const dateStr = App.formatDate(d);
            if (entries[dateStr]) {
                weekEntries.push({
                    date: dateStr,
                    ...entries[dateStr],
                });
            }
        }

        const recordedDays = weekEntries.length;
        let avgScore = 0;
        let minScore = 10;
        let maxScore = 0;
        const moodCount = {};
        let totalContentLength = 0;
        let gratitudeCount = 0;
        const weatherCount = {};

        for (const entry of weekEntries) {
            const score = entry.score || 0;
            avgScore += score;
            if (score < minScore) minScore = score;
            if (score > maxScore) maxScore = score;

            const moods = entry.moods || [];
            for (const m of moods) {
                moodCount[m] = (moodCount[m] || 0) + 1;
            }

            if (entry.content) totalContentLength += entry.content.length;
            if (entry.gratitude) gratitudeCount += entry.gratitude.length;
            if (entry.weather) {
                weatherCount[entry.weather] = (weatherCount[entry.weather] || 0) + 1;
            }
        }

        avgScore = recordedDays > 0 ? Math.round((avgScore / recordedDays) * 10) / 10 : 0;

        // 计算趋势
        let trend = 'stable';
        if (weekEntries.length >= 3) {
            const firstHalf = weekEntries.slice(0, Math.floor(weekEntries.length / 2));
            const secondHalf = weekEntries.slice(Math.floor(weekEntries.length / 2));
            const firstAvg = firstHalf.reduce((s, e) => s + (e.score || 0), 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((s, e) => s + (e.score || 0), 0) / secondHalf.length;
            if (secondAvg - firstAvg > 0.8) trend = 'rising';
            else if (firstAvg - secondAvg > 0.8) trend = 'falling';
        }

        // 找出最高频情绪
        let topMood = null;
        let topMoodCount = 0;
        for (const m in moodCount) {
            if (moodCount[m] > topMoodCount) {
                topMoodCount = moodCount[m];
                topMood = m;
            }
        }

        // 找出最高频天气
        let topWeather = null;
        let topWeatherCount = 0;
        for (const w in weatherCount) {
            if (weatherCount[w] > topWeatherCount) {
                topWeatherCount = weatherCount[w];
                topWeather = w;
            }
        }

        // 找出最好和最差的一天
        let bestDay = null;
        let worstDay = null;
        for (const entry of weekEntries) {
            if (!bestDay || entry.score > bestDay.score) bestDay = entry;
            if (!worstDay || entry.score < worstDay.score) worstDay = entry;
        }

        return {
            recordedDays,
            avgScore,
            minScore: recordedDays > 0 ? minScore : 0,
            maxScore: recordedDays > 0 ? maxScore : 0,
            trend,
            moodCount,
            topMood,
            topMoodCount,
            totalContentLength,
            avgContentLength: recordedDays > 0 ? Math.round(totalContentLength / recordedDays) : 0,
            gratitudeCount,
            weatherCount,
            topWeather,
            bestDay,
            worstDay,
            entries: weekEntries,
        };
    }

    /**
     * 生成没有数据时的AI日记
     */
    function _generateEmptyAiDiary() {
        return {
            moodSummary: '这周你还没有记录心情，也许是太忙了，又或者只是忘记了。没关系，心情记录不是任务，而是和自己对话的方式。',
            patternDiscovery: '空白也是一种信号。也许最近的生活节奏很快，快到来不及停下来感受自己。又或者，你正处在一个相对平稳的时期，没有太多情绪的波动需要记录。',
            insightAdvice: '试着从明天开始，花30秒记录一下心情。不需要长篇大论，哪怕只是一个分数、一个标签，也是在和自己建立连接。你会发现，当你开始觉察，情绪就已经开始流动了。',
            thinkingQuestion: THINKING_QUESTIONS[Math.floor(Math.random() * THINKING_QUESTIONS.length)],
        };
    }

    /**
     * 从数组中随机选择一个元素
     */
    function _randomPick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * 生成心情总结段落
     */
    function _generateMoodSummaryParagraph(weekData) {
        const template = _randomPick(MOOD_SUMMARY_TEMPLATES);
        const { avgScore, minScore, maxScore, trend, recordedDays, topMood, bestDay, worstDay } = weekData;

        const trendText = {
            rising: '上升',
            falling: '下降',
            stable: '平稳',
        }[trend] || '平稳';

        const trendDesc = {
            rising: '后半周的心情明显比前半周好，有什么好事发生吗？',
            falling: '心情呈现缓慢下降的趋势，最近是不是压力有点大？',
            stable: '情绪整体比较稳定，像平静的湖面一样。',
        }[trend] || '情绪整体比较稳定。';

        const trendAnalysis = {
            rising: '从数据走势来看，你的状态正在逐步回升，这是个好兆头。',
            falling: '情绪曲线有下滑的迹象，也许是时候给自己安排一些放松时间了。',
            stable: '情绪波动不大，说明你的内心保持着不错的平衡感。',
        }[trend] || '';

        const streakText = recordedDays >= 7
            ? '连续7天都记录了心情，这份坚持本身就很了不起。'
            : `你记录了${recordedDays}天的心情，还有${7 - recordedDays}天空白。`;

        const overallFeeling = avgScore >= 8 ? '整体很不错，保持这份好心情'
            : avgScore >= 6 ? '还不错，有起有伏才是生活'
            : avgScore >= 4 ? '有些低落，但你已经在面对了'
            : '比较低迷，记得对自己好一点';

        const overallState = avgScore >= 7 ? '向上生长'
            : avgScore >= 5 ? '平稳过渡'
            : '沉淀休整';

        const topMoodTag = topMood ? _getMoodTagById(topMood) : null;
        const topMoodLabel = topMoodTag ? topMoodTag.label : '平静';
        const topMoodInterpretation = _getMoodInterpretation(topMood);

        const bestDayText = bestDay
            ? `心情最好的一天是${_formatDateShort(bestDay.date)}，达到了${bestDay.score}分。`
            : '';
        const worstDayText = worstDay && worstDay.score < avgScore
            ? `相对低落的是${_formatDateShort(worstDay.date)}，分数为${worstDay.score}分。`
            : '';

        const peakDesc = maxScore >= 8 ? `你有过心情${maxScore}分的高光时刻，那种感觉一定很棒。` : '';
        const valleyDesc = minScore <= 4 ? `也经历了${minScore}分的低谷，但你走过来了。` : '';

        return template
            .replace(/{avgScore}/g, avgScore)
            .replace(/{minScore}/g, minScore)
            .replace(/{maxScore}/g, maxScore)
            .replace(/{trend}/g, trendText)
            .replace(/{trendDesc}/g, trendDesc)
            .replace(/{trendAnalysis}/g, trendAnalysis)
            .replace(/{recordedDays}/g, recordedDays)
            .replace(/{streakText}/g, streakText)
            .replace(/{topMood}/g, topMoodLabel)
            .replace(/{topMoodInterpretation}/g, topMoodInterpretation)
            .replace(/{overallFeeling}/g, overallFeeling)
            .replace(/{overallState}/g, overallState)
            .replace(/{bestDayText}/g, bestDayText)
            .replace(/{worstDayText}/g, worstDayText)
            .replace(/{peakDesc}/g, peakDesc)
            .replace(/{valleyDesc}/g, valleyDesc);
    }

    /**
     * 获取情绪标签的解读
     */
    function _getMoodInterpretation(moodId) {
        const interpretations = {
            tired: '身体在发出信号，需要更多休息',
            anxious: '对未来有些担忧，试着把注意力拉回当下',
            calm: '内心很平和，这是很好的状态',
            motivated: '充满了干劲，趁这个势头多做些事吧',
            low: '情绪有些低沉，但低落也是一种休息',
            happy: '被快乐环绕，好好享受这份喜悦',
            angry: '有情绪在表达，听听它想说什么',
            relaxed: '身心都很放松，充电效果不错',
            stressed: '压力有点大，记得给自己松松绑',
            grateful: '有一颗感恩的心，生活会越来越美好',
            lonely: '渴望连接，主动联系一下想见的人吧',
            excited: '充满期待和热情，继续保持这份好奇',
        };
        return interpretations[moodId] || '情绪是复杂的，但你在感受它';
    }

    /**
     * 生成模式发现段落
     */
    function _generatePatternParagraph(weekData) {
        const template = _randomPick(PATTERN_TEMPLATES);
        const { moodCount, topWeather, recordedDays, gratitudeCount, avgContentLength } = weekData;

        // 构建标签模式描述
        const topMoods = Object.entries(moodCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([id, count]) => {
                const tag = _getMoodTagById(id);
                return tag ? `${tag.icon}${tag.label}(${count}次)` : '';
            })
            .filter(Boolean);

        const tagPattern = topMoods.length > 0
            ? `出现最多的情绪是${topMoods.join('、')}。`
            : '情绪标签记录较少，下次记录时可以多选几个标签。';

        const weatherTag = topWeather ? _getWeatherById(topWeather) : null;
        const weatherPattern = weatherTag
            ? `这周${weatherTag.icon}${weatherTag.label}天比较多，天气似乎也在影响着你的心情。`
            : '';

        const timePattern = recordedDays >= 5
            ? '你保持着相当不错的记录频率，说明你很在意自己的情绪状态。'
            : '记录频率不太稳定，有时连续记录，有时间隔几天。';

        const frequentActivity = topMoods.length > 0
            ? `你最常体验到的情绪状态是${topMoods[0]}，它像一个常客一样出现在你的生活中。`
            : '情绪记录还不够多，暂时看不出明显规律。';

        const contentPattern = avgContentLength > 50
            ? `你的随笔平均有${avgContentLength}字，记录得相当详细，是个很好的倾诉出口。`
            : avgContentLength > 10
                ? '你的随笔比较简短，像是快速的心情快照。'
                : '记录的文字不多，有时候心情确实难以用语言表达。';

        const gratitudePattern = gratitudeCount > 0
            ? `你记录了${gratitudeCount}件感恩的事，懂得感恩的人更容易感受到幸福。`
            : '感恩列表还是空白的，试着每天找出一件值得感恩的小事吧。';

        const anchorPatterns = topMoods.length > 0
            ? topMoods.join('、') + '，还有记录心情这个行为本身'
            : '记录心情这个行为本身';

        const patternInsight = recordedDays >= 5
            ? '这些重复出现的模式，就像生活的底色。看见它们，就是改变的开始。'
            : '记录的日子还不多，继续坚持下去，你会看到更清晰的模式。';

        return template
            .replace(/{tagPattern}/g, tagPattern)
            .replace(/{weatherPattern}/g, weatherPattern)
            .replace(/{timePattern}/g, timePattern)
            .replace(/{frequentActivity}/g, frequentActivity)
            .replace(/{contentPattern}/g, contentPattern)
            .replace(/{gratitudePattern}/g, gratitudePattern)
            .replace(/{anchorPatterns}/g, anchorPatterns)
            .replace(/{patternInsight}/g, patternInsight);
    }

    /**
     * 生成洞察与建议段落
     */
    function _generateInsightParagraph(weekData) {
        const template = _randomPick(INSIGHT_TEMPLATES);
        const { avgScore, trend, topMood, recordedDays, gratitudeCount, avgContentLength } = weekData;

        const insights = [];
        const suggestions = [];

        // 根据数据生成不同的洞察
        if (trend === 'falling') {
            insights.push('情绪有下滑趋势，这可能是身体或心理在发出预警信号。');
            suggestions.push('建议主动安排一些"充电时间"，做那些能让你感到恢复的事情。');
        }
        if (trend === 'rising') {
            insights.push('状态在逐步回升，说明你的自我调节能力很强。');
            suggestions.push('可以回顾一下是什么让心情变好的，把这些方法记下来以备不时之需。');
        }
        if (topMood === 'tired' || topMood === 'stressed') {
            insights.push('疲惫和压力出现得比较频繁，可能需要重新审视一下当前的生活节奏。');
            suggestions.push('试着找出消耗你能量最多的那件事，看看能不能减少它或者换个方式应对。');
        }
        if (topMood === 'happy' || topMood === 'calm' || topMood === 'grateful') {
            insights.push('积极情绪出现得很多，说明你正在过一种让自己满意的生活。');
            suggestions.push('保持这份状态的同时，也可以试着把快乐传递给身边的人。');
        }
        if (gratitudeCount === 0 && recordedDays > 0) {
            insights.push('还没有记录过感恩的事，但感恩练习被证明能显著提升幸福感。');
            suggestions.push('明天记录心情时，试着写下一件小事，哪怕是"今天天气不错"也行。');
        }
        if (avgContentLength < 20 && recordedDays > 0) {
            insights.push('随笔记录比较简短，有时候把感受写出来本身就是一种疗愈。');
            suggestions.push('下次记录时，试着多写几句，把情绪的来龙去脉理一理。');
        }
        if (recordedDays < 4) {
            insights.push('记录频率不算高，可能是因为忙，也可能是因为忘记了。');
            suggestions.push('可以设置一个固定的记录时间，比如睡前5分钟，慢慢养成习惯。');
        }

        // 确保至少有3条内容
        while (insights.length < 2) {
            insights.push('情绪没有好坏之分，每一种感受都有它存在的意义。');
        }
        while (suggestions.length < 2) {
            suggestions.push('记得每天给自己一点独处的时间，和内心的自己聊聊天。');
        }

        const insight1 = insights[0] ? `\n\n💡 ${insights[0]}` : '';
        const insight2 = insights[1] ? `\n\n💭 ${insights[1]}` : '';
        const insight3 = insights[2] ? `\n\n✨ ${insights[2]}` : '';

        const suggestion1 = suggestions[0] ? `\n\n🌱 建议一：${suggestions[0]}` : '';
        const suggestion2 = suggestions[1] ? `\n\n🎯 建议二：${suggestions[1]}` : '';
        const suggestion3 = suggestions[2] ? `\n\n💝 建议三：${suggestions[2]}` : '';

        const mirrorDesc = avgScore >= 7
            ? '一个正在积极生活、对世界保持好奇的人。'
            : avgScore >= 5
                ? '一个认真生活、偶尔会被情绪困扰但一直在努力的人。'
                : '一个正在经历挑战、但没有放弃的人。';

        const connectionDesc = topMood
            ? `你的${_getMoodTagById(topMood)?.label || ''}情绪出现得最多，它可能和你最近的生活状态密切相关。`
            : '你的情绪状态和生活节奏之间，似乎有着某种微妙的关联。';

        const actionSuggestion = suggestions[0] || '试着做一些微小的改变，比如早起10分钟，或者睡前放下手机。';
        const selfCareTip = suggestions[1] || '别忘了，照顾好自己的情绪，是最重要的事。';

        return template
            .replace(/{insight1}/g, insight1)
            .replace(/{insight2}/g, insight2)
            .replace(/{insight3}/g, insight3)
            .replace(/{mirrorDesc}/g, mirrorDesc)
            .replace(/{suggestion1}/g, suggestion1)
            .replace(/{suggestion2}/g, suggestion2)
            .replace(/{suggestion3}/g, suggestion3)
            .replace(/{connectionDesc}/g, connectionDesc)
            .replace(/{actionSuggestion}/g, actionSuggestion)
            .replace(/{selfCareTip}/g, selfCareTip)
            .trim();
    }

    /**
     * 生成思考问题
     */
    function _generateThinkingQuestion(weekData) {
        // 根据情绪状态选择不同类别的问题
        const { avgScore, trend, topMood } = weekData;

        let pool = THINKING_QUESTIONS;

        // 如果心情很好，偏向创意和成长类
        if (avgScore >= 7) {
            pool = [
                THINKING_QUESTIONS[0], THINKING_QUESTIONS[2], THINKING_QUESTIONS[4],
                THINKING_QUESTIONS[7], THINKING_QUESTIONS[8], THINKING_QUESTIONS[10],
                THINKING_QUESTIONS[13], THINKING_QUESTIONS[15],
            ];
        }
        // 如果心情低落，偏向自我关怀和反思类
        if (avgScore <= 4) {
            pool = [
                THINKING_QUESTIONS[1], THINKING_QUESTIONS[11], THINKING_QUESTIONS[12],
                THINKING_QUESTIONS[14], THINKING_QUESTIONS[15], THINKING_QUESTIONS[13],
            ];
        }

        return _randomPick(pool);
    }

    // ============================================================
    // 5.2 AI 数据分析 - 数据获取
    // ============================================================

    /**
     * 从其他模块获取数据用于AI分析
     */
    function _getCrossModuleData() {
        const result = {
            mood: null,
            habits: null,
            habitRecords: null,
            schedule: null,
            english: null,
            attendance: null,
        };

        try {
            result.mood = data;
        } catch (e) { /* 静默 */ }

        try {
            const habitsData = AppStorage.getModule('habits');
            if (habitsData && habitsData.habits) {
                result.habits = habitsData;
            }
        } catch (e) { /* 静默 */ }

        try {
            const habitRecords = AppStorage.getModule('habitRecords');
            if (habitRecords && typeof habitRecords === 'object') {
                result.habitRecords = habitRecords;
            }
        } catch (e) { /* 静默 */ }

        try {
            const scheduleData = AppStorage.getModule('schedule');
            if (scheduleData && scheduleData.dailyCheckins) {
                result.schedule = scheduleData;
            }
        } catch (e) { /* 静默 */ }

        try {
            const englishData = AppStorage.getModule('english');
            if (englishData && englishData.checkinRecords) {
                result.english = englishData;
            }
        } catch (e) { /* 静默 */ }

        try {
            const attendanceData = AppStorage.getModule('attendance');
            if (attendanceData && attendanceData.records) {
                result.attendance = attendanceData;
            }
        } catch (e) { /* 静默 */ }

        return result;
    }

    /**
     * 获取最近N天的日期数组
     */
    function _getRecentDates(days, endDateStr) {
        const dates = [];
        const end = endDateStr ? new Date(endDateStr) : new Date();
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(end);
            d.setDate(end.getDate() - i);
            dates.push(App.formatDate(d));
        }
        return dates;
    }

    // ============================================================
    // 5.3 AI 数据分析 - 四个分析维度
    // ============================================================

    /**
     * 分析1：最近反复做的事
     */
    function _analyzeFrequentActivities() {
        const crossData = _getCrossModuleData();
        const recent7Days = _getRecentDates(7);
        const activities = [];

        // 分析习惯打卡
        if (crossData.habits && crossData.habitRecords) {
            const habits = crossData.habits.habits || [];
            const records = crossData.habitRecords;

            for (const habit of habits) {
                let count = 0;
                let streak = 0;
                let currentStreak = 0;

                for (const date of recent7Days) {
                    if (records[date] && records[date][habit.id]) {
                        count++;
                        currentStreak++;
                        if (currentStreak > streak) streak = currentStreak;
                    } else {
                        currentStreak = 0;
                    }
                }

                if (count > 0) {
                    activities.push({
                        name: habit.name,
                        icon: habit.icon,
                        count,
                        streak,
                        type: 'habit',
                        color: habit.color,
                    });
                }
            }
        }

        // 分析英语学习
        if (crossData.english && crossData.english.checkinRecords) {
            let totalMinutes = 0;
            let days = 0;
            for (const date of recent7Days) {
                const rec = crossData.english.checkinRecords[date];
                if (rec) {
                    days++;
                    totalMinutes += rec.minutes || 0;
                }
            }
            if (days > 0) {
                activities.push({
                    name: '英语学习',
                    icon: '📚',
                    count: days,
                    streak: days, // 简化处理
                    type: 'english',
                    detail: `共${totalMinutes}分钟`,
                    color: '#7ec8a7',
                });
            }
        }

        // 分析考勤
        if (crossData.attendance && crossData.attendance.records) {
            let workDays = 0;
            let normalDays = 0;
            for (const date of recent7Days) {
                const rec = crossData.attendance.records[date];
                if (rec && !rec.isRestDay) {
                    workDays++;
                    if (rec.status === 'normal') normalDays++;
                }
            }
            if (workDays > 0) {
                activities.push({
                    name: '上班打卡',
                    icon: '🕐',
                    count: workDays,
                    streak: workDays,
                    type: 'attendance',
                    detail: `正常${normalDays}天`,
                    color: '#8bc9a8',
                });
            }
        }

        // 按频率排序
        activities.sort((a, b) => b.count - a.count);

        // 生成自然语言描述
        let description = '';
        if (activities.length === 0) {
            description = '最近的数据还不够多，看不出明显的规律。继续记录，数据会越来越有意思的。';
        } else {
            const top3 = activities.slice(0, 3);
            const topNames = top3.map(a => `${a.icon}${a.name}`).join('、');

            if (top3.length === 1) {
                description = `过去一周，你最常做的事是${topNames}，做了${top3[0].count}次。它已经成为了你生活中的固定节目。`;
            } else if (top3.length === 2) {
                description = `过去一周，${topNames}是你最常做的两件事。它们像两个锚点，稳定着你的生活节奏。`;
            } else {
                description = `过去一周，你做得最多的三件事是：${topNames}。这些重复的日常，正在悄悄塑造着现在的你。`;
            }

            // 找出连续打卡最多的
            const maxStreak = activities.reduce((max, a) => Math.max(max, a.streak), 0);
            const streakActivity = activities.find(a => a.streak === maxStreak && maxStreak >= 3);
            if (streakActivity) {
                description += `\n\n🔥 特别值得一提的是，${streakActivity.icon}${streakActivity.name}你已经连续坚持了${streakActivity.streak}天，这份坚持很了不起！`;
            }
        }

        return {
            activities,
            description,
        };
    }

    /**
     * 分析2：时间的联系（跨模块关联分析）
     */
    function _analyzeTimeConnections() {
        const crossData = _getCrossModuleData();
        const recent14Days = _getRecentDates(14);
        const insights = [];

        // 关联1：心情好 vs 英语学习时长
        if (crossData.mood && crossData.mood.entries && crossData.english && crossData.english.checkinRecords) {
            const moodEntries = crossData.mood.entries;
            const englishRecords = crossData.english.checkinRecords;

            let highMoodMinutes = 0;
            let highMoodDays = 0;
            let lowMoodMinutes = 0;
            let lowMoodDays = 0;

            for (const date of recent14Days) {
                const mood = moodEntries[date];
                const english = englishRecords[date];
                if (mood && english) {
                    if (mood.score >= 7) {
                        highMoodMinutes += english.minutes || 0;
                        highMoodDays++;
                    } else if (mood.score <= 4) {
                        lowMoodMinutes += english.minutes || 0;
                        lowMoodDays++;
                    }
                }
            }

            if (highMoodDays > 0 && lowMoodDays > 0) {
                const highAvg = Math.round(highMoodMinutes / highMoodDays);
                const lowAvg = Math.round(lowMoodMinutes / lowMoodDays);
                if (highAvg > lowAvg + 5) {
                    insights.push({
                        title: '心情好时学英语更起劲',
                        detail: `心情好的日子平均学${highAvg}分钟，心情低落时只有${lowAvg}分钟。情绪状态确实会影响学习动力。`,
                        icon: '😊📚',
                    });
                } else if (lowAvg > highAvg + 5) {
                    insights.push({
                        title: '心情低落时更爱学习',
                        detail: `情绪低的日子反而学了${lowAvg}分钟英语，也许学习是你调节情绪的方式。`,
                        icon: '😔📖',
                    });
                }
            }
        }

        // 关联2：工作日 vs 休息日活动差异
        if (crossData.attendance && crossData.attendance.records && crossData.habitRecords) {
            const records = crossData.attendance.records;
            const habitRecords = crossData.habitRecords;
            const habits = crossData.habits?.habits || [];

            let workdayHabitCount = 0;
            let workdays = 0;
            let weekendHabitCount = 0;
            let weekends = 0;

            for (const date of recent14Days) {
                const rec = records[date];
                const habitsOnDay = habitRecords[date] ? Object.keys(habitRecords[date]).length : 0;

                const d = new Date(date);
                const dayOfWeek = d.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                if (isWeekend) {
                    weekends++;
                    weekendHabitCount += habitsOnDay;
                } else {
                    workdays++;
                    workdayHabitCount += habitsOnDay;
                }
            }

            if (workdays > 0 && weekends > 0) {
                const workAvg = Math.round((workdayHabitCount / workdays) * 10) / 10;
                const weekendAvg = Math.round((weekendHabitCount / weekends) * 10) / 10;

                if (Math.abs(workAvg - weekendAvg) > 0.5) {
                    insights.push({
                        title: '工作日和周末的节奏不同',
                        detail: workAvg > weekendAvg
                            ? `工作日平均完成${workAvg}个习惯，周末${weekendAvg}个。工作日反而更有规律。`
                            : `周末平均完成${weekendAvg}个习惯，工作日${workAvg}个。周末你有更多时间照顾自己。`,
                        icon: '📅🔄',
                    });
                }
            }
        }

        // 关联3：习惯打卡和心情的关系
        if (crossData.mood && crossData.mood.entries && crossData.habitRecords) {
            const moodEntries = crossData.mood.entries;
            const habitRecords = crossData.habitRecords;

            let highHabitMood = 0;
            let highHabitDays = 0;
            let lowHabitMood = 0;
            let lowHabitDays = 0;

            for (const date of recent14Days) {
                const mood = moodEntries[date];
                const habits = habitRecords[date];
                const habitCount = habits ? Object.keys(habits).length : 0;

                if (mood) {
                    if (habitCount >= 3) {
                        highHabitMood += mood.score;
                        highHabitDays++;
                    } else if (habitCount <= 1) {
                        lowHabitMood += mood.score;
                        lowHabitDays++;
                    }
                }
            }

            if (highHabitDays > 0 && lowHabitDays > 0) {
                const highAvg = Math.round((highHabitMood / highHabitDays) * 10) / 10;
                const lowAvg = Math.round((lowHabitMood / lowHabitDays) * 10) / 10;

                if (highAvg > lowAvg + 0.5) {
                    insights.push({
                        title: '习惯打卡多的日子心情更好',
                        detail: `完成3个以上习惯的日子平均心情${highAvg}分，而完成1个以下的日子只有${lowAvg}分。行动确实能带来好心情。`,
                        icon: '✅😊',
                    });
                }
            }
        }

        // 如果没有发现关联，给出通用描述
        if (insights.length === 0) {
            insights.push({
                title: '数据还在积累中',
                detail: '目前记录的数据还不够多，暂时看不出明显的关联。继续坚持记录，随着数据量增加，你会发现更多有趣的联系。',
                icon: '🔍',
            });
            insights.push({
                title: '每个人的模式都不同',
                detail: '你的生活节奏、情绪变化、行为习惯之间，一定有着独特的关联。用数据记录生活，就是在认识自己的过程。',
                icon: '🧩',
            });
        }

        return {
            insights,
            description: insights.map(i => `${i.icon} **${i.title}**\n${i.detail}`).join('\n\n'),
        };
    }

    /**
     * 分析3：最近的变化（近7天 vs 前7天）
     */
    function _analyzeRecentChanges() {
        const crossData = _getCrossModuleData();
        const recent7Days = _getRecentDates(7);
        const previous7Days = _getRecentDates(7, recent7Days[0]);
        const changes = [];

        // 习惯完成率变化
        if (crossData.habits && crossData.habitRecords) {
            const habits = crossData.habits.habits || [];
            const records = crossData.habitRecords;

            for (const habit of habits) {
                let recentCount = 0;
                let prevCount = 0;

                for (const date of recent7Days) {
                    if (records[date] && records[date][habit.id]) recentCount++;
                }
                for (const date of previous7Days) {
                    if (records[date] && records[date][habit.id]) prevCount++;
                }

                const diff = recentCount - prevCount;
                if (diff !== 0) {
                    changes.push({
                        name: habit.name,
                        icon: habit.icon,
                        type: 'habit',
                        recentCount,
                        prevCount,
                        diff,
                        diffPercent: prevCount > 0 ? Math.round((diff / prevCount) * 100) : (recentCount > 0 ? 100 : 0),
                        color: habit.color,
                    });
                }
            }
        }

        // 英语学习时间变化
        if (crossData.english && crossData.english.checkinRecords) {
            let recentMinutes = 0;
            let prevMinutes = 0;
            let recentDays = 0;
            let prevDays = 0;

            for (const date of recent7Days) {
                const rec = crossData.english.checkinRecords[date];
                if (rec) {
                    recentMinutes += rec.minutes || 0;
                    recentDays++;
                }
            }
            for (const date of previous7Days) {
                const rec = crossData.english.checkinRecords[date];
                if (rec) {
                    prevMinutes += rec.minutes || 0;
                    prevDays++;
                }
            }

            if (recentMinutes !== prevMinutes || recentDays !== prevDays) {
                const diff = recentMinutes - prevMinutes;
                changes.push({
                    name: '英语学习',
                    icon: '📚',
                    type: 'english',
                    recentCount: recentDays,
                    prevCount: prevDays,
                    diff,
                    diffText: `${diff > 0 ? '+' : ''}${diff}分钟`,
                    diffPercent: prevMinutes > 0 ? Math.round((diff / prevMinutes) * 100) : (recentMinutes > 0 ? 100 : 0),
                    color: '#7ec8a7',
                    detail: `上周${prevDays}天共${prevMinutes}分钟 → 本周${recentDays}天共${recentMinutes}分钟`,
                });
            }
        }

        // 心情平均分变化
        if (crossData.mood && crossData.mood.entries) {
            let recentTotal = 0;
            let recentDays = 0;
            let prevTotal = 0;
            let prevDays = 0;

            for (const date of recent7Days) {
                const entry = crossData.mood.entries[date];
                if (entry) {
                    recentTotal += entry.score || 0;
                    recentDays++;
                }
            }
            for (const date of previous7Days) {
                const entry = crossData.mood.entries[date];
                if (entry) {
                    prevTotal += entry.score || 0;
                    prevDays++;
                }
            }

            if (recentDays > 0 && prevDays > 0) {
                const recentAvg = Math.round((recentTotal / recentDays) * 10) / 10;
                const prevAvg = Math.round((prevTotal / prevDays) * 10) / 10;
                const diff = Math.round((recentAvg - prevAvg) * 10) / 10;

                if (Math.abs(diff) >= 0.5) {
                    changes.push({
                        name: '心情平均分',
                        icon: '💭',
                        type: 'mood',
                        recentCount: recentAvg,
                        prevCount: prevAvg,
                        diff,
                        diffText: `${diff > 0 ? '+' : ''}${diff}分`,
                        diffPercent: Math.round((diff / prevAvg) * 100),
                        color: diff > 0 ? '#4ECDC4' : '#74B9FF',
                        detail: `上周平均${prevAvg}分 → 本周平均${recentAvg}分`,
                    });
                }
            }
        }

        // 按变化幅度排序
        changes.sort((a, b) => Math.abs(b.diffPercent) - Math.abs(a.diffPercent));

        // 生成描述
        let description = '';
        if (changes.length === 0) {
            description = '和前一周相比，你的生活节奏基本保持稳定，没有太大的变化。这种稳定感本身就是一种力量。';
        } else {
            const rising = changes.filter(c => c.diff > 0);
            const falling = changes.filter(c => c.diff < 0);

            if (rising.length > 0) {
                const topRising = rising[0];
                description += `📈 **上升趋势**：${topRising.icon}${topRising.name}相比上周增加了${topRising.diffPercent > 0 ? topRising.diffPercent + '%' : (topRising.diffText || '')}，状态不错！\n\n`;
            }

            if (falling.length > 0) {
                const topFalling = falling[0];
                description += `📉 **下降趋势**：${topFalling.icon}${topFalling.name}比上周少了一些。没关系，波动是正常的，关键是看见它。\n\n`;
            }

            description += `本周和上周相比，共有${changes.length}项数据发生了变化。每一个微小的改变，都是成长的痕迹。`;
        }

        return {
            changes,
            description,
        };
    }

    /**
     * 分析4：获取今日灵感问题
     */
    function _getTodayInspiration() {
        const today = _today();
        const cache = data.aiAnalysis.cache;

        // 如果今天已经生成过，返回缓存的
        if (cache.inspiration && cache.inspiration.date === today) {
            return cache.inspiration;
        }

        // 用日期作为种子选择问题，保证每天一样
        const dateNum = new Date(today).getDate() + new Date(today).getMonth() * 31;
        const index = dateNum % INSPIRATION_QUESTIONS.length;
        const question = INSPIRATION_QUESTIONS[index];

        const result = {
            ...question,
            date: today,
        };

        cache.inspiration = result;
        _saveData();

        return result;
    }

    /**
     * 换一个灵感问题
     */
    function _refreshInspiration() {
        const question = _randomPick(INSPIRATION_QUESTIONS);
        aiAnalysisCurrentInspiration = {
            ...question,
            date: _today(),
            isRefreshed: true,
        };
        return aiAnalysisCurrentInspiration;
    }

    // ============================================================
    // 5.4 AI 分析页面数据汇总
    // ============================================================

    /**
     * 获取完整的AI分析数据
     */
    function _getFullAiAnalysis() {
        const today = _today();

        // 检查缓存
        if (data.aiAnalysis.lastGenerated === today && data.aiAnalysis.cache.fullAnalysis) {
            return data.aiAnalysis.cache.fullAnalysis;
        }

        const analysis = {
            frequentActivities: _analyzeFrequentActivities(),
            timeConnections: _analyzeTimeConnections(),
            recentChanges: _analyzeRecentChanges(),
            inspiration: aiAnalysisCurrentInspiration || _getTodayInspiration(),
            generatedAt: Date.now(),
        };

        // 缓存结果
        data.aiAnalysis.lastGenerated = today;
        data.aiAnalysis.cache.fullAnalysis = analysis;
        _saveData();

        return analysis;
    }

    // ============================================================
    // 5. 统计计算
    // ============================================================

    function _updateStats() {
        const entries = data.entries;
        const dates = Object.keys(entries);
        const total = dates.length;
        data.stats.totalEntries = total;

        if (total === 0) {
            data.stats.avgMoodScore = 0;
            data.stats.streak = 0;
            data.stats.mostCommonMood = '';
            return;
        }

        // 平均分
        let totalScore = 0;
        const moodCount = {};
        for (const date of dates) {
            totalScore += entries[date].score || 0;
            const moods = entries[date].moods || [];
            for (const m of moods) {
                moodCount[m] = (moodCount[m] || 0) + 1;
            }
        }
        data.stats.avgMoodScore = Math.round((totalScore / total) * 10) / 10;

        // 最多情绪
        let maxCount = 0;
        let maxMood = '';
        for (const m in moodCount) {
            if (moodCount[m] > maxCount) {
                maxCount = moodCount[m];
                maxMood = m;
            }
        }
        data.stats.mostCommonMood = maxMood;

        // 连续记录天数
        let streak = 0;
        let current = new Date();
        while (true) {
            const dateStr = App.formatDate(current);
            if (entries[dateStr]) {
                streak++;
                current.setDate(current.getDate() - 1);
            } else {
                // 如果今天还没记录，从昨天开始算
                if (streak === 0 && dateStr === _today()) {
                    current.setDate(current.getDate() - 1);
                    continue;
                }
                break;
            }
            if (streak > 365) break;
        }
        data.stats.streak = streak;
    }

    /**
     * 获取本月情绪统计数据
     */
    function _getMonthStats(year, month) {
        const dates = _getMonthDates(year, month);
        const entries = data.entries;
        const moodDistribution = {};
        const scoreTrend = [];
        let recordedDays = 0;
        let totalScore = 0;

        for (const date of dates) {
            if (entries[date]) {
                recordedDays++;
                const entry = entries[date];
                totalScore += entry.score || 0;

                // 情绪分布
                const moods = entry.moods || [];
                for (const m of moods) {
                    moodDistribution[m] = (moodDistribution[m] || 0) + 1;
                }

                scoreTrend.push({
                    date,
                    score: entry.score || 0,
                    day: new Date(date).getDate(),
                });
            } else {
                scoreTrend.push({
                    date,
                    score: null,
                    day: new Date(date).getDate(),
                });
            }
        }

        return {
            recordedDays,
            avgScore: recordedDays > 0 ? Math.round((totalScore / recordedDays) * 10) / 10 : 0,
            moodDistribution,
            scoreTrend,
            totalDays: dates.length,
        };
    }

    // ============================================================
    // 6. 渲染入口
    // ============================================================

    /**
     * 注入AI功能相关的CSS样式
     */
    function _injectAiStyles() {
        if (document.getElementById('mood-ai-styles')) return;

        const style = document.createElement('style');
        style.id = 'mood-ai-styles';
        style.textContent = `
            /* AI 入口卡片 */
            .ai-entry-cards {
                display: flex;
                gap: 12px;
                margin: 16px 0;
            }
            .ai-entry-card {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 14px;
                border-radius: 12px;
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border: 1px solid #bae6fd;
                transition: all 0.2s ease;
            }
            .ai-entry-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
            }
            .ai-entry-card:nth-child(2) {
                background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
                border-color: #d8b4fe;
            }
            .ai-entry-card:nth-child(2):hover {
                box-shadow: 0 4px 12px rgba(168, 85, 247, 0.15);
            }
            .ai-entry-icon {
                font-size: 28px;
                flex-shrink: 0;
            }
            .ai-entry-content {
                flex: 1;
                min-width: 0;
            }
            .ai-entry-title {
                font-size: 15px;
                font-weight: 600;
                color: #0c4a6e;
                margin-bottom: 2px;
            }
            .ai-entry-card:nth-child(2) .ai-entry-title {
                color: #581c87;
            }
            .ai-entry-desc {
                font-size: 12px;
                color: #64748b;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .ai-entry-arrow {
                font-size: 20px;
                color: #94a3b8;
                flex-shrink: 0;
            }

            /* AI 日记内容 */
            .ai-diary-content {
                padding: 8px 0;
            }
            .ai-diary-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 12px;
                border-bottom: 1px solid #e2e8f0;
            }
            .ai-diary-date-nav {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .ai-diary-date-label {
                font-size: 16px;
                font-weight: 600;
                color: #1e293b;
                min-width: 120px;
                text-align: center;
            }
            .ai-diary-time {
                font-size: 12px;
                color: #94a3b8;
            }
            .ai-diary-section {
                margin-bottom: 20px;
                padding: 14px;
                background: #f8fafc;
                border-radius: 10px;
                border-left: 3px solid #0ea5e9;
            }
            .ai-diary-section:nth-child(2) {
                border-left-color: #8b5cf6;
            }
            .ai-diary-section:nth-child(3) {
                border-left-color: #10b981;
            }
            .ai-diary-question {
                border-left-color: #f59e0b !important;
                background: #fffbeb !important;
            }
            .ai-diary-section-title {
                font-size: 14px;
                font-weight: 600;
                color: #334155;
                margin-bottom: 8px;
            }
            .ai-diary-section-text {
                font-size: 14px;
                line-height: 1.7;
                color: #475569;
                white-space: pre-wrap;
            }
            .ai-diary-question-text {
                font-size: 15px;
                line-height: 1.7;
                color: #92400e;
                font-weight: 500;
                white-space: pre-wrap;
            }

            /* AI 分析页面 */
            .ai-analysis-page {
                padding: 4px 0;
            }
            .ai-analysis-header {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 16px;
                border-bottom: 1px solid #e2e8f0;
            }
            .ai-analysis-title {
                font-size: 20px;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 4px;
            }
            .ai-analysis-subtitle {
                font-size: 13px;
                color: #64748b;
            }
            .ai-analysis-card {
                margin-bottom: 16px;
                border-radius: 12px;
                overflow: hidden;
            }
            .ai-analysis-card-header {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 14px 16px;
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border-bottom: 1px solid #bae6fd;
            }
            .ai-analysis-card-icon {
                font-size: 18px;
            }
            .ai-analysis-card-title {
                font-size: 15px;
                font-weight: 600;
                color: #0c4a6e;
                flex: 1;
            }
            .ai-refresh-btn {
                opacity: 0.6;
                transition: opacity 0.2s;
            }
            .ai-refresh-btn:hover {
                opacity: 1;
            }
            .ai-analysis-card-body {
                padding: 16px;
            }
            .ai-analysis-desc {
                font-size: 13px;
                line-height: 1.7;
                color: #64748b;
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px dashed #e2e8f0;
            }

            /* 高频活动列表 */
            .frequent-activities-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .frequent-activity-item {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .frequent-activity-rank {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #e2e8f0;
                color: #64748b;
                font-size: 11px;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            .frequent-activity-item:nth-child(1) .frequent-activity-rank {
                background: #fbbf24;
                color: #fff;
            }
            .frequent-activity-item:nth-child(2) .frequent-activity-rank {
                background: #94a3b8;
                color: #fff;
            }
            .frequent-activity-item:nth-child(3) .frequent-activity-rank {
                background: #d97706;
                color: #fff;
            }
            .frequent-activity-icon {
                width: 36px;
                height: 36px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                flex-shrink: 0;
            }
            .frequent-activity-info {
                flex: 1;
                min-width: 0;
            }
            .frequent-activity-name {
                font-size: 14px;
                font-weight: 500;
                color: #334155;
                margin-bottom: 2px;
            }
            .frequent-activity-detail {
                font-size: 12px;
                color: #94a3b8;
            }
            .frequent-activity-bar {
                width: 60px;
                height: 6px;
                background: #e2e8f0;
                border-radius: 3px;
                overflow: hidden;
                flex-shrink: 0;
            }
            .frequent-activity-bar-fill {
                height: 100%;
                border-radius: 3px;
                transition: width 0.3s ease;
            }

            /* 时间联系列表 */
            .time-connections-list {
                display: flex;
                flex-direction: column;
                gap: 14px;
            }
            .connection-item {
                display: flex;
                gap: 12px;
                padding: 12px;
                background: #f8fafc;
                border-radius: 10px;
            }
            .connection-icon {
                font-size: 24px;
                flex-shrink: 0;
            }
            .connection-content {
                flex: 1;
            }
            .connection-title {
                font-size: 14px;
                font-weight: 600;
                color: #334155;
                margin-bottom: 4px;
            }
            .connection-detail {
                font-size: 13px;
                line-height: 1.6;
                color: #64748b;
            }

            /* 最近变化列表 */
            .recent-changes-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .change-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 0;
                border-bottom: 1px solid #f1f5f9;
            }
            .change-item:last-child {
                border-bottom: none;
            }
            .change-icon {
                width: 36px;
                height: 36px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                flex-shrink: 0;
            }
            .change-info {
                flex: 1;
                min-width: 0;
            }
            .change-name {
                font-size: 14px;
                font-weight: 500;
                color: #334155;
                margin-bottom: 2px;
            }
            .change-detail {
                font-size: 12px;
                color: #94a3b8;
            }
            .change-value {
                font-size: 13px;
                font-weight: 600;
                flex-shrink: 0;
            }
            .change-value.rising {
                color: #10b981;
            }
            .change-value.falling {
                color: #ef4444;
            }

            /* 灵感内容 */
            .inspiration-content {
                text-align: center;
                padding: 16px 8px;
            }
            .inspiration-category {
                display: inline-block;
                padding: 4px 12px;
                background: #fef3c7;
                color: #92400e;
                font-size: 12px;
                font-weight: 500;
                border-radius: 12px;
                margin-bottom: 12px;
            }
            .inspiration-question {
                font-size: 16px;
                line-height: 1.7;
                color: #78350f;
                font-weight: 500;
            }
            .ai-inspiration-card .ai-analysis-card-header {
                background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
                border-bottom-color: #fcd34d;
            }
            .ai-inspiration-card .ai-analysis-card-title {
                color: #92400e;
            }

            .ai-analysis-footer {
                text-align: center;
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid #e2e8f0;
            }
            .ai-analysis-tip {
                font-size: 12px;
                color: #94a3b8;
            }

            /* 响应式 */
            @media (max-width: 480px) {
                .ai-entry-cards {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function render(container) {
        containerEl = container;
        if (!data) _loadData();

        // 注入AI功能样式
        _injectAiStyles();

        const today = _today();
        const todayEntry = data.entries[today];
        const todayAiDiary = data.aiDiary.entries[today];

        container.innerHTML = `
            <div class="mood-module">
                <!-- 今日情绪记录 -->
                <div class="section-title">
                    <h2><span class="title-icon">💭</span>今日心情</h2>
                    <span class="section-action" data-action="edit-today">${todayEntry ? '编辑' : '记录'}</span>
                </div>
                <div class="today-mood-card" id="todayMoodCard"></div>

                <!-- AI 功能入口卡片 -->
                <div class="ai-entry-cards">
                    <!-- AI 日记卡片 -->
                    <div class="card card-clickable ai-entry-card" data-action="open-ai-diary">
                        <div class="ai-entry-icon">🤖</div>
                        <div class="ai-entry-content">
                            <div class="ai-entry-title">AI 日记分析</div>
                            <div class="ai-entry-desc">
                                ${todayAiDiary ? '今日分析已生成，点击查看' : '今日分析生成中...'}
                            </div>
                        </div>
                        <div class="ai-entry-arrow">›</div>
                    </div>

                    <!-- AI 数据分析卡片 -->
                    <div class="card card-clickable ai-entry-card" data-action="open-ai-analysis">
                        <div class="ai-entry-icon">📊</div>
                        <div class="ai-entry-content">
                            <div class="ai-entry-title">AI 数据分析</div>
                            <div class="ai-entry-desc">洞察你的生活模式与变化</div>
                        </div>
                        <div class="ai-entry-arrow">›</div>
                    </div>
                </div>

                <!-- 日期导航栏 -->
                <div class="mood-date-nav">
                    <button class="btn-icon" data-action="prev-day-mood" title="前一天">◀</button>
                    <span class="mood-date-label" id="moodDateLabel">${_formatDateShort(currentDate)}</span>
                    <button class="btn-icon" data-action="next-day-mood" title="后一天">▶</button>
                    <button class="btn-icon" data-action="toggle-calendar" title="日历">📅</button>
                </div>

                <!-- 日历卡片 -->
                <div class="card calendar-card" id="moodCalendarCard" style="${showCalendar ? '' : 'display: none;'}">
                    <div class="card-header">
                        <h3>
                            <button class="btn-icon btn-sm" data-action="prev-month-mood" title="上一月">◀</button>
                            <span id="moodCalendarTitle">${calendarYear}年${calendarMonth + 1}月</span>
                            <button class="btn-icon btn-sm" data-action="next-month-mood" title="下一月">▶</button>
                        </h3>
                    </div>
                    <div class="card-body">
                        <div id="moodCalendarContainer">${_renderMoodCalendar()}</div>
                    </div>
                </div>

                <!-- 历史记录 -->
                <div class="section-title">
                    <h2><span class="title-icon">📖</span>历史记录</h2>
                    <div class="filter-group">
                        <select class="form-select form-select-sm" id="historyMonthSelect">
                            ${_getMonthOptions()}
                        </select>
                    </div>
                </div>
                <div class="mood-timeline" id="moodTimeline"></div>
            </div>
        `;

        _renderTodayMood();
        _renderTimeline();
        _bindEvents();
    }

    function _getMonthOptions() {
        const now = new Date();
        let options = '';
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = `${d.getFullYear()}年${d.getMonth() + 1}月`;
            options += `<option value="${value}" ${i === 0 ? 'selected' : ''}>${label}</option>`;
        }
        return options;
    }

    // ============================================================
    // 7. 今日情绪渲染
    // ============================================================

    function _renderTodayMood() {
        const card = containerEl.querySelector('#todayMoodCard');
        if (!card) return;

        const today = _today();
        const entry = data.entries[today];

        if (!entry) {
            card.innerHTML = `
                <div class="card today-empty-card card-clickable" data-action="edit-today">
                    <div class="empty-state">
                        <div class="empty-state-icon">🌈</div>
                        <div class="empty-state-text">今天还没有记录心情</div>
                        <div class="empty-state-desc">点击记录今天的心情吧</div>
                    </div>
                </div>
            `;
            return;
        }

        const moodTags = (entry.moods || []).map(id => _getMoodTagById(id)).filter(Boolean);
        const weather = entry.weather ? _getWeatherById(entry.weather) : null;
        const gratitudeList = entry.gratitude || [];

        card.innerHTML = `
            <div class="card today-mood-detail">
                <div class="mood-header">
                    <div class="mood-score-display">
                        <div class="score-number" style="color: ${_getScoreColor(entry.score)}">${entry.score || 0}</div>
                        <div class="score-label">心情评分</div>
                    </div>
                    <div class="mood-tags-display">
                        ${moodTags.map(tag => `
                            <span class="mood-tag" style="background: ${tag.color}20; color: ${tag.color};">
                                ${tag.icon} ${tag.label}
                            </span>
                        `).join('')}
                        ${weather ? `<span class="mood-tag weather-tag">${weather.icon} ${weather.label}</span>` : ''}
                    </div>
                </div>
                ${entry.content ? `
                    <div class="mood-content">
                        <div class="mood-content-label">今日随笔</div>
                        <div class="mood-content-text">${_esc(entry.content)}</div>
                    </div>
                ` : ''}
                ${gratitudeList.length > 0 ? `
                    <div class="mood-gratitude">
                        <div class="mood-content-label">🙏 今日感恩</div>
                        <ul class="gratitude-list">
                            ${gratitudeList.map((item, i) => `
                                <li>${i + 1}. ${_esc(item)}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    function _getScoreColor(score) {
        if (score >= 8) return '#FD79A8';
        if (score >= 6) return '#4ECDC4';
        if (score >= 4) return '#FDCB6E';
        return '#74B9FF';
    }

    // ============================================================
    // 8. 编辑模态框
    // ============================================================

    function _openMoodModal(dateStr) {
        const today = dateStr || _today();
        const entry = data.entries[today] || {};
        const isEdit = !!data.entries[today];
        const selectedMoods = entry.moods || [];
        const selectedWeather = entry.weather || '';
        const gratitude = entry.gratitude || ['', '', ''];

        const html = `
            <div class="form-group">
                <label class="form-label">情绪标签（可多选）</label>
                <div class="mood-tag-selector">
                    ${MOOD_TAGS.map(tag => `
                        <button type="button" class="mood-tag-btn ${selectedMoods.includes(tag.id) ? 'active' : ''}"
                                data-mood-id="${tag.id}"
                                style="border-color: ${tag.color}40; ${selectedMoods.includes(tag.id) ? `background: ${tag.color}20; color: ${tag.color};` : ''}">
                            ${tag.icon} ${tag.label}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">心情评分：<span id="scoreValue">${entry.score || 5}</span> 分</label>
                <div class="slider-container">
                    <input type="range" class="slider" id="moodScore" min="1" max="10" value="${entry.score || 5}">
                </div>
                <div class="score-labels">
                    <span>😔 低落</span>
                    <span>😊 开心</span>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">天气（可选）</label>
                <div class="weather-selector">
                    ${WEATHER_OPTIONS.map(w => `
                        <button type="button" class="weather-btn ${selectedWeather === w.id ? 'active' : ''}"
                                data-weather-id="${w.id}">
                            <span class="weather-icon">${w.icon}</span>
                            <span class="weather-label">${w.label}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">随笔记录</label>
                <textarea class="form-textarea" id="moodContent" rows="5" placeholder="记录今天的心情、想法、发生的事情...">${_esc(entry.content || '')}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">🙏 今日感恩（3件事）</label>
                <div class="gratitude-inputs">
                    <input type="text" class="form-input gratitude-input" id="gratitude1" value="${_esc(gratitude[0] || '')}" placeholder="第1件值得感恩的事">
                    <input type="text" class="form-input gratitude-input" id="gratitude2" value="${_esc(gratitude[1] || '')}" placeholder="第2件值得感恩的事">
                    <input type="text" class="form-input gratitude-input" id="gratitude3" value="${_esc(gratitude[2] || '')}" placeholder="第3件值得感恩的事">
                </div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveMoodBtn">${isEdit ? '保存修改' : '保存记录'}</button>
            </div>
        `;

        App.openModal(isEdit ? '编辑心情记录' : '记录今日心情', html, {
            onOpen: () => {
                let currentMoods = [...selectedMoods];
                let currentWeather = selectedWeather;

                // 评分滑块
                const scoreSlider = document.getElementById('moodScore');
                const scoreValue = document.getElementById('scoreValue');
                scoreSlider?.addEventListener('input', () => {
                    scoreValue.textContent = scoreSlider.value;
                });

                // 情绪标签选择
                document.querySelectorAll('.mood-tag-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const moodId = btn.dataset.moodId;
                        const tag = _getMoodTagById(moodId);
                        const idx = currentMoods.indexOf(moodId);
                        if (idx > -1) {
                            currentMoods.splice(idx, 1);
                            btn.classList.remove('active');
                            btn.style.background = '';
                            btn.style.color = '';
                        } else {
                            currentMoods.push(moodId);
                            btn.classList.add('active');
                            btn.style.background = `${tag.color}20`;
                            btn.style.color = tag.color;
                        }
                    });
                });

                // 天气选择
                document.querySelectorAll('.weather-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const weatherId = btn.dataset.weatherId;
                        document.querySelectorAll('.weather-btn').forEach(b => b.classList.remove('active'));
                        if (currentWeather === weatherId) {
                            currentWeather = '';
                        } else {
                            currentWeather = weatherId;
                            btn.classList.add('active');
                        }
                    });
                });

                // 保存
                document.getElementById('saveMoodBtn')?.addEventListener('click', () => {
                    const score = parseInt(document.getElementById('moodScore').value) || 5;
                    const content = document.getElementById('moodContent').value.trim();
                    const g1 = document.getElementById('gratitude1').value.trim();
                    const g2 = document.getElementById('gratitude2').value.trim();
                    const g3 = document.getElementById('gratitude3').value.trim();

                    const gratitudeList = [g1, g2, g3].filter(g => g.length > 0);

                    const entryData = {
                        moods: currentMoods,
                        score,
                        weather: currentWeather || null,
                        content,
                        gratitude: gratitudeList,
                        updatedAt: Date.now(),
                    };

                    if (!data.entries[today]) {
                        entryData.createdAt = Date.now();
                    } else {
                        entryData.createdAt = data.entries[today].createdAt;
                    }

                    data.entries[today] = entryData;

                    // 同步到健康模块心情数据
                    _syncToHealth(today, entryData);

                    _saveData();
                    _updateStats();
                    _renderTodayMood();
                    _renderTimeline();
                    App.closeModal();
                    App.showSuccess('心情已记录');
                });
            }
        });
    }

    /**
     * 同步情绪数据到健康模块
     */
    function _syncToHealth(dateStr, entryData) {
        try {
            const healthData = AppStorage.getModule('health');
            if (healthData && healthData.dailyObservations) {
                if (!healthData.dailyObservations[dateStr]) {
                    healthData.dailyObservations[dateStr] = {};
                }
                healthData.dailyObservations[dateStr].mood = entryData.score;
                AppStorage.setModule('health', healthData);
            }
        } catch (e) {
            // 静默失败
        }
    }

    // ============================================================
    // 9. 历史时间线
    // ============================================================

    function _renderTimeline() {
        const timeline = containerEl.querySelector('#moodTimeline');
        if (!timeline) return;

        const now = new Date();
        const monthSelect = containerEl.querySelector('#historyMonthSelect');
        let year = now.getFullYear();
        let month = now.getMonth();

        if (monthSelect && monthSelect.value) {
            const parts = monthSelect.value.split('-');
            year = parseInt(parts[0]);
            month = parseInt(parts[1]) - 1;
        }

        const dates = _getMonthDates(year, month).reverse(); // 倒序，最新的在前
        const entries = data.entries;
        const recordedDates = dates.filter(d => entries[d]);

        if (recordedDates.length === 0) {
            timeline.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📖</div>
                    <div class="empty-state-text">本月暂无情绪记录</div>
                </div>
            `;
            return;
        }

        timeline.innerHTML = `
            <div class="timeline">
                ${recordedDates.map(date => {
                    const entry = entries[date];
                    const moodTags = (entry.moods || []).map(id => _getMoodTagById(id)).filter(Boolean);
                    const weather = entry.weather ? _getWeatherById(entry.weather) : null;
                    const d = new Date(date);

                    return `
                        <div class="timeline-item" data-date="${date}">
                            <div class="timeline-dot" style="background: ${_getScoreColor(entry.score)};"></div>
                            <div class="timeline-content card card-clickable">
                                <div class="timeline-date">
                                    <span class="date-main">${_formatDate(date)}</span>
                                    <span class="date-score" style="color: ${_getScoreColor(entry.score)};">
                                        ${entry.score || 0}分
                                    </span>
                                    ${weather ? `<span class="date-weather">${weather.icon}</span>` : ''}
                                </div>
                                <div class="timeline-tags">
                                    ${moodTags.map(tag => `
                                        <span class="mood-tag-sm" style="background: ${tag.color}20; color: ${tag.color};">
                                            ${tag.icon} ${tag.label}
                                        </span>
                                    `).join('')}
                                </div>
                                ${entry.content ? `
                                    <div class="timeline-text">${_esc(entry.content.length > 80 ? entry.content.substring(0, 80) + '...' : entry.content)}</div>
                                ` : ''}
                                ${entry.gratitude && entry.gratitude.length > 0 ? `
                                    <div class="timeline-gratitude">
                                        <span class="gratitude-icon">🙏</span>
                                        ${entry.gratitude.slice(0, 2).map(g => `<span class="gratitude-item">${_esc(g)}</span>`).join('')}
                                        ${entry.gratitude.length > 2 ? `<span class="gratitude-more">+${entry.gratitude.length - 2}</span>` : ''}
                                    </div>
                                ` : ''}
                                <div class="timeline-actions">
                                    <button class="btn-icon btn-sm" data-action="edit-entry" data-date="${date}" title="编辑">✏️</button>
                                    <button class="btn-icon btn-sm" data-action="delete-entry" data-date="${date}" title="删除">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * 删除情绪记录
     */
    async function _deleteEntry(dateStr) {
        const confirmed = await App.confirmModal('确认删除', '确定要删除这条情绪记录吗？删除后无法恢复。', {
            confirmText: '删除',
            cancelText: '取消',
        });
        if (confirmed) {
            delete data.entries[dateStr];
            _saveData();
            _updateStats();
            _renderTodayMood();
            _renderTimeline();
            App.showSuccess('已删除');
        }
    }

    // ============================================================
    // 10. 日历详情查看
    // ============================================================

    function _viewMoodDay(dateStr) {
        const entry = _getEntry(dateStr);
        const moodTags = entry ? (entry.moods || []).map(id => _getMoodTagById(id)).filter(Boolean) : [];
        const weather = entry && entry.weather ? _getWeatherById(entry.weather) : null;
        const gratitudeList = entry ? (entry.gratitude || []) : [];
        const dateLabel = _formatDateShort(dateStr);

        if (!entry) {
            App.openModal(dateLabel, `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <div class="empty-state-text">这一天没有心情记录</div>
                    <div class="empty-state-desc">点击下方按钮记录当天心情</div>
                </div>
                <div class="mt-lg">
                    <button class="btn btn-primary btn-block" id="moodAddEntryBtn">记录心情</button>
                </div>
            `, {
                onOpen: () => {
                    document.getElementById('moodAddEntryBtn')?.addEventListener('click', () => {
                        App.closeModal();
                        _openMoodModal(dateStr);
                    });
                }
            });
            return;
        }

        const html = `
            <div class="mood-day-detail">
                <div class="mood-score-section" style="text-align: center; margin-bottom: 20px;">
                    <div class="score-number" style="font-size: 48px; font-weight: bold; color: ${_getScoreColor(entry.score)};">${entry.score || 0}</div>
                    <div class="score-label" style="color: #999;">心情评分</div>
                </div>
                <div class="mood-tags-section" style="margin-bottom: 16px;">
                    <div class="mood-content-label" style="font-size: 14px; color: #666; margin-bottom: 8px;">情绪标签</div>
                    <div class="mood-tags-display">
                        ${moodTags.map(tag => `
                            <span class="mood-tag" style="background: ${tag.color}20; color: ${tag.color}; display: inline-block; padding: 4px 12px; border-radius: 12px; margin: 2px; font-size: 13px;">
                                ${tag.icon} ${tag.label}
                            </span>
                        `).join('')}
                        ${weather ? `<span class="mood-tag weather-tag" style="display: inline-block; padding: 4px 12px; border-radius: 12px; margin: 2px; font-size: 13px; background: #f0f0f0;">${weather.icon} ${weather.label}</span>` : ''}
                    </div>
                </div>
                ${entry.content ? `
                    <div class="mood-content-section" style="margin-bottom: 16px;">
                        <div class="mood-content-label" style="font-size: 14px; color: #666; margin-bottom: 8px;">随笔</div>
                        <div class="mood-content-text" style="background: #f9f9f9; padding: 12px; border-radius: 8px; line-height: 1.6; white-space: pre-wrap;">${_esc(entry.content)}</div>
                    </div>
                ` : ''}
                ${gratitudeList.length > 0 ? `
                    <div class="mood-gratitude-section">
                        <div class="mood-content-label" style="font-size: 14px; color: #666; margin-bottom: 8px;">🙏 感恩列表</div>
                        <ul class="gratitude-list" style="list-style: none; padding: 0; margin: 0;">
                            ${gratitudeList.map((item, i) => `
                                <li style="padding: 8px 12px; background: #fff9e6; border-radius: 6px; margin-bottom: 6px;">${i + 1}. ${_esc(item)}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                <div class="mt-lg" style="margin-top: 20px;">
                    <button class="btn btn-primary btn-block" id="moodEditEntryBtn">编辑记录</button>
                </div>
            </div>
        `;

        App.openModal(dateLabel, html, {
            onOpen: () => {
                document.getElementById('moodEditEntryBtn')?.addEventListener('click', () => {
                    App.closeModal();
                    _openMoodModal(dateStr);
                });
            }
        });
    }

    // ============================================================
    // 11. AI 日记页面
    // ============================================================

    /**
     * 打开AI日记页面
     */
    function _openAiDiary() {
        const today = _today();
        let diaryEntry = data.aiDiary.entries[today];

        // 如果今天还没生成，立即生成
        if (!diaryEntry) {
            _generateAiDiaryForDate(today);
            diaryEntry = data.aiDiary.entries[today];
        }

        currentAiDiaryDate = today;
        _renderAiDiaryModal();
    }

    /**
     * 渲染AI日记模态框
     */
    function _renderAiDiaryModal() {
        const dateStr = currentAiDiaryDate;
        const diaryEntry = data.aiDiary.entries[dateStr];
        const dateLabel = _formatDateShort(dateStr);

        // 计算前后日期
        const prevDate = new Date(dateStr);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = App.formatDate(prevDate);
        const nextDate = new Date(dateStr);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextDateStr = App.formatDate(nextDate);
        const today = _today();
        const canGoNext = nextDateStr <= today;

        const hasPrev = !!data.aiDiary.entries[prevDateStr] || prevDateStr < today;

        let contentHtml = '';
        if (diaryEntry && diaryEntry.content) {
            const content = diaryEntry.content;
            const generatedTime = new Date(diaryEntry.generatedAt);
            const timeStr = `${String(generatedTime.getHours()).padStart(2, '0')}:${String(generatedTime.getMinutes()).padStart(2, '0')}`;

            contentHtml = `
                <div class="ai-diary-content">
                    <div class="ai-diary-header">
                        <div class="ai-diary-date-nav">
                            <button class="btn-icon btn-sm" data-action="ai-diary-prev" ${hasPrev ? '' : 'disabled'} title="前一天">◀</button>
                            <span class="ai-diary-date-label">${dateLabel}</span>
                            <button class="btn-icon btn-sm" data-action="ai-diary-next" ${canGoNext ? '' : 'disabled'} title="后一天">▶</button>
                        </div>
                        <div class="ai-diary-time">生成于 ${timeStr}</div>
                    </div>

                    <div class="ai-diary-section">
                        <div class="ai-diary-section-title">🌈 心情总结</div>
                        <div class="ai-diary-section-text">${_esc(content.moodSummary)}</div>
                    </div>

                    <div class="ai-diary-section">
                        <div class="ai-diary-section-title">🔍 模式发现</div>
                        <div class="ai-diary-section-text">${_esc(content.patternDiscovery)}</div>
                    </div>

                    <div class="ai-diary-section">
                        <div class="ai-diary-section-title">💡 洞察与建议</div>
                        <div class="ai-diary-section-text">${_esc(content.insightAdvice)}</div>
                    </div>

                    <div class="ai-diary-section ai-diary-question">
                        <div class="ai-diary-section-title">🤔 思考问题</div>
                        <div class="ai-diary-question-text">${_esc(content.thinkingQuestion)}</div>
                    </div>
                </div>
            `;
        } else {
            contentHtml = `
                <div class="empty-state">
                    <div class="empty-state-icon">🤖</div>
                    <div class="empty-state-text">这一天还没有AI日记</div>
                    <div class="empty-state-desc">每天凌晨4点自动生成，也可以手动生成</div>
                    <div class="mt-lg">
                        <button class="btn btn-primary" id="generateAiDiaryBtn">立即生成</button>
                    </div>
                </div>
            `;
        }

        App.openModal('🤖 AI 日记分析', contentHtml, {
            onOpen: () => {
                // 绑定日期导航
                document.querySelector('[data-action="ai-diary-prev"]')?.addEventListener('click', () => {
                    const d = new Date(currentAiDiaryDate);
                    d.setDate(d.getDate() - 1);
                    const newDate = App.formatDate(d);
                    if (newDate < today) {
                        currentAiDiaryDate = newDate;
                        // 如果没有数据，自动生成
                        if (!data.aiDiary.entries[currentAiDiaryDate]) {
                            _generateAiDiaryForDate(currentAiDiaryDate);
                        }
                        App.closeModal();
                        _renderAiDiaryModal();
                    }
                });

                document.querySelector('[data-action="ai-diary-next"]')?.addEventListener('click', () => {
                    const d = new Date(currentAiDiaryDate);
                    d.setDate(d.getDate() + 1);
                    const newDate = App.formatDate(d);
                    if (newDate <= today) {
                        currentAiDiaryDate = newDate;
                        App.closeModal();
                        _renderAiDiaryModal();
                    }
                });

                // 生成按钮
                document.getElementById('generateAiDiaryBtn')?.addEventListener('click', () => {
                    _generateAiDiaryForDate(currentAiDiaryDate);
                    App.closeModal();
                    _renderAiDiaryModal();
                    App.showSuccess('AI日记已生成');
                });
            }
        });
    }

    // ============================================================
    // 12. AI 数据分析页面
    // ============================================================

    /**
     * 打开AI数据分析页面
     */
    function _openAiAnalysis() {
        const analysis = _getFullAiAnalysis();

        const html = `
            <div class="ai-analysis-page">
                <div class="ai-analysis-header">
                    <div class="ai-analysis-title">📊 AI 数据分析</div>
                    <div class="ai-analysis-subtitle">基于你的多模块数据，洞察生活模式</div>
                </div>

                <!-- 分析卡片1：最近反复做的事 -->
                <div class="card ai-analysis-card">
                    <div class="ai-analysis-card-header">
                        <span class="ai-analysis-card-icon">🔁</span>
                        <span class="ai-analysis-card-title">最近反复做的事</span>
                    </div>
                    <div class="ai-analysis-card-body">
                        ${_renderFrequentActivitiesContent(analysis.frequentActivities)}
                    </div>
                </div>

                <!-- 分析卡片2：时间的联系 -->
                <div class="card ai-analysis-card">
                    <div class="ai-analysis-card-header">
                        <span class="ai-analysis-card-icon">🔗</span>
                        <span class="ai-analysis-card-title">时间的联系</span>
                    </div>
                    <div class="ai-analysis-card-body">
                        ${_renderTimeConnectionsContent(analysis.timeConnections)}
                    </div>
                </div>

                <!-- 分析卡片3：最近的变化 -->
                <div class="card ai-analysis-card">
                    <div class="ai-analysis-card-header">
                        <span class="ai-analysis-card-icon">📊</span>
                        <span class="ai-analysis-card-title">最近的变化</span>
                    </div>
                    <div class="ai-analysis-card-body">
                        ${_renderRecentChangesContent(analysis.recentChanges)}
                    </div>
                </div>

                <!-- 分析卡片4：给你一个灵感 -->
                <div class="card ai-analysis-card ai-inspiration-card">
                    <div class="ai-analysis-card-header">
                        <span class="ai-analysis-card-icon">💡</span>
                        <span class="ai-analysis-card-title">给你一个灵感</span>
                        <button class="btn-icon btn-sm ai-refresh-btn" data-action="refresh-inspiration" title="换一个">🔄</button>
                    </div>
                    <div class="ai-analysis-card-body" id="inspirationCardBody">
                        ${_renderInspirationContent(analysis.inspiration)}
                    </div>
                </div>

                <div class="ai-analysis-footer">
                    <div class="ai-analysis-tip">💡 数据越丰富，分析越准确。坚持记录，发现更真实的自己。</div>
                </div>
            </div>
        `;

        App.openModal('📊 AI 数据分析', html, {
            wide: true,
            onOpen: () => {
                // 绑定刷新灵感按钮
                document.querySelector('[data-action="refresh-inspiration"]')?.addEventListener('click', () => {
                    const newInspiration = _refreshInspiration();
                    const body = document.getElementById('inspirationCardBody');
                    if (body) {
                        body.innerHTML = _renderInspirationContent(newInspiration);
                    }
                    // 更新缓存
                    if (data.aiAnalysis.cache.fullAnalysis) {
                        data.aiAnalysis.cache.fullAnalysis.inspiration = newInspiration;
                    }
                });
            }
        });
    }

    /**
     * 渲染高频活动内容
     */
    function _renderFrequentActivitiesContent(data) {
        const { activities, description } = data;

        let activitiesHtml = '';
        if (activities && activities.length > 0) {
            activitiesHtml = `
                <div class="frequent-activities-list">
                    ${activities.slice(0, 5).map((a, i) => `
                        <div class="frequent-activity-item">
                            <div class="frequent-activity-rank">${i + 1}</div>
                            <div class="frequent-activity-icon" style="background: ${a.color || '#eee'}20;">${a.icon}</div>
                            <div class="frequent-activity-info">
                                <div class="frequent-activity-name">${a.name}</div>
                                <div class="frequent-activity-detail">
                                    ${a.count}次 / 7天
                                    ${a.detail ? ` · ${a.detail}` : ''}
                                    ${a.streak >= 3 ? ` · 🔥连续${a.streak}天` : ''}
                                </div>
                            </div>
                            <div class="frequent-activity-bar">
                                <div class="frequent-activity-bar-fill" style="width: ${(a.count / 7) * 100}%; background: ${a.color || '#7ec8a7'};"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return `
            ${activitiesHtml}
            <div class="ai-analysis-desc">${_esc(description).replace(/\n\n/g, '<br><br>')}</div>
        `;
    }

    /**
     * 渲染时间联系内容
     */
    function _renderTimeConnectionsContent(data) {
        const { insights } = data;

        return `
            <div class="time-connections-list">
                ${insights.map(insight => `
                    <div class="connection-item">
                        <div class="connection-icon">${insight.icon}</div>
                        <div class="connection-content">
                            <div class="connection-title">${_esc(insight.title)}</div>
                            <div class="connection-detail">${_esc(insight.detail)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * 渲染最近变化内容
     */
    function _renderRecentChangesContent(data) {
        const { changes, description } = data;

        let changesHtml = '';
        if (changes && changes.length > 0) {
            changesHtml = `
                <div class="recent-changes-list">
                    ${changes.slice(0, 6).map(change => {
                        const isRising = change.diff > 0;
                        const diffText = change.diffText || (isRising ? `+${change.diff}` : change.diff);
                        return `
                            <div class="change-item">
                                <div class="change-icon" style="background: ${change.color || '#eee'}20;">${change.icon}</div>
                                <div class="change-info">
                                    <div class="change-name">${change.name}</div>
                                    ${change.detail ? `<div class="change-detail">${_esc(change.detail)}</div>` : ''}
                                </div>
                                <div class="change-value ${isRising ? 'rising' : 'falling'}">
                                    ${isRising ? '↑' : '↓'} ${diffText}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        return `
            ${changesHtml}
            <div class="ai-analysis-desc">${_esc(description).replace(/\n\n/g, '<br><br>')}</div>
        `;
    }

    /**
     * 渲染灵感问题内容
     */
    function _renderInspirationContent(inspiration) {
        if (!inspiration) return '';

        return `
            <div class="inspiration-content">
                <div class="inspiration-category">${_esc(inspiration.category || '今日灵感')}</div>
                <div class="inspiration-question">${_esc(inspiration.question || '')}</div>
            </div>
        `;
    }

    // ============================================================
    // 13. 事件绑定
    // ============================================================

    function _bindEvents() {
        if (!containerEl) return;

        // AI日记入口
        containerEl.querySelector('[data-action="open-ai-diary"]')?.addEventListener('click', () => {
            _openAiDiary();
        });

        // AI分析入口
        containerEl.querySelector('[data-action="open-ai-analysis"]')?.addEventListener('click', () => {
            _openAiAnalysis();
        });

        // 编辑今日心情
        containerEl.querySelector('[data-action="edit-today"]')?.addEventListener('click', () => {
            _openMoodModal(_today());
        });

        // 今日卡片点击
        containerEl.querySelector('.today-empty-card')?.addEventListener('click', () => {
            _openMoodModal(_today());
        });

        // 历史记录月份筛选
        containerEl.querySelector('#historyMonthSelect')?.addEventListener('change', () => {
            _renderTimeline();
        });

        // 时间线条目编辑
        containerEl.querySelectorAll('[data-action="edit-entry"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _openMoodModal(btn.dataset.date);
            });
        });

        // 时间线条目删除
        containerEl.querySelectorAll('[data-action="delete-entry"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _deleteEntry(btn.dataset.date);
            });
        });

        // 时间线卡片点击编辑
        containerEl.querySelectorAll('.timeline-item .card-clickable').forEach(card => {
            card.addEventListener('click', () => {
                const date = card.closest('.timeline-item')?.dataset.date;
                if (date) _openMoodModal(date);
            });
        });

        // 前一天
        containerEl.querySelector('[data-action="prev-day-mood"]')?.addEventListener('click', () => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() - 1);
            currentDate = App.formatDate(d);
            _updateDateNav();
        });

        // 后一天
        containerEl.querySelector('[data-action="next-day-mood"]')?.addEventListener('click', () => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() + 1);
            currentDate = App.formatDate(d);
            _updateDateNav();
        });

        // 切换日历显示
        containerEl.querySelector('[data-action="toggle-calendar"]')?.addEventListener('click', () => {
            showCalendar = !showCalendar;
            const card = containerEl.querySelector('#moodCalendarCard');
            if (card) {
                card.style.display = showCalendar ? '' : 'none';
            }
            if (showCalendar) {
                _refreshCalendar();
            }
        });

        // 上一月
        containerEl.querySelector('[data-action="prev-month-mood"]')?.addEventListener('click', () => {
            calendarMonth--;
            if (calendarMonth < 0) {
                calendarMonth = 11;
                calendarYear--;
            }
            _refreshCalendar();
        });

        // 下一月
        containerEl.querySelector('[data-action="next-month-mood"]')?.addEventListener('click', () => {
            calendarMonth++;
            if (calendarMonth > 11) {
                calendarMonth = 0;
                calendarYear++;
            }
            _refreshCalendar();
        });

        // 日历日期点击
        containerEl.querySelectorAll('[data-action="mood-cal-day"]').forEach(day => {
            day.addEventListener('click', () => {
                const dateStr = day.dataset.date;
                if (dateStr) {
                    currentDate = dateStr;
                    _updateDateNav();
                    _viewMoodDay(dateStr);
                }
            });
        });
    }

    function _updateDateNav() {
        const label = containerEl.querySelector('#moodDateLabel');
        if (label) {
            label.textContent = _formatDateShort(currentDate);
        }
        // 同步更新日历中的选中状态
        if (showCalendar) {
            _refreshCalendar();
        }
    }

    function _refreshCalendar() {
        const container = containerEl.querySelector('#moodCalendarContainer');
        const title = containerEl.querySelector('#moodCalendarTitle');
        if (container) {
            container.innerHTML = _renderMoodCalendar();
        }
        if (title) {
            title.textContent = `${calendarYear}年${calendarMonth + 1}月`;
        }
        // 重新绑定日历日期点击事件
        container?.querySelectorAll('[data-action="mood-cal-day"]').forEach(day => {
            day.addEventListener('click', () => {
                const dateStr = day.dataset.date;
                if (dateStr) {
                    currentDate = dateStr;
                    _updateDateNav();
                    _viewMoodDay(dateStr);
                }
            });
        });
    }

    // ============================================================
    // 14. onAdd - 顶部添加按钮回调
    // ============================================================
    function onAdd() {
        _openMoodModal(_today());
    }

    // ============================================================
    // 15. onResume - 页面恢复时刷新
    // ============================================================
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
    App.registerModule('mood', MoodModule);
}
