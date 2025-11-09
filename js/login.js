document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');

    // 与后端配置保持一致的 token Header 名称（application.yaml -> sky.jwt.user-token-name）
    const TOKEN_HEADER_NAME = 'authentication';

    // 页面加载时检查是否有保存的用户名
    const savedUsername = localStorage.getItem('savedUsername');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        rememberCheckbox.checked = true;
    }

    // 表单提交事件
    loginForm.addEventListener('submit', async function (e) {
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

        // 登录过程
        showMessage('正在登录...', 'info');
        const loginButton = loginForm.querySelector('.btn-login');
        loginButton.disabled = true;
        loginButton.textContent = '登录中...';

        try {
            const res = await fetch('http://localhost:8080/api/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (data && data.code === 1 && data.data) {
                const vo = data.data; // LoginVO
                // 存储 token，后续请求使用此 Header 携带
                localStorage.setItem(TOKEN_HEADER_NAME, vo.token);
                // 可选：存储基本用户信息
                localStorage.setItem('currentUser', JSON.stringify({
                    userId: vo.userId,
                    username: vo.username,
                    realName: vo.realName,
                    userType: vo.userType
                }));

                showMessage('登录成功！', 'success');
                setTimeout(() => {
                    window.location.href = './index.html';
                }, 800);
            } else {
                const msg = (data && data.msg) ? data.msg : '用户名或密码错误';
                showMessage(msg, 'error');
                loginButton.disabled = false;
                loginButton.textContent = '登录';
            }
        } catch (err) {
            showMessage('网络异常，请稍后重试', 'error');
            loginButton.disabled = false;
            loginButton.textContent = '登录';
        }
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
});


