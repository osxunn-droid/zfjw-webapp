document.addEventListener('DOMContentLoaded', () => {
    const navContainer = document.getElementById('navbar-container');
    if (navContainer) {
        // 使用 fetch 加载 nav.html 的内容
        fetch('../nav.html')
            .then(response => response.text())
            .then(data => {
                navContainer.innerHTML = data;
                // 设置当前页面的高亮状态
                highlightCurrentNav();
            });
    }
});

function highlightCurrentNav() {
    const currentPage = window.location.pathname; // 获取当前页面的路径

    // 根目录的 index.html
    if (currentPage.endsWith('/') || currentPage.endsWith('index.html')) {
        document.getElementById('nav-index')?.classList.add('active');
    } else if (currentPage.includes('schedule.html')) {
        document.getElementById('nav-schedule')?.classList.add('active');
    } else if (currentPage.includes('profile.html')) {
        document.getElementById('nav-profile')?.classList.add('active');
    }
}