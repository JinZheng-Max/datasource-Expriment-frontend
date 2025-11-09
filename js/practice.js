document.addEventListener('DOMContentLoaded', function () {
    initPracticePage();
});

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let practiceData = [];

function initPracticePage() {
    document.getElementById('addPracticeBtn').addEventListener('click', showAddModal);
    document.getElementById('searchInput').addEventListener('input', filterPractice);
    document.getElementById('typeFilter').addEventListener('change', filterPractice);
    document.getElementById('statusFilter').addEventListener('change', filterPractice);
    document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);
    document.getElementById('practiceForm').addEventListener('submit', handleSubmit);

    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    document.getElementById('practiceModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });

    loadStudents();
    loadPracticeData();

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
    const surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄'];
    const names = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊'];

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

function loadPracticeData() {
    practiceData = generateMockPractice(40);
    renderPractice();
}

function generateMockPractice(count) {
    const data = [];
    const types = ['志愿服务', '社会调查', '实习实践', '科技创新', '文体活动'];
    const activities = [
        '社区志愿服务', '敬老院关爱活动', '环保宣传', '支教活动', '市场调研',
        '企业实习', '创新创业大赛', '文艺汇演', '体育竞赛', '科技展览'
    ];
    const roles = ['志愿者', '队长', '组员', '负责人', '参与者'];
    const statuses = ['待审核', '已通过', '未通过'];
    const surnames = ['张', '李', '王', '刘', '陈'];
    const names = ['伟', '芳', '娜', '敏', '静'];

    for (let i = 1; i <= count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        data.push({
            record_id: i,
            student_no: `2021${String(i).padStart(4, '0')}`,
            name: surnames[Math.floor(Math.random() * surnames.length)] +
                names[Math.floor(Math.random() * names.length)],
            practice_name: activities[Math.floor(Math.random() * activities.length)],
            practice_type: type,
            role: roles[Math.floor(Math.random() * roles.length)],
            duration: (Math.random() * 40 + 10).toFixed(1),
            performance_score: (Math.random() * 20 + 80).toFixed(2),
            status: statuses[Math.floor(Math.random() * statuses.length)]
        });
    }
    return data;
}

function renderPractice() {
    const tbody = document.getElementById('practiceTableBody');
    const filteredData = getFilteredPractice();

    totalPages = Math.ceil(filteredData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = filteredData.slice(startIndex, endIndex);

    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--text-secondary);">暂无数据</td></tr>';
    } else {
        tbody.innerHTML = pageData.map(item => {
            const statusClass = item.status === '已通过' ? 'success' :
                item.status === '待审核' ? 'warning' : 'danger';
            return `
            <tr>
                <td>${item.student_no}</td>
                <td><strong>${item.name}</strong></td>
                <td>${item.practice_name}</td>
                <td><span class="type-badge type-${item.practice_type}">${item.practice_type}</span></td>
                <td>${item.role}</td>
                <td>${item.duration}h</td>
                <td><span class="score-badge">${item.performance_score}</span></td>
                <td><span class="status-badge status-${statusClass}">${item.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewPractice(${item.record_id})">查看</button>
                        <button class="btn-action btn-edit" onclick="editPractice(${item.record_id})">编辑</button>
                        <button class="btn-action btn-delete" onclick="deletePractice(${item.record_id})">删除</button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    renderPagination();
}

function getFilteredPractice() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    return practiceData.filter(item => {
        const matchSearch = !searchText ||
            item.student_no.toLowerCase().includes(searchText) ||
            item.name.toLowerCase().includes(searchText) ||
            item.practice_name.toLowerCase().includes(searchText);
        const matchType = !typeFilter || item.practice_type === typeFilter;
        const matchStatus = !statusFilter || item.status === statusFilter;

        return matchSearch && matchType && matchStatus;
    });
}

function filterPractice() {
    currentPage = 1;
    renderPractice();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('statusFilter').value = '';
    filterPractice();
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
    renderPractice();
}

function showAddModal() {
    document.getElementById('modalTitle').textContent = '添加实践记录';
    document.getElementById('practiceForm').reset();
    document.querySelector('input[name="record_id"]').value = '';
    document.getElementById('practiceModal').classList.add('show');
}

function viewPractice(id) {
    const item = practiceData.find(p => p.record_id === id);
    if (item) {
        showMessage(`查看实践记录: ${item.practice_name}`, 'info');
    }
}

function editPractice(id) {
    const item = practiceData.find(p => p.record_id === id);
    if (item) {
        document.getElementById('modalTitle').textContent = '编辑实践记录';
        const form = document.getElementById('practiceForm');
        form.querySelector('[name="record_id"]').value = item.record_id;
        form.querySelector('[name="practice_name"]').value = item.practice_name;
        form.querySelector('[name="practice_type"]').value = item.practice_type;
        form.querySelector('[name="role"]').value = item.role;
        form.querySelector('[name="duration"]').value = item.duration;
        form.querySelector('[name="performance_score"]').value = item.performance_score;
        form.querySelector('[name="status"]').value = item.status;

        document.getElementById('practiceModal').classList.add('show');
    }
}

function deletePractice(id) {
    const item = practiceData.find(p => p.record_id === id);
    if (item && confirm(`确定要删除 ${item.name} 的实践记录吗？`)) {
        practiceData = practiceData.filter(p => p.record_id !== id);
        showMessage('删除成功', 'success');
        renderPractice();
    }
}

function closeModal() {
    document.getElementById('practiceModal').classList.remove('show');
}

function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    if (data.record_id) {
        const index = practiceData.findIndex(p => p.record_id == data.record_id);
        if (index !== -1) {
            practiceData[index] = { ...practiceData[index], ...data };
            showMessage('更新成功', 'success');
        }
    } else {
        data.record_id = practiceData.length + 1;
        const studentSelect = document.getElementById('studentSelect');
        const studentText = studentSelect.options[studentSelect.selectedIndex].text;
        const [student_no, name] = studentText.split(' - ');
        data.student_no = student_no;
        data.name = name;

        practiceData.push(data);
        showMessage('添加成功', 'success');
    }

    closeModal();
    renderPractice();
}

// 添加样式
const style = document.createElement('style');
style.textContent = `
    .type-badge {
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 500;
    }
    .type-志愿服务 {
        background: rgba(102, 126, 234, 0.1);
        color: #667eea;
    }
    .type-社会调查 {
        background: rgba(240, 147, 251, 0.1);
        color: #f093fb;
    }
    .type-实习实践 {
        background: rgba(56, 239, 125, 0.1);
        color: #38ef7d;
    }
    .type-科技创新 {
        background: rgba(79, 172, 254, 0.1);
        color: #4facfe;
    }
    .type-文体活动 {
        background: rgba(250, 112, 154, 0.1);
        color: #fa709a;
    }
    .score-badge {
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        color: white;
    }
    .status-danger {
        background: rgba(250, 112, 154, 0.1);
        color: var(--danger-color);
    }
`;
document.head.appendChild(style);
