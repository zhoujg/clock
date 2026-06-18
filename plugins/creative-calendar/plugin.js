/**
 * 创意万年历 — Creative Perpetual Calendar
 *
 * 融合公历/农历/节气，以中国风水墨意境呈现时间流转。
 * 自包含农历计算引擎（1900-2100），无需外部依赖。
 */
(function () {
    'use strict';

    const PLUGIN_ID = 'creative-calendar';

    /* ────── CSS 注入 ────── */
    function _ensureCSS() {
        if (document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `plugins/${PLUGIN_ID}/style.css?v=${Date.now()}`;
        link.dataset.pluginCss = PLUGIN_ID;
        document.head.appendChild(link);
    }

    function _removeCSS() {
        const link = document.querySelector(`link[data-plugin-css="${PLUGIN_ID}"]`);
        if (link) link.remove();
    }

    /* ================================================================
     *  农历计算引擎（自包含，覆盖 1900–2100 年）
     *  数据编码：每一年一个 hex 数
     *    bits 0-3  : 闰月月份（0=无闰月）
     *    bits 4-15 : 月份 1-12 的大小月标志（1=大月30天, 0=小月29天）
     *    bit  16   : 闰月大小标志（仅当有闰月时有效，1=大月, 0=小月）
     *  基准日：1900-01-31 = 农历庚子年正月初一
     * ============================================================= */
    const LUNAR_DATA = [
        0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2, // 1900-1909
        0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977, // 1910-1919
        0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970, // 1920-1929
        0x06566,0x0d4a0,0x0ea50,0x16a95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950, // 1930-1939
        0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557, // 1940-1949
        0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0, // 1950-1959
        0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0, // 1960-1969
        0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6, // 1970-1979
        0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570, // 1980-1989
        0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0, // 1990-1999
        0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5, // 2000-2009
        0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930, // 2010-2019
        0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530, // 2020-2029
        0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45, // 2030-2039
        0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0, // 2040-2049
        0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06aa0,0x1a6c4,0x0aae0, // 2050-2059
        0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4, // 2060-2069
        0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0, // 2070-2079
        0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160, // 2080-2089
        0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a4d0,0x0d150,0x0f252, // 2090-2099
        0x0d520                                                                    // 2100
    ];

    // 天干地支
    const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const DI_ZHI   = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const SHENG_XIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

    // 农历月份名
    const LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
    const LUNAR_DAYS = [
        '', '初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
        '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
        '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'
    ];

    // 节气和对应阳历约日（基于太阳黄经 15° 间隔，从春分=0° 起算）
    const SOLAR_TERMS = [
        '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
        '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑',
        '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
    ];

    /**
     * 计算指定年份每个节气的公历日期（基于天文算法近似）
     * 返回 [{name, month, day}] 共 24 个
     */
    function _calcSolarTerms(year) {
        const terms = [];
        // 节气基于太阳黄经，每 15° 一个。使用近似公式：
        // 每个节气距离春分（3月20日左右）的天数
        // 精确到 ±1 天的简化算法
        const baseJD = _solarTermBase(year);
        for (let i = 0; i < 24; i++) {
            const name = SOLAR_TERMS[i];
            // i=0 对应小寒（黄经 285°），i=5 对应春分（0°）
            const angle = (i + 18) * 15; // 小寒 = 285° = 19*15
            const jd = Math.round(baseJD + _solarTermOffset(year, angle));
            const d = _jdToDate(jd);
            terms.push({ name, month: d.m, day: d.d });
        }
        return terms;
    }

    // 简化天文算法：基准儒略日和角度→天数偏移
    function _solarTermBase(year) {
        // 春分日期近似
        const y = year;
        return _dateToJD(y, 3, 20.5 + (0.2422 * ((y - 2000) % 4) - ((y - 2000) / 100) * 0.1));
    }

    function _solarTermOffset(year, angle360) {
        // 每 15° 黄经约 15.2184 天
        const angle = angle360 % 360;
        const ref360 = 360;
        const daysPerDegree = 365.2422 / 360;
        // 简化：从春分(0°)起算
        // 小寒 = 285°, 即 -75° 从春分
        let delta = (angle - 0 + 360) % 360;
        if (delta > 180) delta -= 360;
        return delta * daysPerDegree;
    }

    function _dateToJD(y, m, d) {
        // 近似儒略日
        let a = Math.floor((14 - m) / 12);
        let yy = y + 4800 - a;
        let mm = m + 12 * a - 3;
        return d + Math.floor((153 * mm + 2) / 5) + 365 * yy +
               Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
    }

    function _jdToDate(jd) {
        let a = jd + 32044;
        let b = Math.floor((4 * a + 3) / 146097);
        let c = a - Math.floor(146097 * b / 4);
        let d = Math.floor((4 * c + 3) / 1461);
        let e = c - Math.floor(1461 * d / 4);
        let m = Math.floor((5 * e + 2) / 153);
        return {
            d: e - Math.floor((153 * m + 2) / 5) + 1,
            m: m + 3 - 12 * Math.floor(m / 10)
        };
    }

    // 获取某年闰月（0=无）
    function _leapMonth(year) {
        const idx = year - 1900;
        if (idx < 0 || idx >= LUNAR_DATA.length) return 0;
        return LUNAR_DATA[idx] & 0xf;
    }

    // 获取某年某月天数（农历月，1-12；闰月用负数表示）
    function _lunarMonthDays(year, month) {
        const idx = year - 1900;
        if (idx < 0 || idx >= LUNAR_DATA.length) return 30;
        const data = LUNAR_DATA[idx];
        const leap = data & 0xf;
        let isBig;
        if (month > 0) {
            isBig = (data >> (3 + month)) & 1;
        } else if (month < 0 && -month === leap) {
            isBig = (data >> 16) & 1;
        } else {
            return 0; // 不存在该月
        }
        return isBig ? 30 : 29;
    }

    // 获取农历年总天数
    function _lunarYearDays(year) {
        let sum = 0;
        for (let m = 1; m <= 12; m++) sum += _lunarMonthDays(year, m);
        const leap = _leapMonth(year);
        if (leap) sum += _lunarMonthDays(year, -leap);
        return sum;
    }

    /**
     * 公历 → 农历
     * 返回 { year, month, day, isLeap, yearName, monthName, dayName, shengXiao }
     */
    function _solarToLunar(date) {
        const y = date.getFullYear();
        const m = date.getMonth() + 1;
        const d = date.getDate();

        // 计算距离 1900-01-31 的天数差
        const base = new Date(1900, 0, 31);
        const offset = Math.floor((date - base) / (1000 * 60 * 60 * 24));

        if (offset < 0) {
            return { year: 1899, month: 12, day: 30, isLeap: false,
                yearName: '己亥', monthName: '腊月', dayName: '三十', shengXiao: '猪' };
        }

        // 逐年累加农历年天数，定位农历年份
        let lunarY = 1900;
        let daysLeft = offset;
        while (lunarY < 2101) {
            const yDays = _lunarYearDays(lunarY);
            if (daysLeft < yDays) break;
            daysLeft -= yDays;
            lunarY++;
        }

        // 逐月定位农历月份
        let lunarM = 1;
        let isLeap = false;
        const leapM = _leapMonth(lunarY);

        while (lunarM <= 12) {
            // 先走闰月（如果有且在当前月之后）
            if (leapM === lunarM && !isLeap) {
                const leapDays = _lunarMonthDays(lunarY, -lunarM);
                if (daysLeft < leapDays) { isLeap = true; break; }
                daysLeft -= leapDays;
            }
            const mDays = _lunarMonthDays(lunarY, lunarM);
            if (daysLeft < mDays) break;
            daysLeft -= mDays;
            lunarM++;
            isLeap = false;
        }

        const lunarD = daysLeft + 1;

        // 干支纪年
        const gzIdx = (lunarY - 4) % 60;
        const tg = TIAN_GAN[gzIdx % 10];
        const dz = DI_ZHI[gzIdx % 12];
        const sx = SHENG_XIAO[gzIdx % 12];
        const yearName = tg + dz;

        const monthName = (isLeap ? '闰' : '') + LUNAR_MONTHS[lunarM - 1] + '月';
        const dayName = LUNAR_DAYS[Math.min(lunarD, 30)] || '';

        return { year: lunarY, month: lunarM, day: lunarD, isLeap,
            yearName, monthName, dayName, shengXiao: sx };
    }

    // 获取当月节气
    function _getMonthTerms(year, month) {
        const terms = _calcSolarTerms(year);
        return terms.filter(t => t.month === month);
    }

    // 获取当月节日（公历+农历）
    function _getMonthHolidays(year, month, daysInMonth, getLunar) {
        const holidays = [];

        // 公历节日
        const solarHolidays = {
            '1-1': '元旦', '2-14': '情人节', '3-8': '妇女节', '3-12': '植树节',
            '4-1': '愚人节', '5-1': '劳动节', '5-4': '青年节', '6-1': '儿童节',
            '7-1': '建党节', '8-1': '建军节', '9-10': '教师节', '10-1': '国庆节',
            '12-25': '圣诞节', '10-31': '万圣节'
        };

        for (let d = 1; d <= daysInMonth; d++) {
            const key = month + '-' + d;
            if (solarHolidays[key]) {
                holidays.push({ day: d, name: solarHolidays[key], type: 'solar' });
            }
        }

        // 农历节日
        const lunarHolidays = {
            '1-1': '春节', '1-15': '元宵节', '5-5': '端午节',
            '7-7': '七夕', '7-15': '中元节', '8-15': '中秋节',
            '9-9': '重阳节', '12-30': '除夕', '12-29': '除夕'
        };

        for (let d = 1; d <= daysInMonth; d++) {
            const solarDate = new Date(year, month - 1, d);
            const lunar = getLunar(solarDate);
            const lKey = lunar.month + '-' + lunar.day;
            if (lunarHolidays[lKey] && !lunar.isLeap) {
                holidays.push({ day: d, name: lunarHolidays[lKey], type: 'lunar' });
            }
            // 除夕前一天（腊月二十九也可能是除夕）
            if (lunar.month === 12 && lunar.day === 29 && lunarHolidays['12-29']) {
                const nextDay = new Date(year, month - 1, d + 1);
                const nextLunar = getLunar(nextDay);
                if (nextLunar.month === 1 && nextLunar.day === 1) {
                    // 除夕前一天，下一天是春节
                }
            }
        }

        return holidays;
    }

    /* ────── 状态 ────── */

    let _modalEl = null;
    let _overlayEl = null;
    let _settingItemEl = null;
    let _viewYear, _viewMonth;
    let _today = new Date();

    function _now() { return new Date(); }

    /* ────── UI ────── */

    function _createSettingItem() {
        if (_settingItemEl) return;
        const panelContent = document.querySelector('.settings-panel .panel-content');
        if (!panelContent) return;

        _settingItemEl = document.createElement('div');
        _settingItemEl.className = 'setting-item';
        _settingItemEl.setAttribute('data-plugin-setting', PLUGIN_ID);
        _settingItemEl.innerHTML = `
            <span class="setting-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            </span>
            <span class="setting-text">万年历</span>
        `;
        _settingItemEl.addEventListener('click', (e) => {
            e.stopPropagation();
            _showModal();
        });
        panelContent.appendChild(_settingItemEl);
    }

    function _removeSettingItem() {
        if (_settingItemEl) { _settingItemEl.remove(); _settingItemEl = null; }
    }

    function _createModal() {
        if (_modalEl) return;

        _overlayEl = document.createElement('div');
        _overlayEl.className = 'cc-overlay';
        _overlayEl.addEventListener('click', _hideModal);

        _modalEl = document.createElement('div');
        _modalEl.className = 'cc-modal';

        _modalEl.innerHTML = `
            <div class="cc-header">
                <button class="cc-nav" id="ccPrevMonth" title="上个月">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <div class="cc-title-area">
                    <div class="cc-title" id="ccTitle">2026年 六月</div>
                    <div class="cc-lunar-year" id="ccLunarYear">丙午年·马年</div>
                </div>
                <button class="cc-nav" id="ccNextMonth" title="下个月">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
                <button class="cc-close" id="ccClose" title="关闭">&times;</button>
            </div>
            <div class="cc-weekdays">
                <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span class="cc-weekend">六</span><span class="cc-weekend">日</span>
            </div>
            <div class="cc-grid" id="ccGrid"></div>
            <div class="cc-footer" id="ccFooter"></div>
        `;

        document.body.appendChild(_overlayEl);
        document.body.appendChild(_modalEl);

        // 事件绑定
        _modalEl.querySelector('#ccClose').addEventListener('click', _hideModal);
        _modalEl.querySelector('#ccPrevMonth').addEventListener('click', () => {
            _viewMonth--; if (_viewMonth < 1) { _viewMonth = 12; _viewYear--; }
            _render();
        });
        _modalEl.querySelector('#ccNextMonth').addEventListener('click', () => {
            _viewMonth++; if (_viewMonth > 12) { _viewMonth = 1; _viewYear++; }
            _render();
        });

        // 阻止弹窗内点击冒泡
        _modalEl.addEventListener('click', (e) => e.stopPropagation());

        // ESC 关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && _modalEl && _modalEl.style.display === 'flex') {
                _hideModal();
            }
        });

        // 监听故事数据变更，自动刷新日历中的故事标记
        document.addEventListener('stories-updated', () => {
            if (_modalEl && _modalEl.style.display === 'flex') {
                _render();
            }
        });
    }

    function _showModal() {
        _createModal();
        const now = _now();
        _viewYear = now.getFullYear();
        _viewMonth = now.getMonth() + 1;
        _today = now;
        _render();
        _overlayEl.style.display = 'block';
        _modalEl.style.display = 'flex';
    }

    function _hideModal() {
        if (_overlayEl) _overlayEl.style.display = 'none';
        if (_modalEl) _modalEl.style.display = 'none';
    }

    /* ────── 渲染 ────── */

    function _render() {
        const year = _viewYear, month = _viewMonth;
        const now = _now();

        // 标题
        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
            '七月', '八月', '九月', '十月', '十一月', '十二月'];

        // 农历年干支
        const lunarYearDummy = _solarToLunar(new Date(year, 0, 1));
        // 农历年通常从春节开始，用当前月份的农历年来校正
        const midLunar = _solarToLunar(new Date(year, month - 1, 15));
        const titleEl = document.getElementById('ccTitle');
        const lunarYearEl = document.getElementById('ccLunarYear');
        if (titleEl) titleEl.textContent = `${year}年 ${monthNames[month - 1]}`;
        if (lunarYearEl) {
            lunarYearEl.textContent = `${midLunar.yearName}年 · ${midLunar.shengXiao}年`;
        }

        // 计算当月第一天星期几（周一=0）
        const firstDay = new Date(year, month - 1, 1);
        let startDow = firstDay.getDay(); // 0=周日
        startDow = startDow === 0 ? 6 : startDow - 1; // 转为周一=0

        const daysInMonth = new Date(year, month, 0).getDate();

        // 前一天月的尾数
        const prevMonthDays = new Date(year, month - 1, 0).getDate();

        // 获取本月节气
        const terms = _getMonthTerms(year, month);
        const termMap = {};
        terms.forEach(t => { termMap[t.day] = t.name; });

        // 获取节日
        const holidays = _getMonthHolidays(year, month, daysInMonth, _solarToLunar);
        const holidayMap = {};
        holidays.forEach(h => { holidayMap[h.day] = { name: h.name, type: h.type }; });

        // 读取每日故事数据（松耦合，无数据则跳过）
        let storiesData = {};
        const hasStoriesInstalled = window.PluginManager && window.PluginManager.isInstalled('daily-stories');
        if (hasStoriesInstalled) {
            try {
                const raw = localStorage.getItem('dailyStories');
                if (raw) { storiesData = JSON.parse(raw); }
            } catch (e) { /* 忽略解析错误 */ }
        }

        // 构建日格
        const gridEl = document.getElementById('ccGrid');
        if (!gridEl) return;
        gridEl.innerHTML = '';

        const totalCells = 42; // 6行 × 7列
        const isToday = (d) => {
            return year === now.getFullYear() && month === (now.getMonth() + 1) && d === now.getDate();
        };

        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'cc-cell';

            let dayNum;
            let isCurrent = true;
            let isOtherMonth = false;

            if (i < startDow) {
                // 上月尾
                dayNum = prevMonthDays - startDow + i + 1;
                isCurrent = false;
                isOtherMonth = true;
            } else if (i - startDow >= daysInMonth) {
                // 下月头
                dayNum = i - startDow - daysInMonth + 1;
                isCurrent = false;
                isOtherMonth = true;
            } else {
                dayNum = i - startDow + 1;
            }

            const solarDate = new Date(year, month - 1, dayNum);
            const lunar = isCurrent ? _solarToLunar(solarDate) : null;

            // 内层容器
            const inner = document.createElement('div');
            inner.className = 'cc-cell-inner';

            // 当天高亮
            if (isCurrent && isToday(dayNum)) {
                inner.classList.add('cc-today');
            }

            // 非当月
            if (isOtherMonth) {
                inner.classList.add('cc-other-month');
            }

            // 周末
            const realDow = (startDow + i) % 7;
            if (realDow >= 5) {
                inner.classList.add('cc-weekend-cell');
            }

            // 公历日数字
            const solarSpan = document.createElement('span');
            solarSpan.className = 'cc-solar-day';
            solarSpan.textContent = dayNum;

            // 节日标记
            if (isCurrent && holidayMap[dayNum]) {
                const hInfo = holidayMap[dayNum];
                solarSpan.classList.add('cc-holiday');
                if (hInfo.type === 'lunar') solarSpan.classList.add('cc-lunar-holiday');
                solarSpan.setAttribute('title', hInfo.name);
                // 春节、国庆等重要节日特殊样式
                if (hInfo.name === '春节' || hInfo.name === '国庆节' || hInfo.name === '中秋节') {
                    inner.classList.add('cc-important-holiday');
                }
            }

            inner.appendChild(solarSpan);

            // 农历日
            if (isCurrent && lunar) {
                const lunarSpan = document.createElement('span');
                lunarSpan.className = 'cc-lunar-day';
                // 初一显示月份名
                if (lunar.day === 1) {
                    lunarSpan.textContent = (lunar.isLeap ? '闰' : '') + LUNAR_MONTHS[lunar.month - 1] + '月';
                    lunarSpan.classList.add('cc-lunar-month-start');
                } else {
                    lunarSpan.textContent = lunar.dayName;
                }
                // 农历节日
                if (holidayMap[dayNum] && holidayMap[dayNum].type === 'lunar') {
                    lunarSpan.textContent = holidayMap[dayNum].name;
                    lunarSpan.classList.add('cc-lunar-holiday-text');
                }
                inner.appendChild(lunarSpan);
            }

            // 节气
            if (isCurrent && termMap[dayNum]) {
                const termSpan = document.createElement('span');
                termSpan.className = 'cc-term';
                termSpan.textContent = termMap[dayNum];
                inner.appendChild(termSpan);
            }

            // 故事标记点（松耦合，仅当 daily-stories 已安装且有数据时显示）
            if (isCurrent && hasStoriesInstalled) {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayStories = storiesData[dateStr];
                if (dayStories && dayStories.length > 0) {
                    const completed = dayStories.filter(s => s.completed).length;
                    const total = dayStories.length;
                    const allDone = completed === total;

                    const dot = document.createElement('span');
                    dot.className = 'cc-story-dot' + (allDone ? ' cc-story-done' : '');
                    dot.textContent = allDone ? '' : String(total);
                    dot.title = allDone
                        ? `${total} 个故事全部完成 ✓`
                        : `${completed}/${total} 个故事已完成`;

                    // 点击跳转到每日故事
                    cell.style.cursor = 'pointer';
                    cell.addEventListener('click', (e) => {
                        e.stopPropagation();
                        _hideModal();
                        if (window.dailyStoriesManager) {
                            window.dailyStoriesManager.navigateToDate(dateStr);
                            // 确保面板打开
                            setTimeout(() => {
                                const panel = document.getElementById('storiesPanel');
                                if (panel && panel.style.display !== 'flex') {
                                    window.dailyStoriesManager.togglePanel();
                                }
                            }, 150);
                        }
                    });

                    inner.appendChild(dot);
                }
            }

            cell.appendChild(inner);
            gridEl.appendChild(cell);
        }

        // 底部信息
        const footerEl = document.getElementById('ccFooter');
        if (footerEl) {
            const termList = terms.map(t => `${t.name} ${t.month}/${t.day}`).join(' · ');
            const holidayList = holidays.map(h => `${h.name} ${month}/${h.day}`).join(' · ');
            let footerHTML = '';
            if (termList) footerHTML += `<div class="cc-terms-line">🌿 ${termList}</div>`;
            if (holidayList) footerHTML += `<div class="cc-holidays-line">🎋 ${holidayList}</div>`;
            if (!termList && !holidayList) {
                footerHTML = `<div class="cc-terms-line">— ${year}年${monthNames[month - 1]} —</div>`;
            }
            footerEl.innerHTML = footerHTML;
        }
    }

    /* ────── 插件注册 ────── */

    window.PluginManager.register({
        id: PLUGIN_ID,
        name: '创意万年历',
        version: '1.0.0',
        description: '融合公历、农历、二十四节气的创意万年历，以中国风视觉语言呈现时间流转。',
        icon: '📅',
        author: '时钟应用',

        onActivate: async function () {
            _ensureCSS();
            _createSettingItem();
        },

        onDeactivate: async function () {
            _hideModal();
            _removeSettingItem();
        },

        onUninstall: async function () {
            _hideModal();
            _removeCSS();
            _removeSettingItem();
            if (_modalEl) { _modalEl.remove(); _modalEl = null; }
            if (_overlayEl) { _overlayEl.remove(); _overlayEl = null; }
        }
    });

    // 暴露公开方法供外部调用（如首页长按日期快捷打开）
    window.__creativeCalendar = {
        show: function () {
            if (!_modalEl) _createModal();
            _showModal();
        },
        hide: _hideModal,
        isOpen: function () { return _overlayEl && _overlayEl.style.display === 'flex'; }
    };

    console.log('[创意万年历] 插件已注册');
})();
