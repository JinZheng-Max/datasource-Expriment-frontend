document.addEventListener('DOMContentLoaded', function () {
    initPracticePage();
});

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let totalRecords = 0;
let practiceRecords = [];
let allStudents = [];
let allActivities = [];

function initPracticePage() {
    if (typeof checkAuth === 'function' && !checkAuth()) {
        return;
    }

    // 确保按钮存在后再绑定事件
    const manageActivitiesBtn = document.getElementById('manageActivitiesBtn');
    const addRecordBtn = document.getElementById('addRecordBtn');
    const addActivityBtn = document.getElementById('addActivityBtn');

    if (manageActivitiesBtn) {
        console.log('绑定活动管理按钮事件');
        manageActivitiesBtn.addEventListener('click', showActivityModal);
    } else {
        console.error('找不到 manageActivitiesBtn 按钮');
    }

    if (addRecordBtn) {
        addRecordBtn.addEventListener('click', showAddRecordModal);
    } else {
        console.error('找不到 addRecordBtn 按钮');
    }

    if (addActivityBtn) {
        addActivityBtn.addEventListener('click', showAddActivityModal);
    } else {
        console.error('找不到 addActivityBtn 按钮');
    }

    document.getElementById('searchInput').addEventListener('input', filterRecords);
    document.getElementById('typeFilter').addEventListener('change', filterRecords);
    document.getElementById('statusFilter').addEventListener('change', filterRecords);
    document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);
    document.getElementById('recordForm').addEventListener('submit', handleRecordSubmit);
    document.getElementById('activityForm').addEventListener('submit', handleActivitySubmit);

    const closeButtons = document.querySelectorAll('.modal-close');
    console.log('找到关闭按钮数量:', closeButtons.length);
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            console.log('关闭按钮被点击');
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
            }
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });

    loadStudents();
    loadActivities();
    loadPracticeRecords();

    if (typeof initUserMenu === 'function') {
        initUserMenu();
    }
    if (typeof initLogout === 'function') {
        initLogout();
    }
}

async function loadStudents() {
    try {
        const res = await authFetch('http://localhost:8080/api/student/list');
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

async function loadActivities() {
    try {
        const res = await authFetch('http://localhost:8080/api/practice/activity/list');
        const json = await res.json();

        if (json.code === 1 && json.data) {
            allActivities = json.data;
            const practiceSelect = document.getElementById('practiceSelect');
            practiceSelect.innerHTML = '<option value="">请选择活动</option>';

            allActivities.forEach(activity => {
                const option = new Option(activity.practiceName, activity.practiceId);
                practiceSelect.add(option);
            });
        }
    } catch (err) {
        console.error('加载活动列表异常:', err);
    }
}

async function loadPracticeRecords() {
    try {
        const searchText = document.getElementById('searchInput').value;
        const practiceType = document.getElementById('typeFilter').value;
        const status = document.getElementById('statusFilter').value;

        const res = await authFetch('http://localhost:8080/api/practice/record/page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                page: currentPage,
                pageSize: pageSize,
                name: searchText || '',
                practiceType: practiceType || '',
                status: status || ''
            })
        });
        const json = await res.json();

        if (json.code === 1 && json.data) {
            const pageResult = json.data;
            practiceRecords = pageResult.records || [];
            totalRecords = pageResult.total || 0;
            totalPages = Math.ceil(totalRecords / pageSize);
            renderPracticeRecords();
        } else {
            showMessage(json.msg || '加载实践记录失败', 'error');
        }
    } catch (err) {
        console.error('加载实践记录异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

function renderPracticeRecords() {
    const tbody = document.getElementById('practiceTableBody');

    if (practiceRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px;">暂无数据</td></tr>';
    } else {
        tbody.innerHTML = practiceRecords.map(item => {
            const statusClass = item.status === '已通过' ? 'success' :
                item.status === '待审核' ? 'warning' : 'danger';
            return `
            <tr>
                <td>${item.studentNo || ''}</td>
                <td><strong>${item.studentName || ''}</strong></td>
                <td>${item.practiceName || ''}</td>
                <td><span class="type-badge type-${item.practiceType}">${item.practiceType || ''}</span></td>
                <td>${item.organizer || ''}</td>
                <td>${item.role || '-'}</td>
                <td>${item.duration || '-'}</td>
                <td>${item.performanceScore || '-'}</td>
                <td><span class="status-badge status-${statusClass}">${item.status || ''}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="editRecord(${item.recordId})">编辑</button>
                        <button class="btn-action btn-delete" onclick="deleteRecord(${item.recordId})">删除</button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    renderPagination();
}

function filterRecords() {
    currentPage = 1;
    loadPracticeRecords();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('statusFilter').value = '';
    filterRecords();
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
    loadPracticeRecords();
}

function showAddRecordModal() {
    document.getElementById('recordModalTitle').textContent = '添加参与记录';
    document.getElementById('recordForm').reset();
    document.querySelector('input[name="recordId"]').value = '';
    document.getElementById('recordModal').classList.add('show');
}

async function editRecord(id) {
    try {
        const res = await authFetch(`http://localhost:8080/api/practice/record/${id}`);
        const json = await res.json();

        if (json.code === 1 && json.data) {
            const item = json.data;
            document.getElementById('recordModalTitle').textContent = '编辑参与记录';
            const form = document.getElementById('recordForm');

            form.querySelector('[name="recordId"]').value = item.recordId;
            form.querySelector('[name="studentId"]').value = item.studentId;
            form.querySelector('[name="practiceId"]').value = item.practiceId;
            form.querySelector('[name="role"]').value = item.role || '';
            form.querySelector('[name="duration"]').value = item.duration || '';
            form.querySelector('[name="performanceScore"]').value = item.performanceScore || '';
            form.querySelector('[name="status"]').value = item.status;
            form.querySelector('[name="evaluation"]').value = item.evaluation || '';

            document.getElementById('recordModal').classList.add('show');
        } else {
            showMessage(json.msg || '获取记录信息失败', 'error');
        }
    } catch (err) {
        console.error('获取记录信息异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

async function deleteRecord(id) {
    if (!confirm('确定要删除该参与记录吗？')) {
        return;
    }

    try {
        const res = await authFetch(`http://localhost:8080/api/practice/record/delete/${id}`, {
            method: 'DELETE'
        });
        const json = await res.json();

        if (json.code === 1) {
            showMessage('删除成功', 'success');
            loadPracticeRecords();
        } else {
            showMessage(json.msg || '删除失败', 'error');
        }
    } catch (err) {
        console.error('删除记录异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

async function handleRecordSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const isEdit = !!data.recordId;

    data.studentId = parseInt(data.studentId);
    data.practiceId = parseInt(data.practiceId);
    if (data.duration) data.duration = parseFloat(data.duration);
    if (data.performanceScore) data.performanceScore = parseFloat(data.performanceScore);

    Object.keys(data).forEach(key => {
        if (data[key] === '' && key !== 'recordId') {
            delete data[key];
        }
    });

    if (isEdit) {
        data.recordId = parseInt(data.recordId);

        try {
            const res = await authFetch('http://localhost:8080/api/practice/record/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const json = await res.json();

            if (json.code === 1) {
                showMessage('更新成功', 'success');
                document.getElementById('recordModal').classList.remove('show');
                loadPracticeRecords();
            } else {
                showMessage(json.msg || '更新失败', 'error');
            }
        } catch (err) {
            console.error('更新记录异常:', err);
            showMessage('网络异常，请稍后重试', 'error');
        }
    } else {
        delete data.recordId;

        try {
            const res = await authFetch('http://localhost:8080/api/practice/record/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const json = await res.json();

            if (json.code === 1) {
                showMessage('添加成功', 'success');
                document.getElementById('recordModal').classList.remove('show');
                loadPracticeRecords();
            } else {
                showMessage(json.msg || '添加失败', 'error');
            }
        } catch (err) {
            console.error('添加记录异常:', err);
            showMessage('网络异常，请稍后重试', 'error');
        }
    }
}

async function showActivityModal() {
    console.log('showActivityModal 被调用');
    try {
        const res = await authFetch('http://localhost:8080/api/practice/activity/list');
        const json = await res.json();

        console.log('活动列表响应:', json);

        if (json.code === 1 && json.data) {
            const activities = json.data;
            const tbody = document.getElementById('activityTableBody');

            if (!tbody) {
                console.error('找不到 activityTableBody 元素');
                return;
            }

            if (activities.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">暂无活动</td></tr>';
            } else {
                tbody.innerHTML = activities.map(item => `
                    <tr>
                        <td><strong>${item.practiceName || ''}</strong></td>
                        <td>${item.practiceType || ''}</td>
                        <td>${item.organizer || ''}</td>
                        <td>${item.startDate || ''}</td>
                        <td>${item.endDate || ''}</td>
                        <td>
                            <button class="btn-action btn-edit" onclick="editActivity(${item.practiceId})">编辑</button>
                            <button class="btn-action btn-delete" onclick="deleteActivity(${item.practiceId})">删除</button>
                        </td>
                    </tr>
                `).join('');
            }

            const activityModal = document.getElementById('activityModal');
            if (activityModal) {
                console.log('显示活动管理模态框');
                activityModal.classList.add('show');
            } else {
                console.error('找不到 activityModal 元素');
            }
        } else {
            showMessage(json.msg || '加载活动列表失败', 'error');
        }
    } catch (err) {
        console.error('加载活动列表异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

function showAddActivityModal() {
    console.log('showAddActivityModal 被调用');
    document.getElementById('activityModalTitle').textContent = '添加活动';
    document.getElementById('activityForm').reset();
    const practiceIdInput = document.querySelector('input[name="practiceId"]');
    if (practiceIdInput) {
        practiceIdInput.value = '';
    }

    const activityEditModal = document.getElementById('activityEditModal');
    if (activityEditModal) {
        console.log('显示活动编辑模态框');
        activityEditModal.classList.add('show');
    } else {
        console.error('找不到 activityEditModal 元素');
    }
}

async function editActivity(id) {
    try {
        const res = await authFetch(`http://localhost:8080/api/practice/activity/${id}`);
        const json = await res.json();

        if (json.code === 1 && json.data) {
            const item = json.data;
            document.getElementById('activityModalTitle').textContent = '编辑活动';
            const form = document.getElementById('activityForm');

            form.querySelector('[name="practiceId"]').value = item.practiceId;
            form.querySelector('[name="practiceName"]').value = item.practiceName;
            form.querySelector('[name="practiceType"]').value = item.practiceType;
            form.querySelector('[name="organizer"]').value = item.organizer || '';
            form.querySelector('[name="startDate"]').value = item.startDate || '';
            form.querySelector('[name="endDate"]').value = item.endDate || '';
            form.querySelector('[name="description"]').value = item.description || '';

            document.getElementById('activityEditModal').classList.add('show');
        } else {
            showMessage(json.msg || '获取活动信息失败', 'error');
        }
    } catch (err) {
        console.error('获取活动信息异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

async function deleteActivity(id) {
    if (!confirm('确定要删除该活动吗？删除后相关参与记录也将无法关联！')) {
        return;
    }

    try {
        const res = await authFetch(`http://localhost:8080/api/practice/activity/delete/${id}`, {
            method: 'DELETE'
        });
        const json = await res.json();

        if (json.code === 1) {
            showMessage('删除成功', 'success');
            showActivityModal();
            loadActivities();
        } else {
            showMessage(json.msg || '删除失败', 'error');
        }
    } catch (err) {
        console.error('删除活动异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

async function handleActivitySubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const isEdit = !!data.practiceId;

    Object.keys(data).forEach(key => {
        if (data[key] === '' && key !== 'practiceId') {
            delete data[key];
        }
    });

    if (isEdit) {
        data.practiceId = parseInt(data.practiceId);

        try {
            const res = await authFetch('http://localhost:8080/api/practice/activity/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const json = await res.json();

            if (json.code === 1) {
                showMessage('更新成功', 'success');
                document.getElementById('activityEditModal').classList.remove('show');
                showActivityModal();
                loadActivities();
            } else {
                showMessage(json.msg || '更新失败', 'error');
            }
        } catch (err) {
            console.error('更新活动异常:', err);
            showMessage('网络异常，请稍后重试', 'error');
        }
    } else {
        delete data.practiceId;

        try {
            const res = await authFetch('http://localhost:8080/api/practice/activity/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const json = await res.json();

            if (json.code === 1) {
                showMessage('添加成功', 'success');
                document.getElementById('activityEditModal').classList.remove('show');
                showActivityModal();
                loadActivities();
            } else {
                showMessage(json.msg || '添加失败', 'error');
            }
        } catch (err) {
            console.error('添加活动异常:', err);
            showMessage('网络异常，请稍后重试', 'error');
        }
    }
}
