/**
 * app.js - 主应用控制器
 * 负责侧边栏导航切换、页面路由管理、模态框控制、Toast提示、日期工具函数、全局事件绑定、各模块注册和渲染调度
 */

const App = (function() {
    'use strict';

    // ============================================================
    // 1. 状态管理
    // ============================================================
    const state = {
        currentPage: 'dashboard',
        modules: {}, // 已注册的模块
        isSidebarOpen: false,
        isModalOpen: false,
    };

    // DOM元素缓存
    const dom = {};

    // ============================================================
    // 2. 初始化
    // ============================================================

    /**
     * 应用初始化
     */
    function init() {
        // 初始化存储
        AppStorage.init();
        
        // 缓存DOM元素
        _cacheDomElements();
        
        // 生成侧边栏导航
        _renderSidebarNav();
        
        // 绑定全局事件
        _bindGlobalEvents();
        
        // 应用主题
        _applyTheme();
        
        // 渲染当前页面
        navigateTo(state.currentPage);
        
        console.log('🌟 个人成长操作系统已启动');
    }

    /**
     * 缓存DOM元素
     */
    function _cacheDomElements() {
        dom.sidebar = document.getElementById('sidebar');
        dom.sidebarNav = document.getElementById('sidebarNav');
        dom.sidebarClose = document.getElementById('sidebarClose');
        dom.overlay = document.getElementById('overlay');
        dom.menuBtn = document.getElementById('menuBtn');
        dom.pageTitle = document.getElementById('pageTitle');
        dom.addBtn = document.getElementById('addBtn');
        dom.pageContainer = document.getElementById('pageContainer');
        dom.modal = document.getElementById('modal');
        dom.modalTitle = document.getElementById('modalTitle');
        dom.modalBody = document.getElementById('modalBody');
        dom.modalClose = document.getElementById('modalClose');
        dom.toast = document.getElementById('toast');
        dom.bottomNav = document.querySelector('.bottom-nav');
    }

    // ============================================================
    // 3. 侧边栏导航
    // ============================================================

    /**
     * 渲染侧边栏导航
     */
    function _renderSidebarNav() {
        if (!dom.sidebarNav) return;
        
        const navByCategory = AppData.getNavItemsByCategory();
        let html = '';
        
        // 按分类顺序排列
        const sortedCategories = Object.entries(navByCategory)
            .sort((a, b) => a[1].order - b[1].order);
        
        for (const [catKey, category] of sortedCategories) {
            html += `<div class="nav-category">`;
            html += `<div class="nav-category-title">${category.label}</div>`;
            html += `<div class="nav-items">`;
            
            for (const item of category.items) {
                html += `
                    <button class="sidebar-nav-item" data-page="${item.id}" title="${item.label}">
                        <span class="nav-icon">${item.icon}</span>
                        <span class="nav-label">${item.label}</span>
                    </button>
                `;
            }
            
            html += `</div></div>`;
        }
        
        dom.sidebarNav.innerHTML = html;
        
        // 绑定导航点击事件
        dom.sidebarNav.querySelectorAll('.sidebar-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                navigateTo(page);
                closeSidebar();
            });
        });
    }

    /**
     * 打开侧边栏
     */
    function openSidebar() {
        if (dom.sidebar) {
            dom.sidebar.classList.add('open');
            state.isSidebarOpen = true;
        }
        if (dom.overlay) {
            dom.overlay.classList.add('active');
        }
    }

    /**
     * 关闭侧边栏
     */
    function closeSidebar() {
        if (dom.sidebar) {
            dom.sidebar.classList.remove('open');
            state.isSidebarOpen = false;
        }
        if (dom.overlay) {
            dom.overlay.classList.remove('active');
        }
    }

    /**
     * 切换侧边栏
     */
    function toggleSidebar() {
        if (state.isSidebarOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    /**
     * 更新侧边栏激活状态
     */
    function _updateSidebarActive(page) {
        if (!dom.sidebarNav) return;
        
        dom.sidebarNav.querySelectorAll('.sidebar-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
    }

    /**
     * 更新底部导航激活状态
     */
    function _updateBottomNavActive(page) {
        if (!dom.bottomNav) return;
        
        dom.bottomNav.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
    }

    // ============================================================
    // 4. 页面路由管理
    // ============================================================

    /**
     * 导航到指定页面
     * @param {string} page - 页面ID
     * @param {object} params - 页面参数
     */
    function navigateTo(page, params = {}) {
        // 检查模块是否存在
        const navItem = AppData.NAV_ITEMS.find(item => item.id === page);
        if (!navItem) {
            console.warn(`Page not found: ${page}`);
            page = 'dashboard';
        }
        
        state.currentPage = page;
        
        // 更新页面标题
        if (dom.pageTitle && navItem) {
            dom.pageTitle.textContent = navItem.label;
        }
        
        // 更新导航激活状态
        _updateSidebarActive(page);
        _updateBottomNavActive(page);
        
        // 更新URL hash
        if (history.pushState) {
            history.pushState({ page, params }, '', `#${page}`);
        }
        
        // 渲染页面内容
        _renderPage(page, params);
        
        // 更新添加按钮状态
        _updateAddButton(page);
    }

    /**
     * 渲染页面内容
     */
    function _renderPage(page, params) {
        if (!dom.pageContainer) return;
        
        // 检查是否有注册的模块渲染器
        if (state.modules[page] && typeof state.modules[page].render) {
            try {
                dom.pageContainer.innerHTML = '';
                state.modules[page].render(dom.pageContainer, params);
            } catch (e) {
                console.error(`Error rendering module ${page}:`, e);
                dom.pageContainer.innerHTML = `
                    <div class="error-page">
                        <p>😵 页面加载出错</p>
                        <p class="error-detail">${e.message}</p>
                    </div>
                `;
            }
        } else {
            // 默认页面
            _renderDefaultPage(page);
        }
    }

    /**
     * 渲染默认页面（模块未注册时的占位页）
     */
    function _renderDefaultPage(page) {
        const navItem = AppData.NAV_ITEMS.find(item => item.id === page);
        const label = navItem ? navItem.label : page;
        const icon = navItem ? navItem.icon : '📄';
        
        dom.pageContainer.innerHTML = `
            <div class="default-page">
                <div class="default-page-icon">${icon}</div>
                <h2>${label}</h2>
                <p>该模块正在开发中...</p>
                <p class="page-id">模块ID: ${page}</p>
            </div>
        `;
    }

    /**
     * 更新添加按钮
     */
    function _updateAddButton(page) {
        if (!dom.addBtn) return;
        
        // 检查模块是否有添加功能
        const hasAdd = state.modules[page] && typeof state.modules[page].onAdd;
        
        if (hasAdd) {
            dom.addBtn.style.display = '';
            dom.addBtn.onclick = () => state.modules[page].onAdd();
        } else {
            dom.addBtn.style.display = 'none';
            dom.addBtn.onclick = null;
        }
    }

    /**
     * 注册模块
     * @param {string} moduleName - 模块名称
     * @param {object} moduleObj - 模块对象，需包含 render 方法
     */
    function registerModule(moduleName, moduleObj) {
        if (typeof moduleObj.render !== 'function') {
            console.warn(`Module ${moduleName} must have a render method`);
            return false;
        }
        
        state.modules[moduleName] = moduleObj;
        
        // 如果模块有 init 方法，调用它
        if (typeof moduleObj.init === 'function') {
            try {
                moduleObj.init();
            } catch (e) {
                console.error(`Error initializing module ${moduleName}:`, e);
            }
        }
        
        // 如果当前页面就是这个模块，重新渲染
        if (state.currentPage === moduleName) {
            _renderPage(moduleName);
            _updateAddButton(moduleName);
        }
        
        return true;
    }

    /**
     * 获取当前页面
     */
    function getCurrentPage() {
        return state.currentPage;
    }

    /**
     * 获取已注册的模块列表
     */
    function getRegisteredModules() {
        return Object.keys(state.modules);
    }

    // ============================================================
    // 5. 模态框控制
    // ============================================================

    /**
     * 打开模态框
     * @param {string} title - 标题
     * @param {string|HTMLElement} content - 内容
     * @param {object} options - 选项
     */
    function openModal(title, content, options = {}) {
        if (!dom.modal || !dom.modalTitle || !dom.modalBody) return;
        
        dom.modalTitle.textContent = title;
        
        if (typeof content === 'string') {
            dom.modalBody.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            dom.modalBody.innerHTML = '';
            dom.modalBody.appendChild(content);
        }
        
        // 应用选项
        if (options.width) {
            dom.modal.querySelector('.modal-content').style.width = options.width;
        } else {
            dom.modal.querySelector('.modal-content').style.width = '';
        }
        
        dom.modal.classList.add('show');
        state.isModalOpen = true;
        
        // 打开时的回调
        if (options.onOpen && typeof options.onOpen === 'function') {
            options.onOpen();
        }
        
        // 关闭时的回调
        if (options.onClose && typeof options.onClose === 'function') {
            dom.modal._onClose = options.onClose;
        }
    }

    /**
     * 关闭模态框
     */
    function closeModal() {
        if (!dom.modal) return;
        
        dom.modal.classList.remove('show');
        state.isModalOpen = false;
        
        // 执行关闭回调
        if (dom.modal._onClose && typeof dom.modal._onClose === 'function') {
            try {
                dom.modal._onClose();
            } catch (e) {
                console.error('Modal onClose error:', e);
            }
            dom.modal._onClose = null;
        }
        
        // 清空内容
        setTimeout(() => {
            if (dom.modalBody) {
                dom.modalBody.innerHTML = '';
            }
            if (dom.modalTitle) {
                dom.modalTitle.textContent = '';
            }
        }, 300);
    }

    /**
     * 确认对话框
     * @param {string} title - 标题
     * @param {string} message - 消息
     * @param {object} options - 选项
     */
    function confirmModal(title, message, options = {}) {
        return new Promise((resolve) => {
            const html = `
                <div class="confirm-modal">
                    <p class="confirm-message">${message}</p>
                    <div class="confirm-buttons">
                        <button class="btn btn-cancel" id="confirmCancel">${options.cancelText || '取消'}</button>
                        <button class="btn btn-confirm" id="confirmOk">${options.confirmText || '确定'}</button>
                    </div>
                </div>
            `;
            
            openModal(title, html, {
                onOpen: () => {
                    document.getElementById('confirmCancel')?.addEventListener('click', () => {
                        closeModal();
                        resolve(false);
                    });
                    document.getElementById('confirmOk')?.addEventListener('click', () => {
                        closeModal();
                        resolve(true);
                    });
                },
                onClose: () => resolve(false),
            });
        });
    }

    // ============================================================
    // 6. Toast提示
    // ============================================================

    let toastTimer = null;

    /**
     * 显示Toast提示
     * @param {string} message - 消息内容
     * @param {object} options - 选项 { type: 'success'|'error'|'warning'|'info', duration: 2000 }
     */
    function showToast(message, options = {}) {
        if (!dom.toast) return;
        
        const type = options.type || 'info';
        const duration = options.duration || 2000;
        
        // 清除之前的定时器
        if (toastTimer) {
            clearTimeout(toastTimer);
        }
        
        // 设置内容和类型
        dom.toast.textContent = message;
        dom.toast.className = `toast toast-${type} show`;
        
        // 设置定时器隐藏
        toastTimer = setTimeout(() => {
            dom.toast.classList.remove('show');
            toastTimer = null;
        }, duration);
    }

    /**
     * 成功提示
     */
    function showSuccess(message) {
        showToast(message, { type: 'success' });
    }

    /**
     * 错误提示
     */
    function showError(message) {
        showToast(message, { type: 'error', duration: 3000 });
    }

    /**
     * 警告提示
     */
    function showWarning(message) {
        showToast(message, { type: 'warning' });
    }

    // ============================================================
    // 7. 日期工具函数
    // ============================================================

    /**
     * 格式化日期为 YYYY-MM-DD
     * @param {Date|string|number} date - 日期
     */
    function formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * 格式化时间为 HH:MM
     */
    function formatTime(date) {
        const d = new Date(date);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * 格式化日期时间
     */
    function formatDateTime(date) {
        return `${formatDate(date)} ${formatTime(date)}`;
    }

    /**
     * 获取今天的日期字符串
     */
    function getToday() {
        return formatDate(new Date());
    }

    /**
     * 获取相对时间描述
     */
    function getRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        if (days < 30) return `${Math.floor(days / 7)}周前`;
        if (days < 365) return `${Math.floor(days / 30)}个月前`;
        return `${Math.floor(days / 365)}年前`;
    }

    /**
     * 获取星期几
     */
    function getDayOfWeek(date) {
        const d = new Date(date);
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return days[d.getDay()];
    }

    /**
     * 获取当月第一天
     */
    function getMonthFirstDay(year, month) {
        return new Date(year, month, 1);
    }

    /**
     * 获取当月最后一天
     */
    function getMonthLastDay(year, month) {
        return new Date(year, month + 1, 0);
    }

    /**
     * 获取日期范围内的所有日期
     */
    function getDateRange(startDate, endDate) {
        const dates = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const current = new Date(start);
        while (current <= end) {
            dates.push(formatDate(current));
            current.setDate(current.getDate() + 1);
        }
        
        return dates;
    }

    /**
     * 判断是否为同一天
     */
    function isSameDay(date1, date2) {
        return formatDate(date1) === formatDate(date2);
    }

    /**
     * 获取本周的日期范围
     */
    function getWeekRange(date = new Date()) {
        const d = new Date(date);
        const day = d.getDay();
        const weekStart = AppStorage.getSettings().weekStartDay || 1; // 默认周一
        
        // 计算本周开始日期
        const diff = (day - weekStart + 7) % 7;
        const start = new Date(d);
        start.setDate(d.getDate() - diff);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        
        return { start: formatDate(start), end: formatDate(end) };
    }

    // ============================================================
    // 8. 全局事件绑定
    // ============================================================

    function _bindGlobalEvents() {
        // 菜单按钮
        if (dom.menuBtn) {
            dom.menuBtn.addEventListener('click', toggleSidebar);
        }
        
        // 主题切换按钮
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }
        
        // 侧边栏关闭按钮
        if (dom.sidebarClose) {
            dom.sidebarClose.addEventListener('click', closeSidebar);
        }
        
        // 遮罩层点击
        if (dom.overlay) {
            dom.overlay.addEventListener('click', () => {
                if (state.isSidebarOpen) {
                    closeSidebar();
                }
                if (state.isModalOpen) {
                    closeModal();
                }
            });
        }
        
        // 模态框关闭按钮
        if (dom.modalClose) {
            dom.modalClose.addEventListener('click', closeModal);
        }
        
        // 底部导航
        if (dom.bottomNav) {
            dom.bottomNav.querySelectorAll('.bottom-nav-item').forEach(item => {
                item.addEventListener('click', () => {
                    const page = item.dataset.page;
                    navigateTo(page);
                });
            });
        }
        
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            // ESC关闭模态框
            if (e.key === 'Escape' && state.isModalOpen) {
                closeModal();
            }
            // ESC关闭侧边栏
            if (e.key === 'Escape' && state.isSidebarOpen) {
                closeSidebar();
            }
        });
        
        // 浏览器前进后退
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                state.currentPage = e.state.page;
                _renderPage(e.state.page, e.state.params || {});
                _updateAddButton(e.state.page);
                _updateSidebarActive(e.state.page);
                _updateBottomNavActive(e.state.page);
                
                const navItem = AppData.NAV_ITEMS.find(item => item.id === e.state.page);
                if (dom.pageTitle && navItem) {
                    dom.pageTitle.textContent = navItem.label;
                }
            }
        });
        
        // 页面可见性变化（可选：回来时刷新）
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // 页面隐藏时保存数据
                AppStorage.save();
            } else {
                // 页面显示时，如果是今天可能需要刷新数据
                if (state.currentPage && state.modules[state.currentPage]?.onResume) {
                    state.modules[state.currentPage].onResume();
                }
            }
        });
        
        // 初始化hash路由
        if (window.location.hash) {
            const page = window.location.hash.slice(1);
            if (AppData.NAV_ITEMS.some(item => item.id === page)) {
                state.currentPage = page;
            }
        }
    }

    // ============================================================
    // 9. 主题管理
    // ============================================================

    /**
     * 应用主题
     */
    function _applyTheme() {
        const settings = AppStorage.getSettings();
        const theme = settings?.theme || 'light';
        const html = document.documentElement;
        
        // 设置data-theme属性
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
        } else if (theme === 'auto') {
            // 跟随系统
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                html.setAttribute('data-theme', 'dark');
            } else {
                html.removeAttribute('data-theme');
            }
        } else {
            html.removeAttribute('data-theme');
        }
        
        // 更新主题切换按钮图标
        const currentTheme = html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
            toggleBtn.title = currentTheme === 'dark' ? '切换到浅色模式' : '切换到深色模式';
        }
    }

    /**
     * 切换主题（浅色/深色）
     */
    function toggleTheme() {
        const settings = AppStorage.getSettings();
        const currentTheme = settings?.theme || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        
        // 显示提示
        showToast(newTheme === 'dark' ? '🌙 已切换到深色模式' : '☀️ 已切换到浅色模式');
    }

    /**
     * 设置主题
     */
    function setTheme(theme) {
        AppStorage.updateSettings({ theme });
        _applyTheme();
    }

    /**
     * 获取当前主题
     */
    function getTheme() {
        const settings = AppStorage.getSettings();
        return settings?.theme || 'light';
    }

    // ============================================================
    // 10. 通用工具函数
    // ============================================================

    /**
     * 防抖函数
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 节流函数
     */
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 安全地解析HTML（简单转义
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    /**
     * 格式化数字（带千位分隔符）
     */
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * 格式化货币
     */
    function formatCurrency(amount, currency = 'CNY') {
        const symbols = { CNY: '¥', USD: '$', EUR: '€' };
        const symbol = symbols[currency] || '¥';
        return `${symbol}${formatNumber(amount.toFixed(2))}`;
    }

    /**
     * 生成随机颜色
     */
    function randomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // ============================================================
    // 11. 导出
    // ============================================================
    return {
        // 初始化
        init,
        
        // 导航和路由
        navigateTo,
        registerModule,
        getCurrentPage,
        getRegisteredModules,
        openSidebar,
        closeSidebar,
        toggleSidebar,
        
        // 模态框
        openModal,
        closeModal,
        confirmModal,
        
        // Toast
        showToast,
        showSuccess,
        showError,
        showWarning,
        
        // 日期工具
        formatDate,
        formatTime,
        formatDateTime,
        getToday,
        getRelativeTime,
        getDayOfWeek,
        getMonthFirstDay,
        getMonthLastDay,
        getDateRange,
        isSameDay,
        getWeekRange,
        
        // 主题
        setTheme,
        
        // 工具函数
        debounce,
        throttle,
        escapeHtml,
        formatNumber,
        formatCurrency,
        randomColor,
        
        // 状态
        state,
    };
})();

// 如果在模块化环境中使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}

// 页面加载完成后初始化
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', App.init);
    } else {
        App.init();
    }
}
