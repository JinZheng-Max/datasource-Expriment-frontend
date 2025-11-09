document.addEventListener('DOMContentLoaded', function () {
    initCoursePage();
});

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let courseData = [];

function initCoursePage() {
    document.getElementById('addCourseBtn').addEventListener('click', showAddModal);
    document.getElementById('searchInput').addEventListener('input', filterCourses);
    document.getElementById('typeFilter').addEventListener('change', filterCourses);
    document.getElementById('majorFilter').addEventListener('change', filterCourses);
    document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);
    document.getElementById('courseForm').addEventListener('submit', handleSubmit);

    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    document.getElementById('courseModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });

    loadMajors();
    loadCourseData();

    if (typeof initUserMenu === 'function') {
        initUserMenu();
    }
    if (typeof initLogout === 'function') {
        initLogout();
    }
}

function loadMajors() {
    const majors = [
        { major_id: 1, major_name: '计算机科学与技术' },
        { major_id: 2, major_name: '软件工程' },
        { major_id: 3, major_name: '数据科学与大数据技术' },
        { major_id: 4, major_name: '人工智能' },
        { major_id: 5, major_name: '网络工程' }
    ];

    const majorSelect = document.getElementById('majorSelect');
    const majorFilter = document.getElementById('majorFilter');

    majors.forEach(major => {
        const option1 = new Option(major.major_name, major.major_id);
        const option2 = new Option(major.major_name, major.major_id);
        majorSelect.add(option1);
        majorFilter.add(option2);
    });
}

function loadCourseData() {
    courseData = generateMockCourses();
    renderCourses();
}

function generateMockCourses() {
    const courses = [
        { course_id: 1, course_code: 'CS101', course_name: '高等数学', course_type: '必修', credits: 4.0, hours: 64, major_name: '公共课', semester_order: 1 },
        { course_id: 2, course_code: 'CS102', course_name: '线性代数', course_type: '必修', credits: 3.0, hours: 48, major_name: '公共课', semester_order: 2 },
        { course_id: 3, course_code: 'CS201', course_name: '数据结构', course_type: '必修', credits: 4.0, hours: 64, major_name: '计算机科学与技术', semester_order: 3 },
        { course_id: 4, course_code: 'CS202', course_name: '计算机网络', course_type: '必修', credits: 3.5, hours: 56, major_name: '计算机科学与技术', semester_order: 4 },
        { course_id: 5, course_code: 'CS203', course_name: '操作系统', course_type: '必修', credits: 4.0, hours: 64, major_name: '计算机科学与技术', semester_order: 5 },
        { course_id: 6, course_code: 'CS301', course_name: '数据库原理', course_type: '必修', credits: 3.5, hours: 56, major_name: '计算机科学与技术', semester_order: 4 },
        { course_id: 7, course_code: 'CS302', course_name: '软件工程', course_type: '必修', credits: 3.0, hours: 48, major_name: '软件工程', semester_order: 5 },
        { course_id: 8, course_code: 'CS401', course_name: '人工智能导论', course_type: '选修', credits: 2.5, hours: 40, major_name: '人工智能', semester_order: 6 },
        { course_id: 9, course_code: 'CS402', course_name: '机器学习', course_type: '选修', credits: 3.0, hours: 48, major_name: '人工智能', semester_order: 7 },
        { course_id: 10, course_code: 'CS501', course_name: '大数据技术', course_type: '选修', credits: 2.5, hours: 40, major_name: '数据科学', semester_order: 6 },
        { course_id: 11, course_code: 'CS103', course_name: '概率论与数理统计', course_type: '必修', credits: 3.0, hours: 48, major_name: '公共课', semester_order: 3 },
        { course_id: 12, course_code: 'CS104', course_name: '离散数学', course_type: '必修', credits: 3.0, hours: 48, major_name: '公共课', semester_order: 2 },
        { course_id: 13, course_code: 'CS204', course_name: '算法分析与设计', course_type: '必修', credits: 3.5, hours: 56, major_name: '计算机科学与技术', semester_order: 5 },
        { course_id: 14, course_code: 'CS303', course_name: 'Web开发技术', course_type: '选修', credits: 2.5, hours: 40, major_name: '软件工程', semester_order: 6 },
        { course_id: 15, course_code: 'CS304', course_name: '移动应用开发', course_type: '选修', credits: 2.5, hours: 40, major_name: '软件工程', semester_order: 7 },
        { course_id: 16, course_code: 'CS601', course_name: '毕业设计', course_type: '实践', credits: 8.0, hours: 128, major_name: '公共课', semester_order: 8 }
    ];
    return courses;
}

function renderCourses() {
    const tbody = document.getElementById('courseTableBody');
    const filteredData = getFilteredCourses();

    totalPages = Math.ceil(filteredData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = filteredData.slice(startIndex, endIndex);

    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">暂无数据</td></tr>';
    } else {
        tbody.innerHTML = pageData.map(item => {
            const typeClass = item.course_type === '必修' ? 'required' :
                item.course_type === '选修' ? 'elective' : 'practice';
            return `
            <tr>
                <td><code>${item.course_code}</code></td>
                <td><strong>${item.course_name}</strong></td>
                <td><span class="course-type type-${typeClass}">${item.course_type}</span></td>
                <td><span class="credit-badge">${item.credits}学分</span></td>
                <td>${item.hours}学时</td>
                <td>${item.major_name}</td>
                <td>${item.semester_order ? '第' + item.semester_order + '学期' : '不限'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewCourse(${item.course_id})">查看</button>
                        <button class="btn-action btn-edit" onclick="editCourse(${item.course_id})">编辑</button>
                        <button class="btn-action btn-delete" onclick="deleteCourse(${item.course_id})">删除</button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    renderPagination();
}

function getFilteredCourses() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const majorFilter = document.getElementById('majorFilter').value;

    return courseData.filter(item => {
        const matchSearch = !searchText ||
            item.course_code.toLowerCase().includes(searchText) ||
            item.course_name.toLowerCase().includes(searchText);
        const matchType = !typeFilter || item.course_type === typeFilter;
        const matchMajor = !majorFilter || item.major_name.includes(majorFilter);

        return matchSearch && matchType && matchMajor;
    });
}

function filterCourses() {
    currentPage = 1;
    renderCourses();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('majorFilter').value = '';
    filterCourses();
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
    renderCourses();
}

function showAddModal() {
    document.getElementById('modalTitle').textContent = '添加课程';
    document.getElementById('courseForm').reset();
    document.querySelector('input[name="course_id"]').value = '';
    document.getElementById('courseModal').classList.add('show');
}

function viewCourse(id) {
    const item = courseData.find(c => c.course_id === id);
    if (item) {
        showMessage(`查看课程: ${item.course_name}`, 'info');
    }
}

function editCourse(id) {
    const item = courseData.find(c => c.course_id === id);
    if (item) {
        document.getElementById('modalTitle').textContent = '编辑课程';
        const form = document.getElementById('courseForm');
        form.querySelector('[name="course_id"]').value = item.course_id;
        form.querySelector('[name="course_code"]').value = item.course_code;
        form.querySelector('[name="course_name"]').value = item.course_name;
        form.querySelector('[name="course_type"]').value = item.course_type;
        form.querySelector('[name="credits"]').value = item.credits;
        form.querySelector('[name="hours"]').value = item.hours;
        form.querySelector('[name="semester_order"]').value = item.semester_order || '';

        document.getElementById('courseModal').classList.add('show');
    }
}

function deleteCourse(id) {
    const item = courseData.find(c => c.course_id === id);
    if (item && confirm(`确定要删除课程 ${item.course_name} 吗？`)) {
        courseData = courseData.filter(c => c.course_id !== id);
        showMessage('删除成功', 'success');
        renderCourses();
    }
}

function closeModal() {
    document.getElementById('courseModal').classList.remove('show');
}

function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    if (data.course_id) {
        const index = courseData.findIndex(c => c.course_id == data.course_id);
        if (index !== -1) {
            courseData[index] = { ...courseData[index], ...data };
            showMessage('更新成功', 'success');
        }
    } else {
        data.course_id = courseData.length + 1;
        const majorSelect = document.getElementById('majorSelect');
        data.major_name = majorSelect.selectedIndex === 0 ? '公共课' :
            majorSelect.options[majorSelect.selectedIndex].text;

        courseData.push(data);
        showMessage('添加成功', 'success');
    }

    closeModal();
    renderCourses();
}

// 添加样式
const style = document.createElement('style');
style.textContent = `
    code {
        padding: 4px 8px;
        background: rgba(102, 126, 234, 0.1);
        border-radius: 6px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: var(--primary-color);
    }
    .course-type {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
    }
    .type-required {
        background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
        color: white;
    }
    .type-elective {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: white;
    }
    .type-practice {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        color: white;
    }
    .credit-badge {
        padding: 4px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
    }
`;
document.head.appendChild(style);
