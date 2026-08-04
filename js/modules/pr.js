/**
 * pr.js - PR视频剪辑模块（简化实用版）
 *
 * 功能：
 *   1. 课程管理（课文/习题分类）
 *   2. 打卡记录（横向日历，带日期星期）
 *   3. 素材库（照片上传）
 *   4. 今日学习记录
 */

const PrModule = (function() {
    'use strict';

    // ============================================================
    // 1. 常量与配置
    // ============================================================
    const STORAGE_KEY = 'pr';

    // 课程分类
    const COURSE_TYPES = [
        { id: 'lesson', label: '课文', icon: '📖', color: '#7ec8a7' },
        { id: 'exercise', label: '习题', icon: '✏️', color: '#a8c9e8' },
        { id: 'tutorial', label: '教程', icon: '🎬', color: '#f5c89a' },
    ];

    // ============================================================
    // 2. 默认数据
    // ============================================================
    function _getDefaultData() {
        return {
            // 课程列表
            courses: [],
            // 素材库
            materials: [],
            // 打卡记录 { '日期': { minutes, content, type } }
            checkinRecords: {},
            // 当日学习记录
            todayRecord: null,
            // 长期总目标
            longTermGoals: {
                near: {
                    title: '近期目标（3个月）',
                    content: '掌握基础剪辑操作，能独立完成简单短视频',
                    progress: 30,
                    icon: '🌱',
                    color: '#7ec8a7',
                },
                mid: {
                    title: '中期目标（6个月）',
                    content: '熟练掌握转场、调色、特效，形成个人风格',
                    progress: 15,
                    icon: '🌿',
                    color: '#a8c9e8',
                },
                far: {
                    title: '远期目标（1年）',
                    content: '能独立完成商业级视频制作，接单约稿',
                    progress: 8,
                    icon: '🌳',
                    color: '#f5c89a',
                },
                ultimate: {
                    title: '终极目标',
                    content: '成为顶级剪辑师，拥有个人代表作和粉丝',
                    progress: 3,
                    icon: '🏆',
                    color: '#c9b8e0',
                },
            },
        };
    }

    // ============================================================
    // 3. 状态管理
    // ============================================================
    let data = null;
    let containerEl = null;
    let currentTab = 'courses'; // courses | materials | record | calendar
    let calendarMonth = null;
    let calendarYear = null;

    // ============================================================
    // 4. 初始化
    // ============================================================
    function init() {
        _loadData();
    }

    function _loadData() {
        const stored = AppStorage.getModule(STORAGE_KEY);
        if (stored && typeof stored === 'object') {
            // 数据迁移：确保新字段存在（兼容旧数据）
            const defaultData = _getDefaultData();
            data = {
                courses: Array.isArray(stored.courses) ? stored.courses : defaultData.courses,
                materials: Array.isArray(stored.materials) ? stored.materials : defaultData.materials,
                checkinRecords: stored.checkinRecords && typeof stored.checkinRecords === 'object'
                    ? stored.checkinRecords
                    : defaultData.checkinRecords,
                todayRecord: stored.todayRecord || defaultData.todayRecord,
                longTermGoals: stored.longTermGoals || defaultData.longTermGoals,
            };
            // 如果数据结构变了，保存新格式
            if (!stored.checkinRecords || !Array.isArray(stored.courses)) {
                _saveData();
            }
        } else {
            data = _getDefaultData();
            AppStorage.setModule(STORAGE_KEY, data);
        }
        const now = new Date();
        calendarMonth = now.getMonth();
        calendarYear = now.getFullYear();
    }

    function _saveData() {
        AppStorage.setModule(STORAGE_KEY, data);
    }

    // ============================================================
    // 5. 工具函数
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

    // 图片压缩
    function _compressImage(file, maxSize = 1200, quality = 0.75) {
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
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 查看课程媒体
    function _viewCourseMedia(courseId, mediaIndex) {
        const course = data.courses.find(c => c.id === courseId);
        if (!course || !course.media || !course.media[mediaIndex]) return;
        const media = course.media[mediaIndex];

        let content;
        if (media.type === 'image') {
            content = `<div style="text-align:center;"><img src="${media.data}" style="max-width:100%; max-height:70vh; border-radius:12px;"></div>`;
        } else {
            content = `<video src="${media.data}" controls style="width:100%; max-height:70vh; border-radius:12px;"></video>`;
        }

        App.openModal(course.title, content, { width: '95%' });
    }

    function _formatDate(dateStr) {
        const date = new Date(dateStr);
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const week = weekDays[date.getDay()];
        return { month, day, week, full: `${month}月${day}日 周${week}` };
    }

    function _getWeekDates() {
        const dates = [];
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 周一为第一天
        const monday = new Date(now.setDate(diff));

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            dates.push({
                date: dateStr,
                ..._formatDate(dateStr),
                isToday: dateStr === _today(),
            });
        }
        return dates;
    }

    function _getTypeInfo(typeId) {
        return COURSE_TYPES.find(t => t.id === typeId) || COURSE_TYPES[0];
    }

    function _getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function _getMonthStats(year, month) {
        const daysInMonth = _getDaysInMonth(year, month);
        let checkinDays = 0;
        let totalMinutes = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const record = data.checkinRecords[dateStr];
            if (record) {
                checkinDays++;
                totalMinutes += record.minutes || 0;
            }
        }

        return { checkinDays, totalMinutes };
    }

    // ============================================================
    // 6. 主渲染
    // ============================================================
    function render(container) {
        containerEl = container;
        if (!data) _loadData();

        const weekDates = _getWeekDates();
        const totalMinutes = _getTotalMinutes();
        const totalDays = _getCheckinDays();
        const streak = _getStreak();

        container.innerHTML = `
            <div class="pr-module">
                <!-- 快捷入口 -->
                <div class="quick-links-bar">
                    <a class="quick-link-btn bilibili" href="https://www.bilibili.com" target="_blank" rel="noopener">
                        <span class="ql-icon">📺</span>
                        <span class="ql-text">哔哩哔哩</span>
                        <span class="ql-arrow">↗</span>
                    </a>
                    <a class="quick-link-btn baidu" href="https://pan.baidu.com" target="_blank" rel="noopener">
                        <span class="ql-icon">☁️</span>
                        <span class="ql-text">百度网盘</span>
                        <span class="ql-arrow">↗</span>
                    </a>
                </div>

                <!-- 统计卡片 -->
                <div class="stats-grid stats-grid-2">
                    <div class="card stat-card">
                        <div class="stat-icon" style="background: var(--color-secondary-bg); color: var(--color-secondary);">📅</div>
                        <div class="stat-value">${totalDays}<span class="unit">天</span></div>
                        <div class="stat-label">打卡天数</div>
                    </div>
                    <div class="card stat-card">
                        <div class="stat-icon" style="background: var(--color-warm-bg); color: var(--color-warm);">🔥</div>
                        <div class="stat-value">${streak}<span class="unit">天</span></div>
                        <div class="stat-label">连续打卡</div>
                    </div>
                </div>

                <!-- 模块长期总目标 -->
                <div class="section-title">
                    <h2><span class="title-icon">🎯</span>模块长期总目标</h2>
                    <span class="section-action" data-action="edit-goals">编辑</span>
                </div>
                <div class="goals-vertical" id="prLongTermGoals"></div>

                <!-- 本周打卡（横向） -->
                <div class="section-title">
                    <h2><span class="title-icon">📅</span>本周打卡</h2>
                    <span class="section-action" data-action="quick-checkin">一键打卡</span>
                </div>
                <div class="week-checkin-horizontal">
                    ${weekDates.map(d => {
                        const record = data.checkinRecords[d.date];
                        const hasCheckin = !!record;
                        return `
                            <div class="day-checkin-item ${d.isToday ? 'today' : ''} ${hasCheckin ? 'checked' : ''}"
                                 data-date="${d.date}" data-action="toggle-day-checkin">
                                <div class="day-week">周${d.week}</div>
                                <div class="day-date">${d.day}</div>
                                <div class="day-status">${hasCheckin ? '✓' : ''}</div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Tab切换 -->
                <div class="tab-bar">
                    <div class="tab-item ${currentTab === 'courses' ? 'active' : ''}" data-tab="courses">
                        <span class="tab-icon">📚</span>
                        <span>课程</span>
                    </div>
                    <div class="tab-item ${currentTab === 'materials' ? 'active' : ''}" data-tab="materials">
                        <span class="tab-icon">🖼️</span>
                        <span>素材</span>
                    </div>
                    <div class="tab-item ${currentTab === 'record' ? 'active' : ''}" data-tab="record">
                        <span class="tab-icon">📝</span>
                        <span>记录</span>
                    </div>
                    <div class="tab-item ${currentTab === 'calendar' ? 'active' : ''}" data-tab="calendar">
                        <span class="tab-icon">📆</span>
                        <span>回顾</span>
                    </div>
                </div>

                <!-- 课程列表 -->
                <div class="tab-content ${currentTab === 'courses' ? 'active' : ''}" id="tab-courses">
                    <div class="section-title">
                        <h3><span class="title-icon">📖</span>我的课程</h3>
                        <span class="section-action" data-action="add-course">+ 添加</span>
                    </div>
                    ${_renderCourses()}
                </div>

                <!-- 素材库 -->
                <div class="tab-content ${currentTab === 'materials' ? 'active' : ''}" id="tab-materials">
                    <div class="section-title">
                        <h3><span class="title-icon">🖼️</span>素材库</h3>
                        <span class="section-action" data-action="add-material">+ 上传</span>
                    </div>
                    ${_renderMaterials()}
                    <input type="file" id="prMaterialInput" accept="image/*" style="display: none;" multiple>
                </div>

                <!-- 今日记录 -->
                <div class="tab-content ${currentTab === 'record' ? 'active' : ''}" id="tab-record">
                    <div class="section-title">
                        <h3><span class="title-icon">📝</span>今日学习记录</h3>
                        <span class="section-action" data-action="edit-today">编辑</span>
                    </div>
                    ${_renderTodayRecord()}
                </div>

                <!-- 日历回顾Tab -->
                <div class="tab-content ${currentTab === 'calendar' ? 'active' : ''}" id="tab-calendar">
                    ${_renderCalendarTab()}
                </div>
            </div>
        `;

        _renderLongTermGoals();
        _bindEvents();
    }

    // ============================================================
    // ============================================================
    // 7. 长期目标渲染
    // ============================================================
    // 按打卡天数自动计算目标进度
    // 近期: 90天, 中期: 180天, 远期: 365天, 终极: 730天
    function _calcGoalProgress(key) {
        const checkinDays = Object.keys(data.checkinRecords).length;
        const dayMap = { near: 90, mid: 180, far: 365, ultimate: 730 };
        const targetDays = dayMap[key] || 90;
        const progress = Math.min(100, Math.round((checkinDays / targetDays) * 1000) / 10);
        return progress;
    }

    function _renderLongTermGoals() {
        const goalsEl = containerEl?.querySelector('#prLongTermGoals');
        if (!goalsEl) return;

        const goals = data.longTermGoals;
        const goalKeys = ['near', 'mid', 'far', 'ultimate'];

        goalsEl.innerHTML = goalKeys.map(key => {
            const g = goals[key];
            if (!g) return '';
            const progress = _calcGoalProgress(key);
            const dayMap = { near: 90, mid: 180, far: 365, ultimate: 730 };
            const targetDays = dayMap[key] || 90;
            const checkinDays = Object.keys(data.checkinRecords).length;
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
                    <input type="text" class="form-input" id="prGoalTitle_${key}" value="${_esc(g.title)}">
                    <textarea class="form-textarea mt-sm" id="prGoalContent_${key}" rows="2" placeholder="目标描述">${_esc(g.content)}</textarea>
                    <div class="mt-sm">
                        <label class="form-label-sm">进度：<span id="prProgressVal_${key}">${g.progress || 0}%</span></label>
                        <input type="range" id="prGoalProgress_${key}" min="0" max="100" value="${g.progress || 0}" 
                               style="width: 100%;" data-key="${key}">
                    </div>
                </div>
                `;
            }).join('')}
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="prSaveGoalsBtn">保存目标</button>
            </div>
        `;

        App.openModal('编辑长期目标', html, {
            width: '90%',
            maxWidth: '480px',
            onOpen: () => {
                goalKeys.forEach(key => {
                    const slider = document.getElementById(`prGoalProgress_${key}`);
                    const valEl = document.getElementById(`prProgressVal_${key}`);
                    slider?.addEventListener('input', () => {
                        if (valEl) valEl.textContent = slider.value + '%';
                    });
                });

                document.getElementById('prSaveGoalsBtn')?.addEventListener('click', () => {
                    goalKeys.forEach(key => {
                        const title = document.getElementById(`prGoalTitle_${key}`)?.value?.trim();
                        const content = document.getElementById(`prGoalContent_${key}`)?.value?.trim();
                        const progress = parseInt(document.getElementById(`prGoalProgress_${key}`)?.value) || 0;
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

    // ============================================================
    // 8. 日历回顾渲染
    // ============================================================
    function _renderCalendarTab() {
        const monthLabel = `${calendarYear}年${calendarMonth + 1}月`;
        const stats = _getMonthStats(calendarYear, calendarMonth);
        const totalDays = Object.keys(data.checkinRecords).length;
        const streak = _getStreak();

        return `
            <!-- 月份切换 -->
            <div class="month-nav">
                <button class="btn-icon" data-action="prev-month-pr">◀</button>
                <div class="month-label">${monthLabel}</div>
                <button class="btn-icon" data-action="next-month-pr">▶</button>
            </div>

            <!-- 月度统计 -->
            <div class="card month-stats-card" style="background: linear-gradient(135deg, #7ec8a720, #f5c89a20);">
                <div class="month-stats-grid">
                    <div class="month-stat">
                        <div class="month-stat-value">${stats.checkinDays}</div>
                        <div class="month-stat-label">打卡天数</div>
                    </div>
                    <div class="month-stat">
                        <div class="month-stat-value">${Math.floor(stats.totalMinutes / 60)}</div>
                        <div class="month-stat-label">学习小时</div>
                    </div>
                    <div class="month-stat">
                        <div class="month-stat-value">${stats.checkinDays > 0 ? Math.round(stats.totalMinutes / stats.checkinDays) : 0}</div>
                        <div class="month-stat-label">日均分钟</div>
                    </div>
                    <div class="month-stat">
                        <div class="month-stat-value">${streak}</div>
                        <div class="month-stat-label">连续打卡</div>
                    </div>
                </div>
            </div>

            <!-- 日历 -->
            <div class="section-title">
                <h3><span class="title-icon">📆</span>学习日历</h3>
                <span class="section-hint">点击日期查看记录</span>
            </div>
            <div class="pr-calendar">
                ${_renderPrCalendar(calendarYear, calendarMonth)}
            </div>

            <!-- 最近打卡记录 -->
            <div class="section-title">
                <h3><span class="title-icon">📋</span>最近打卡</h3>
            </div>
            <div class="recent-checkin-list">
                ${_renderPrRecentCheckins()}
            </div>
        `;
    }

    function _renderPrCalendar(year, month) {
        const daysInMonth = _getDaysInMonth(year, month);
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
            const record = data.checkinRecords[dateStr];
            const hasCheckin = !!record;

            html += `
                <div class="cal-day ${isToday ? 'today' : ''} ${hasCheckin ? 'has-content' : ''}"
                     data-date="${dateStr}" data-action="view-pr-day">
                    <div class="cal-day-num">${day}</div>
                    ${hasCheckin ? `
                        <div class="cal-day-badge" style="background: #7ec8a7;">
                            ${record.minutes || 0}分
                        </div>
                    ` : ''}
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    function _renderPrRecentCheckins() {
        const records = [];
        const today = new Date();

        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = App.formatDate(d);
            const record = data.checkinRecords[dateStr];
            if (record) {
                records.push({ date: dateStr, record });
            }
            if (records.length >= 5) break;
        }

        if (records.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <div class="empty-title">还没有打卡记录</div>
                    <div class="empty-desc">开始你的PR剪辑学习吧</div>
                </div>
            `;
        }

        return records.map(({ date, record }) => {
            const dateInfo = _formatDate(date);
            return `
                <div class="card recent-record-item" data-date="${date}" data-action="view-pr-day-detail">
                    <div class="recent-record-date">
                        <div class="recent-record-day">${dateInfo.day}</div>
                        <div class="recent-record-month">${dateInfo.month}月</div>
                    </div>
                    <div class="recent-record-info">
                        <div class="recent-record-title">${dateInfo.full}</div>
                        <div class="recent-record-tags">
                            ⏱️ ${record.minutes || 0} 分钟
                            ${record.content ? ' · 📝 有笔记' : ''}
                        </div>
                    </div>
                    <div class="recent-record-arrow">›</div>
                </div>
            `;
        }).join('');
    }

    function _viewPrDayRecord(dateStr) {
        const record = data.checkinRecords[dateStr];
        const dateInfo = _formatDate(dateStr);

        const content = `
            <div style="padding: var(--spacing-md) 0;">
                <div style="text-align: center; margin-bottom: var(--spacing-md);">
                    <div style="font-size: 20px; font-weight: 600; margin-bottom: 4px;">${dateInfo.full}</div>
                    <div style="font-size: 14px; color: var(--color-text-secondary);">PR剪辑学习记录</div>
                </div>

                <div class="card" style="margin-bottom: var(--spacing-md); padding: var(--spacing-md); background: #7ec8a710;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 14px; color: var(--color-text-secondary);">学习时长</span>
                        <span style="font-size: 24px; font-weight: 700; color: var(--color-primary);">${record?.minutes || 0} <span style="font-size: 14px; font-weight: normal;">分钟</span></span>
                    </div>
                </div>

                ${record?.content ? `
                    <div class="card" style="padding: var(--spacing-md);">
                        <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; color: var(--color-text-primary);">📝 学习内容</div>
                        <div style="font-size: 14px; line-height: 1.6; color: var(--color-text-secondary); white-space: pre-wrap;">
                            ${_esc(record.content)}
                        </div>
                    </div>
                ` : `
                    <div style="text-align: center; padding: var(--spacing-lg); color: var(--color-text-tertiary); font-size: 14px;">
                        这天没有学习记录
                    </div>
                `}
            </div>
        `;

        App.openModal(`${dateInfo.full} 学习记录`, content, {
            width: '90%',
            maxWidth: '480px',
        });
    }

    function _refreshCalendarTab() {
        const tab = containerEl?.querySelector('#tab-calendar');
        if (tab) {
            tab.innerHTML = _renderCalendarTab();
            _bindCalendarEvents();
        }
    }

    // ============================================================
    // 8. 课程渲染
    // ============================================================
    function _renderCourses() {
        if (data.courses.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📚</div>
                    <div class="empty-title">还没有课程</div>
                    <div class="empty-desc">点击右上角「添加」开始添加课程</div>
                </div>
            `;
        }

        // 按分类分组
        const grouped = {};
        COURSE_TYPES.forEach(type => {
            grouped[type.id] = data.courses.filter(c => c.type === type.id);
        });

        let html = '';
        for (const type of COURSE_TYPES) {
            const courses = grouped[type.id] || [];
            if (courses.length === 0) continue;

            html += `
                <div class="course-type-section">
                    <div class="course-type-header">
                        <span class="course-type-icon">${type.icon}</span>
                        <span class="course-type-name">${type.label}</span>
                        <span class="course-type-count">${courses.length}个</span>
                    </div>
                    <div class="course-list">
                        ${courses.map(course => `
                            <div class="course-item ${course.completed ? 'completed' : ''}" data-id="${course.id}">
                                <div class="course-check" data-action="toggle-course" data-id="${course.id}">
                                    ${course.completed ? '✓' : ''}
                                </div>
                                <div class="course-info">
                                    <div class="course-title">${_esc(course.title)}</div>
                                    ${course.duration ? `<div class="course-duration">⏱️ ${course.duration}</div>` : ''}
                                    ${course.note ? `<div class="course-note">${_esc(course.note)}</div>` : ''}
                                    ${course.media && course.media.length > 0 ? `
                                        <div class="course-media">
                                            ${course.media.slice(0, 4).map((m, idx) => `
                                                <div class="media-thumb" data-action="view-course-media" data-id="${course.id}" data-media-index="${idx}">
                                                    ${m.type === 'image' 
                                                        ? `<img src="${m.data}" alt="">` 
                                                        : `<div class="video-thumb-sm"><span class="play-icon">▶</span></div>`
                                                    }
                                                </div>
                                            `).join('')}
                                            ${course.media.length > 4 ? `<div class="media-more">+${course.media.length - 4}</div>` : ''}
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="course-actions">
                                    <button class="btn-icon" data-action="edit-course" data-id="${course.id}" title="编辑">✏️</button>
                                    <button class="btn-icon" data-action="delete-course" data-id="${course.id}" title="删除">🗑️</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        return html;
    }

    function _refreshCourses() {
        const tab = containerEl?.querySelector('#tab-courses');
        if (tab) {
            tab.innerHTML = `
                <div class="section-title">
                    <h3><span class="title-icon">📖</span>我的课程</h3>
                    <span class="section-action" data-action="add-course">+ 添加</span>
                </div>
                ${_renderCourses()}
            `;
            _bindCourseEvents();
        }
    }

    // ============================================================
    // 8. 素材库渲染
    // ============================================================
    function _renderMaterials() {
        if (data.materials.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🖼️</div>
                    <div class="empty-title">还没有素材</div>
                    <div class="empty-desc">点击右上角「上传」添加图片素材</div>
                </div>
            `;
        }

        return `
            <div class="materials-grid">
                ${data.materials.map((item, index) => `
                    <div class="material-item" data-index="${index}">
                        <div class="material-image">
                            <img src="${item.imageData || ''}" alt="${_esc(item.title)}" 
                                 onclick="_viewPrMaterial(${index})">
                            <div class="material-actions">
                                <button class="material-action-btn" data-action="delete-material" 
                                        data-index="${index}" title="删除">🗑️</button>
                            </div>
                        </div>
                        <div class="material-title">${_esc(item.title || '未命名')}</div>
                        <div class="material-date">${item.date || ''}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function _refreshMaterials() {
        const tab = containerEl?.querySelector('#tab-materials');
        if (tab) {
            tab.innerHTML = `
                <div class="section-title">
                    <h3><span class="title-icon">🖼️</span>素材库</h3>
                    <span class="section-action" data-action="add-material">+ 上传</span>
                </div>
                ${_renderMaterials()}
                <input type="file" id="prMaterialInput" accept="image/*" style="display: none;" multiple>
            `;
            _bindMaterialEvents();
        }
    }

    // 查看大图（全局函数）
    window._viewPrMaterial = function(index) {
        const item = data.materials[index];
        if (!item || !item.imageData) return;
        const content = `
            <div style="text-align: center;">
                <img src="${item.imageData}" style="max-width: 100%; max-height: 70vh; border-radius: 12px;">
                ${item.note ? `<p style="margin-top: 16px; color: var(--color-text-secondary);">${_esc(item.note)}</p>` : ''}
            </div>
        `;
        App.openModal(item.title || '素材图片', content);
    };

    // ============================================================
    // 9. 今日记录渲染
    // ============================================================
    function _renderTodayRecord() {
        const today = _today();
        const record = data.checkinRecords[today];

        if (!record) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-title">今天还没记录</div>
                    <div class="empty-desc">点击右上角「编辑」记录今天的学习</div>
                </div>
            `;
        }

        return `
            <div class="card today-record-card">
                <div class="today-record-header">
                    <span class="today-record-date">${_formatDate(today).full}</span>
                    <span class="today-record-duration">⏱️ ${record.minutes || 0} 分钟</span>
                </div>
                ${record.content ? `<div class="today-record-content">${_esc(record.content)}</div>` : ''}
                ${record.type ? `
                    <div class="today-record-type">
                        <span class="tag" style="background: ${_getTypeInfo(record.type).color}20; color: ${_getTypeInfo(record.type).color};">
                            ${_getTypeInfo(record.type).icon} ${_getTypeInfo(record.type).label}
                        </span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    function _refreshTodayRecord() {
        const tab = containerEl?.querySelector('#tab-record');
        if (tab) {
            tab.innerHTML = `
                <div class="section-title">
                    <h3><span class="title-icon">📝</span>今日学习记录</h3>
                    <span class="section-action" data-action="edit-today">编辑</span>
                </div>
                ${_renderTodayRecord()}
            `;
        }
    }

    // ============================================================
    // 10. 统计计算
    // ============================================================
    function _getTotalMinutes() {
        let total = 0;
        for (const date in data.checkinRecords) {
            total += data.checkinRecords[date].minutes || 0;
        }
        return total;
    }

    function _getCheckinDays() {
        return Object.keys(data.checkinRecords).length;
    }

    function _getStreak() {
        let streak = 0;
        const today = new Date();
        let checkDate = new Date(today);

        // 从今天开始往前数
        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (data.checkinRecords[dateStr]) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // 如果今天没打卡，从昨天开始算
                if (streak === 0 && dateStr === _today()) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    continue;
                }
                break;
            }
        }
        return streak;
    }

    // ============================================================
    // 11. 事件绑定
    // ============================================================
    function _bindEvents() {
        if (!containerEl) return;

        // Tab切换
        containerEl.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', () => {
                currentTab = tab.dataset.tab;
                containerEl.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                containerEl.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                containerEl.querySelector(`#tab-${currentTab}`).classList.add('active');
            });
        });

        // 一键打卡
        containerEl.querySelector('[data-action="quick-checkin"]')?.addEventListener('click', () => {
            _quickCheckin();
        });

        // 编辑长期目标
        containerEl.querySelector('[data-action="edit-goals"]')?.addEventListener('click', () => {
            _openGoalsModal();
        });

        // 每日打卡点击
        containerEl.querySelectorAll('[data-action="toggle-day-checkin"]').forEach(item => {
            item.addEventListener('click', () => {
                const date = item.dataset.date;
                _toggleDayCheckin(date);
            });
        });

        // 课程事件
        _bindCourseEvents();

        // 素材事件
        _bindMaterialEvents();

        // 编辑今日记录
        containerEl.querySelector('[data-action="edit-today"]')?.addEventListener('click', () => {
            _openTodayModal();
        });

        // 添加课程
        containerEl.querySelector('[data-action="add-course"]')?.addEventListener('click', () => {
            _openCourseModal();
        });

        // 上传素材
        containerEl.querySelector('[data-action="add-material"]')?.addEventListener('click', () => {
            containerEl.querySelector('#prMaterialInput')?.click();
        });

        // 日历事件
        _bindCalendarEvents();
    }

    function _bindCourseEvents() {
        if (!containerEl) return;

        // 切换课程完成状态
        containerEl.querySelectorAll('[data-action="toggle-course"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                _toggleCourse(id);
            });
        });

        // 编辑课程
        containerEl.querySelectorAll('[data-action="edit-course"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                _openCourseModal(id);
            });
        });

        // 删除课程
        containerEl.querySelectorAll('[data-action="delete-course"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                _deleteCourse(id);
            });
        });

        // 查看课程媒体
        containerEl.querySelectorAll('[data-action="view-course-media"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const mediaIndex = parseInt(btn.dataset.mediaIndex);
                _viewCourseMedia(id, mediaIndex);
            });
        });
    }

    function _bindMaterialEvents() {
        if (!containerEl) return;

        // 删除素材
        containerEl.querySelectorAll('[data-action="delete-material"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                _deleteMaterial(index);
            });
        });

        // 上传文件
        const fileInput = containerEl.querySelector('#prMaterialInput');
        fileInput?.addEventListener('change', (e) => {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;

            let processed = 0;
            files.forEach(file => {
                if (!file.type.startsWith('image/')) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        const maxSize = 1200;

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

                        const compressedData = canvas.toDataURL('image/jpeg', 0.8);
                        const today = new Date().toISOString().split('T')[0];

                        data.materials.unshift({
                            id: _genId('mat'),
                            title: file.name.replace(/\.[^/.]+$/, ''),
                            imageData: compressedData,
                            date: today,
                            note: '',
                            createdAt: Date.now(),
                        });

                        processed++;
                        if (processed === files.length) {
                            _saveData();
                            _refreshMaterials();
                            App.showToast(`已添加 ${files.length} 个素材`);
                        }
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });

            fileInput.value = '';
        });
    }

    // 日历事件绑定
    function _bindCalendarEvents() {
        if (!containerEl) return;
        const tab = containerEl.querySelector('#tab-calendar');
        if (!tab) return;

        // 月份切换
        tab.querySelector('[data-action="prev-month-pr"]')?.addEventListener('click', () => {
            calendarMonth--;
            if (calendarMonth < 0) {
                calendarMonth = 11;
                calendarYear--;
            }
            _refreshCalendarTab();
        });

        tab.querySelector('[data-action="next-month-pr"]')?.addEventListener('click', () => {
            calendarMonth++;
            if (calendarMonth > 11) {
                calendarMonth = 0;
                calendarYear++;
            }
            _refreshCalendarTab();
        });

        // 日期点击查看记录
        tab.querySelectorAll('[data-action="view-pr-day"]').forEach(day => {
            day.addEventListener('click', () => {
                const date = day.dataset.date;
                if (date) {
                    _viewPrDayRecord(date);
                }
            });
        });

        // 最近打卡点击
        tab.querySelectorAll('[data-action="view-pr-day-detail"]').forEach(item => {
            item.addEventListener('click', () => {
                const date = item.dataset.date;
                if (date) {
                    _viewPrDayRecord(date);
                }
            });
        });
    }

    // ============================================================
    // 12. 操作函数
    // ============================================================

    // 一键打卡
    function _quickCheckin() {
        const today = _today();
        if (data.checkinRecords[today]) {
            App.showToast('今天已经打卡啦～');
            return;
        }

        data.checkinRecords[today] = {
            minutes: 45,
            content: 'PR课程学习',
            type: 'lesson',
            createdAt: Date.now(),
        };
        _saveData();
        render(containerEl);
        App.showToast('🎉 打卡成功！已记录45分钟');
    }

    // 切换每日打卡
    async function _toggleDayCheckin(date) {
        if (data.checkinRecords[date]) {
            // 取消打卡
            const ok = await App.confirmModal('取消打卡', '确定要取消这一天的打卡吗？');
            if (ok) {
                delete data.checkinRecords[date];
                _saveData();
                render(containerEl);
                App.showToast('已取消打卡');
            }
        } else {
            // 打卡
            _openDayCheckinModal(date);
        }
    }

    // 打开单日打卡弹窗
    function _openDayCheckinModal(date) {
        const dateInfo = _formatDate(date);
        const content = `
            <div class="form-group">
                <label class="form-label">学习时长（分钟）</label>
                <input type="number" class="form-input" id="checkinMinutes" value="45" min="0">
            </div>
            <div class="form-group">
                <label class="form-label">学习内容</label>
                <textarea class="form-input" id="checkinContent" rows="3" placeholder="今天学了什么？"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">类型</label>
                <div class="type-selector">
                    ${COURSE_TYPES.map((t, i) => `
                        <div class="type-option ${i === 0 ? 'selected' : ''}" data-type="${t.id}"
                             style="border-color: ${t.color}40; ${i === 0 ? `background: ${t.color}15;` : ''}">
                            <span class="type-option-icon">${t.icon}</span>
                            <span class="type-option-label">${t.label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="checkinConfirmBtn">确认打卡</button>
            </div>
        `;

        App.openModal(`${dateInfo.full} 学习记录`, content, {
            onOpen: () => {
                // 类型选择
                document.querySelectorAll('.type-option').forEach(opt => {
                    opt.addEventListener('click', () => {
                        document.querySelectorAll('.type-option').forEach(o => {
                            o.classList.remove('selected');
                            o.style.background = '';
                        });
                        opt.classList.add('selected');
                        const type = _getTypeInfo(opt.dataset.type);
                        opt.style.background = `${type.color}15`;
                    });
                });

                // 确认按钮
                document.getElementById('checkinConfirmBtn')?.addEventListener('click', () => {
                    const minutes = parseInt(document.getElementById('checkinMinutes')?.value) || 0;
                    const content = document.getElementById('checkinContent')?.value?.trim() || '';
                    const selectedType = document.querySelector('.type-option.selected')?.dataset.type || 'lesson';

                    data.checkinRecords[date] = {
                        minutes,
                        content,
                        type: selectedType,
                        createdAt: Date.now(),
                    };
                    _saveData();
                    render(containerEl);
                    App.closeModal();
                    App.showToast('✅ 打卡成功！');
                });
            },
        });
    }

    // 切换课程完成状态
    function _toggleCourse(id) {
        const course = data.courses.find(c => c.id === id);
        if (!course) return;
        course.completed = !course.completed;
        _saveData();
        _refreshCourses();
        App.showToast(course.completed ? '✅ 已完成' : '📖 继续学习');
    }

    // 打开课程编辑弹窗
    function _openCourseModal(courseId) {
        const isEdit = !!courseId;
        const course = isEdit ? data.courses.find(c => c.id === courseId) : null;
        let mediaList = course?.media ? [...course.media] : [];

        function renderMediaPreview() {
            const container = document.getElementById('courseMediaPreview');
            if (!container) return;
            if (mediaList.length === 0) {
                container.innerHTML = '<div class="empty-state-sm">还没有上传照片或视频</div>';
                return;
            }
            container.innerHTML = mediaList.map((m, idx) => `
                <div class="media-thumb-item">
                    <div class="media-thumb">
                        ${m.type === 'image' 
                            ? `<img src="${m.data}" alt="">` 
                            : `<div class="video-thumb-sm"><span class="play-icon">▶</span></div>`
                        }
                    </div>
                    <button class="media-remove" data-idx="${idx}">×</button>
                </div>
            `).join('');
            container.querySelectorAll('.media-remove').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.idx);
                    mediaList.splice(idx, 1);
                    renderMediaPreview();
                });
            });
        }

        const content = `
            <div class="form-group">
                <label class="form-label">课程名称 *</label>
                <input type="text" class="form-input" id="courseTitle" value="${course?.title || ''}" 
                       placeholder="例如：PR零基础入门">
            </div>
            <div class="form-group">
                <label class="form-label">类型</label>
                <div class="type-selector">
                    ${COURSE_TYPES.map((t, i) => {
                        const selected = course?.type === t.id || (!isEdit && i === 0);
                        return `
                            <div class="type-option ${selected ? 'selected' : ''}" data-type="${t.id}"
                                 style="border-color: ${t.color}40; ${selected ? `background: ${t.color}15;` : ''}">
                                <span class="type-option-icon">${t.icon}</span>
                                <span class="type-option-label">${t.label}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">时长</label>
                <input type="text" class="form-input" id="courseDuration" value="${course?.duration || ''}"
                       placeholder="例如：2小时30分">
            </div>
            <div class="form-group">
                <label class="form-label">备注</label>
                <textarea class="form-input" id="courseNote" rows="2" 
                          placeholder="学习笔记或重点...">${course?.note || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">照片/视频</label>
                <div class="media-upload-area">
                    <button class="btn btn-outline btn-sm" id="courseUploadImageBtn" type="button">
                        📷 添加照片
                    </button>
                    <button class="btn btn-outline btn-sm" id="courseUploadVideoBtn" type="button">
                        🎬 添加视频
                    </button>
                    <input type="file" id="courseImageInput" accept="image/*" style="display:none;" multiple>
                    <input type="file" id="courseVideoInput" accept="video/*" style="display:none;">
                </div>
                <div class="media-preview-grid" id="courseMediaPreview"></div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="courseConfirmBtn">${isEdit ? '保存' : '添加'}</button>
            </div>
        `;

        App.openModal(isEdit ? '编辑课程' : '添加课程', content, {
            width: '90%',
            maxWidth: '480px',
            onOpen: () => {
                renderMediaPreview();

                // 类型选择
                document.querySelectorAll('.type-option').forEach(opt => {
                    opt.addEventListener('click', () => {
                        document.querySelectorAll('.type-option').forEach(o => {
                            o.classList.remove('selected');
                            o.style.background = '';
                        });
                        opt.classList.add('selected');
                        const type = _getTypeInfo(opt.dataset.type);
                        opt.style.background = `${type.color}15`;
                    });
                });

                // 上传图片
                document.getElementById('courseUploadImageBtn')?.addEventListener('click', () => {
                    document.getElementById('courseImageInput')?.click();
                });
                document.getElementById('courseImageInput')?.addEventListener('change', (e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(file => {
                        if (!file.type.startsWith('image/')) return;
                        _compressImage(file, 1200, 0.75).then(compressedData => {
                            mediaList.push({
                                type: 'image',
                                data: compressedData,
                                name: file.name,
                                createdAt: Date.now(),
                            });
                            renderMediaPreview();
                        });
                    });
                    e.target.value = '';
                });

                // 上传视频
                document.getElementById('courseUploadVideoBtn')?.addEventListener('click', () => {
                    document.getElementById('courseVideoInput')?.click();
                });
                document.getElementById('courseVideoInput')?.addEventListener('change', (e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(file => {
                        if (!file.type.startsWith('video/')) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            mediaList.push({
                                type: 'video',
                                data: ev.target.result,
                                name: file.name,
                                size: file.size,
                                createdAt: Date.now(),
                            });
                            renderMediaPreview();
                        };
                        reader.readAsDataURL(file);
                    });
                    e.target.value = '';
                });

                // 确认按钮
                document.getElementById('courseConfirmBtn')?.addEventListener('click', () => {
                    const title = document.getElementById('courseTitle')?.value?.trim();
                    if (!title) {
                        App.showToast('请输入课程名称');
                        return;
                    }
                    const type = document.querySelector('.type-option.selected')?.dataset.type || 'lesson';
                    const duration = document.getElementById('courseDuration')?.value?.trim() || '';
                    const note = document.getElementById('courseNote')?.value?.trim() || '';

                    if (isEdit) {
                        const c = data.courses.find(c => c.id === courseId);
                        if (c) {
                            c.title = title;
                            c.type = type;
                            c.duration = duration;
                            c.note = note;
                            c.media = mediaList;
                        }
                    } else {
                        data.courses.push({
                            id: _genId('course'),
                            title,
                            type,
                            duration,
                            note,
                            media: mediaList,
                            completed: false,
                            createdAt: Date.now(),
                        });
                    }

                    _saveData();
                    _refreshCourses();
                    App.closeModal();
                    App.showToast(isEdit ? '已保存' : '已添加');
                });
            },
        });
    }

    // 删除课程
    async function _deleteCourse(id) {
        const ok = await App.confirmModal('删除课程', '确定要删除这个课程吗？');
        if (ok) {
            data.courses = data.courses.filter(c => c.id !== id);
            _saveData();
            _refreshCourses();
            App.showToast('已删除');
        }
    }

    // 删除素材
    async function _deleteMaterial(index) {
        const ok = await App.confirmModal('删除素材', '确定要删除这个素材吗？');
        if (ok) {
            data.materials.splice(index, 1);
            _saveData();
            _refreshMaterials();
            App.showToast('已删除');
        }
    }

    // 打开今日记录编辑弹窗
    function _openTodayModal() {
        const today = _today();
        const record = data.checkinRecords[today] || {};

        const content = `
            <div class="form-group">
                <label class="form-label">学习时长（分钟）</label>
                <input type="number" class="form-input" id="todayMinutes" value="${record.minutes || 0}" min="0">
            </div>
            <div class="form-group">
                <label class="form-label">学习内容</label>
                <textarea class="form-input" id="todayContent" rows="4" 
                          placeholder="今天学了什么？有什么收获？">${record.content || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">类型</label>
                <div class="type-selector">
                    ${COURSE_TYPES.map((t, i) => {
                        const selected = record.type === t.id || (!record.type && i === 0);
                        return `
                            <div class="type-option ${selected ? 'selected' : ''}" data-type="${t.id}"
                                 style="border-color: ${t.color}40; ${selected ? `background: ${t.color}15;` : ''}">
                                <span class="type-option-icon">${t.icon}</span>
                                <span class="type-option-label">${t.label}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="todayConfirmBtn">保存</button>
            </div>
        `;

        App.openModal('今日学习记录', content, {
            onOpen: () => {
                // 类型选择
                document.querySelectorAll('.type-option').forEach(opt => {
                    opt.addEventListener('click', () => {
                        document.querySelectorAll('.type-option').forEach(o => {
                            o.classList.remove('selected');
                            o.style.background = '';
                        });
                        opt.classList.add('selected');
                        const type = _getTypeInfo(opt.dataset.type);
                        opt.style.background = `${type.color}15`;
                    });
                });

                // 保存按钮
                document.getElementById('todayConfirmBtn')?.addEventListener('click', () => {
                    const minutes = parseInt(document.getElementById('todayMinutes')?.value) || 0;
                    const content = document.getElementById('todayContent')?.value?.trim() || '';
                    const type = document.querySelector('.type-option.selected')?.dataset.type || 'lesson';

                    if (minutes === 0 && !content) {
                        // 如果都为空，删除记录
                        delete data.checkinRecords[today];
                    } else {
                        data.checkinRecords[today] = {
                            minutes,
                            content,
                            type,
                            createdAt: Date.now(),
                        };
                    }

                    _saveData();
                    render(containerEl);
                    App.closeModal();
                    App.showToast('已保存');
                });
            },
        });
    }

    // ============================================================
    // 13. 对外接口
    // ============================================================
    return {
        init,
        render,
        onAdd: () => {
            // 顶部+按钮，默认添加课程
            _openCourseModal();
        },
        onResume: () => {
            if (containerEl) render(containerEl);
        },
    };
})();

// 注册模块
App.registerModule('pr', PrModule);
