document.addEventListener('DOMContentLoaded', () => {
    if (!StorageService.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    populateYearSelect();
    document.getElementById('query-button').addEventListener('click', fetchAndDisplayGrades);
    fetchAndDisplayGrades();
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
    yearSelect.value = currentYear;
}

async function fetchAndDisplayGrades() {
    const loginInfo = StorageService.getLoginInfo();
    if (!loginInfo) return;

    const yearSelect = document.getElementById('year-select');
    const termSelect = document.getElementById('term-select');
    const tableContainer = document.querySelector('.grade-table-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const resultMessage = document.getElementById('result-message');
    const emptyState = document.getElementById('empty-state');
    
    tableContainer.style.display = 'none';
    emptyState.style.display = 'none';
    resultMessage.textContent = '';
    
    // 创建一个唯一的键来标识当前查询
    const cacheDataKey = `${yearSelect.value}-${termSelect.value}`;

    // 1. 尝试从缓存中获取数据
    const cachedData = StorageService.getCache(StorageService.KEYS.CACHED_GRADES, cacheDataKey);

    if (cachedData) {
        // 如果有缓存，立即显示
        console.log("从缓存加载成绩数据...");
        renderGradeTable(cachedData);
        tableContainer.style.display = 'block';
    } else {
        // 如果没有缓存，显示加载动画
        loadingIndicator.style.display = 'block';
    }

    // 2. 无论是否有缓存，都去服务器请求最新数据
    try {
        const params = {
             cookies: loginInfo.cookies,
             school_name: loginInfo.school_name,
             year: parseInt(yearSelect.value, 10),
             term: parseInt(termSelect.value, 10)
        };

        const result = await ApiService.getGrade(params);

        // 隐藏加载动画（如果是首次加载）
        loadingIndicator.style.display = 'none';

        if (result && result.code === 1000) {
            const courses = result.data.courses;
            // 存储新数据到缓存
            StorageService.setCache(StorageService.KEYS.CACHED_GRADES, cacheDataKey, courses);

            if (courses && courses.length > 0) {
                // 渲染最新的数据
                renderGradeTable(courses);
                tableContainer.style.display = 'block';
            } else {
                // 如果最新数据为空，显示空状态
                tableContainer.style.display = 'none';
                emptyState.style.display = 'block';
            }
        } else {
            // 只有在没有缓存的情况下，才显示错误信息
            if (!cachedData) {
                resultMessage.textContent = `查询失败: ${result.msg || '未知错误'}`;
            }
        }
    } catch (error) {
        loadingIndicator.style.display = 'none';
        if (!cachedData) {
            resultMessage.textContent = '查询过程中发生错误，请稍后重试。';
        }
        console.error('Fetch grades error:', error);
    }
}

function renderGradeTable(courses) {
    const tableBody = document.getElementById('grade-table-body');
    tableBody.innerHTML = '';
    if (!courses) return;

    courses.forEach(course => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${course.title || 'N/A'}</td>
            <td>${course.grade || 'N/A'}</td>
            <td>${course.credit || 'N/A'}</td>
            <td>${course.grade_point || 'N/A'}</td>
            <td>${course.nature || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}