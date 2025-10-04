const navContainer = document.getElementById('navbar-container');
if (navContainer) {
    fetch('../nav.html')
        .then(response => response.text())
        .then(data => {
            navContainer.innerHTML = data;
            highlightCurrentNav();
        });
}

document.addEventListener('DOMContentLoaded', () => {
    if (!StorageService.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    displayUserInfo();

    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', async () => {
        // 使用新的确认弹窗
        const confirmed = await UI.showConfirm('退出登录', '您确定要退出当前账号吗？');
        if (confirmed) {
            localStorage.clear();
            window.location.href = 'login.html';
        }
    });
});

function displayUserInfo() {
    const userInfo = StorageService.get(StorageService.KEYS.USER_INFO);
    if (userInfo) {
        document.getElementById('user-avatar-text').innerText = userInfo.name ? userInfo.name.charAt(0) : '学';
        document.getElementById('user-name').innerText = userInfo.name || '未获取';
        document.getElementById('user-id').innerText = `学号：${userInfo.sid || '未获取'}`;
    }
}

function highlightCurrentNav() {
    document.getElementById('nav-profile')?.classList.add('active');
}