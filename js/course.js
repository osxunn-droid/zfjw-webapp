document.addEventListener('DOMContentLoaded', () => {
    if (!StorageService.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    populateYearSelect();
    const queryButton = document.getElementById('query-button');

    queryButton.addEventListener('click', () => {
        fetchAndDisplaySelectedCourses();
        fetchAndDisplayCourseBlocks();
    });

    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const tabId = button.dataset.tab;
            document.querySelectorAll('.tab-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            document.getElementById(`${tabId}-panel`).classList.add('active');
        });
    });

    fetchAndDisplaySelectedCourses();
    fetchAndDisplayCourseBlocks();

    document.getElementById('modal-close-button').addEventListener('click', () => {
        document.getElementById('course-modal').style.display = 'none';
    });
});

function populateYearSelect() {
    const yearSelect = document.getElementById('year-select');
    const userInfo = StorageService.get(StorageService.KEYS.USER_INFO);
    const admissionYear = userInfo ? parseInt(userInfo.sid.substring(0, 4), 10) : new Date().getFullYear() - 4;
    const currentYear = new Date().getFullYear();
    for (let year = admissionYear; year <= currentYear; year++) {
        const option = new Option(`${year}-${year + 1} 学年`, year);
        yearSelect.add(option);
    }
    yearSelect.value = new Date().getMonth() < 8 ? currentYear - 1 : currentYear;
}

async function fetchAndDisplaySelectedCourses() {
    const loginInfo = StorageService.getLoginInfo();
    if (!loginInfo) return;
    const yearSelect = document.getElementById('year-select');
    const termSelect = document.getElementById('term-select');
    const panel = document.getElementById('selected-courses-panel');
    const listContainer = panel.querySelector('#selected-courses-list');
    const loadingIndicator = panel.querySelector('#loading-indicator');
    const resultMessage = panel.querySelector('#result-message');
    const emptyState = panel.querySelector('#empty-state');
    listContainer.innerHTML = '';
    emptyState.style.display = 'none';
    resultMessage.textContent = '';
    loadingIndicator.style.display = 'block';
    try {
        const params = { cookies: loginInfo.cookies, school_name: loginInfo.school_name, year: parseInt(yearSelect.value, 10), term: parseInt(termSelect.value, 10) };
        const result = await ApiService.getSelectedCourses(params);
        if (result && result.code === 1000) {
            const courses = result.data.courses;
            if (courses && courses.length > 0) {
                renderSelectedCourses(courses);
            } else {
                emptyState.style.display = 'block';
            }
        } else {
            resultMessage.textContent = `查询失败: ${result.msg || '未知错误'}`;
        }
    } catch (error) {
        resultMessage.textContent = '查询过程中发生错误。';
    } finally {
        loadingIndicator.style.display = 'none';
    }
}
function renderSelectedCourses(courses) {
    const listContainer = document.getElementById('selected-courses-list');
    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        let creditText = (typeof course.credit === 'number') ? course.credit.toFixed(1) : (course.credit || 'N/A');
        const isDroppable = course.category === '通识教育选修课程';
        let dropButtonHTML = isDroppable ? `<button class="drop-course-button" data-course-id="${course.course_id}" data-do-id="${course.do_id}">退课</button>` : `<button class="drop-course-button" disabled title="该类型课程不允许退课">无法退课</button>`;
        card.innerHTML = `
            <div class="course-card-body">
                <div class="course-card-info">
                    <h3 class="course-card-title">${course.title}</h3>
                    <div class="course-card-details">
                        <div class="detail-item"><strong>教师</strong><span>${course.teacher || 'N/A'}</span></div>
                        <div class="detail-item"><strong>学分</strong><span>${creditText}</span></div>
                        <div class="detail-item"><strong>类型</strong><span>${course.category || 'N/A'}</span></div>
                        <div class="detail-item"><strong>地点</strong><span>${course.place || 'N/A'}</span></div>
                    </div>
                </div>
                <div class="course-card-actions">${dropButtonHTML}</div>
            </div>`;
        listContainer.appendChild(card);
    });
    listContainer.querySelectorAll('.drop-course-button:not([disabled])').forEach(button => {
        button.addEventListener('click', handleDropCourse);
    });
}
async function handleDropCourse(event) {
    const button = event.currentTarget;
    const confirmed = await UI.showConfirm('确认退课', '您确定要退选这门课程吗？此操作可能无法撤销。');
    if (!confirmed) return;

    button.disabled = true;
    button.textContent = '退课中...';
    const loginInfo = StorageService.getLoginInfo();
    const yearSelect = document.getElementById('year-select');
    const termSelect = document.getElementById('term-select');
    try {
        const params = { cookies: loginInfo.cookies, school_name: loginInfo.school_name, year: parseInt(yearSelect.value, 10), term: parseInt(termSelect.value, 10), course_id: button.dataset.courseId, do_id: button.dataset.doId };
        const result = await ApiService.dropCourse(params);
        if (result && result.code === 1000) {
            UI.showMessage('操作成功', '退课成功！', 'success');
            fetchAndDisplaySelectedCourses();
        } else {
            UI.showMessage('操作失败', `退课失败: ${result.msg || '未知错误'}`, 'error');
            button.disabled = false;
            button.textContent = '退课';
        }
    } catch (error) {
        UI.showMessage('网络错误', '退课过程中发生网络错误。', 'error');
        button.disabled = false;
        button.textContent = '退课';
    }
}

async function fetchAndDisplayCourseBlocks() {
    const loginInfo = StorageService.getLoginInfo();
    if (!loginInfo) return;
    const yearSelect = document.getElementById('year-select');
    const termSelect = document.getElementById('term-select');
    const panel = document.getElementById('browse-courses-panel');
    const listContainer = panel.querySelector('#course-blocks-list');
    const loadingIndicator = panel.querySelector('#block-loading-indicator');
    const resultMessage = panel.querySelector('#block-result-message');
    const emptyState = panel.querySelector('#block-empty-state');
    listContainer.innerHTML = '';
    emptyState.style.display = 'none';
    resultMessage.textContent = '';
    loadingIndicator.style.display = 'block';
    try {
        const params = { cookies: loginInfo.cookies, school_name: loginInfo.school_name, year: parseInt(yearSelect.value, 10), term: parseInt(termSelect.value, 10) };
        const result = await ApiService.getBlockCourses(params);
        if (result && result.code === 1000 && Array.isArray(result.data)) {
            if (result.data.length > 0) {
                renderCourseBlocks(result.data);
            } else {
                emptyState.style.display = 'block';
            }
        } else {
            resultMessage.textContent = `查询失败: ${result.msg || '暂无数据'}`;
        }
    } catch (error) {
        resultMessage.textContent = '查询过程中发生错误。';
    } finally {
        loadingIndicator.style.display = 'none';
    }
}
function renderCourseBlocks(blocks) {
    const listContainer = document.getElementById('course-blocks-list');
    listContainer.innerHTML = '';
    blocks.forEach(block => {
        const card = document.createElement('div');
        card.className = 'block-card';
        card.innerHTML = `
            <div>
                <h3 class="block-card-title">${block.kcmc || '未知板块'}</h3>
                <p class="block-card-desc">${block.flmc || '点击查看详情'}</p>
            </div>
            <div class="block-card-footer">
                <span>进入选课</span>
                <span class="block-card-arrow">›</span>
            </div>
        `;
        card.addEventListener('click', () => handleBlockClick(block));
        listContainer.appendChild(card);
    });
}

async function handleBlockClick(block) {
    const modal = document.getElementById('course-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    modalTitle.textContent = `选择课程 - ${block.kcmc}`;
    modalBody.innerHTML = '<div class="page-loader" style="display: block;"></div>';
    modal.style.display = 'flex';
    const loginInfo = StorageService.getLoginInfo();
    const yearSelect = document.getElementById('year-select');
    const termSelect = document.getElementById('term-select');
    try {
        const params = { cookies: loginInfo.cookies, school_name: loginInfo.school_name, year: parseInt(yearSelect.value, 10), term: parseInt(termSelect.value, 10), block_id: block.kck_id };
        const result = await ApiService.getBlockCourses(params);
        if (result && result.code === 1000 && result.data.courses) {
            renderCoursesInModal(result.data.courses, block);
        } else {
            modalBody.innerHTML = `<p class="result-message">${result.msg || '暂无可选课程'}</p>`;
        }
    } catch (error) {
        modalBody.innerHTML = `<p class="result-message">加载课程失败</p>`;
    }
}

function renderCoursesInModal(courses, block) {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = '';
    courses.forEach(course => {
        const item = document.createElement('div');
        item.className = 'modal-course-item';
        item.innerHTML = `
            <div class="modal-item-info">
                <h4 class="modal-item-title">${course.title}</h4>
                <div class="modal-item-details">
                    <div class="detail-item"><strong>教师</strong><span>${course.teacher || 'N/A'}</span></div>
                    <div class="detail-item"><strong>学分</strong><span>${course.credit.toFixed(1)}</span></div>
                    <div class="detail-item"><strong>校区</strong><span>${course.campus || 'N/A'}</span></div>
                </div>
            </div>
            <div class="modal-item-actions">
                <button class="select-button">选择</button>
            </div>
        `;
        item.querySelector('.select-button').addEventListener('click', () => handleCourseClick(course, block));
        modalBody.appendChild(item);
    });
}

async function handleCourseClick(course, block) {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    modalTitle.textContent = `选择教学班 - ${course.title}`;
    modalBody.innerHTML = '<div class="page-loader" style="display: block;"></div>';
    const loginInfo = StorageService.getLoginInfo();
    const yearSelect = document.getElementById('year-select');
    const termSelect = document.getElementById('term-select');
    try {
        const params = { cookies: loginInfo.cookies, school_name: loginInfo.school_name, year: parseInt(yearSelect.value, 10), term: parseInt(termSelect.value, 10), course_id: course.course_id };
        const result = await ApiService.getCourseClasses(params);
        if (result && result.code === 1000 && result.data.classes) {
            renderClassesInModal(result.data.classes, course, block);
        } else {
            modalBody.innerHTML = `<p class="result-message">${result.msg || '暂无可选教学班'}</p>`;
        }
    } catch (error) {
        modalBody.innerHTML = `<p class="result-message">加载教学班失败</p>`;
    }
}

function renderClassesInModal(classes, course, block) {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = '';
    classes.forEach(cls => {
        const item = document.createElement('div');
        item.className = 'modal-class-item';
        item.innerHTML = `
            <div class="modal-item-info">
                <h4 class="modal-item-title">${cls.class_name}</h4>
                <div class="modal-item-details">
                    <div class="detail-item"><strong>教师</strong><span>${cls.teacher || 'N/A'}</span></div>
                    <div class="detail-item"><strong>时间</strong><span>${cls.time || 'N/A'}</span></div>
                    <div class="detail-item"><strong>地点</strong><span>${cls.place || 'N/A'}</span></div>
                    <div class="detail-item"><strong>已选/容量</strong><span>${cls.selected_number}/${cls.capacity}</span></div>
                    <div class="detail-item"><strong>周次</strong><span>${cls.weeks || 'N/A'}</span></div>
                </div>
            </div>
            <div class="modal-item-actions">
                <button class="select-button">确认选课</button>
            </div>
        `;
        item.querySelector('.select-button').addEventListener('click', (e) => handleSelectClass(e, cls, course, block));
        modalBody.appendChild(item);
    });
}

async function handleSelectClass(event, cls, course, block) {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = '...';
    const loginInfo = StorageService.getLoginInfo();
    const userInfo = StorageService.get(StorageService.KEYS.USER_INFO);
    const yearSelect = document.getElementById('year-select');
    const termSelect = document.getElementById('term-select');
    try {
        const params = {
            cookies: loginInfo.cookies, school_name: loginInfo.school_name,
            year: parseInt(yearSelect.value, 10), term: parseInt(termSelect.value, 10),
            sid: userInfo.sid,
            course_id: course.course_id,
            do_id: cls.do_id,
            kklxdm: block.kklxdm
        };
        const result = await ApiService.selectCourse(params);
        if (result && result.code === 1000) {
            UI.showMessage('操作成功', '选课成功！', 'success');
            document.getElementById('course-modal').style.display = 'none';
            fetchAndDisplaySelectedCourses();
        } else {
            UI.showMessage('操作失败', `选课失败: ${result.msg || '未知错误'}`, 'error');
            button.disabled = false;
            button.textContent = '确认选课';
        }
    } catch {
        UI.showMessage('网络错误', '选课请求失败', 'error');
        button.disabled = false;
        button.textContent = '确认选课';
    }
}