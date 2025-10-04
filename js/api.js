class ApiService {
    static BASE_URL = 'https://zfjw.wnvs.cn';

    static async #postRequest(endpoint, data) {
        const url = this.BASE_URL + endpoint;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP Error: ${response.status} - ${errorBody}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API POST request to ${endpoint} failed:`, error);
            return { code: -1, msg: `服务器内部错误: ${error.message}` };
        }
    }

    static async #getRequest(endpoint) {
        const url = this.BASE_URL + endpoint;
        try {
            const response = await fetch(url, { method: 'GET' });
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`API GET request to ${endpoint} failed:`, error);
            return { code: -1, msg: '网络请求失败' };
        }
    }

    static getSchools() { return this.#getRequest('/api/schools'); }
    static login(params) { return this.#postRequest('/api/login', params); }
    static loginWithCaptcha(params) { return this.#postRequest('/api/login_with_kaptcha', params); }
    static getInfo(params) { return this.#postRequest('/api/info', params); }
    static getGrade(params) { return this.#postRequest('/api/grade', params); }
    static getExam(params) { return this.#postRequest('/api/exam', params); }
    static getSchedule(params) { return this.#postRequest('/api/schedule', params); }
    static getNotifications(params) { return this.#postRequest('/api/notifications', params); }
    static getSelectedCourses(params) { return this.#postRequest('/api/selected_courses', params); }
    static dropCourse(params) { return this.#postRequest('/api/drop_course', params); }
    static getBlockCourses(params) { return this.#postRequest('/api/block_courses', params); }
    static getCourseClasses(params) { return this.#postRequest('/api/course_classes', params); }
    static selectCourse(params) { return this.#postRequest('/api/select_course', params); }

    /**
     * ===== 新增：获取详细成绩 =====
     */
    static getGradeDetail(params) {
        return this.#postRequest('/api/grade_detail', params);
    }
}