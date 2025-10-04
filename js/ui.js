// js/ui.js

class UI {
    /**
     * 显示一个信息提示框 (替代 alert)
     * @param {string} title - 标题
     * @param {string} text - 内容
     * @param {'success'|'error'|'warning'|'info'} icon - 图标类型
     */
    static showMessage(title, text, icon = 'info') {
        Swal.fire({
            title: title,
            text: text,
            icon: icon,
            confirmButtonColor: '#007aff',
            confirmButtonText: '好的'
        });
    }

    /**
     * 显示一个确认对话框 (替代 confirm)
     * @param {string} title - 标题
     * @param {string} text - 内容
     * @returns {Promise<boolean>} - 用户点击确认则返回 true, 否则返回 false
     */
    static async showConfirm(title, text) {
        const result = await Swal.fire({
            title: title,
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#007aff',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '确认',
            cancelButtonText: '取消'
        });
        return result.isConfirmed;
    }

    /**
     * 显示一个课程详情弹窗
     * @param {object} course - 课程对象
     */
    static showCourseDetail(course) {
        const dayOfWeek = parseInt(course.weekday, 10);
        const sessionMatch = course.time.match(/(\d+)-(\d+)/);
        const startSession = sessionMatch ? sessionMatch[1] : '?';
        const endSession = sessionMatch ? sessionMatch[2] : '?';

        Swal.fire({
            title: `<strong>${course.title}</strong>`,
            html: `
                <div class="swal-course-details">
                    <div><strong>上课时间:</strong> 周${'一二三四五六日'[dayOfWeek - 1]} 第 ${startSession}-${endSession} 节</div>
                    <div><strong>上课地点:</strong> ${course.place}</div>
                    <div><strong>任课教师:</strong> ${course.teacher}</div>
                    <div><strong>上课周次:</strong> ${course.weeks}</div>
                </div>
            `,
            confirmButtonColor: '#007aff',
            confirmButtonText: '关闭'
        });
    }
}