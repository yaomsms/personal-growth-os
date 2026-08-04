/**
 * cloud-sync.js - 同步码云端同步工具
 * 使用 Supabase 数据库，通过自定义同步码实现多设备同步
 * 接口与原 supabase.js 完全兼容，可直接替换
 * 
 * 功能：
 *   - 输入同步码即可同步
 *   - 数据上传/下载
 *   - 实时同步监听
 *   - 同步状态管理
 */

const CloudSync = (function() {
    'use strict';

    // ============================================================
    // 1. 配置和状态
    // ============================================================

    const DEFAULT_URL = 'https://isocufbtrvrhdbhibvxg.supabase.co';
    const DEFAULT_ANON_KEY = 'sb_publishable_LVFR1WLzqxfGN1Q36rg7wQ_kss7y0U5';
    const CONFIG = {
        url: window.SUPABASE_URL || localStorage.getItem('pgos_supabase_url') || DEFAULT_URL,
        anonKey: window.SUPABASE_ANON_KEY || localStorage.getItem('pgos_supabase_anon_key') || DEFAULT_ANON_KEY,
    };

    const SYNC_STATUS = {
        IDLE: 'idle',
        SYNCING: 'syncing',
        SUCCESS: 'success',
        ERROR: 'error',
        OFFLINE: 'offline',
    };

    const state = {
        supabase: null,
        syncCode: null,
        syncCodeHash: null,
        isInitialized: false,
        syncStatus: SYNC_STATUS.IDLE,
        lastSyncTime: null,
        lastError: null,
        realtimeChannel: null,
        authListeners: [],
        syncListeners: [],
        remoteListeners: [],
        autoSyncEnabled: true,
        syncLogs: [],
    };

    // ============================================================
    // 2. 工具函数
    // ============================================================

    function hashSyncCode(code) {
        let hash = 0;
        const str = 'pgos_v2_' + code + '_sync_key';
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'sc_' + Math.abs(hash).toString(16) + '_' + str.length.toString(36);
    }

    function _setSyncStatus(status, error = null) {
        state.syncStatus = status;
        state.lastError = error;
        if (status === SYNC_STATUS.SUCCESS) {
            state.lastSyncTime = Date.now();
        }
        state.syncListeners.forEach(fn => {
            try { fn({ status, error, lastSyncTime: state.lastSyncTime }); } catch (e) {}
        });
    }

    function _logSync(direction, status, errorMsg = null) {
        state.syncLogs.unshift({
            id: Date.now(),
            direction,
            status,
            error: errorMsg,
            timestamp: new Date().toISOString(),
        });
        if (state.syncLogs.length > 100) {
            state.syncLogs = state.syncLogs.slice(0, 100);
        }
    }

    // 分离模块数据和设置
    function _splitData(data) {
        const moduleData = {};
        const settings = data.settings || {};
        const metaKeys = ['settings', 'user', 'badges', 'version', 'lastUpdated'];
        for (const key of Object.keys(data)) {
            if (!metaKeys.includes(key)) {
                moduleData[key] = data[key];
            }
        }
        return { moduleData, settings };
    }

    // 合并模块数据和设置
    function _mergeData(moduleData, settings) {
        return {
            ...moduleData,
            settings: settings || {},
        };
    }

    // ============================================================
    // 3. 初始化
    // ============================================================

    function init() {
        if (state.isInitialized) return true;

        if (!CONFIG.url || !CONFIG.anonKey) {
            console.warn('[CloudSync] Supabase 未配置，使用本地模式');
            return false;
        }

        try {
            state.supabase = supabase.createClient(CONFIG.url, CONFIG.anonKey, {
                realtime: {
                    params: { eventsPerSecond: 2 },
                },
            });
            state.isInitialized = true;
            console.log('[CloudSync] 初始化成功');

            // 检查本地是否有保存的同步码
            const savedCode = localStorage.getItem('pgos_sync_code');
            if (savedCode) {
                state.syncCode = savedCode;
                state.syncCodeHash = hashSyncCode(savedCode);
                _setupRealtimeSubscription();
                console.log('[CloudSync] 已恢复同步码:', savedCode);
                // 通知已登录
                setTimeout(() => {
                    state.authListeners.forEach(fn => {
                        try { fn('SIGNED_IN', getUser()); } catch (e) {}
                    });
                }, 50);
            }

            return true;
        } catch (e) {
            console.error('[CloudSync] 初始化失败:', e);
            return false;
        }
    }

    function isConfigured() {
        return state.isInitialized;
    }

    function isAvailable() {
        return state.isInitialized;
    }

    // ============================================================
    // 4. 同步码登录/创建
    // ============================================================

    async function signIn(code) {
        return useSyncCode(code);
    }

    async function signUp(code) {
        return useSyncCode(code);
    }

    async function useSyncCode(code) {
        if (!state.supabase) throw new Error('同步模块未初始化');
        if (!code || code.trim().length < 3) {
            throw new Error('同步码至少3位');
        }

        code = code.trim();
        const syncId = hashSyncCode(code);

        try {
            _setSyncStatus(SYNC_STATUS.SYNCING);

            // 尝试读取数据
            const { data, error } = await state.supabase
                .from('sync_codes')
                .select('*')
                .eq('sync_id', syncId)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            let isNew = false;
            if (!data) {
                // 同步码不存在，创建新的
                const { error: insertError } = await state.supabase
                    .from('sync_codes')
                    .insert({
                        sync_id: syncId,
                        sync_code: code,
                        module_data: {},
                        settings: {},
                    });

                if (insertError) throw insertError;
                isNew = true;
                console.log('[CloudSync] 创建新同步码');
            }

            state.syncCode = code;
            state.syncCodeHash = syncId;
            localStorage.setItem('pgos_sync_code', code);

            _setupRealtimeSubscription();
            _setSyncStatus(SYNC_STATUS.SUCCESS);
            _logSync('connect', 'success');

            // 通知登录成功
            state.authListeners.forEach(fn => {
                try { fn('SIGNED_IN', getUser()); } catch (e) {}
            });

            return { user: getUser(), session: { sync_code: code }, isNew };
        } catch (e) {
            console.error('[CloudSync] 使用同步码失败:', e);
            _setSyncStatus(SYNC_STATUS.ERROR, e.message);
            _logSync('connect', 'error', e.message);
            throw e;
        }
    }

    async function signOut() {
        state.syncCode = null;
        state.syncCodeHash = null;
        localStorage.removeItem('pgos_sync_code');
        _cleanupRealtimeSubscription();
        _setSyncStatus(SYNC_STATUS.IDLE);

        // 通知登出
        state.authListeners.forEach(fn => {
            try { fn('SIGNED_OUT', null); } catch (e) {}
        });

        console.log('[CloudSync] 已退出同步');
        return true;
    }

    function isLoggedIn() {
        return state.syncCodeHash !== null;
    }

    function getUser() {
        if (!state.syncCode) return null;
        return {
            id: state.syncCodeHash,
            email: state.syncCode + '@sync.local',
            user_metadata: {},
        };
    }

    function getCurrentUser() {
        return getUser();
    }

    function onAuthChange(callback) {
        if (typeof callback === 'function') {
            state.authListeners.push(callback);
        }
    }

    // ============================================================
    // 5. 数据同步 - 上传
    // ============================================================

    async function pushToCloud(data) {
        if (!state.supabase || !state.syncCodeHash) {
            throw new Error('未连接到云端');
        }

        _setSyncStatus(SYNC_STATUS.SYNCING);

        try {
            const { moduleData, settings } = _splitData(data);

            const { error } = await state.supabase
                .from('sync_codes')
                .update({
                    module_data: moduleData,
                    settings: settings,
                    updated_at: new Date().toISOString(),
                })
                .eq('sync_id', state.syncCodeHash);

            if (error) throw error;

            state.lastSyncTime = Date.now();
            state.lastError = null;
            _setSyncStatus(SYNC_STATUS.SUCCESS);
            _logSync('push', 'success');

            console.log('[CloudSync] 数据上传成功');
            return true;
        } catch (e) {
            console.error('[CloudSync] 数据上传失败:', e);
            state.lastError = e.message;
            _setSyncStatus(SYNC_STATUS.ERROR, e.message);
            _logSync('push', 'error', e.message);
            throw e;
        }
    }

    // ============================================================
    // 6. 数据同步 - 下载
    // ============================================================

    async function pullFromCloud() {
        if (!state.supabase || !state.syncCodeHash) {
            throw new Error('未连接到云端');
        }

        _setSyncStatus(SYNC_STATUS.SYNCING);

        try {
            const { data, error } = await state.supabase
                .from('sync_codes')
                .select('module_data, settings, updated_at')
                .eq('sync_id', state.syncCodeHash)
                .single();

            if (error) throw error;

            const merged = _mergeData(data.module_data, data.settings);
            merged.lastUpdated = new Date(data.updated_at).getTime();

            state.lastSyncTime = Date.now();
            state.lastError = null;
            _setSyncStatus(SYNC_STATUS.SUCCESS);
            _logSync('pull', 'success');

            console.log('[CloudSync] 数据下载成功');
            return merged;
        } catch (e) {
            console.error('[CloudSync] 数据下载失败:', e);
            state.lastError = e.message;
            _setSyncStatus(SYNC_STATUS.ERROR, e.message);
            _logSync('pull', 'error', e.message);
            throw e;
        }
    }

    // ============================================================
    // 7. 智能同步（比较时间戳）
    // ============================================================

    async function sync(localData, localUpdatedAt) {
        if (!state.supabase || !state.syncCodeHash) {
            return { action: 'none', reason: '未连接' };
        }

        try {
            const cloudData = await pullFromCloud();
            const cloudUpdatedAt = cloudData.lastUpdated || 0;

            if (!localUpdatedAt || localUpdatedAt === 0) {
                // 本地无数据，拉取云端
                return { action: 'pull', data: cloudData, reason: '本地无数据' };
            }
            if (!cloudUpdatedAt || cloudUpdatedAt === 0) {
                // 云端无数据，上传本地
                await pushToCloud(localData);
                return { action: 'push', reason: '云端无数据' };
            }
            if (Math.abs(localUpdatedAt - cloudUpdatedAt) < 5000) {
                // 5秒内的差异认为是同步的
                return { action: 'none', reason: '数据已同步' };
            }
            if (localUpdatedAt > cloudUpdatedAt) {
                // 本地较新，上传
                await pushToCloud(localData);
                return { action: 'push', reason: '本地较新' };
            } else {
                // 云端较新，拉取
                return { action: 'pull', data: cloudData, reason: '云端较新' };
            }
        } catch (e) {
            console.error('[CloudSync] 同步失败:', e);
            return { action: 'none', reason: '同步失败: ' + e.message };
        }
    }

    // 防抖同步
    let debounceTimer = null;
    function debounceSync(data, delay = 3000) {
        if (!state.autoSyncEnabled || !isLoggedIn()) return;

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            try {
                await pushToCloud(data);
            } catch (e) {
                console.error('[CloudSync] 防抖同步失败:', e);
            }
        }, delay);
    }

    function debouncedSync(data, settings, delay = 2000) {
        return debounceSync(data, delay);
    }

    // ============================================================
    // 8. 实时同步
    // ============================================================

    function _setupRealtimeSubscription() {
        if (!state.supabase || !state.syncCodeHash) return;

        _cleanupRealtimeSubscription();

        try {
            const channel = state.supabase
                .channel('sync_codes_changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'sync_codes',
                        filter: `sync_id=eq.${state.syncCodeHash}`,
                    },
                    (payload) => {
                        console.log('[CloudSync] 收到远程数据更新');
                        const newData = payload.new || {};
                        const merged = _mergeData(newData.module_data, newData.settings);
                        if (newData.updated_at) {
                            merged.lastUpdated = new Date(newData.updated_at).getTime();
                        }
                        state.remoteListeners.forEach(fn => {
                            try { fn({ data: merged, updatedAt: newData.updated_at }); } catch (e) {}
                        });
                    }
                )
                .subscribe();

            state.realtimeChannel = channel;
            console.log('[CloudSync] 实时同步已开启');
        } catch (e) {
            console.error('[CloudSync] 实时同步启动失败:', e);
        }
    }

    function _cleanupRealtimeSubscription() {
        if (state.realtimeChannel && state.supabase) {
            state.supabase.removeChannel(state.realtimeChannel);
            state.realtimeChannel = null;
        }
    }

    function onRemoteChange(callback) {
        if (typeof callback === 'function') {
            state.remoteListeners.push(callback);
        }
    }

    // ============================================================
    // 9. 状态查询
    // ============================================================

    function getSyncStatus() {
        return state.syncStatus;
    }

    function getLastSyncTime() {
        return state.lastSyncTime;
    }

    function getLastError() {
        return state.lastError;
    }

    function onSyncStatusChange(callback) {
        if (typeof callback === 'function') {
            state.syncListeners.push(callback);
        }
    }

    function setAutoSync(enabled) {
        state.autoSyncEnabled = enabled;
    }

    function isAutoSyncEnabled() {
        return state.autoSyncEnabled;
    }

    function getSyncLogs() {
        return state.syncLogs;
    }

    function clearSyncLogs() {
        state.syncLogs = [];
    }

    // ============================================================
    // 10. 其他兼容方法
    // ============================================================

    async function resetPassword(email) {
        return { success: false, error: '同步码模式不支持重置密码，请记住你的同步码' };
    }

    async function updatePassword(newPassword) {
        // 同步码模式下，修改同步码相当于改密码
        return { success: false, error: '同步码模式暂不支持修改同步码' };
    }

    // ============================================================
    // 11. 对外接口
    // ============================================================

    return {
        // 初始化与配置
        init,
        isConfigured,
        isAvailable,
        SYNC_STATUS,

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
        debouncedSync,

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

        // 同步码特有方法
        useSyncCode,
        getSyncCode: function() { return state.syncCode; },
    };
})();
