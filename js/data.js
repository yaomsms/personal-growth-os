/**
 * data.js - 默认数据和数据结构定义
 * 包含导航菜单配置、各模块默认数据结构、初始数据和徽章定义
 * 共18个模块：首页仪表盘、目标习惯、英语学习、PR剪辑、AI创作、平板绘画、
 * 财务存钱、健康管理、减脂饮食、待办清单、考勤打卡、情绪日记、
 * 问题收纳、补学计划、数据分析、每周复盘、时间规划、快捷工具
 */

const AppData = (function() {
    'use strict';

    // ============================================================
    // 1. 导航菜单配置（18个模块）
    // ============================================================
    const NAV_ITEMS = [
        // 首页总览
        { id: 'dashboard', label: '首页待办', icon: '🏠', category: 'home' },

        // 成长学习（4个）
        { id: 'english', label: '英语学习', icon: '📚', category: 'growth' },
        { id: 'pr', label: 'PR视频剪辑', icon: '🎬', category: 'growth' },
        { id: 'ai', label: 'AI视频创作', icon: '🤖', category: 'growth' },
        { id: 'drawing', label: '平板绘画', icon: '🎨', category: 'growth' },

        // 生活管理（3个）
        { id: 'attendance', label: '考勤打卡', icon: '🕐', category: 'life' },
        { id: 'mood', label: '情绪日记', icon: '💭', category: 'life' },
        { id: 'schedule', label: '时间规划', icon: '⏰', category: 'life' },

        // 自我提升（2个）
        { id: 'questions', label: '问题收纳', icon: '❓', category: 'improve' },
        { id: 'makeup', label: '补学计划', icon: '🔄', category: 'improve' },

        // 数据复盘（2个）
        { id: 'analytics', label: '数据分析', icon: '📊', category: 'review' },
        { id: 'review', label: '每周复盘', icon: '📝', category: 'review' },

        // 工具箱（1个）
        { id: 'tools', label: '快捷工具', icon: '🔧', category: 'tools' },
    ];

    // 导航分类
    const NAV_CATEGORIES = {
        home: { label: '首页总览', order: 1 },
        growth: { label: '成长学习', order: 2 },
        life: { label: '生活管理', order: 3 },
        improve: { label: '自我提升', order: 4 },
        review: { label: '数据复盘', order: 5 },
        tools: { label: '工具箱', order: 6 },
    };

    // ============================================================
    // 2. 各模块默认数据结构
    // ============================================================

    // --- 模块1：目标与习惯追踪 (habits) ---
    // 包含：年度目标、月度目标、每日习惯矩阵、成就徽章
    const DEFAULT_HABITS = {
        // 年度目标
        yearlyGoals: [
            { id: 'yg1', title: '全年存款目标', description: '存款达到XX元', target: 50000, current: 0, unit: '元', category: 'finance', status: 'active', deadline: '2025-12-31', createdAt: Date.now() },
            { id: 'yg2', title: '英语能力提升', description: '词汇量达到8000+', target: 8000, current: 4000, unit: '词', category: 'english', status: 'active', deadline: '2025-12-31', createdAt: Date.now() },
            { id: 'yg3', title: '体重管理', description: '减脂到目标体重', target: 55, current: 62, unit: 'kg', category: 'health', status: 'active', deadline: '2025-12-31', createdAt: Date.now() },
            { id: 'yg4', title: '技能成长', description: '掌握PR剪辑和AI视频创作', target: 100, current: 0, unit: '%', category: 'skill', status: 'active', deadline: '2025-12-31', createdAt: Date.now() },
        ],

        // 月度目标
        monthlyGoals: [
            { id: 'mg1', title: '本月阅读3本书', description: '每月至少阅读3本书', target: 3, current: 0, unit: '本', year: 2025, month: 1, status: 'active', createdAt: Date.now() },
            { id: 'mg2', title: '运动20天', description: '本月运动至少20天', target: 20, current: 0, unit: '天', year: 2025, month: 1, status: 'active', createdAt: Date.now() },
        ],

        // 每日习惯矩阵
        dailyHabits: [
            { id: 'dh1', name: '早起(7:00前)', icon: '🌅', category: '作息', frequency: 'daily', streak: 0, longestStreak: 0, color: '#FF6B6B', createdAt: Date.now() },
            { id: 'dh2', name: '喝够8杯水', icon: '💧', category: '健康', frequency: 'daily', streak: 0, longestStreak: 0, color: '#4ECDC4', createdAt: Date.now() },
            { id: 'dh3', name: '英语学习', icon: '📚', category: '学习', frequency: 'daily', streak: 0, longestStreak: 0, color: '#45B7D1', createdAt: Date.now() },
            { id: 'dh4', name: '运动30分钟', icon: '🏃', category: '健康', frequency: 'daily', streak: 0, longestStreak: 0, color: '#96CEB4', createdAt: Date.now() },
            { id: 'dh5', name: '冥想/复盘', icon: '🧘', category: '心灵', frequency: 'daily', streak: 0, longestStreak: 0, color: '#DDA0DD', createdAt: Date.now() },
            { id: 'dh6', name: '不喝奶茶', icon: '🧋', category: '饮食', frequency: 'daily', streak: 0, longestStreak: 0, color: '#F4A460', createdAt: Date.now() },
            { id: 'dh7', name: '11点前睡觉', icon: '🌙', category: '作息', frequency: 'daily', streak: 0, longestStreak: 0, color: '#6C5CE7', createdAt: Date.now() },
            { id: 'dh8', name: '阅读30分钟', icon: '📖', category: '学习', frequency: 'daily', streak: 0, longestStreak: 0, color: '#E17055', createdAt: Date.now() },
        ],

        // 习惯打卡记录（按日期存储）
        // 格式: { '2025-01-01': { dh1: true, dh2: false, ... } }
        habitRecords: {},

        // 习惯分类
        habitCategories: [
            { id: 'hc1', name: '作息', icon: '🌅', color: '#FF6B6B' },
            { id: 'hc2', name: '健康', icon: '💪', color: '#4ECDC4' },
            { id: 'hc3', name: '学习', icon: '📚', color: '#45B7D1' },
            { id: 'hc4', name: '饮食', icon: '🥗', color: '#96CEB4' },
            { id: 'hc5', name: '心灵', icon: '💖', color: '#DDA0DD' },
        ],
    };

    // --- 模块2：英语学习模块 (english) ---
    // 包含：不背单词同步数据、B站视频区、网盘素材区、当日手写记录
    const DEFAULT_ENGLISH = {
        // 不背单词同步数据
        bdcWords: {
            totalWords: 0,           // 累计学习单词数
            masteredWords: 0,        // 已掌握单词数
            reviewWords: 0,          // 待复习单词数
            dailyGoal: 20,           // 每日目标单词数
            streak: 0,               // 连续打卡天数
            lastSyncDate: null,      // 上次同步日期
            wordBook: '考研词汇',    // 当前词书
            // 单词列表
            words: [
                { id: 'ew1', word: 'perseverance', phonetic: '/ˌpɜːrsɪˈvɪrəns/', meaning: 'n. 毅力；坚持不懈', example: 'Success requires perseverance and hard work.', mastered: false, reviewCount: 0, nextReview: null, createdAt: Date.now() },
                { id: 'ew2', word: 'procrastinate', phonetic: '/prəˈkræstɪneɪt/', meaning: 'v. 拖延；耽搁', example: "Don't procrastinate on important tasks.", mastered: false, reviewCount: 0, nextReview: null, createdAt: Date.now() },
                { id: 'ew3', word: 'resilient', phonetic: '/rɪˈzɪliənt/', meaning: 'adj. 有弹性的；能迅速恢复的', example: 'Children are often more resilient than adults.', mastered: false, reviewCount: 0, nextReview: null, createdAt: Date.now() },
                { id: 'ew4', word: 'meticulous', phonetic: '/məˈtɪkjələs/', meaning: 'adj. 一丝不苟的；细致的', example: 'She is meticulous about her work.', mastered: false, reviewCount: 0, nextReview: null, createdAt: Date.now() },
                { id: 'ew5', word: 'ephemeral', phonetic: '/ɪˈfemərəl/', meaning: 'adj. 短暂的；瞬息的', example: 'Fame can be ephemeral.', mastered: false, reviewCount: 0, nextReview: null, createdAt: Date.now() },
            ],
            // 学习记录
            studyRecords: {}, // { '2025-01-01': { wordsLearned: 20, wordsReviewed: 50, minutes: 45 } }
        },

        // B站视频区
        biliVideos: {
            collections: [
                { id: 'bv1', name: '英语口语教程', author: 'up主A', url: '', progress: 0, totalVideos: 30, watched: 0, status: 'watching', createdAt: Date.now() },
                { id: 'bv2', name: '英语语法精讲', author: 'up主B', url: '', progress: 0, totalVideos: 20, watched: 0, status: 'not_started', createdAt: Date.now() },
                { id: 'bv3', name: '美剧学英语', author: 'up主C', url: '', progress: 0, totalVideos: 50, watched: 0, status: 'not_started', createdAt: Date.now() },
            ],
            notes: [], // 视频笔记
        },

        // 网盘素材区
        cloudMaterials: {
            folders: [
                { id: 'em1', name: 'PDF电子书', count: 15, type: 'pdf', path: '/英语/电子书', updatedAt: Date.now() },
                { id: 'em2', name: '听力材料', count: 30, type: 'audio', path: '/英语/听力', updatedAt: Date.now() },
                { id: 'em3', name: '外刊精读', count: 20, type: 'pdf', path: '/英语/外刊', updatedAt: Date.now() },
                { id: 'em4', name: '词汇资料', count: 10, type: 'document', path: '/英语/词汇', updatedAt: Date.now() },
                { id: 'em5', name: '语法资料', count: 8, type: 'document', path: '/英语/语法', updatedAt: Date.now() },
            ],
        },

        // 当日手写记录
        dailyHandwriting: {
            records: {}, // { '2025-01-01': { content: '', imageUrl: '', minutes: 30 } }
            streak: 0,
            totalDays: 0,
        },
    };

    // --- 模块3：PR视频剪辑模块 (pr) ---
    // 包含：智能打卡（周一/三/五学习日）、网盘课程、当日记录
    const DEFAULT_PR = {
        // 智能打卡（周一/三/五学习日）
        smartCheckin: {
            studyDays: [1, 3, 5],    // 周一、周三、周五
            streak: 0,               // 连续学习周数
            totalWeeks: 0,           // 累计学习周数
            currentPhase: '基础',    // 当前学习阶段
            // 打卡记录
            checkinRecords: {}, // { '2025-01-01': { completed: true, duration: 90, content: '' } }
        },

        // 网盘课程
        cloudCourses: [
            { id: 'prc1', name: 'PR零基础入门到精通', platform: '网盘', totalLessons: 40, currentLesson: 0, progress: 0, status: 'not_started', path: '/PR/入门课程', createdAt: Date.now() },
            { id: 'prc2', name: '短视频剪辑实战', platform: '网盘', totalLessons: 25, currentLesson: 0, progress: 0, status: 'not_started', path: '/PR/短视频实战', createdAt: Date.now() },
            { id: 'prc3', name: '调色与特效进阶', platform: '网盘', totalLessons: 20, currentLesson: 0, progress: 0, status: 'not_started', path: '/PR/调色特效', createdAt: Date.now() },
        ],

        // 当日学习记录
        dailyRecord: {
            records: {}, // { '2025-01-01': { courseId: '', lesson: '', duration: 60, notes: '', screenshotUrl: '' } }
            totalMinutes: 0,
            completedProjects: 0,
        },

        // 作品/练习项目
        projects: [],
    };

    // --- 模块4：AI视频创作模块 (ai) ---
    // 包含：网盘素材、提示词记录、当日学习记录
    const DEFAULT_AI = {
        // 网盘素材
        cloudMaterials: {
            folders: [
                { id: 'ai1', name: 'AI视频教程', count: 20, type: 'video', path: '/AI/教程', updatedAt: Date.now() },
                { id: 'ai2', name: '提示词模板', count: 30, type: 'document', path: '/AI/提示词', updatedAt: Date.now() },
                { id: 'ai3', name: '素材参考', count: 50, type: 'image', path: '/AI/素材参考', updatedAt: Date.now() },
                { id: 'ai4', name: '生成作品', count: 10, type: 'video', path: '/AI/作品', updatedAt: Date.now() },
            ],
        },

        // 提示词记录
        prompts: [
            { id: 'aip1', title: '风景视频生成', category: '风景', content: '生成一段4K画质的山川湖泊风景视频，画面缓慢推进，阳光从云层中洒下', tool: 'Runway', quality: 5, usageCount: 0, favorite: false, createdAt: Date.now() },
            { id: 'aip2', title: '人物口播', category: '人物', content: '一个年轻女性在镜头前讲话，背景是简约的书房，光线柔和', tool: 'HeyGen', quality: 4, usageCount: 0, favorite: false, createdAt: Date.now() },
            { id: 'aip3', title: '产品展示动画', category: '商业', content: '科技产品360度旋转展示，背景渐变，粒子特效', tool: 'Pika', quality: 4, usageCount: 0, favorite: false, createdAt: Date.now() },
        ],
        promptCategories: ['风景', '人物', '商业', '动画', '特效', '其他'],

        // 当日学习记录
        dailyRecord: {
            records: {}, // { '2025-01-01': { tool: '', prompt: '', resultUrl: '', duration: 60, notes: '' } }
            totalVideos: 0,
            streak: 0,
        },

        // AI工具列表
        aiTools: [
            { id: 'ait1', name: 'Runway', category: '视频生成', url: '', usageCount: 0, lastUsed: null },
            { id: 'ait2', name: 'Pika', category: '视频生成', url: '', usageCount: 0, lastUsed: null },
            { id: 'ait3', name: 'HeyGen', category: '数字人', url: '', usageCount: 0, lastUsed: null },
            { id: 'ait4', name: 'Sora', category: '视频生成', url: '', usageCount: 0, lastUsed: null },
        ],
    };

    // --- 模块5：平板绘画模块 (drawing) ---
    // 包含：网盘图库、当日绘画记录
    const DEFAULT_DRAWING = {
        // 网盘图库
        cloudGallery: {
            albums: [
                { id: 'dga1', name: '线稿练习', count: 0, coverUrl: '', path: '/绘画/线稿', updatedAt: Date.now() },
                { id: 'dga2', name: '素描作品', count: 0, coverUrl: '', path: '/绘画/素描', updatedAt: Date.now() },
                { id: 'dga3', name: '水彩插画', count: 0, coverUrl: '', path: '/绘画/水彩', updatedAt: Date.now() },
                { id: 'dga4', name: '原创角色', count: 0, coverUrl: '', path: '/绘画/原创', updatedAt: Date.now() },
                { id: 'dga5', name: '临摹练习', count: 0, coverUrl: '', path: '/绘画/临摹', updatedAt: Date.now() },
                { id: 'dga6', name: '参考素材', count: 20, coverUrl: '', path: '/绘画/参考', updatedAt: Date.now() },
            ],
        },

        // 当日绘画记录
        dailyRecord: {
            records: {}, // { '2025-01-01': { title: '', type: '线稿', duration: 60, satisfaction: 4, imageUrl: '', notes: '' } }
            streak: 0,
            totalDrawings: 0,
            totalHours: 0,
        },

        // 绘画挑战/打卡
        challenges: [
            { id: 'dc1', name: '30天绘画挑战', type: 'daily', totalDays: 30, currentDay: 0, status: 'not_started', theme: '每日一绘', createdAt: Date.now() },
        ],

        // 绘画类型
        drawingTypes: ['线稿', '素描', '水彩', '数码绘画', '速写', '厚涂', '平涂'],
    };

    // --- 模块6：财务存钱管理 (finance) ---
    // 包含：存钱进度、月度预算、每日收支、奶茶零食统计、剁手冷静区、工资拆分
    const DEFAULT_FINANCE = {
        // 存钱进度
        savingsProgress: {
            yearlyTarget: 50000,          // 年度存款目标
            currentSavings: 0,            // 当前存款
            monthlySavingsTarget: 4000,   // 每月存款目标
            monthlySaved: 0,              // 本月已存
            savingStreak: 0,              // 连续存钱月数
            // 存款账户
            accounts: [
                { id: 'acc1', name: '主储蓄账户', balance: 0, type: 'savings', target: 50000, color: '#2ECC71' },
                { id: 'acc2', name: '应急基金', balance: 0, type: 'emergency', target: 20000, color: '#F39C12' },
                { id: 'acc3', name: '投资账户', balance: 0, type: 'investment', target: 10000, color: '#9B59B6' },
            ],
            // 存钱罐/心愿单
            wishlist: [
                { id: 'wish1', name: '旅行基金', target: 5000, current: 0, icon: '✈️', deadline: '2025-06-30' },
                { id: 'wish2', name: '新平板', target: 6000, current: 0, icon: '📱', deadline: '2025-12-31' },
            ],
        },

        // 月度预算
        monthlyBudget: {
            totalBudget: 8000,
            currentMonth: new Date().getMonth() + 1,
            currentYear: new Date().getFullYear(),
            categories: [
                { id: 'fbc1', name: '餐饮', icon: '🍜', budget: 2000, spent: 0, color: '#FF6B6B' },
                { id: 'fbc2', name: '交通', icon: '🚗', budget: 500, spent: 0, color: '#4ECDC4' },
                { id: 'fbc3', name: '购物', icon: '🛍️', budget: 1500, spent: 0, color: '#FFD93D' },
                { id: 'fbc4', name: '娱乐', icon: '🎮', budget: 800, spent: 0, color: '#9B59B6' },
                { id: 'fbc5', name: '住房', icon: '🏠', budget: 3000, spent: 0, color: '#3498DB' },
                { id: 'fbc6', name: '医疗', icon: '💊', budget: 300, spent: 0, color: '#2ECC71' },
                { id: 'fbc7', name: '学习', icon: '📚', budget: 500, spent: 0, color: '#E67E22' },
                { id: 'fbc8', name: '其他', icon: '📦', budget: 400, spent: 0, color: '#95A5A6' },
            ],
        },

        // 每日收支记录
        transactions: [],
        // 交易结构: { id, amount, type: 'income'|'expense', categoryId, categoryName, note, date, createdAt }

        // 奶茶零食统计
        snackStats: {
            milkTeaCount: 0,          // 本月奶茶杯数
            milkTeaBudget: 4,         // 每月奶茶限额（杯）
            snackCount: 0,            // 本月零食次数
            snackBudget: 200,         // 每月零食预算
            records: [],              // 奶茶零食记录
            // 结构: { id, type: 'milktea'|'snack', name, amount, date, note }
        },

        // 剁手冷静区
        impulseControlZone: [
            // { id, name, price, reason, addedDate, cooldownDays, status: 'waiting'|'purchased'|'cancelled' }
        ],

        // 工资拆分
        salarySplit: {
            monthlySalary: 12000,
            splits: [
                { id: 'ss1', name: '必要支出', percentage: 50, amount: 6000, color: '#E74C3C', includes: ['住房', '餐饮', '交通', '医疗'] },
                { id: 'ss2', name: '储蓄投资', percentage: 30, amount: 3600, color: '#2ECC71', includes: ['储蓄账户', '投资'] },
                { id: 'ss3', name: '个人发展', percentage: 10, amount: 1200, color: '#3498DB', includes: ['学习', '技能提升'] },
                { id: 'ss4', name: '休闲娱乐', percentage: 10, amount: 1200, color: '#9B59B6', includes: ['娱乐', '购物', '旅行'] },
            ],
        },

        // 收入分类
        incomeCategories: [
            { id: 'inc1', name: '工资', icon: '💼', color: '#1ABC9C' },
            { id: 'inc2', name: '副业', icon: '💻', color: '#F39C12' },
            { id: 'inc3', name: '理财收益', icon: '📈', color: '#2ECC71' },
            { id: 'inc4', name: '其他收入', icon: '🎁', color: '#E91E63' },
        ],
    };

    // --- 模块7：健康管理中心 (health) ---
    // 包含：经期追踪、保健品打卡、观察期专区、症状日记、睡眠质量、体重围度、每日健康问卷
    const DEFAULT_HEALTH = {
        // 经期追踪
        periodTracker: {
            lastPeriodDate: null,     // 上次月经开始日期
            cycleLength: 28,          // 周期长度（天）
            periodLength: 5,          // 经期持续天数
            nextPeriodDate: null,     // 预测下次日期
            ovulationDate: null,      // 预测排卵日
            records: [],              // 历史记录
            // 结构: { id, startDate, endDate, flow: 'light'|'medium'|'heavy', pain: 0-10, symptoms: [], notes: '' }
            symptoms: ['腹痛', '腰酸', '头痛', '乳房胀痛', '疲劳', '情绪波动', '长痘', '水肿'],
        },

        // 保健品打卡
        supplementCheckin: {
            supplements: [
                { id: 'sup1', name: '维生素C', dosage: '100mg', frequency: 'daily', time: '08:00', icon: '🍊', streak: 0, color: '#FF6B6B', createdAt: Date.now() },
                { id: 'sup2', name: '钙片', dosage: '500mg', frequency: 'daily', time: '20:00', icon: '🦴', streak: 0, color: '#4ECDC4', createdAt: Date.now() },
            ],
            checkinRecords: {}, // { '2025-01-01': { sup1: true, sup2: false } }
        },

        // 观察期专区（Omega-3/益生菌等）
        observationZone: [
            {
                id: 'obs1',
                name: 'Omega-3 鱼油观察期',
                supplement: 'Omega-3 鱼油',
                startDate: null,
                endDate: null,
                durationDays: 30,
                purpose: '改善睡眠质量、调节情绪',
                dosage: '1000mg/天',
                status: 'not_started', // not_started | ongoing | completed
                dailyObservations: {}, // { '2025-01-01': { taken: true, mood: 4, sleep: 7, energy: 5, notes: '' } }
                expectedEffects: ['改善睡眠', '提升精力', '情绪稳定'],
                conclusion: '',
            },
            {
                id: 'obs2',
                name: '益生菌观察期',
                supplement: '益生菌',
                startDate: null,
                endDate: null,
                durationDays: 14,
                purpose: '调节肠道菌群、改善消化',
                dosage: '1袋/天',
                status: 'not_started',
                dailyObservations: {},
                expectedEffects: ['改善消化', '排便规律', '减少胀气'],
                conclusion: '',
            },
        ],

        // 症状日记
        symptomDiary: {
            records: [],
            // 结构: { id, date, symptoms: [{name, severity: 1-10, duration}], possibleCauses: [], remedies: [], notes: '' }
            commonSymptoms: ['头痛', '胃痛', '疲劳', '失眠', '焦虑', '皮肤问题', '消化不良', '肌肉酸痛'],
        },

        // 睡眠质量
        sleepQuality: {
            records: {},
            // 格式: { '2025-01-01': { bedTime: '23:00', wakeTime: '07:00', duration: 8, quality: 4, deepSleep: 2, lightSleep: 5, rem: 1, awakeTimes: 0, notes: '' } }
            weeklyAverage: 0,
            monthlyAverage: 0,
            goalHours: 8,
            goalBedtime: '23:00',
            goalWakeTime: '07:00',
        },

        // 体重围度
        weightBody: {
            targetWeight: 55,         // 目标体重
            startWeight: 62,          // 起始体重
            currentWeight: 62,        // 当前体重
            height: 165,              // 身高（cm）
            // 围度记录
            measurements: {
                chest: 0, waist: 0, hip: 0, thigh: 0, arm: 0,
            },
            records: [],
            // 结构: { id, date, weight, chest, waist, hip, thigh, arm, bodyFat, note }
            weighInFrequency: 'weekly', // daily | weekly
        },

        // 每日健康问卷
        dailyQuestionnaire: {
            records: {},
            // 格式: { '2025-01-01': { energy: 4, mood: 4, appetite: 3, digestion: 4, skin: 3, pain: 0, overall: 4, notes: '' } }
            questions: [
                { id: 'hq1', question: '今日精力水平', type: 'rating', max: 5, icon: '⚡' },
                { id: 'hq2', question: '今日心情状态', type: 'rating', max: 5, icon: '😊' },
                { id: 'hq3', question: '今日食欲', type: 'rating', max: 5, icon: '🍽️' },
                { id: 'hq4', question: '今日肠胃状况', type: 'rating', max: 5, icon: '🫃' },
                { id: 'hq5', question: '今日皮肤状态', type: 'rating', max: 5, icon: '✨' },
                { id: 'hq6', question: '今日身体疼痛程度', type: 'rating', max: 5, icon: '💊' },
            ],
        },
    };

    // --- 模块8：减脂饮食记录 (diet) ---
    // 包含：三餐记录、饮品统计、零食情况、饮食反思
    const DEFAULT_DIET = {
        // 三餐记录
        meals: {
            records: {},
            // 格式: { '2025-01-01': {
            //   breakfast: [{ id, name, calories, portion, category }],
            //   lunch: [...],
            //   dinner: [...],
            //   totalCalories: 0,
            //   protein: 0, carbs: 0, fat: 0,
            //   satisfaction: 4
            // }}
        },

        // 每日热量目标
        calorieGoal: 1500,
        proteinGoal: 80,     // 蛋白质目标（克）
        waterGoal: 2000,     // 饮水目标（毫升）

        // 食物库
        foodLibrary: [
            { id: 'food1', name: '白米饭', calories: 230, serving: '1碗(200g)', category: '主食', protein: 5, carbs: 50, fat: 0.5 },
            { id: 'food2', name: '鸡蛋', calories: 70, serving: '1个(50g)', category: '蛋白质', protein: 6, carbs: 0.6, fat: 5 },
            { id: 'food3', name: '牛奶', calories: 120, serving: '1杯(250ml)', category: '乳制品', protein: 8, carbs: 12, fat: 5 },
            { id: 'food4', name: '苹果', calories: 95, serving: '1个(180g)', category: '水果', protein: 0.5, carbs: 25, fat: 0.3 },
            { id: 'food5', name: '鸡胸肉', calories: 165, serving: '100g', category: '肉类', protein: 31, carbs: 0, fat: 3.6 },
            { id: 'food6', name: '西兰花', calories: 34, serving: '100g', category: '蔬菜', protein: 2.8, carbs: 7, fat: 0.4 },
            { id: 'food7', name: '燕麦片', calories: 150, serving: '40g', category: '主食', protein: 5, carbs: 27, fat: 3 },
            { id: 'food8', name: '三文鱼', calories: 208, serving: '100g', category: '肉类', protein: 20, carbs: 0, fat: 13 },
        ],

        // 饮品统计
        drinks: {
            records: {},
            // 格式: { '2025-01-01': { water: 1500, tea: 0, coffee: 1, milktea: 0, juice: 0, soda: 0, alcohol: 0 } }
            weeklyStats: { water: 0, milktea: 0, coffee: 0 },
        },

        // 零食情况
        snacks: {
            records: {},
            // 格式: { '2025-01-01': [{ id, name, calories, time, reason: '饿了'|'嘴馋'|'情绪'|'社交' }] }
            dailySnackBudget: 200, // 每日零食热量预算
            weeklySnackDays: 0,    // 本周有零食的天数
        },

        // 饮食反思
        reflection: {
            records: {},
            // 格式: { '2025-01-01': {
            //   todaySummary: '',
            //   goodHabits: '',
            //   improvements: '',
            //   emotionalEating: false,
            //   overeating: false,
            //   tomorrowPlan: '',
            //   overallRating: 4
            // }}
        },

        // 饮食分类
        mealCategories: ['早餐', '午餐', '晚餐', '加餐'],
        foodCategories: ['主食', '蛋白质', '蔬菜', '水果', '乳制品', '坚果', '零食', '饮品'],
    };

    // --- 模块9：每日待办清单 (todo) ---
    // 包含：学习类、生活类、历史存档
    const DEFAULT_TODO = {
        // 学习类任务
        studyTasks: [],
        // 结构: { id, title, description, priority: 'high'|'medium'|'low', dueDate, completed, completedAt, category, subcategory, estimatedTime, actualTime, createdAt }

        // 生活类任务
        lifeTasks: [],
        // 同上结构

        // 历史存档
        archive: [],
        // 结构: { id, title, completedDate, category, priority }

        // 任务分类
        studyCategories: [
            { id: 'ts1', name: '英语学习', icon: '📚', color: '#45B7D1' },
            { id: 'ts2', name: 'PR剪辑', icon: '🎬', color: '#E74C3C' },
            { id: 'ts3', name: 'AI创作', icon: '🤖', color: '#9B59B6' },
            { id: 'ts4', name: '绘画练习', icon: '🎨', color: '#F39C12' },
            { id: 'ts5', name: '阅读', icon: '📖', color: '#2ECC71' },
            { id: 'ts6', name: '其他学习', icon: '💻', color: '#95A5A6' },
        ],

        lifeCategories: [
            { id: 'tl1', name: '家务', icon: '🧹', color: '#95A5A6' },
            { id: 'tl2', name: '购物', icon: '🛒', color: '#E67E22' },
            { id: 'tl3', name: '运动', icon: '🏃', color: '#2ECC71' },
            { id: 'tl4', name: '社交', icon: '👥', color: '#3498DB' },
            { id: 'tl5', name: '健康', icon: '💊', color: '#E74C3C' },
            { id: 'tl6', name: '其他生活', icon: '🏠', color: '#9B59B6' },
        ],

        // 每日模板
        dailyTemplate: {
            morningRoutine: ['起床喝水', '晨间运动', '早餐', '英语学习'],
            eveningRoutine: ['晚餐', '复盘', '洗漱', '阅读'],
        },

        // 统计
        stats: {
            totalCompleted: 0,
            streak: 0,
            completionRate: 0,
        },
    };

    // --- 模块10：上下班考勤打卡 (attendance) ---
    // 包含：定时提醒配置、打卡记录
    const DEFAULT_ATTENDANCE = {
        // 定时提醒配置
        reminderConfig: {
            workStartTime: '09:00',
            workEndTime: '18:00',
            workDays: [1, 2, 3, 4, 5], // 周一到周五
            checkInReminder: { enabled: true, time: '08:50', advance: 10 },
            checkOutReminder: { enabled: true, time: '18:05', advance: 0 },
            lunchStart: '12:00',
            lunchEnd: '13:30',
            flexTime: false,            // 是否弹性工作制
            flexBufferMinutes: 30,      // 弹性缓冲时间
        },

        // 打卡记录
        records: {},
        // 格式: { '2025-01-01': {
        //   checkIn: '08:55',
        //   checkOut: '18:10',
        //   status: 'normal'|'late'|'early'|'absent'|'leave'|'remote',
        //   workHours: 8.25,
        //   note: ''
        // }}

        // 月度统计
        monthlyStats: {
            totalWorkDays: 0,
            onTimeDays: 0,
            lateDays: 0,
            earlyDays: 0,
            leaveDays: 0,
            remoteDays: 0,
            totalWorkHours: 0,
            avgWorkHours: 0,
            overtimeHours: 0,
        },

        // 请假记录
        leaveRecords: [],
        // 结构: { id, type: 'sick'|'personal'|'annual'|'other', startDate, endDate, days, reason, status: 'pending'|'approved'|'rejected' }

        // 加班记录
        overtimeRecords: [],
        // 结构: { id, date, hours, reason, approved }
    };

    // --- 模块11：情绪随笔日记 (mood) ---
    // 包含：情绪标签、随笔记录
    const DEFAULT_MOOD = {
        // 情绪类型标签
        moodTypes: [
            { id: 'happy', label: '开心', icon: '😊', color: '#FFD93D', level: 5 },
            { id: 'grateful', label: '感恩', icon: '🥰', color: '#FD79A8', level: 5 },
            { id: 'excited', label: '兴奋', icon: '🤩', color: '#FF6B6B', level: 5 },
            { id: 'calm', label: '平静', icon: '😌', color: '#4ECDC4', level: 4 },
            { id: 'relaxed', label: '放松', icon: '😎', color: '#74B9FF', level: 4 },
            { id: 'tired', label: '疲惫', icon: '😫', color: '#95A5A6', level: 3 },
            { id: 'bored', label: '无聊', icon: '😐', color: '#BDC3C7', level: 3 },
            { id: 'anxious', label: '焦虑', icon: '😰', color: '#A29BFE', level: 2 },
            { id: 'sad', label: '难过', icon: '😢', color: '#74B9FF', level: 2 },
            { id: 'angry', label: '生气', icon: '😠', color: '#E17055', level: 2 },
            { id: 'stressed', label: '压力大', icon: '😤', color: '#E74C3C', level: 1 },
        ],

        // 情绪标签（自定义标签）
        customTags: [
            '工作', '学习', '感情', '家庭', '朋友', '健康', '金钱', '天气', '运动', '美食', '旅行', '追剧'
        ],

        // 随笔记录
        entries: {},
        // 格式: { '2025-01-01': {
        //   moodId: 'happy',
        //   score: 8,
        //   intensity: 4,
        //   tags: ['工作', '美食'],
        //   trigger: '今天完成了一个重要项目',
        //   content: '今天整体状态很好，上午高效完成了工作...',
        //   weather: '☀️',
        //   gratitude: ['完成了重要工作', '和朋友吃了好吃的', '天气很好'],
        //   createdAt: timestamp
        // }}

        // 统计
        stats: {
            totalEntries: 0,
            streak: 0,
            avgMoodScore: 0,
            mostCommonMood: '',
        },
    };

    // --- 模块12：通用问题收纳栏 (questions) ---
    // 包含：问题收纳（问题、解决办法、最终方案）
    const DEFAULT_QUESTIONS = {
        // 问题列表
        questions: [
            {
                id: 'q1',
                title: 'PR导出视频画质模糊',
                category: '技术问题',
                priority: 'high',
                status: 'solved', // pending | researching | solved | closed
                description: '导出的视频在手机上看很模糊，不知道哪里设置有问题',
                solutions: [
                    { id: 's1', title: '调整导出比特率', content: '将比特率设置为VBR 2次，目标比特率10Mbps，最大15Mbps', tried: true, effective: true },
                    { id: 's2', title: '检查序列设置', content: '确保序列分辨率与素材匹配', tried: true, effective: false },
                ],
                finalSolution: '调整导出比特率为VBR 2次编码，目标10Mbps',
                tags: ['PR', '导出', '画质'],
                createdAt: Date.now(),
                solvedAt: Date.now(),
            },
        ],

        // 问题分类
        categories: [
            { id: 'qc1', name: '技术问题', icon: '💻', color: '#3498DB' },
            { id: 'qc2', name: '学习疑问', icon: '📚', color: '#9B59B6' },
            { id: 'qc3', name: '生活困扰', icon: '🏠', color: '#2ECC71' },
            { id: 'qc4', name: '工作问题', icon: '💼', color: '#E67E22' },
            { id: 'qc5', name: '人际沟通', icon: '👥', color: '#E91E63' },
            { id: 'qc6', name: '其他', icon: '❓', color: '#95A5A6' },
        ],

        // 统计
        stats: {
            total: 0,
            solved: 0,
            pending: 0,
            researching: 0,
        },
    };

    // --- 模块13：补学计划板块 (makeup) ---
    // 包含：补学计划（未完成日期、待补齐任务、补学分配）
    const DEFAULT_MAKEUP = {
        // 未完成日期（错过的学习日）
        missedDates: [],
        // 结构: { id, date, module: 'english'|'pr'|'ai'|'drawing', reason: '', makeupAssigned: false, assignedDate: null }

        // 待补齐任务列表
        pendingTasks: [
            // { id, module, title, originalDate, estimatedTime, priority, status: 'pending'|'scheduled'|'completed' }
        ],

        // 补学分配计划
        makeupSchedule: [],
        // 结构: { id, taskId, makeupDate, timeSlot: 'morning'|'afternoon'|'evening', duration, completed: false }

        // 补学规则配置
        rules: {
            maxMakeupPerWeek: 3,          // 每周最多补学次数
            makeupDeadlineDays: 7,        // 补学期限（天内完成）
            priorityModules: ['english'], // 优先补学的模块
            preferredTime: 'evening',     // 偏好补学时间段
        },

        // 统计
        stats: {
            totalMissed: 0,
            totalMadeUp: 0,
            currentBacklog: 0,
            makeupRate: 0,                // 补学完成率
            streak: 0,                    // 连续无拖欠天数
        },

        // 模块学习日配置
        moduleSchedule: {
            english: { days: [1, 2, 3, 4, 5], dailyMinutes: 30 },  // 周一到周五
            pr: { days: [1, 3, 5], dailyMinutes: 90 },             // 周一、三、五
            ai: { days: [2, 4], dailyMinutes: 60 },                // 周二、四
            drawing: { days: [6, 0], dailyMinutes: 120 },          // 周六、日
        },
    };

    // --- 模块14：数据联动分析看板 (analytics) ---
    // 包含：睡眠vs学习效率、心情vs饮食、月度报告、时间分配饼图
    // 该模块主要是数据聚合展示，数据来源于其他模块
    const DEFAULT_ANALYTICS = {
        // 睡眠vs学习效率分析
        sleepVsStudy: {
            enabled: true,
            correlation: null,       // 相关系数
            dataPoints: [],          // 数据点: { date, sleepHours, studyMinutes, efficiency }
            insight: '',             // AI生成的洞察
        },

        // 心情vs饮食分析
        moodVsDiet: {
            enabled: true,
            correlation: null,
            dataPoints: [],          // { date, moodScore, calorieIntake, snackCount, waterIntake }
            insight: '',
        },

        // 月度报告
        monthlyReport: {
            currentMonth: new Date().getMonth() + 1,
            currentYear: new Date().getFullYear(),
            generated: false,
            sections: {
                overview: '',        // 月度总览
                habits: {},          // 习惯数据分析
                study: {},           // 学习数据分析
                health: {},          // 健康数据分析
                finance: {},         // 财务数据分析
                mood: {},            // 情绪数据分析
                highlights: [],      // 月度亮点
                improvements: [],    // 待改进
                nextMonthGoals: [],  // 下月目标
            },
        },

        // 时间分配饼图
        timeAllocation: {
            categories: [
                { id: 'ta1', name: '工作', color: '#3498DB', hours: 0 },
                { id: 'ta2', name: '学习', color: '#9B59B6', hours: 0 },
                { id: 'ta3', name: '运动', color: '#2ECC71', hours: 0 },
                { id: 'ta4', name: '睡眠', color: '#6C5CE7', hours: 0 },
                { id: 'ta5', name: '娱乐', color: '#E67E22', hours: 0 },
                { id: 'ta6', name: '社交', color: '#E91E63', hours: 0 },
                { id: 'ta7', name: '家务', color: '#95A5A6', hours: 0 },
                { id: 'ta8', name: '其他', color: '#BDC3C7', hours: 0 },
            ],
            period: 'week', // week | month
        },

        // 习惯完成热力图数据
        heatmapData: {
            year: new Date().getFullYear(),
            data: {}, // { '2025-01-01': { count: 5, total: 8, rate: 0.625 } }
        },
    };

    // --- 模块15：每周完整复盘 (review) ---
    // 包含：每周复盘（12项内容）
    const DEFAULT_REVIEW = {
        // 每周复盘记录
        weeklyReviews: [],
        // 结构: { id, year, weekNumber, startDate, endDate, sections: {...}, overallRating, createdAt }

        // 12项复盘内容模板
        weeklyTemplate: {
            sections: [
                { id: 'goals', label: '本周目标完成', icon: '🎯', type: 'goals', placeholder: '列出本周目标及其完成情况...' },
                { id: 'study', label: '学习成长总结', icon: '📚', type: 'text', placeholder: '本周学习了什么？有哪些进步？' },
                { id: 'work', label: '工作任务回顾', icon: '💼', type: 'text', placeholder: '本周工作完成情况如何？' },
                { id: 'health', label: '健康运动记录', icon: '💪', type: 'health', placeholder: '本周运动、睡眠、身体状况如何？' },
                { id: 'diet', label: '饮食管理回顾', icon: '🥗', type: 'diet', placeholder: '本周饮食控制得怎么样？' },
                { id: 'finance', label: '财务收支总结', icon: '💰', type: 'finance', placeholder: '本周收支情况？是否超支？' },
                { id: 'mood', label: '情绪状态总览', icon: '💭', type: 'mood', placeholder: '本周整体情绪如何？有什么波动？' },
                { id: 'social', label: '人际社交关系', icon: '👥', type: 'text', placeholder: '本周和朋友家人的互动如何？' },
                { id: 'highlights', label: '本周亮点成就', icon: '✨', type: 'list', placeholder: '这周最值得骄傲的事是什么？' },
                { id: 'challenges', label: '问题与挑战', icon: '⚡', type: 'list', placeholder: '遇到了什么困难？怎么解决的？' },
                { id: 'nextWeek', label: '下周计划目标', icon: '📅', type: 'goals', placeholder: '下周的重点目标和计划是什么？' },
                { id: 'reflection', label: '感悟与成长', icon: '🌱', type: 'text', placeholder: '本周最大的感悟是什么？学到了什么？' },
            ],
            ratingMax: 10,
        },

        // 月度复盘记录
        monthlyReviews: [],
        // 结构类似 weeklyReviews 但范围是月度

        // 年度复盘记录
        yearlyReviews: [],

        // 复盘提醒
        reminder: {
            enabled: true,
            day: 0,          // 周日复盘
            time: '20:00',
        },

        // 统计
        stats: {
            totalWeekly: 0,
            totalMonthly: 0,
            streak: 0,
            avgRating: 0,
        },
    };

    // --- 模块16：自定义时间规划表 (schedule) ---
    // 包含：工作日时间轴、休息日安排
    const DEFAULT_SCHEDULE = {
        // 工作日时间轴
        workdayTimeline: [
            { id: 'wt1', time: '06:30', activity: '起床、洗漱、喝水', type: 'routine', duration: 15 },
            { id: 'wt2', time: '06:45', activity: '晨间运动/瑜伽', type: 'exercise', duration: 30 },
            { id: 'wt3', time: '07:15', activity: '早餐 + 英语单词', type: 'study', duration: 45 },
            { id: 'wt4', time: '08:00', activity: '通勤上班', type: 'commute', duration: 60 },
            { id: 'wt5', time: '09:00', activity: '工作（上午高效时段）', type: 'work', duration: 180 },
            { id: 'wt6', time: '12:00', activity: '午餐 + 午休', type: 'rest', duration: 90 },
            { id: 'wt7', time: '13:30', activity: '工作（下午）', type: 'work', duration: 270 },
            { id: 'wt8', time: '18:00', activity: '下班通勤', type: 'commute', duration: 60 },
            { id: 'wt9', time: '19:00', activity: '晚餐 + 放松', type: 'rest', duration: 60 },
            { id: 'wt10', time: '20:00', activity: '学习/技能提升', type: 'study', duration: 90 },
            { id: 'wt11', time: '21:30', activity: '洗漱 + 阅读', type: 'rest', duration: 60 },
            { id: 'wt12', time: '22:30', activity: '冥想/复盘 + 睡觉', type: 'sleep', duration: 30 },
        ],

        // 休息日安排
        restdaySchedule: {
            saturday: [
                { id: 'rs1', time: '08:00', activity: '自然醒 + 早餐', type: 'rest', duration: 60 },
                { id: 'rs2', time: '09:00', activity: '运动健身', type: 'exercise', duration: 90 },
                { id: 'rs3', time: '10:30', activity: '绘画/兴趣爱好', type: 'hobby', duration: 120 },
                { id: 'rs4', time: '12:30', activity: '午餐 + 午休', type: 'rest', duration: 120 },
                { id: 'rs5', time: '14:30', activity: '外出/社交/采购', type: 'social', duration: 240 },
                { id: 'rs6', time: '18:30', activity: '晚餐', type: 'rest', duration: 60 },
                { id: 'rs7', time: '19:30', activity: '自由时间（追剧/游戏/阅读）', type: 'entertainment', duration: 150 },
                { id: 'rs8', time: '22:00', activity: '洗漱 + 早睡', type: 'sleep', duration: 60 },
            ],
            sunday: [
                { id: 'su1', time: '08:30', activity: '自然醒 + 早餐', type: 'rest', duration: 60 },
                { id: 'su2', time: '09:30', activity: '英语学习 + 阅读', type: 'study', duration: 120 },
                { id: 'su3', time: '11:30', activity: '午餐准备 + 午餐', type: 'rest', duration: 90 },
                { id: 'su4', time: '13:00', activity: '午休', type: 'rest', duration: 60 },
                { id: 'su5', time: '14:00', activity: '学习/技能提升', type: 'study', duration: 180 },
                { id: 'su6', time: '17:00', activity: '每周复盘 + 下周规划', type: 'review', duration: 60 },
                { id: 'su7', time: '18:00', activity: '晚餐', type: 'rest', duration: 60 },
                { id: 'su8', time: '19:00', activity: '散步/轻度运动', type: 'exercise', duration: 60 },
                { id: 'su9', time: '20:00', activity: '放松 + 准备下周', type: 'rest', duration: 150 },
                { id: 'su10', time: '22:30', activity: '睡觉', type: 'sleep', duration: 30 },
            ],
        },

        // 活动类型配置
        activityTypes: [
            { id: 'work', name: '工作', color: '#3498DB', icon: '💼' },
            { id: 'study', name: '学习', color: '#9B59B6', icon: '📚' },
            { id: 'exercise', name: '运动', color: '#2ECC71', icon: '🏃' },
            { id: 'rest', name: '休息', color: '#95A5A6', icon: '😌' },
            { id: 'sleep', name: '睡眠', color: '#6C5CE7', icon: '🌙' },
            { id: 'commute', name: '通勤', color: '#E67E22', icon: '🚗' },
            { id: 'social', name: '社交', color: '#E91E63', icon: '👥' },
            { id: 'hobby', name: '爱好', color: '#F39C12', icon: '🎨' },
            { id: 'entertainment', name: '娱乐', color: '#FF6B6B', icon: '🎮' },
            { id: 'routine', name: '日常', color: '#7F8C8D', icon: '🏠' },
            { id: 'review', name: '复盘', color: '#1ABC9C', icon: '📝' },
        ],

        // 自定义日程事件
        customEvents: [],
        // 结构: { id, title, date, startTime, endTime, type, color, repeat: 'none'|'daily'|'weekly', reminder, note }

        // 时间块统计
        stats: {
            workHours: 0,
            studyHours: 0,
            exerciseHours: 0,
            sleepHours: 0,
            entertainmentHours: 0,
        },
    };

    // --- 模块17：快捷工具聚合页 (tools) ---
    // 包含：快捷工具聚合（按分类组织）
    const DEFAULT_TOOLS = {
        // 工具分类
        categories: [
            {
                id: 'toolcat1',
                name: '效率工具',
                icon: '⚡',
                tools: [
                    { id: 'tool1', name: '番茄钟', icon: '🍅', type: 'built-in', function: 'pomodoro', description: '25分钟专注工作' },
                    { id: 'tool2', name: '倒计时', icon: '⏱️', type: 'built-in', function: 'timer', description: '自定义倒计时' },
                    { id: 'tool3', name: '计算器', icon: '🧮', type: 'built-in', function: 'calculator', description: '日常计算' },
                    { id: 'tool4', name: '记事本', icon: '📝', type: 'built-in', function: 'notes', description: '快速记录' },
                    { id: 'tool5', name: '待办清单', icon: '📋', type: 'module', function: 'todo', description: '跳转到待办' },
                ],
            },
            {
                id: 'toolcat2',
                name: '健康工具',
                icon: '💊',
                tools: [
                    { id: 'tool6', name: 'BMI计算器', icon: '⚖️', type: 'built-in', function: 'bmi', description: '计算身体质量指数' },
                    { id: 'tool7', name: '喝水提醒', icon: '💧', type: 'built-in', function: 'water', description: '定时提醒喝水' },
                    { id: 'tool8', name: '基础代谢计算', icon: '🔥', type: 'built-in', function: 'bmr', description: '计算基础代谢率' },
                    { id: 'tool9', name: '健康问卷', icon: '📋', type: 'module', function: 'health', description: '每日健康打卡' },
                ],
            },
            {
                id: 'toolcat3',
                name: '学习工具',
                icon: '📚',
                tools: [
                    { id: 'tool10', name: '单词本', icon: '📖', type: 'module', function: 'english', description: '英语学习模块' },
                    { id: 'tool_bbdc', name: '不背单词', icon: '📗', type: 'external', url: 'https://www.bbdc.cn/index', description: '英语单词学习' },
                    { id: 'tool_bilibili', name: '哔哩哔哩', icon: '📺', type: 'external', url: 'https://www.bilibili.com', description: 'B站学习视频' },
                    { id: 'tool_baidu', name: '百度网盘', icon: '☁️', type: 'external', url: 'https://pan.baidu.com', description: '学习资料存储' },
                    { id: 'tool11', name: '单位换算', icon: '📐', type: 'built-in', function: 'converter', description: '长度/重量/温度换算' },
                    { id: 'tool12', name: '进度追踪', icon: '📊', type: 'module', function: 'analytics', description: '学习进度分析' },
                ],
            },
            {
                id: 'toolcat4',
                name: '财务工具',
                icon: '💰',
                tools: [
                    { id: 'tool13', name: '复利计算器', icon: '📈', type: 'built-in', function: 'compound', description: '计算复利收益' },
                    { id: 'tool14', name: '房贷计算', icon: '🏠', type: 'built-in', function: 'mortgage', description: '房贷月供计算' },
                    { id: 'tool15', name: '记账', icon: '💵', type: 'module', function: 'finance', description: '快速记账' },
                ],
            },
            {
                id: 'toolcat5',
                name: '生活工具',
                icon: '🏠',
                tools: [
                    { id: 'tool16', name: '天气查询', icon: '🌤️', type: 'external', url: '', description: '查看天气预报' },
                    { id: 'tool17', name: '二维码生成', icon: '📱', type: 'built-in', function: 'qrcode', description: '生成二维码' },
                    { id: 'tool18', name: '随机决定', icon: '🎲', type: 'built-in', function: 'random', description: '选择困难症救星' },
                    { id: 'tool19', name: '密码生成', icon: '🔐', type: 'built-in', function: 'password', description: '生成强密码' },
                ],
            },
            {
                id: 'toolcat6',
                name: '创作工具',
                icon: '🎨',
                tools: [
                    { id: 'tool20', name: '颜色选择器', icon: '🎨', type: 'built-in', function: 'colorpicker', description: '取色/配色工具' },
                    { id: 'tool21', name: 'AI提示词', icon: '🤖', type: 'module', function: 'ai', description: '提示词库' },
                    { id: 'tool22', name: '灵感记录', icon: '💡', type: 'built-in', function: 'inspiration', description: '记录灵感火花' },
                ],
            },
        ],

        // 收藏/常用工具
        favorites: ['tool1', 'tool6', 'tool10', 'tool15'],

        // 自定义工具
        customTools: [],
    };

    // --- 模块18：首页仪表盘 (dashboard) ---
    // 仪表盘数据主要来自各模块聚合，这里定义仪表盘配置
    const DEFAULT_DASHBOARD = {
        // 仪表盘卡片配置（显示顺序）
        widgets: [
            { id: 'w1', type: 'greeting', title: '今日问候', enabled: true, size: 'full' },
            { id: 'w2', type: 'dailyHabits', title: '今日习惯', enabled: true, size: 'large' },
            { id: 'w3', type: 'todayTasks', title: '今日待办', enabled: true, size: 'large' },
            { id: 'w4', type: 'studyProgress', title: '学习进度', enabled: true, size: 'medium' },
            { id: 'w5', type: 'healthOverview', title: '健康概览', enabled: true, size: 'medium' },
            { id: 'w6', type: 'financeOverview', title: '财务概览', enabled: true, size: 'medium' },
            { id: 'w7', type: 'moodOverview', title: '情绪概览', enabled: true, size: 'medium' },
            { id: 'w8', type: 'weeklyProgress', title: '本周进度', enabled: true, size: 'full' },
            { id: 'w9', type: 'quickTools', title: '快捷入口', enabled: true, size: 'full' },
        ],

        // 快捷入口配置
        quickActions: [
            { id: 'qa1', label: '打卡习惯', icon: '✅', module: 'habits' },
            { id: 'qa2', label: '记一笔', icon: '💰', module: 'finance' },
            { id: 'qa3', label: '英语学习', icon: '📚', module: 'english' },
            { id: 'qa4', label: '记录心情', icon: '💭', module: 'mood' },
            { id: 'qa5', label: '饮食记录', icon: '🥗', module: 'diet' },
            { id: 'qa6', label: '考勤打卡', icon: '🕐', module: 'attendance' },
        ],
    };

    // ============================================================
    // 3. 徽章定义
    // ============================================================
    const BADGES = [
        // 习惯类徽章
        { id: 'badge_habit_7', name: '习惯萌芽', description: '连续打卡7天', icon: '🌱', category: 'habits', rarity: 'common', condition: { type: 'streak', value: 7 } },
        { id: 'badge_habit_30', name: '习惯养成', description: '连续打卡30天', icon: '🌿', category: 'habits', rarity: 'rare', condition: { type: 'streak', value: 30 } },
        { id: 'badge_habit_100', name: '习惯大师', description: '连续打卡100天', icon: '🌳', category: 'habits', rarity: 'epic', condition: { type: 'streak', value: 100 } },
        { id: 'badge_habit_365', name: '习惯传奇', description: '连续打卡365天', icon: '🏔️', category: 'habits', rarity: 'legendary', condition: { type: 'streak', value: 365 } },
        { id: 'badge_habit_all', name: '自律达人', description: '单日完成全部习惯', icon: '💯', category: 'habits', rarity: 'rare', condition: { type: 'all_daily' } },

        // 英语学习徽章
        { id: 'badge_english_7', name: '英语入门', description: '连续学英语7天', icon: '🔤', category: 'english', rarity: 'common', condition: { type: 'streak', value: 7 } },
        { id: 'badge_english_100', name: '词汇新星', description: '累计学习100个单词', icon: '📖', category: 'english', rarity: 'common', condition: { type: 'total_words', value: 100 } },
        { id: 'badge_english_500', name: '词汇达人', description: '累计学习500个单词', icon: '📚', category: 'english', rarity: 'rare', condition: { type: 'total_words', value: 500 } },
        { id: 'badge_english_1000', name: '词汇王者', description: '累计学习1000个单词', icon: '👑', category: 'english', rarity: 'epic', condition: { type: 'total_words', value: 1000 } },
        { id: 'badge_english_100_streak', name: '百日英语', description: '连续学英语100天', icon: '🏆', category: 'english', rarity: 'epic', condition: { type: 'streak', value: 100 } },

        // PR剪辑徽章
        { id: 'badge_pr_first', name: '剪辑新手', description: '完成第一个PR作品', icon: '🎬', category: 'pr', rarity: 'common', condition: { type: 'first_project' } },
        { id: 'badge_pr_10', name: '剪辑达人', description: '完成10个PR作品', icon: '🎥', category: 'pr', rarity: 'rare', condition: { type: 'projects', value: 10 } },
        { id: 'badge_pr_30days', name: '剪辑坚持者', description: 'PR学习打卡30天', icon: '📽️', category: 'pr', rarity: 'rare', condition: { type: 'study_days', value: 30 } },

        // AI创作徽章
        { id: 'badge_ai_first', name: 'AI初体验', description: '生成第一个AI视频', icon: '🤖', category: 'ai', rarity: 'common', condition: { type: 'first_video' } },
        { id: 'badge_ai_10', name: 'AI创作者', description: '生成10个AI视频', icon: '🎨', category: 'ai', rarity: 'rare', condition: { type: 'videos', value: 10 } },
        { id: 'badge_ai_prompts_20', name: '提示词收藏家', description: '收藏20条提示词', icon: '💡', category: 'ai', rarity: 'rare', condition: { type: 'prompts', value: 20 } },

        // 绘画徽章
        { id: 'badge_drawing_first', name: '初次执笔', description: '完成第一幅绘画作品', icon: '✏️', category: 'drawing', rarity: 'common', condition: { type: 'first_drawing' } },
        { id: 'badge_drawing_7', name: '绘笔不辍', description: '连续绘画7天', icon: '🖌️', category: 'drawing', rarity: 'common', condition: { type: 'streak', value: 7 } },
        { id: 'badge_drawing_30', name: '画艺精进', description: '连续绘画30天', icon: '🎨', category: 'drawing', rarity: 'rare', condition: { type: 'streak', value: 30 } },
        { id: 'badge_drawing_100', name: '百幅成就', description: '累计完成100幅作品', icon: '🖼️', category: 'drawing', rarity: 'epic', condition: { type: 'total_drawings', value: 100 } },

        // 财务类徽章
        { id: 'badge_finance_record_30', name: '记账新手', description: '坚持记账30天', icon: '📒', category: 'finance', rarity: 'common', condition: { type: 'recording_days', value: 30 } },
        { id: 'badge_finance_save_month', name: '储蓄达人', description: '单月储蓄率超过30%', icon: '🏦', category: 'finance', rarity: 'rare', condition: { type: 'savings_rate', value: 30 } },
        { id: 'badge_finance_goal', name: '目标达成', description: '完成年度存款目标', icon: '🎯', category: 'finance', rarity: 'epic', condition: { type: 'yearly_goal' } },
        { id: 'badge_finance_nomilktea_7', name: '戒奶茶先锋', description: '连续7天不喝奶茶', icon: '🧋', category: 'finance', rarity: 'common', condition: { type: 'no_milktea', value: 7 } },
        { id: 'badge_finance_nomilktea_30', name: '奶茶绝缘体', description: '连续30天不喝奶茶', icon: '🚫', category: 'finance', rarity: 'rare', condition: { type: 'no_milktea', value: 30 } },

        // 健康类徽章
        { id: 'badge_exercise_7', name: '运动起步', description: '连续运动7天', icon: '🏃', category: 'health', rarity: 'common', condition: { type: 'exercise_streak', value: 7 } },
        { id: 'badge_exercise_30', name: '运动健将', description: '连续运动30天', icon: '💪', category: 'health', rarity: 'rare', condition: { type: 'exercise_streak', value: 30 } },
        { id: 'badge_sleep_7', name: '睡眠标兵', description: '连续7天睡够8小时', icon: '😴', category: 'health', rarity: 'common', condition: { type: 'sleep_streak', value: 7 } },
        { id: 'badge_weight_goal', name: '瘦身达人', description: '达成减重目标', icon: '⚖️', category: 'health', rarity: 'epic', condition: { type: 'weight_goal' } },
        { id: 'badge_supplement_30', name: '养生达人', description: '连续30天吃保健品', icon: '💊', category: 'health', rarity: 'rare', condition: { type: 'supplement_streak', value: 30 } },

        // 饮食徽章
        { id: 'badge_diet_7', name: '饮食记录者', description: '连续记录饮食7天', icon: '🥗', category: 'diet', rarity: 'common', condition: { type: 'recording_streak', value: 7 } },
        { id: 'badge_diet_30', name: '饮食自律者', description: '连续记录饮食30天', icon: '🍱', category: 'diet', rarity: 'rare', condition: { type: 'recording_streak', value: 30 } },
        { id: 'badge_diet_calorie', name: '热量掌控者', description: '连续7天控制在热量目标内', icon: '🔥', category: 'diet', rarity: 'rare', condition: { type: 'calorie_streak', value: 7 } },
        { id: 'badge_diet_water', name: '喝水达人', description: '连续30天喝够水', icon: '💧', category: 'diet', rarity: 'rare', condition: { type: 'water_streak', value: 30 } },

        // 情绪日记徽章
        { id: 'badge_mood_7', name: '心情记录者', description: '连续记录心情7天', icon: '😊', category: 'mood', rarity: 'common', condition: { type: 'recording_streak', value: 7 } },
        { id: 'badge_mood_30', name: '情绪观察者', description: '连续记录心情30天', icon: '🌈', category: 'mood', rarity: 'rare', condition: { type: 'recording_streak', value: 30 } },
        { id: 'badge_mood_100', name: '心灵捕手', description: '连续记录心情100天', icon: '💖', category: 'mood', rarity: 'epic', condition: { type: 'recording_streak', value: 100 } },
        { id: 'badge_mood_positive', name: '小太阳', description: '连续7天心情评分4分以上', icon: '☀️', category: 'mood', rarity: 'rare', condition: { type: 'positive_streak', value: 7 } },

        // 复盘徽章
        { id: 'badge_review_first', name: '初入复盘', description: '完成第一次周复盘', icon: '📝', category: 'review', rarity: 'common', condition: { type: 'first_weekly' } },
        { id: 'badge_review_4', name: '复盘坚持者', description: '连续4周完成复盘', icon: '📅', category: 'review', rarity: 'rare', condition: { type: 'weekly_streak', value: 4 } },
        { id: 'badge_review_12', name: '季度复盘家', description: '连续12周完成复盘', icon: '📊', category: 'review', rarity: 'epic', condition: { type: 'weekly_streak', value: 12 } },

        // 成就类徽章（通用）
        { id: 'badge_onboarding', name: '初来乍到', description: '首次使用成长OS', icon: '🎉', category: 'general', rarity: 'common', condition: { type: 'first_use' } },
        { id: 'badge_7days', name: '一周体验', description: '连续使用7天', icon: '📆', category: 'general', rarity: 'common', condition: { type: 'app_streak', value: 7 } },
        { id: 'badge_30days', name: '月度坚持', description: '连续使用30天', icon: '🗓️', category: 'general', rarity: 'rare', condition: { type: 'app_streak', value: 30 } },
        { id: 'badge_100days', name: '百日陪伴', description: '连续使用100天', icon: '💯', category: 'general', rarity: 'epic', condition: { type: 'app_streak', value: 100 } },
        { id: 'badge_all_modules', name: '全能探索者', description: '使用过所有模块', icon: '🏆', category: 'general', rarity: 'legendary', condition: { type: 'all_modules' } },
    ];

    // 徽章稀有度配置
    const BADGE_RARITIES = {
        common: { label: '普通', color: '#95A5A6', bgColor: '#ECF0F1' },
        rare: { label: '稀有', color: '#3498DB', bgColor: '#EBF5FB' },
        epic: { label: '史诗', color: '#9B59B6', bgColor: '#F5EEF8' },
        legendary: { label: '传说', color: '#F39C12', bgColor: '#FEF9E7' },
    };

    // ============================================================
    // 4. 完整的默认数据结构（顶层）
    // ============================================================
    const DEFAULT_DATA = {
        version: '2.0.0',
        createdAt: Date.now(),
        lastUpdated: Date.now(),

        // 用户信息
        user: {
            name: '成长者',
            avatar: '',
            bio: '每天进步一点点',
            joinDate: Date.now(),
            level: 1,
            experience: 0,
            totalDays: 0,
        },

        // 18个模块数据
        dashboard: DEFAULT_DASHBOARD,
        habits: DEFAULT_HABITS,
        english: DEFAULT_ENGLISH,
        pr: DEFAULT_PR,
        ai: DEFAULT_AI,
        drawing: DEFAULT_DRAWING,
        finance: DEFAULT_FINANCE,
        health: DEFAULT_HEALTH,
        diet: DEFAULT_DIET,
        todo: DEFAULT_TODO,
        attendance: DEFAULT_ATTENDANCE,
        mood: DEFAULT_MOOD,
        questions: DEFAULT_QUESTIONS,
        makeup: DEFAULT_MAKEUP,
        analytics: DEFAULT_ANALYTICS,
        review: DEFAULT_REVIEW,
        schedule: DEFAULT_SCHEDULE,
        tools: DEFAULT_TOOLS,

        // 徽章和成就
        earnedBadges: [], // 已获得的徽章: { badgeId, earnedAt, unlocked: true }
        achievements: [],

        // 系统设置
        settings: {
            theme: 'light',              // light | dark | auto
            language: 'zh-CN',
            notifications: true,
            dailyReminder: '21:00',
            weekStartDay: 1,             // 周一为一周开始
            currency: 'CNY',
            dataBackup: {
                enabled: false,
                frequency: 'weekly',     // daily | weekly | monthly
                lastBackup: null,
            },
        },
    };

    // ============================================================
    // 5. 工具函数
    // ============================================================

    /**
     * 生成唯一ID
     */
    function generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 深拷贝对象
     */
    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * 获取导航项
     */
    function getNavItems() {
        return deepClone(NAV_ITEMS);
    }

    /**
     * 获取导航分类
     */
    function getNavCategories() {
        return deepClone(NAV_CATEGORIES);
    }

    /**
     * 获取按分类组织的导航项
     */
    function getNavItemsByCategory() {
        const result = {};
        for (const catKey in NAV_CATEGORIES) {
            result[catKey] = {
                ...NAV_CATEGORIES[catKey],
                items: NAV_ITEMS.filter(item => item.category === catKey),
            };
        }
        return result;
    }

    /**
     * 获取默认数据
     */
    function getDefaultData() {
        return deepClone(DEFAULT_DATA);
    }

    /**
     * 获取指定模块的默认数据
     */
    function getModuleDefaultData(moduleName) {
        const defaults = {
            dashboard: DEFAULT_DASHBOARD,
            habits: DEFAULT_HABITS,
            english: DEFAULT_ENGLISH,
            pr: DEFAULT_PR,
            ai: DEFAULT_AI,
            drawing: DEFAULT_DRAWING,
            finance: DEFAULT_FINANCE,
            health: DEFAULT_HEALTH,
            diet: DEFAULT_DIET,
            todo: DEFAULT_TODO,
            attendance: DEFAULT_ATTENDANCE,
            mood: DEFAULT_MOOD,
            questions: DEFAULT_QUESTIONS,
            makeup: DEFAULT_MAKEUP,
            analytics: DEFAULT_ANALYTICS,
            review: DEFAULT_REVIEW,
            schedule: DEFAULT_SCHEDULE,
            tools: DEFAULT_TOOLS,
        };
        return defaults[moduleName] ? deepClone(defaults[moduleName]) : null;
    }

    /**
     * 获取徽章定义
     */
    function getBadges() {
        return deepClone(BADGES);
    }

    /**
     * 获取指定分类的徽章
     */
    function getBadgesByCategory(category) {
        return BADGES.filter(b => b.category === category).map(b => deepClone(b));
    }

    /**
     * 获取徽章稀有度配置
     */
    function getBadgeRarities() {
        return deepClone(BADGE_RARITIES);
    }

    // ============================================================
    // 6. 导出
    // ============================================================
    return {
        // 常量
        NAV_ITEMS,
        NAV_CATEGORIES,
        BADGES,
        BADGE_RARITIES,
        DEFAULT_DATA,

        // 工具函数
        generateId,
        deepClone,
        getNavItems,
        getNavCategories,
        getNavItemsByCategory,
        getDefaultData,
        getModuleDefaultData,
        getBadges,
        getBadgesByCategory,
        getBadgeRarities,
    };
})();

// 如果在模块化环境中使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppData;
}
