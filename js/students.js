document.addEventListener('DOMContentLoaded', function () {
    initStudentPage();
});

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let totalRecords = 0;
let studentsData = [];

function initStudentPage() {
    // 检查登录态
    if (typeof checkAuth === 'function' && !checkAuth()) {
        return; // 未登录，已跳转到登录页
    }

    // 检查必需元素是否存在（防止在错误页面加载此脚本）
    const requiredElements = [
        'addStudentBtn', 'searchInput', 'gradeFilter', 'majorFilter', 
        'genderFilter', 'resetFilterBtn', 'studentForm', 'studentModal'
    ];
    
    for (const id of requiredElements) {
        if (!document.getElementById(id)) {
            console.warn(`students.js: 元素 #${id} 不存在，可能不在学生管理页面`);
            return; // 不在学生管理页面，直接返回
        }
    }

    // 初始化事件监听
    document.getElementById('addStudentBtn').addEventListener('click', showAddModal);
    document.getElementById('searchInput').addEventListener('input', filterStudents);
    document.getElementById('gradeFilter').addEventListener('change', filterStudents);
    document.getElementById('majorFilter').addEventListener('change', filterStudents);
    document.getElementById('genderFilter').addEventListener('change', filterStudents);
    document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);
    document.getElementById('studentForm').addEventListener('submit', handleSubmit);
    
    // 每页显示条数选择器
    const pageSizeSelect = document.getElementById('pageSizeSelect');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', function() {
            pageSize = parseInt(this.value);
            currentPage = 1; // 重置到第一页
            loadStudents();
        });
    }

    // 模态框关闭
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // 点击模态框外部关闭
    document.getElementById('studentModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // 加载专业和班级数据
    loadMajors();
    //loadClasses();

    // 加载学生数据
    loadStudents();

    // 初始化用户菜单和退出功能
    if (typeof initUserMenu === 'function') {
        initUserMenu();
    }
    if (typeof initLogout === 'function') {
        initLogout();
    }
}

// 加载专业数据
async function loadMajors() {
    try {
        const res = await authFetch('http://localhost:8080/api/student/major', {
            method: 'GET'
        });
        const json = await res.json();
        
        if (json.code === 1 && json.data) {
            const majors = json.data; // 返回的是 List<String>
            const majorSelect = document.getElementById('majorSelect');
            const majorFilter = document.getElementById('majorFilter');
            
            majors.forEach(majorName => {
                const option1 = new Option(majorName, majorName);
                const option2 = new Option(majorName, majorName);
                majorSelect.add(option1);
                majorFilter.add(option2);
            });
            
            // 监听专业选择变化，动态加载班级
            majorSelect.addEventListener('change', function() {
                const selectedMajor = this.value;
                if (selectedMajor) {
                    loadClassesByMajor(selectedMajor);
                } else {
                    // 清空班级选择
                    const classSelect = document.getElementById('classSelect');
                    classSelect.innerHTML = '<option value="">请选择</option>';
                }
            });
        } else {
            console.error('加载专业失败:', json.msg);
            showMessage(json.msg || '加载专业失败', 'error');
        }
    } catch (err) {
        console.error('加载专业异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

// 根据专业加载班级数据
async function loadClassesByMajor(majorName) {
    try {
        const token = localStorage.getItem('authentication');
        const res = await fetch(`http://localhost:8080/api/student/class?major=${encodeURIComponent(majorName)}`, {
            method: 'GET',
            headers: {
                'authentication': token || ''
            }
        });
        const json = await res.json();
        
        if (json.code === 1 && json.data) {
            const classes = json.data; // 返回的是 List<String>
            const classSelect = document.getElementById('classSelect');
            classSelect.innerHTML = '<option value="">请选择</option>';
            
            classes.forEach(className => {
                const option = new Option(className, className);
                classSelect.add(option);
            });
        } else {
            console.error('加载班级失败:', json.msg);
            showMessage(json.msg || '加载班级失败', 'error');
        }
    } catch (err) {
        console.error('加载班级异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}



// 加载学生数据
async function loadStudents() {
    try {
        const searchText = document.getElementById('searchInput').value;
        
        const res = await authFetch('http://localhost:8080/api/student/page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                page: currentPage,
                pageSize: pageSize,
                name: searchText || ''
            })
        });
        const json = await res.json();
        
        if (json.code === 1 && json.data) {
            const pageResult = json.data;
            studentsData = pageResult.records || [];
            totalRecords = pageResult.total || 0;
            totalPages = Math.ceil(totalRecords / pageSize);
            renderStudents();
        } else {
            showMessage(json.msg || '加载学生列表失败', 'error');
        }
    } catch (err) {
        console.error('加载学生列表异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

// 生成模拟学生数据
function generateMockStudents(count) {
    const students = [];
    const majors = ['计算机科学与技术', '软件工程', '数据科学与大数据技术', '人工智能', '网络工程'];
    const classes = ['1班', '2班', '3班'];
    const surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
    const names = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军'];

    for (let i = 1; i <= count; i++) {
        const grade = Math.floor(Math.random() * 4) + 1;
        const year = 2025 - grade;
        students.push({
            student_id: i,
            student_no: `${year}${String(i).padStart(4, '0')}`,
            name: surnames[Math.floor(Math.random() * surnames.length)] +
                names[Math.floor(Math.random() * names.length)] +
                names[Math.floor(Math.random() * names.length)],
            gender: Math.random() > 0.5 ? '男' : '女',
            grade: grade,
            major_name: majors[Math.floor(Math.random() * majors.length)],
            class_name: classes[Math.floor(Math.random() * classes.length)],
            phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
            admission_date: `${year}-09-01`
        });
    }
    return students;
}

// 渲染学生列表
function renderStudents() {
    const tbody = document.getElementById('studentTableBody');

    if (studentsData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 40px; color: var(--text-secondary);">暂无数据</td></tr>';
    } else {
        tbody.innerHTML = studentsData.map(student => `
            <tr>
                <td>${student.studentId || ''}</td>
                <td>${student.studentNo || ''}</td>
                <td><strong>${student.name || ''}</strong></td>
                <td>${student.gender || ''}</td>
                <td>${student.grade ? '大' + student.grade : ''}</td>
                <td>${student.major || ''}</td>
                <td>${student.className || ''}</td>
                <td>${student.phone || ''}</td>
                <td>${student.admissionDate || ''}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewStudent(${student.studentId})">查看</button>
                        <button class="btn-action btn-edit" onclick="editStudent(${student.studentId})">编辑</button>
                        <button class="btn-action btn-delete" onclick="deleteStudent(${student.studentId})">删除</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPagination();
}

// 过滤学生（重新从服务器加载）
function filterStudents() {
    currentPage = 1;
    loadStudents();
}

// 重置过滤器
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('gradeFilter').value = '';
    document.getElementById('majorFilter').value = '';
    document.getElementById('genderFilter').value = '';
    currentPage = 1;
    loadStudents();
}

// 渲染分页
function renderPagination() {
    const pagination = document.getElementById('pagination');
    let html = '';
    
    // 显示分页信息
    const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(currentPage * pageSize, totalRecords);
    html += '<span style="margin-right: 15px; color: #666;">显示 ' + startRecord + '-' + endRecord + ' 条，共 ' + totalRecords + ' 条</span>';

    if (currentPage > 1) {
        html += '<button class="page-btn" onclick="changePage(' + (currentPage - 1) + ')">上一页</button>';
    }

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += '<button class="page-btn ' + (i === currentPage ? 'active' : '') + '" onclick="changePage(' + i + ')">' + i + '</button>';
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += '<span>...</span>';
        }
    }

    if (currentPage < totalPages) {
        html += '<button class="page-btn" onclick="changePage(' + (currentPage + 1) + ')">下一页</button>';
    }

    pagination.innerHTML = html;
}

// 切换页面
function changePage(page) {
    currentPage = page;
    loadStudents();
}

// 显示添加模态框
function showAddModal() {
    document.getElementById('modalTitle').textContent = '添加学生';
    document.getElementById('studentForm').reset();
    
    // 设置为新增模式
    const isEditField = document.querySelector('input[name="isEdit"]');
    if (isEditField) {
        isEditField.value = 'false';
    }
    
    // 清空 studentId（新增时不需要）
    const studentIdField = document.querySelector('input[name="studentId"]');
    if (studentIdField) {
        studentIdField.value = '';
    }
    
    // 启用所有表单输入
    const form = document.getElementById('studentForm');
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.disabled = false;
    });
    
    // 显示保存按钮
    const saveBtn = document.querySelector('.modal-footer .btn-primary');
    if (saveBtn) {
        saveBtn.style.display = 'inline-block';
    }
    
    // 清空班级选择（因为还没选专业）
    const classSelect = document.getElementById('classSelect');
    if (classSelect) {
        classSelect.innerHTML = '<option value="">请选择</option>';
    }
    
    document.getElementById('studentModal').classList.add('show');
}

// 查看学生详情
async function viewStudent(id) {
    try {
        const res = await authFetch(`http://localhost:8080/api/student/${id}`, {
            method: 'GET'
        });
        const json = await res.json();
        
        if (json.code === 1 && json.data) {
            const student = json.data;
            document.getElementById('modalTitle').textContent = '查看学生信息';
            const form = document.getElementById('studentForm');
            
            // 填充表单数据（使用安全的方式，避免null错误）
            const setFieldValue = (name, value) => {
                const field = form.querySelector(`[name="${name}"]`);
                if (field) {
                    field.value = value || '';
                }
            };
            
            setFieldValue('studentId', student.studentId);
            setFieldValue('studentNo', student.studentNo);
            setFieldValue('name', student.name);
            setFieldValue('gender', student.gender);
            setFieldValue('idCard', student.idCard);
            setFieldValue('birthDate', student.birthDate);
            setFieldValue('phone', student.phone);
            setFieldValue('email', student.email);
            setFieldValue('admissionDate', student.admissionDate);
            setFieldValue('grade', student.grade);
            setFieldValue('homeAddress', student.homeAddress);
            setFieldValue('emergencyContact', student.emergencyContact);
            setFieldValue('emergencyPhone', student.emergencyPhone);
            
            // 禁用所有表单输入（只读模式）
            const inputs = form.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.disabled = true;
            });
            
            // 隐藏保存按钮，只显示关闭按钮
            const saveBtn = document.querySelector('.modal-footer .btn-primary');
            if (saveBtn) {
                saveBtn.style.display = 'none';
            }

            document.getElementById('studentModal').classList.add('show');
        } else {
            showMessage(json.msg || '获取学生信息失败', 'error');
        }
    } catch (err) {
        console.error('获取学生信息异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

// 编辑学生
async function editStudent(id) {
    try {
        const res = await authFetch(`http://localhost:8080/api/student/${id}`, {
            method: 'GET'
        });
        const json = await res.json();
        
        if (json.code === 1 && json.data) {
            const student = json.data;
            document.getElementById('modalTitle').textContent = '编辑学生';
            const form = document.getElementById('studentForm');
            
            // 设置为编辑模式
            const isEditField = form.querySelector('[name="isEdit"]');
            if (isEditField) {
                isEditField.value = 'true';
            }
            
            // 设置 studentId 隐藏字段
            const studentIdField = form.querySelector('[name="studentId"]');
            if (studentIdField) {
                studentIdField.value = student.studentId || '';
            }
            
            // 启用所有表单输入（编辑模式）
            const inputs = form.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.disabled = false;
            });
            
            // 显示保存按钮
            const saveBtn = document.querySelector('.modal-footer .btn-primary');
            if (saveBtn) {
                saveBtn.style.display = 'inline-block';
            }
            
            // 填充表单数据（字段名与后端DTO一致）
            form.querySelector('[name="studentNo"]').value = student.studentNo || '';
            form.querySelector('[name="name"]').value = student.name || '';
            form.querySelector('[name="gender"]').value = student.gender || '';
            form.querySelector('[name="idCard"]').value = student.idCard || '';
            
            // 处理日期字段（后端返回的是 LocalDate，格式为 YYYY-MM-DD，可以直接使用）
            form.querySelector('[name="birthDate"]').value = student.birthDate || '';
            form.querySelector('[name="phone"]').value = student.phone || '';
            form.querySelector('[name="email"]').value = student.email || '';
            form.querySelector('[name="admissionDate"]').value = student.admissionDate || '';
            form.querySelector('[name="grade"]').value = student.grade || '';
            
            // 修复住址字段：后端VO字段是 homeAddress，不是 address
            form.querySelector('[name="homeAddress"]').value = student.homeAddress || '';
            
            form.querySelector('[name="emergencyContact"]').value = student.emergencyContact || '';
            form.querySelector('[name="emergencyPhone"]').value = student.emergencyPhone || '';
            
            // TODO: 如果需要回显专业和班级，需要从后端获取专业名称和班级名称
            // 暂时留空，因为后端返回的是 majorId 和 classId

            document.getElementById('studentModal').classList.add('show');
        } else {
            showMessage(json.msg || '获取学生信息失败', 'error');
        }
    } catch (err) {
        console.error('获取学生信息异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

// 删除学生
async function deleteStudent(id) {
    if (!confirm(`确定要删除该学生吗？`)) {
        return;
    }
    
    try {
        const res = await authFetch(`http://localhost:8080/api/student/delete/${id}`, {
            method: 'DELETE'
        });
        const json = await res.json();
        
        if (json.code === 1) {
            showMessage('删除成功', 'success');
            loadStudents(); // 重新加载学生列表
        } else {
            showMessage(json.msg || '删除失败', 'error');
        }
    } catch (err) {
        console.error('删除学生异常:', err);
        showMessage('网络异常，请稍后重试', 'error');
    }
}

// 关闭模态框
function closeModal() {
    document.getElementById('studentModal').classList.remove('show');
}

// 处理表单提交
async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // 判断是编辑还是新增：通过隐藏字段 isEdit 来判断
    const isEdit = data.isEdit === 'true';
    delete data.isEdit; // 删除标记字段

    // 移除空字符串字段（但保留 studentId）
    Object.keys(data).forEach(key => {
        if (data[key] === '' && key !== 'studentId') {
            delete data[key];
        }
    });
    
    // 确保 studentId 是数字类型（编辑时）
    if (isEdit && data.studentId) {
        data.studentId = parseInt(data.studentId);
    }
    
    if (isEdit) {
        // 更新学生
        try {
            const res = await authFetch('http://localhost:8080/api/student/update', {
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
                loadStudents(); // 重新加载学生列表
            } else {
                showMessage(json.msg || '更新失败', 'error');
            }
        } catch (err) {
            console.error('更新学生异常:', err);
            showMessage('网络异常，请稍后重试', 'error');
        }
    } else {
        // 添加学生时删除 studentId 字段
        delete data.studentId;
        
        // 添加学生
        try {
            const res = await authFetch('http://localhost:8080/api/student/add', {
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
                loadStudents(); // 重新加载学生列表
            } else {
                showMessage(json.msg || '添加失败', 'error');
            }
        } catch (err) {
            console.error('添加学生异常:', err);
            showMessage('网络异常，请稍后重试', 'error');
        }
    }
}
