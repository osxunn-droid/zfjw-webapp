let captchaInfo = null;

document.addEventListener('DOMContentLoaded', () => {
    if (StorageService.isLoggedIn()) {
        window.location.href = '../index.html';
        return;
    }
    const loginForm = document.getElementById('login-form');
    const captchaImage = document.getElementById('captcha-image');
    loadSchools();
    loginForm.addEventListener('submit', handleLogin);
    captchaImage.addEventListener('click', (e) => {
        if (document.getElementById('captcha-group').style.display === 'block') {
            captchaInfo = null;
            handleLogin(e);
        }
    });
});

async function loadSchools() {
    const schoolSelect = document.getElementById('school-select');
    const response = await ApiService.getSchools();
    if (response && response.code === 1000 && response.data.schools) {
        schoolSelect.innerHTML = '<option value="">-- 请选择你的学校 --</option>';
        response.data.schools.forEach(school => {
            const option = new Option(school.school_name, school.school_name);
            schoolSelect.add(option);
        });
    } else {
        schoolSelect.innerHTML = '<option value="">无法加载学校列表</option>';
    }
}

async function handleLogin(event) {
    if (event) event.preventDefault();
    const loginButton = document.getElementById('login-button');
    const buttonText = document.getElementById('login-button-text');
    const spinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const school_name = document.getElementById('school-select').value;
    const sid = document.getElementById('sid').value;
    const password = document.getElementById('password').value;
    if (!school_name || !sid || !password) {
        errorMessage.textContent = '请填写所有必填项！';
        return;
    }
    errorMessage.textContent = '';
    loginButton.disabled = true;
    buttonText.style.display = 'none';
    spinner.style.display = 'block';
    try {
        let result;
        if (captchaInfo) {
            const captcha_input = document.getElementById('captcha-input').value;
            if (!captcha_input) {
                errorMessage.textContent = '请输入验证码！';
                throw new Error("Captcha not entered");
            }
            const captchaParams = { school_name, sid, password, kaptcha: captcha_input, ...captchaInfo };
            result = await ApiService.loginWithCaptcha(captchaParams);
        } else {
            const loginParams = { school_name, sid, password };
            result = await ApiService.login(loginParams);
        }
        await processLoginResult(result);
    } catch (error) {
        if (error.message !== "Captcha not entered") {
            errorMessage.textContent = '发生未知错误，请稍后重试。';
        }
        console.error('Login process error:', error);
    } finally {
        loginButton.disabled = false;
        buttonText.style.display = 'inline';
        spinner.style.display = 'none';
    }
}

async function processLoginResult(result) {
    const errorMessage = document.getElementById('error-message');
    const captchaGroup = document.getElementById('captcha-group');
    const captchaImage = document.getElementById('captcha-image');

    if (!result) {
        errorMessage.textContent = "网络或服务器错误。";
        return;
    }
    
    switch (result.code) {
        case 1000:
            const loginInfo = { 
                cookies: result.data.cookies, 
                school_name: document.getElementById('school-select').value 
            };
            StorageService.set(StorageService.KEYS.LOGIN_INFO, loginInfo);
            errorMessage.textContent = "登录成功，正在获取用户信息...";
            const infoResult = await ApiService.getInfo(loginInfo);
            if (infoResult && infoResult.code === 1000) {
                StorageService.set(StorageService.KEYS.USER_INFO, infoResult.data);
                window.location.href = '../index.html';
            } else {
                errorMessage.textContent = `获取用户信息失败: ${infoResult.msg || '未知错误'}`;
            }
            break;
        case 1001:
        case 1004:
            errorMessage.textContent = result.code === 1004 ? "验证码错误，请重新输入。" : "请输入图片中的验证码。";
            captchaGroup.style.display = 'block';
            let captchaData = result.data.kaptcha_pic;
            if (captchaData && !captchaData.startsWith('data:image')) {
                captchaData = 'data:image/png;base64,' + captchaData;
            }
            captchaImage.src = captchaData;
            captchaInfo = { 
                cookies: result.data.cookies,
                csrf_token: result.data.csrf_token,
                modulus: result.data.modulus,
                exponent: result.data.exponent
            };
            break;
        default:
            errorMessage.textContent = result.msg || '登录失败，请检查您的凭据。';
            captchaGroup.style.display = 'none';
            captchaInfo = null;
            break;
    }
}