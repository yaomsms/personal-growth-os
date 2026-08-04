// Vercel Serverless Function - AI 日报生成
// 解决浏览器直接调用豆包 API 的 CORS 问题

const DOUBAO_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const ENDPOINT_ID = process.env.DOUBAO_ENDPOINT_ID || '';
const API_KEY = process.env.DOUBAO_API_KEY || '';

export default async function handler(req, res) {
    // 允许跨域
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { timeData, diaryData, dateRange } = req.body;

        // 构建 prompt
        const prompt = buildPrompt(timeData, diaryData, dateRange);

        // 调用豆包 API
        const response = await fetch(DOUBAO_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: ENDPOINT_ID,
                messages: [
                    {
                        role: 'system',
                        content: '你是一位温暖、有洞察力的成长教练。你擅长从用户的时间记录和日记中发现行为模式，给出有深度的反思和启发。你的语气像朋友一样亲切自然，不说教，不空洞。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 1500,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('豆包 API 错误:', response.status, errorText);
            return res.status(response.status).json({ error: `AI 服务错误: ${response.status}` });
        }

        const data = await response.json();
        const aiContent = data.choices?.[0]?.message?.content || '';

        // 解析返回内容
        const parsed = parseAiResponse(aiContent);

        return res.status(200).json({
            success: true,
            content: aiContent,
            ...parsed,
        });

    } catch (error) {
        console.error('生成失败:', error);
        return res.status(500).json({ error: error.message || '生成失败' });
    }
}

function buildPrompt(timeData, diaryData, dateRange) {
    let prompt = '请根据以下用户的时间记录和日记，生成一份温暖有洞察力的每日成长分析。\n\n';

    prompt += `【分析时间范围】${dateRange}\n\n`;

    if (timeData && Object.keys(timeData).length > 0) {
        prompt += '【时间记录】\n';
        for (const [date, record] of Object.entries(timeData)) {
            prompt += `\n${date}：\n`;
            const categories = {
                study: '学习',
                work: '工作',
                exercise: '运动',
                entertainment: '娱乐',
                social: '社交',
                reading: '阅读',
                rest: '休息',
                other: '其他'
            };
            let total = 0;
            for (const [key, value] of Object.entries(record)) {
                if (key !== 'note' && value > 0) {
                    prompt += `- ${categories[key] || key}: ${value}小时\n`;
                    total += value;
                }
            }
            prompt += `合计: ${total.toFixed(1)}小时\n`;
            if (record.note) {
                prompt += `备注: ${record.note}\n`;
            }
        }
        prompt += '\n';
    } else {
        prompt += '【时间记录】暂无数据\n\n';
    }

    if (diaryData && diaryData.length > 0) {
        prompt += '【日记内容】\n';
        diaryData.forEach(entry => {
            prompt += `\n${entry.date}（心情：${entry.mood || '未记录'}）：\n`;
            prompt += `${entry.content || '无内容'}\n`;
        });
        prompt += '\n';
    } else {
        prompt += '【日记内容】暂无数据\n\n';
    }

    prompt += `请输出以下四个部分，每部分用【】标注标题：

【最近反复在做什么】
从时间记录和日记中，发现用户最近重复出现的行为模式、习惯或主题。不需要罗列数据，要讲出规律和洞察。

【行为与时间的联系】
分析用户的时间投入和实际状态/心情之间有什么关联。比如什么事情做完后心情好，什么事情做完后疲惫？时间分配和生活状态之间有什么因果关系？

【时间使用的变化】
对比分析时间范围内的变化趋势。最近是越来越忙了还是越来越从容了？哪些方面的时间在增加，哪些在减少？这背后可能意味着什么？

【开放性问题】
最后，提出一个发人深省的开放性问题，给用户带来灵感和反思。问题要具体，不要太空泛，要结合用户的实际情况。每次问题都不一样。

请用中文回答，语气温暖自然，像朋友聊天一样，每个部分2-4句话，不要太长。`;

    return prompt;
}

function parseAiResponse(content) {
    // 尝试解析四个部分
    const sections = {};
    const patterns = [
        { key: 'pattern1', regex: /【最近反复在做什么】\s*([\s\S]*?)(?=【|$)/ },
        { key: 'pattern2', regex: /【行为与时间的联系】\s*([\s\S]*?)(?=【|$)/ },
        { key: 'pattern3', regex: /【时间使用的变化】\s*([\s\S]*?)(?=【|$)/ },
        { key: 'question', regex: /【开放性问题】\s*([\s\S]*?)(?=【|$)/ },
    ];

    for (const { key, regex } of patterns) {
        const match = content.match(regex);
        if (match) {
            sections[key] = match[1].trim();
        }
    }

    return sections;
}
