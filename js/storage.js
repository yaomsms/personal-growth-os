/**
 * storage.js - 本地存储管理
 * 使用localStorage持久化数据，提供数据的增删改查封装、默认数据初始化、数据备份和导出功能
 */

const AppStorage = (function() {
    'use strict';

    const STORAGE_KEY = 'personal_growth_os_data';
    const BACKUP_KEY_PREFIX = 'pgos_backup_';
    const MAX_BACKUPS = 10;
    const CLOUD_MODE_KEY = 'pgos_cloud_mode';

    // 内存中的数据缓存
    let _data = null;
    let _listeners = {}; // 数据变更监听器

    // 云端模式状态
    let _cloudMode = false; // 是否启用云端模式
    let _cloudInitialized = false; // 云端模块是否已初始化
    let _isSyncing = false; // 是否正在同步中（防止循环触发）
    let _syncDebounceTimer = null; // 防抖同步定时器
    const SYNC_DEBOUNCE_DELAY = 3000; // 3秒防抖

    // ============================================================
    // 1. 初始化和基础操作
    // ============================================================

    /**
     * 初始化存储 - 从localStorage加载数据，如果没有则使用默认数据
     * 如果启用了云端模式，还会初始化云端同步
     */
    function init() {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
                _data = JSON.parse(savedData);
                // 数据迁移检查（版本升级时使用）
                _migrateData();
            } else {
                // 首次使用，初始化默认数据
                _data = AppData.getDefaultData();
                save();
                // 授予首次使用徽章
                awardBadge('badge_onboarding');
            }

            // 检查云端模式设置
            const cloudModeSaved = localStorage.getItem(CLOUD_MODE_KEY);
            if (cloudModeSaved === 'true') {
                _cloudMode = true;
                // 延迟初始化云端模块（确保 CloudSync 已加载）
                setTimeout(() => {
                    _initCloudSync();
                }, 100);
            }

            return true;
        } catch (e) {
            console.error('Storage initialization failed:', e);
            // 出错时使用默认数据
            _data = AppData.getDefaultData();
            return false;
        }
    }

    /**
     * 初始化云端同步
     */
    function _initCloudSync() {
        if (_cloudInitialized) return;

        // 检查 CloudSync 是否可用
        if (typeof CloudSync === 'undefined') {
            console.warn('[AppStorage] CloudSync 模块未加载');
            return;
        }

        // 初始化 Supabase 客户端
        const initialized = CloudSync.init();
        if (!initialized) {
            console.warn('[AppStorage] CloudSync 初始化失败，切换到本地模式');
            _cloudMode = false;
            localStorage.setItem(CLOUD_MODE_KEY, 'false');
            return;
        }

        _cloudInitialized = true;

        // 检查登录状态
        const user = CloudSync.getUser();
        if (!user) {
            // 没有登录，但云端模式已开启 - 等待登录
            console.log('[AppStorage] 云端模式已开启，但尚未登录');
        } else {
            // 已登录，执行初始同步
            console.log('[AppStorage] 已登录，开始初始同步');
            _performInitialSync();
        }

        // 监听认证状态变化
        CloudSync.onAuthChange((event, user) => {
            if (event === 'SIGNED_IN' && user) {
                console.log('[AppStorage] 用户已登录，执行初始同步');
                _performInitialSync();
            } else if (event === 'SIGNED_OUT') {
                console.log('[AppStorage] 用户已登出');
            }
        });

        // 监听远程数据变更
        CloudSync.onRemoteChange((remoteData) => {
            console.log('[AppStorage] 收到远程数据变更');
            _handleRemoteChange(remoteData);
        });

        console.log('[AppStorage] 云端同步初始化完成');
    }

    /**
     * 执行初始同步（应用启动时）
     * 策略：比较本地和云端更新时间，取较新的
     */
    async function _performInitialSync() {
        if (!_cloudMode || !_cloudInitialized) return;

        try {
            const localUpdatedAt = _data?.lastUpdated || 0;
            const result = await CloudSync.sync(_data, localUpdatedAt);

            if (result.action === 'pull' && result.data) {
                // 云端较新，合并到本地
                _mergeCloudData(result.data);
                console.log('[AppStorage] 初始同步完成，已拉取云端数据');
            } else if (result.action === 'push') {
                console.log('[AppStorage] 初始同步完成，已上传本地数据');
            } else {
                console.log('[AppStorage] 初始同步完成，数据已是最新');
            }

            _notifyListeners('cloud_sync', { action: result.action, reason: result.reason });
        } catch (e) {
            console.error('[AppStorage] 初始同步失败:', e);
        }
    }

    /**
     * 处理远程数据变更（其他设备修改了数据）
     */
    function _handleRemoteChange(remoteData) {
        if (_isSyncing) return; // 防止循环触发

        if (!remoteData || !remoteData.data) return;

        // 比较更新时间
        const remoteUpdatedAt = remoteData.updatedAt || 0;
        const localUpdatedAt = _data?.lastUpdated || 0;

        if (remoteUpdatedAt > localUpdatedAt) {
            // 云端更新，合并到本地
            _mergeCloudData(remoteData.data);
            _notifyListeners('remote_sync', { updatedAt: remoteUpdatedAt });
        }
    }

    /**
     * 合并云端数据到本地
     * 云端数据格式：各模块数据 + settings
     */
    function _mergeCloudData(cloudData) {
        _isSyncing = true;

        try {
            // 保留本地的版本号和徽章（这些是本地特定的）
            const localVersion = _data.version;
            const localBadges = _data.badges || [];
            const localUser = _data.user || {};

            // 合并数据
            _data = {
                ...cloudData,
                version: localVersion,
                badges: localBadges,
                user: { ...localUser, ...(cloudData.user || {}) },
                lastUpdated: Date.now(),
            };

            // 保存到本地
            localStorage.setItem(STORAGE_KEY, JSON.stringify(_data));

            // 通知所有模块数据已更新
            _notifyListeners('reset');

            console.log('[AppStorage] 云端数据已合并到本地');
        } catch (e) {
            console.error('[AppStorage] 合并云端数据失败:', e);
        } finally {
            _isSyncing = false;
        }
    }

    /**
     * 数据迁移 - 版本升级时的数据结构更新
     */
    function _migrateData() {
        const currentVersion = _data.version || '0.0.0';
        const defaultVersion = AppData.DEFAULT_DATA.version;
        
        if (currentVersion === defaultVersion) return;

        // 这里可以添加不同版本间的迁移逻辑
        // 例如: if (currentVersion < '1.1.0') { ... }
        
        // 更新版本号
        _data.version = defaultVersion;
        _data.lastUpdated = Date.now();
        save();
    }

    /**
     * 保存数据到localStorage
     * 如果启用了云端模式，会触发防抖同步
     */
    function save() {
        try {
            _data.lastUpdated = Date.now();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(_data));
            
            // 云端模式下，触发防抖同步
            if (_cloudMode && _cloudInitialized && !_isSyncing) {
                _triggerDebounceSync();
            }
            
            return true;
        } catch (e) {
            console.error('Save data failed:', e);
            if (e.name === 'QuotaExceededError') {
                console.error('Storage quota exceeded');
            }
            return false;
        }
    }

    /**
     * 触发防抖同步（数据变更后延迟上传到云端）
     */
    function _triggerDebounceSync() {
        if (!_cloudMode || !_cloudInitialized) return;
        if (typeof CloudSync === 'undefined') return;
        if (!CloudSync.isLoggedIn()) return;

        if (_syncDebounceTimer) {
            clearTimeout(_syncDebounceTimer);
        }

        _syncDebounceTimer = setTimeout(() => {
            if (_data && _data.lastUpdated) {
                CloudSync.pushToCloud(_data).catch(e => {
                    console.error('[AppStorage] 自动同步失败:', e);
                });
            }
        }, SYNC_DEBOUNCE_DELAY);
    }

    /**
     * 获取所有数据
     */
    function getAll() {
        if (!_data) init();
        return _data;
    }

    /**
     * 重置为默认数据
     */
    function reset() {
        _data = AppData.getDefaultData();
        save();
        _notifyListeners('reset');
        return true;
    }

    /**
     * 检查数据是否已初始化
     */
    function isInitialized() {
        return _data !== null;
    }

    // ============================================================
    // 2. 模块级数据操作（增删改查）
    // ============================================================

    /**
     * 获取指定模块的数据
     * @param {string} moduleName - 模块名称
     * @returns {*} 模块数据
     */
    function getModule(moduleName) {
        if (!_data) init();
        return _data[moduleName];
    }

    /**
     * 设置指定模块的数据
     * @param {string} moduleName - 模块名称
     * @param {*} value - 新值
     */
    function setModule(moduleName, value) {
        if (!_data) init();
        _data[moduleName] = value;
        save();
        _notifyListeners(moduleName, value);
        return true;
    }

    /**
     * 更新指定模块的数据（部分更新，适用于对象）
     * @param {string} moduleName - 模块名称
     * @param {object} updates - 要更新的属性
     */
    function updateModule(moduleName, updates) {
        if (!_data) init();
        if (typeof _data[moduleName] === 'object' && !Array.isArray(_data[moduleName])) {
            _data[moduleName] = { ..._data[moduleName], ...updates };
            save();
            _notifyListeners(moduleName, _data[moduleName]);
            return true;
        }
        return false;
    }

    // ============================================================
    // 3. 列表型数据的增删改查
    // ============================================================

    /**
     * 向模块的列表中添加项
     * @param {string} moduleName - 模块名称
     * @param {string} listKey - 列表键名
     * @param {object} item - 要添加的项
     * @param {string} idPrefix - ID前缀
     */
    function addItem(moduleName, listKey, item, idPrefix = 'item') {
        if (!_data) init();
        const moduleData = _data[moduleName];
        if (!moduleData || !Array.isArray(moduleData[listKey])) {
            return null;
        }
        
        const newItem = {
            ...item,
            id: item.id || AppData.generateId(idPrefix),
            createdAt: item.createdAt || Date.now(),
        };
        
        moduleData[listKey].push(newItem);
        save();
        _notifyListeners(moduleName, moduleData);
        return newItem;
    }

    /**
     * 更新模块列表中的项
     * @param {string} moduleName - 模块名称
     * @param {string} listKey - 列表键名
     * @param {string} itemId - 项的ID
     * @param {object} updates - 要更新的属性
     */
    function updateItem(moduleName, listKey, itemId, updates) {
        if (!_data) init();
        const moduleData = _data[moduleName];
        if (!moduleData || !Array.isArray(moduleData[listKey])) {
            return null;
        }
        
        const index = moduleData[listKey].findIndex(item => item.id === itemId);
        if (index === -1) return null;
        
        moduleData[listKey][index] = {
            ...moduleData[listKey][index],
            ...updates,
            updatedAt: Date.now(),
        };
        
        save();
        _notifyListeners(moduleName, moduleData);
        return moduleData[listKey][index];
    }

    /**
     * 删除模块列表中的项
     * @param {string} moduleName - 模块名称
     * @param {string} listKey - 列表键名
     * @param {string} itemId - 项的ID
     */
    function deleteItem(moduleName, listKey, itemId) {
        if (!_data) init();
        const moduleData = _data[moduleName];
        if (!moduleData || !Array.isArray(moduleData[listKey])) {
            return false;
        }
        
        const index = moduleData[listKey].findIndex(item => item.id === itemId);
        if (index === -1) return false;
        
        moduleData[listKey].splice(index, 1);
        save();
        _notifyListeners(moduleName, moduleData);
        return true;
    }

    /**
     * 根据ID获取模块列表中的项
     * @param {string} moduleName - 模块名称
     * @param {string} listKey - 列表键名
     * @param {string} itemId - 项的ID
     */
    function getItemById(moduleName, listKey, itemId) {
        if (!_data) init();
        const moduleData = _data[moduleName];
        if (!moduleData || !Array.isArray(moduleData[listKey])) {
            return null;
        }
        
        return moduleData[listKey].find(item => item.id === itemId) || null;
    }

    // ============================================================
    // 4. 日期型数据操作（按日期存储的记录）
    // ============================================================

    /**
     * 获取指定日期的记录
     * @param {string} moduleName - 模块名称
     * @param {string} recordsKey - 记录键名
     * @param {string} date - 日期字符串 (YYYY-MM-DD)
     */
    function getRecordByDate(moduleName, recordsKey, date) {
        if (!_data) init();
        const moduleData = _data[moduleName];
        if (!moduleData || !moduleData[recordsKey]) {
            return null;
        }
        return moduleData[recordsKey][date] || null;
    }

    /**
     * 设置指定日期的记录
     * @param {string} moduleName - 模块名称
     * @param {string} recordsKey - 记录键名
     * @param {string} date - 日期字符串 (YYYY-MM-DD)
     * @param {*} record - 记录数据
     */
    function setRecordByDate(moduleName, recordsKey, date, record) {
        if (!_data) init();
        const moduleData = _data[moduleName];
        if (!moduleData || !moduleData[recordsKey]) {
            return false;
        }
        
        moduleData[recordsKey][date] = record;
        save();
        _notifyListeners(moduleName, moduleData);
        return true;
    }

    /**
     * 更新指定日期的记录
     * @param {string} moduleName - 模块名称
     * @param {string} recordsKey - 记录键名
     * @param {string} date - 日期字符串 (YYYY-MM-DD)
     * @param {object} updates - 要更新的属性
     */
    function updateRecordByDate(moduleName, recordsKey, date, updates) {
        if (!_data) init();
        const moduleData = _data[moduleName];
        if (!moduleData || !moduleData[recordsKey]) {
            return false;
        }
        
        const existing = moduleData[recordsKey][date] || {};
        moduleData[recordsKey][date] = { ...existing, ...updates };
        save();
        _notifyListeners(moduleName, moduleData);
        return moduleData[recordsKey][date];
    }

    /**
     * 删除指定日期的记录
     * @param {string} moduleName - 模块名称
     * @param {string} recordsKey - 记录键名
     * @param {string} date - 日期字符串
     */
    function deleteRecordByDate(moduleName, recordsKey, date) {
        if (!_data) init();
        const moduleData = _data[moduleName];
        if (!moduleData || !moduleData[recordsKey]) {
            return false;
        }
        
        if (moduleData[recordsKey][date]) {
            delete moduleData[recordsKey][date];
            save();
            _notifyListeners(moduleName, moduleData);
            return true;
        }
        return false;
    }

    /**
     * 获取日期范围内的记录
     * @param {string} moduleName - 模块名称
     * @param {string} recordsKey - 记录键名
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     */
    function getRecordsInRange(moduleName, recordsKey, startDate, endDate) {
        if (!_data) init();
        const moduleData = _data[moduleName];
        if (!moduleData || !moduleData[recordsKey]) {
            return {};
        }
        
        const result = {};
        const records = moduleData[recordsKey];
        
        for (const date in records) {
            if (date >= startDate && date <= endDate) {
                result[date] = records[date];
            }
        }
        
        return result;
    }

    // ============================================================
    // 5. 用户设置
    // ============================================================

    /**
     * 获取设置
     */
    function getSettings() {
        if (!_data) init();
        return _data.settings;
    }

    /**
     * 更新设置
     * @param {object} updates - 要更新的设置项
     */
    function updateSettings(updates) {
        if (!_data) init();
        _data.settings = { ..._data.settings, ...updates };
        save();
        _notifyListeners('settings', _data.settings);
        return _data.settings;
    }

    /**
     * 获取用户信息
     */
    function getUser() {
        if (!_data) init();
        return _data.user;
    }

    /**
     * 更新用户信息
     */
    function updateUser(updates) {
        if (!_data) init();
        _data.user = { ..._data.user, ...updates };
        save();
        _notifyListeners('user', _data.user);
        return _data.user;
    }

    // ============================================================
    // 6. 徽章系统
    // ============================================================

    /**
     * 获取已获得的徽章
     */
    function getEarnedBadges() {
        if (!_data) init();
        return _data.badges || [];
    }

    /**
     * 授予徽章
     * @param {string} badgeId - 徽章ID
     */
    function awardBadge(badgeId) {
        if (!_data) init();
        if (!_data.badges) _data.badges = [];
        
        if (!_data.badges.includes(badgeId)) {
            _data.badges.push(badgeId);
            save();
            _notifyListeners('badges', _data.badges);
            
            // 触发徽章获得事件
            _notifyListeners('badge_earned', badgeId);
            return true;
        }
        return false;
    }

    /**
     * 检查是否已获得某徽章
     */
    function hasBadge(badgeId) {
        if (!_data) init();
        return (_data.badges || []).includes(badgeId);
    }

    // ============================================================
    // 7. 数据备份和导出
    // ============================================================

    /**
     * 创建数据备份
     * @param {string} label - 备份标签
     */
    function createBackup(label = '') {
        try {
            const backup = {
                timestamp: Date.now(),
                label: label || `备份_${new Date().toLocaleDateString()}`,
                version: _data.version,
                data: AppData.deepClone(_data),
            };
            
            const backups = getBackups();
            
            // 移除超出数量限制的旧备份
            while (backups.length >= MAX_BACKUPS) {
                const oldest = backups.shift();
                localStorage.removeItem(BACKUP_KEY_PREFIX + oldest.timestamp);
            }
            
            const backupKey = BACKUP_KEY_PREFIX + backup.timestamp;
            localStorage.setItem(backupKey, JSON.stringify(backup));
            
            return backup;
        } catch (e) {
            console.error('Create backup failed:', e);
            return null;
        }
    }

    /**
     * 获取所有备份列表
     */
    function getBackups() {
        const backups = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(BACKUP_KEY_PREFIX)) {
                try {
                    const backup = JSON.parse(localStorage.getItem(key));
                    backups.push({
                        timestamp: backup.timestamp,
                        label: backup.label,
                        version: backup.version,
                        key: key,
                    });
                } catch (e) {
                    // 忽略损坏的备份
                }
            }
        }
        return backups.sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * 从备份恢复数据
     * @param {string} backupKey - 备份键名
     */
    function restoreFromBackup(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) return false;
            
            const backup = JSON.parse(backupData);
            if (!backup.data) return false;
            
            // 创建当前数据的临时备份
            createBackup('恢复前自动备份');
            
            _data = backup.data;
            save();
            _notifyListeners('reset');
            return true;
        } catch (e) {
            console.error('Restore backup failed:', e);
            return false;
        }
    }

    /**
     * 删除指定备份
     */
    function deleteBackup(backupKey) {
        try {
            localStorage.removeItem(backupKey);
            return true;
        } catch (e) {
            console.error('Delete backup failed:', e);
            return false;
        }
    }

    /**
     * 导出数据为JSON文件
     */
    function exportData() {
        if (!_data) init();
        
        const exportObj = {
            exportedAt: Date.now(),
            version: _data.version,
            data: _data,
        };
        
        return JSON.stringify(exportObj, null, 2);
    }

    /**
     * 导出数据并下载为文件
     */
    function exportDataToFile() {
        const dataStr = exportData();
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `growth_os_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 从JSON文件导入数据
     * @param {File} file - 文件对象
     * @param {boolean} merge - 是否合并（true: 合并，false: 覆盖）
     */
    function importDataFromFile(file, merge = false) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    const data = importData.data || importData; // 兼容格式
                    
                    if (merge) {
                        _mergeImportedData(data);
                    } else {
                        // 创建当前数据备份
                        createBackup('导入前自动备份');
                        _data = data;
                    }
                    
                    save();
                    _notifyListeners('reset');
                    resolve(true);
                } catch (err) {
                    reject(new Error('文件格式不正确'));
                }
            };
            
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }

    /**
     * 合并导入的数据（简单的深度合并）
     */
    function _mergeImportedData(importedData) {
        function deepMerge(target, source) {
            for (const key of Object.keys(source)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    deepMerge(target[key], source[key]);
                } else if (Array.isArray(source[key])) {
                    // 数组合并（按ID去重）
                    if (!target[key]) {
                        target[key] = [...source[key]];
                    } else {
                        const existingIds = new Set(target[key].map(item => item.id));
                        for (const item of source[key]) {
                            if (item.id && !existingIds.has(item.id)) {
                                target[key].push(item);
                            }
                        }
                    }
                } else {
                    // 基础类型保留目标值（不覆盖）
                    if (!(key in target)) {
                        target[key] = source[key];
                    }
                }
            }
        }
        
        deepMerge(_data, importedData);
    }

    // ============================================================
    // 8. 数据变更监听
    // ============================================================

    /**
     * 监听数据变更
     * @param {string} moduleName - 模块名或 'reset' / 'badge_earned' 等特殊事件
     * @param {Function} callback - 回调函数
     */
    function on(moduleName, callback) {
        if (!_listeners[moduleName]) {
            _listeners[moduleName] = [];
        }
        _listeners[moduleName].push(callback);
        
        // 返回取消监听的函数
        return () => off(moduleName, callback);
    }

    /**
     * 取消监听
     */
    function off(moduleName, callback) {
        if (!_listeners[moduleName]) return;
        const index = _listeners[moduleName].indexOf(callback);
        if (index > -1) {
            _listeners[moduleName].splice(index, 1);
        }
    }

    /**
     * 触发监听器
     */
    function _notifyListeners(moduleName, data) {
        if (_listeners[moduleName]) {
            for (const callback of _listeners[moduleName]) {
                try {
                    callback(data, moduleName);
                } catch (e) {
                    console.error(`Listener error for ${moduleName}:`, e);
                }
            }
        }
        // 全局监听器
        if (_listeners['*']) {
            for (const callback of _listeners['*']) {
                try {
                    callback(data, moduleName);
                } catch (e) {
                    console.error('Global listener error:', e);
                }
            }
        }
    }

    // ============================================================
    // 9. 存储信息
    // ============================================================

    /**
     * 获取存储使用情况
     */
    function getStorageInfo() {
        let totalSize = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            totalSize += (key.length + value.length) * 2; // UTF-16
        }
        
        return {
            totalSize: totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            itemsCount: localStorage.length,
            mainDataSize: localStorage.getItem(STORAGE_KEY) 
                ? (localStorage.getItem(STORAGE_KEY).length * 2 / 1024).toFixed(2) + ' KB'
                : '0 KB',
        };
    }

    /**
     * 检查localStorage是否可用
     */
    function isAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    // ============================================================
    // 10. 云端同步模式
    // ============================================================

    /**
     * 检查是否启用了云端模式
     */
    function isCloudMode() {
        return _cloudMode;
    }

    /**
     * 切换到云端模式
     * 需要用户已登录
     * @returns {boolean} 是否成功切换
     */
    function switchToCloud() {
        if (typeof CloudSync === 'undefined') {
            console.warn('[AppStorage] CloudSync 模块未加载，无法切换到云端模式');
            return false;
        }

        if (!CloudSync.isConfigured()) {
            console.warn('[AppStorage] Supabase 未配置，无法切换到云端模式');
            return false;
        }

        _cloudMode = true;
        localStorage.setItem(CLOUD_MODE_KEY, 'true');

        // 初始化云端同步
        if (!_cloudInitialized) {
            _initCloudSync();
        }

        // 如果已登录，立即同步
        if (CloudSync.isLoggedIn() && _data) {
            _triggerDebounceSync();
        }

        _notifyListeners('cloud_mode_change', { cloudMode: true });
        return true;
    }

    /**
     * 切换到本地模式
     * @param {boolean} keepCloudData - 是否保留云端数据（默认保留）
     */
    function switchToLocal(keepCloudData = true) {
        _cloudMode = false;
        localStorage.setItem(CLOUD_MODE_KEY, 'false');

        // 清除防抖定时器
        if (_syncDebounceTimer) {
            clearTimeout(_syncDebounceTimer);
            _syncDebounceTimer = null;
        }

        _notifyListeners('cloud_mode_change', { cloudMode: false });
        return true;
    }

    /**
     * 手动触发一次同步
     * @returns {Promise<object>} 同步结果
     */
    async function syncNow() {
        if (!_cloudMode || !_cloudInitialized) {
            return { success: false, reason: '云端模式未启用' };
        }

        if (typeof CloudSync === 'undefined' || !CloudSync.isLoggedIn()) {
            return { success: false, reason: '未登录' };
        }

        try {
            const localUpdatedAt = _data?.lastUpdated || 0;
            const result = await CloudSync.sync(_data, localUpdatedAt);

            if (result.action === 'pull' && result.data) {
                _mergeCloudData(result.data);
            }

            return { success: true, ...result };
        } catch (e) {
            console.error('[AppStorage] 手动同步失败:', e);
            return { success: false, error: e.message };
        }
    }

    /**
     * 获取同步状态
     */
    function getSyncStatus() {
        if (!_cloudMode) {
            return { enabled: false, status: 'local' };
        }

        if (typeof CloudSync === 'undefined') {
            return { enabled: true, status: 'unavailable' };
        }

        return {
            enabled: true,
            status: CloudSync.getSyncStatus(),
            lastSyncTime: CloudSync.getLastSyncTime(),
            lastError: CloudSync.getLastError(),
            isLoggedIn: CloudSync.isLoggedIn(),
            user: CloudSync.getUser(),
        };
    }

    /**
     * 立即上传数据到云端
     */
    async function pushToCloud() {
        if (!_cloudMode || !_cloudInitialized) return false;
        if (typeof CloudSync === 'undefined') return false;
        if (!CloudSync.isLoggedIn()) return false;

        try {
            await CloudSync.pushToCloud(_data);
            return true;
        } catch (e) {
            console.error('[AppStorage] 上传失败:', e);
            return false;
        }
    }

    /**
     * 从云端拉取数据
     */
    async function pullFromCloud() {
        if (!_cloudMode || !_cloudInitialized) return null;
        if (typeof CloudSync === 'undefined') return null;
        if (!CloudSync.isLoggedIn()) return null;

        try {
            const result = await CloudSync.pullFromCloud();
            if (result && result.data) {
                _mergeCloudData(result.data);
                return result.data;
            }
            return null;
        } catch (e) {
            console.error('[AppStorage] 拉取失败:', e);
            return null;
        }
    }

    // ============================================================
    // 11. 导出
    // ============================================================
    return {
        // 初始化和基础操作
        init,
        save,
        getAll,
        reset,
        isInitialized,
        
        // 模块级操作
        getModule,
        setModule,
        updateModule,
        
        // 列表增删改查
        addItem,
        updateItem,
        deleteItem,
        getItemById,
        
        // 日期记录操作
        getRecordByDate,
        setRecordByDate,
        updateRecordByDate,
        deleteRecordByDate,
        getRecordsInRange,
        
        // 用户和设置
        getSettings,
        updateSettings,
        getUser,
        updateUser,
        
        // 徽章系统
        getEarnedBadges,
        awardBadge,
        hasBadge,
        
        // 备份和导出
        createBackup,
        getBackups,
        restoreFromBackup,
        deleteBackup,
        exportData,
        exportDataToFile,
        importDataFromFile,
        
        // 事件监听
        on,
        off,
        
        // 工具
        getStorageInfo,
        isAvailable,

        // 云端同步模式
        isCloudMode,
        switchToCloud,
        switchToLocal,
        syncNow,
        getSyncStatus,
        pushToCloud,
        pullFromCloud,
    };
})();

// 如果在模块化环境中使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppStorage;
}
