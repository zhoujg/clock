// 设置存储管理器
class SettingsStorage {
    constructor() {
        this.storageKey = 'flipClockSettings';
    }

    // 保存设置
    save(settings) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('保存设置失败:', error);
            return false;
        }
    }

    // 加载设置
    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : this.getDefaultSettings();
        } catch (error) {
            console.error('加载设置失败:', error);
            return this.getDefaultSettings();
        }
    }

    // 清除设置
    clear() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('清除设置失败:', error);
            return false;
        }
    }

    // 获取默认设置
    getDefaultSettings() {
        return {
            backgroundColor: '#1a1a1a',
            backgroundImage: null,
            animationEnabled: false,
            tickSoundEnabled: false
        };
    }
}
