document.addEventListener('DOMContentLoaded', function () {
    initRewardPage();
});

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let rewardData = [];

const rewardLevels = ['国家级', '省级', '校级', '院级'];
const punishmentLevels = ['警告', '严重警告', '记过', '留校察看', '开除学籍'];

function initRewardPage() {
    document.getElementById('addRewardBtn').addEventListener('click', showAddModal);
    document.getElementById('searchInput').addEventListener('input', filterReward);
    document.getElementById('typeFilter').addEventListener('change', filterReward);
    document.getElementById('levelFilter').addEventListener('change', filterReward);
    document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);
    document.getElementById('rewardForm').addEventListener('submit', handleSubmit);
    document.getElementById('typeSelect').addEventListener('change', updateLevelOptions);

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

function updateLevelOptions() {
    const type = document.getElementById('typeSelect').value;
    const levelSelect = document.getElementById('levelSelect');
    levelSelect.innerHTML = '<option value="">请选择</option>';

    const levels = type === '奖励' ? rewardLevels : type === '处分' ? punishmentLevels : [];
    levels.forEach(level => {
        const option = new Option(level, level);
        levelSelect.add(option);
    });
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

function loadRewardData() {
    rewardData = generateMockReward(35);
    renderReward();
}

function generateMockReward(count) {
    const data = [];
    const rewardTitles = ['国家奖学金', '省级优秀学生', '校级三好学生', '院级优秀干部', '学习进步奖'];
    const punishmentTitles = ['违纪警告', '考试作弊', '旷课处分', '打架斗殴'];
    const units = ['教育部', '省教育厅', '学校', '学院', '系部'];
    const surnames = ['张', '李', '王', '刘', '陈'];
    const names = ['伟', '芳', '娜', '敏', '静'];

    for (let i = 1; i <= count; i++) {
        const type = Math.random() > 0.3 ? '奖励' : '处分';
        const level = type === '奖励' ?
            rewardLevels[Math.floor(Math.random() * rewardLevels.length)] :
            punishmentLevels[Math.floor(Math.random() * punishmentLevels.length)];

        data.push({
            rp_id: i,
            student_no: `2021${String(i).padStart(4, '0')}`,
            name: surnames[Math.floor(Math.random() * surnames.length)] +
                names[Math.floor(Math.random() * names.length)],
            type: type,
            level: level,
            title: type === '奖励' ?
                rewardTitles[Math.floor(Math.random() * rewardTitles.length)] :
                punishmentTitles[Math.floor(Math.random() * punishmentTitles.length)],
            issuing_unit: units[Math.floor(Math.random() * units.length)],
            award_date: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-15`
        });
    }
    return data;
}

function renderReward() {
    const tbody = document.getElementById('rewardTableBody');
    const filteredData = getFilteredReward();

    totalPages = Math.ceil(filteredData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = filteredData.slice(startIndex, endIndex);

    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">暂无数据</td></tr>';
    } else {
        tbody.innerHTML = pageData.map(item => {
            const typeClass = item.type === '奖励' ? 'reward' : 'punishment';
            return `
            <tr>
                <td>${item.student_no}</td>
                <td><strong>${item.name}</strong></td>
                <td><span class="type-badge type-${typeClass}">${item.type}</span></td>
                <td><span class="level-badge">${item.level}</span></td>
                <td>${item.title}</td>
                <td>${item.issuing_unit}</td>
                <td>${item.award_date}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewReward(${item.rp_id})">查看</button>
                        <button class="btn-action btn-edit" onclick="editReward(${item.rp_id})">编辑</button>
                        <button class="btn-action btn-delete" onclick="deleteReward(${item.rp_id})">删除</button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    renderPagination();
}

function getFilteredReward() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const levelFilter = document.getElementById('levelFilter').value;

    return rewardData.filter(item => {
        const matchSearch = !searchText ||
            item.student_no.toLowerCase().includes(searchText) ||
            item.name.toLowerCase().includes(searchText);
        const matchType = !typeFilter || item.type === typeFilter;
        const matchLevel = !levelFilter || item.level === levelFilter;

        return matchSearch && matchType && matchLevel;
    });
}

function filterReward() {
    currentPage = 1;
    renderReward();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('levelFilter').value = '';
    filterReward();
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
    renderReward();
}

function showAddModal() {
    document.getElementById('modalTitle').textContent = '添加奖惩记录';
    document.getElementById('rewardForm').reset();
    document.querySelector('input[name="rp_id"]').value = '';
    document.getElementById('levelSelect').innerHTML = '<option value="">请选择</option>';
    document.getElementById('rewardModal').classList.add('show');
}

function viewReward(id) {
    const item = rewardData.find(r => r.rp_id === id);
    if (item) {
        showMessage(`查看奖惩记录: ${item.title}`, 'info');
    }
}

function editReward(id) {
    const item = rewardData.find(r => r.rp_id === id);
    if (item) {
        document.getElementById('modalTitle').textContent = '编辑奖惩记录';
        const form = document.getElementById('rewardForm');
        form.querySelector('[name="rp_id"]').value = item.rp_id;
        form.querySelector('[name="type"]').value = item.type;
        updateLevelOptions();
        form.querySelector('[name="level"]').value = item.level;
        form.querySelector('[name="title"]').value = item.title;
        form.querySelector('[name="issuing_unit"]').value = item.issuing_unit;
        form.querySelector('[name="award_date"]').value = item.award_date;

        document.getElementById('rewardModal').classList.add('show');
    }
}

function deleteReward(id) {
    const item = rewardData.find(r => r.rp_id === id);
    if (item && confirm(`确定要删除 ${item.name} 的奖惩记录吗？`)) {
        rewardData = rewardData.filter(r => r.rp_id !== id);
        showMessage('删除成功', 'success');
        renderReward();
    }
}

function closeModal() {
    document.getElementById('rewardModal').classList.remove('show');
}

function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    if (data.rp_id) {
        const index = rewardData.findIndex(r => r.rp_id == data.rp_id);
        if (index !== -1) {
            rewardData[index] = { ...rewardData[index], ...data };
            showMessage('更新成功', 'success');
        }
    } else {
        data.rp_id = rewardData.length + 1;
        const studentSelect = document.getElementById('studentSelect');
        const studentText = studentSelect.options[studentSelect.selectedIndex].text;
        const [student_no, name] = studentText.split(' - ');
        data.student_no = student_no;
        data.name = name;

        rewardData.push(data);
        showMessage('添加成功', 'success');
    }

    closeModal();
    renderReward();
}

// 添加样式
const style = document.createElement('style');
style.textContent = `
    .type-reward {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
    }
    .type-punishment {
        background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
    }
    .level-badge {
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 500;
        background: rgba(102, 126, 234, 0.1);
        color: var(--primary-color);
    }
`;
document.head.appendChild(style);
