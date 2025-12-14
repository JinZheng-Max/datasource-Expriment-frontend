document.addEventListener('DOMContentLoaded', function () {
    initRewardPage();
});

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let totalRecords = 0;
let rewardData = [];
let allStudents = [];

const rewardLevels = ['国家级', '省级', '校级', '院级'];
const punishmentLevels = ['警告', '严重警告', '记过', '留校察看', '开除学籍'];

function initRewardPage() {
    if (typeof checkAuth === 'function' && !checkAuth()) {
        return;
    }

    document.getElementById('addRewardBtn').addEventListener('click', showAddModal);
    document.getElementById('searchInput').addEventListener('input', filterRewards);
    document.getElementById('typeFilter').addEventListener('change', filterRewards);
    document.getElementById('levelFilter').addEventListener('change', filterRewards);
    document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);
    document.getElementById('rewardForm').addEventListener('submit', handleSubmit);
    document.getElementById('typeSelect').addEventListener('change', onTypeChange);

    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    document.getElementById('rewardModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });

    loadStudents();
    loadRewardData();

    if (typeof initUserMenu === 'function') {
        initUserMenu();
    }
    if (typeof initLogout === 'function') {
        initLogout();
    }
}

async function loadStudents() {
    try {
        const res = await authFetch('http://localhost:8080/api/student/list', {
            method: 'GET'
        });
        const json = await res.json();

        if (json.code === 1 && json.data) {
            allStudents = json.data;
            const studentSelect = document.getElementById('studentSelect');
            studentSelect.innerHTML = '<option value="">请选择学生</option>';

            allStudents.forEach(student => {
                const option = new Option(
                    `${student.studentNo} - ${student.name}`,
                    student.studentId
                );
                studentSelect.add(option);
            });
        }
    } catch (err) {
        console.error('加载学生列表异常:', err);
    }
}

async function loadRewardData() {
    try {
        const searchText = document.getElementById('searchInput').value;
        const type = document.getElementById('typeFilter').value;
        const level = document.getElementById('levelFilter').value;

        const res = await authFetch('http://localhost:8080/api/reward/page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                page: currentPage,
                pageSize: pageSize,
                name: searchText || '',
                type: type || '',
                level: level || ''
            })
        });
        const json = await res.json();

        if (json.code === 1 && json.data) {
            const pageResult = json.data;
            rewardData = pageResult.records || [];
            totalRecords = pageResult.total || 0;
            totalPages = Math.ceil(totalRecords / pageSize);
            renderRewards();
        } else {
            showMessage(json.msg || '加载奖惩列表失败', 'error');
        }
    } catch (err) {
        console.error('加载奖惩列表异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

function renderRewards() {
    const tbody = document.getElementById('rewardTableBody');

    if (rewardData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px;">暂无数据</td></tr>';
    } else {
        tbody.innerHTML = rewardData.map(item => {
            const typeClass = item.type === '奖励' ? 'reward' : 'punishment';
            const statusClass = item.status === '已通过' ? 'success' :
                item.status === '待审核' ? 'warning' : 'danger';
            return `
            <tr>
                <td>${item.studentNo || ''}</td>
                <td><strong>${item.studentName || ''}</strong></td>
                <td>${item.majorName || ''} ${item.className || ''}</td>
                <td><span class="type-badge type-${typeClass}">${item.type || ''}</span></td>
                <td><span class="level-badge">${item.level || ''}</span></td>
                <td>${item.title || ''}</td>
                <td>${item.awardDate || ''}</td>
                <td>${item.issuingUnit || ''}</td>
                <td><span class="status-badge status-${statusClass}">${item.status || ''}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="editReward(${item.rpId})">编辑</button>
                        <button class="btn-action btn-delete" onclick="deleteReward(${item.rpId})">删除</button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    renderPagination();
}

function filterRewards() {
    currentPage = 1;
    loadRewardData();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('levelFilter').value = '';
    filterRewards();
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    let html = '';

    const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(currentPage * pageSize, totalRecords);
    html += `<span style="margin-right: 15px; color: #666;">显示 ${startRecord}-${endRecord} 条，共 ${totalRecords} 条</span>`;

    if (currentPage > 1) {
        html += `<button class="page-btn" onclick="changePage(${currentPage - 1})">上一页</button>`;
    }

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += '<span>...</span>';
        }
    }

    if (currentPage < totalPages) {
        html += `<button class="page-btn" onclick="changePage(${currentPage + 1})">下一页</button>`;
    }

    pagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    loadRewardData();
}

function showAddModal() {
    document.getElementById('modalTitle').textContent = '添加奖惩记录';
    document.getElementById('rewardForm').reset();
    document.querySelector('input[name="rpId"]').value = '';
    document.getElementById('levelSelect').innerHTML = '<option value="">请先选择类型</option>';
    const statusEl = document.querySelector('#rewardForm [name="status"]');
    if (statusEl) {
        statusEl.value = '待审核';
    }
    syncReviewFieldsByType();
    document.getElementById('rewardModal').classList.add('show');
}

function onTypeChange() {
    const type = document.getElementById('typeSelect').value;
    const levelSelect = document.getElementById('levelSelect');

    levelSelect.innerHTML = '<option value="">请选择级别</option>';

    if (type === '奖励') {
        rewardLevels.forEach(level => {
            const option = new Option(level, level);
            levelSelect.add(option);
        });
    } else if (type === '处分') {
        punishmentLevels.forEach(level => {
            const option = new Option(level, level);
            levelSelect.add(option);
        });
    }

    syncReviewFieldsByType();
}

function syncReviewFieldsByType() {
    const form = document.getElementById('rewardForm');
    if (!form) return;
    const type = form.querySelector('[name="type"]')?.value;
    const statusEl = form.querySelector('[name="status"]');
    const reviewCommentEl = form.querySelector('[name="reviewComment"]');

    if (type === '处分') {
        if (statusEl) {
            statusEl.value = '已通过';
            statusEl.disabled = true;
        }
        if (reviewCommentEl) {
            reviewCommentEl.value = '';
            reviewCommentEl.disabled = true;
        }
    } else {
        if (statusEl) {
            statusEl.disabled = false;
        }
        if (reviewCommentEl) {
            reviewCommentEl.disabled = false;
        }
    }
}

async function editReward(id) {
    try {
        const res = await authFetch(`http://localhost:8080/api/reward/${id}`, {
            method: 'GET'
        });
        const json = await res.json();

        if (json.code === 1 && json.data) {
            const item = json.data;
            document.getElementById('modalTitle').textContent = '编辑奖惩记录';
            const form = document.getElementById('rewardForm');

            form.querySelector('[name="rpId"]').value = item.rpId;
            form.querySelector('[name="studentId"]').value = item.studentId;
            form.querySelector('[name="type"]').value = item.type;

            // 触发类型变更事件以加载级别选项
            onTypeChange();

            setTimeout(() => {
                form.querySelector('[name="level"]').value = item.level;
            }, 100);

            form.querySelector('[name="title"]').value = item.title;
            form.querySelector('[name="awardDate"]').value = item.awardDate;
            form.querySelector('[name="issuingUnit"]').value = item.issuingUnit;
            form.querySelector('[name="certificateNo"]').value = item.certificateNo || '';
            form.querySelector('[name="cancelDate"]').value = item.cancelDate || '';
            form.querySelector('[name="reason"]').value = item.reason || '';
            form.querySelector('[name="remark"]').value = item.remark || '';
            const statusEl = form.querySelector('[name="status"]');
            if (statusEl) {
                statusEl.value = item.status || '待审核';
            }
            const reviewCommentEl = form.querySelector('[name="reviewComment"]');
            if (reviewCommentEl) {
                reviewCommentEl.value = item.reviewComment || '';
            }

            syncReviewFieldsByType();

            document.getElementById('rewardModal').classList.add('show');
        } else {
            showMessage(json.msg || '获取奖惩信息失败', 'error');
        }
    } catch (err) {
        console.error('获取奖惩信息异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

async function deleteReward(id) {
    if (!confirm('确定要删除该奖惩记录吗？')) {
        return;
    }

    try {
        const res = await authFetch(`http://localhost:8080/api/reward/delete/${id}`, {
            method: 'DELETE'
        });
        const json = await res.json();

        if (json.code === 1) {
            showMessage('删除成功', 'success');
            loadRewardData();
        } else {
            showMessage(json.msg || '删除失败', 'error');
        }
    } catch (err) {
        console.error('删除奖惩记录异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

function closeModal() {
    document.getElementById('rewardModal').classList.remove('show');
}

async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const isEdit = !!data.rpId;

    // 数据类型转换
    data.studentId = parseInt(data.studentId);

    // status 默认值兜底
    if (!data.status) {
        data.status = '待审核';
    }

    // 处分无需审核：前端兜底
    if (data.type === '处分') {
        data.status = '已通过';
        delete data.reviewComment;
    }

    // 删除空字段
    Object.keys(data).forEach(key => {
        if (data[key] === '' && key !== 'rpId') {
            delete data[key];
        }
    });

    if (isEdit) {
        data.rpId = parseInt(data.rpId);

        try {
            const res = await authFetch('http://localhost:8080/api/reward/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const json = await res.json();

            if (json.code === 1) {
                showMessage('更新成功', 'success');
                closeModal();
                loadRewardData();
            } else {
                showMessage(json.msg || '更新失败', 'error');
            }
        } catch (err) {
            console.error('更新奖惩记录异常:', err);
            showMessage('网络异常，请稍后重试', 'error');
        }
    } else {
        delete data.rpId;

        try {
            const res = await authFetch('http://localhost:8080/api/reward/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const json = await res.json();

            if (json.code === 1) {
                showMessage('添加成功', 'success');
                closeModal();
                loadRewardData();
            } else {
                showMessage(json.msg || '添加失败', 'error');
            }
        } catch (err) {
            console.error('添加奖惩记录异常:', err);
            showMessage('网络异常，请稍后重试', 'error');
        }
    }
}
