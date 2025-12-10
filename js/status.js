document.addEventListener('DOMContentLoaded', function () {
    initStatusPage();
});

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let totalRecords = 0;
let statusData = [];
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
    document.getElementById('studentSelect').addEventListener('change', loadStudentStatus);

    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    document.getElementById('statusModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });

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

    // 新增模式：启用年级、专业、学生选择
    document.getElementById('filterGrade').disabled = false;
    document.getElementById('filterMajor').disabled = false;
    document.getElementById('studentSelect').disabled = true; // 等选择年级专业后才启用

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

            // 直接使用后端返回的数据回显年级、专业、学生
            if (item.currentGrade && item.majorName && item.name) {
                // 设置年级
                document.getElementById('filterGrade').value = item.currentGrade;
                
                // 重新初始化专业下拉框并设置专业
                initMajorSelect();
                document.getElementById('filterMajor').value = item.majorName;
                
                // 编辑模式下，直接设置当前学生到下拉框（不依赖updateStudentList筛选）
                const studentSelect = document.getElementById('studentSelect');
                studentSelect.innerHTML = `<option value="${item.studentId}">${item.studentNo} - ${item.name}</option>`;
                studentSelect.value = item.studentId;
                
                // 编辑模式：禁用年级、专业、学生选择（不允许修改）
                document.getElementById('filterGrade').disabled = true;
                document.getElementById('filterMajor').disabled = true;
                document.getElementById('studentSelect').disabled = true;
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
    
    // 编辑模式下，临时启用被禁用的字段以便提交数据
    const gradeSelect = document.getElementById('filterGrade');
    const majorSelect = document.getElementById('filterMajor');
    const studentSelect = document.getElementById('studentSelect');
    const wasGradeDisabled = gradeSelect.disabled;
    const wasMajorDisabled = majorSelect.disabled;
    const wasStudentDisabled = studentSelect.disabled;
    
    if (wasGradeDisabled) gradeSelect.disabled = false;
    if (wasMajorDisabled) majorSelect.disabled = false;
    if (wasStudentDisabled) studentSelect.disabled = false;
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    // 验证必填字段
    if (!data.status_date) {
        showMessage('请选择变更日期', 'error');
        return;
    }
    if (!data.student_id) {
        showMessage('请选择学生', 'error');
        return;
    }
    if (!data.status_id) {
        showMessage('未找到学籍记录', 'error');
        return;
    }

    // 统一使用 update 接口
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
            showMessage('学籍变更成功', 'success');
            closeModal();
            loadStatusData();
        } else {
            showMessage(json.msg || '学籍变更失败', 'error');
        }
    } catch (err) {
        console.error('学籍变更异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
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
 * 加载选中学生的学籍信息
 */
async function loadStudentStatus() {
    const studentId = document.getElementById('studentSelect').value;
    if (!studentId) {
        document.querySelector('input[name="status_id"]').value = '';
        return;
    }

    try {
        const res = await authFetch(`http://localhost:8080/api/status/student/${studentId}`, {
            method: 'GET'
        });
        const json = await res.json();

        if (json.code === 1 && json.data) {
            const status = json.data;
            // 设置学籍ID到隐藏字段
            document.querySelector('input[name="status_id"]').value = status.statusId;
            // 回显当前学籍信息
            document.querySelector('[name="status"]').value = status.status;
            document.querySelector('[name="status_date"]').value = status.statusDate;
            document.querySelector('[name="reason"]').value = status.reason || '';
            document.querySelector('[name="remark"]').value = status.remark || '';
        } else {
            showMessage('未找到该学生的学籍记录', 'error');
        }
    } catch (err) {
        console.error('加载学籍信息异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

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
async function updateStudentList() {
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

    // 调用后端接口根据年级和专业查询学生
    try {
        const grade = parseInt(selectedGrade);
        const res = await authFetch(`http://localhost:8080/api/student/list/by-grade-major?grade=${grade}&majorName=${encodeURIComponent(selectedMajor)}`, {
            method: 'GET'
        });
        const json = await res.json();

        if (json.code === 1 && json.data) {
            const filteredStudents = json.data;
            
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
        } else {
            studentSelect.disabled = true;
            studentSelect.innerHTML = '<option value="">加载学生失败</option>';
        }
    } catch (err) {
        console.error('查询学生列表异常:', err);
        studentSelect.disabled = true;
        studentSelect.innerHTML = '<option value="">网络异常</option>';
    }
}
