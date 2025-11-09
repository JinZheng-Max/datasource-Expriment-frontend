document.addEventListener('DOMContentLoaded', function () {
    initScorePage();
});

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let scoreData = [];

function initScorePage() {
    document.getElementById('addScoreBtn').addEventListener('click', showAddModal);
    document.getElementById('searchInput').addEventListener('input', filterScores);
    document.getElementById('semesterFilter').addEventListener('change', filterScores);
    document.getElementById('courseFilter').addEventListener('change', filterScores);
    document.getElementById('passFilter').addEventListener('change', filterScores);
    document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);
    document.getElementById('exportBtn').addEventListener('click', exportScores);
    document.getElementById('scoreForm').addEventListener('submit', handleSubmit);

    // 监听成绩输入,自动计算总评和绩点
    ['regularScore', 'midtermScore', 'finalScore'].forEach(id => {
        document.getElementById(id).addEventListener('input', calculateTotalScore);
    });

    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    document.getElementById('scoreModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });

    loadStudents();
    loadCourses();
    loadSemesters();
    loadScoreData();

    if (typeof initUserMenu === 'function') {
        initUserMenu();
    }
    if (typeof initLogout === 'function') {
        initLogout();
    }
}

function calculateTotalScore() {
    const regular = parseFloat(document.getElementById('regularScore').value) || 0;
    const midterm = parseFloat(document.getElementById('midtermScore').value) || 0;
    const final = parseFloat(document.getElementById('finalScore').value) || 0;

    // 计算总评: 平时30% + 期中20% + 期末50%
    const total = (regular * 0.3 + midterm * 0.2 + final * 0.5).toFixed(2);
    document.getElementById('totalScore').value = total;

    // 计算绩点
    const gradePoint = calculateGradePoint(total);
    document.getElementById('gradePoint').value = gradePoint;

    // 判断是否及格
    document.getElementById('isPass').value = total >= 60 ? '1' : '0';
}

function calculateGradePoint(score) {
    if (score >= 90) return '4.0';
    if (score >= 85) return '3.7';
    if (score >= 82) return '3.3';
    if (score >= 78) return '3.0';
    if (score >= 75) return '2.7';
    if (score >= 72) return '2.3';
    if (score >= 68) return '2.0';
    if (score >= 64) return '1.5';
    if (score >= 60) return '1.0';
    return '0.0';
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

function loadCourses() {
    const courses = [
        { course_id: 1, course_name: '高等数学' },
        { course_id: 2, course_name: '线性代数' },
        { course_id: 3, course_name: '概率论与数理统计' },
        { course_id: 4, course_name: '数据结构' },
        { course_id: 5, course_name: '计算机网络' },
        { course_id: 6, course_name: '操作系统' },
        { course_id: 7, course_name: '数据库原理' },
        { course_id: 8, course_name: '软件工程' }
    ];

    const courseSelect = document.getElementById('courseSelect');
    const courseFilter = document.getElementById('courseFilter');

    courses.forEach(course => {
        const option1 = new Option(course.course_name, course.course_id);
        const option2 = new Option(course.course_name, course.course_id);
        courseSelect.add(option1);
        courseFilter.add(option2);
    });
}

function loadSemesters() {
    const semesters = [
        { semester_id: 1, semester_name: '2024-2025学年第一学期', semester_code: '2024-1' },
        { semester_id: 2, semester_name: '2023-2024学年第二学期', semester_code: '2023-2' },
        { semester_id: 3, semester_name: '2023-2024学年第一学期', semester_code: '2023-1' }
    ];

    const semesterSelect = document.getElementById('semesterSelect');

    semesters.forEach(semester => {
        const option = new Option(semester.semester_name, semester.semester_id);
        semesterSelect.add(option);
    });
}

function loadScoreData() {
    scoreData = generateMockScores(60);
    renderScores();
}

function generateMockScores(count) {
    const data = [];
    const courses = ['高等数学', '线性代数', '概率论', '数据结构', '计算机网络', '操作系统'];
    const semesters = ['2024-2025学年第一学期', '2023-2024学年第二学期'];
    const surnames = ['张', '李', '王', '刘', '陈'];
    const names = ['伟', '芳', '娜', '敏', '静'];

    for (let i = 1; i <= count; i++) {
        const regular = Math.random() * 20 + 70;
        const midterm = Math.random() * 20 + 70;
        const final = Math.random() * 30 + 60;
        const total = (regular * 0.3 + midterm * 0.2 + final * 0.5).toFixed(2);

        data.push({
            score_id: i,
            student_no: `2021${String(i).padStart(4, '0')}`,
            name: surnames[Math.floor(Math.random() * surnames.length)] +
                names[Math.floor(Math.random() * names.length)],
            course_name: courses[Math.floor(Math.random() * courses.length)],
            semester_name: semesters[Math.floor(Math.random() * semesters.length)],
            regular_score: regular.toFixed(2),
            midterm_score: midterm.toFixed(2),
            final_score: final.toFixed(2),
            total_score: total,
            grade_point: calculateGradePoint(total),
            is_pass: total >= 60,
            status: '正常'
        });
    }
    return data;
}

function renderScores() {
    const tbody = document.getElementById('scoreTableBody');
    const filteredData = getFilteredScores();

    totalPages = Math.ceil(filteredData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = filteredData.slice(startIndex, endIndex);

    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 40px; color: var(--text-secondary);">暂无数据</td></tr>';
    } else {
        tbody.innerHTML = pageData.map(item => {
            const passClass = item.is_pass ? 'pass' : 'fail';
            return `
            <tr>
                <td>${item.student_no}</td>
                <td><strong>${item.name}</strong></td>
                <td>${item.course_name}</td>
                <td>${item.semester_name}</td>
                <td>${item.regular_score}</td>
                <td>${item.midterm_score}</td>
                <td>${item.final_score}</td>
                <td><strong class="score-${passClass}">${item.total_score}</strong></td>
                <td><span class="gp-badge">${item.grade_point}</span></td>
                <td><span class="status-badge status-${item.status}">${item.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewScore(${item.score_id})">查看</button>
                        <button class="btn-action btn-edit" onclick="editScore(${item.score_id})">编辑</button>
                        <button class="btn-action btn-delete" onclick="deleteScore(${item.score_id})">删除</button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    renderPagination();
}

function getFilteredScores() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const semesterFilter = document.getElementById('semesterFilter').value;
    const courseFilter = document.getElementById('courseFilter').value;
    const passFilter = document.getElementById('passFilter').value;

    return scoreData.filter(item => {
        const matchSearch = !searchText ||
            item.student_no.toLowerCase().includes(searchText) ||
            item.name.toLowerCase().includes(searchText) ||
            item.course_name.toLowerCase().includes(searchText);
        const matchSemester = !semesterFilter || item.semester_name.includes(semesterFilter);
        const matchCourse = !courseFilter || item.course_name === courseFilter;
        const matchPass = !passFilter || (passFilter === '1' ? item.is_pass : !item.is_pass);

        return matchSearch && matchSemester && matchCourse && matchPass;
    });
}

function filterScores() {
    currentPage = 1;
    renderScores();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('semesterFilter').value = '';
    document.getElementById('courseFilter').value = '';
    document.getElementById('passFilter').value = '';
    filterScores();
}

function exportScores() {
    showMessage('成绩导出功能开发中...', 'info');
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
    renderScores();
}

function showAddModal() {
    document.getElementById('modalTitle').textContent = '录入成绩';
    document.getElementById('scoreForm').reset();
    document.querySelector('input[name="score_id"]').value = '';
    document.getElementById('scoreModal').classList.add('show');
}

function viewScore(id) {
    const item = scoreData.find(s => s.score_id === id);
    if (item) {
        showMessage(`查看成绩: ${item.name} - ${item.course_name}`, 'info');
    }
}

function editScore(id) {
    const item = scoreData.find(s => s.score_id === id);
    if (item) {
        document.getElementById('modalTitle').textContent = '编辑成绩';
        const form = document.getElementById('scoreForm');
        form.querySelector('[name="score_id"]').value = item.score_id;
        form.querySelector('[name="regular_score"]').value = item.regular_score;
        form.querySelector('[name="midterm_score"]').value = item.midterm_score;
        form.querySelector('[name="final_score"]').value = item.final_score;
        form.querySelector('[name="total_score"]').value = item.total_score;
        form.querySelector('[name="grade_point"]').value = item.grade_point;
        form.querySelector('[name="status"]').value = item.status;

        document.getElementById('scoreModal').classList.add('show');
    }
}

function deleteScore(id) {
    const item = scoreData.find(s => s.score_id === id);
    if (item && confirm(`确定要删除 ${item.name} 的 ${item.course_name} 成绩吗？`)) {
        scoreData = scoreData.filter(s => s.score_id !== id);
        showMessage('删除成功', 'success');
        renderScores();
    }
}

function closeModal() {
    document.getElementById('scoreModal').classList.remove('show');
}

function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    if (data.score_id) {
        const index = scoreData.findIndex(s => s.score_id == data.score_id);
        if (index !== -1) {
            scoreData[index] = { ...scoreData[index], ...data, is_pass: data.total_score >= 60 };
            showMessage('更新成功', 'success');
        }
    } else {
        data.score_id = scoreData.length + 1;
        const studentSelect = document.getElementById('studentSelect');
        const courseSelect = document.getElementById('courseSelect');
        const semesterSelect = document.getElementById('semesterSelect');

        const studentText = studentSelect.options[studentSelect.selectedIndex].text;
        const [student_no, name] = studentText.split(' - ');
        data.student_no = student_no;
        data.name = name;
        data.course_name = courseSelect.options[courseSelect.selectedIndex].text;
        data.semester_name = semesterSelect.options[semesterSelect.selectedIndex].text;
        data.is_pass = data.total_score >= 60;

        scoreData.push(data);
        showMessage('添加成功', 'success');
    }

    closeModal();
    renderScores();
}

// 添加样式
const style = document.createElement('style');
style.textContent = `
    .score-pass {
        color: var(--success-color);
        font-weight: 600;
    }
    .score-fail {
        color: var(--danger-color);
        font-weight: 600;
    }
    .gp-badge {
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    .status-正常 {
        background: rgba(56, 239, 125, 0.1);
        color: var(--success-color);
    }
    .status-缓考 {
        background: rgba(240, 147, 251, 0.1);
        color: var(--warning-color);
    }
    .status-缺考, .status-作弊 {
        background: rgba(250, 112, 154, 0.1);
        color: var(--danger-color);
    }
`;
document.head.appendChild(style);
