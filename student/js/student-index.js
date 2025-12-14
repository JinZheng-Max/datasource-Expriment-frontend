// 学生端首页

document.addEventListener('DOMContentLoaded', function() {
    if (!initStudentPage()) {
        return;
    }
    
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        // 加载学籍状态
        const statusRes = await studentFetch(`${API_BASE}/student-portal/my-status`);
        const statusData = await statusRes.json();
        if (statusData.code === 1 && statusData.data) {
            document.getElementById('statusText').textContent = statusData.data.status || '在读';
        }
        
        // 加载社会实践数量
        const practiceRes = await studentFetch(`${API_BASE}/student-portal/my-practices`);
        const practiceData = await practiceRes.json();
        if (practiceData.code === 1 && practiceData.data) {
            document.getElementById('practiceCount').textContent = practiceData.data.length || 0;
        }
        
        // 加载奖惩记录数量
        const rewardRes = await studentFetch(`${API_BASE}/student-portal/my-rewards`);
        const rewardData = await rewardRes.json();
        if (rewardData.code === 1 && rewardData.data) {
            // 只统计奖励
            const rewards = rewardData.data.filter(item => item.type === '奖励');
            document.getElementById('rewardCount').textContent = rewards.length || 0;
        }
        
        // 加载成绩数量
        const scoreRes = await studentFetch(`${API_BASE}/student-portal/my-scores`);
        const scoreData = await scoreRes.json();
        if (scoreData.code === 1 && scoreData.data) {
            document.getElementById('scoreCount').textContent = scoreData.data.length || 0;
        }
    } catch (err) {
        console.error('加载概览数据异常:', err);
    }
}
