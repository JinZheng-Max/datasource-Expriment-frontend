document.addEventListener('DOMContentLoaded', function () {
    initProfilePage();
});

function initProfilePage() {
    // Tab切换
    initTabNavigation();

    // 编辑信息
    initEditInfo();

    // 密码修改
    initPasswordChange();

    // 加载用户信息
    loadUserInfo();

    // 检查URL参数,自动切换选项卡
    checkURLParams();

    if (typeof initUserMenu === 'function') {
        initUserMenu();
    }
    if (typeof initLogout === 'function') {
        initLogout();
    }
}

// 检查URL参数
function checkURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');

    if (tab === 'security') {
        // 切换到安全设置选项卡
        const securityTab = document.querySelector('.tab-btn[data-tab="security"]');
        if (securityTab) {
            securityTab.click();
        }
    }
}

// Tab导航切换
function initTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetTab = this.dataset.tab;

            // 移除所有active类
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // 添加active类
            this.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');

            // 更新URL参数(但不刷新页面)
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('tab', targetTab);
            window.history.pushState({}, '', newUrl);
        });
    });
}

// 编辑信息功能
function initEditInfo() {
    const editBtn = document.getElementById('editInfoBtn');
    const cancelBtn = document.getElementById('cancelInfoBtn');
    const form = document.getElementById('infoForm');
    const formActions = document.getElementById('infoFormActions');
    const inputs = form.querySelectorAll('input[name="email"], input[name="phone"]');

    editBtn.addEventListener('click', function () {
        // 切换到编辑模式
        inputs.forEach(input => {
            input.removeAttribute('readonly');
        });
        formActions.style.display = 'flex';
        editBtn.style.display = 'none';
        showMessage('现在可以编辑信息了', 'info');
    });

    cancelBtn.addEventListener('click', function () {
        // 取消编辑
        inputs.forEach(input => {
            input.setAttribute('readonly', true);
        });
        formActions.style.display = 'none';
        editBtn.style.display = 'flex';
        form.reset();
        loadUserInfo(); // 重新加载数据
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // 这里应该调用API保存数据
        console.log('保存用户信息:', data);

        showMessage('信息更新成功!', 'success');

        // 退出编辑模式
        setTimeout(() => {
            inputs.forEach(input => {
                input.setAttribute('readonly', true);
            });
            formActions.style.display = 'none';
            editBtn.style.display = 'flex';
        }, 1000);
    });
}

// 密码修改功能
function initPasswordChange() {
    const form = document.getElementById('passwordForm');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const oldPassword = form.querySelector('[name="old_password"]').value;
        const newPassword = form.querySelector('[name="new_password"]').value;
        const confirmPassword = form.querySelector('[name="confirm_password"]').value;

        // 验证
        if (newPassword.length < 6) {
            showMessage('新密码长度不能少于6位', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage('两次输入的密码不一致', 'error');
            return;
        }

        if (oldPassword === newPassword) {
            showMessage('新密码不能与旧密码相同', 'error');
            return;
        }

        try {
            const res = await authFetch('http://localhost:8080/api/profile/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const data = await res.json();

            if (data.code === 1) {
                showMessage('密码修改成功,请重新登录', 'success');
                form.reset();
                setTimeout(() => {
                    localStorage.removeItem('authentication');
                    localStorage.removeItem('currentUser');
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showMessage(data.msg || '密码修改失败', 'error');
            }
        } catch (err) {
            console.error('修改密码异常:', err);
            showMessage('网络异常，请稍后重试', 'error');
        }
    });
}

// 加载用户信息
async function loadUserInfo() {
    try {
        const res = await authFetch('http://localhost:8080/api/profile/info');
        const data = await res.json();

        if (data.code === 1 && data.data) {
            const userData = data.data;

            // 更新页面显示
            document.getElementById('displayName').textContent = userData.realName || '用户';
            document.getElementById('displayRole').textContent = userData.userType === 'admin' ? '系统管理员' : '学生';

            // 填充表单
            const form = document.getElementById('infoForm');
            form.querySelector('[name="real_name"]').value = userData.realName || '';
            form.querySelector('[name="username"]').value = userData.username || '';

            console.log('用户信息加载完成:', userData);
        }
    } catch (err) {
        console.error('加载用户信息异常:', err);
        // 使用本地存储的用户信息作为备用
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            const user = JSON.parse(currentUser);
            document.getElementById('displayName').textContent = user.realName || user.username;
            document.getElementById('displayRole').textContent = user.userType === 'admin' ? '系统管理员' : '学生';
        }
    }
}
