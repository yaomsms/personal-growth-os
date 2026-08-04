/**
 * supabase.js - Supabase 云端同步工具
 * 使用 Supabase CDN 方式引入，提供用户认证和数据同步功能
 * 
 * 功能：
 *   - 用户注册/登录/登出
 *   - 获取当前用户
 *   - 数据上传（本地 localStorage 数据 -> 云端）
 *   - 数据下载（云端数据 -> 本地 localStorage）
 *   - 实时同步监听
 *   - 同步状态管理
 */

const CloudSync = (function() {
    'use strict';

    // ============================================================
    // 1. 配置和状态
    // ============================================================

    // Supabase 配置（从 window 全局配置读取，或使用默认占位）
    const DEFAULT_URL = 'https://isocufbtrvrhdbhibvxg.supabase.co';
    const DEFAULT_ANON_KEY = 'sb_publishable_LVFR1WLzqxfGN1Q36rg7wQ_kss7y0U5';
    const CONFIG = {
        url: window.SUPABASE_URL || localStorage.getItem('pgos_supabase_url') || DEFAULT_URL,
        anonKey: window.SUPABASE_ANON_KEY || localStorage.getItem('pgos_supabase_anon_key') || DEFAULT_ANON_KEY,
    };

    // 同步状态
    const SYNC_STATUS = {
        IDLE: 'idle',           // 空闲
        SYNCING: 'syncing',     // 同步中
        SUCCESS: 'success',     // 成功
        ERROR: 'error',         // 失败
        OFFLINE: 'offline',     // 离线
    };

    // 内部状态
    const state = {
        supabase: null,         // Supabase 客户端实例
        user: null,             // 当前用户
        isInitialized: false,   // 是否已初始化
        syncStatus: SYNC_STATUS.IDLE,
        lastSyncTime: null,     // 上次同步时间
        lastError: null,        // 上次错误
        realtimeChannel: null,  // 实时订阅通道
        syncListeners: [],      // 同步状态监听器
        autoSyncEnabled: true,  // 是否启用自动同步
    };

    // 防抖同步定时器
    let debounceSyncTimer = null;
    const DEBOUNCE_DELAY = 3000; // 3秒防抖

    // ============================================================
    // 2. 初始化
    // ============================================================

    /**
     * 初始化 Supabase 客户端
     * 需要先在 index.html 中引入 @supabase/supabase-js CDN
     */
    function init() {
        if (state.isInitialized) return true;

        try {
            // 检查是否配置了 Supabase
            if (!CONFIG.url || !CONFIG.anonKey) {
                console.warn('[CloudSync] Supabase 未配置，将使用本地模式');
                return false;
            }

            // 检查 supabase-js 是否已加载
            if (typeof supabase === 'undefined' || !supabase.createClient) {
                console.warn('[CloudSync] Supabase JS SDK 未加载');
                return false;
            }

            // 创建客户端
            state.supabase = supabase.createClient(CONFIG.url, CONFIG.anonKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true,
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10,
                    },
                },
            });

            state.isInitialized = true;
            console.log('[CloudSync] Supabase 客户端初始化成功');

            // 检查当前会话
            _checkSession();

            // 监听认证状态变化
            state.supabase.auth.onAuthStateChange((event, session) => {
                console.log(`[CloudSync] 认证状态变化: ${event}`);
                _handleAuthChange(event, session);
            });

            return true;
        } catch (e) {
            console.error('[CloudSync] 初始化失败:', e);
            state.lastError = e.message;
            return false;
        }
    }

    /**
     * 检查是否已配置 Supabase
     */
    function isConfigured() {
        return CONFIG.url && CONFIG.anonKey && 
               typeof supabase !== 'undefined' && 
               supabase.createClient;
    }

    /**
     * 检查是否可用（已配置且已初始化）
     */
    function isAvailable() {
        return state.isInitialized && state.supabase !== null;
    }

    // ============================================================
    // 3. 用户认证
    // ============================================================

    /**
     * 检查当前会话
     */
    async function _checkSession() {
        if (!state.supabase) return null;

        try {
            const { data: { session }, error } = await state.supabase.auth.getSession();
            if (error) throw error;
            
            if (session) {
                state.user = session.user;
                console.log('[CloudSync] 已登录用户:', state.user.email);
                // 设置实时监听
                _setupRealtimeSubscription();
            } else {
                state.user = null;
            }
            return session;
        } catch (e) {
            console.error('[CloudSync] 获取会话失败:', e);
            return null;
        }
    }

    /**
     * 处理认证状态变化
     */
    function _handleAuthChange(event, session) {
        if (session?.user) {
            state.user = session.user;
            if (event === 'SIGNED_IN') {
                _setupRealtimeSubscription();
                // 登录后自动拉取云端数据
                pullFromCloud();
            }
        } else {
            state.user = null;
            _cleanupRealtimeSubscription();
        }

        // 通知所有监听器
        _notifyAuthListeners(event, session?.user || null);
    }

    // 认证状态监听器
    const authListeners = [];

    /**
     * 监听认证状态变化
     * @param {Function} callback - 回调函数 (event, user)
     */
    function onAuthChange(callback) {
        if (typeof callback === 'function') {
            authListeners.push(callback);
        }
    }

    function _notifyAuthListeners(event, user) {
        for (const cb of authListeners) {
            try {
                cb(event, user);
            } catch (e) {
                console.error('[CloudSync] 认证监听器错误:', e);
            }
        }
    }

    /**
     * 用户注册
     * @param {string} email - 邮箱
     * @param {string} password - 密码
     * @param {object} options - 可选参数 { redirectTo }
     */
    async function signUp(email, password, options = {}) {
        if (!state.supabase) throw new Error('Supabase 未初始化');

        try {
            const { data, error } = await state.supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: options.redirectTo,
                },
            });

            if (error) throw error;

            // 注册成功后创建用户数据记录
            if (data.user) {
                await _ensureUserData(data.user.id);
            }

            return { user: data.user, session: data.session };
        } catch (e) {
            console.error('[CloudSync] 注册失败:', e);
            throw e;
        }
    }

    /**
     * 用户登录
     * @param {string} email - 邮箱
     * @param {string} password - 密码
     */
    async function signIn(email, password) {
        if (!state.supabase) throw new Error('Supabase 未初始化');

        try {
            const { data, error } = await state.supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            state.user = data.user;
            console.log('[CloudSync] 登录成功:', data.user.email);

            return { user: data.user, session: data.session };
        } catch (e) {
            console.error('[CloudSync] 登录失败:', e);
            throw e;
        }
    }

    /**
     * 用户登出
     */
    async function signOut() {
        if (!state.supabase) throw new Error('Supabase 未初始化');

        try {
            const { error } = await state.supabase.auth.signOut();
            if (error) throw error;

            state.user = null;
            _cleanupRealtimeSubscription();
            console.log('[CloudSync] 已登出');

            return true;
        } catch (e) {
            console.error('[CloudSync] 登出失败:', e);
            throw e;
        }
    }

    /**
     * 重置密码（发送重置邮件）
     * @param {string} email - 邮箱
     * @param {object} options - 可选参数 { redirectTo }
     */
    async function resetPassword(email, options = {}) {
        if (!state.supabase) throw new Error('Supabase 未初始化');

        try {
            const { error } = await state.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: options.redirectTo,
            });

            if (error) throw error;
            return true;
        } catch (e) {
            console.error('[CloudSync] 重置密码失败:', e);
            throw e;
        }
    }

    /**
     * 更新密码
     * @param {string} newPassword - 新密码
     */
    async function updatePassword(newPassword) {
        if (!state.supabase) throw new Error('Supabase 未初始化');

        try {
            const { data, error } = await state.supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;
            return data.user;
        } catch (e) {
            console.error('[CloudSync] 更新密码失败:', e);
            throw e;
        }
    }

    /**
     * 获取当前用户
     */
    async function getCurrentUser() {
        if (!state.supabase) return null;

        try {
            const { data: { user }, error } = await state.supabase.auth.getUser();
            if (error) throw error;
            state.user = user;
            return user;
        } catch (e) {
            console.error('[CloudSync] 获取用户失败:', e);
            return null;
        }
    }

    /**
     * 获取当前用户（同步方式，从内存状态获取）
     */
    function getUser() {
        return state.user;
    }

    /**
     * 检查是否已登录
     */
    function isLoggedIn() {
        return state.user !== null;
    }

    // ============================================================
    // 4. 数据同步 - 上传
    // ============================================================

    /**
     * 确保用户数据记录存在
     */
    async function _ensureUserData(userId) {
        if (!state.supabase) return;

        try {
            // 检查记录是否存在
            const { data, error } = await state.supabase
                .from('user_data')
                .select('id')
                .eq('id', userId)
                .single();

            if (error && error.code === 'PGRST116') {
                // 记录不存在，创建新记录
                const { error: insertError } = await state.supabase
                    .from('user_data')
                    .insert({
                        id: userId,
                        module_data: {},
                        settings: {},
                    });

                if (insertError) throw insertError;
                console.log('[CloudSync] 已创建用户数据记录');
            } else if (error) {
                throw error;
            }
        } catch (e) {
            console.error('[CloudSync] 确保用户数据记录失败:', e);
        }
    }

    /**
     * 将本地数据上传到云端
     * @param {object} data - 要上传的数据（完整的应用数据对象）
     */
    async function pushToCloud(data) {
        if (!state.supabase || !state.user) {
            throw new Error('未登录或 Supabase 未初始化');
        }

        _setSyncStatus(SYNC_STATUS.SYNCING);

        try {
            // 确保记录存在
            await _ensureUserData(state.user.id);

            // 分离模块数据和设置
            const moduleData = {};
            let settings = data.settings || {};

            // 提取各模块数据（排除 settings、user、badges、version、lastUpdated 等元数据）
            const metaKeys = ['settings', 'user', 'badges', 'version', 'lastUpdated'];
            for (const key of Object.keys(data)) {
                if (!metaKeys.includes(key)) {
                    moduleData[key] = data[key];
                }
            }

            // 上传数据
            const { error } = await state.supabase
                .from('user_data')
                .update({
                    module_data: moduleData,
                    settings: settings,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', state.user.id);

            if (error) throw error;

            state.lastSyncTime = Date.now();
            state.lastError = null;
            _setSyncStatus(SYNC_STATUS.SUCCESS);

            console.log('[CloudSync] 数据上传成功');

            // 记录同步日志
            _logSync('push', 'success');

            return true;
        } catch (e) {
            console.error('[CloudSync] 数据上传失败:', e);
            state.lastError = e.message;
            _setSyncStatus(SYNC_STATUS.ERROR);
            _logSync('push', 'error', e.message);
            throw e;
        }
    }

    // ============================================================
    // 5. 数据同步 - 下载
    // ============================================================

    /**
     * 从云端拉取数据到本地
     * @returns {object|null} 云端数据对象，格式与本地 localStorage 数据一致
     */
    async function pullFromCloud() {
        if (!state.supabase || !state.user) {
            throw new Error('未登录或 Supabase 未初始化');
        }

        _setSyncStatus(SYNC_STATUS.SYNCING);

        try {
            const { data, error } = await state.supabase
                .from('user_data')
                .select('module_data, settings, updated_at')
                .eq('id', state.user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // 没有数据记录，返回 null
                    _setSyncStatus(SYNC_STATUS.SUCCESS);
                    return null;
                }
                throw error;
            }

            // 合并模块数据和设置为完整的数据对象
            const cloudData = {
                ...(data.module_data || {}),
                settings: data.settings || {},
            };

            state.lastSyncTime = Date.now();
            state.lastError = null;
            _setSyncStatus(SYNC_STATUS.SUCCESS);

            console.log('[CloudSync] 数据拉取成功');
            _logSync('pull', 'success');

            return {
                data: cloudData,
                updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : null,
            };
        } catch (e) {
            console.error('[CloudSync] 数据拉取失败:', e);
            state.lastError = e.message;
            _setSyncStatus(SYNC_STATUS.ERROR);
            _logSync('pull', 'error', e.message);
            throw e;
        }
    }

    // ============================================================
    // 6. 冲突处理与智能同步
    // ============================================================

    /**
     * 执行完整同步（智能处理冲突）
     * 策略：比较本地和云端的更新时间，取较新的一方
     * 如果本地较新则上传，如果云端较新则下载
     * 
     * @param {object} localData - 本地数据
     * @param {number} localUpdatedAt - 本地更新时间戳
     * @returns {object} { action: 'push'|'pull'|'none', data?: object }
     */
    async function sync(localData, localUpdatedAt) {
        if (!state.supabase || !state.user) {
            return { action: 'none', reason: '未登录' };
        }

        _setSyncStatus(SYNC_STATUS.SYNCING);

        try {
            // 先获取云端数据的更新时间
            const { data, error } = await state.supabase
                .from('user_data')
                .select('updated_at')
                .eq('id', state.user.id)
                .single();

            if (error && error.code === 'PGRST116') {
                // 云端无数据，直接上传本地数据
                await pushToCloud(localData);
                return { action: 'push', reason: '云端无数据' };
            }

            if (error) throw error;

            const cloudUpdatedAt = data.updated_at ? new Date(data.updated_at).getTime() : 0;

            if (!localUpdatedAt || localUpdatedAt <= 0) {
                // 本地无数据，下载云端数据
                const result = await pullFromCloud();
                return { action: 'pull', data: result?.data, reason: '本地无数据' };
            }

            // 比较更新时间
            const timeDiff = localUpdatedAt - cloudUpdatedAt;
            const THRESHOLD = 5000; // 5秒内的差异视为同时更新

            if (Math.abs(timeDiff) < THRESHOLD) {
                // 时间接近，视为一致，不做操作
                _setSyncStatus(SYNC_STATUS.SUCCESS);
                return { action: 'none', reason: '数据已同步' };
            } else if (timeDiff > 0) {
                // 本地更新，上传
                await pushToCloud(localData);
                return { action: 'push', reason: '本地较新' };
            } else {
                // 云端更新，下载
                const result = await pullFromCloud();
                return { action: 'pull', data: result?.data, reason: '云端较新' };
            }
        } catch (e) {
            console.error('[CloudSync] 同步失败:', e);
            state.lastError = e.message;
            _setSyncStatus(SYNC_STATUS.ERROR);
            throw e;
        }
    }

    /**
     * 防抖同步（数据变更后自动触发）
     * @param {object} localData - 本地数据
     */
    function debounceSync(localData) {
        if (!state.autoSyncEnabled || !isLoggedIn()) return;

        if (debounceSyncTimer) {
            clearTimeout(debounceSyncTimer);
        }

        debounceSyncTimer = setTimeout(() => {
            if (localData && localData.lastUpdated) {
                pushToCloud(localData).catch(e => {
                    console.error('[CloudSync] 自动同步失败:', e);
                });
            }
        }, DEBOUNCE_DELAY);
    }

    // ============================================================
    // 7. 实时同步监听
    // ============================================================

    /**
     * 设置实时订阅，监听云端数据变化
     */
    function _setupRealtimeSubscription() {
        if (!state.supabase || !state.user) return;
        if (state.realtimeChannel) return; // 已设置

        try {
            const channel = state.supabase
                .channel('user_data_changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'user_data',
                        filter: `id=eq.${state.user.id}`,
                    },
                    (payload) => {
                        console.log('[CloudSync] 收到云端数据变更:', payload);
                        // 通知外部监听器
                        _notifyRemoteChange(payload.new);
                    }
                )
                .subscribe((status) => {
                    console.log(`[CloudSync] 实时订阅状态: ${status}`);
                });

            state.realtimeChannel = channel;
        } catch (e) {
            console.error('[CloudSync] 设置实时订阅失败:', e);
        }
    }

    /**
     * 清理实时订阅
     */
    function _cleanupRealtimeSubscription() {
        if (state.realtimeChannel && state.supabase) {
            state.supabase.removeChannel(state.realtimeChannel);
            state.realtimeChannel = null;
            console.log('[CloudSync] 已清理实时订阅');
        }
    }

    // 远程变更监听器
    const remoteChangeListeners = [];

    /**
     * 监听远程数据变更
     * @param {Function} callback - 回调函数 (newData)
     */
    function onRemoteChange(callback) {
        if (typeof callback === 'function') {
            remoteChangeListeners.push(callback);
        }
    }

    function _notifyRemoteChange(newRecord) {
        const cloudData = {
            ...(newRecord.module_data || {}),
            settings: newRecord.settings || {},
        };
        for (const cb of remoteChangeListeners) {
            try {
                cb({
                    data: cloudData,
                    updatedAt: newRecord.updated_at ? new Date(newRecord.updated_at).getTime() : null,
                });
            } catch (e) {
                console.error('[CloudSync] 远程变更监听器错误:', e);
            }
        }
    }

    // ============================================================
    // 8. 同步状态管理
    // ============================================================

    /**
     * 设置同步状态
     */
    function _setSyncStatus(status) {
        state.syncStatus = status;
        _notifySyncStatusChange(status);
    }

    /**
     * 获取当前同步状态
     */
    function getSyncStatus() {
        return state.syncStatus;
    }

    /**
     * 获取上次同步时间
     */
    function getLastSyncTime() {
        return state.lastSyncTime;
    }

    /**
     * 获取上次错误
     */
    function getLastError() {
        return state.lastError;
    }

    /**
     * 监听同步状态变化
     * @param {Function} callback - 回调函数 (status)
     */
    function onSyncStatusChange(callback) {
        if (typeof callback === 'function') {
            state.syncListeners.push(callback);
        }
    }

    function _notifySyncStatusChange(status) {
        for (const cb of state.syncListeners) {
            try {
                cb(status);
            } catch (e) {
                console.error('[CloudSync] 同步状态监听器错误:', e);
            }
        }
    }

    /**
     * 设置是否启用自动同步
     */
    function setAutoSync(enabled) {
        state.autoSyncEnabled = enabled;
        if (!enabled && debounceSyncTimer) {
            clearTimeout(debounceSyncTimer);
            debounceSyncTimer = null;
        }
    }

    /**
     * 获取自动同步状态
     */
    function isAutoSyncEnabled() {
        return state.autoSyncEnabled;
    }

    // ============================================================
    // 9. 同步日志（可选）
    // ============================================================

    /**
     * 记录同步日志（本地存储，便于调试）
     */
    function _logSync(direction, status, errorMsg = '') {
        try {
            const log = {
                timestamp: Date.now(),
                direction,
                status,
                error: errorMsg,
            };

            const logs = JSON.parse(localStorage.getItem('pgos_sync_logs') || '[]');
            logs.push(log);
            
            // 只保留最近 50 条
            while (logs.length > 50) {
                logs.shift();
            }
            
            localStorage.setItem('pgos_sync_logs', JSON.stringify(logs));
        } catch (e) {
            // 忽略日志错误
        }
    }

    /**
     * 获取同步日志
     */
    function getSyncLogs() {
        try {
            return JSON.parse(localStorage.getItem('pgos_sync_logs') || '[]');
        } catch (e) {
            return [];
        }
    }

    /**
     * 清除同步日志
     */
    function clearSyncLogs() {
        localStorage.removeItem('pgos_sync_logs');
    }

    // ============================================================
    // 10. 导出
    // ============================================================

    return {
        // 初始化与配置
        init,
        isConfigured,
        isAvailable,
        
        // 用户认证
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        getCurrentUser,
        getUser,
        isLoggedIn,
        onAuthChange,
        
        // 数据同步
        pushToCloud,
        pullFromCloud,
        sync,
        debounceSync,
        
        // 实时同步
        onRemoteChange,
        
        // 同步状态
        getSyncStatus,
        getLastSyncTime,
        getLastError,
        onSyncStatusChange,
        setAutoSync,
        isAutoSyncEnabled,
        
        // 同步日志
        getSyncLogs,
        clearSyncLogs,
        
        // 状态常量
        SYNC_STATUS,
    };
})();

// 如果在模块化环境中使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudSync;
}
