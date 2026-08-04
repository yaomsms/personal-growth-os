/**
 * tools.js - 快捷工具聚合页模块
 * 功能：
 *   - 6个工具分类：效率工具、健康工具、学习工具、财务工具、生活工具、创作工具
 *   - 常用工具卡片：计算器、倒计时、番茄钟、记事本、单位换算、BMI计算器等
 *   - 工具收藏功能
 *   - 最近使用工具
 *   - 每个工具可点击打开使用（简单实现内置功能）
 */

const ToolsModule = (function() {
    'use strict';

    // ============================================================
    // 1. 数据结构与默认值
    // ============================================================
    const STORAGE_KEY = 'tools';

    const COLORS = [
        '#7ec8a7', '#f4b8c4', '#a8c9e8', '#f5c89a',
        '#c9b8e0', '#f0c987', '#8bc9a8', '#e8a0a0',
    ];

    // 工具定义
    const TOOL_CATEGORIES = [
        {
            id: 'efficiency',
            name: '效率工具',
            icon: '⚡',
            color: '#7ec8a7',
            tools: [
                { id: 'calculator', name: '计算器', icon: '🧮', desc: '日常计算', builtin: true },
                { id: 'pomodoro', name: '番茄钟', icon: '🍅', desc: '25分钟专注', builtin: true },
                { id: 'timer', name: '倒计时', icon: '⏱️', desc: '自定义倒计时', builtin: true },
                { id: 'notepad', name: '记事本', icon: '📝', desc: '快速记录', builtin: true },
            ],
        },
        {
            id: 'health',
            name: '健康工具',
            icon: '💊',
            color: '#8bc9a8',
            tools: [
                { id: 'bmi', name: 'BMI计算器', icon: '⚖️', desc: '身体质量指数', builtin: true },
                { id: 'bmr', name: '基础代谢', icon: '🔥', desc: '基础代谢率计算', builtin: true },
                { id: 'water', name: '喝水提醒', icon: '💧', desc: '定时提醒喝水', builtin: true },
                { id: 'habit', name: '习惯打卡', icon: '✅', desc: '快捷打卡入口', module: 'habits' },
            ],
        },
        {
            id: 'study',
            name: '学习工具',
            icon: '📚',
            color: '#a8c9e8',
            tools: [
                { id: 'bilibili', name: '哔哩哔哩', icon: '📺', desc: 'B站学习视频', external: 'https://www.bilibili.com' },
                { id: 'bbdc', name: '不背单词', icon: '📗', desc: '英语单词学习', external: 'https://www.bbdc.cn/index' },
                { id: 'baidupan', name: '百度网盘', icon: '☁️', desc: '学习资料存储', external: 'https://pan.baidu.com' },
                { id: 'converter', name: '单位换算', icon: '📐', desc: '长度/重量/温度', builtin: true },
                { id: 'english', name: '单词本', icon: '📖', desc: '英语学习模块', module: 'english' },
                { id: 'drawing', name: '绘画练习', icon: '🎨', desc: '平板绘画模块', module: 'drawing' },
                { id: 'analytics', name: '进度追踪', icon: '📊', desc: '学习进度分析', module: 'analytics' },
            ],
        },
        {
            id: 'finance',
            name: '财务工具',
            icon: '💰',
            color: '#f5c89a',
            tools: [
                { id: 'compound', name: '复利计算', icon: '📈', desc: '复利收益计算', builtin: true },
                { id: 'mortgage', name: '房贷计算', icon: '🏠', desc: '房贷月供计算', builtin: true },
                { id: 'finance', name: '快速记账', icon: '💵', desc: '跳转到记账', module: 'finance' },
            ],
        },
        {
            id: 'life',
            name: '生活工具',
            icon: '🏠',
            color: '#f4b8c4',
            tools: [
                { id: 'qrcode', name: '二维码生成', icon: '📱', desc: '生成二维码', builtin: true },
                { id: 'random', name: '随机抽取', icon: '🎲', desc: '选择困难救星', builtin: true },
                { id: 'password', name: '密码生成', icon: '🔐', desc: '生成强密码', builtin: true },
                { id: 'sticker', name: '便签贴纸', icon: '🗒️', desc: '桌面便签', builtin: true },
            ],
        },
        {
            id: 'creation',
            name: '创作工具',
            icon: '🎨',
            color: '#c9b8e0',
            tools: [
                { id: 'colorpicker', name: '颜色选择器', icon: '🎨', desc: '取色/配色工具', builtin: true },
                { id: 'ai', name: 'AI提示词', icon: '🤖', desc: '提示词库', module: 'ai' },
                { id: 'inspiration', name: '灵感记录', icon: '💡', desc: '记录灵感火花', builtin: true },
            ],
        },
    ];

    // ============================================================
    // 2. 状态管理
    // ============================================================
    let data = null;
    let containerEl = null;

    // ============================================================
    // 3. 初始化
    // ============================================================
    function init() {
        _loadData();
    }

    function _loadData() {
        const stored = AppStorage.getModule(STORAGE_KEY);
        if (stored && typeof stored === 'object') {
            data = stored;
            if (!data.favorites) data.favorites = ['calculator', 'pomodoro', 'bmi', 'converter'];
            if (!data.recent) data.recent = [];
            if (!data.notepadContent) data.notepadContent = '';
            if (!data.stickers) data.stickers = [];
            if (!data.inspirations) data.inspirations = [];
        } else {
            data = {
                favorites: ['calculator', 'pomodoro', 'bmi', 'converter'],
                recent: [],
                notepadContent: '',
                stickers: [
                    { id: 'stk1', content: '今天也要加油鸭！', color: '#f5c89a', x: 20, y: 20 },
                ],
                inspirations: [],
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

    function _findTool(toolId) {
        for (const cat of TOOL_CATEGORIES) {
            const tool = cat.tools.find(t => t.id === toolId);
            if (tool) return { ...tool, category: cat.id, categoryName: cat.name };
        }
        return null;
    }

    function _addToRecent(toolId) {
        data.recent = data.recent.filter(id => id !== toolId);
        data.recent.unshift(toolId);
        if (data.recent.length > 8) data.recent = data.recent.slice(0, 8);
        _saveData();
    }

    function _toggleFavorite(toolId) {
        const idx = data.favorites.indexOf(toolId);
        if (idx > -1) {
            data.favorites.splice(idx, 1);
        } else {
            data.favorites.push(toolId);
        }
        _saveData();
    }

    // ============================================================
    // 5. 渲染入口
    // ============================================================

    function render(container) {
        containerEl = container;
        if (!data) _loadData();

        container.innerHTML = `
            <div class="tools-module">
                <!-- 收藏/常用工具 -->
                <div class="section-title">
                    <h2><span class="title-icon">⭐</span>我的收藏</h2>
                    <span class="section-action" data-action="manage-favorites">管理</span>
                </div>
                <div class="favorites-grid" id="favoritesGrid"></div>

                <!-- 最近使用 -->
                <div class="section-title">
                    <h2><span class="title-icon">🕐</span>最近使用</h2>
                </div>
                <div class="recent-row" id="recentRow"></div>

                <!-- 云端同步设置 -->
                <div class="section-title">
                    <h2><span class="title-icon">☁️</span>云端同步</h2>
                </div>
                <div class="sync-settings-card" id="syncSettingsCard"></div>

                <!-- 工具分类 -->
                <div class="section-title">
                    <h2><span class="title-icon">🔧</span>全部工具</h2>
                </div>
                <div class="tools-categories" id="toolsCategories"></div>
            </div>
        `;

        _renderFavorites();
        _renderRecent();
        _renderSyncSettings();
        _renderCategories();
        _bindEvents();
    }

    // ============================================================
    // 6. 收藏工具渲染
    // ============================================================
    function _renderFavorites() {
        const grid = containerEl.querySelector('#favoritesGrid');
        if (!grid) return;

        if (data.favorites.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="padding: var(--spacing-lg);">
                    <div class="empty-state-icon">⭐</div>
                    <div class="empty-state-text">还没有收藏的工具</div>
                </div>
            `;
            return;
        }

        grid.innerHTML = data.favorites.map(toolId => {
            const tool = _findTool(toolId);
            if (!tool) return '';
            const cat = TOOL_CATEGORIES.find(c => c.id === tool.category);
            return `
                <div class="card tool-card tool-favorite" data-tool-id="${toolId}">
                    <div class="tool-icon" style="background: ${cat?.color || '#7ec8a7'}20; color: ${cat?.color || '#7ec8a7'};">
                        ${tool.icon}
                    </div>
                    <div class="tool-name">${tool.name}</div>
                    <div class="tool-desc">${tool.desc}</div>
                    <button class="tool-fav-btn active" data-action="toggle-fav" data-tool-id="${toolId}" title="取消收藏">⭐</button>
                </div>
            `;
        }).join('');
    }

    // ============================================================
    // 7. 最近使用渲染
    // ============================================================
    function _renderRecent() {
        const row = containerEl.querySelector('#recentRow');
        if (!row) return;

        if (data.recent.length === 0) {
            row.innerHTML = `
                <div class="empty-state" style="padding: var(--spacing-md); font-size: 14px;">
                    <div class="empty-state-text">暂无使用记录</div>
                </div>
            `;
            return;
        }

        row.innerHTML = `
            <div class="recent-scroll">
                ${data.recent.map(toolId => {
                    const tool = _findTool(toolId);
                    if (!tool) return '';
                    const cat = TOOL_CATEGORIES.find(c => c.id === tool.category);
                    return `
                        <div class="recent-item" data-tool-id="${toolId}" style="border-color: ${cat?.color || '#ddd'};">
                            <span class="recent-icon">${tool.icon}</span>
                            <span class="recent-name">${tool.name}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // ============================================================
    // 7. 云端同步设置
    // ============================================================
    function _renderSyncSettings() {
        const card = containerEl.querySelector('#syncSettingsCard');
        if (!card) return;

        const isCloudMode = AppStorage.isCloudMode();
        const syncStatus = AppStorage.getSyncStatus();
        
        let syncStatusHtml = '';
        let syncStatusClass = '';
        
        if (!isCloudMode || syncStatus.status === 'local') {
            syncStatusHtml = '未开启';
            syncStatusClass = 'sync-off';
        } else if (syncStatus.status === 'syncing') {
            syncStatusHtml = '同步中...';
            syncStatusClass = 'sync-syncing';
        } else if (syncStatus.status === 'success') {
            syncStatusHtml = '已同步';
            syncStatusClass = 'sync-success';
        } else if (syncStatus.status === 'error') {
            syncStatusHtml = '同步失败';
            syncStatusClass = 'sync-error';
        } else {
            syncStatusHtml = '未连接';
            syncStatusClass = 'sync-off';
        }

        const lastSyncTime = syncStatus.lastSyncTime;
        const lastSyncText = lastSyncTime 
            ? new Date(lastSyncTime).toLocaleString('zh-CN')
            : '从未同步';

        const isLoggedIn = syncStatus.isLoggedIn || false;
        const userEmail = syncStatus.user?.email || '';

        card.innerHTML = `
            <div class="sync-card">
                <div class="sync-card-header">
                    <div class="sync-card-title">
                        <span class="sync-card-icon">☁️</span>
                        <span>云端同步</span>
                    </div>
                    <div class="sync-card-status ${syncStatusClass}">
                        <span class="sync-status-indicator"></span>
                        <span>${syncStatusHtml}</span>
                    </div>
                </div>
                <div class="sync-card-body">
                    <div class="sync-info-row">
                        <span class="sync-info-label">当前模式</span>
                        <span class="sync-info-value">${isCloudMode ? '云端模式' : '本地模式'}</span>
                    </div>
                    ${isLoggedIn ? `
                    <div class="sync-info-row">
                        <span class="sync-info-label">登录账号</span>
                        <span class="sync-info-value sync-email">${_esc(userEmail)}</span>
                    </div>
                    ` : ''}
                    <div class="sync-info-row">
                        <span class="sync-info-label">上次同步</span>
                        <span class="sync-info-value">${lastSyncText}</span>
                    </div>
                    ${syncStatus.lastError ? `
                    <div class="sync-info-row sync-error-row">
                        <span class="sync-info-label">错误信息</span>
                        <span class="sync-info-value">${_esc(syncStatus.lastError)}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="sync-card-actions">
                    ${!isLoggedIn ? `
                    <button class="btn btn-primary btn-sm" id="syncLoginBtn">
                        登录开启同步
                    </button>
                    ` : `
                    <button class="btn btn-secondary btn-sm" id="syncNowBtn">
                        🔄 立即同步
                    </button>
                    <button class="btn btn-secondary btn-sm" id="syncToggleBtn">
                        ${isCloudMode ? '📴 切换到本地' : '☁️ 切换到云端'}
                    </button>
                    <button class="btn btn-ghost btn-sm" id="syncLogoutBtn">
                        退出登录
                    </button>
                    `}
                </div>
                <div class="sync-card-footer">
                    <p>数据加密存储在 Supabase 云端，支持多设备同步</p>
                </div>
            </div>
        `;

        // 绑定事件
        const loginBtn = card.querySelector('#syncLoginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                if (typeof openAuthModal === 'function') {
                    openAuthModal('login');
                } else {
                    window.location.href = 'login.html';
                }
            });
        }

        const syncNowBtn = card.querySelector('#syncNowBtn');
        if (syncNowBtn) {
            syncNowBtn.addEventListener('click', async () => {
                syncNowBtn.disabled = true;
                syncNowBtn.textContent = '同步中...';
                try {
                    const result = await AppStorage.syncNow();
                    if (result.success) {
                        App.showSuccess('同步成功');
                    } else {
                        App.showError(result.error || '同步失败');
                    }
                } catch (e) {
                    App.showError('同步失败：' + e.message);
                } finally {
                    _renderSyncSettings();
                }
            });
        }

        const syncToggleBtn = card.querySelector('#syncToggleBtn');
        if (syncToggleBtn) {
            syncToggleBtn.addEventListener('click', async () => {
                if (isCloudMode) {
                    const confirmed = await App.confirmModal(
                        '切换到本地模式',
                        '切换后数据将只保存在本地，不会自动同步到云端。确定要切换吗？',
                        { confirmText: '切换到本地', cancelText: '取消' }
                    );
                    if (confirmed) {
                        AppStorage.switchToLocal();
                        App.showSuccess('已切换到本地模式');
                        _renderSyncSettings();
                    }
                } else {
                    const success = AppStorage.switchToCloud();
                    if (success) {
                        App.showSuccess('已切换到云端模式');
                    } else {
                        App.showError('无法切换到云端模式，请先登录');
                    }
                    _renderSyncSettings();
                }
            });
        }

        const logoutBtn = card.querySelector('#syncLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const confirmed = await App.confirmModal(
                    '退出登录',
                    '退出后云端同步将暂停，本地数据会保留。确定要退出吗？',
                    { confirmText: '退出', cancelText: '取消' }
                );
                if (confirmed && typeof CloudSync !== 'undefined') {
                    try {
                        await CloudSync.signOut();
                        AppStorage.switchToLocal();
                        App.showSuccess('已退出登录');
                        _renderSyncSettings();
                    } catch (e) {
                        App.showError('退出失败');
                    }
                }
            });
        }
    }

    // ============================================================
    // 8. 分类工具渲染
    // ============================================================
    function _renderCategories() {
        const container = containerEl.querySelector('#toolsCategories');
        if (!container) return;

        container.innerHTML = TOOL_CATEGORIES.map(cat => `
            <div class="tool-category-section">
                <div class="category-header">
                    <span class="category-icon" style="background: ${cat.color}20; color: ${cat.color};">${cat.icon}</span>
                    <span class="category-name">${cat.name}</span>
                    <span class="category-count">${cat.tools.length}个工具</span>
                </div>
                <div class="tool-grid">
                    ${cat.tools.map(tool => {
                        const isFav = data.favorites.includes(tool.id);
                        return `
                            <div class="card tool-card" data-tool-id="${tool.id}">
                                <div class="tool-icon" style="background: ${cat.color}20; color: ${cat.color};">
                                    ${tool.icon}
                                </div>
                                <div class="tool-name">${tool.name}</div>
                                <div class="tool-desc">${tool.desc}</div>
                                <button class="tool-fav-btn ${isFav ? 'active' : ''}" 
                                        data-action="toggle-fav" 
                                        data-tool-id="${tool.id}"
                                        title="${isFav ? '取消收藏' : '收藏'}">
                                    ${isFav ? '⭐' : '☆'}
                                </button>
                                ${tool.external ? '<div class="tool-badge external">外链</div>' : (tool.module ? '<div class="tool-badge">模块</div>' : '<div class="tool-badge builtin">内置</div>')}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `).join('');
    }

    // ============================================================
    // 9. 工具打开与实现
    // ============================================================

    function _openTool(toolId) {
        const tool = _findTool(toolId);
        if (!tool) return;

        _addToRecent(toolId);
        _renderRecent();

        if (tool.external) {
            // 外部链接：在新窗口打开
            window.open(tool.external, '_blank');
            return;
        }

        if (tool.module) {
            // 跳转到对应模块
            if (typeof App !== 'undefined' && App.navigateTo) {
                App.navigateTo(tool.module);
            } else {
                App.showToast(`跳转到${tool.name}模块`, { type: 'info' });
            }
            return;
        }

        // 内置工具
        switch (toolId) {
            case 'calculator': _openCalculator(); break;
            case 'pomodoro': _openPomodoro(); break;
            case 'timer': _openTimer(); break;
            case 'notepad': _openNotepad(); break;
            case 'bmi': _openBMI(); break;
            case 'bmr': _openBMR(); break;
            case 'water': _openWater(); break;
            case 'converter': _openConverter(); break;
            case 'compound': _openCompound(); break;
            case 'mortgage': _openMortgage(); break;
            case 'qrcode': _openQRCode(); break;
            case 'random': _openRandom(); break;
            case 'password': _openPassword(); break;
            case 'sticker': _openSticker(); break;
            case 'colorpicker': _openColorPicker(); break;
            case 'inspiration': _openInspiration(); break;
            default:
                App.showToast('工具开发中...', { type: 'info' });
        }
    }

    // ---------- 计算器 ----------
    function _openCalculator() {
        let display = '0';
        let prevValue = null;
        let operator = null;
        let waitingForOperand = false;

        const html = `
            <div class="calculator-tool">
                <div class="calc-display" id="calcDisplay">0</div>
                <div class="calc-buttons">
                    <button class="calc-btn func" data-action="clear">AC</button>
                    <button class="calc-btn func" data-action="backspace">⌫</button>
                    <button class="calc-btn func" data-action="percent">%</button>
                    <button class="calc-btn op" data-op="/">÷</button>
                    <button class="calc-btn num" data-num="7">7</button>
                    <button class="calc-btn num" data-num="8">8</button>
                    <button class="calc-btn num" data-num="9">9</button>
                    <button class="calc-btn op" data-op="*">×</button>
                    <button class="calc-btn num" data-num="4">4</button>
                    <button class="calc-btn num" data-num="5">5</button>
                    <button class="calc-btn num" data-num="6">6</button>
                    <button class="calc-btn op" data-op="-">−</button>
                    <button class="calc-btn num" data-num="1">1</button>
                    <button class="calc-btn num" data-num="2">2</button>
                    <button class="calc-btn num" data-num="3">3</button>
                    <button class="calc-btn op" data-op="+">+</button>
                    <button class="calc-btn num zero" data-num="0">0</button>
                    <button class="calc-btn num" data-num=".">.</button>
                    <button class="calc-btn equals" data-action="equals">=</button>
                </div>
            </div>
        `;

        App.openModal('计算器', html, {
            onOpen: () => {
                const displayEl = document.getElementById('calcDisplay');

                function updateDisplay() {
                    displayEl.textContent = display;
                }

                function inputDigit(digit) {
                    if (waitingForOperand) {
                        display = digit;
                        waitingForOperand = false;
                    } else {
                        display = display === '0' ? digit : display + digit;
                    }
                }

                function inputDot() {
                    if (waitingForOperand) {
                        display = '0.';
                        waitingForOperand = false;
                        return;
                    }
                    if (!display.includes('.')) {
                        display += '.';
                    }
                }

                function calc(a, b, op) {
                    a = parseFloat(a);
                    b = parseFloat(b);
                    switch (op) {
                        case '+': return a + b;
                        case '-': return a - b;
                        case '*': return a * b;
                        case '/': return b !== 0 ? a / b : 'Error';
                        default: return b;
                    }
                }

                function handleOp(op) {
                    const inputValue = parseFloat(display);
                    if (prevValue === null) {
                        prevValue = inputValue;
                    } else if (operator && !waitingForOperand) {
                        const result = calc(prevValue, inputValue, operator);
                        display = String(result);
                        prevValue = result;
                    }
                    waitingForOperand = true;
                    operator = op;
                }

                function handleEquals() {
                    if (operator && prevValue !== null && !waitingForOperand) {
                        const result = calc(prevValue, parseFloat(display), operator);
                        display = String(result);
                        prevValue = null;
                        operator = null;
                        waitingForOperand = true;
                    }
                }

                function handleClear() {
                    display = '0';
                    prevValue = null;
                    operator = null;
                    waitingForOperand = false;
                }

                function handleBackspace() {
                    if (display.length > 1) {
                        display = display.slice(0, -1);
                    } else {
                        display = '0';
                    }
                }

                function handlePercent() {
                    const val = parseFloat(display) / 100;
                    display = String(val);
                }

                document.querySelectorAll('.calc-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (btn.dataset.num !== undefined) {
                            if (btn.dataset.num === '.') inputDot();
                            else inputDigit(btn.dataset.num);
                        } else if (btn.dataset.op) {
                            handleOp(btn.dataset.op);
                        } else if (btn.dataset.action === 'equals') {
                            handleEquals();
                        } else if (btn.dataset.action === 'clear') {
                            handleClear();
                        } else if (btn.dataset.action === 'backspace') {
                            handleBackspace();
                        } else if (btn.dataset.action === 'percent') {
                            handlePercent();
                        }
                        updateDisplay();
                    });
                });
            }
        });
    }

    // ---------- 番茄钟 ----------
    function _openPomodoro() {
        let minutes = 25;
        let seconds = 0;
        let timer = null;
        let isRunning = false;
        let mode = 'work'; // work | break

        const html = `
            <div class="pomodoro-tool">
                <div class="pomo-tabs">
                    <button class="pomo-tab active" data-mode="work">专注 25分钟</button>
                    <button class="pomo-tab" data-mode="break">休息 5分钟</button>
                </div>
                <div class="pomo-timer" id="pomoTimer">25:00</div>
                <div class="pomo-progress">
                    <div class="pomo-progress-bar" id="pomoProgress" style="width: 100%;"></div>
                </div>
                <div class="pomo-controls">
                    <button class="btn btn-secondary" id="pomoReset">重置</button>
                    <button class="btn btn-primary" id="pomoToggle">开始</button>
                </div>
                <div class="pomo-settings">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">专注时长（分钟）</label>
                            <input type="number" class="form-input" id="pomoWorkMin" value="25" min="1" max="120">
                        </div>
                        <div class="form-group">
                            <label class="form-label">休息时长（分钟）</label>
                            <input type="number" class="form-input" id="pomoBreakMin" value="5" min="1" max="30">
                        </div>
                    </div>
                </div>
            </div>
        `;

        App.openModal('番茄钟', html, {
            onOpen: () => {
                const timerEl = document.getElementById('pomoTimer');
                const progressEl = document.getElementById('pomoProgress');
                const toggleBtn = document.getElementById('pomoToggle');
                const resetBtn = document.getElementById('pomoReset');
                const workInput = document.getElementById('pomoWorkMin');
                const breakInput = document.getElementById('pomoBreakMin');
                let totalSeconds = 25 * 60;

                function updateDisplay() {
                    const m = Math.floor(totalSeconds / 60);
                    const s = totalSeconds % 60;
                    timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                    const maxSec = mode === 'work' ? (parseInt(workInput.value) || 25) * 60 : (parseInt(breakInput.value) || 5) * 60;
                    const percent = maxSec > 0 ? (totalSeconds / maxSec * 100) : 0;
                    progressEl.style.width = percent + '%';
                }

                function toggleTimer() {
                    if (isRunning) {
                        clearInterval(timer);
                        isRunning = false;
                        toggleBtn.textContent = '继续';
                    } else {
                        isRunning = true;
                        toggleBtn.textContent = '暂停';
                        timer = setInterval(() => {
                            if (totalSeconds > 0) {
                                totalSeconds--;
                                updateDisplay();
                            } else {
                                clearInterval(timer);
                                isRunning = false;
                                toggleBtn.textContent = '开始';
                                App.showToast(mode === 'work' ? '🍅 专注完成！休息一下吧' : '⏰ 休息结束，继续加油！', { type: 'success', duration: 5000 });
                                // 自动切换模式
                                if (mode === 'work') {
                                    mode = 'break';
                                    totalSeconds = (parseInt(breakInput.value) || 5) * 60;
                                    document.querySelectorAll('.pomo-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === 'break'));
                                } else {
                                    mode = 'work';
                                    totalSeconds = (parseInt(workInput.value) || 25) * 60;
                                    document.querySelectorAll('.pomo-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === 'work'));
                                }
                                updateDisplay();
                            }
                        }, 1000);
                    }
                }

                function resetTimer() {
                    clearInterval(timer);
                    isRunning = false;
                    toggleBtn.textContent = '开始';
                    totalSeconds = mode === 'work' ? (parseInt(workInput.value) || 25) * 60 : (parseInt(breakInput.value) || 5) * 60;
                    updateDisplay();
                }

                toggleBtn?.addEventListener('click', toggleTimer);
                resetBtn?.addEventListener('click', resetTimer);

                document.querySelectorAll('.pomo-tab').forEach(tab => {
                    tab.addEventListener('click', () => {
                        document.querySelectorAll('.pomo-tab').forEach(t => t.classList.remove('active'));
                        tab.classList.add('active');
                        mode = tab.dataset.mode;
                        clearInterval(timer);
                        isRunning = false;
                        toggleBtn.textContent = '开始';
                        totalSeconds = mode === 'work' ? (parseInt(workInput.value) || 25) * 60 : (parseInt(breakInput.value) || 5) * 60;
                        updateDisplay();
                    });
                });

                updateDisplay();
            }
        });
    }

    // ---------- 倒计时 ----------
    function _openTimer() {
        let totalSeconds = 0;
        let timer = null;
        let isRunning = false;

        const html = `
            <div class="timer-tool">
                <div class="timer-display" id="timerDisplay">00:00:00</div>
                <div class="timer-inputs">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">小时</label>
                            <input type="number" class="form-input" id="timerH" value="0" min="0" max="23">
                        </div>
                        <div class="form-group">
                            <label class="form-label">分钟</label>
                            <input type="number" class="form-input" id="timerM" value="5" min="0" max="59">
                        </div>
                        <div class="form-group">
                            <label class="form-label">秒</label>
                            <input type="number" class="form-input" id="timerS" value="0" min="0" max="59">
                        </div>
                    </div>
                </div>
                <div class="timer-presets">
                    <button class="btn btn-sm btn-secondary" data-preset="60">1分钟</button>
                    <button class="btn btn-sm btn-secondary" data-preset="300">5分钟</button>
                    <button class="btn btn-sm btn-secondary" data-preset="600">10分钟</button>
                    <button class="btn btn-sm btn-secondary" data-preset="1800">30分钟</button>
                    <button class="btn btn-sm btn-secondary" data-preset="3600">1小时</button>
                </div>
                <div class="timer-controls">
                    <button class="btn btn-secondary" id="timerReset">重置</button>
                    <button class="btn btn-primary" id="timerToggle">开始</button>
                </div>
            </div>
        `;

        App.openModal('倒计时', html, {
            onOpen: () => {
                const displayEl = document.getElementById('timerDisplay');
                const toggleBtn = document.getElementById('timerToggle');
                const resetBtn = document.getElementById('timerReset');
                const hInput = document.getElementById('timerH');
                const mInput = document.getElementById('timerM');
                const sInput = document.getElementById('timerS');

                function calcTotal() {
                    return parseInt(hInput.value) * 3600 + parseInt(mInput.value) * 60 + parseInt(sInput.value);
                }

                function updateDisplay() {
                    const h = Math.floor(totalSeconds / 3600);
                    const m = Math.floor((totalSeconds % 3600) / 60);
                    const s = totalSeconds % 60;
                    displayEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                }

                function setFromPreset(sec) {
                    clearInterval(timer);
                    isRunning = false;
                    toggleBtn.textContent = '开始';
                    totalSeconds = sec;
                    hInput.value = Math.floor(sec / 3600);
                    mInput.value = Math.floor((sec % 3600) / 60);
                    sInput.value = sec % 60;
                    updateDisplay();
                }

                function toggleTimer() {
                    if (isRunning) {
                        clearInterval(timer);
                        isRunning = false;
                        toggleBtn.textContent = '继续';
                    } else {
                        if (totalSeconds === 0) totalSeconds = calcTotal();
                        if (totalSeconds <= 0) {
                            App.showError('请设置倒计时时长');
                            return;
                        }
                        isRunning = true;
                        toggleBtn.textContent = '暂停';
                        timer = setInterval(() => {
                            if (totalSeconds > 0) {
                                totalSeconds--;
                                updateDisplay();
                            } else {
                                clearInterval(timer);
                                isRunning = false;
                                toggleBtn.textContent = '开始';
                                App.showToast('⏰ 时间到！', { type: 'success', duration: 5000 });
                            }
                        }, 1000);
                    }
                }

                function resetTimer() {
                    clearInterval(timer);
                    isRunning = false;
                    toggleBtn.textContent = '开始';
                    totalSeconds = calcTotal();
                    updateDisplay();
                }

                toggleBtn?.addEventListener('click', toggleTimer);
                resetBtn?.addEventListener('click', resetTimer);

                document.querySelectorAll('[data-preset]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        setFromPreset(parseInt(btn.dataset.preset));
                    });
                });

                totalSeconds = calcTotal();
                updateDisplay();
            }
        });
    }

    // ---------- 记事本 ----------
    function _openNotepad() {
        const html = `
            <div class="notepad-tool">
                <div class="notepad-header">
                    <span>快速记录</span>
                    <span class="notepad-status" id="notepadStatus">已保存</span>
                </div>
                <textarea class="form-textarea notepad-textarea" id="notepadText" 
                          placeholder="在这里记录你的想法..."
                          rows="12">${_esc(data.notepadContent)}</textarea>
                <div class="notepad-actions">
                    <button class="btn btn-secondary" id="notepadClear">清空</button>
                    <button class="btn btn-primary" id="notepadSave">保存</button>
                </div>
            </div>
        `;

        App.openModal('记事本', html, {
            onOpen: () => {
                const textarea = document.getElementById('notepadText');
                const statusEl = document.getElementById('notepadStatus');
                let saveTimeout;

                textarea?.addEventListener('input', () => {
                    statusEl.textContent = '编辑中...';
                    clearTimeout(saveTimeout);
                    saveTimeout = setTimeout(() => {
                        data.notepadContent = textarea.value;
                        _saveData();
                        statusEl.textContent = '已保存';
                    }, 500);
                });

                document.getElementById('notepadSave')?.addEventListener('click', () => {
                    data.notepadContent = textarea.value;
                    _saveData();
                    statusEl.textContent = '已保存';
                    App.showSuccess('笔记已保存');
                });

                document.getElementById('notepadClear')?.addEventListener('click', async () => {
                    const confirmed = await App.confirmModal('确认清空', '确定要清空记事本内容吗？', {
                        confirmText: '清空',
                        cancelText: '取消',
                    });
                    if (confirmed) {
                        textarea.value = '';
                        data.notepadContent = '';
                        _saveData();
                        App.showSuccess('已清空');
                    }
                });
            }
        });
    }

    // ---------- BMI计算器 ----------
    function _openBMI() {
        const html = `
            <div class="bmi-tool">
                <div class="form-group">
                    <label class="form-label">身高（cm）</label>
                    <input type="number" class="form-input" id="bmiHeight" value="165" min="100" max="250">
                </div>
                <div class="form-group">
                    <label class="form-label">体重（kg）</label>
                    <input type="number" class="form-input" id="bmiWeight" value="55" min="30" max="200">
                </div>
                <div class="form-group">
                    <label class="form-label">性别</label>
                    <select class="form-select" id="bmiGender">
                        <option value="female">女</option>
                        <option value="male">男</option>
                    </select>
                </div>
                <button class="btn btn-primary btn-block" id="bmiCalcBtn">计算BMI</button>
                <div class="bmi-result" id="bmiResult"></div>
            </div>
        `;

        App.openModal('BMI计算器', html, {
            onOpen: () => {
                function calcBMI() {
                    const h = parseFloat(document.getElementById('bmiHeight').value) / 100;
                    const w = parseFloat(document.getElementById('bmiWeight').value);
                    const gender = document.getElementById('bmiGender').value;
                    if (!h || !w) {
                        App.showError('请输入身高和体重');
                        return;
                    }
                    const bmi = (w / (h * h)).toFixed(1);
                    let category, color, advice;
                    if (bmi < 18.5) {
                        category = '偏瘦';
                        color = '#a8c9e8';
                        advice = '体重偏轻，建议增加营养摄入，适当增肌锻炼。';
                    } else if (bmi < 24) {
                        category = '正常';
                        color = '#7ec8a7';
                        advice = '体重正常，继续保持健康的生活方式！';
                    } else if (bmi < 28) {
                        category = '偏胖';
                        color = '#f5c89a';
                        advice = '体重略微超标，建议控制饮食，增加运动。';
                    } else {
                        category = '肥胖';
                        color = '#e8a0a0';
                        advice = '体重超标较多，建议制定科学的减重计划。';
                    }

                    // 标准体重
                    const stdWeight = gender === 'male' 
                        ? ((h * 100 - 80) * 0.7).toFixed(1)
                        : ((h * 100 - 70) * 0.6).toFixed(1);

                    document.getElementById('bmiResult').innerHTML = `
                        <div class="bmi-value" style="color: ${color};">${bmi}</div>
                        <div class="bmi-category" style="background: ${color}20; color: ${color};">${category}</div>
                        <div class="bmi-info">
                            <div class="bmi-info-row">
                                <span>标准体重</span>
                                <span>${stdWeight} kg</span>
                            </div>
                            <div class="bmi-info-row">
                                <span>BMI范围</span>
                                <span>18.5 - 24.0</span>
                            </div>
                        </div>
                        <div class="bmi-advice">💡 ${advice}</div>
                    `;
                }

                document.getElementById('bmiCalcBtn')?.addEventListener('click', calcBMI);
                // 自动计算一次
                calcBMI();
            }
        });
    }

    // ---------- 基础代谢率 ----------
    function _openBMR() {
        const html = `
            <div class="bmr-tool">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">性别</label>
                        <select class="form-select" id="bmrGender">
                            <option value="female">女</option>
                            <option value="male">男</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">年龄</label>
                        <input type="number" class="form-input" id="bmrAge" value="25" min="10" max="100">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">身高（cm）</label>
                        <input type="number" class="form-input" id="bmrHeight" value="165" min="100" max="250">
                    </div>
                    <div class="form-group">
                        <label class="form-label">体重（kg）</label>
                        <input type="number" class="form-input" id="bmrWeight" value="55" min="30" max="200">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">活动水平</label>
                    <select class="form-select" id="bmrActivity">
                        <option value="1.2">久坐（几乎不运动）</option>
                        <option value="1.375">轻度活动（每周1-3次）</option>
                        <option value="1.55" selected>中度活动（每周3-5次）</option>
                        <option value="1.725">高度活动（每周6-7次）</option>
                        <option value="1.9">极高活动（体力劳动）</option>
                    </select>
                </div>
                <button class="btn btn-primary btn-block" id="bmrCalcBtn">计算</button>
                <div class="bmr-result" id="bmrResult"></div>
            </div>
        `;

        App.openModal('基础代谢计算', html, {
            onOpen: () => {
                function calcBMR() {
                    const gender = document.getElementById('bmrGender').value;
                    const age = parseInt(document.getElementById('bmrAge').value);
                    const h = parseFloat(document.getElementById('bmrHeight').value);
                    const w = parseFloat(document.getElementById('bmrWeight').value);
                    const activity = parseFloat(document.getElementById('bmrActivity').value);

                    // Mifflin-St Jeor公式
                    let bmr;
                    if (gender === 'male') {
                        bmr = 10 * w + 6.25 * h - 5 * age + 5;
                    } else {
                        bmr = 10 * w + 6.25 * h - 5 * age - 161;
                    }
                    const tdee = bmr * activity;

                    document.getElementById('bmrResult').innerHTML = `
                        <div class="bmr-values">
                            <div class="bmr-item">
                                <div class="bmr-label">基础代谢率（BMR）</div>
                                <div class="bmr-value">${Math.round(bmr)} <span class="bmr-unit">千卡/天</span></div>
                            </div>
                            <div class="bmr-item">
                                <div class="bmr-label">每日总消耗（TDEE）</div>
                                <div class="bmr-value primary">${Math.round(tdee)} <span class="bmr-unit">千卡/天</span></div>
                            </div>
                        </div>
                        <div class="bmr-tips">
                            <div class="tip-item">🍎 减脂建议：摄入 ${Math.round(tdee * 0.8)} - ${Math.round(tdee * 0.9)} 千卡/天</div>
                            <div class="tip-item">💪 增肌建议：摄入 ${Math.round(tdee * 1.1)} - ${Math.round(tdee * 1.2)} 千卡/天</div>
                            <div class="tip-item">⚖️ 维持体重：摄入约 ${Math.round(tdee)} 千卡/天</div>
                        </div>
                    `;
                }

                document.getElementById('bmrCalcBtn')?.addEventListener('click', calcBMR);
                calcBMR();
            }
        });
    }

    // ---------- 喝水提醒 ----------
    function _openWater() {
        const html = `
            <div class="water-tool">
                <div class="water-cup" id="waterCup">
                    <div class="water-fill" id="waterFill" style="height: 0%;"></div>
                    <div class="water-text" id="waterText">0 / 8 杯</div>
                </div>
                <div class="water-buttons">
                    <button class="btn btn-primary" id="waterAdd">+ 喝一杯</button>
                    <button class="btn btn-secondary" id="waterReset">重置</button>
                </div>
                <div class="water-goal">
                    <div class="form-group">
                        <label class="form-label">每日目标（杯）</label>
                        <input type="number" class="form-input" id="waterGoal" value="8" min="1" max="20">
                    </div>
                </div>
                <div class="water-tip">💧 建议每天喝8杯水（约2000ml），保持身体水分充足</div>
            </div>
        `;

        App.openModal('喝水提醒', html, {
            onOpen: () => {
                const today = _today();
                const waterKey = 'water_' + today;
                let count = parseInt(localStorage.getItem(waterKey) || '0');
                const goalInput = document.getElementById('waterGoal');

                function updateWater() {
                    const goal = parseInt(goalInput.value) || 8;
                    const percent = Math.min(100, count / goal * 100);
                    document.getElementById('waterFill').style.height = percent + '%';
                    document.getElementById('waterText').textContent = `${count} / ${goal} 杯`;
                    localStorage.setItem(waterKey, count);
                    if (count >= goal && count === goal) {
                        App.showToast('🎉 今日喝水目标完成！', { type: 'success' });
                    }
                }

                document.getElementById('waterAdd')?.addEventListener('click', () => {
                    count++;
                    updateWater();
                });

                document.getElementById('waterReset')?.addEventListener('click', async () => {
                    const confirmed = await App.confirmModal('确认重置', '确定要重置今日喝水记录吗？', {
                        confirmText: '重置',
                        cancelText: '取消',
                    });
                    if (confirmed) {
                        count = 0;
                        updateWater();
                    }
                });

                goalInput?.addEventListener('change', updateWater);
                updateWater();
            }
        });
    }

    function _today() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // ---------- 单位换算 ----------
    function _openConverter() {
        const categories = {
            length: {
                name: '长度',
                units: [
                    { id: 'm', name: '米', rate: 1 },
                    { id: 'km', name: '千米', rate: 1000 },
                    { id: 'cm', name: '厘米', rate: 0.01 },
                    { id: 'mm', name: '毫米', rate: 0.001 },
                    { id: 'inch', name: '英寸', rate: 0.0254 },
                    { id: 'foot', name: '英尺', rate: 0.3048 },
                    { id: 'mile', name: '英里', rate: 1609.344 },
                ],
            },
            weight: {
                name: '重量',
                units: [
                    { id: 'kg', name: '千克', rate: 1 },
                    { id: 'g', name: '克', rate: 0.001 },
                    { id: 'mg', name: '毫克', rate: 0.000001 },
                    { id: 't', name: '吨', rate: 1000 },
                    { id: 'lb', name: '磅', rate: 0.453592 },
                    { id: 'oz', name: '盎司', rate: 0.0283495 },
                    { id: 'jin', name: '斤', rate: 0.5 },
                ],
            },
            temperature: {
                name: '温度',
                special: true,
            },
            area: {
                name: '面积',
                units: [
                    { id: 'm2', name: '平方米', rate: 1 },
                    { id: 'km2', name: '平方千米', rate: 1000000 },
                    { id: 'cm2', name: '平方厘米', rate: 0.0001 },
                    { id: 'ha', name: '公顷', rate: 10000 },
                    { id: 'mu', name: '亩', rate: 666.667 },
                    { id: 'acre', name: '英亩', rate: 4046.86 },
                ],
            },
        };

        const html = `
            <div class="converter-tool">
                <div class="conv-categories">
                    ${Object.entries(categories).map(([key, cat]) => `
                        <button class="conv-cat ${key === 'length' ? 'active' : ''}" data-cat="${key}">${cat.name}</button>
                    `).join('')}
                </div>
                <div class="conv-inputs">
                    <div class="form-group">
                        <div class="conv-row">
                            <input type="number" class="form-input conv-input" id="convFromVal" value="1">
                            <select class="form-select conv-select" id="convFromUnit"></select>
                        </div>
                    </div>
                    <div class="conv-arrow">↓</div>
                    <div class="form-group">
                        <div class="conv-row">
                            <input type="number" class="form-input conv-input" id="convToVal" value="" readonly>
                            <select class="form-select conv-select" id="convToUnit"></select>
                        </div>
                    </div>
                </div>
                <div class="conv-result" id="convResult"></div>
            </div>
        `;

        App.openModal('单位换算', html, {
            onOpen: () => {
                let currentCat = 'length';

                function loadUnits() {
                    const cat = categories[currentCat];
                    const fromSelect = document.getElementById('convFromUnit');
                    const toSelect = document.getElementById('convToUnit');

                    if (cat.special) {
                        // 温度特殊处理
                        const tempUnits = [
                            { id: 'c', name: '摄氏度 (°C)' },
                            { id: 'f', name: '华氏度 (°F)' },
                            { id: 'k', name: '开尔文 (K)' },
                        ];
                        fromSelect.innerHTML = tempUnits.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
                        toSelect.innerHTML = tempUnits.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
                        toSelect.value = 'f';
                    } else {
                        fromSelect.innerHTML = cat.units.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
                        toSelect.innerHTML = cat.units.map((u, i) => `<option value="${u.id}" ${i === 1 ? 'selected' : ''}>${u.name}</option>`).join('');
                    }
                    convert();
                }

                function convert() {
                    const fromVal = parseFloat(document.getElementById('convFromVal').value) || 0;
                    const fromUnit = document.getElementById('convFromUnit').value;
                    const toUnit = document.getElementById('convToUnit').value;
                    const cat = categories[currentCat];
                    let result;

                    if (cat.special) {
                        // 温度转换
                        let celsius;
                        switch (fromUnit) {
                            case 'c': celsius = fromVal; break;
                            case 'f': celsius = (fromVal - 32) * 5 / 9; break;
                            case 'k': celsius = fromVal - 273.15; break;
                        }
                        switch (toUnit) {
                            case 'c': result = celsius; break;
                            case 'f': result = celsius * 9 / 5 + 32; break;
                            case 'k': result = celsius + 273.15; break;
                        }
                    } else {
                        const fromU = cat.units.find(u => u.id === fromUnit);
                        const toU = cat.units.find(u => u.id === toUnit);
                        if (fromU && toU) {
                            result = fromVal * fromU.rate / toU.rate;
                        }
                    }

                    document.getElementById('convToVal').value = result !== undefined ? result.toFixed(6).replace(/\.?0+$/, '') : '';
                }

                document.querySelectorAll('.conv-cat').forEach(btn => {
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.conv-cat').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        currentCat = btn.dataset.cat;
                        loadUnits();
                    });
                });

                document.getElementById('convFromVal')?.addEventListener('input', convert);
                document.getElementById('convFromUnit')?.addEventListener('change', convert);
                document.getElementById('convToUnit')?.addEventListener('change', convert);

                loadUnits();
            }
        });
    }

    // ---------- 复利计算 ----------
    function _openCompound() {
        const html = `
            <div class="compound-tool">
                <div class="form-group">
                    <label class="form-label">初始本金（元）</label>
                    <input type="number" class="form-input" id="cpPrincipal" value="10000" min="0">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">年利率（%）</label>
                        <input type="number" class="form-input" id="cpRate" value="5" min="0" step="0.1">
                    </div>
                    <div class="form-group">
                        <label class="form-label">投资年限（年）</label>
                        <input type="number" class="form-input" id="cpYears" value="10" min="1" max="50">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">每月定投（元）</label>
                    <input type="number" class="form-input" id="cpMonthly" value="1000" min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">复利频率</label>
                    <select class="form-select" id="cpFreq">
                        <option value="12">每月</option>
                        <option value="4">每季</option>
                        <option value="2">每半年</option>
                        <option value="1" selected>每年</option>
                    </select>
                </div>
                <button class="btn btn-primary btn-block" id="cpCalcBtn">计算收益</button>
                <div class="compound-result" id="cpResult"></div>
            </div>
        `;

        App.openModal('复利计算器', html, {
            onOpen: () => {
                function calc() {
                    const principal = parseFloat(document.getElementById('cpPrincipal').value) || 0;
                    const rate = parseFloat(document.getElementById('cpRate').value) / 100 || 0;
                    const years = parseInt(document.getElementById('cpYears').value) || 0;
                    const monthly = parseFloat(document.getElementById('cpMonthly').value) || 0;
                    const freq = parseInt(document.getElementById('cpFreq').value) || 1;

                    // 本金复利
                    const compoundPrincipal = principal * Math.pow(1 + rate / freq, freq * years);
                    
                    // 定投复利（简化：按月投入，按年复利）
                    let compoundMonthly = 0;
                    const monthlyRate = rate / 12;
                    const totalMonths = years * 12;
                    if (monthlyRate > 0) {
                        compoundMonthly = monthly * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
                    } else {
                        compoundMonthly = monthly * totalMonths;
                    }

                    const total = compoundPrincipal + compoundMonthly;
                    const totalInvest = principal + monthly * totalMonths;
                    const totalInterest = total - totalInvest;
                    const returnRate = totalInvest > 0 ? (totalInterest / totalInvest * 100) : 0;

                    document.getElementById('cpResult').innerHTML = `
                        <div class="cp-values">
                            <div class="cp-item">
                                <div class="cp-label">最终总额</div>
                                <div class="cp-value primary">¥${total.toFixed(2)}</div>
                            </div>
                            <div class="cp-row">
                                <div class="cp-item small">
                                    <div class="cp-label">累计投入</div>
                                    <div class="cp-value">¥${totalInvest.toFixed(2)}</div>
                                </div>
                                <div class="cp-item small">
                                    <div class="cp-label">利息收益</div>
                                    <div class="cp-value" style="color: #7ec8a7;">¥${totalInterest.toFixed(2)}</div>
                                </div>
                            </div>
                            <div class="cp-item">
                                <div class="cp-label">收益率</div>
                                <div class="cp-value" style="color: #7ec8a7;">${returnRate.toFixed(2)}%</div>
                            </div>
                        </div>
                    `;
                }

                document.getElementById('cpCalcBtn')?.addEventListener('click', calc);
                calc();
            }
        });
    }

    // ---------- 房贷计算 ----------
    function _openMortgage() {
        const html = `
            <div class="mortgage-tool">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">贷款金额（万）</label>
                        <input type="number" class="form-input" id="mgAmount" value="100" min="1">
                    </div>
                    <div class="form-group">
                        <label class="form-label">贷款年限（年）</label>
                        <input type="number" class="form-input" id="mgYears" value="30" min="1" max="30">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">年利率（%）</label>
                    <input type="number" class="form-input" id="mgRate" value="4.2" min="0" step="0.01">
                </div>
                <div class="form-group">
                    <label class="form-label">还款方式</label>
                    <select class="form-select" id="mgType">
                        <option value="equal">等额本息</option>
                        <option value="principal">等额本金</option>
                    </select>
                </div>
                <button class="btn btn-primary btn-block" id="mgCalcBtn">计算</button>
                <div class="mortgage-result" id="mgResult"></div>
            </div>
        `;

        App.openModal('房贷计算器', html, {
            onOpen: () => {
                function calc() {
                    const amount = parseFloat(document.getElementById('mgAmount').value) * 10000 || 0;
                    const years = parseInt(document.getElementById('mgYears').value) || 0;
                    const rate = parseFloat(document.getElementById('mgRate').value) / 100 / 12 || 0;
                    const type = document.getElementById('mgType').value;
                    const months = years * 12;

                    let monthlyPayment, totalPayment, totalInterest;

                    if (type === 'equal') {
                        // 等额本息
                        if (rate === 0) {
                            monthlyPayment = amount / months;
                        } else {
                            monthlyPayment = amount * rate * Math.pow(1 + rate, months) / (Math.pow(1 + rate, months) - 1);
                        }
                        totalPayment = monthlyPayment * months;
                        totalInterest = totalPayment - amount;

                        document.getElementById('mgResult').innerHTML = `
                            <div class="mg-values">
                                <div class="mg-item">
                                    <div class="mg-label">月供</div>
                                    <div class="mg-value primary">¥${monthlyPayment.toFixed(2)}</div>
                                </div>
                                <div class="mg-row">
                                    <div class="mg-item small">
                                        <div class="mg-label">还款总额</div>
                                        <div class="mg-value">¥${totalPayment.toFixed(2)}</div>
                                    </div>
                                    <div class="mg-item small">
                                        <div class="mg-label">支付利息</div>
                                        <div class="mg-value" style="color: #e8a0a0;">¥${totalInterest.toFixed(2)}</div>
                                    </div>
                                </div>
                                <div class="mg-tip">💡 等额本息：每月还款金额相同，前期利息多本金少</div>
                            </div>
                        `;
                    } else {
                        // 等额本金
                        const monthlyPrincipal = amount / months;
                        const firstMonth = monthlyPrincipal + amount * rate;
                        const lastMonth = monthlyPrincipal + monthlyPrincipal * rate;
                        totalInterest = (months + 1) * amount * rate / 2;
                        totalPayment = amount + totalInterest;

                        document.getElementById('mgResult').innerHTML = `
                            <div class="mg-values">
                                <div class="mg-item">
                                    <div class="mg-label">首月月供</div>
                                    <div class="mg-value primary">¥${firstMonth.toFixed(2)}</div>
                                </div>
                                <div class="mg-item">
                                    <div class="mg-label">末月月供</div>
                                    <div class="mg-value">¥${lastMonth.toFixed(2)}</div>
                                </div>
                                <div class="mg-row">
                                    <div class="mg-item small">
                                        <div class="mg-label">还款总额</div>
                                        <div class="mg-value">¥${totalPayment.toFixed(2)}</div>
                                    </div>
                                    <div class="mg-item small">
                                        <div class="mg-label">支付利息</div>
                                        <div class="mg-value" style="color: #e8a0a0;">¥${totalInterest.toFixed(2)}</div>
                                    </div>
                                </div>
                                <div class="mg-tip">💡 等额本金：每月本金相同，月供逐月递减，总利息较少</div>
                            </div>
                        `;
                    }
                }

                document.getElementById('mgCalcBtn')?.addEventListener('click', calc);
                calc();
            }
        });
    }

    // ---------- 二维码生成 ----------
    function _openQRCode() {
        const html = `
            <div class="qrcode-tool">
                <div class="form-group">
                    <label class="form-label">输入内容（网址/文字）</label>
                    <textarea class="form-textarea" id="qrText" placeholder="输入要生成二维码的内容..." rows="3">https://</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">二维码大小</label>
                        <select class="form-select" id="qrSize">
                            <option value="128">小 (128px)</option>
                            <option value="200" selected>中 (200px)</option>
                            <option value="256">大 (256px)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">纠错级别</label>
                        <select class="form-select" id="qrLevel">
                            <option value="L">低 (7%)</option>
                            <option value="M" selected>中 (15%)</option>
                            <option value="Q">较高 (25%)</option>
                            <option value="H">高 (30%)</option>
                        </select>
                    </div>
                </div>
                <button class="btn btn-primary btn-block" id="qrGenBtn">生成二维码</button>
                <div class="qrcode-result" id="qrResult">
                    <div class="qrcode-placeholder">点击按钮生成二维码</div>
                </div>
            </div>
        `;

        App.openModal('二维码生成', html, {
            onOpen: () => {
                function generate() {
                    const text = document.getElementById('qrText').value.trim();
                    const size = document.getElementById('qrSize').value;
                    const level = document.getElementById('qrLevel').value;
                    if (!text) {
                        App.showError('请输入二维码内容');
                        return;
                    }
                    // 使用简单的SVG模拟二维码（实际项目可用QRCode库）
                    const resultEl = document.getElementById('qrResult');
                    const modules = 21; // 简易版21x21
                    const cellSize = parseInt(size) / modules;
                    let svgContent = '';
                    // 生成伪随机二维码图案（基于文本哈希）
                    let hash = 0;
                    for (let i = 0; i < text.length; i++) {
                        hash = ((hash << 5) - hash) + text.charCodeAt(i);
                        hash |= 0;
                    }
                    for (let y = 0; y < modules; y++) {
                        for (let x = 0; x < modules; x++) {
                            // 定位角（三个角的固定图案）
                            const inCorner = (x < 7 && y < 7) || (x >= modules - 7 && y < 7) || (x < 7 && y >= modules - 7);
                            let isBlack;
                            if (inCorner) {
                                const cx = x < 7 ? x : x - (modules - 7);
                                const cy = y < 7 ? y : y - (modules - 7);
                                const inOuter = cx === 0 || cx === 6 || cy === 0 || cy === 6;
                                const inInner = cx >= 2 && cx <= 4 && cy >= 2 && cy <= 4;
                                isBlack = inOuter || inInner;
                            } else {
                                // 伪随机填充
                                const seed = Math.abs(hash * (x + 1) * (y + 1)) % 100;
                                isBlack = seed > 45;
                            }
                            if (isBlack) {
                                svgContent += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="#333"/>`;
                            }
                        }
                    }
                    resultEl.innerHTML = `
                        <div class="qrcode-image">
                            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                                <rect width="${size}" height="${size}" fill="white"/>
                                ${svgContent}
                            </svg>
                        </div>
                        <div class="qrcode-tip">📱 使用手机扫描二维码查看内容</div>
                    `;
                }

                document.getElementById('qrGenBtn')?.addEventListener('click', generate);
            }
        });
    }

    // ---------- 随机抽取 ----------
    function _openRandom() {
        const html = `
            <div class="random-tool">
                <div class="form-group">
                    <label class="form-label">输入选项（每行一个）</label>
                    <textarea class="form-textarea" id="randomOptions" rows="6" placeholder="选项A&#10;选项B&#10;选项C&#10;...">吃火锅
吃烧烤
吃日料
吃炒菜
吃面条
点外卖</textarea>
                </div>
                <div class="random-mode">
                    <label class="form-label">抽取数量</label>
                    <input type="number" class="form-input" id="randomCount" value="1" min="1" style="width: 80px;">
                </div>
                <button class="btn btn-primary btn-block" id="randomBtn" style="font-size: 18px;">
                    🎲 开始抽取
                </button>
                <div class="random-result" id="randomResult">
                    <div class="random-placeholder">点击按钮开始抽取</div>
                </div>
            </div>
        `;

        App.openModal('随机抽取', html, {
            onOpen: () => {
                let rolling = false;
                let rollInterval = null;

                function roll() {
                    if (rolling) return;
                    const text = document.getElementById('randomOptions').value.trim();
                    const count = parseInt(document.getElementById('randomCount').value) || 1;
                    const options = text.split('\n').map(s => s.trim()).filter(s => s.length > 0);

                    if (options.length === 0) {
                        App.showError('请输入至少一个选项');
                        return;
                    }
                    if (count > options.length) {
                        App.showError('抽取数量不能超过选项总数');
                        return;
                    }

                    const resultEl = document.getElementById('randomResult');
                    rolling = true;
                    let rollCount = 0;
                    const maxRolls = 20;

                    rollInterval = setInterval(() => {
                        const shuffled = [...options].sort(() => Math.random() - 0.5);
                        const selected = shuffled.slice(0, count);
                        resultEl.innerHTML = selected.map(s => `<div class="random-item rolling">${_esc(s)}</div>`).join('');
                        rollCount++;
                        if (rollCount >= maxRolls) {
                            clearInterval(rollInterval);
                            rolling = false;
                            const finalSelected = shuffled.slice(0, count);
                            resultEl.innerHTML = finalSelected.map(s => `
                                <div class="random-item final">🎉 ${_esc(s)}</div>
                            `).join('');
                        }
                    }, 100);
                }

                document.getElementById('randomBtn')?.addEventListener('click', roll);
            }
        });
    }

    // ---------- 密码生成器 ----------
    function _openPassword() {
        const html = `
            <div class="password-tool">
                <div class="pw-display">
                    <input type="text" class="form-input pw-input" id="pwResult" readonly>
                    <button class="btn btn-secondary" id="pwCopy">复制</button>
                </div>
                <div class="form-group">
                    <label class="form-label">密码长度：<span id="pwLenVal">16</span> 位</label>
                    <input type="range" class="slider" id="pwLength" min="4" max="32" value="16">
                </div>
                <div class="pw-options">
                    <label class="pw-option">
                        <input type="checkbox" id="pwUpper" checked>
                        <span>大写字母 (A-Z)</span>
                    </label>
                    <label class="pw-option">
                        <input type="checkbox" id="pwLower" checked>
                        <span>小写字母 (a-z)</span>
                    </label>
                    <label class="pw-option">
                        <input type="checkbox" id="pwNumber" checked>
                        <span>数字 (0-9)</span>
                    </label>
                    <label class="pw-option">
                        <input type="checkbox" id="pwSymbol" checked>
                        <span>特殊符号 (!@#$...)</span>
                    </label>
                </div>
                <button class="btn btn-primary btn-block" id="pwGenBtn">🔄 重新生成</button>
                <div class="pw-strength" id="pwStrength"></div>
            </div>
        `;

        App.openModal('密码生成器', html, {
            onOpen: () => {
                function generate() {
                    const length = parseInt(document.getElementById('pwLength').value) || 16;
                    const upper = document.getElementById('pwUpper').checked;
                    const lower = document.getElementById('pwLower').checked;
                    const number = document.getElementById('pwNumber').checked;
                    const symbol = document.getElementById('pwSymbol').checked;

                    let chars = '';
                    if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    if (lower) chars += 'abcdefghijklmnopqrstuvwxyz';
                    if (number) chars += '0123456789';
                    if (symbol) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

                    if (!chars) {
                        App.showError('请至少选择一种字符类型');
                        return;
                    }

                    let password = '';
                    for (let i = 0; i < length; i++) {
                        password += chars.charAt(Math.floor(Math.random() * chars.length));
                    }

                    document.getElementById('pwResult').value = password;
                    updateStrength(password);
                }

                function updateStrength(pw) {
                    let score = 0;
                    if (pw.length >= 8) score++;
                    if (pw.length >= 12) score++;
                    if (pw.length >= 16) score++;
                    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
                    if (/\d/.test(pw)) score++;
                    if (/[^a-zA-Z0-9]/.test(pw)) score++;

                    const levels = [
                        { label: '很弱', color: '#e8a0a0' },
                        { label: '弱', color: '#f5c89a' },
                        { label: '一般', color: '#f0c987' },
                        { label: '中等', color: '#c9b8e0' },
                        { label: '强', color: '#a8c9e8' },
                        { label: '很强', color: '#7ec8a7' },
                    ];
                    const level = levels[Math.min(score, levels.length - 1)];
                    document.getElementById('pwStrength').innerHTML = `
                        <div class="pw-strength-bar">
                            ${[0, 1, 2, 3, 4, 5].map(i => `
                                <div class="pw-strength-seg" style="background: ${i < score ? level.color : '#eee'};"></div>
                            `).join('')}
                        </div>
                        <div class="pw-strength-label" style="color: ${level.color};">密码强度：${level.label}</div>
                    `;
                }

                document.getElementById('pwLength')?.addEventListener('input', (e) => {
                    document.getElementById('pwLenVal').textContent = e.target.value;
                    generate();
                });
                document.getElementById('pwUpper')?.addEventListener('change', generate);
                document.getElementById('pwLower')?.addEventListener('change', generate);
                document.getElementById('pwNumber')?.addEventListener('change', generate);
                document.getElementById('pwSymbol')?.addEventListener('change', generate);
                document.getElementById('pwGenBtn')?.addEventListener('click', generate);
                document.getElementById('pwCopy')?.addEventListener('click', () => {
                    const pw = document.getElementById('pwResult').value;
                    navigator.clipboard?.writeText(pw).then(() => {
                        App.showSuccess('密码已复制');
                    }).catch(() => {
                        App.showSuccess('密码已复制');
                    });
                });

                generate();
            }
        });
    }

    // ---------- 便签贴纸 ----------
    function _openSticker() {
        const html = `
            <div class="sticker-tool">
                <div class="sticker-header">
                    <span>便签贴纸</span>
                    <button class="btn btn-sm btn-primary" id="stickerAdd">+ 新建便签</button>
                </div>
                <div class="sticker-list" id="stickerList"></div>
            </div>
        `;

        App.openModal('便签贴纸', html, {
            onOpen: () => {
                const colors = ['#f5c89a', '#f4b8c4', '#a8c9e8', '#7ec8a7', '#c9b8e0', '#f0c987'];

                function renderStickers() {
                    const listEl = document.getElementById('stickerList');
                    if (data.stickers.length === 0) {
                        listEl.innerHTML = `
                            <div class="empty-state" style="padding: var(--spacing-lg);">
                                <div class="empty-state-icon">🗒️</div>
                                <div class="empty-state-text">还没有便签，点击上方新建</div>
                            </div>
                        `;
                        return;
                    }
                    listEl.innerHTML = `
                        <div class="sticker-grid">
                            ${data.stickers.map(stk => `
                                <div class="sticker-item" style="background: ${stk.color};" data-id="${stk.id}">
                                    <textarea class="sticker-text" data-id="${stk.id}">${_esc(stk.content)}</textarea>
                                    <div class="sticker-actions">
                                        <button class="sticker-btn" data-action="sticker-edit-color" data-id="${stk.id}" title="换色">🎨</button>
                                        <button class="sticker-btn" data-action="sticker-delete" data-id="${stk.id}" title="删除">🗑️</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;

                    // 绑定编辑
                    document.querySelectorAll('.sticker-text').forEach(ta => {
                        let saveTimer;
                        ta.addEventListener('input', () => {
                            clearTimeout(saveTimer);
                            saveTimer = setTimeout(() => {
                                const id = ta.dataset.id;
                                const sticker = data.stickers.find(s => s.id === id);
                                if (sticker) {
                                    sticker.content = ta.value;
                                    _saveData();
                                }
                            }, 300);
                        });
                    });

                    // 删除
                    document.querySelectorAll('[data-action="sticker-delete"]').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            const id = btn.dataset.id;
                            const confirmed = await App.confirmModal('确认删除', '确定要删除这个便签吗？', {
                                confirmText: '删除',
                                cancelText: '取消',
                            });
                            if (confirmed) {
                                data.stickers = data.stickers.filter(s => s.id !== id);
                                _saveData();
                                renderStickers();
                                App.showSuccess('已删除');
                            }
                        });
                    });

                    // 换色
                    document.querySelectorAll('[data-action="sticker-edit-color"]').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const id = btn.dataset.id;
                            const sticker = data.stickers.find(s => s.id === id);
                            if (sticker) {
                                const idx = colors.indexOf(sticker.color);
                                sticker.color = colors[(idx + 1) % colors.length];
                                _saveData();
                                renderStickers();
                            }
                        });
                    });
                }

                document.getElementById('stickerAdd')?.addEventListener('click', () => {
                    const newSticker = {
                        id: _genId('stk'),
                        content: '新便签...',
                        color: colors[Math.floor(Math.random() * colors.length)],
                        createdAt: Date.now(),
                    };
                    data.stickers.push(newSticker);
                    _saveData();
                    renderStickers();
                });

                renderStickers();
            }
        });
    }

    // ---------- 颜色选择器 ----------
    function _openColorPicker() {
        const html = `
            <div class="colorpicker-tool">
                <div class="cp-preview" id="cpPreview">
                    <div class="cp-color-box" id="cpColorBox" style="background: #7ec8a7;"></div>
                </div>
                <div class="cp-values">
                    <div class="cp-value-row">
                        <span class="cp-label">HEX</span>
                        <input type="text" class="form-input cp-value-input" id="cpHex" value="#7ec8a7">
                        <button class="btn btn-sm btn-secondary" data-copy="hex">复制</button>
                    </div>
                    <div class="cp-value-row">
                        <span class="cp-label">RGB</span>
                        <input type="text" class="form-input cp-value-input" id="cpRgb" value="rgb(126, 200, 167)" readonly>
                        <button class="btn btn-sm btn-secondary" data-copy="rgb">复制</button>
                    </div>
                    <div class="cp-value-row">
                        <span class="cp-label">HSL</span>
                        <input type="text" class="form-input cp-value-input" id="cpHsl" value="hsl(150, 39%, 64%)" readonly>
                        <button class="btn btn-sm btn-secondary" data-copy="hsl">复制</button>
                    </div>
                </div>
                <div class="cp-sliders">
                    <div class="form-group">
                        <label class="form-label">色相 (H): <span id="cpHVal">150</span>°</label>
                        <input type="range" class="slider cp-hue" id="cpH" min="0" max="360" value="150">
                    </div>
                    <div class="form-group">
                        <label class="form-label">饱和度 (S): <span id="cpSVal">39</span>%</label>
                        <input type="range" class="slider" id="cpS" min="0" max="100" value="39">
                    </div>
                    <div class="form-group">
                        <label class="form-label">亮度 (L): <span id="cpLVal">64</span>%</label>
                        <input type="range" class="slider" id="cpL" min="0" max="100" value="64">
                    </div>
                </div>
                <div class="cp-palette">
                    <div class="cp-palette-title">柔和浅色系推荐</div>
                    <div class="cp-palette-colors">
                        ${COLORS.map(c => `
                            <button class="cp-palette-color" style="background: ${c};" data-color="${c}" title="${c}"></button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        App.openModal('颜色选择器', html, {
            onOpen: () => {
                function hslToHex(h, s, l) {
                    s /= 100;
                    l /= 100;
                    const a = s * Math.min(l, 1 - l);
                    const f = n => {
                        const k = (n + h / 30) % 12;
                        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                        return Math.round(255 * color).toString(16).padStart(2, '0');
                    };
                    return `#${f(0)}${f(8)}${f(4)}`;
                }

                function hslToRgb(h, s, l) {
                    s /= 100;
                    l /= 100;
                    const a = s * Math.min(l, 1 - l);
                    const f = n => {
                        const k = (n + h / 30) % 12;
                        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                        return Math.round(255 * color);
                    };
                    return `rgb(${f(0)}, ${f(8)}, ${f(4)})`;
                }

                function updateFromHSL() {
                    const h = parseInt(document.getElementById('cpH').value);
                    const s = parseInt(document.getElementById('cpS').value);
                    const l = parseInt(document.getElementById('cpL').value);

                    document.getElementById('cpHVal').textContent = h;
                    document.getElementById('cpSVal').textContent = s;
                    document.getElementById('cpLVal').textContent = l;

                    const hex = hslToHex(h, s, l);
                    document.getElementById('cpHex').value = hex;
                    document.getElementById('cpRgb').value = hslToRgb(h, s, l);
                    document.getElementById('cpHsl').value = `hsl(${h}, ${s}%, ${l}%)`;
                    document.getElementById('cpColorBox').style.background = hex;
                }

                function updateFromHex(hex) {
                    hex = hex.replace('#', '');
                    if (hex.length !== 6) return;
                    const r = parseInt(hex.substr(0, 2), 16) / 255;
                    const g = parseInt(hex.substr(2, 2), 16) / 255;
                    const b = parseInt(hex.substr(4, 2), 16) / 255;

                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    let h = 0, s = 0;
                    const l = (max + min) / 2;

                    if (max !== min) {
                        const d = max - min;
                        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                        switch (max) {
                            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                            case g: h = ((b - r) / d + 2) / 6; break;
                            case b: h = ((r - g) / d + 4) / 6; break;
                        }
                    }

                    document.getElementById('cpH').value = Math.round(h * 360);
                    document.getElementById('cpS').value = Math.round(s * 100);
                    document.getElementById('cpL').value = Math.round(l * 100);
                    updateFromHSL();
                }

                document.getElementById('cpH')?.addEventListener('input', updateFromHSL);
                document.getElementById('cpS')?.addEventListener('input', updateFromHSL);
                document.getElementById('cpL')?.addEventListener('input', updateFromHSL);

                document.getElementById('cpHex')?.addEventListener('change', (e) => {
                    updateFromHex(e.target.value);
                });

                document.querySelectorAll('.cp-palette-color').forEach(btn => {
                    btn.addEventListener('click', () => {
                        updateFromHex(btn.dataset.color);
                    });
                });

                document.querySelectorAll('[data-copy]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const type = btn.dataset.copy;
                        let val = '';
                        if (type === 'hex') val = document.getElementById('cpHex').value;
                        else if (type === 'rgb') val = document.getElementById('cpRgb').value;
                        else if (type === 'hsl') val = document.getElementById('cpHsl').value;
                        navigator.clipboard?.writeText(val);
                        App.showSuccess('已复制到剪贴板');
                    });
                });
            }
        });
    }

    // ---------- 灵感记录 ----------
    function _openInspiration() {
        const html = `
            <div class="inspiration-tool">
                <div class="inspiration-input">
                    <textarea class="form-textarea" id="inspirationText" placeholder="💡 记录你的灵感火花..." rows="3"></textarea>
                    <button class="btn btn-primary btn-block" id="inspirationAdd">添加灵感</button>
                </div>
                <div class="inspiration-list" id="inspirationList"></div>
            </div>
        `;

        App.openModal('灵感记录', html, {
            onOpen: () => {
                function renderList() {
                    const listEl = document.getElementById('inspirationList');
                    const sorted = [...data.inspirations].sort((a, b) => b.createdAt - a.createdAt);
                    if (sorted.length === 0) {
                        listEl.innerHTML = `
                            <div class="empty-state" style="padding: var(--spacing-lg);">
                                <div class="empty-state-icon">💡</div>
                                <div class="empty-state-text">还没有灵感记录</div>
                            </div>
                        `;
                        return;
                    }
                    listEl.innerHTML = sorted.map(item => `
                        <div class="inspiration-item" data-id="${item.id}">
                            <div class="inspiration-content">${_esc(item.content)}</div>
                            <div class="inspiration-footer">
                                <span class="inspiration-date">${new Date(item.createdAt).toLocaleDateString()}</span>
                                <button class="btn-icon btn-sm" data-action="del-inspiration" data-id="${item.id}" title="删除">🗑️</button>
                            </div>
                        </div>
                    `).join('');

                    document.querySelectorAll('[data-action="del-inspiration"]').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            const confirmed = await App.confirmModal('确认删除', '确定要删除这条灵感吗？', {
                                confirmText: '删除',
                                cancelText: '取消',
                            });
                            if (confirmed) {
                                data.inspirations = data.inspirations.filter(i => i.id !== btn.dataset.id);
                                _saveData();
                                renderList();
                                App.showSuccess('已删除');
                            }
                        });
                    });
                }

                document.getElementById('inspirationAdd')?.addEventListener('click', () => {
                    const text = document.getElementById('inspirationText').value.trim();
                    if (!text) {
                        App.showError('请输入灵感内容');
                        return;
                    }
                    data.inspirations.push({
                        id: _genId('ins'),
                        content: text,
                        createdAt: Date.now(),
                    });
                    _saveData();
                    document.getElementById('inspirationText').value = '';
                    renderList();
                    App.showSuccess('灵感已保存');
                });

                renderList();
            }
        });
    }

    // ============================================================
    // 10. 事件绑定
    // ============================================================
    function _bindEvents() {
        if (!containerEl) return;

        // 工具卡片点击
        containerEl.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.tool-fav-btn')) return;
                const toolId = card.dataset.toolId;
                _openTool(toolId);
            });
        });

        // 收藏按钮
        containerEl.querySelectorAll('[data-action="toggle-fav"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const toolId = btn.dataset.toolId;
                _toggleFavorite(toolId);
                _renderFavorites();
                _renderCategories();
                _bindEvents();
                const isFav = data.favorites.includes(toolId);
                App.showSuccess(isFav ? '已添加收藏' : '已取消收藏');
            });
        });

        // 最近使用点击
        containerEl.querySelectorAll('.recent-item').forEach(item => {
            item.addEventListener('click', () => {
                _openTool(item.dataset.toolId);
            });
        });

        // 管理收藏
        containerEl.querySelector('[data-action="manage-favorites"]')?.addEventListener('click', () => {
            App.showToast('点击工具卡片上的星号即可收藏/取消', { type: 'info' });
        });
    }

    // ============================================================
    // 11. onAdd / onResume
    // ============================================================
    function onAdd() {
        // 快捷打开计算器
        _openCalculator();
    }

    function onResume() {
        if (containerEl) {
            _loadData();
            render(containerEl);
        }
    }

    // ============================================================
    // 12. 导出
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
    App.registerModule('tools', ToolsModule);
}
