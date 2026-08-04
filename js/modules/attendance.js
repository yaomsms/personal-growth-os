/**
 * attendance.js - 考勤打卡 & 每日记录
 * 功能：
 *   1. 每日记录：打卡状态 + 日记 + 照片/视频上传
 *   2. 日历视图：点击日期查看任意一天的记录
 *   3. 每日独立，第二天自动开启新记录
 *   4. 月度统计
 */

const AttendanceModule = (function() {
    'use strict';

    // ============================================================
    // 1. 常量与配置
    // ============================================================
    const STORAGE_KEY = 'attendance';

    const COLORS = {
        primary: '#7ec8a7',
        morning: '#f5c89a',
        evening: '#a8c9e8',
        normal: '#7ec8a7',
        late: '#f0c987',
        early: '#c9b8e0',
        missing: '#f4b8c4',
        leave: '#b8c9d9',
        weekend: '#e8e8e8',
    };

    const CHECKIN_STATUS = {
        normal: { label: '正常', icon: '✅', color: COLORS.normal },
        late: { label: '迟到', icon: '⏰', color: COLORS.late },
        early: { label: '早退', icon: '⏱️', color: COLORS.early },
        missing: { label: '未打卡', icon: '❌', color: COLORS.missing },
        leave: { label: '请假', icon: '🏖️', color: COLORS.leave },
    };

    // ============================================================
    // 2. 默认数据
    // ============================================================
    function _getDefaultData() {
        return {
            records: {},
            settings: {
                workStartTime: '09:00',
                workEndTime: '18:00',
                lunchBreak: 1.5, // 午休时长（小时）
                workDays: [1, 2, 3, 4, 5],
            },
        };
    }

    // ============================================================
    // 3. 状态管理
    // ============================================================
    let data = null;
    let containerEl = null;
    let currentDate = null;
    let currentMonth = null;
    let currentYear = null;
    let activeTab = 'day'; // day | calendar

    // ============================================================
    // 4. 初始化
    // ============================================================
    function init() {
        _loadData();
    }

    function _loadData() {
        const stored = AppStorage.getModule(STORAGE_KEY);
        if (stored && typeof stored === 'object') {
            data = stored;
            if (!data.records) data.records = {};
            if (!data.settings) data.settings = _getDefaultData().settings;
            // 数据迁移：为旧记录补充新字段
            _migrateData();
        } else {
            data = _getDefaultData();
            AppStorage.setModule(STORAGE_KEY, data);
        }
        const now = new Date();
        currentDate = _today();
        currentMonth = now.getMonth();
        currentYear = now.getFullYear();
    }

    // 数据迁移：为旧版本数据补充新字段
    function _migrateData() {
        let needSave = false;
        for (const dateStr in data.records) {
            const record = data.records[dateStr];
            if (record.statusText === undefined) {
                record.statusText = '';
                needSave = true;
            }
            if (record.isRestDay === undefined) {
                record.isRestDay = false;
                needSave = true;
            }
        }
        if (needSave) {
            _saveData();
        }
    }

    function _saveData() {
        AppStorage.setModule(STORAGE_KEY, data);
    }

    // 获取某天记录（不存在则创建空记录）
    function _getDayRecord(dateStr) {
        if (!data.records[dateStr]) {
            data.records[dateStr] = {
                date: dateStr,
                morningStatus: 'missing',
                eveningStatus: 'missing',
                morningCheckInTime: '', // 上班打卡时间 HH:mm
                eveningCheckInTime: '', // 下班打卡时间 HH:mm
                diary: '',
                media: [],
                workHours: 0,
                note: '',
                statusText: '', // 打卡状态文字，比如'在家办公'、'出差'、'调休'等
                isRestDay: false, // 是否是休息日
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
        }
        return data.records[dateStr];
    }

    function _updateDayRecord(dateStr, updates) {
        const record = _getDayRecord(dateStr);
        data.records[dateStr] = { ...record, ...updates, updatedAt: Date.now() };
        _saveData();
    }

    // 判断某天是否有内容（日记、照片、视频、打卡等）
    function _hasContent(dateStr) {
        const record = data.records[dateStr];
        if (!record) return false;
        if (record.diary && record.diary.trim()) return true;
        if (record.media && record.media.length > 0) return true;
        if (record.morningStatus !== 'missing') return true;
        if (record.eveningStatus !== 'missing') return true;
        if (record.note && record.note.trim()) return true;
        if (record.statusText && record.statusText.trim()) return true;
        if (record.isRestDay) return true;
        return false;
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

    function _formatDate(dateStr) {
        const d = new Date(dateStr);
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return `${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`;
    }

    function _formatDateShort(dateStr) {
        const d = new Date(dateStr);
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        return `${d.getMonth() + 1}/${d.getDate()} 周${weekDays[d.getDay()]}`;
    }

    function _isWorkDay(dateStr) {
        const day = new Date(dateStr).getDay();
        return data.settings.workDays.includes(day);
    }

    // 计算工时：下班时间 - 上班时间 - 午休
    function _calcWorkHours(morningTime, eveningTime) {
        if (!morningTime || !eveningTime) return 0;
        const [mH, mM] = morningTime.split(':').map(Number);
        const [eH, eM] = eveningTime.split(':').map(Number);
        const morningMinutes = mH * 60 + mM;
        const eveningMinutes = eH * 60 + eM;
        const diffMinutes = eveningMinutes - morningMinutes;
        const lunchMinutes = (data.settings.lunchBreak || 1.5) * 60;
        const workMinutes = Math.max(0, diffMinutes - lunchMinutes);
        return Math.round(workMinutes / 60 * 10) / 10; // 保留1位小数
    }

    function _getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
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

    // 查看媒体
    function _viewMedia(dateStr, mediaIndex) {
        const record = data.records[dateStr];
        if (!record || !record.media || !record.media[mediaIndex]) return;
        const media = record.media[mediaIndex];

        let content;
        if (media.type === 'image') {
            content = `<div style="text-align:center;"><img src="${media.data}" style="max-width:100%; max-height:70vh; border-radius:12px;"></div>`;
        } else {
            content = `<video src="${media.data}" controls style="width:100%; max-height:70vh; border-radius:12px;"></video>`;
        }

        App.openModal(`${_formatDate(dateStr)} - ${media.name || '媒体'}`, content, { width: '95%' });
    }

    // ============================================================
    // 6. 主渲染
    // ============================================================
    function render(container) {
        containerEl = container;
        if (!data) _loadData();

        containerEl.innerHTML = `
            <div class="attendance-module">
                <!-- Tab切换 -->
                <div class="tab-bar">
                    <div class="tab-item ${activeTab === 'day' ? 'active' : ''}" data-tab="day">
                        <span class="tab-icon">📝</span>
                        <span>今日记录</span>
                    </div>
                    <div class="tab-item ${activeTab === 'calendar' ? 'active' : ''}" data-tab="calendar">
                        <span class="tab-icon">📅</span>
                        <span>日历回顾</span>
                    </div>
                </div>

                <!-- 每日记录Tab -->
                <div class="tab-content ${activeTab === 'day' ? 'active' : ''}" id="tab-day">
                    ${_renderDayView()}
                </div>

                <!-- 日历Tab -->
                <div class="tab-content ${activeTab === 'calendar' ? 'active' : ''}" id="tab-calendar">
                    ${_renderCalendarView()}
                </div>
            </div>
        `;

        _bindEvents();
    }

    // ============================================================
    // 7. 每日记录视图
    // ============================================================
    function _renderDayView() {
        const record = _getDayRecord(currentDate);
        const isToday = currentDate === _today();
        const morningInfo = CHECKIN_STATUS[record.morningStatus] || CHECKIN_STATUS.missing;
        const eveningInfo = CHECKIN_STATUS[record.eveningStatus] || CHECKIN_STATUS.missing;
        const isWorkDay = _isWorkDay(currentDate);

        return `
            <!-- 日期导航 -->
            <div class="day-nav">
                <button class="btn-icon day-nav-btn" data-action="prev-day" title="前一天">◀</button>
                <div class="day-nav-info">
                    <div class="day-nav-date">${_formatDate(currentDate)}</div>
                    ${isToday ? '<span class="day-tag today-tag">今天</span>' : ''}
                    ${!isWorkDay ? '<span class="day-tag rest-tag">休息日</span>' : ''}
                </div>
                <button class="btn-icon day-nav-btn" data-action="next-day" title="后一天">▶</button>
            </div>

            ${!isToday ? `
                <div class="back-today-bar">
                    <button class="btn-text" data-action="goto-today">📍 回到今天</button>
                </div>
            ` : ''}

            <!-- 打卡状态卡片 -->
            <div class="section-title">
                <h3><span class="title-icon">🕐</span>打卡状态</h3>
            </div>
            ${record.isRestDay ? `
                <div class="card rest-day-card">
                    <div class="rest-day-icon">🏖️</div>
                    <div class="rest-day-title">今日休息</div>
                    <div class="rest-day-desc">享受美好的休息时光吧~</div>
                    ${record.statusText ? `<div class="rest-day-status-text">${_esc(record.statusText)}</div>` : ''}
                    <button class="btn btn-outline btn-sm" data-action="toggle-rest-day">取消休息</button>
                </div>
            ` : `
                <div class="checkin-cards">
                    <div class="card checkin-card morning" data-action="edit-morning" style="border-left: 4px solid ${morningInfo.color};">
                        <div class="checkin-card-header">
                            <div class="checkin-label">
                                <span class="checkin-icon">🌅</span>
                                上班打卡
                            </div>
                            <div class="checkin-status-badge" style="background: ${morningInfo.color}20; color: ${morningInfo.color};">
                                ${morningInfo.icon} ${morningInfo.label}
                            </div>
                        </div>
                        <div class="checkin-card-time">
                            <span class="time-label">应到</span>
                            <span class="time-value">${data.settings.workStartTime}</span>
                        </div>
                        ${record.statusText ? `
                            <div class="checkin-status-tag" data-action="edit-status-text" title="点击编辑状态">
                                <span class="status-tag-icon">📌</span>
                                <span class="status-tag-text">${_esc(record.statusText)}</span>
                            </div>
                        ` : `
                            <div class="checkin-status-tag add-status-tag" data-action="edit-status-text" title="点击添加状态">
                                <span class="status-tag-icon">+</span>
                                <span class="status-tag-text">添加状态</span>
                            </div>
                        `}
                    </div>

                    <div class="card checkin-card evening" data-action="edit-evening" style="border-left: 4px solid ${eveningInfo.color};">
                        <div class="checkin-card-header">
                            <div class="checkin-label">
                                <span class="checkin-icon">🌙</span>
                                下班打卡
                            </div>
                            <div class="checkin-status-badge" style="background: ${eveningInfo.color}20; color: ${eveningInfo.color};">
                                ${eveningInfo.icon} ${eveningInfo.label}
                            </div>
                        </div>
                        <div class="checkin-card-time">
                            <span class="time-label">应走</span>
                            <span class="time-value">${data.settings.workEndTime}</span>
                        </div>
                        ${record.statusText ? `
                            <div class="checkin-status-tag" data-action="edit-status-text" title="点击编辑状态">
                                <span class="status-tag-icon">📌</span>
                                <span class="status-tag-text">${_esc(record.statusText)}</span>
                            </div>
                        ` : `
                            <div class="checkin-status-tag add-status-tag" data-action="edit-status-text" title="点击添加状态">
                                <span class="status-tag-icon">+</span>
                                <span class="status-tag-text">添加状态</span>
                            </div>
                        `}
                    </div>
                </div>

                <!-- 今日休息按钮 -->
                <div class="rest-day-toggle">
                    <button class="btn btn-outline btn-sm rest-day-btn" data-action="toggle-rest-day">
                        🏖️ 今日休息
                    </button>
                </div>
            `}

            <!-- 工作时长 -->
            <div class="card work-hours-card ${record.isRestDay ? 'rest-mode' : ''}">
                <div class="work-hours-label">${record.isRestDay ? '今日休息' : '今日工时'}</div>
                <div class="work-hours-value">
                    <span class="hours-num">${record.isRestDay ? 0 : (record.workHours || 0)}</span>
                    <span class="hours-unit">小时</span>
                </div>
                ${record.isRestDay ? '' : '<button class="btn-text" data-action="edit-hours">编辑</button>'}
            </div>

            <!-- 日记 -->
            <div class="section-title">
                <h3><span class="title-icon">📔</span>今日日记</h3>
                <span class="section-action" data-action="edit-diary">${record.diary ? '编辑' : '写日记'}</span>
            </div>
            <div class="card diary-card">
                ${record.diary && record.diary.trim() ? `
                    <div class="diary-content">${_esc(record.diary).replace(/\n/g, '<br>')}</div>
                ` : `
                    <div class="diary-empty" data-action="edit-diary">
                        <div class="diary-empty-icon">✍️</div>
                        <div class="diary-empty-text">点击记录今天的心情和收获...</div>
                    </div>
                `}
            </div>

            <!-- 照片/视频 -->
            <div class="section-title">
                <h3><span class="title-icon">📸</span>照片 & 视频</h3>
                <span class="section-action" data-action="add-media">+ 添加</span>
            </div>
            <div class="media-section">
                ${record.media && record.media.length > 0 ? `
                    <div class="media-grid">
                        ${record.media.map((m, idx) => `
                            <div class="media-item" data-action="view-media" data-index="${idx}">
                                <div class="media-thumb">
                                    ${m.type === 'image' 
                                        ? `<img src="${m.data}" alt="">` 
                                        : `<div class="video-thumb-bg"><span class="play-icon">▶</span></div>`
                                    }
                                </div>
                                <button class="media-delete-btn" data-action="delete-media" data-index="${idx}">×</button>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="media-empty">
                        <div class="media-empty-icon">🖼️</div>
                        <div class="media-empty-text">还没有上传照片或视频</div>
                        <button class="btn btn-outline btn-sm" data-action="add-media">
                            📷 上传照片/视频
                        </button>
                    </div>
                `}
            </div>

            <!-- 备注 -->
            ${record.note && record.note.trim() ? `
                <div class="section-title">
                    <h3><span class="title-icon">📝</span>备注</h3>
                </div>
                <div class="card note-card">
                    <div class="note-text">${_esc(record.note)}</div>
                </div>
            ` : ''}
        `;
    }

    function _refreshDayView() {
        const tab = containerEl?.querySelector('#tab-day');
        if (tab) {
            tab.innerHTML = _renderDayView();
            _bindDayEvents();
        }
    }

    // ============================================================
    // 8. 日历视图
    // ============================================================
    function _renderCalendarView() {
        const monthLabel = `${currentYear}年${currentMonth + 1}月`;
        const stats = _getMonthStats(currentYear, currentMonth);

        return `
            <!-- 月份切换 -->
            <div class="month-nav">
                <button class="btn-icon" data-action="prev-month">◀</button>
                <div class="month-label">${monthLabel}</div>
                <div style="display: flex; gap: 4px;">
                    <button class="btn-icon" data-action="open-settings" title="考勤设置">⚙️</button>
                    <button class="btn-icon" data-action="next-month">▶</button>
                </div>
            </div>

            <!-- 月度统计 -->
            <div class="card month-stats-card" style="background: linear-gradient(135deg, ${COLORS.primary}20, ${COLORS.evening}20);">
                <div class="month-stats-grid month-stats-grid-5">
                    <div class="month-stat">
                        <div class="month-stat-value">${stats.recordDays}</div>
                        <div class="month-stat-label">有记录</div>
                    </div>
                    <div class="month-stat">
                        <div class="month-stat-value">${stats.restDays}</div>
                        <div class="month-stat-label">休息</div>
                    </div>
                    <div class="month-stat">
                        <div class="month-stat-value">${stats.photoCount}</div>
                        <div class="month-stat-label">照片</div>
                    </div>
                    <div class="month-stat">
                        <div class="month-stat-value">${stats.diaryCount}</div>
                        <div class="month-stat-label">日记</div>
                    </div>
                    <div class="month-stat">
                        <div class="month-stat-value">${stats.totalHours.toFixed(1)}</div>
                        <div class="month-stat-label">总工时</div>
                    </div>
                </div>
            </div>

            <!-- 日历 -->
            <div class="section-title">
                <h3><span class="title-icon">📆</span>日历</h3>
                <span class="section-hint">点击日期查看记录</span>
            </div>
            <div class="attendance-calendar">
                ${_renderCalendar(currentYear, currentMonth)}
            </div>

            <!-- 最近记录 -->
            <div class="section-title">
                <h3><span class="title-icon">📋</span>最近记录</h3>
            </div>
            <div class="recent-records">
                ${_renderRecentRecords()}
            </div>
        `;
    }

    function _renderCalendar(year, month) {
        const daysInMonth = _getDaysInMonth(year, month);
        const firstDay = new Date(year, month, 1).getDay();
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

        let html = '<div class="cal-weekdays">';
        weekDays.forEach(d => {
            html += `<div class="cal-weekday">${d}</div>`;
        });
        html += '</div><div class="cal-days">';

        // 填充月初空白
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="cal-day empty"></div>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isWorkDay = _isWorkDay(dateStr);
            const isToday = dateStr === _today();
            const isSelected = dateStr === currentDate;
            const hasContent = _hasContent(dateStr);
            const record = data.records[dateStr];

            // 获取状态颜色
            let statusDot = '';
            if (hasContent) {
                if (record.isRestDay) {
                    statusDot += '<div class="cal-dot cal-dot-rest"></div>';
                }
                if (record.media && record.media.length > 0) {
                    statusDot += '<div class="cal-dot cal-dot-photo"></div>';
                }
                if (record.diary && record.diary.trim()) {
                    statusDot += '<div class="cal-dot cal-dot-diary"></div>';
                }
                if (record.morningStatus === 'normal' && record.eveningStatus === 'normal') {
                    statusDot += '<div class="cal-dot cal-dot-check"></div>';
                }
            }

            html += `
                <div class="cal-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${!isWorkDay ? 'weekend' : ''} ${record?.isRestDay ? 'rest-day' : ''} ${hasContent ? 'has-content' : ''}"
                     data-date="${dateStr}" data-action="select-date">
                    <div class="cal-day-num">${day}</div>
                    ${statusDot ? `<div class="cal-dots">${statusDot}</div>` : ''}
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    function _renderRecentRecords() {
        // 获取最近7天有内容的记录
        const records = [];
        const today = new Date();

        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = App.formatDate(d);
            if (_hasContent(dateStr)) {
                records.push({ date: dateStr, record: data.records[dateStr] });
            }
            if (records.length >= 5) break;
        }

        if (records.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <div class="empty-title">还没有记录</div>
                    <div class="empty-desc">开始记录你的每一天吧</div>
                </div>
            `;
        }

        return records.map(({ date, record }) => {
            const mediaCount = record.media?.length || 0;
            const hasDiary = record.diary && record.diary.trim();
            const morningInfo = CHECKIN_STATUS[record.morningStatus] || CHECKIN_STATUS.missing;
            const isRestDay = record.isRestDay;

            return `
                <div class="card recent-record-item" data-date="${date}" data-action="view-record">
                    <div class="recent-record-date">
                        <div class="recent-record-day">${new Date(date).getDate()}</div>
                        <div class="recent-record-month">${new Date(date).getMonth() + 1}月</div>
                    </div>
                    <div class="recent-record-info">
                        <div class="recent-record-title">${_formatDateShort(date)}</div>
                        <div class="recent-record-tags">
                            ${isRestDay ? '🏖️ 休息' : `${morningInfo.icon} ${morningInfo.label}`}
                            ${record.statusText ? ` · 📌 ${_esc(record.statusText)}` : ''}
                            ${mediaCount > 0 ? ` · 📷 ${mediaCount}张` : ''}
                            ${hasDiary ? ' · 📔 日记' : ''}
                        </div>
                    </div>
                    <div class="recent-record-arrow">›</div>
                </div>
            `;
        }).join('');
    }

    function _getMonthStats(year, month) {
        const daysInMonth = _getDaysInMonth(year, month);
        let stats = {
            recordDays: 0,
            photoCount: 0,
            diaryCount: 0,
            totalHours: 0,
            restDays: 0,
        };

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const record = data.records[dateStr];
            if (!record) continue;

            if (_hasContent(dateStr)) {
                stats.recordDays++;
            }
            if (record.media) {
                stats.photoCount += record.media.length;
            }
            if (record.diary && record.diary.trim()) {
                stats.diaryCount++;
            }
            if (record.workHours && !record.isRestDay) {
                stats.totalHours += parseFloat(record.workHours) || 0;
            }
            if (record.isRestDay) {
                stats.restDays++;
            }
        }

        return stats;
    }

    function _refreshCalendarView() {
        const tab = containerEl?.querySelector('#tab-calendar');
        if (tab) {
            tab.innerHTML = _renderCalendarView();
            _bindCalendarEvents();
        }
    }

    // ============================================================
    // 9. 模态框：编辑打卡状态
    // ============================================================
    function _openCheckinModal(period) {
        const record = _getDayRecord(currentDate);
        const isMorning = period === 'morning';
        const currentStatus = isMorning ? record.morningStatus : record.eveningStatus;
        const currentTime = isMorning ? record.morningCheckInTime : record.eveningCheckInTime;
        const periodLabel = isMorning ? '上班' : '下班';
        const color = isMorning ? COLORS.morning : COLORS.evening;
        const defaultTime = isMorning ? data.settings.workStartTime : data.settings.workEndTime;

        const html = `
            <div class="form-group">
                <label class="form-label">${periodLabel}打卡状态</label>
                <div class="status-options-grid">
                    ${Object.entries(CHECKIN_STATUS).map(([key, info]) => `
                        <div class="status-option-grid ${currentStatus === key ? 'selected' : ''}" 
                             data-status="${key}"
                             style="border-color: ${info.color};">
                            <div class="status-grid-icon" style="background: ${info.color}20; color: ${info.color};">
                                ${info.icon}
                            </div>
                            <div class="status-grid-label">${info.label}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">${periodLabel}打卡时间</label>
                <input type="time" class="form-input" id="checkinTimeInput" value="${currentTime || defaultTime}">
                <div class="form-hint">设置实际打卡时间，工时将自动计算</div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveCheckinBtn" style="background: ${color}; border-color: ${color};">
                    保存${periodLabel}状态
                </button>
            </div>
        `;

        App.openModal(`更新${periodLabel}状态`, html, {
            onOpen: () => {
                let selectedStatus = currentStatus;

                document.querySelectorAll('.status-option-grid').forEach(opt => {
                    opt.addEventListener('click', () => {
                        document.querySelectorAll('.status-option-grid').forEach(o => o.classList.remove('selected'));
                        opt.classList.add('selected');
                        selectedStatus = opt.dataset.status;
                    });
                });

                document.getElementById('saveCheckinBtn')?.addEventListener('click', () => {
                    const timeVal = document.getElementById('checkinTimeInput')?.value || '';
                    const updates = {
                        [isMorning ? 'morningStatus' : 'eveningStatus']: selectedStatus,
                        [isMorning ? 'morningCheckInTime' : 'eveningCheckInTime']: timeVal,
                    };

                    // 如果是请假，两个都设为请假
                    if (selectedStatus === 'leave') {
                        updates.morningStatus = 'leave';
                        updates.eveningStatus = 'leave';
                    }

                    // 自动计算工时
                    const rec = _getDayRecord(currentDate);
                    const morningTime = isMorning ? timeVal : rec.morningCheckInTime;
                    const eveningTime = isMorning ? rec.eveningCheckInTime : timeVal;
                    if (morningTime && eveningTime) {
                        updates.workHours = _calcWorkHours(morningTime, eveningTime);
                    }

                    _updateDayRecord(currentDate, updates);
                    App.showSuccess(`${periodLabel}状态已更新`);
                    _refreshDayView();
                    _refreshCalendarView();
                    App.closeModal();
                });
            },
        });
    }

    // ============================================================
    // 9.5 考勤设置
    // ============================================================
    function _openSettingsModal() {
        const s = data.settings;

        const html = `
            <div class="form-group">
                <label class="form-label">上班时间</label>
                <input type="time" class="form-input" id="settingStartTime" value="${s.workStartTime}">
            </div>
            <div class="form-group">
                <label class="form-label">下班时间</label>
                <input type="time" class="form-input" id="settingEndTime" value="${s.workEndTime}">
            </div>
            <div class="form-group">
                <label class="form-label">午休时长（小时）</label>
                <input type="number" class="form-input" id="settingLunchBreak" value="${s.lunchBreak || 1.5}" min="0" step="0.5">
                <div class="form-hint">工时 = 下班时间 - 上班时间 - 午休时长</div>
            </div>
            <div class="form-group">
                <label class="form-label">工作日</label>
                <div class="workdays-select">
                    ${['日', '一', '二', '三', '四', '五', '六'].map((day, idx) => `
                        <label class="workday-item ${s.workDays.includes(idx) ? 'active' : ''}">
                            <input type="checkbox" value="${idx}" ${s.workDays.includes(idx) ? 'checked' : ''} style="display:none;">
                            <span>周${day}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveSettingsBtn">保存设置</button>
            </div>
        `;

        App.openModal('考勤设置', html, {
            width: '90%',
            maxWidth: '450px',
            onOpen: () => {
                // 工作日选择
                document.querySelectorAll('.workday-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const input = item.querySelector('input');
                        input.checked = !input.checked;
                        item.classList.toggle('active');
                    });
                });

                document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
                    const startTime = document.getElementById('settingStartTime')?.value || '09:00';
                    const endTime = document.getElementById('settingEndTime')?.value || '18:00';
                    const lunchBreak = parseFloat(document.getElementById('settingLunchBreak')?.value) || 1.5;
                    const workDays = [];
                    document.querySelectorAll('.workday-item input:checked').forEach(cb => {
                        workDays.push(parseInt(cb.value));
                    });

                    data.settings = {
                        ...data.settings,
                        workStartTime: startTime,
                        workEndTime: endTime,
                        lunchBreak,
                        workDays: workDays.length > 0 ? workDays : [1, 2, 3, 4, 5],
                    };

                    _saveData();
                    _refreshDayView();
                    _refreshCalendarView();
                    App.closeModal();
                    App.showToast('设置已保存');
                });
            },
        });
    }

    // ============================================================
    // 9.5 编辑状态文字模态框
    // ============================================================
    function _openStatusTextModal() {
        const record = _getDayRecord(currentDate);

        const quickTags = ['在家办公', '出差', '调休', '年假', '病假', '事假', '外出', '培训'];

        const html = `
            <div class="form-group">
                <label class="form-label">打卡状态文字</label>
                <input type="text" class="form-input" id="statusTextInput" value="${_esc(record.statusText || '')}" placeholder="例如：在家办公、出差、调休等">
                <div class="form-hint">简短描述今天的工作状态</div>
            </div>
            <div class="form-group">
                <label class="form-label">快捷标签</label>
                <div class="quick-tags">
                    ${quickTags.map(tag => `
                        <span class="quick-tag ${record.statusText === tag ? 'active' : ''}" data-tag="${tag}">${tag}</span>
                    `).join('')}
                </div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveStatusTextBtn">保存</button>
            </div>
        `;

        App.openModal('编辑状态文字', html, {
            onOpen: () => {
                // 快捷标签点击
                document.querySelectorAll('.quick-tag').forEach(tagEl => {
                    tagEl.addEventListener('click', () => {
                        const tag = tagEl.dataset.tag;
                        const input = document.getElementById('statusTextInput');
                        if (input) {
                            input.value = tag;
                        }
                        document.querySelectorAll('.quick-tag').forEach(t => t.classList.remove('active'));
                        tagEl.classList.add('active');
                    });
                });

                document.getElementById('saveStatusTextBtn')?.addEventListener('click', () => {
                    const statusText = document.getElementById('statusTextInput')?.value.trim() || '';
                    _updateDayRecord(currentDate, { statusText });
                    App.showSuccess('状态已更新');
                    _refreshDayView();
                    _refreshCalendarView();
                    App.closeModal();
                });
            },
        });
    }

    // ============================================================
    // 9.6 切换休息日
    // ============================================================
    function _toggleRestDay() {
        const record = _getDayRecord(currentDate);
        const newIsRestDay = !record.isRestDay;
        const updates = { isRestDay: newIsRestDay };

        // 如果设为休息日，工时设为0
        if (newIsRestDay) {
            updates.workHours = 0;
        }

        _updateDayRecord(currentDate, updates);
        App.showSuccess(newIsRestDay ? '已标记为休息日' : '已取消休息');
        _refreshDayView();
        _refreshCalendarView();
    }

    // ============================================================
    // 10. 模态框：编辑工时
    // ============================================================
    function _openHoursModal() {
        const record = _getDayRecord(currentDate);

        const html = `
            <div class="form-group">
                <label class="form-label">今日工时（小时）</label>
                <input type="number" class="form-input" id="workHoursInput" value="${record.workHours || ''}" min="0" step="0.5" placeholder="例如：8">
            </div>
            <div class="form-group">
                <label class="form-label">备注</label>
                <textarea class="form-textarea" id="noteInput" rows="2" placeholder="补充说明...">${_esc(record.note || '')}</textarea>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveHoursBtn">保存</button>
            </div>
        `;

        App.openModal('编辑工时', html, {
            onOpen: () => {
                document.getElementById('saveHoursBtn')?.addEventListener('click', () => {
                    const workHours = parseFloat(document.getElementById('workHoursInput').value) || 0;
                    const note = document.getElementById('noteInput').value.trim();
                    _updateDayRecord(currentDate, { workHours, note });
                    App.showSuccess('已保存');
                    _refreshDayView();
                    _refreshCalendarView();
                    App.closeModal();
                });
            },
        });
    }

    // ============================================================
    // 11. 模态框：写日记
    // ============================================================
    function _openDiaryModal() {
        const record = _getDayRecord(currentDate);

        const html = `
            <div class="form-group">
                <label class="form-label">今日日记</label>
                <textarea class="form-textarea" id="diaryInput" rows="8" 
                          placeholder="今天发生了什么？有什么收获或感悟？记录下来吧...">${_esc(record.diary || '')}</textarea>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveDiaryBtn">保存日记</button>
            </div>
        `;

        App.openModal('写日记', html, {
            width: '90%',
            maxWidth: '500px',
            onOpen: () => {
                const textarea = document.getElementById('diaryInput');
                if (textarea) textarea.focus();

                document.getElementById('saveDiaryBtn')?.addEventListener('click', () => {
                    const diary = document.getElementById('diaryInput').value;
                    _updateDayRecord(currentDate, { diary });
                    App.showSuccess('日记已保存');
                    _refreshDayView();
                    _refreshCalendarView();
                    App.closeModal();
                });
            },
        });
    }

    // ============================================================
    // 12. 模态框：添加媒体
    // ============================================================
    function _openMediaModal() {
        const record = _getDayRecord(currentDate);
        let mediaList = [...(record.media || [])];

        function renderMediaPreview() {
            const container = document.getElementById('mediaPreviewContainer');
            if (!container) return;
            if (mediaList.length === 0) {
                container.innerHTML = '<div class="empty-state-sm">还没有上传照片或视频</div>';
                return;
            }
            container.innerHTML = mediaList.map((m, idx) => `
                <div class="media-thumb-item">
                    <div class="media-thumb" data-action="preview-media" data-idx="${idx}">
                        ${m.type === 'image' 
                            ? `<img src="${m.data}" alt="">` 
                            : `<div class="video-thumb-bg"><span class="play-icon">▶</span></div>`
                        }
                    </div>
                    <button class="media-remove" data-idx="${idx}">×</button>
                </div>
            `).join('');

            // 删除按钮
            container.querySelectorAll('.media-remove').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.idx);
                    mediaList.splice(idx, 1);
                    renderMediaPreview();
                });
            });

            // 预览
            container.querySelectorAll('[data-action="preview-media"]').forEach(item => {
                item.addEventListener('click', () => {
                    const idx = parseInt(item.dataset.idx);
                    const m = mediaList[idx];
                    if (!m) return;
                    let content;
                    if (m.type === 'image') {
                        content = `<div style="text-align:center;"><img src="${m.data}" style="max-width:100%; max-height:70vh; border-radius:12px;"></div>`;
                    } else {
                        content = `<video src="${m.data}" controls style="width:100%; max-height:70vh; border-radius:12px;"></video>`;
                    }
                    App.openModal(m.name || '预览', content, { width: '95%' });
                });
            });
        }

        const html = `
            <div class="form-group">
                <label class="form-label">上传照片/视频</label>
                <div class="media-upload-area">
                    <button class="btn btn-outline btn-sm" id="uploadImageBtn" type="button">
                        📷 添加照片
                    </button>
                    <button class="btn btn-outline btn-sm" id="uploadVideoBtn" type="button">
                        🎬 添加视频
                    </button>
                    <input type="file" id="imageInput" accept="image/*" style="display:none;" multiple>
                    <input type="file" id="videoInput" accept="video/*" style="display:none;">
                </div>
                <div class="form-hint">提示：照片会自动压缩，视频会保留原画质</div>
            </div>
            <div class="form-group">
                <label class="form-label">已上传（${mediaList.length}个）</label>
                <div class="media-preview-grid" id="mediaPreviewContainer"></div>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveMediaBtn">保存到${_formatDate(currentDate)}</button>
            </div>
        `;

        App.openModal('添加照片/视频', html, {
            width: '90%',
            maxWidth: '500px',
            onOpen: () => {
                renderMediaPreview();

                // 上传图片
                document.getElementById('uploadImageBtn')?.addEventListener('click', () => {
                    document.getElementById('imageInput')?.click();
                });
                document.getElementById('imageInput')?.addEventListener('change', (e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(file => {
                        if (!file.type.startsWith('image/')) return;
                        _compressImage(file, 1200, 0.75).then(compressedData => {
                            mediaList.push({
                                type: 'image',
                                data: compressedData,
                                name: file.name,
                                size: file.size,
                                createdAt: Date.now(),
                            });
                            renderMediaPreview();
                        });
                    });
                    e.target.value = '';
                });

                // 上传视频
                document.getElementById('uploadVideoBtn')?.addEventListener('click', () => {
                    document.getElementById('videoInput')?.click();
                });
                document.getElementById('videoInput')?.addEventListener('change', (e) => {
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

                // 保存
                document.getElementById('saveMediaBtn')?.addEventListener('click', () => {
                    _updateDayRecord(currentDate, { media: mediaList });
                    App.showSuccess(`已保存 ${mediaList.length} 个媒体文件`);
                    _refreshDayView();
                    _refreshCalendarView();
                    App.closeModal();
                });
            },
        });
    }

    // ============================================================
    // 13. 删除媒体
    // ============================================================
    async function _deleteMedia(index) {
        const ok = await App.confirmModal('删除确认', '确定要删除这个媒体文件吗？');
        if (!ok) return;

        const record = _getDayRecord(currentDate);
        const newMedia = [...(record.media || [])];
        newMedia.splice(index, 1);
        _updateDayRecord(currentDate, { media: newMedia });
        App.showSuccess('已删除');
        _refreshDayView();
        _refreshCalendarView();
    }

    // ============================================================
    // 14. 事件绑定
    // ============================================================
    function _bindEvents() {
        if (!containerEl) return;

        // Tab切换
        containerEl.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', () => {
                activeTab = tab.dataset.tab;
                containerEl.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                containerEl.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                containerEl.querySelector(`#tab-${activeTab}`).classList.add('active');
            });
        });

        _bindDayEvents();
        _bindCalendarEvents();
    }

    function _bindDayEvents() {
        if (!containerEl) return;

        // 日期导航
        containerEl.querySelector('[data-action="prev-day"]')?.addEventListener('click', () => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() - 1);
            currentDate = App.formatDate(d);
            _refreshDayView();
        });

        containerEl.querySelector('[data-action="next-day"]')?.addEventListener('click', () => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() + 1);
            currentDate = App.formatDate(d);
            _refreshDayView();
        });

        containerEl.querySelector('[data-action="goto-today"]')?.addEventListener('click', () => {
            currentDate = _today();
            _refreshDayView();
        });

        // 打卡状态
        containerEl.querySelector('[data-action="edit-morning"]')?.addEventListener('click', () => {
            _openCheckinModal('morning');
        });

        containerEl.querySelector('[data-action="edit-evening"]')?.addEventListener('click', () => {
            _openCheckinModal('evening');
        });

        // 状态文字编辑
        containerEl.querySelectorAll('[data-action="edit-status-text"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _openStatusTextModal();
            });
        });

        // 切换休息日
        containerEl.querySelector('[data-action="toggle-rest-day"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            _toggleRestDay();
        });

        // 工时
        containerEl.querySelector('[data-action="edit-hours"]')?.addEventListener('click', () => {
            _openHoursModal();
        });

        // 日记
        containerEl.querySelectorAll('[data-action="edit-diary"]').forEach(btn => {
            btn.addEventListener('click', () => {
                _openDiaryModal();
            });
        });

        // 媒体
        containerEl.querySelectorAll('[data-action="add-media"]').forEach(btn => {
            btn.addEventListener('click', () => {
                _openMediaModal();
            });
        });

        // 查看媒体
        containerEl.querySelectorAll('[data-action="view-media"]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(item.dataset.index);
                _viewMedia(currentDate, index);
            });
        });

        // 删除媒体
        containerEl.querySelectorAll('[data-action="delete-media"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                _deleteMedia(index);
            });
        });
    }

    function _bindCalendarEvents() {
        if (!containerEl) return;

        // 考勤设置
        containerEl.querySelector('[data-action="open-settings"]')?.addEventListener('click', () => {
            _openSettingsModal();
        });

        // 月份切换
        containerEl.querySelector('[data-action="prev-month"]')?.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            _refreshCalendarView();
        });

        containerEl.querySelector('[data-action="next-month"]')?.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            _refreshCalendarView();
        });

        // 日历日期点击
        containerEl.querySelectorAll('[data-action="select-date"]').forEach(day => {
            day.addEventListener('click', () => {
                const date = day.dataset.date;
                if (date) {
                    currentDate = date;
                    activeTab = 'day';
                    render(containerEl);
                }
            });
        });

        // 最近记录点击
        containerEl.querySelectorAll('[data-action="view-record"]').forEach(item => {
            item.addEventListener('click', () => {
                const date = item.dataset.date;
                if (date) {
                    currentDate = date;
                    activeTab = 'day';
                    render(containerEl);
                }
            });
        });
    }

    // ============================================================
    // 15. 对外接口
    // ============================================================
    function onAdd() {
        // 顶部+按钮：打开媒体上传
        _openMediaModal();
    }

    function onResume() {
        if (containerEl) {
            _loadData();
            render(containerEl);
        }
    }

    return {
        init,
        render,
        onAdd,
        onResume,
    };
})();

// 注册模块
if (typeof App !== 'undefined' && App.registerModule) {
    App.registerModule('attendance', AttendanceModule);
}
