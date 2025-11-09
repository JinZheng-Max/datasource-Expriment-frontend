document.addEventListener('DOMContentLoaded', function () {
    // 检查登录态
    if (typeof checkAuth === 'function' && !checkAuth()) {
        return; // 未登录，已跳转到登录页
    }

    // 数字滚动动画
    animateNumbers();

    // 侧边栏导航切换
    initSidebarNavigation();

    // 退出登录
    initLogout();

    // 用户下拉菜单
    initUserMenu();

    // 模拟数据加载
    loadDashboardData();

    // 快速操作按钮事件
    initQuickActions();
});

// 数字滚动动画
function animateNumbers() {
    const counters = [
        { id: 'totalStudents', target: 4460, duration: 2000 },
        { id: 'totalCourses', target: 156, duration: 1500 },
        { id: 'totalPractices', target: 89, duration: 1800 },
        { id: 'totalRewards', target: 342, duration: 2200 }
    ];

    counters.forEach(counter => {
        const element = document.getElementById(counter.id);
        if (!element) return;

        const increment = counter.target / (counter.duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= counter.target) {
                element.textContent = counter.target.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, 16);
    });
}

// 侧边栏导航
function initSidebarNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-page]');

    navItems.forEach(item => {
        item.addEventListener('click', function () {
            const page = this.dataset.page;

            // 如果是当前页面,不做处理
            if (this.classList.contains('active')) return;

            // 移除所有active类
            navItems.forEach(nav => nav.classList.remove('active'));

            // 添加当前active类
            this.classList.add('active');

            // 页面映射
            const pageMap = {
                'dashboard': 'index.html',
                'students': 'students.html',
                'status': 'status.html',
                'practice': 'practice.html',
                'reward': 'reward.html',
                'scores': 'scores.html',
                'courses': 'courses.html',
                'profile': 'profile.html'
            };

            // 如果有对应的页面,跳转
            if (pageMap[page]) {
                if (typeof showMessage === 'function') {
                    showMessage(`正在加载${this.querySelector('.nav-text').textContent}...`, 'info');
                }
                setTimeout(() => {
                    window.location.href = pageMap[page];
                }, 500);
            } else {
                if (typeof showMessage === 'function') {
                    showMessage('该功能正在开发中...', 'info');
                }
            }
        });
    });
}

// 退出登录
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            if (confirm('确定要退出登录吗?')) {
                showMessage('正在退出...', 'info');
                setTimeout(() => {
                    localStorage.removeItem('savedUsername');
                    window.location.href = 'login.html';
                }, 1000);
            }
        });
    }
}

// 用户菜单
function initUserMenu() {
    const userAvatar = document.querySelector('.user-avatar');
    if (!userAvatar) return;

    userAvatar.addEventListener('click', function (e) {
        e.stopPropagation();

        // 创建下拉菜单（如果不存在）
        let menu = document.querySelector('.user-dropdown-menu');
        if (!menu) {
            menu = createUserMenu();
            document.body.appendChild(menu);
        }

        // 定位菜单
        const rect = this.getBoundingClientRect();
        menu.style.top = rect.bottom + 10 + 'px';
        menu.style.right = window.innerWidth - rect.right + 'px';
        menu.classList.toggle('show');
    });

    // 点击其他地方关闭菜单
    document.addEventListener('click', function () {
        const menu = document.querySelector('.user-dropdown-menu');
        if (menu) {
            menu.classList.remove('show');
        }
    });
}

// 创建用户下拉菜单
function createUserMenu() {
    const menu = document.createElement('div');
    menu.className = 'user-dropdown-menu';
    menu.innerHTML = `
        <div class="menu-item" data-action="profile">
            <span class="menu-icon">👤</span>
            <span>个人信息</span>
        </div>
        <div class="menu-item" data-action="security">
            <span class="menu-icon">⚙️</span>
            <span>账号设置</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" data-action="logout">
            <span class="menu-icon">🚪</span>
            <span>退出登录</span>
        </div>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .user-dropdown-menu {
            position: fixed;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            padding: 8px;
            min-width: 200px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            z-index: 2000;
        }
        
        .user-dropdown-menu.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        
        .menu-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 14px;
            color: var(--text-primary);
        }
        
        .menu-item:hover {
            background: var(--bg-color);
        }
        
        .menu-icon {
            font-size: 18px;
        }
        
        .menu-divider {
            height: 1px;
            background: var(--border-color);
            margin: 8px 0;
        }
    `;
    document.head.appendChild(style);

    // 绑定菜单项点击事件
    menu.addEventListener('click', function (e) {
        const menuItem = e.target.closest('.menu-item');
        if (!menuItem) return;

        const action = menuItem.dataset.action;
        menu.classList.remove('show');

        switch (action) {
            case 'profile':
                window.location.href = 'profile.html';
                break;
            case 'security':
                window.location.href = 'profile.html?tab=security';
                break;
            case 'logout':
                document.getElementById('logoutBtn').click();
                break;
        }
    });

    return menu;
}

// 加载仪表盘数据
function loadDashboardData() {
    // 这里应该从后端API获取数据
    // 目前使用模拟数据
    const dashboardData = {
        students: {
            total: 4460,
            byGrade: [
                { grade: '大一', count: 1250 },
                { grade: '大二', count: 1180 },
                { grade: '大三', count: 1050 },
                { grade: '大四', count: 920 }
            ]
        },
        courses: {
            total: 156
        },
        practices: {
            total: 89
        },
        rewards: {
            total: 342
        },
        status: {
            active: 4320,
            suspended: 80,
            other: 60
        }
    };

    console.log('仪表盘数据加载完成:', dashboardData);

    // 可以在这里更新页面上的数据
    updateDashboardUI(dashboardData);
}

// 更新仪表盘UI
function updateDashboardUI(data) {
    // 更新统计卡片
    // ...existing code...

    // 更新图表
    // ...existing code...
}

// 消息提示函数
function showMessage(message, type) {
    const existingMessage = document.querySelector('.toast-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.textContent = message;

    toast.style.cssText = `
        position: fixed;
        top: 90px;
        right: 30px;
        padding: 15px 25px;
        border-radius: 10px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        z-index: 3000;
        animation: slideInRight 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    if (type === 'success') {
        toast.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
    } else if (type === 'error') {
        toast.style.background = 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)';
    } else {
        toast.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 添加动画样式
const animationStyle = document.createElement('style');
animationStyle.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(animationStyle);

// 快速操作按钮事件
function initQuickActions() {
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const text = this.querySelector('span:last-child').textContent;

            switch (text) {
                case '添加学生':
                    window.location.href = 'students.html';
                    break;
                case '录入成绩':
                    window.location.href = 'scores.html';
                    break;
                case '添加奖惩':
                    window.location.href = 'reward.html';
                    break;
                case '导出报表':
                    if (typeof showMessage === 'function') {
                        showMessage('报表导出功能开发中...', 'info');
                    }
                    break;
            }
        });
    });
}
