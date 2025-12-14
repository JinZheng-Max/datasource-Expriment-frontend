// 学生端通用功能模块

const API_BASE = 'http://localhost:8080/api';

// 检查学生登录态
function checkStudentAuth() {
    const token = localStorage.getItem('authentication');
    const currentUser = localStorage.getItem('currentUser');
    
    if (!token || !currentUser) {
        showMessage('请先登录', 'error');
        setTimeout(() => {
            window.location.href = '../html/login.html';
        }, 1000);
        return false;
    }
    
    const user = JSON.parse(currentUser);
    if (user.userType !== 'student') {
        showMessage('非学生用户无法访问', 'error');
        setTimeout(() => {
            window.location.href = '../html/login.html';
        }, 1000);
        return false;
    }
    
    return true;
}

// 获取当前学生信息
function getCurrentStudent() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        return JSON.parse(currentUser);
    }
    return null;
}

// 封装带认证的fetch请求
async function studentFetch(url, options = {}) {
    const token = localStorage.getItem('authentication');
    
    const defaultHeaders = {
        'authentication': token || ''
    };
    
    options.headers = {
        ...defaultHeaders,
        ...(options.headers || {})
    };
    
    const response = await fetch(url, options);
    
    if (response.status === 401) {
        showMessage('登录已过期，请重新登录', 'error');
        setTimeout(() => {
            localStorage.removeItem('authentication');
            localStorage.removeItem('currentUser');
            window.location.href = '../html/login.html';
        }, 1500);
        throw new Error('Unauthorized');
    }
    
    return response;
}

// 初始化学生端页面
function initStudentPage() {
    if (!checkStudentAuth()) {
        return false;
    }
    
    // 显示用户名
    const student = getCurrentStudent();
    if (student) {
        const displayName = document.getElementById('displayName');
        const welcomeName = document.getElementById('welcomeName');
        if (displayName) {
            displayName.textContent = student.realName || student.username;
        }
        if (welcomeName) {
            welcomeName.textContent = student.realName || student.username;
        }
    }
    
    // 初始化退出登录
    initStudentLogout();
    
    return true;
}

// 退出登录
function initStudentLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('确定要退出登录吗?')) {
                showMessage('正在退出...', 'info');
                setTimeout(() => {
                    localStorage.removeItem('authentication');
                    localStorage.removeItem('currentUser');
                    window.location.href = '../html/login.html';
                }, 1000);
            }
        });
    }
}

// 消息提示函数（如果common.js中没有定义）
if (typeof showMessage !== 'function') {
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
}
