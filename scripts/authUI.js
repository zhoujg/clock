/**
 * 登录/注册 UI 浮层
 */
class AuthUI {
    constructor() {
        this.cloudSync = window.cloudSync;
        this.panel = null;
        this.isOpen = false;
        this.mode = 'login'; // 'login' | 'register'

        this.init();
    }

    init() {
        this.createPanel();
        this.createEntranceButton();
        this.cloudSync.onChange((isLoggedIn) => this.updateEntranceState(isLoggedIn));
    }

    // ====================
    // 入口按钮（右下角）
    // ====================
    createEntranceButton() {
        const btn = document.createElement('button');
        btn.id = 'authEntranceBtn';
        btn.className = 'auth-entrance-btn';
        btn.title = '登录同步';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="auth-entrance-icon">
                <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.6"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6"/>
            </svg>
        `;
        btn.addEventListener('click', () => this.toggle());

        // 放入 controls 容器与现有按钮排列
        const controlsEl = document.querySelector('.controls');
        if (controlsEl) {
            controlsEl.appendChild(btn);
        } else {
            document.body.appendChild(btn);
        }
        this.entranceBtn = btn;
    }

    updateEntranceState(isLoggedIn) {
        if (isLoggedIn) {
            this.entranceBtn.classList.add('logged-in');
            this.entranceBtn.title = '已登录 - 点击查看个人信息';
        } else {
            this.entranceBtn.classList.remove('logged-in');
            this.entranceBtn.title = '点击登录以同步数据';
        }
    }

    // ====================
    // 浮层面板
    // ====================
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open(mode = null) {
        if (mode) this.mode = mode;

        if (this.cloudSync.isLoggedIn) {
            this.renderProfile();
        } else {
            this.renderForm();
        }

        this.panel.style.display = 'flex';
        this.isOpen = true;
    }

    close() {
        this.panel.style.display = 'none';
        this.isOpen = false;
    }

    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'authPanel';
        panel.style.cssText = `
            display: none;
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            z-index: 10000;
            align-items: center; justify-content: center;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
        `;

        // 点击背景关闭
        panel.addEventListener('click', (e) => {
            if (e.target === panel) this.close();
        });

        // 内容容器
        const container = document.createElement('div');
        container.className = 'auth-container';
        container.style.cssText = `
            background: rgba(30,30,30,0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 32px;
            max-width: 380px;
            width: 90%;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        `;
        container.addEventListener('click', (e) => e.stopPropagation());

        // 关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            position: absolute; top: 16px; right: 16px;
            background: none; border: none; color: rgba(255,255,255,0.5);
            font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 4px;
            transition: color 0.2s;
        `;
        closeBtn.addEventListener('mouseenter', () => { closeBtn.style.color = '#fff'; });
        closeBtn.addEventListener('mouseleave', () => { closeBtn.style.color = 'rgba(255,255,255,0.5)'; });
        closeBtn.addEventListener('click', () => this.close());

        const formWrapper = document.createElement('div');
        formWrapper.id = 'authFormWrapper';

        container.appendChild(closeBtn);
        container.appendChild(formWrapper);
        panel.appendChild(container);

        document.body.appendChild(panel);
        this.panel = panel;
        this.formWrapper = formWrapper;
    }

    renderForm() {
        const isLogin = this.mode === 'login';
        this.formWrapper.innerHTML = `
            <h2 style="margin:0 0 8px; font-size:22px; font-weight:600;">
                ${isLogin ? '登录同步' : '注册账号'}
            </h2>
            <p style="margin:0 0 24px; color: rgba(255,255,255,0.5); font-size:13px;">
                ${isLogin ? '登录后可在多设备间同步数据' : '注册后可跨设备同步你的所有数据'}
            </p>

            <form id="authForm" style="display:flex; flex-direction:column; gap:16px;">
                ${!isLogin ? `
                <div>
                    <label style="display:block; margin-bottom:6px; font-size:13px; color: rgba(255,255,255,0.6);">
                        昵称
                    </label>
                    <input type="text" id="authNickname"
                        placeholder="给自己取个名字吧"
                        maxlength="20"
                        style="
                            width:100%; padding:10px 12px;
                            background: rgba(255,255,255,0.08);
                            border: 1px solid rgba(255,255,255,0.15);
                            border-radius: 8px;
                            color: #fff; font-size:14px;
                            outline: none; transition: border-color 0.2s;
                            box-sizing: border-box;
                        " />
                </div>
                ` : ''}
                <div>
                    <label style="display:block; margin-bottom:6px; font-size:13px; color: rgba(255,255,255,0.6);">
                        手机号
                    </label>
                    <input type="tel" id="authPhone" required
                        placeholder="手机号（支持中国大陆和香港）"
                        maxlength="13"
                        style="
                            width:100%; padding:10px 12px;
                            background: rgba(255,255,255,0.08);
                            border: 1px solid rgba(255,255,255,0.15);
                            border-radius: 8px;
                            color: #fff; font-size:14px;
                            outline: none; transition: border-color 0.2s;
                            box-sizing: border-box;
                        " />
                </div>

                <div>
                    <label style="display:block; margin-bottom:6px; font-size:13px; color: rgba(255,255,255,0.6);">
                        密码
                    </label>
                    <input type="password" id="authPassword" required
                        placeholder="至少 6 个字符"
                        style="
                            width:100%; padding:10px 12px;
                            background: rgba(255,255,255,0.08);
                            border: 1px solid rgba(255,255,255,0.15);
                            border-radius: 8px;
                            color: #fff; font-size:14px;
                            outline: none; transition: border-color 0.2s;
                            box-sizing: border-box;
                        " />
                </div>

                <div id="authError" style="display:none; color: #ef4444; font-size:12px;"></div>

                <button type="submit"
                    style="
                        width:100%; padding:12px;
                        background: linear-gradient(135deg, #6366f1, #8b5cf6);
                        border: none; border-radius: 8px;
                        color: #fff; font-size:14px; font-weight:600;
                        cursor: pointer; transition: opacity 0.2s;
                        margin-top: 4px;
                    ">
                    ${isLogin ? '登录' : '注册'}
                </button>
            </form>

            <div style="text-align:center; margin-top:20px;">
                <button id="authSwitchMode" style="
                    background: none; border: none;
                    color: rgba(255,255,255,0.5); font-size:13px;
                    cursor: pointer; transition: color 0.2s;
                ">
                    ${isLogin ? '没有账号？注册 →' : '已有账号？登录 →'}
                </button>
            </div>

            ${this.cloudSync.isLoggedIn ? `
                <div style="margin-top:20px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.08);">
                    <button id="authLogoutBtn" style="
                        width:100%; padding:10px;
                        background: rgba(255,255,255,0.08);
                        border: 1px solid rgba(255,255,255,0.15);
                        border-radius: 8px;
                        color: rgba(255,255,255,0.6); font-size:13px;
                        cursor: pointer; transition: all 0.2s;
                    ">
                        退出登录
                    </button>
                </div>
            ` : ''}
        `;

        this.bindFormEvents();
    }

    renderProfile() {
        const phone = this.cloudSync.userPhone || '';
        const nickname = this.cloudSync.userNickname;

        this.formWrapper.innerHTML = `
            <div style="text-align:center;">
                <div style="
                    width:72px; height:72px; margin:0 auto 16px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                ">
                    <svg viewBox="0 0 24 24" fill="none" style="width:36px; height:36px;">
                        <circle cx="12" cy="8" r="4" fill="#fff" opacity="0.9"/>
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.9"/>
                    </svg>
                </div>

                <div style="margin-bottom:24px;">
                    <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:2px;">
                        <span style="color:rgba(255,255,255,0.35); font-size:11px; min-width:28px;">昵称</span>
                        <span style="color:#fff; font-size:16px; font-weight:500;">${nickname || '未设置'}</span>
                    </div>
                    <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
                        <span style="color:rgba(255,255,255,0.35); font-size:11px; min-width:28px;">号码</span>
                        <span style="color:rgba(255,255,255,0.55); font-size:14px;">${phone}</span>
                    </div>
                </div>
            </div>

            <div style="
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 20px;
            ">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
                    <span style="color: rgba(255,255,255,0.5); font-size:13px;">状态</span>
                    <span style="display:flex; align-items:center; gap:6px; color:#4ade80; font-size:13px;">
                        <span style="width:8px; height:8px; background:#4ade80; border-radius:50%; display:inline-block;"></span>
                        已登录
                    </span>
                </div>
                <div style="display:flex; align-items:center; justify-content:space-between;">
                    <span style="color: rgba(255,255,255,0.5); font-size:13px;">同步</span>
                    <span style="color: rgba(255,255,255,0.35); font-size:13px;">
                        跨设备自动同步
                    </span>
                </div>
            </div>

            <button id="authLogoutBtn" style="
                width:100%; padding:10px;
                background: rgba(239,68,68,0.15);
                border: 1px solid rgba(239,68,68,0.3);
                border-radius: 8px;
                color: #ef4444; font-size:13px;
                cursor: pointer; transition: all 0.2s;
            ">
                退出登录
            </button>
        `;

        // 退出登录事件
        const logoutBtn = document.getElementById('authLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('确定要退出登录吗？本地数据不会丢失。')) {
                    this.cloudSync.logout();
                    this.mode = 'login';
                    this.renderForm();
                    this.close();
                }
            });
        }
    }

    bindFormEvents() {
        const form = document.getElementById('authForm');
        const errorEl = document.getElementById('authError');
        const switchBtn = document.getElementById('authSwitchMode');
        const logoutBtn = document.getElementById('authLogoutBtn');

        // 提交
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const phone = document.getElementById('authPhone').value.trim();
            const password = document.getElementById('authPassword').value;
            const nicknameEl = document.getElementById('authNickname');
            const nickname = nicknameEl ? nicknameEl.value.trim() : '';

            errorEl.style.display = 'none';

            if (!phone || !password) {
                this.showError('请填写手机号和密码');
                return;
            }

            // 手机号格式校验（支持中国大陆和香港）
            const cleanPhone = phone.replace(/^\+86/, '').replace(/^\+852/, '');
            const isChinaPhone = /^1[3-9]\d{9}$/.test(cleanPhone);
            const isHKPhone = /^[4-9]\d{7}$/.test(cleanPhone);
            if (!isChinaPhone && !isHKPhone) {
                this.showError('请输入有效的手机号（支持中国大陆和香港）');
                return;
            }

            if (password.length < 6) {
                this.showError('密码至少需要 6 个字符');
                return;
            }

            // 禁用表单
            this.setFormDisabled(true);

            try {
                let result;
                if (this.mode === 'login') {
                    result = await this.cloudSync.login(phone, password);
                } else {
                    result = await this.cloudSync.register(phone, password, nickname);
                }

                if (result.success) {
                    this.close();
                    // 触发首次全量同步
                    this.cloudSync.pullAll().catch(() => {});
                } else {
                    this.showError(result.error || '操作失败');
                }
            } catch (err) {
                this.showError('网络请求失败');
            } finally {
                this.setFormDisabled(false);
            }
        });

        // 切换模式
        if (switchBtn) {
            switchBtn.addEventListener('click', () => {
                this.mode = this.mode === 'login' ? 'register' : 'login';
                this.renderForm();
            });
        }

        // 登出
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('确定要退出登录吗？本地数据不会丢失。')) {
                    this.cloudSync.logout();
                    this.mode = 'login';
                    this.renderForm();
                    this.close();
                }
            });
        }

        // 输入框 focus 效果
        ['authNickname', 'authPhone', 'authPassword'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('focus', () => {
                    el.style.borderColor = '#6366f1';
                });
                el.addEventListener('blur', () => {
                    el.style.borderColor = 'rgba(255,255,255,0.15)';
                });
            }
        });
    }

    showError(msg) {
        const el = document.getElementById('authError');
        if (el) {
            el.textContent = msg;
            el.style.display = 'block';
        }
    }

    setFormDisabled(disabled) {
        const submitBtn = document.querySelector('#authForm button[type="submit"]');
        const inputs = document.querySelectorAll('#authForm input');
        if (submitBtn) {
            submitBtn.disabled = disabled;
            submitBtn.style.opacity = disabled ? '0.6' : '1';
            submitBtn.textContent = disabled ? '处理中...' : (this.mode === 'login' ? '登录' : '注册');
        }
        inputs.forEach(el => el.disabled = disabled);
    }
}

// 全局单例
window.authUI = new AuthUI();
