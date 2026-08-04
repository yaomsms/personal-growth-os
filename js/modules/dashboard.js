/**
 * dashboard.js - 首页仪表盘模块（与待办合并版 + 日历总回顾）
 *
 * 功能：
 *   1. 欢迎横幅 + 日期问候
 *   2. 今日待办列表（核心），与各模块数据联动
 *   3. 每个待办项：勾选框 + 图标 + 名称 + 照片上传按钮 + 跳转模块
 *   4. 照片上传与对应模块数据同步
 *   5. 最近7天完成统计
 *   6. 月度打卡日历（总回顾：点击日期查看当天所有模块记录）
 *   7. 快捷功能入口
 */

(function() {
    'use strict';

    // ============================================================
    // 1. 模块状态
    // ============================================================
    const state = {
        calendarYear: new Date().getFullYear(),
        calendarMonth: new Date().getMonth(),
        selectedDate: null,
        currentDate: null,
    };

    // 联动模块配置 - 待办项与模块的映射
    const MODULE_LINKS = {
        't_english': { module: 'english', label: '英语学习', icon: '📚', color: '#7ec8a7' },
        't_pr':      { module: 'pr',      label: 'PR剪辑学习', icon: '🎬', color: '#c9b8e0' },
        't_ai':      { module: 'ai',      label: 'AI工具学习', icon: '🤖', color: '#a8c9e8' },
        't_drawing': { module: 'drawing', label: '绘画练习', icon: '🎨', color: '#f4b8c4' },
        't_attendance': { module: 'attendance', label: '上下班考勤', icon: '🕐', color: '#f5c89a' },
        't_mood':    { module: 'mood',    label: '记录今日心情', icon: '💭', color: '#ffd966' },
    };

    // 总回顾模块配置（日历上显示的所有模块）
    const REVIEW_MODULES = [
        { key: 'english',  label: '英语',    icon: '📚', color: '#7ec8a7' },
        { key: 'pr',       label: 'PR剪辑',  icon: '🎬', color: '#c9b8e0' },
        { key: 'ai',       label: 'AI工具',  icon: '🤖', color: '#a8c9e8' },
        { key: 'drawing',  label: '绘画',    icon: '🎨', color: '#f4b8c4' },
        { key: 'schedule', label: '时间规划', icon: '⏰', color: '#5b9bd5' },
        { key: 'mood',     label: '心情',    icon: '💭', color: '#ffd966' },
        { key: 'attendance', label: '考勤',  icon: '🕐', color: '#f5c89a' },
    ];

    // ============================================================
    // 2. 工具函数
    // ============================================================

    function getToday() {
        return App.formatDate(new Date());
    }

    function _getDayLabel(dateStr) {
        const d = new Date(dateStr);
        const days = ['日', '一', '二', '三', '四', '五', '六'];
        return '周' + days[d.getDay()];
    }

    function _formatDateShort(dateStr) {
        const d = new Date(dateStr);
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        return `${d.getMonth() + 1}月${d.getDate()}日 周${weekDays[d.getDay()]}`;
    }

    function _getUserName() {
        const user = AppStorage.getUser() || {};
        return user.name || '成长者';
    }

    function _getGreeting() {
        const hour = new Date().getHours();
        if (hour < 6) return '夜深了';
        if (hour < 9) return '早上好';
        if (hour < 12) return '上午好';
        if (hour < 14) return '中午好';
        if (hour < 18) return '下午好';
        if (hour < 22) return '晚上好';
        return '夜深了';
    }

    function _getFullDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const weekDay = App.getDayOfWeek(now);
        return `${year}年${month}月${day}日 ${weekDay}`;
    }

    function _getDayOfWeek(dateStr) {
        const d = new Date(dateStr);
        return d.getDay(); // 0=周日, 1=周一, ..., 6=周六
    }

    // ============================================================
    // 3. 智能默认待办（根据星期几生成不同任务）
    // ============================================================

    /**
     * 根据日期生成默认待办列表
     */
    function _getDefaultTasksForDate(dateStr) {
        const dayOfWeek = _getDayOfWeek(dateStr);
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
        const isMonWedFri = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
        const isTueThuSat = dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 6;

        const tasks = [];
        let order = 0;

        // 英语：每天都有
        tasks.push({
            id: 't_english',
            name: '英语学习',
            icon: '📚',
            completed: false,
            order: order++,
            moduleLink: 'english',
        });

        // 绘画：每天都有（10分钟起稿 + 20分钟描图）
        tasks.push({
            id: 't_drawing',
            name: '绘画练习',
            icon: '🎨',
            completed: false,
            order: order++,
            moduleLink: 'drawing',
            note: '10分钟起稿 + 20分钟描图',
        });

        // PR剪辑：每天都有
        tasks.push({
            id: 't_pr',
            name: 'PR剪辑学习',
            icon: '🎬',
            completed: false,
            order: order++,
            moduleLink: 'pr',
            note: '跟随AI视频学习',
        });

        // AI工具：每天都有
        tasks.push({
            id: 't_ai',
            name: 'AI工具学习',
            icon: '🤖',
            completed: false,
            order: order++,
            moduleLink: 'ai',
        });

        // 工作日：上下班考勤
        if (isWeekday) {
            tasks.push({
                id: 't_attendance',
                name: '上下班考勤',
                icon: '🕐',
                completed: false,
                order: order++,
                moduleLink: 'attendance',
            });
        }

        // 每天：记录心情
        tasks.push({
            id: 't_mood',
            name: '记录今日心情',
            icon: '💭',
            completed: false,
            order: order++,
            moduleLink: 'mood',
        });

        return tasks;
    }

    // ============================================================
    // 4. 待办数据管理
    // ============================================================

    function _getTodoTasks(dateStr) {
        // 直接从存储读取（最可靠）
        const todoData = AppStorage.getModule('todo') || {};
        if (!todoData.tasks) todoData.tasks = {};

        // 如果今天没有任务，用智能默认任务初始化
        if (!todoData.tasks[dateStr] || todoData.tasks[dateStr].length === 0) {
            if (dateStr === getToday()) {
                todoData.tasks[dateStr] = _getDefaultTasksForDate(dateStr);
                AppStorage.setModule('todo', todoData);
            } else {
                todoData.tasks[dateStr] = [];
            }
        }

        return todoData.tasks[dateStr].sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    function _toggleTodoTask(dateStr, taskId) {
        const todoData = AppStorage.getModule('todo') || { tasks: {} };
        if (!todoData.tasks) todoData.tasks = {};
        if (!todoData.tasks[dateStr]) return;

        const task = todoData.tasks[dateStr].find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            AppStorage.setModule('todo', todoData);
        }
    }

    function _addTodoTask(dateStr, name, icon) {
        const todoData = AppStorage.getModule('todo') || { tasks: {} };
        if (!todoData.tasks) todoData.tasks = {};
        if (!todoData.tasks[dateStr]) todoData.tasks[dateStr] = [];

        const newTask = {
            id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: name,
            icon: icon || '📌',
            completed: false,
            order: todoData.tasks[dateStr].length,
        };
        todoData.tasks[dateStr].push(newTask);
        AppStorage.setModule('todo', todoData);
        return newTask;
    }

    function _deleteTodoTask(dateStr, taskId) {
        const todoData = AppStorage.getModule('todo') || { tasks: {} };
        if (!todoData.tasks || !todoData.tasks[dateStr]) return;
        const idx = todoData.tasks[dateStr].findIndex(t => t.id === taskId);
        if (idx > -1) {
            todoData.tasks[dateStr].splice(idx, 1);
            AppStorage.setModule('todo', todoData);
        }
    }

    // ============================================================
    // 5. 模块联动 - 检查某模块某日是否已完成
    // ============================================================

    function _checkModuleCompleted(moduleKey, dateStr) {
        switch(moduleKey) {
            case 'english':
                return _checkEnglishCompleted(dateStr);
            case 'pr':
                return _checkPRCompleted(dateStr);
            case 'ai':
                return _checkAICompleted(dateStr);
            case 'drawing':
                return _checkDrawingCompleted(dateStr);
            case 'schedule':
                return _checkScheduleCompleted(dateStr);
            case 'attendance':
                return _checkAttendanceCompleted(dateStr);
            case 'mood':
                return _checkMoodCompleted(dateStr);
            case 'habits':
                return _checkHabitsCompleted(dateStr);
            default:
                return false;
        }
    }

    function _checkEnglishCompleted(dateStr) {
        const data = AppStorage.getModule('english') || {};
        if (data.checkinRecords && data.checkinRecords[dateStr]) return true;
        const categories = ['words', 'phrases', 'texts', 'exercises'];
        for (const cat of categories) {
            if (data[cat] && data[cat].some(item => {
                const itemDate = item.date || (item.createdAt ? App.formatDate(new Date(item.createdAt)) : null);
                return itemDate === dateStr;
            })) return true;
        }
        return false;
    }

    function _checkPRCompleted(dateStr) {
        const data = AppStorage.getModule('pr') || {};
        if (data.courses) {
            const hasStudy = data.courses.some(c => {
                if (c.studyRecords && c.studyRecords[dateStr]) return true;
                if (c.media && c.media.some(m => {
                    const mDate = m.date || (m.createdAt ? App.formatDate(new Date(m.createdAt)) : null);
                    return mDate === dateStr;
                })) return true;
                return false;
            });
            if (hasStudy) return true;
        }
        if (data.dailyRecord && data.dailyRecord.records && data.dailyRecord.records[dateStr]) {
            const recs = Array.isArray(data.dailyRecord.records[dateStr])
                ? data.dailyRecord.records[dateStr]
                : [data.dailyRecord.records[dateStr]];
            if (recs.some(r => r.duration > 0)) return true;
        }
        return false;
    }

    function _checkAICompleted(dateStr) {
        const data = AppStorage.getModule('ai') || {};
        if (data.dailyRecord && data.dailyRecord.records && data.dailyRecord.records[dateStr]) {
            const recs = Array.isArray(data.dailyRecord.records[dateStr])
                ? data.dailyRecord.records[dateStr]
                : [data.dailyRecord.records[dateStr]];
            if (recs.some(r => r.duration > 0)) return true;
        }
        return false;
    }

    function _checkDrawingCompleted(dateStr) {
        const data = AppStorage.getModule('drawing') || {};
        if (data.dailyRecords && data.dailyRecords[dateStr]) {
            const rec = data.dailyRecords[dateStr];
            if (rec.thoughts || (rec.images && rec.images.length > 0) ||
                (rec.todos && Object.keys(rec.todos).some(k => rec.todos[k]))) {
                return true;
            }
        }
        return false;
    }

    function _checkAttendanceCompleted(dateStr) {
        const data = AppStorage.getModule('attendance') || {};
        if (data.records && data.records[dateStr]) {
            const rec = data.records[dateStr];
            if (rec.morningStatus && rec.morningStatus !== 'missing' &&
                rec.eveningStatus && rec.eveningStatus !== 'missing') {
                return true;
            }
        }
        return false;
    }

    // ============================================================
    // 4.5 考勤快捷打卡
    // ============================================================

    function _getAttendanceQuickStatus() {
        try {
            const data = AppStorage.getModule('attendance') || {};
            const settings = data.settings || { workDays: [1, 2, 3, 4, 5], workStartTime: '09:00', workEndTime: '18:00', lunchBreak: 1.5 };
            const today = getToday();
            const record = data.records && data.records[today];
            const dayOfWeek = new Date(today).getDay();
            const isWorkDay = settings.workDays.includes(dayOfWeek);

            // 休息日判断：设置为休息日 或 非工作日且无打卡记录
            if (record && record.isRestDay) {
                return { isRestDay: true, morningStatus: 'rest', eveningStatus: 'rest', morningTime: '', eveningTime: '' };
            }
            if (!isWorkDay && (!record || (record.morningStatus === 'missing' && record.eveningStatus === 'missing'))) {
                return { isRestDay: true, morningStatus: 'rest', eveningStatus: 'rest', morningTime: '', eveningTime: '' };
            }

            return {
                isRestDay: false,
                morningStatus: record ? (record.morningStatus || 'missing') : 'missing',
                morningTime: record ? (record.morningCheckInTime || '') : '',
                eveningStatus: record ? (record.eveningStatus || 'missing') : 'missing',
                eveningTime: record ? (record.eveningCheckInTime || '') : '',
            };
        } catch (err) {
            console.error('获取考勤状态失败:', err);
            return { isRestDay: false, morningStatus: 'missing', morningTime: '', eveningStatus: 'missing', eveningTime: '' };
        }
    }

    function _quickCheckIn(type) {
        try {
            const data = AppStorage.getModule('attendance') || {};
            if (!data.records) data.records = {};
            if (!data.settings) {
                data.settings = { workStartTime: '09:00', workEndTime: '18:00', lunchBreak: 1.5, workDays: [1, 2, 3, 4, 5] };
            }

            const today = getToday();
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            if (!data.records[today]) {
                data.records[today] = {
                    date: today,
                    morningStatus: 'missing',
                    eveningStatus: 'missing',
                    morningCheckInTime: '',
                    eveningCheckInTime: '',
                    diary: '',
                    media: [],
                    workHours: 0,
                    note: '',
                    statusText: '',
                    isRestDay: false,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };
            }

            const rec = data.records[today];

            if (type === 'morning') {
                // 判断是否迟到
                const [startH, startM] = data.settings.workStartTime.split(':').map(Number);
                const [nowH, nowM] = timeStr.split(':').map(Number);
                const isLate = (nowH * 60 + nowM) > (startH * 60 + startM);
                rec.morningStatus = isLate ? 'late' : 'normal';
                rec.morningCheckInTime = timeStr;
            } else if (type === 'evening') {
                // 判断是否早退
                const [endH, endM] = data.settings.workEndTime.split(':').map(Number);
                const [nowH, nowM] = timeStr.split(':').map(Number);
                const isEarly = (nowH * 60 + nowM) < (endH * 60 + endM);
                rec.eveningStatus = isEarly ? 'early' : 'normal';
                rec.eveningCheckInTime = timeStr;
            }

            rec.updatedAt = Date.now();

            // 自动计算工时
            if (rec.morningCheckInTime && rec.eveningCheckInTime) {
                const [mH, mM] = rec.morningCheckInTime.split(':').map(Number);
                const [eH, eM] = rec.eveningCheckInTime.split(':').map(Number);
                const diffMinutes = (eH * 60 + eM) - (mH * 60 + mM);
                const lunchMinutes = (data.settings.lunchBreak || 1.5) * 60;
                const workMinutes = Math.max(0, diffMinutes - lunchMinutes);
                rec.workHours = Math.round(workMinutes / 60 * 10) / 10;
            }

            AppStorage.setModule('attendance', data);
            return true;
        } catch (err) {
            console.error('快捷打卡失败:', err);
            App.showToast('打卡失败，请重试');
            return false;
        }
    }

    function _checkMoodCompleted(dateStr) {
        const data = AppStorage.getModule('mood') || {};
        if (data.entries && data.entries[dateStr]) return true;
        return false;
    }

    function _checkHabitsCompleted(dateStr) {
        const data = AppStorage.getModule('habits') || {};
        const dailyHabits = data.dailyHabits || [];
        const habitRecords = data.habitRecords || {};
        const dayRecord = habitRecords[dateStr] || {};
        const completed = dailyHabits.filter(h => dayRecord[h.id]).length;
        return completed > 0 && completed >= Math.ceil(dailyHabits.length / 2);
    }

    function _checkScheduleCompleted(dateStr) {
        const data = AppStorage.getModule('schedule') || {};
        if (data.dailyCheckins && data.dailyCheckins[dateStr]) {
            const checkin = data.dailyCheckins[dateStr];
            // 新数据结构：blocks
            if (checkin.blocks) {
                const completedCount = Object.values(checkin.blocks).filter(b => b.completed).length;
                return completedCount > 0;
            }
            // 兼容旧数据
            return checkin.completed && checkin.completed.length > 0;
        }
        return false;
    }

    // ============================================================
    // 6. 照片上传与同步
    // ============================================================

    function _getModulePhotoCount(moduleKey, dateStr) {
        switch(moduleKey) {
            case 'english':
                return _getEnglishPhotoCount(dateStr);
            case 'pr':
                return _getPRPhotoCount(dateStr);
            case 'drawing':
                return _getDrawingPhotoCount(dateStr);
            default:
                return 0;
        }
    }

    function _getEnglishPhotoCount(dateStr) {
        const data = AppStorage.getModule('english') || {};
        let count = 0;
        const categories = ['words', 'phrases', 'texts', 'exercises'];
        for (const cat of categories) {
            if (data[cat]) {
                for (const item of data[cat]) {
                    const itemDate = item.date || (item.createdAt ? App.formatDate(new Date(item.createdAt)) : null);
                    if (itemDate === dateStr && item.media && item.media.length > 0) {
                        count += item.media.filter(m => m.type === 'image').length;
                    }
                }
            }
        }
        return count;
    }

    function _getPRPhotoCount(dateStr) {
        const data = AppStorage.getModule('pr') || {};
        let count = 0;
        if (data.courses) {
            for (const course of data.courses) {
                if (course.media && course.media.length > 0) {
                    for (const m of course.media) {
                        const mDate = m.date || (m.createdAt ? App.formatDate(new Date(m.createdAt)) : null);
                        if (mDate === dateStr && m.type === 'image') count++;
                    }
                }
            }
        }
        return count;
    }

    function _getDrawingPhotoCount(dateStr) {
        const data = AppStorage.getModule('drawing') || {};
        if (data.dailyRecords && data.dailyRecords[dateStr] && data.dailyRecords[dateStr].images) {
            return data.dailyRecords[dateStr].images.length;
        }
        return 0;
    }

    function _uploadPhotoToModule(moduleKey, dateStr, imageData) {
        switch(moduleKey) {
            case 'english':
                _addPhotoToEnglish(dateStr, imageData);
                break;
            case 'pr':
                _addPhotoToPR(dateStr, imageData);
                break;
            case 'drawing':
                _addPhotoToDrawing(dateStr, imageData);
                break;
            default:
                break;
        }
    }

    function _addPhotoToEnglish(dateStr, imageData) {
        const data = AppStorage.getModule('english') || {};
        if (!data.words) data.words = [];

        let todayItem = data.words.find(w => w.date === dateStr && w.title === '📅 今日学习');
        if (!todayItem) {
            todayItem = {
                id: 'eng_today_' + dateStr,
                title: '📅 今日学习',
                content: '',
                date: dateStr,
                media: [],
                mastered: false,
                createdAt: Date.now(),
            };
            data.words.unshift(todayItem);
        }
        if (!todayItem.media) todayItem.media = [];
        todayItem.media.push({
            type: 'image',
            data: imageData,
            date: dateStr,
            createdAt: Date.now(),
        });

        if (!data.checkinRecords) data.checkinRecords = {};
        data.checkinRecords[dateStr] = { date: dateStr, timestamp: Date.now() };

        _updateEnglishStats(data);
        AppStorage.setModule('english', data);
    }

    function _updateEnglishStats(data) {
        if (!data.stats) data.stats = {};
        data.stats.totalWords = (data.words || []).length;
        data.stats.totalPhrases = (data.phrases || []).length;
        data.stats.totalTexts = (data.texts || []).length;
        data.stats.totalExercises = (data.exercises || []).length;
        data.stats.checkinDays = Object.keys(data.checkinRecords || {}).length;
    }

    function _addPhotoToPR(dateStr, imageData) {
        const data = AppStorage.getModule('pr') || {};
        if (!data.courses) data.courses = [];

        let todayCourse = data.courses.find(c => c.date === dateStr && c.title === '📅 今日学习');
        if (!todayCourse) {
            todayCourse = {
                id: 'pr_today_' + dateStr,
                title: '📅 今日学习',
                date: dateStr,
                duration: 0,
                progress: 0,
                note: '',
                media: [],
                createdAt: Date.now(),
            };
            data.courses.unshift(todayCourse);
        }
        if (!todayCourse.media) todayCourse.media = [];
        todayCourse.media.push({
            type: 'image',
            data: imageData,
            date: dateStr,
            createdAt: Date.now(),
        });

        AppStorage.setModule('pr', data);
    }

    function _addPhotoToDrawing(dateStr, imageData) {
        const data = AppStorage.getModule('drawing') || {};
        if (!data.dailyRecords) data.dailyRecords = {};
        if (!data.dailyRecords[dateStr]) {
            data.dailyRecords[dateStr] = {
                todos: {},
                thoughts: '',
                status: 'in_progress',
                images: [],
                customTasks: [],
                syncToPan: false,
            };
        }
        if (!data.dailyRecords[dateStr].images) {
            data.dailyRecords[dateStr].images = [];
        }
        data.dailyRecords[dateStr].images.push({
            type: 'image',
            data: imageData,
            createdAt: Date.now(),
        });

        AppStorage.setModule('drawing', data);
    }

    function _compressImage(file, maxWidth, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL('image/jpeg', quality || 0.7);
                    resolve(dataUrl);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // ============================================================
    // 7. 总回顾 - 获取某天所有模块的详细数据
    // ============================================================

    function _getDayReviewData(dateStr) {
        const result = {
            date: dateStr,
            weekday: _getDayLabel(dateStr),
            modules: {},
            todoTasks: [],
            totalModules: REVIEW_MODULES.length,
            completedModules: 0,
        };

        // 获取待办数据
        result.todoTasks = _getTodoTasks(dateStr);

        // 获取各模块数据
        for (const mod of REVIEW_MODULES) {
            const completed = _checkModuleCompleted(mod.key, dateStr);
            const detail = _getModuleDetail(mod.key, dateStr);
            result.modules[mod.key] = {
                ...mod,
                completed,
                ...detail,
            };
            if (completed) result.completedModules++;
        }

        return result;
    }

    function _getModuleDetail(moduleKey, dateStr) {
        switch(moduleKey) {
            case 'english':
                return _getEnglishDetail(dateStr);
            case 'pr':
                return _getPRDetail(dateStr);
            case 'ai':
                return _getAIDetail(dateStr);
            case 'drawing':
                return _getDrawingDetail(dateStr);
            case 'schedule':
                return _getScheduleDetail(dateStr);
            case 'mood':
                return _getMoodDetail(dateStr);
            case 'habits':
                return _getHabitsDetail(dateStr);
            case 'attendance':
                return _getAttendanceDetail(dateStr);
            default:
                return {};
        }
    }

    function _getEnglishDetail(dateStr) {
        const data = AppStorage.getModule('english') || {};
        let items = [];
        let photoCount = 0;
        const categories = ['words', 'phrases', 'texts', 'exercises'];
        const catLabels = { words: '单词', phrases: '短语', texts: '课文', exercises: '练习' };

        for (const cat of categories) {
            if (data[cat]) {
                const dayItems = data[cat].filter(item => {
                    const itemDate = item.date || (item.createdAt ? App.formatDate(new Date(item.createdAt)) : null);
                    return itemDate === dateStr;
                });
                for (const item of dayItems) {
                    items.push({
                        category: catLabels[cat],
                        title: item.title || item.word || item.content || '未命名',
                        hasMedia: item.media && item.media.length > 0,
                        media: item.media || [],
                    });
                    if (item.media) photoCount += item.media.filter(m => m.type === 'image').length;
                }
            }
        }

        return {
            items,
            photoCount,
            itemCount: items.length,
            summary: items.length > 0 ? `${items.length}条学习记录` : '暂无记录',
        };
    }

    function _getPRDetail(dateStr) {
        const data = AppStorage.getModule('pr') || {};
        let items = [];
        let photoCount = 0;
        let totalMinutes = 0;

        if (data.courses) {
            for (const course of data.courses) {
                const courseDate = course.date || (course.createdAt ? App.formatDate(new Date(course.createdAt)) : null);
                if (courseDate === dateStr) {
                    items.push({
                        title: course.title || '未命名课程',
                        duration: course.duration || 0,
                        note: course.note || '',
                        hasMedia: course.media && course.media.length > 0,
                        media: course.media || [],
                    });
                    if (course.media) photoCount += course.media.filter(m => m.type === 'image').length;
                    if (course.duration) totalMinutes += course.duration;
                }
            }
        }

        return {
            items,
            photoCount,
            itemCount: items.length,
            totalMinutes,
            summary: items.length > 0 ? `${items.length}个学习内容 / ${totalMinutes}分钟` : '暂无记录',
        };
    }

    function _getAIDetail(dateStr) {
        const data = AppStorage.getModule('ai') || {};
        let items = [];
        let totalMinutes = 0;

        if (data.dailyRecord && data.dailyRecord.records && data.dailyRecord.records[dateStr]) {
            const recs = Array.isArray(data.dailyRecord.records[dateStr])
                ? data.dailyRecord.records[dateStr]
                : [data.dailyRecord.records[dateStr]];
            for (const rec of recs) {
                items.push({
                    title: rec.content || rec.tool || 'AI学习',
                    duration: rec.duration || 0,
                });
                if (rec.duration) totalMinutes += rec.duration;
            }
        }

        return {
            items,
            photoCount: 0,
            itemCount: items.length,
            totalMinutes,
            summary: items.length > 0 ? `${items.length}条记录 / ${totalMinutes}分钟` : '暂无记录',
        };
    }

    function _getDrawingDetail(dateStr) {
        const data = AppStorage.getModule('drawing') || {};
        const record = data.dailyRecords && data.dailyRecords[dateStr];

        let items = [];
        let photoCount = 0;

        if (record) {
            if (record.images && record.images.length > 0) {
                photoCount = record.images.length;
                items.push({
                    title: '绘画作品',
                    count: record.images.length,
                    images: record.images,
                });
            }
            if (record.thoughts) {
                items.push({
                    title: '心得体会',
                    content: record.thoughts,
                });
            }
        }

        return {
            items,
            photoCount,
            itemCount: photoCount,
            summary: photoCount > 0 ? `${photoCount}张作品` : '暂无记录',
        };
    }

    function _getScheduleDetail(dateStr) {
        const data = AppStorage.getModule('schedule') || {};
        const checkin = data.dailyCheckins && data.dailyCheckins[dateStr];

        let items = [];
        let photoCount = 0;

        if (checkin) {
            const dayOfWeek = new Date(dateStr).getDay();
            let timeline = [];
            const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
            if (isWeekday) {
                timeline = data.workdayTimeline || [];
            } else if (dayOfWeek === 6) {
                timeline = data.saturdayTimeline || [];
            } else {
                timeline = data.sundayTimeline || [];
            }

            // 新数据结构：blocks
            let completedCount = 0;
            let completedItems = [];
            let allPhotoCount = 0;

            if (checkin.blocks) {
                timeline.forEach(block => {
                    const blockCheckin = checkin.blocks[block.id];
                    if (blockCheckin && blockCheckin.completed) {
                        completedCount++;
                        completedItems.push({
                            name: block.activity,
                            time: block.time,
                            subtasks: blockCheckin.subtasks || [],
                            images: blockCheckin.images || [],
                            note: blockCheckin.note || '',
                        });
                        allPhotoCount += (blockCheckin.images || []).length;
                    }
                });
            } else {
                // 兼容旧数据
                completedItems = timeline.filter(b =>
                    (checkin.completed || []).includes(b.id)
                ).map(b => ({
                    name: b.activity,
                    time: b.time,
                    subtasks: [],
                    images: [],
                    note: '',
                }));
                completedCount = completedItems.length;
                allPhotoCount = (checkin.images || []).length;
            }

            const totalCount = timeline.length;
            photoCount = allPhotoCount;

            if (completedItems.length > 0) {
                items.push({
                    type: 'completed',
                    count: completedCount,
                    total: totalCount,
                    list: completedItems,
                });
            }

            // 全天笔记
            if (checkin.note) {
                items.push({
                    type: 'note',
                    content: checkin.note,
                });
            }

            // 全天照片（兼容旧数据）
            if (!checkin.blocks && checkin.images && checkin.images.length > 0) {
                items.push({
                    type: 'images',
                    images: checkin.images,
                });
            }

            const summary = completedCount > 0
                ? `${completedCount}/${totalCount} 完成`
                : '暂无记录';

            return { items, photoCount, itemCount: completedCount, summary };
        }

        return { items: [], photoCount: 0, itemCount: 0, summary: '暂无记录' };
    }

    function _getMoodDetail(dateStr) {
        const data = AppStorage.getModule('mood') || {};
        const entry = data.entries && data.entries[dateStr];

        if (entry) {
            const moodTypes = data.moodTypes || [];
            const moodInfo = moodTypes.find(m => m.id === entry.moodId);
            return {
                items: [{
                    mood: moodInfo ? moodInfo.icon + ' ' + moodInfo.label : entry.moodId,
                    note: entry.note || '',
                }],
                photoCount: 0,
                itemCount: 1,
                summary: moodInfo ? moodInfo.icon + ' ' + moodInfo.label : '已记录',
            };
        }

        return { items: [], photoCount: 0, itemCount: 0, summary: '暂无记录' };
    }

    function _getHabitsDetail(dateStr) {
        const data = AppStorage.getModule('habits') || {};
        const dailyHabits = data.dailyHabits || [];
        const habitRecords = data.habitRecords || {};
        const dayRecord = habitRecords[dateStr] || {};

        const items = dailyHabits.map(h => ({
            name: h.name,
            icon: h.icon,
            completed: !!dayRecord[h.id],
        }));

        const completed = items.filter(i => i.completed).length;

        return {
            items,
            photoCount: 0,
            itemCount: completed,
            totalCount: dailyHabits.length,
            summary: `${completed}/${dailyHabits.length} 已完成`,
        };
    }

    function _getAttendanceDetail(dateStr) {
        const data = AppStorage.getModule('attendance') || {};
        const record = data.records && data.records[dateStr];

        if (record) {
            return {
                items: [{
                    morning: record.morningTime || '-',
                    morningStatus: record.morningStatus || 'missing',
                    evening: record.eveningTime || '-',
                    eveningStatus: record.eveningStatus || 'missing',
                    workHours: record.workHours || 0,
                }],
                photoCount: 0,
                itemCount: 1,
                summary: `工时 ${record.workHours || 0}h`,
            };
        }

        return { items: [], photoCount: 0, itemCount: 0, summary: '暂无记录' };
    }

    // ============================================================
    // 8. 渲染函数 - 欢迎横幅
    // ============================================================

    function renderGreeting() {
        const name = _getUserName();
        const fullDate = _getFullDateString();
        const greeting = _getGreeting();
        const today = getToday();
        const tasks = _getTodoTasks(today);
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        const encouragements = [
            '种一棵树最好的时间是十年前，其次是现在。',
            '每天进步一点点，坚持带来大改变。',
            '你今天的努力，是幸运的伏笔。',
            '保持热爱，奔赴山海。',
            '慢慢来，比较快。',
            '成长是一场和自己的比赛。',
        ];
        const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

        // 考勤快捷打卡状态
        const attStatus = _getAttendanceQuickStatus();
        const morningChecked = attStatus.morningStatus !== 'missing' && attStatus.morningStatus !== 'rest';
        const eveningChecked = attStatus.eveningStatus !== 'missing' && attStatus.eveningStatus !== 'rest';

        let quickAttendanceHtml = '';
        if (attStatus.isRestDay) {
            quickAttendanceHtml = `
                <div class="quick-attendance">
                    <div class="qa-rest-day">🏖️ 今日休息</div>
                    <div class="qa-detail-link" data-action="goto-module" data-module="attendance">查看详情 →</div>
                </div>
            `;
        } else {
            quickAttendanceHtml = `
                <div class="quick-attendance">
                    <div class="qa-buttons">
                        <button class="qa-btn ${morningChecked ? 'qa-btn-done' : ''}" 
                                data-action="quick-checkin" data-type="morning"
                                ${morningChecked ? 'disabled' : ''}>
                            <span class="qa-btn-icon">${morningChecked ? '✅' : '☀️'}</span>
                            <span class="qa-btn-text">${morningChecked ? '已打卡' : '上班打卡'}</span>
                            ${morningChecked ? `<span class="qa-btn-time">${attStatus.morningTime}</span>` : ''}
                        </button>
                        <button class="qa-btn ${eveningChecked ? 'qa-btn-done' : ''}" 
                                data-action="quick-checkin" data-type="evening"
                                ${eveningChecked ? 'disabled' : ''}>
                            <span class="qa-btn-icon">${eveningChecked ? '✅' : '🌙'}</span>
                            <span class="qa-btn-text">${eveningChecked ? '已打卡' : '下班打卡'}</span>
                            ${eveningChecked ? `<span class="qa-btn-time">${attStatus.eveningTime}</span>` : ''}
                        </button>
                    </div>
                    <div class="qa-detail-link" data-action="goto-module" data-module="attendance">查看详情 →</div>
                </div>
            `;
        }

        return `
            <div class="greeting-banner">
                <div class="greeting-banner-content">
                    <div class="greeting-title">${greeting}，${name} 👋</div>
                    <div class="greeting-subtitle">${encouragement}</div>
                    <div class="greeting-date">📅 ${fullDate}</div>
                    ${quickAttendanceHtml}
                </div>
                <div class="greeting-decoration">🌱</div>
            </div>

            <div class="today-progress-card card">
                <div class="tp-header">
                    <span class="tp-icon">📋</span>
                    <span class="tp-label">今日待办进度</span>
                    <span class="tp-count">${completed}/${total}</span>
                </div>
                <div class="progress progress-lg">
                    <div class="progress-bar" style="width: ${percent}%; background: linear-gradient(90deg, #7ec8a7, #4ecdc4);"></div>
                </div>
                <div class="tp-percent">${percent}% 完成</div>
            </div>
        `;
    }

    // ============================================================
    // 9. 渲染函数 - 今日待办列表
    // ============================================================

    function renderTodoList() {
        const today = getToday();
        const tasks = _getTodoTasks(today);
        const dayOfWeek = _getDayOfWeek(today);
        const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

        const allDone = tasks.length > 0 && tasks.every(t => t.completed);

        return `
            <div class="section-title">
                <h2><span class="title-icon">✅</span> 今日待办 <span class="subtitle-tag">${dayNames[dayOfWeek]}</span></h2>
            </div>

            <div class="home-todo-list">
                ${allDone ? `
                    <div class="all-done-banner">
                        <span class="all-done-icon">🎉</span>
                        <span class="all-done-text">太棒了！今日任务全部完成</span>
                    </div>
                ` : ''}

                ${tasks.length === 0 ? `
                    <div class="empty-state card">
                        <div class="empty-state-icon">📝</div>
                        <div class="empty-state-text">暂无待办事项</div>
                        <div class="empty-state-desc">点击下方按钮添加任务</div>
                    </div>
                ` : tasks.map(task => _renderTodoItem(task, today)).join('')}

                <div class="add-todo-section">
                    <button class="btn btn-outline btn-block" data-action="add-todo">
                        <span style="margin-right: 6px;">+</span>添加待办
                    </button>
                </div>
            </div>
        `;
    }

    function _renderTodoItem(task, dateStr) {
        const moduleLink = MODULE_LINKS[task.id];
        const hasModule = !!moduleLink;
        const photoCount = hasModule ? _getModulePhotoCount(moduleLink.module, dateStr) : 0;

        // 检查模块联动状态，如果模块已完成但待办没勾选，自动同步
        let moduleCompleted = false;
        if (hasModule) {
            moduleCompleted = _checkModuleCompleted(moduleLink.module, dateStr);
            if (moduleCompleted && !task.completed) {
                _toggleTodoTask(dateStr, task.id);
                task.completed = true;
            }
        }

        const itemColor = hasModule ? moduleLink.color : '#d0d0d0';

        return `
            <div class="home-todo-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="ht-main">
                    <label class="ht-checkbox">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} data-action="toggle-todo" data-id="${task.id}">
                        <span class="checkmark"></span>
                    </label>
                    <span class="ht-icon">${task.icon || '📌'}</span>
                    <div class="ht-info">
                        ${hasModule ? `
                            <span class="ht-name clickable" data-action="goto-module" data-module="${moduleLink.module}">
                                ${App.escapeHtml(task.name || '')}
                                <span class="ht-goto-arrow">→</span>
                            </span>
                        ` : `
                            <span class="ht-name">${App.escapeHtml(task.name || '')}</span>
                        `}
                        ${task.note ? `<span class="ht-note">${App.escapeHtml(task.note)}</span>` : ''}
                        ${hasModule ? `<span class="ht-module-tag" style="background: ${itemColor}20; color: ${itemColor};">联动 · ${moduleLink.label}</span>` : ''}
                    </div>
                </div>
                <div class="ht-actions">
                    <button class="ht-action-btn photo-btn" data-action="upload-photo" data-id="${task.id}" title="上传照片">
                        <span class="ht-btn-icon">📷</span>
                        ${photoCount > 0 ? `<span class="photo-badge">${photoCount}</span>` : ''}
                    </button>
                    <button class="ht-action-btn delete-btn" data-action="delete-todo" data-id="${task.id}" title="删除">
                        <span class="ht-btn-icon">🗑️</span>
                    </button>
                </div>
                <input type="file" class="photo-input-hidden" accept="image/*" data-id="${task.id}" style="display:none;">
            </div>
        `;
    }

    // ============================================================
    // 10. 渲染函数 - 最近7天统计
    // ============================================================

    function renderWeekStats() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = App.formatDate(d);
            const tasks = _getTodoTasks(dateStr);
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
                isToday: dateStr === getToday(),
            });
        }

        return `
            <div class="section-title">
                <h2><span class="title-icon">📊</span> 最近7天</h2>
            </div>
            <div class="card">
                <div class="week-stats-grid">
                    ${days.map(d => `
                        <div class="ws-col ${d.isToday ? 'today' : ''}" data-date="${d.date}">
                            <div class="ws-day-label">${d.dayLabel}</div>
                            <div class="ws-bar-wrap">
                                <div class="ws-bar" style="height: ${Math.max(8, d.percent)}%;"></div>
                            </div>
                            <div class="ws-num">${d.completed}/${d.total}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // ============================================================
    // 11. 渲染函数 - 快捷功能入口
    // ============================================================

    function renderQuickActions() {
        const actions = [
            { id: 'english', icon: '📚', label: '英语学习', page: 'english' },
            { id: 'pr', icon: '🎬', label: 'PR剪辑', page: 'pr' },
            { id: 'ai', icon: '🤖', label: 'AI工具', page: 'ai' },
            { id: 'drawing', icon: '🎨', label: '绘画练习', page: 'drawing' },
            { id: 'schedule', icon: '⏰', label: '时间规划', page: 'schedule' },
            { id: 'mood', icon: '💭', label: '心情日记', page: 'mood' },
        ];

        return `
            <div class="section-title">
                <h2><span class="title-icon">⚡</span> 快捷功能</h2>
            </div>
            <div class="quick-actions">
                ${actions.map(a => `
                    <div class="quick-action-item" data-page="${a.page}">
                        <div class="quick-action-icon">${a.icon}</div>
                        <div class="quick-action-label">${a.label}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ============================================================
    // 12. 渲染函数 - 月度打卡日历（总回顾）
    // ============================================================

    function renderCheckinCalendar() {
        const year = state.calendarYear;
        const month = state.calendarMonth;
        const today = getToday();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDayOfWeek = firstDay.getDay();
        const totalDays = lastDay.getDate();

        const weekStart = 1; // 周一为一周开始
        const adjustedStart = (startDayOfWeek - weekStart + 7) % 7;

        let daysHtml = '';
        const weekdayLabels = _getWeekdayLabels(weekStart);

        // 上月填充
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = adjustedStart - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            daysHtml += `<div class="calendar-day other-month"><span>${day}</span></div>`;
        }

        // 当月日期
        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === today;

            // 统计当天完成的模块数
            let completedCount = 0;
            const moduleDots = [];
            for (const mod of REVIEW_MODULES) {
                if (_checkModuleCompleted(mod.key, dateStr)) {
                    completedCount++;
                    moduleDots.push(`<span class="day-dot" style="background: ${mod.color};"></span>`);
                }
            }
            const hasData = completedCount > 0;
            const totalModules = REVIEW_MODULES.length;
            const percent = Math.round((completedCount / totalModules) * 100);

            daysHtml += `
                <div class="calendar-day cal-review-day ${isToday ? 'today' : ''} ${hasData ? 'has-data' : ''}" data-date="${dateStr}">
                    <span>${day}</span>
                    <div class="day-dots">
                        ${moduleDots.slice(0, 4).join('')}
                        ${moduleDots.length > 4 ? `<span class="day-dot-more">+${moduleDots.length - 4}</span>` : ''}
                    </div>
                    ${hasData ? `<div class="day-progress-text">${percent}%</div>` : ''}
                </div>
            `;
        }

        // 下月填充
        const totalCells = adjustedStart + totalDays;
        const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells;
        for (let i = 1; i <= remainingCells; i++) {
            daysHtml += `<div class="calendar-day other-month"><span>${i}</span></div>`;
        }

        const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

        return `
            <div class="section-title">
                <h2><span class="title-icon">📅</span> 月度总回顾</h2>
            </div>
            <div class="calendar card review-calendar" id="checkinCalendar">
                <div class="calendar-header">
                    <button class="calendar-nav-btn" id="prevMonth">‹</button>
                    <div class="calendar-title">${year}年 ${monthLabels[month]}</div>
                    <button class="calendar-nav-btn" id="nextMonth">›</button>
                </div>
                <div class="calendar-weekdays">
                    ${weekdayLabels.map(w => `<div class="calendar-weekday">${w}</div>`).join('')}
                </div>
                <div class="calendar-days">
                    ${daysHtml}
                </div>
                <div class="calendar-legend review-legend">
                    ${REVIEW_MODULES.slice(0, 5).map(m => `
                        <div class="cal-legend-item">
                            <span class="day-dot" style="background: ${m.color};"></span>${m.label}
                        </div>
                    `).join('')}
                </div>
                <div class="review-hint">💡 点击日期查看当天所有模块的详细记录</div>
            </div>
        `;
    }

    function _getWeekdayLabels(startDay) {
        const labels = ['日', '一', '二', '三', '四', '五', '六'];
        const result = [];
        for (let i = 0; i < 7; i++) {
            result.push(labels[(startDay + i) % 7]);
        }
        return result;
    }

    // ============================================================
    // 13. 总回顾 - 日期详情弹窗
    // ============================================================

    function _showDateReview(dateStr) {
        const reviewData = _getDayReviewData(dateStr);

        let modulesHtml = REVIEW_MODULES.map(mod => {
            const modData = reviewData.modules[mod.key];
            const isCompleted = modData.completed;

            return `
                <div class="review-module-section ${isCompleted ? 'completed' : ''}">
                    <div class="review-module-header" data-module="${mod.key}">
                        <span class="rm-icon">${mod.icon}</span>
                        <span class="rm-name">${mod.label}</span>
                        <span class="rm-status ${isCompleted ? 'done' : 'pending'}">
                            ${isCompleted ? '✓ 已完成' : '○ 未完成'}
                        </span>
                        <span class="rm-summary">${modData.summary}</span>
                        <span class="rm-arrow">›</span>
                    </div>
                    <div class="review-module-detail" data-module-detail="${mod.key}">
                        ${_renderModuleDetail(mod.key, modData)}
                    </div>
                </div>
            `;
        }).join('');

        const html = `
            <div class="day-review-modal">
                <div class="review-header">
                    <div class="review-date">${reviewData.date}</div>
                    <div class="review-weekday">${reviewData.weekday}</div>
                    <div class="review-overall">
                        <span class="review-overall-text">
                            ${reviewData.completedModules}/${reviewData.totalModules} 个模块已打卡
                        </span>
                        <div class="progress progress-sm">
                            <div class="progress-bar" style="width: ${Math.round(reviewData.completedModules / reviewData.totalModules * 100)}%;"></div>
                        </div>
                    </div>
                </div>

                <div class="review-modules-list">
                    ${modulesHtml}
                </div>
            </div>
        `;

        App.openModal('当日总回顾', html, {
            width: '95%',
            maxWidth: '500px',
            onOpen: () => {
                // 绑定模块展开/收起
                document.querySelectorAll('.review-module-header').forEach(header => {
                    header.addEventListener('click', () => {
                        const moduleKey = header.dataset.module;
                        const detail = document.querySelector(`[data-module-detail="${moduleKey}"]`);
                        if (detail) {
                            detail.classList.toggle('expanded');
                            header.classList.toggle('expanded');
                        }
                    });
                });

                // 跳转模块按钮
                document.querySelectorAll('[data-goto-module]').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const moduleKey = btn.dataset.gotoModule;
                        App.closeModal();
                        if (moduleKey) App.navigateTo(moduleKey);
                    });
                });
            },
        });
    }

    function _renderModuleDetail(moduleKey, modData) {
        if (!modData.items || modData.items.length === 0) {
            return `<div class="review-empty">当天暂无${modData.label || moduleKey}记录</div>`;
        }

        switch(moduleKey) {
            case 'english':
                return modData.items.map(item => `
                    <div class="review-item">
                        <span class="review-item-tag">${item.category}</span>
                        <span class="review-item-title">${item.title}</span>
                        ${item.hasMedia ? `<span class="review-item-media">📷 ${item.media.length}</span>` : ''}
                    </div>
                `).join('');

            case 'pr':
                return modData.items.map(item => `
                    <div class="review-item">
                        <span class="review-item-title">${item.title}</span>
                        <span class="review-item-meta">⏱️ ${item.duration}分钟</span>
                        ${item.hasMedia ? `<span class="review-item-media">📷 ${item.media.length}</span>` : ''}
                    </div>
                `).join('');

            case 'ai':
                return modData.items.map(item => `
                    <div class="review-item">
                        <span class="review-item-title">${item.title}</span>
                        <span class="review-item-meta">⏱️ ${item.duration}分钟</span>
                    </div>
                `).join('');

            case 'drawing':
                return modData.items.map(item => {
                    if (item.images && item.images.length > 0) {
                        return `
                            <div class="review-item-images">
                                ${item.images.slice(0, 4).map((img, idx) => `
                                    <div class="review-img-thumb">
                                        <img src="${img.data || img}" alt="作品${idx + 1}">
                                    </div>
                                `).join('')}
                                ${item.images.length > 4 ? `<span class="review-img-more">+${item.images.length - 4}</span>` : ''}
                            </div>
                        `;
                    }
                    if (item.content) {
                        return `<div class="review-item-note">${App.escapeHtml(item.content)}</div>`;
                    }
                    return '';
                }).join('');

            case 'schedule':
                return modData.items.map(item => {
                    if (item.type === 'completed') {
                        return `
                            <div class="review-schedule-list">
                                <div class="review-schedule-summary">
                                    完成 ${item.count}/${item.total} 个时间块
                                </div>
                                ${item.list.slice(0, 6).map(i => `
                                    <div class="review-schedule-item">
                                        <span class="rs-time">${i.time}</span>
                                        <span class="rs-name">${i.name}</span>
                                        <span class="rs-check">✓</span>
                                    </div>
                                    ${i.subtasks && i.subtasks.length > 0 ? `
                                        <div class="rs-subtasks">
                                            ${i.subtasks.slice(0, 3).map(st => `
                                                <span class="rs-subtask ${st.completed ? 'done' : ''}">
                                                    ${st.icon} ${st.name}
                                                </span>
                                            `).join('')}
                                            ${i.subtasks.length > 3 ? `<span class="rs-subtask-more">+${i.subtasks.length - 3}</span>` : ''}
                                        </div>
                                    ` : ''}
                                    ${i.images && i.images.length > 0 ? `
                                        <div class="rs-block-photos">
                                            ${i.images.slice(0, 3).map((img, idx) => `
                                                <div class="rs-photo-thumb">
                                                    <img src="${img.data}" alt="照片${idx + 1}">
                                                </div>
                                            `).join('')}
                                            ${i.images.length > 3 ? `<span class="rs-photo-more">+${i.images.length - 3}</span>` : ''}
                                        </div>
                                    ` : ''}
                                `).join('')}
                                ${item.list.length > 6 ? `<div class="review-more-hint">还有 ${item.list.length - 6} 项...</div>` : ''}
                            </div>
                        `;
                    }
                    if (item.type === 'note') {
                        return `<div class="review-item-note">${App.escapeHtml(item.content)}</div>`;
                    }
                    if (item.type === 'images') {
                        return `
                            <div class="review-item-images">
                                ${item.images.slice(0, 4).map((img, idx) => `
                                    <div class="review-img-thumb">
                                        <img src="${img.data}" alt="打卡照片${idx + 1}">
                                    </div>
                                `).join('')}
                                ${item.images.length > 4 ? `<span class="review-img-more">+${item.images.length - 4}</span>` : ''}
                            </div>
                        `;
                    }
                    return '';
                }).join('');

            case 'mood':
                return modData.items.map(item => `
                    <div class="review-item mood-item">
                        <span class="review-mood">${item.mood}</span>
                        ${item.note ? `<span class="review-item-note">${App.escapeHtml(item.note)}</span>` : ''}
                    </div>
                `).join('');

            case 'habits':
                return `
                    <div class="review-habits-list">
                        ${modData.items.map(h => `
                            <div class="review-habit-item ${h.completed ? 'done' : ''}">
                                <span class="rh-icon">${h.icon}</span>
                                <span class="rh-name">${h.name}</span>
                                <span class="rh-check">${h.completed ? '✓' : ''}</span>
                            </div>
                        `).join('')}
                    </div>
                `;

            case 'attendance':
                return modData.items.map(item => `
                    <div class="review-attendance">
                        <div class="ra-row">
                            <span>上班</span>
                            <span>${item.morning || '-'}</span>
                            <span class="ra-status">${item.morningStatus === 'normal' ? '✓' : item.morningStatus === 'late' ? '迟到' : '未打卡'}</span>
                        </div>
                        <div class="ra-row">
                            <span>下班</span>
                            <span>${item.evening || '-'}</span>
                            <span class="ra-status">${item.eveningStatus === 'normal' ? '✓' : item.eveningStatus === 'early' ? '早退' : '未打卡'}</span>
                        </div>
                        <div class="ra-row">
                            <span>工时</span>
                            <span class="ra-hours">${item.workHours} 小时</span>
                        </div>
                    </div>
                `).join('');

            default:
                return modData.summary || '';
        }
    }

    // ============================================================
    // 14. 事件绑定
    // ============================================================

    function bindEvents(container) {
        // 快捷打卡按钮
        container.querySelectorAll('[data-action="quick-checkin"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const type = btn.dataset.type;
                if (!type || btn.disabled) return;

                const success = _quickCheckIn(type);
                if (success) {
                    const label = type === 'morning' ? '上班' : '下班';
                    App.showToast(`✅ ${label}打卡成功`);
                    render(container);
                }
            });
        });

        // 待办勾选
        container.querySelectorAll('[data-action="toggle-todo"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                const id = checkbox.dataset.id;
                _toggleTodoTask(getToday(), id);
                render(container);
            });
        });

        // 上传照片按钮
        container.querySelectorAll('[data-action="upload-photo"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const fileInput = container.querySelector(`.photo-input-hidden[data-id="${id}"]`);
                if (fileInput) {
                    fileInput.click();
                }
            });
        });

        // 文件选择
        container.querySelectorAll('.photo-input-hidden').forEach(input => {
            input.addEventListener('change', async (e) => {
                const id = input.dataset.id;
                const file = e.target.files[0];
                if (!file) return;

                try {
                    App.showToast('正在处理图片...');
                    const compressed = await _compressImage(file, 1280, 0.7);

                    const moduleLink = MODULE_LINKS[id];
                    const moduleKey = moduleLink ? moduleLink.module : id;

                    _uploadPhotoToModule(moduleKey, getToday(), compressed);

                    // 自动同步待办完成状态
                    if (moduleLink && _checkModuleCompleted(moduleLink.module, getToday())) {
                        const tasks = _getTodoTasks(getToday());
                        const task = tasks.find(t => t.id === id);
                        if (task && !task.completed) {
                            _toggleTodoTask(getToday(), id);
                        }
                    }

                    App.showToast('📷 照片上传成功');
                    render(container);
                } catch (err) {
                    console.error('图片上传失败:', err);
                    App.showToast('上传失败，请重试');
                }

                input.value = '';
            });
        });

        // 跳转模块
        container.querySelectorAll('[data-action="goto-module"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const module = btn.dataset.module;
                if (module) App.navigateTo(module);
            });
        });

        // 点击待办项（除按钮区）跳转到对应模块
        container.querySelectorAll('.home-todo-item[data-module]').forEach(item => {
            item.addEventListener('click', (e) => {
                // 如果点击的是按钮、勾选框等交互元素，不跳转
                if (e.target.closest('.ht-actions') || e.target.closest('.ht-checkbox') || e.target.closest('button') || e.target.closest('input')) {
                    return;
                }
                const module = item.dataset.module;
                if (module) {
                    App.navigateTo(module);
                }
            });
        });

        // 删除待办
        container.querySelectorAll('[data-action="delete-todo"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                App.confirmModal('确认删除', '确定要删除这个待办事项吗？', {
                    confirmText: '删除',
                    onConfirm: () => {
                        _deleteTodoTask(getToday(), id);
                        render(container);
                        App.showToast('已删除');
                    },
                });
            });
        });

        // 添加待办
        container.querySelector('[data-action="add-todo"]')?.addEventListener('click', () => {
            _openAddTodoModal(container);
        });

        // 快捷功能跳转
        container.querySelectorAll('.quick-action-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page) App.navigateTo(page);
            });
        });

        // 日历上/下月切换
        const prevBtn = container.querySelector('#prevMonth');
        const nextBtn = container.querySelector('#nextMonth');
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                state.calendarMonth--;
                if (state.calendarMonth < 0) {
                    state.calendarMonth = 11;
                    state.calendarYear--;
                }
                _refreshCalendar(container);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                state.calendarMonth++;
                if (state.calendarMonth > 11) {
                    state.calendarMonth = 0;
                    state.calendarYear++;
                }
                _refreshCalendar(container);
            });
        }

        // 日历日期点击 - 总回顾
        container.querySelectorAll('.cal-review-day[data-date]').forEach(day => {
            day.addEventListener('click', () => {
                const date = day.dataset.date;
                if (date) {
                    state.selectedDate = date;
                    _showDateReview(date);
                }
            });
        });
    }

    // ============================================================
    // 15. 添加待办弹窗
    // ============================================================

    function _openAddTodoModal(container) {
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
                document.querySelectorAll('.icon-option').forEach(btn => {
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                        selectedIcon = btn.dataset.icon;
                    });
                });

                document.getElementById('confirmAddBtn')?.addEventListener('click', () => {
                    const name = document.getElementById('taskNameInput')?.value?.trim();
                    if (!name) {
                        App.showToast('请输入任务名称');
                        return;
                    }
                    _addTodoTask(getToday(), name, selectedIcon);
                    render(container);
                    App.closeModal();
                    App.showToast('已添加');
                });

                document.getElementById('taskNameInput')?.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        document.getElementById('confirmAddBtn')?.click();
                    }
                });
            },
        });
    }

    // ============================================================
    // 16. 日历刷新
    // ============================================================

    function _refreshCalendar(container) {
        const calendarEl = container.querySelector('#checkinCalendar');
        if (!calendarEl) return;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = renderCheckinCalendar();
        const newCalendar = wrapper.querySelector('#checkinCalendar');

        if (newCalendar && calendarEl.parentNode) {
            calendarEl.parentNode.replaceChild(newCalendar, calendarEl);

            const prevBtn = newCalendar.querySelector('#prevMonth');
            const nextBtn = newCalendar.querySelector('#nextMonth');
            if (prevBtn) {
                prevBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    state.calendarMonth--;
                    if (state.calendarMonth < 0) {
                        state.calendarMonth = 11;
                        state.calendarYear--;
                    }
                    _refreshCalendar(container);
                });
            }
            if (nextBtn) {
                nextBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    state.calendarMonth++;
                    if (state.calendarMonth > 11) {
                        state.calendarMonth = 0;
                        state.calendarYear++;
                    }
                    _refreshCalendar(container);
                });
            }

            newCalendar.querySelectorAll('.cal-review-day[data-date]').forEach(day => {
                day.addEventListener('click', () => {
                    const date = day.dataset.date;
                    if (date) {
                        state.selectedDate = date;
                        _showDateReview(date);
                    }
                });
            });
        }
    }

    // ============================================================
    // 17. 主渲染函数
    // ============================================================

    function render(container) {
        const now = new Date();
        state.calendarYear = now.getFullYear();
        state.calendarMonth = now.getMonth();
        state.currentDate = getToday();

        const html = `
            <div class="dashboard-home-page">
                <!-- 欢迎横幅 + 今日进度 -->
                ${renderGreeting()}

                <!-- 今日待办列表（核心） -->
                ${renderTodoList()}

                <!-- 快捷功能入口 -->
                ${renderQuickActions()}

                <!-- 最近7天统计 -->
                ${renderWeekStats()}

                <!-- 月度打卡日历（总回顾） -->
                ${renderCheckinCalendar()}
            </div>
        `;

        container.innerHTML = html;
        bindEvents(container);
    }

    function onResume() {
        // 页面恢复时刷新
    }

    // ============================================================
    // 18. 模块注册
    // ============================================================

    const DashboardModule = {
        render,
        onResume,
    };

    if (typeof App !== 'undefined' && typeof App.registerModule === 'function') {
        App.registerModule('dashboard', DashboardModule);
    }

    if (typeof window !== 'undefined') {
        window.DashboardModule = DashboardModule;
    }

})();
