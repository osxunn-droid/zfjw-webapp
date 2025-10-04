document.addEventListener('DOMContentLoaded', () => {
    if (!StorageService.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    populateYearSelect();
    setupScheduleGrid();
    document.getElementById('query-button').addEventListener('click', fetchAndDisplaySchedule);
    fetchAndDisplaySchedule();
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

function setupScheduleGrid() {
    const grid = document.getElementById('schedule-grid');
    const sessionTimes = ["08:00-08:50", "09:00-09:50", "10:10-11:00", "11:10-12:00", "14:00-14:50", "15:00-15:50", "16:10-17:00", "17:10-18:00", "19:30-20:20", "20:30-21:20", "21:30-22:20", "22:30-23:20"];
    const headerLabels = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    headerLabels.forEach(label => {
        const headerCell = document.createElement('div');
        headerCell.className = 'header-cell';
        headerCell.textContent = label;
        grid.appendChild(headerCell);
    });
    for (let i = 0; i < sessionTimes.length; i++) {
        const timeCell = document.createElement('div');
        timeCell.className = 'time-cell';
        timeCell.innerHTML = `<div class="time-cell-session">第${i + 1}节</div><div class="time-cell-time">${sessionTimes[i]}</div>`;
        grid.appendChild(timeCell);
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            grid.appendChild(cell);
        }
    }
}

async function fetchAndDisplaySchedule() {
    const loginInfo = StorageService.getLoginInfo();
    if (!loginInfo) return;

    const yearSelect = document.getElementById('year-select');
    const termSelect = document.getElementById('term-select');
    const scheduleContainer = document.getElementById('schedule-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const resultMessage = document.getElementById('result-message');
    const emptyState = document.getElementById('empty-state');

    scheduleContainer.style.display = 'none';
    emptyState.style.display = 'none';
    resultMessage.textContent = '';

    const cacheDataKey = `${yearSelect.value}-${termSelect.value}`;
    const cachedData = StorageService.getCache(StorageService.KEYS.CACHED_SCHEDULES, cacheDataKey);

    if (cachedData) {
        console.log("从缓存加载课表数据...");
        if (cachedData.length > 0) {
            renderSchedule(cachedData);
            scheduleContainer.style.display = 'block';
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
        const result = await ApiService.getSchedule(params);
        loadingIndicator.style.display = 'none';

        if (result && result.code === 1000) {
            const courses = result.data.courses;
            StorageService.setCache(StorageService.KEYS.CACHED_SCHEDULES, cacheDataKey, courses);

            if (courses && courses.length > 0) {
                scheduleContainer.style.display = 'block';
                renderSchedule(courses);
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
        console.error('Fetch schedule error:', error);
    }
}

function renderSchedule(courses) {
    const courseLayer = document.getElementById('course-layer');
    courseLayer.innerHTML = '';
    if (!courses) return;
    
    const grid = document.getElementById('schedule-grid');
    const colors = ['#e57373', '#81c784', '#64b5f6', '#ffb74d', '#ba68c8', '#7986cb', '#4dd0e1'];
    let colorIndex = 0;
    const firstCell = grid.querySelector('.grid-cell');
    if (!firstCell) return;
    const cellRect = firstCell.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    const cellHeight = cellRect.height;
    const cellWidth = cellRect.width;
    const startTop = cellRect.top - gridRect.top;
    const startLeft = cellRect.left - gridRect.left;

    courses.forEach(course => {
        if (!course.sessions || !course.weekday) return;
        const sessionMatch = course.sessions.match(/(\d+)-(\d+)/);
        if (!sessionMatch) return;
        const startSession = parseInt(sessionMatch[1], 10);
        const endSession = parseInt(sessionMatch[2], 10);
        const duration = endSession - startSession + 1;
        const dayOfWeek = parseInt(course.weekday, 10);
        const courseBlock = document.createElement('div');
        courseBlock.className = 'course-block';
        courseBlock.innerHTML = `<div class="course-block-title">${course.title}</div><div>@${course.place}</div><div style="margin-top: 4px;">(${course.teacher})</div>`;
        courseBlock.style.position = 'absolute';
        courseBlock.style.top = `${startTop + (startSession - 1) * cellHeight}px`;
        courseBlock.style.left = `${startLeft + (dayOfWeek - 1) * cellWidth}px`;
        courseBlock.style.width = `${cellWidth - 2}px`;
        courseBlock.style.height = `${duration * cellHeight - 2}px`;
        courseBlock.style.margin = '1px';
        courseBlock.style.backgroundColor = colors[colorIndex % colors.length];
        colorIndex++;
        courseBlock.addEventListener('click', () => { UI.showCourseDetail(course); });
        courseLayer.appendChild(courseBlock);
    });
}