class StorageService {
    static KEYS = {
        USER_INFO: 'userInfo',
        LOGIN_INFO: 'loginInfo',
        // 新增：用于缓存各项数据的键
        CACHED_GRADES: 'cachedGrades',
        CACHED_EXAMS: 'cachedExams',
        CACHED_SCHEDULES: 'cachedSchedules',
        CACHED_NOTIFICATIONS: 'cachedNotifications',
    };

    static set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static get(key) {
        const item = localStorage.getItem(key);
        try {
            return JSON.parse(item);
        } catch (e) {
            return null;
        }
    }

    static isLoggedIn() {
        return !!this.get(this.KEYS.LOGIN_INFO);
    }
    
    static getLoginInfo() {
        return this.get(this.KEYS.LOGIN_INFO);
    }

    /**
     * 缓存数据，并附带时间戳
     * @param {string} cacheKey - 缓存的键
     * @param {string} dataKey - 数据的唯一标识 (例如 '2023-1')
     * @param {any} data - 要缓存的数据
     */
    static setCache(cacheKey, dataKey, data) {
        const cache = this.get(cacheKey) || {};
        cache[dataKey] = {
            timestamp: Date.now(),
            data: data
        };
        this.set(cacheKey, cache);
    }

    /**
     * 获取缓存数据
     * @param {string} cacheKey - 缓存的键
     * @param {string} dataKey - 数据的唯一标识
     * @param {number} maxAgeInMinutes - 缓存的最大有效期（分钟）
     * @returns {any|null} - 如果缓存有效则返回数据，否则返回 null
     */
    static getCache(cacheKey, dataKey, maxAgeInMinutes = 60) {
        const cache = this.get(cacheKey);
        if (!cache || !cache[dataKey]) {
            return null; // 没有缓存
        }

        const cachedItem = cache[dataKey];
        const now = Date.now();
        const maxAgeInMillis = maxAgeInMinutes * 60 * 1000;

        if (now - cachedItem.timestamp > maxAgeInMillis) {
            // 缓存已过期
            return null;
        }
        
        return cachedItem.data;
    }
}