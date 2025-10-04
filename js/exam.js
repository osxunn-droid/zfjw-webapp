document.addEventListener('DOMContentLoaded', () => {
    if (!StorageService.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    populateYearSelect();
    document.getElementById('query-button').addEventListener('click', fetchAndDisplayExams);
    fetchAndDisplayExams();
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

async function fetchAndDisplayExams() {
    const loginInfo = StorageService.getLoginInfo();
    if (!loginInfo) return;

    const yearSelect = document.getElementById('year-select');
    const termSelect = document.getElementById('term-select');
    const listContainer = document.getElementById('exam-list-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const resultMessage = document.getElementById('result-message');
    const emptyState = document.getElementById('empty-state');
    
    listContainer.innerHTML = '';
    emptyState.style.display = 'none';
    resultMessage.textContent = '';

    const cacheDataKey = `${yearSelect.value}-${termSelect.value}`;
    const cachedData = StorageService.getCache(StorageService.KEYS.CACHED_EXAMS, cacheDataKey);

    if (cachedData) {
        console.log("从缓存加载考试安排...");
        if (cachedData.length > 0) {
            renderExamList(cachedData);
        } else {
            emptyState.style.display = 'block';
        }
    } else {
        loadingIndicator.style.display = 'block';
    }

    try {
        const params = {
             cookies: loginInfo.cookies,
             school_name: loginInfo.school_name,
             year: parseInt(yearSelect.value, 10),
             term: parseInt(termSelect.value, 10)
        };

        const result = await ApiService.getExam(params);
        loadingIndicator.style.display = 'none';

        if (result && result.code === 1000) {
            const exams = result.data.courses;
            StorageService.setCache(StorageService.KEYS.CACHED_EXAMS, cacheDataKey, exams);
            
            if (exams && exams.length > 0) {
                renderExamList(exams);
            } else {
                emptyState.style.display = 'block';
            }
        } else {
            if (!cachedData) {
                resultMessage.textContent = `查询失败: ${result.msg || '未知错误'}`;
            }
        }
    } catch (error) {
        loadingIndicator.style.display = 'none';
        if (!cachedData) {
            resultMessage.textContent = '查询过程中发生错误，请稍后重试。';
        }
        console.error('Fetch exams error:', error);
    }
}

function renderExamList(exams) {
    const listContainer = document.getElementById('exam-list-container');
    listContainer.innerHTML = '';
    if (!exams) return;
    
    exams.forEach(exam => {
        const card = document.createElement('div');
        card.className = 'exam-card';
        card.innerHTML = `
            <div class="exam-card-header">${exam.title || 'N/A'}</div>
            <div class="exam-card-body">
                <div class="exam-info-item"><strong>考试时间</strong><span>${exam.time || '待定'}</span></div>
                <div class="exam-info-item"><strong>考试地点</strong><span>${exam.location || '待定'}</span></div>
                <div class="exam-info-item"><strong>座位号</strong><span>${exam.zwh || 'N/A'}</span></div>
                <div class="exam-info-item"><strong>校区</strong><span>${exam.xq || 'N/A'}</span></div>
                <div class="exam-info-item"><strong>考试方式</strong><span>${exam.ksfs || 'N/A'}</span></div>
                <div class="exam-info-item"><strong>任课教师</strong><span>${exam.teacher ? exam.teacher.split('/')[1] : 'N/A'}</span></div>
            </div>
        `;
        listContainer.appendChild(card);
    });
}