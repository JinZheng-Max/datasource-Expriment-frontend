document.addEventListener('DOMContentLoaded', function () {
    initStatusPage();
});

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let totalRecords = 0;
let statusData = [];
let allStudents = []; // 存储所有学生数据
let allMajors = []; // 存储所有专业数据

function initStatusPage() {
    // 检查登录态
    if (typeof checkAuth === 'function' && !checkAuth()) {
        return; // 未登录，已跳转到登录页
    }

    document.getElementById('addStatusBtn').addEventListener('click', showAddModal);
    document.getElementById('searchInput').addEventListener('input', filterStatus);
    document.getElementById('statusFilter').addEventListener('change', filterStatus);
    document.getElementById('gradeFilter').addEventListener('change', filterStatus);
    document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);
    document.getElementById('statusForm').addEventListener('submit', handleSubmit);

    // 添加联动筛选事件
    document.getElementById('filterGrade').addEventListener('change', updateStudentList);
    document.getElementById('filterMajor').addEventListener('change', updateStudentList);

    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    document.getElementById('statusModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });

    loadAllStudents();
    loadAllMajors();

    // 先初始化学籍信息，再加载数据
    initializeStatusData();

    if (typeof initUserMenu === 'function') {
        initUserMenu();
    }
    if (typeof initLogout === 'function') {
        initLogout();
    }
}

/**
 * 初始化学籍数据 - 为没有学籍记录的学生创建默认记录
 */
async function initializeStatusData() {
    try {
        const res = await authFetch('http://localhost:8080/api/status/initialize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const json = await res.json();

        if (json.code === 1) {
            console.log('学籍信息初始化完成');
        } else {
            console.error('初始化学籍失败:', json.msg);
        }
    } catch (err) {
        console.error('初始化学籍异常:', err);
    } finally {
        // 无论初始化成功与否，都加载数据
        loadStatusData();
    }
}

async function loadAllStudents() {
    try {
        const res = await authFetch('http://localhost:8080/api/student/list', {
            method: 'GET'
        });
        const json = await res.json();

        if (json.code === 1 && json.data) {
            allStudents = json.data;
        } else {
            console.error('加载学生失败:', json.msg);
            if (typeof showMessage === 'function') {
                showMessage(json.msg || '加载学生失败', 'error');
            }
        }
    } catch (err) {
        console.error('加载学生异常:', err);
        if (typeof showMessage === 'function') {
            showMessage('网络异常，请稍后重试', 'error');
        }
    }
}

async function loadAllMajors() {
    try {
        const res = await authFetch('http://localhost:8080/api/student/major', {
            method: 'GET'
        });
        const json = await res.json();

        if (json.code === 1 && json.data) {
            allMajors = json.data;
            // 初始化专业下拉框
            initMajorSelect();
        } else {
            console.error('加载专业失败:', json.msg);
            if (typeof showMessage === 'function') {
                showMessage(json.msg || '加载专业失败', 'error');
            }
        }
    } catch (err) {
        console.error('加载专业异常:', err);
        if (typeof showMessage === 'function') {
            showMessage('网络异常，请稍后重试', 'error');
        }
    }
}

async function loadStatusData() {
    try {
        const searchText = document.getElementById('searchInput').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const gradeFilter = document.getElementById('gradeFilter').value;

        const res = await authFetch('http://localhost:8080/api/status/page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                page: currentPage,
                pageSize: pageSize,
                name: searchText || '',
                status: statusFilter || '',
                grade: gradeFilter ? parseInt(gradeFilter) : null
            })
        });
        const json = await res.json();

        if (json.code === 1 && json.data) {
            const pageResult = json.data;
            statusData = pageResult.records || [];
            totalRecords = pageResult.total || 0;
            totalPages = Math.ceil(totalRecords / pageSize);
            renderStatus();
        } else {
            showMessage(json.msg || '加载学籍列表失败', 'error');
        }
    } catch (err) {
        console.error('加载学籍列表异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

function renderStatus() {
    const tbody = document.getElementById('statusTableBody');

    if (statusData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--text-secondary);">暂无数据</td></tr>';
    } else {
        tbody.innerHTML = statusData.map(item => {
            const statusClass = item.status === '在读' ? 'success' :
                item.status === '毕业' ? 'info' : 'warning';
            return `
            <tr>
                <td>${item.currentGrade ? '大' + item.currentGrade : ''}</td>
                <td>${item.majorName || ''}</td>
                <td>${item.className || ''}</td>
                <td>${item.studentNo || ''}</td>
                <td><strong>${item.name || ''}</strong></td>
                <td><span class="status-badge status-${statusClass}">${item.status || ''}</span></td>
                <td>${item.statusDate || ''}</td>
                <td>${item.reason || ''}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="editStatus(${item.statusId})">编辑</button>
                        <button class="btn-action btn-delete" onclick="deleteStatus(${item.statusId})">删除</button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    renderPagination();
}

function filterStatus() {
    currentPage = 1;
    loadStatusData();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('gradeFilter').value = '';
    filterStatus();
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    let html = '';

    const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(currentPage * pageSize, totalRecords);
    html += '<span style="margin-right: 15px; color: #666;">显示 ' + startRecord + '-' + endRecord + ' 条，共 ' + totalRecords + ' 条</span>';

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
    loadStatusData();
}

function showAddModal() {
    document.getElementById('modalTitle').textContent = '学籍变更';
    document.getElementById('statusForm').reset();
    document.querySelector('input[name="status_id"]').value = '';

    // 重置下拉框
    document.getElementById('filterGrade').value = '';
    document.getElementById('filterMajor').value = '';
    initMajorSelect(); // 重新初始化专业列表
    document.getElementById('studentSelect').innerHTML = '<option value="">请先选择年级和专业</option>';
    document.getElementById('studentSelect').disabled = true;

    document.getElementById('statusModal').classList.add('show');
}

async function editStatus(id) {
    try {
        const res = await authFetch(`http://localhost:8080/api/status/${id}`, {
            method: 'GET'
        });
        const json = await res.json();

        if (json.code === 1 && json.data) {
            const item = json.data;
            document.getElementById('modalTitle').textContent = '编辑学籍';
            const form = document.getElementById('statusForm');
            form.querySelector('[name="status_id"]').value = item.statusId;

            // 设置年级、专业和学生(编辑时需要联动加载)
            const student = allStudents.find(s => s.studentId === item.studentId);
            if (student) {
                // 设置年级
                document.getElementById('filterGrade').value = student.grade;

                // 设置专业
                setTimeout(() => {
                    document.getElementById('filterMajor').value = student.major;

                    // 触发学生列表更新
                    setTimeout(() => {
                        updateStudentList();

                        // 设置学生
                        setTimeout(() => {
                            form.querySelector('[name="student_id"]').value = item.studentId;
                        }, 100);
                    }, 100);
                }, 100);
            }

            form.querySelector('[name="status"]').value = item.status;
            form.querySelector('[name="status_date"]').value = item.statusDate;
            form.querySelector('[name="reason"]').value = item.reason || '';
            form.querySelector('[name="remark"]').value = item.remark || '';

            document.getElementById('statusModal').classList.add('show');
        } else {
            showMessage(json.msg || '获取学籍信息失败', 'error');
        }
    } catch (err) {
        console.error('获取学籍信息异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

async function deleteStatus(id) {
    if (!confirm('确定要删除该学籍记录吗？')) {
        return;
    }

    try {
        const res = await authFetch(`http://localhost:8080/api/status/delete/${id}`, {
            method: 'DELETE'
        });
        const json = await res.json();

        if (json.code === 1) {
            showMessage('删除成功', 'success');
            loadStatusData();
        } else {
            showMessage(json.msg || '删除失败', 'error');
        }
    } catch (err) {
        console.error('删除学籍异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

function closeModal() {
    document.getElementById('statusModal').classList.remove('show');
}

async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const isEdit = !!data.status_id;

    // 验证必填字段
    if (!data.status_date) {
        showMessage('请选择变更日期', 'error');
        return;
    }
    if (!data.student_id) {
        showMessage('请选择学生', 'error');
        return;
    }

    if (isEdit) {
        data.statusId = parseInt(data.status_id);
        delete data.status_id;
        data.studentId = parseInt(data.student_id);
        delete data.student_id;
        data.statusDate = data.status_date;
        delete data.status_date;

        // 删除空字段
        Object.keys(data).forEach(key => {
            if (data[key] === '' && key !== 'statusDate') {
                delete data[key];
            }
        });

        try {
            const res = await authFetch('http://localhost:8080/api/status/update', {
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
                loadStatusData();
            } else {
                showMessage(json.msg || '更新失败', 'error');
            }
        } catch (err) {
            console.error('更新学籍异常:', err);
            showMessage('网络异常，请稍后重试', 'error');
        }
    } else {
        delete data.status_id;
        data.studentId = parseInt(data.student_id);
        delete data.student_id;
        data.statusDate = data.status_date;
        delete data.status_date;

        // 删除空字段
        Object.keys(data).forEach(key => {
            if (data[key] === '' && key !== 'statusDate') {
                delete data[key];
            }
        });

        try {
            const res = await authFetch('http://localhost:8080/api/status/add', {
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
                loadStatusData();
            } else {
                showMessage(json.msg || '添加失败', 'error');
            }
        } catch (err) {
            console.error('添加学籍异常:', err);
            showMessage('网络异常，请稍后重试', 'error');
        }
    }
}

// 添加状态徽章样式
const style = document.createElement('style');
style.textContent = `
    .status-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
    }
    .status-success {
        background: rgba(56, 239, 125, 0.1);
        color: var(--success-color);
    }
    .status-warning {
        background: rgba(240, 147, 251, 0.1);
        color: var(--warning-color);
    }
    .status-info {
        background: rgba(102, 126, 234, 0.1);
        color: var(--primary-color);
    }
`;
document.head.appendChild(style);

/**
 * 初始化专业下拉框
 */
function initMajorSelect() {
    const majorSelect = document.getElementById('filterMajor');
    majorSelect.innerHTML = '<option value="">请选择专业</option>';

    allMajors.forEach(majorName => {
        const option = new Option(majorName, majorName);
        majorSelect.add(option);
    });
}

/**
 * 根据年级和专业更新学生列表
 */
function updateStudentList() {
    const selectedGrade = document.getElementById('filterGrade').value;
    const selectedMajor = document.getElementById('filterMajor').value;
    const studentSelect = document.getElementById('studentSelect');

    studentSelect.innerHTML = '<option value="">请选择学生</option>';

    // 如果年级和专业都未选择，禁用学生下拉框
    if (!selectedGrade && !selectedMajor) {
        studentSelect.disabled = true;
        studentSelect.innerHTML = '<option value="">请先选择年级和专业</option>';
        return;
    }

    // 如果只选择了其中一个，提示选择另一个
    if (!selectedGrade || !selectedMajor) {
        studentSelect.disabled = true;
        if (!selectedGrade) {
            studentSelect.innerHTML = '<option value="">请选择年级</option>';
        } else {
            studentSelect.innerHTML = '<option value="">请选择专业</option>';
        }
        return;
    }

    // 筛选符合年级和专业的学生
    const grade = parseInt(selectedGrade);
    const filteredStudents = allStudents.filter(student =>
        student.grade === grade && student.major === selectedMajor
    );

    if (filteredStudents.length > 0) {
        studentSelect.disabled = false;
        filteredStudents.forEach(student => {
            const option = new Option(
                `${student.studentNo} - ${student.name}`,
                student.studentId
            );
            studentSelect.add(option);
        });
    } else {
        studentSelect.disabled = true;
        studentSelect.innerHTML = '<option value="">该年级该专业暂无学生</option>';
    }
}
