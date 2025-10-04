document.addEventListener('DOMContentLoaded', () => {
    if (!StorageService.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const loadingIndicator = document.getElementById('loading-indicator');
    const saveButton = document.getElementById('save-card-button');

    loadingIndicator.style.display = 'block';

    const userInfo = StorageService.get(StorageService.KEYS.USER_INFO);

    if (userInfo) {
        renderBusinessCard(userInfo);
    } else {
        loadingIndicator.style.display = 'none';
        const container = document.querySelector('.container');
        container.innerHTML += '<p class="result-message">无法加载用户信息，请重新登录。</p>';
    }

    saveButton.addEventListener('click', () => {
        const cardElement = document.getElementById('business-card');
        const studentName = document.getElementById('card-name').textContent || 'card';

        html2canvas(cardElement, {
            useCORS: true,
            scale: window.devicePixelRatio * 2,
        }).then(canvas => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `${studentName}-名片.png`;
            link.click();
        });
    });
});

/**
 * 生成一个随机的、柔和的 HSL 颜色字符串
 */
function getRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 21) + 70; // 70-90%
    const lightness = Math.floor(Math.random() * 11) + 85;  // 85-95%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

async function renderBusinessCard(userInfo) {
    const loadingIndicator = document.getElementById('loading-indicator');
    const businessCard = document.getElementById('business-card');
    const cardHeader = document.querySelector('.card-header'); // 获取头像区域元素
    const avatarImg = document.getElementById('card-avatar');
    const saveButton = document.getElementById('save-card-button');

    // 1. 生成并应用随机渐变背景到头像区域
    const color1 = getRandomPastelColor();
    const color2 = getRandomPastelColor();
    const angle = Math.floor(Math.random() * 360);
    cardHeader.style.background = `linear-gradient(${angle}deg, ${color1}, ${color2})`;

    // 2. 填充本地信息
    document.getElementById('card-name').textContent = userInfo.name || '---';
    document.getElementById('card-sid').textContent = userInfo.sid || '---';
    document.getElementById('card-college').textContent = userInfo.college_name || '---';
    document.getElementById('card-major').textContent = userInfo.major_name || '---';
    document.getElementById('card-email').textContent = userInfo.email || '未提供';

    let gender = '未知';
    if (userInfo.id_number && userInfo.id_number.length === 18) {
        const genderDigit = parseInt(userInfo.id_number.charAt(16), 10);
        gender = (genderDigit % 2 !== 0) ? '男' : '女';
    }
    document.getElementById('card-gender').textContent = gender;

    // 3. 同时发起头像和一言的网络请求
    const avatarPromise = fetch('https://www.loliapi.com/acg/pp/').catch(err => {
        console.error("头像API请求失败:", err);
        return null;
    });
    const yiyanPromise = fetch('https://api.nxvav.cn/api/yiyan/?encode=json&charset=utf-8').then(res => res.json()).catch(err => {
        console.error("一言API请求失败:", err);
        return null;
    });
    
    // 4. 等待请求完成并处理结果
    const [avatarResponse, yiyanData] = await Promise.all([avatarPromise, yiyanPromise]);

    if (avatarResponse && avatarResponse.ok) {
        avatarImg.src = avatarResponse.url;
    } else {
        avatarImg.src = `https://api.multiavatar.com/${userInfo.sid || 'default'}.svg`;
    }

    if (yiyanData && yiyanData.yiyan) {
        document.getElementById('card-yiyan').textContent = `“ ${yiyanData.yiyan} ”`;
        document.getElementById('yiyan-author').textContent = `—— ${yiyanData.nick || '佚名'}`;
    } else {
        document.getElementById('card-yiyan').textContent = '生活，一半是回忆，一半是继续。';
    }
    
    // 5. 立即显示卡片
    loadingIndicator.style.display = 'none';
    businessCard.style.display = 'block';
    saveButton.style.display = 'block';
}