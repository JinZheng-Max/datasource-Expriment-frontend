// 通用功能模块

// 检查登录态（在页面加载时调用）
function checkAuth() {
    const token = localStorage.getItem('authentication');
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('login.html');
    
    // 如果不在登录页且没有token，跳转到登录页
    if (!isLoginPage && !token) {
        showMessage('请先登录', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        return false;
    }
    return true;
}

// 防止浏览器后退到已登出的页面
window.addEventListener('pageshow', function(event) {
    // 如果页面是从缓存中加载的（后退/前进按钮）
    if (event.persisted) {
        const token = localStorage.getItem('authentication');
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.includes('login.html');
        
        // 如果不在登录页且没有token，强制刷新页面
        if (!isLoginPage && !token) {
            window.location.reload();
        }
    }
});

// 防止页面缓存
window.addEventListener('load', function() {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('login.html');
    
    if (!isLoginPage) {
        // 设置不缓存
        if (window.history && window.history.pushState) {
            window.history.pushState(null, null, window.location.href);
            window.addEventListener('popstate', function() {
                // 后退时检查登录态
                const token = localStorage.getItem('authentication');
                if (!token) {
                    window.location.href = 'login.html';
                } else {
                    window.history.pushState(null, null, window.location.href);
                }
            });
        }
    }
});

// 全局响应拦截器：处理401未授权
function handleUnauthorized(response) {
    if (response.status === 401) {
        showMessage('登录已过期，请重新登录', 'error');
        setTimeout(() => {
            localStorage.removeItem('authentication');
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }, 1500);
        return true;
    }
    return false;
}

// 封装带认证的fetch请求
async function authFetch(url, options = {}) {
    const token = localStorage.getItem('authentication');
    
    // 合并默认headers
    const defaultHeaders = {
        'authentication': token || ''
    };
    
    options.headers = {
        ...defaultHeaders,
        ...(options.headers || {})
    };
    
    const response = await fetch(url, options);
    
    // 检查401
    if (handleUnauthorized(response)) {
        throw new Error('Unauthorized');
    }
    
    return response;
}

// 消息提示函数
function showMessage(message, type = 'info') {
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

// 退出登录功能
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            if (confirm('确定要退出登录吗?')) {
                showMessage('正在退出...', 'info');
                setTimeout(() => {
                    // 清除所有登录相关的本地存储
                    localStorage.removeItem('authentication'); // JWT token
                    localStorage.removeItem('currentUser'); // 用户信息
                    localStorage.removeItem('savedUsername'); // 记住的用户名
                    
                    // 跳转到登录页
                    window.location.href = 'login.html';
                }, 1000);
            }
        });
    }
}

// 用户菜单功能
function initUserMenu() {
    const userAvatar = document.querySelector('.user-avatar');
    if (!userAvatar) return;

    userAvatar.addEventListener('click', function (e) {
        e.stopPropagation();

        let menu = document.querySelector('.user-dropdown-menu');
        if (!menu) {
            menu = createUserMenu();
            document.body.appendChild(menu);
        }

        const rect = this.getBoundingClientRect();
        menu.style.top = rect.bottom + 10 + 'px';
        menu.style.right = window.innerWidth - rect.right + 'px';
        menu.classList.toggle('show');
    });

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
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.click();
                }
                break;
        }
    });

    return menu;
}

// 格式化日期
function formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day);
}

// 格式化时间
function formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    const second = String(d.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

// 数据验证
const Validator = {
    // 验证手机号
    isPhone(phone) {
        return /^1[3-9]\d{9}$/.test(phone);
    },

    // 验证身份证
    isIdCard(idCard) {
        return /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idCard);
    },

    // 验证邮箱
    isEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // 验证学号
    isStudentNo(studentNo) {
        return /^\d{8,12}$/.test(studentNo);
    }
};

// 添加通用动画样式
if (!document.getElementById('common-animations')) {
    const style = document.createElement('style');
    style.id = 'common-animations';
    style.textContent = `
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
        
        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        
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
}

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showMessage,
        initLogout,
        initUserMenu,
        formatDate,
        formatDateTime,
        Validator
    };
}
