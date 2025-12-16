document.addEventListener('DOMContentLoaded', function () {
    console.log('课程管理页面初始化开始...');
    initCoursePage();
});

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let totalRecords = 0;
let courseData = [];
let allMajors = []; // 存储所有专业信息 {majorId, majorName}

function initCoursePage() {
    console.log('initCoursePage 开始执行');

    // 检查登录态
    if (typeof checkAuth === 'function' && !checkAuth()) {
        console.log('未登录，跳转到登录页');
        return;
    }

    const addBtn = document.getElementById('addCourseBtn');
    if (!addBtn) {
        console.error('找不到 addCourseBtn 按钮元素');
        return;
    }

    console.log('绑定添加课程按钮事件');
    addBtn.addEventListener('click', function () {
        console.log('添加课程按钮被点击');
        showAddModal();
    });

    document.getElementById('searchInput').addEventListener('input', filterCourses);
    document.getElementById('courseTypeFilter').addEventListener('change', filterCourses);
    document.getElementById('majorFilter').addEventListener('change', filterCourses);
    document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);
    document.getElementById('courseForm').addEventListener('submit', handleSubmit);

    const closeButtons = document.querySelectorAll('.modal-close');
    console.log('找到关闭按钮数量:', closeButtons.length);
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    const modal = document.getElementById('courseModal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                closeModal();
            }
        });
    } else {
        console.error('找不到 courseModal 元素');
    }

    loadMajors();
    loadCourseData();

    if (typeof initUserMenu === 'function') {
        initUserMenu();
    }
    if (typeof initLogout === 'function') {
        initLogout();
    }

    console.log('课程管理页面初始化完成');
}

async function loadMajors() {
    try {
        // 直接调用course模块的专业接口,返回包含ID和名称的数据
        const res = await authFetch('http://localhost:8080/api/course/majors', {
            method: 'GET'
        });
        const json = await res.json();

        console.log('专业接口返回:', json);

        if (json.code === 1 && json.data) {
            // json.data 是对象数组: [{majorId: 1, majorName: "计算机科学与技术"}, ...]
            allMajors = json.data;

            console.log('加载到的专业列表:', allMajors);

            // 填充筛选下拉框
            const majorFilter = document.getElementById('majorFilter');
            if (majorFilter) {
                majorFilter.innerHTML = '<option value="">全部专业</option>';
                allMajors.forEach(major => {
                    const option = new Option(major.majorName, major.majorId);
                    majorFilter.add(option);
                });
            }

            // 填充模态框专业下拉框
            const modalMajorSelect = document.getElementById('modalMajorSelect');
            if (modalMajorSelect) {
                modalMajorSelect.innerHTML = '<option value="">公共课（所有专业）</option>';
                allMajors.forEach(major => {
                    const option = new Option(major.majorName, major.majorId);
                    modalMajorSelect.add(option);
                });
                console.log('模态框专业下拉框已填充,共', allMajors.length, '个选项');
            }
        } else {
            console.error('获取专业列表失败:', json);
            showMessage('获取专业列表失败', 'error');
        }
    } catch (err) {
        console.error('加载专业异常:', err);
        showMessage('加载专业异常', 'error');
    }
}

async function loadCourseData() {
    try {
        const searchText = document.getElementById('searchInput').value;
        const courseType = document.getElementById('courseTypeFilter').value;
        const major = document.getElementById('majorFilter').value;

        let majorId = null;

        const res = await authFetch('http://localhost:8080/api/course/page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                page: currentPage,
                pageSize: pageSize,
                name: searchText || '',
                courseType: courseType || '',
                majorId: majorId
            })
        });
        const json = await res.json();

        if (json.code === 1 && json.data) {
            const pageResult = json.data;
            courseData = pageResult.records || [];
            totalRecords = pageResult.total || 0;
            totalPages = Math.ceil(totalRecords / pageSize);
            renderCourses();
        } else {
            showMessage(json.msg || '加载课程列表失败', 'error');
        }
    } catch (err) {
        console.error('加载课程列表异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

function renderCourses() {
    const tbody = document.getElementById('courseTableBody');

    if (courseData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">暂无数据</td></tr>';
    } else {
        tbody.innerHTML = courseData.map(item => {
            const typeClass = item.courseType === '必修' ? 'course-required' :
                item.courseType === '选修' ? 'course-elective' : 'course-practice';
            return `
            <tr>
                <td><strong>${item.courseCode || ''}</strong></td>
                <td>${item.courseName || ''}</td>
                <td><span class="status-badge ${typeClass}">${item.courseType || ''}</span></td>
                <td>${item.credits || ''}</td>
                <td>${item.hours || ''}</td>
                <td>${item.majorName || '公共课'}</td>
                <td>${item.semesterOrder ? '第' + item.semesterOrder + '学期' : ''}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="editCourse(${item.courseId})">编辑</button>
                        <button class="btn-action btn-delete" onclick="deleteCourse(${item.courseId})">删除</button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    renderPagination();
}

function filterCourses() {
    currentPage = 1;
    loadCourseData();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('courseTypeFilter').value = '';
    document.getElementById('majorFilter').value = '';
    filterCourses();
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
    loadCourseData();
}

function showAddModal() {
    console.log('showAddModal 被调用');
    document.getElementById('modalTitle').textContent = '添加课程';
    document.getElementById('courseForm').reset();
    document.querySelector('input[name="courseId"]').value = '';

    const modal = document.getElementById('courseModal');
    if (modal) {
        console.log('显示模态框');
        modal.classList.add('show');
    } else {
        console.error('找不到 courseModal 元素');
    }
}

async function editCourse(id) {
    try {
        const res = await authFetch(`http://localhost:8080/api/course/${id}`);
        const json = await res.json();

        if (json.code === 1 && json.data) {
            const item = json.data;
            console.log('编辑课程数据:', item);

            document.getElementById('modalTitle').textContent = '编辑课程';
            const form = document.getElementById('courseForm');

            form.querySelector('[name="courseId"]').value = item.courseId;
            form.querySelector('[name="courseCode"]').value = item.courseCode;
            form.querySelector('[name="courseName"]').value = item.courseName;
            form.querySelector('[name="courseType"]').value = item.courseType;
            form.querySelector('[name="credits"]').value = item.credits;
            form.querySelector('[name="hours"]').value = item.hours || '';

            // 修复：设置majorId的值
            const majorSelect = form.querySelector('[name="majorId"]');
            majorSelect.value = item.majorId || '';

            console.log('设置专业ID:', item.majorId);

            form.querySelector('[name="semesterOrder"]').value = item.semesterOrder || '';
            form.querySelector('[name="description"]').value = item.description || '';

            document.getElementById('courseModal').classList.add('show');
        } else {
            showMessage(json.msg || '获取课程信息失败', 'error');
        }
    } catch (err) {
        console.error('获取课程信息异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

async function deleteCourse(id) {
    if (!confirm('确定要删除该课程吗？删除后将无法恢复！')) {
        return;
    }

    try {
        const res = await authFetch(`http://localhost:8080/api/course/delete/${id}`, {
            method: 'DELETE'
        });
        const json = await res.json();

        if (json.code === 1) {
            showMessage('删除成功', 'success');
            loadCourseData();
        } else {
            showMessage(json.msg || '删除失败', 'error');
        }
    } catch (err) {
        console.error('删除课程异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

function closeModal() {
    console.log('closeModal 被调用');
    const modal = document.getElementById('courseModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const isEdit = !!data.courseId;

    // 数据类型转换
    if (data.credits) data.credits = parseFloat(data.credits);
    if (data.hours) data.hours = parseInt(data.hours);

    // 修复：确保majorId被正确处理
    if (data.majorId && data.majorId !== '') {
        data.majorId = parseInt(data.majorId);
    } else {
        // 如果选择了"公共课（所有专业）",则不发送majorId字段
        delete data.majorId;
    }

    if (data.semesterOrder) data.semesterOrder = parseInt(data.semesterOrder);

    // 删除空字段，但保留majorId=0的情况
    Object.keys(data).forEach(key => {
        if (data[key] === '' && key !== 'courseId') {
            delete data[key];
        }
    });

    console.log('提交的课程数据:', data); // 调试日志

    if (isEdit) {
        data.courseId = parseInt(data.courseId);

        try {
            const res = await authFetch('http://localhost:8080/api/course/update', {
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
                loadCourseData();
            } else {
                showMessage(json.msg || '更新失败', 'error');
            }
        } catch (err) {
            console.error('更新课程异常:', err);
            showMessage('网络异常，请稍后重试', 'error');
        }
    } else {
        delete data.courseId;

        try {
            const res = await authFetch('http://localhost:8080/api/course/add', {
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
                loadCourseData();
            } else {
                showMessage(json.msg || '添加失败', 'error');
            }
        } catch (err) {
            console.error('添加课程异常:', err);
            showMessage('网络异常，请稍后重试', 'error');
        }
    }
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
