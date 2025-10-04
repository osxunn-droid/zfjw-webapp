document.addEventListener('DOMContentLoaded', () => {
    if (!StorageService.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const isDetailView = urlParams.get('isDetail') === 'true';

    if (isDetailView) {
        displayDetailView(urlParams);
    } else {
        fetchAndDisplayAllNotifications();
    }
});

function displayDetailView(params) {
    const detailView = document.getElementById('notification-detail-view');
    const titleEl = document.getElementById('detail-title');
    const contentEl = document.getElementById('detail-content');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    loadingIndicator.style.display = 'none';
    document.getElementById('empty-state').style.display = 'none';
    detailView.style.display = 'block';

    titleEl.textContent = decodeURIComponent(params.get('title') || '通知详情');
    contentEl.textContent = decodeURIComponent(params.get('content') || '无详细内容。');
}

async function fetchAndDisplayAllNotifications() {
    const loginInfo = StorageService.getLoginInfo();
    if (!loginInfo) return;

    const listContainer = document.getElementById('notification-full-list');
    const loadingIndicator = document.getElementById('loading-indicator');
    const resultMessage = document.getElementById('result-message');
    const emptyState = document.getElementById('empty-state');

    listContainer.innerHTML = '';
    emptyState.style.display = 'none';
    resultMessage.textContent = '';
    
    const cacheDataKey = 'all-notifications'; // 通知不分学期，用一个固定的键
    const cachedData = StorageService.getCache(StorageService.KEYS.CACHED_NOTIFICATIONS, cacheDataKey, 10); // 通知更新快，缓存有效期设为10分钟

    if (cachedData) {
        console.log("从缓存加载通知...");
        if (cachedData.length > 0) {
            renderNotificationList(cachedData);
        } else {
            emptyState.style.display = 'block';
        }
    } else {
        loadingIndicator.style.display = 'block';
    }

    try {
        const result = await ApiService.getNotifications({
            cookies: loginInfo.cookies,
            school_name: loginInfo.school_name,
        });
        
        loadingIndicator.style.display = 'none';

        if (result && result.code === 1000 && Array.isArray(result.data)) {
            StorageService.setCache(StorageService.KEYS.CACHED_NOTIFICATIONS, cacheDataKey, result.data);
            if (result.data.length === 0) {
                emptyState.style.display = 'block';
            } else {
                renderNotificationList(result.data);
            }
        } else {
            if (!cachedData) {
                resultMessage.textContent = `加载失败: ${result.msg || '未知错误'}`;
            }
        }
    } catch (error) {
        loadingIndicator.style.display = 'none';
        if (!cachedData) {
            resultMessage.textContent = '加载过程中发生网络错误。';
        }
        console.error('Fetch all notifications error:', error);
    }
}

function renderNotificationList(notifications) {
    const listContainer = document.getElementById('notification-full-list');
    listContainer.innerHTML = '';
    if (!notifications) return;

    notifications.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'notification-item';
        itemElement.innerHTML = `
            <div class="notification-content">
                <span class="notification-title">${item.type || '通知'}</span>
                <span class="notification-summary">${item.content || '无内容'}</span>
                <span class="notification-time">${item.create_time || ''}</span>
            </div>
        `;
        listContainer.appendChild(itemElement);
    });
}