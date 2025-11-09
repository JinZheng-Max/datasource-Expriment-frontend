document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');

    // 页面加载时检查是否有保存的用户名
    const savedUsername = localStorage.getItem('savedUsername');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        rememberCheckbox.checked = true;
    }

    // 表单提交事件
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // 表单验证
        if (!username) {
            showMessage('请输入用户名', 'error');
            usernameInput.focus();
            return;
        }

        if (!password) {
            showMessage('请输入密码', 'error');
            passwordInput.focus();
            return;
        }

        if (password.length < 6) {
            showMessage('密码长度不能少于6位', 'error');
            passwordInput.focus();
            return;
        }

        // 记住用户名
        if (rememberCheckbox.checked) {
            localStorage.setItem('savedUsername', username);
        } else {
            localStorage.removeItem('savedUsername');
        }

        // 模拟登录过程
        showMessage('正在登录...', 'info');
        const loginButton = loginForm.querySelector('.btn-login');
        loginButton.disabled = true;
        loginButton.textContent = '登录中...';

        // 模拟网络延迟
        setTimeout(() => {
            // 这里应该是实际的登录验证逻辑
            // 示例：简单的用户名密码验证
            if (username === 'admin' && password === '123456') {
                showMessage('登录成功！', 'success');
                setTimeout(() => {
                    // 跳转到主页面（需要创建）
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                showMessage('用户名或密码错误', 'error');
                loginButton.disabled = false;
                loginButton.textContent = '登录';
            }
        }, 1500);
    });

    // 输入框焦点效果
    const inputs = document.querySelectorAll('input[type="text"], input[type="password"]');
    inputs.forEach(input => {
        input.addEventListener('focus', function () {
            this.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', function () {
            this.parentElement.classList.remove('focused');
        });
    });

    // 消息提示函数
    function showMessage(message, type) {
        // 移除已存在的消息
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 创建新消息
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;

        // 添加样式
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 30px;
            border-radius: 10px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            animation: slideDown 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;

        // 根据类型设置颜色
        if (type === 'success') {
            messageDiv.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
        } else if (type === 'error') {
            messageDiv.style.background = 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)';
        } else {
            messageDiv.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }

        document.body.appendChild(messageDiv);

        // 3秒后自动移除
        setTimeout(() => {
            messageDiv.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        
        @keyframes slideUp {
            from {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            to {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
        }
    `;
    document.head.appendChild(style);
})



