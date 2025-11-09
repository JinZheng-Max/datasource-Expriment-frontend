document.addEventListener('DOMContentLoaded', function () {
    initStatusPage();
});

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let statusData = [];

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

    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    document.getElementById('statusModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });

    loadStudents();
    loadMajors();
    loadStatusData();

    if (typeof initUserMenu === 'function') {
        initUserMenu();
    }
    if (typeof initLogout === 'function') {
        initLogout();
    }
}

function loadStudents() {
    const students = generateMockStudents(50);
    const studentSelect = document.getElementById('studentSelect');

    students.forEach(student => {
        const option = new Option(`${student.student_no} - ${student.name}`, student.student_id);
        studentSelect.add(option);
    });
}

function generateMockStudents(count) {
    const students = [];
    const surnames = ['张', '李', '王', '刘', '陈'];
    const names = ['伟', '芳', '娜', '敏', '静'];

    for (let i = 1; i <= count; i++) {
        students.push({
            student_id: i,
            student_no: `2021${String(i).padStart(4, '0')}`,
            name: surnames[Math.floor(Math.random() * surnames.length)] +
                names[Math.floor(Math.random() * names.length)]
        });
    }
    return students;
}

async function loadMajors() {
    try {
        const token = localStorage.getItem('authentication');
        const res = await fetch('http://localhost:8080/api/student/major', {
            method: 'GET',
            headers: {
                'authentication': token || ''
            }
        });
        const json = await res.json();
        
        if (json.code === 1 && json.data) {
            const majors = json.data; // 返回的是 List<String>
            const majorSelect = document.getElementById('majorSelect');
            
            majors.forEach(majorName => {
                const option = new Option(majorName, majorName);
                majorSelect.add(option);
            });
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

function loadStatusData() {
    statusData = generateMockStatus(30);
    renderStatus();
}

function generateMockStatus(count) {
    const data = [];
    const statuses = ['在读', '休学', '退学', '毕业'];
    const majors = ['计算机科学与技术', '软件工程', '数据科学'];
    const surnames = ['张', '李', '王', '刘', '陈'];
    const names = ['伟', '芳', '娜', '敏', '静'];

    for (let i = 1; i <= count; i++) {
        const grade = Math.floor(Math.random() * 4) + 1;
        data.push({
            status_id: i,
            student_no: `2021${String(i).padStart(4, '0')}`,
            name: surnames[Math.floor(Math.random() * surnames.length)] +
                names[Math.floor(Math.random() * names.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            current_grade: grade,
            major_name: majors[Math.floor(Math.random() * majors.length)],
            status_date: `2024-0${Math.floor(Math.random() * 9) + 1}-15`,
            reason: '学业正常' + (Math.random() > 0.7 ? ' / 个人原因' : '')
        });
    }
    return data;
}

function renderStatus() {
    const tbody = document.getElementById('statusTableBody');
    const filteredData = getFilteredStatus();

    totalPages = Math.ceil(filteredData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = filteredData.slice(startIndex, endIndex);

    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">暂无数据</td></tr>';
    } else {
        tbody.innerHTML = pageData.map(item => {
            const statusClass = item.status === '在读' ? 'success' :
                item.status === '毕业' ? 'info' : 'warning';
            return `
            <tr>
                <td>${item.student_no}</td>
                <td><strong>${item.name}</strong></td>
                <td><span class="status-badge status-${statusClass}">${item.status}</span></td>
                <td>大${item.current_grade}</td>
                <td>${item.major_name}</td>
                <td>${item.status_date}</td>
                <td>${item.reason}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="editStatus(${item.status_id})">编辑</button>
                        <button class="btn-action btn-delete" onclick="deleteStatus(${item.status_id})">删除</button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    renderPagination();
}

function getFilteredStatus() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const gradeFilter = document.getElementById('gradeFilter').value;

    return statusData.filter(item => {
        const matchSearch = !searchText ||
            item.student_no.toLowerCase().includes(searchText) ||
            item.name.toLowerCase().includes(searchText);
        const matchStatus = !statusFilter || item.status === statusFilter;
        const matchGrade = !gradeFilter || item.current_grade.toString() === gradeFilter;

        return matchSearch && matchStatus && matchGrade;
    });
}

function filterStatus() {
    currentPage = 1;
    renderStatus();
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
    renderStatus();
}

function showAddModal() {
    document.getElementById('modalTitle').textContent = '学籍变更';
    document.getElementById('statusForm').reset();
    document.querySelector('input[name="status_id"]').value = '';
    document.getElementById('statusModal').classList.add('show');
}

function editStatus(id) {
    const item = statusData.find(s => s.status_id === id);
    if (item) {
        document.getElementById('modalTitle').textContent = '编辑学籍';
        const form = document.getElementById('statusForm');
        form.querySelector('[name="status_id"]').value = item.status_id;
        form.querySelector('[name="status"]').value = item.status;
        form.querySelector('[name="status_date"]').value = item.status_date;
        form.querySelector('[name="current_grade"]').value = item.current_grade;
        form.querySelector('[name="reason"]').value = item.reason;

        document.getElementById('statusModal').classList.add('show');
    }
}

function deleteStatus(id) {
    const item = statusData.find(s => s.status_id === id);
    if (item && confirm(`确定要删除 ${item.name} 的学籍记录吗？`)) {
        statusData = statusData.filter(s => s.status_id !== id);
        showMessage('删除成功', 'success');
        renderStatus();
    }
}

function closeModal() {
    document.getElementById('statusModal').classList.remove('show');
}

function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    if (data.status_id) {
        const index = statusData.findIndex(s => s.status_id == data.status_id);
        if (index !== -1) {
            statusData[index] = { ...statusData[index], ...data };
            showMessage('更新成功', 'success');
        }
    } else {
        data.status_id = statusData.length + 1;
        const studentSelect = document.getElementById('studentSelect');
        const studentText = studentSelect.options[studentSelect.selectedIndex].text;
        const [student_no, name] = studentText.split(' - ');
        data.student_no = student_no;
        data.name = name;

        const majorSelect = document.getElementById('majorSelect');
        data.major_name = majorSelect.options[majorSelect.selectedIndex].text;

        statusData.push(data);
        showMessage('添加成功', 'success');
    }

    closeModal();
    renderStatus();
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
