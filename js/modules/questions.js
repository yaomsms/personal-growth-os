/**
 * questions.js - 通用问题收纳栏模块
 * 功能分区：
 *   1. 问题列表（遇到的问题、尝试的办法、最终方案）
 *   2. 按分类筛选（学习/软件/减脂/生活/健康/工作）
 *   3. 按状态筛选（待解决/解决中/已解决）
 *   4. 搜索功能
 *   5. 已解决问题归档
 */

const QuestionsModule = (function() {
    'use strict';

    // ============================================================
    // 1. 数据结构与默认值
    // ============================================================
    const STORAGE_KEY = 'questions';

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

    // 问题分类
    const CATEGORIES = [
        { id: 'study', name: '学习', icon: '📚', color: '#7ec8a7' },
        { id: 'software', name: '软件', icon: '💻', color: '#a8c9e8' },
        { id: 'diet', name: '减脂', icon: '🥗', color: '#f4b8c4' },
        { id: 'life', name: '生活', icon: '🏠', color: '#f5c89a' },
        { id: 'health', name: '健康', icon: '💊', color: '#8bc9a8' },
        { id: 'work', name: '工作', icon: '💼', color: '#c9b8e0' },
        { id: 'other', name: '其他', icon: '❓', color: '#f0c987' },
    ];

    // 状态配置
    const STATUS_OPTIONS = [
        { value: 'pending', label: '待解决', color: '#e8a0a0', icon: '🔴' },
        { value: 'researching', label: '解决中', color: '#f5c89a', icon: '🟡' },
        { value: 'solved', label: '已解决', color: '#7ec8a7', icon: '🟢' },
    ];

    // ============================================================
    // 2. 状态管理
    // ============================================================
    let data = null;
    let containerEl = null;
    let currentCategory = 'all';
    let currentStatus = 'all';
    let searchKeyword = '';
    let showArchived = false;

    // ============================================================
    // 3. 初始化
    // ============================================================
    function init() {
        _loadData();
    }

    function _loadData() {
        const stored = AppStorage.getModule(STORAGE_KEY);
        if (stored && Array.isArray(stored.questions)) {
            data = stored;
        } else {
            data = {
                questions: [],
                archived: [],
                categories: CATEGORIES.map(c => ({ ...c })),
            };
            AppStorage.setModule(STORAGE_KEY, data);
        }
        _updateStats();
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

    function _getCategoryById(id) {
        return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
    }

    function _getStatusInfo(value) {
        return STATUS_OPTIONS.find(s => s.value === value) || STATUS_OPTIONS[0];
    }

    function _formatDate(timestamp) {
        if (!timestamp) return '';
        const d = new Date(timestamp);
        return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    }

    function _updateStats() {
        // 统计数据可在需要时计算
    }

    // ============================================================
    // 5. 过滤与搜索
    // ============================================================

    function _getFilteredQuestions() {
        let list = data.questions || [];

        // 分类筛选
        if (currentCategory !== 'all') {
            list = list.filter(q => q.category === currentCategory);
        }

        // 状态筛选
        if (currentStatus !== 'all') {
            list = list.filter(q => q.status === currentStatus);
        }

        // 关键词搜索
        if (searchKeyword.trim()) {
            const kw = searchKeyword.toLowerCase().trim();
            list = list.filter(q =>
                (q.title && q.title.toLowerCase().includes(kw)) ||
                (q.description && q.description.toLowerCase().includes(kw)) ||
                (q.finalSolution && q.finalSolution.toLowerCase().includes(kw)) ||
                (q.solutions && q.solutions.some(s => s.title && s.title.toLowerCase().includes(kw)))
            );
        }

        // 按创建时间倒序
        return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    function _getArchivedQuestions() {
        let list = data.archived || [];

        if (searchKeyword.trim()) {
            const kw = searchKeyword.toLowerCase().trim();
            list = list.filter(q =>
                (q.title && q.title.toLowerCase().includes(kw)) ||
                (q.description && q.description.toLowerCase().includes(kw))
            );
        }

        return list.sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
    }

    // ============================================================
    // 6. 渲染入口
    // ============================================================

    function render(container) {
        containerEl = container;
        if (!data) _loadData();

        container.innerHTML = `
            <div class="questions-module">
                <!-- 统计概览 -->
                <div class="section-title">
                    <h2><span class="title-icon">❓</span>问题收纳</h2>
                    <span class="section-action" data-action="add-question">+ 新增问题</span>
                </div>
                <div class="questions-stats" id="questionsStats"></div>

                <!-- 搜索栏 -->
                <div class="search-bar">
                    <input type="text" class="form-input search-input" id="questionSearch" placeholder="🔍 搜索问题标题、描述、解决方案...">
                </div>

                <!-- 筛选标签 -->
                <div class="filter-row">
                    <div class="filter-chips" id="categoryFilter">
                        <button class="filter-chip ${currentCategory === 'all' ? 'active' : ''}" data-category="all">全部分类</button>
                        ${CATEGORIES.map(cat => `
                            <button class="filter-chip ${currentCategory === cat.id ? 'active' : ''}" 
                                    data-category="${cat.id}"
                                    style="${currentCategory === cat.id ? `border-color: ${cat.color}; background: ${cat.color}20; color: ${cat.color};` : ''}">
                                ${cat.icon} ${cat.name}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- 状态筛选 -->
                <div class="filter-row">
                    <div class="filter-chips" id="statusFilter">
                        <button class="status-chip ${currentStatus === 'all' ? 'active' : ''}" data-status="all">全部</button>
                        ${STATUS_OPTIONS.map(s => `
                            <button class="status-chip ${currentStatus === s.value ? 'active' : ''}" 
                                    data-status="${s.value}"
                                    style="${currentStatus === s.value ? `border-color: ${s.color}; background: ${s.color}20; color: ${s.color};` : ''}">
                                ${s.icon} ${s.label}
                            </button>
                        `).join('')}
                        <button class="status-chip ${showArchived ? 'active' : ''}" data-status="archived"
                                style="${showArchived ? 'border-color: #999; background: #99999920; color: #666;' : ''}">
                            📦 已归档
                        </button>
                    </div>
                </div>

                <!-- 问题列表 -->
                <div class="questions-list" id="questionsList"></div>
            </div>
        `;

        _renderStats();
        _renderQuestions();
        _bindEvents();
    }

    // ============================================================
    // 7. 统计概览
    // ============================================================

    function _renderStats() {
        const statsEl = containerEl.querySelector('#questionsStats');
        if (!statsEl) return;

        const list = data.questions || [];
        const pending = list.filter(q => q.status === 'pending').length;
        const researching = list.filter(q => q.status === 'researching').length;
        const solved = list.filter(q => q.status === 'solved').length;
        const archived = (data.archived || []).length;
        const total = list.length;

        statsEl.innerHTML = `
            <div class="stat-mini-card" style="border-left: 4px solid #e8a0a0;">
                <div class="stat-mini-value">${pending}</div>
                <div class="stat-mini-label">待解决</div>
            </div>
            <div class="stat-mini-card" style="border-left: 4px solid #f5c89a;">
                <div class="stat-mini-value">${researching}</div>
                <div class="stat-mini-label">解决中</div>
            </div>
            <div class="stat-mini-card" style="border-left: 4px solid #7ec8a7;">
                <div class="stat-mini-value">${solved}</div>
                <div class="stat-mini-label">已解决</div>
            </div>
            <div class="stat-mini-card" style="border-left: 4px solid #c9b8e0;">
                <div class="stat-mini-value">${archived}</div>
                <div class="stat-mini-label">已归档</div>
            </div>
            <div class="stat-mini-card" style="border-left: 4px solid #a8c9e8;">
                <div class="stat-mini-value">${total}</div>
                <div class="stat-mini-label">总计</div>
            </div>
        `;
    }

    // ============================================================
    // 8. 问题列表渲染
    // ============================================================

    function _renderQuestions() {
        const listEl = containerEl.querySelector('#questionsList');
        if (!listEl) return;

        if (showArchived) {
            _renderArchivedList(listEl);
            return;
        }

        const questions = _getFilteredQuestions();

        if (questions.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❓</div>
                    <div class="empty-state-text">暂无问题记录</div>
                    <div class="empty-state-desc">点击右上角"新增问题"开始记录</div>
                </div>
            `;
            return;
        }

        listEl.innerHTML = questions.map(q => _renderQuestionCard(q)).join('');
    }

    function _renderQuestionCard(q) {
        const cat = _getCategoryById(q.category);
        const status = _getStatusInfo(q.status);
        const solutions = q.solutions || [];
        const triedCount = solutions.filter(s => s.tried).length;

        return `
            <div class="card question-card" data-question-id="${q.id}">
                <div class="question-card-header">
                    <div class="question-category" style="background: ${cat.color}20; color: ${cat.color};">
                        ${cat.icon} ${cat.name}
                    </div>
                    <div class="question-status" style="background: ${status.color}20; color: ${status.color};">
                        ${status.icon} ${status.label}
                    </div>
                </div>
                <h3 class="question-title">${_esc(q.title)}</h3>
                ${q.description ? `
                    <p class="question-desc">${_esc(q.description.length > 100 ? q.description.substring(0, 100) + '...' : q.description)}</p>
                ` : ''}
                
                ${solutions.length > 0 ? `
                    <div class="question-solutions-preview">
                        <div class="solutions-label">💡 尝试方案 (${triedCount}/${solutions.length})</div>
                        <div class="solutions-tags">
                            ${solutions.slice(0, 3).map(s => `
                                <span class="solution-tag ${s.tried ? 'tried' : ''} ${s.effective ? 'effective' : ''}">
                                    ${s.effective ? '✅' : s.tried ? '🔄' : '📝'} ${_esc(s.title)}
                                </span>
                            `).join('')}
                            ${solutions.length > 3 ? `<span class="solution-tag more">+${solutions.length - 3}</span>` : ''}
                        </div>
                    </div>
                ` : ''}

                ${q.finalSolution ? `
                    <div class="question-final-solution">
                        <div class="final-label">🎯 最终方案</div>
                        <div class="final-content">${_esc(q.finalSolution)}</div>
                    </div>
                ` : ''}

                <div class="question-card-footer">
                    <span class="question-date">📅 ${_formatDate(q.createdAt)}</span>
                    <div class="question-actions">
                        <button class="btn-icon btn-sm" data-action="edit-question" data-id="${q.id}" title="编辑">✏️</button>
                        ${q.status === 'solved' ? `
                            <button class="btn-icon btn-sm" data-action="archive-question" data-id="${q.id}" title="归档">📦</button>
                        ` : ''}
                        <button class="btn-icon btn-sm" data-action="delete-question" data-id="${q.id}" title="删除">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }

    function _renderArchivedList(listEl) {
        const archived = _getArchivedQuestions();

        if (archived.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <div class="empty-state-text">归档区为空</div>
                    <div class="empty-state-desc">已解决的问题可以归档到这里</div>
                </div>
            `;
            return;
        }

        listEl.innerHTML = `
            <div class="archived-header">📦 已归档问题（${archived.length}个）</div>
            ${archived.map(q => {
                const cat = _getCategoryById(q.category);
                return `
                    <div class="card archived-card" data-question-id="${q.id}">
                        <div class="archived-content">
                            <div class="archived-cat" style="color: ${cat.color};">${cat.icon}</div>
                            <div class="archived-title">${_esc(q.title)}</div>
                            <div class="archived-date">归档于 ${_formatDate(q.archivedAt)}</div>
                        </div>
                        <div class="archived-actions">
                            <button class="btn-icon btn-sm" data-action="unarchive-question" data-id="${q.id}" title="恢复">↩️</button>
                            <button class="btn-icon btn-sm" data-action="delete-archived" data-id="${q.id}" title="删除">🗑️</button>
                        </div>
                    </div>
                `;
            }).join('')}
        `;
    }

    // ============================================================
    // 9. 新增/编辑问题模态框
    // ============================================================

    function _openQuestionModal(question = null) {
        const isEdit = !!question;
        const solutions = question?.solutions ? [...question.solutions] : [];

        const html = `
            <div class="form-group">
                <label class="form-label">问题标题 <span style="color: #e8a0a0;">*</span></label>
                <input type="text" class="form-input" id="qTitle" value="${_esc(question?.title || '')}" placeholder="例如：PR导出视频画质模糊">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">分类</label>
                    <select class="form-select" id="qCategory">
                        ${CATEGORIES.map(cat => `
                            <option value="${cat.id}" ${question?.category === cat.id ? 'selected' : ''}>${cat.icon} ${cat.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">状态</label>
                    <select class="form-select" id="qStatus">
                        ${STATUS_OPTIONS.map(s => `
                            <option value="${s.value}" ${question?.status === s.value ? 'selected' : ''}>${s.icon} ${s.label}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">问题描述</label>
                <textarea class="form-textarea" id="qDescription" rows="3" placeholder="详细描述遇到的问题...">${_esc(question?.description || '')}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">尝试的解决办法</label>
                <div class="solutions-editor" id="solutionsEditor">
                    ${solutions.map((s, idx) => _renderSolutionEditorItem(s, idx)).join('')}
                </div>
                <button class="btn btn-outline btn-sm btn-block" id="addSolutionBtn">+ 添加尝试方案</button>
            </div>
            <div class="form-group">
                <label class="form-label">最终有效解决方案</label>
                <textarea class="form-textarea" id="qFinalSolution" rows="3" placeholder="如果已经解决，记录最终有效的方案...">${_esc(question?.finalSolution || '')}</textarea>
            </div>
            <div class="mt-lg">
                <button class="btn btn-primary btn-block" id="saveQuestionBtn">${isEdit ? '保存修改' : '添加问题'}</button>
            </div>
        `;

        App.openModal(isEdit ? '编辑问题' : '新增问题', html, {
            onOpen: () => {
                let solutionList = solutions.map(s => ({ ...s }));

                // 渲染解决方案列表
                function renderSolutions() {
                    const editor = document.getElementById('solutionsEditor');
                    if (editor) {
                        editor.innerHTML = solutionList.map((s, idx) => _renderSolutionEditorItem(s, idx)).join('');
                        bindSolutionEvents();
                    }
                }

                function bindSolutionEvents() {
                    // 删除方案
                    document.querySelectorAll('[data-sol-action="remove"]').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const idx = parseInt(btn.dataset.idx);
                            solutionList.splice(idx, 1);
                            renderSolutions();
                        });
                    });

                    // 切换已尝试
                    document.querySelectorAll('[data-sol-action="toggle-tried"]').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const idx = parseInt(btn.dataset.idx);
                            solutionList[idx].tried = !solutionList[idx].tried;
                            if (!solutionList[idx].tried) {
                                solutionList[idx].effective = false;
                            }
                            renderSolutions();
                        });
                    });

                    // 切换有效
                    document.querySelectorAll('[data-sol-action="toggle-effective"]').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const idx = parseInt(btn.dataset.idx);
                            if (solutionList[idx].tried) {
                                solutionList[idx].effective = !solutionList[idx].effective;
                                renderSolutions();
                            }
                        });
                    });

                    // 标题输入
                    document.querySelectorAll('.solution-title-input').forEach(input => {
                        input.addEventListener('input', () => {
                            const idx = parseInt(input.dataset.idx);
                            solutionList[idx].title = input.value;
                        });
                    });

                    // 内容输入
                    document.querySelectorAll('.solution-content-input').forEach(input => {
                        input.addEventListener('input', () => {
                            const idx = parseInt(input.dataset.idx);
                            solutionList[idx].content = input.value;
                        });
                    });
                }

                // 添加方案
                document.getElementById('addSolutionBtn')?.addEventListener('click', () => {
                    solutionList.push({
                        id: _genId('sol'),
                        title: '',
                        content: '',
                        tried: false,
                        effective: false,
                    });
                    renderSolutions();
                });

                // 初始化绑定
                bindSolutionEvents();

                // 保存
                document.getElementById('saveQuestionBtn')?.addEventListener('click', () => {
                    const title = document.getElementById('qTitle').value.trim();
                    if (!title) {
                        App.showError('请输入问题标题');
                        return;
                    }

                    const qData = {
                        title,
                        category: document.getElementById('qCategory').value,
                        status: document.getElementById('qStatus').value,
                        description: document.getElementById('qDescription').value.trim(),
                        finalSolution: document.getElementById('qFinalSolution').value.trim(),
                        solutions: solutionList.filter(s => s.title.trim().length > 0),
                    };

                    if (isEdit) {
                        const idx = data.questions.findIndex(q => q.id === question.id);
                        if (idx > -1) {
                            data.questions[idx] = { ...data.questions[idx], ...qData, updatedAt: Date.now() };
                        }
                        App.showSuccess('问题已更新');
                    } else {
                        qData.id = _genId('q');
                        qData.createdAt = Date.now();
                        data.questions.push(qData);
                        App.showSuccess('问题已添加');
                    }

                    _saveData();
                    _renderStats();
                    _renderQuestions();
                    App.closeModal();
                });
            }
        });
    }

    function _renderSolutionEditorItem(sol, idx) {
        return `
            <div class="solution-editor-item">
                <div class="solution-editor-header">
                    <button class="btn-icon btn-xs" data-sol-action="toggle-tried" data-idx="${idx}" title="标记已尝试">
                        ${sol.tried ? '✅' : '⬜'}
                    </button>
                    <input type="text" class="form-input form-input-sm solution-title-input" 
                           data-idx="${idx}" value="${_esc(sol.title || '')}" 
                           placeholder="方案名称">
                    <button class="btn-icon btn-xs" data-sol-action="toggle-effective" data-idx="${idx}" 
                            title="${sol.tried ? '标记有效' : '请先标记已尝试'}"
                            style="opacity: ${sol.tried ? 1 : 0.4};">
                        ${sol.effective ? '⭐' : '☆'}
                    </button>
                    <button class="btn-icon btn-xs" data-sol-action="remove" data-idx="${idx}" title="删除">🗑️</button>
                </div>
                ${sol.tried ? `
                    <textarea class="form-textarea form-textarea-sm solution-content-input" 
                              data-idx="${idx}" 
                              placeholder="方案详情/效果...">${_esc(sol.content || '')}</textarea>
                ` : ''}
            </div>
        `;
    }

    // ============================================================
    // 10. 删除与归档
    // ============================================================

    async function _deleteQuestion(id) {
        const confirmed = await App.confirmModal('确认删除', '确定要删除这个问题吗？删除后无法恢复。', {
            confirmText: '删除',
            cancelText: '取消',
        });
        if (confirmed) {
            data.questions = data.questions.filter(q => q.id !== id);
            _saveData();
            _renderStats();
            _renderQuestions();
            App.showSuccess('已删除');
        }
    }

    async function _deleteArchived(id) {
        const confirmed = await App.confirmModal('确认删除', '确定要从归档中删除这个问题吗？', {
            confirmText: '删除',
            cancelText: '取消',
        });
        if (confirmed) {
            data.archived = (data.archived || []).filter(q => q.id !== id);
            _saveData();
            _renderStats();
            _renderQuestions();
            App.showSuccess('已删除');
        }
    }

    async function _archiveQuestion(id) {
        const confirmed = await App.confirmModal('确认归档', '将这个已解决问题移动到归档区？', {
            confirmText: '归档',
            cancelText: '取消',
        });
        if (confirmed) {
            const idx = data.questions.findIndex(q => q.id === id);
            if (idx > -1) {
                const q = data.questions[idx];
                q.archivedAt = Date.now();
                if (!data.archived) data.archived = [];
                data.archived.push(q);
                data.questions.splice(idx, 1);
                _saveData();
                _renderStats();
                _renderQuestions();
                App.showSuccess('已归档');
            }
        }
    }

    function _unarchiveQuestion(id) {
        const idx = (data.archived || []).findIndex(q => q.id === id);
        if (idx > -1) {
            const q = data.archived[idx];
            delete q.archivedAt;
            data.questions.push(q);
            data.archived.splice(idx, 1);
            _saveData();
            _renderStats();
            _renderQuestions();
            App.showSuccess('已恢复');
        }
    }

    // ============================================================
    // 11. 事件绑定
    // ============================================================

    function _bindEvents() {
        if (!containerEl) return;

        // 新增问题
        containerEl.querySelector('[data-action="add-question"]')?.addEventListener('click', () => {
            _openQuestionModal();
        });

        // 搜索
        const searchInput = containerEl.querySelector('#questionSearch');
        let searchTimer = null;
        searchInput?.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                searchKeyword = searchInput.value;
                _renderQuestions();
            }, 300);
        });

        // 分类筛选
        containerEl.querySelectorAll('#categoryFilter .filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                currentCategory = chip.dataset.category;
                showArchived = false;
                currentStatus = 'all';
                render(containerEl);
            });
        });

        // 状态筛选
        containerEl.querySelectorAll('#statusFilter .status-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const status = chip.dataset.status;
                if (status === 'archived') {
                    showArchived = true;
                } else {
                    showArchived = false;
                    currentStatus = status;
                }
                render(containerEl);
            });
        });

        // 编辑问题
        containerEl.querySelectorAll('[data-action="edit-question"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const q = data.questions.find(q => q.id === id);
                if (q) _openQuestionModal(q);
            });
        });

        // 删除问题
        containerEl.querySelectorAll('[data-action="delete-question"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _deleteQuestion(btn.dataset.id);
            });
        });

        // 归档问题
        containerEl.querySelectorAll('[data-action="archive-question"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _archiveQuestion(btn.dataset.id);
            });
        });

        // 恢复归档
        containerEl.querySelectorAll('[data-action="unarchive-question"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _unarchiveQuestion(btn.dataset.id);
            });
        });

        // 删除归档
        containerEl.querySelectorAll('[data-action="delete-archived"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                _deleteArchived(btn.dataset.id);
            });
        });

        // 问题卡片点击编辑
        containerEl.querySelectorAll('.question-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.questionId;
                const q = data.questions.find(q => q.id === id);
                if (q) _openQuestionModal(q);
            });
        });
    }

    // ============================================================
    // 12. onAdd - 顶部添加按钮回调
    // ============================================================
    function onAdd() {
        _openQuestionModal();
    }

    // ============================================================
    // 13. onResume - 页面恢复时刷新
    // ============================================================
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
    App.registerModule('questions', QuestionsModule);
}
