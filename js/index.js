document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatusAndUpdateUI();
});

function checkLoginStatusAndUpdateUI() {
    const loginPrompt = document.getElementById('login-prompt');
    const userCard = document.getElementById('user-card');
    const recentNotifications = document.getElementById('recent-notifications');

    if (StorageService.isLoggedIn()) {
        loginPrompt.style.display = 'none';
        userCard.style.display = 'flex';
        recentNotifications.style.display = 'block';
        displayUserInfo();
        loadNotifications();
    } else {
        loginPrompt.style.display = 'block';
        userCard.style.display = 'none';
        recentNotifications.style.display = 'none';
    }
}

function displayUserInfo() {
    const userInfo = StorageService.get(StorageService.KEYS.USER_INFO);
    
    if (userInfo) {
        document.getElementById('user-avatar-text').innerText = userInfo.name ? userInfo.name.charAt(0) : '学';
        document.getElementById('user-name').innerText = userInfo.name || '未获取到姓名';
        document.getElementById('user-id').innerText = `学号：${userInfo.sid || '未获取到学号'}`;
        
        const collegeText = `${userInfo.college_name || ''} - ${userInfo.major_name || ''}`;
        document.getElementById('user-college').innerText = collegeText;
    }
}

async function loadNotifications() {
    const loginInfo = StorageService.getLoginInfo();
    if (!loginInfo) return;

    const result = await ApiService.getNotifications({
        cookies: loginInfo.cookies,
        school_name: loginInfo.school_name,
    });

    if (result && result.code === 1000 && Array.isArray(result.data)) {
        renderNotifications(result.data.slice(0, 3));
    }
}

function renderNotifications(notifications) {
    const notificationList = document.getElementById('notification-list');
    notificationList.innerHTML = '';

    if (notifications.length === 0) {
        notificationList.innerHTML = '<p>暂无最新通知</p>';
        return;
    }

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
        // 关键修改：点击通知项跳转到详情页
        itemElement.addEventListener('click', () => {
            const title = encodeURIComponent(item.type || '通知');
            const content = encodeURIComponent(item.content || '无内容');
            // 通过URL参数传递信息，并标记为详情查看模式
            window.location.href = `pages/notification.html?title=${title}&content=${content}&isDetail=true`;
        });
        notificationList.appendChild(itemElement);
    });
}