document.addEventListener('DOMContentLoaded', function () {
    initScorePage();
});

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let totalRecords = 0;
let scoreData = [];
let allStudents = [];
let allCourses = [];

// 学期映射表
const semesterMap = {
    1: '第一学期',
    2: '第二学期',
    3: '第三学期',
    4: '第四学期',
    5: '第五学期',
    6: '第六学期',
    7: '第七学期',
    8: '第八学期'
};

function initScorePage() {
    if (typeof checkAuth === 'function' && !checkAuth()) {
        return;
    }

    document.getElementById('addScoreBtn').addEventListener('click', showAddScoreModal);
    document.getElementById('searchInput').addEventListener('input', filterScores);
    document.getElementById('semesterFilter').addEventListener('change', filterScores);
    document.getElementById('courseFilter').addEventListener('change', filterScores);
    document.getElementById('passFilter').addEventListener('change', filterScores);
    document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);
    document.getElementById('scoreForm').addEventListener('submit', handleScoreSubmit);

    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            this.closest('.modal').classList.remove('show');
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
    loadCourses();
    loadScores();

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
            const select = document.getElementById('studentSelect');
            select.innerHTML = '<option value="">请选择学生</option>';
            allStudents.forEach(student => {
                const option = new Option(`${student.studentNo} - ${student.name}`, student.studentId);
                select.add(option);
            });
        }
    } catch (err) {
        console.error('加载学生列表异常:', err);
    }
}

async function loadCourses() {
    try {
        const res = await authFetch('http://localhost:8080/api/course/list');
        const json = await res.json();

        if (json.code === 1 && json.data) {
            allCourses = json.data;

            const filterSelect = document.getElementById('courseFilter');
            filterSelect.innerHTML = '<option value="">全部课程</option>';
            allCourses.forEach(course => {
                const option = new Option(course.courseName, course.courseId);
                filterSelect.add(option);
            });

            const formSelect = document.getElementById('courseSelect');
            formSelect.innerHTML = '<option value="">请选择课程</option>';
            allCourses.forEach(course => {
                const option = new Option(`${course.courseCode} - ${course.courseName}`, course.courseId);
                formSelect.add(option);
            });
        }
    } catch (err) {
        console.error('加载课程列表异常:', err);
    }
}

async function loadScores() {
    try {
        const searchText = document.getElementById('searchInput').value;
        const semesterId = document.getElementById('semesterFilter').value;
        const courseId = document.getElementById('courseFilter').value;
        const isPass = document.getElementById('passFilter').value;

        const res = await authFetch('http://localhost:8080/api/score/page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                page: currentPage,
                pageSize: pageSize,
                name: searchText || '',
                semesterId: semesterId ? parseInt(semesterId) : null,
                courseId: courseId ? parseInt(courseId) : null,
                isPass: isPass !== '' ? (isPass === 'true') : null
            })
        });
        const json = await res.json();

        if (json.code === 1 && json.data) {
            const pageResult = json.data;
            scoreData = pageResult.records || [];
            totalRecords = pageResult.total || 0;
            totalPages = Math.ceil(totalRecords / pageSize);
            renderScores();
        } else {
            showMessage(json.msg || '加载成绩列表失败', 'error');
        }
    } catch (err) {
        console.error('加载成绩列表异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

function renderScores() {
    const tbody = document.getElementById('scoreTableBody');

    if (scoreData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 40px;">暂无数据</td></tr>';
    } else {
        tbody.innerHTML = scoreData.map(item => {
            const passClass = item.isPass ? 'success' : 'danger';
            const semesterName = semesterMap[item.semesterId] || `第${item.semesterId}学期`;
            return `
            <tr>
                <td>${item.studentNo || ''}</td>
                <td><strong>${item.studentName || ''}</strong></td>
                <td><span class="semester-tag">${semesterName}</span></td>
                <td>${item.courseName || ''}</td>
                <td>${item.credits || ''}</td>
                <td>${item.regularScore || '-'}</td>
                <td>${item.midtermScore || '-'}</td>
                <td>${item.finalScore || '-'}</td>
                <td><strong>${item.totalScore || ''}</strong></td>
                <td>${item.gradePoint || '-'}</td>
                <td><span class="status-badge status-${passClass}">${item.isPass ? '通过' : '未通过'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="editScore(${item.scoreId})">编辑</button>
                        <button class="btn-action btn-delete" onclick="deleteScore(${item.scoreId})">删除</button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    renderPagination();
}

function filterScores() {
    currentPage = 1;
    loadScores();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('semesterFilter').value = '';
    document.getElementById('courseFilter').value = '';
    document.getElementById('passFilter').value = '';
    filterScores();
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
    loadScores();
}

function showAddScoreModal() {
    document.getElementById('modalTitle').textContent = '录入成绩';
    document.getElementById('scoreForm').reset();
    document.querySelector('input[name="scoreId"]').value = '';
    document.getElementById('scoreModal').classList.add('show');
}

async function editScore(id) {
    try {
        const res = await authFetch(`http://localhost:8080/api/score/${id}`);
        const json = await res.json();

        if (json.code === 1 && json.data) {
            const item = json.data;
            document.getElementById('modalTitle').textContent = '编辑成绩';
            const form = document.getElementById('scoreForm');

            form.querySelector('[name="scoreId"]').value = item.scoreId;
            form.querySelector('[name="studentId"]').value = item.studentId;
            form.querySelector('[name="semesterId"]').value = item.semesterId;
            form.querySelector('[name="courseId"]').value = item.courseId;
            form.querySelector('[name="regularScore"]').value = item.regularScore || '';
            form.querySelector('[name="midtermScore"]').value = item.midtermScore || '';
            form.querySelector('[name="finalScore"]').value = item.finalScore || '';
            form.querySelector('[name="totalScore"]').value = item.totalScore;
            form.querySelector('[name="gradePoint"]').value = item.gradePoint || '';
            form.querySelector('[name="status"]').value = item.status;
            form.querySelector('[name="isPass"]').value = item.isPass ? 'true' : 'false';
            form.querySelector('[name="teacherName"]').value = item.teacherName || '';
            form.querySelector('[name="remark"]').value = item.remark || '';

            document.getElementById('scoreModal').classList.add('show');
        } else {
            showMessage(json.msg || '获取成绩信息失败', 'error');
        }
    } catch (err) {
        console.error('获取成绩信息异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

async function deleteScore(id) {
    if (!confirm('确定要删除该成绩记录吗？')) {
        return;
    }

    try {
        const res = await authFetch(`http://localhost:8080/api/score/delete/${id}`, {
            method: 'DELETE'
        });
        const json = await res.json();

        if (json.code === 1) {
            showMessage('删除成功', 'success');
            loadScores();
        } else {
            showMessage(json.msg || '删除失败', 'error');
        }
    } catch (err) {
        console.error('删除成绩异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

async function handleScoreSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const isEdit = !!data.scoreId;

    data.studentId = parseInt(data.studentId);
    data.courseId = parseInt(data.courseId);
    data.semesterId = parseInt(data.semesterId);
    if (data.regularScore) data.regularScore = parseFloat(data.regularScore);
    if (data.midtermScore) data.midtermScore = parseFloat(data.midtermScore);
    if (data.finalScore) data.finalScore = parseFloat(data.finalScore);
    data.totalScore = parseFloat(data.totalScore);
    if (data.gradePoint) data.gradePoint = parseFloat(data.gradePoint);
    data.isPass = data.isPass === 'true';

    Object.keys(data).forEach(key => {
        if (data[key] === '' && key !== 'scoreId' && key !== 'totalScore') {
            delete data[key];
        }
    });

    if (isEdit) {
        data.scoreId = parseInt(data.scoreId);

        try {
            const res = await authFetch('http://localhost:8080/api/score/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const json = await res.json();

            if (json.code === 1) {
                showMessage('更新成功', 'success');
                document.getElementById('scoreModal').classList.remove('show');
                loadScores();
            } else {
                showMessage(json.msg || '更新失败', 'error');
            }
        } catch (err) {
            console.error('更新成绩异常:', err);
            showMessage('网络异常，请稍后重试', 'error');
        }
    } else {
        delete data.scoreId;

        try {
            const res = await authFetch('http://localhost:8080/api/score/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const json = await res.json();

            if (json.code === 1) {
                showMessage('添加成功', 'success');
                document.getElementById('scoreModal').classList.remove('show');
                loadScores();
            } else {
                showMessage(json.msg || '添加失败', 'error');
            }
        } catch (err) {
            console.error('添加成绩异常:', err);
            showMessage('网络异常，请稍后重试', 'error');
        }
    }
}
