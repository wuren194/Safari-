// ==UserScript==
// @name         Safari 截图搜图
// @name:zh-CN   Safari 截图搜图
// @namespace    http://tampermonkey.net/
// @version      2.1.0
// @description  Safari 视频帧提取 + 图片拖拽识图（Google Lens + Yandex）- Liquid Glass UI
// @author       Antigravity
// @match        *://*/*
// @match        https://www.google.com/imghp*
// @match        https://www.google.com/search?*
// @exclude      *://localhost:*/*
// @exclude      *://127.0.0.1:*/*
// @compatible   safari
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.deleteValue
// @grant        GM.openInTab
// @grant        GM.xmlHttpRequest
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/wuren194/Safari-/main/Safari%20%E6%88%AA%E5%9B%BE%E6%90%9C%E5%9B%BE.user.js
// @downloadURL  https://raw.githubusercontent.com/wuren194/Safari-/main/Safari%20%E6%88%AA%E5%9B%BE%E6%90%9C%E5%9B%BE.user.js
// @supportURL   https://github.com/wuren194/Safari-/issues
// ==/UserScript==

/**
 * Safari 截图搜图工具 v2.1.0
 *
 * 功能：
 * 1. 点击按钮 → 进入选择模式 → 点击视频 → 提取当前帧识图
 * 2. 拖拽图片到按钮 → 直接识图
 * 3. 右键拖动浮动按钮可调整位置
 * 4. 自动根据页面背景色切换深色/浅色主题
 * 5. 双引擎搜索：Google Lens + Yandex
 */

(function () {
    'use strict';

    // ============================================================
    // CONFIG - 静态配置
    // ============================================================
    const CONFIG = {
        DEBUG_MODE: false,
        PREFIX: 'sbi',
        GOOGLE_DOMAINS: ['google.com', 'google.co.jp', 'google.com.hk', 'google.de'],
        AUTO_MODE_PARAM: 'sbi_auto=true',
        STORAGE_KEY_IMAGE: 'sbi_img_data',
        STORAGE_KEY_TIMESTAMP: 'sbi_timestamp',
        STORAGE_KEY_POSITION: 'sbi_fab_position',
        DATA_EXPIRE_TIME: 120000,
        YANDEX_HOSTS: ['yandex.com', 'yandex.ru'],
        CATBOX_API: 'https://catbox.moe/user/api.php',
        REQUEST_TIMEOUT: 10000
    };

    // ============================================================
    // STATE - 动态状态
    // ============================================================
    const STATE = {
        isSelectMode: false,
        isDragging: false,
        isDarkTheme: true,
        fabPosition: { right: 30, top: 30 }
    };

    // ============================================================
    // Logger - 日志工具
    // ============================================================
    const Logger = {
        debug: (...args) => CONFIG.DEBUG_MODE && console.log('[SBI]', ...args),
        info: (...args) => console.log('[SBI]', ...args),
        error: (...args) => console.error('[SBI]', ...args)
    };

    // ============================================================
    // ThemeDetector - 实时自适应主题检测（根据 FAB 位置下的背景色实时切换）
    // ============================================================
    const ThemeDetector = {
        interval: null,
        observer: null,

        /**
         * 启动实时检测
         */
        startRealtime() {
            // 初次检测
            this.detectAndApply();

            // 定时采样（每500ms）
            this.interval = setInterval(() => this.detectAndApply(), 500);

            // 监听 body 样式/class 变化
            this.observer = new MutationObserver(() => this.detectAndApply());
            this.observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['style', 'class'],
                childList: false,
                subtree: false
            });

            // 监听滚动事件（节流）
            let scrollTimeout;
            window.addEventListener('scroll', () => {
                if (scrollTimeout) return;
                scrollTimeout = setTimeout(() => {
                    this.detectAndApply();
                    scrollTimeout = null;
                }, 100);
            }, { passive: true });

            // 监听系统主题变化
            window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
                this.detectAndApply();
            });
        },

        /**
         * 检测并应用主题
         */
        detectAndApply() {
            const fab = document.getElementById('sbi-fab');
            if (!fab) return;

            // 获取 FAB 位置
            const fabRect = fab.getBoundingClientRect();
            const sampleX = fabRect.left + fabRect.width / 2;
            const sampleY = fabRect.top + fabRect.height / 2;

            // 获取该位置的元素（排除 FAB 本身）
            const elements = document.elementsFromPoint(sampleX, sampleY);
            let bgColor = null;

            for (const el of elements) {
                // 跳过 FAB 自身元素和 Toast
                if (el.closest('.sbi-root')) continue;

                const style = window.getComputedStyle(el);
                const bg = style.backgroundColor;

                // 跳过透明背景
                if (bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') continue;

                bgColor = bg;
                break;
            }

            // 如果没找到有效背景色，使用 body/html 背景
            if (!bgColor) {
                bgColor = window.getComputedStyle(document.body).backgroundColor;
            }
            if (bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)') {
                bgColor = window.getComputedStyle(document.documentElement).backgroundColor;
            }

            // 计算亮度
            const brightness = this.getBrightness(bgColor);
            const newIsDark = brightness < 128;

            // 只有主题变化时才更新
            if (STATE.isDarkTheme !== newIsDark) {
                STATE.isDarkTheme = newIsDark;
                const theme = newIsDark ? 'dark' : 'light';
                document.querySelectorAll('.sbi-root').forEach(el => {
                    el.setAttribute('data-theme', theme);
                });
            }
        },

        /**
         * 计算颜色亮度
         */
        getBrightness(color) {
            if (!color) return 0;
            const rgb = color.match(/\d+/g);
            if (!rgb || rgb.length < 3) return 0;
            return (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
        }
    };

    // ============================================================
    // StyleManager - Liquid Glass 样式管理器
    // ============================================================
    const StyleManager = {
        inject() {
            if (document.getElementById('sbi-styles')) return;
            const style = document.createElement('style');
            style.id = 'sbi-styles';
            style.textContent = `
                /* ═══════════════════════════════════════════════════════
                   Liquid Glass 变量 - 深色主题（默认）
                   ═══════════════════════════════════════════════════════ */
                .sbi-root, .sbi-root[data-theme="dark"] {
                    --lg-blur: 16px;
                    --lg-saturation: 1.3;
                    --lg-bg-opacity: 0.2;
                    --lg-border-opacity: 0.25;
                    --lg-text-primary: #fff;
                    --lg-text-secondary: rgba(255, 255, 255, 0.6);
                    --lg-panel-bg: rgba(20, 20, 35, var(--lg-bg-opacity));
                    --lg-border-color: rgba(255, 255, 255, var(--lg-border-opacity));
                    --lg-highlight: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
                    --lg-btn-bg: rgba(255, 255, 255, 0.12);
                    --lg-btn-hover: rgba(255, 255, 255, 0.22);
                    --lg-accent: #0A84FF;
                    --lg-accent-glow: rgba(10, 132, 255, 0.4);
                }

                /* 浅色主题 */
                .sbi-root[data-theme="light"] {
                    --lg-blur: 20px;
                    --lg-saturation: 1.1;
                    --lg-bg-opacity: 0.35;
                    --lg-border-opacity: 0.5;
                    --lg-text-primary: rgba(0, 0, 0, 0.85);
                    --lg-text-secondary: rgba(0, 0, 0, 0.55);
                    --lg-panel-bg: rgba(255, 255, 255, var(--lg-bg-opacity));
                    --lg-border-color: rgba(255, 255, 255, var(--lg-border-opacity));
                    --lg-highlight: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, transparent 50%);
                    --lg-btn-bg: rgba(255, 255, 255, 0.5);
                    --lg-btn-hover: rgba(255, 255, 255, 0.7);
                    --lg-accent: #007AFF;
                    --lg-accent-glow: rgba(0, 122, 255, 0.35);
                }

                /* ═══════════════════════════════════════════════════════
                   浮动按钮 - Liquid Glass 风格
                   ═══════════════════════════════════════════════════════ */
                #sbi-fab {
                    position: fixed;
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    z-index: 2147483647;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                                box-shadow 0.3s ease,
                                opacity 0.3s ease;
                    opacity: 0.75;
                    overflow: hidden;
                    user-select: none;
                }

                #sbi-fab .fab-glass {
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturation));
                    -webkit-backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturation));
                }

                #sbi-fab .fab-bg {
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    background: var(--lg-panel-bg);
                }

                #sbi-fab .fab-border {
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    border: 1px solid var(--lg-border-color);
                    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15);
                    pointer-events: none;
                }

                #sbi-fab .fab-highlight {
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    background: var(--lg-highlight);
                    pointer-events: none;
                }

                #sbi-fab .fab-icon {
                    position: relative;
                    z-index: 10;
                    width: 22px;
                    height: 22px;
                    color: var(--lg-text-primary);
                    opacity: 0.85;
                }

                #sbi-fab:hover {
                    opacity: 1;
                    transform: scale(1.08);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2),
                                0 0 24px var(--lg-accent-glow);
                }

                #sbi-fab.drag-over {
                    transform: scale(1.25);
                    opacity: 1;
                }
                #sbi-fab.drag-over .fab-bg {
                    background: var(--lg-accent);
                }

                #sbi-fab.select-mode {
                    opacity: 1;
                    animation: sbiPulse 1.8s ease-in-out infinite;
                }
                #sbi-fab.select-mode .fab-bg {
                    background: var(--lg-accent);
                }

                #sbi-fab.dragging {
                    cursor: grabbing;
                    opacity: 0.9;
                    transition: none;
                }

                @keyframes sbiPulse {
                    0%, 100% { box-shadow: 0 0 0 0 var(--lg-accent-glow); }
                    50% { box-shadow: 0 0 0 14px transparent; }
                }

                /* ═══════════════════════════════════════════════════════
                   Toast 提示
                   ═══════════════════════════════════════════════════════ */
                .sbi-toast {
                    position: fixed;
                    top: 10%;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 2147483647;
                    pointer-events: none;
                    border-radius: 100px;
                    overflow: hidden;
                    animation: sbiToastIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .sbi-toast .toast-glass {
                    position: absolute;
                    inset: -10px;
                    backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturation));
                    -webkit-backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturation));
                }

                .sbi-toast .toast-bg {
                    position: absolute;
                    inset: 0;
                    background: var(--lg-panel-bg);
                }

                .sbi-toast .toast-border {
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    border: 1px solid var(--lg-border-color);
                    pointer-events: none;
                }

                .sbi-toast .toast-text {
                    position: relative;
                    z-index: 10;
                    padding: 12px 24px;
                    color: var(--lg-text-primary);
                    font: 500 14px -apple-system, BlinkMacSystemFont, sans-serif;
                    letter-spacing: 0.2px;
                }

                @keyframes sbiToastIn {
                    from { opacity: 0; transform: translate(-50%, 16px) scale(0.92); }
                    to { opacity: 1; transform: translate(-50%, 0) scale(1); }
                }

                /* ═══════════════════════════════════════════════════════
                   选择模式遮罩
                   ═══════════════════════════════════════════════════════ */
                .sbi-select-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.35);
                    z-index: 2147483646;
                    cursor: crosshair;
                }

                .sbi-select-overlay video {
                    cursor: pointer !important;
                    outline: 3px solid var(--lg-accent) !important;
                    outline-offset: 3px;
                    box-shadow: 0 0 20px var(--lg-accent-glow);
                }
            `;
            document.head.appendChild(style);
        }
    };

    // ============================================================
    // Utils - 工具函数
    // ============================================================
    const Utils = {
        blobToDataUrl: (blob) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        }),

        dataUrlToBlob: (dataUrl) => {
            const [header, data] = dataUrl.split(',');
            const mime = header.match(/:(.*?);/)[1];
            const binary = atob(data);
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
            return new Blob([array], { type: mime });
        },

        isGoogleImagePage: () => {
            const isGoogle = CONFIG.GOOGLE_DOMAINS.some(d => location.hostname.includes(d));
            return isGoogle && (location.pathname.includes('/imghp') || location.search.includes('tbm=isch'));
        },

        isAutoMode: () => location.search.includes(CONFIG.AUTO_MODE_PARAM),

        loadPosition: () => {
            try {
                const saved = localStorage.getItem(CONFIG.STORAGE_KEY_POSITION);
                return saved ? JSON.parse(saved) : { right: 30, top: 30 };
            } catch { return { right: 30, top: 30 }; }
        },

        savePosition: (pos) => {
            try { localStorage.setItem(CONFIG.STORAGE_KEY_POSITION, JSON.stringify(pos)); }
            catch { }
        }
    };

    // ============================================================
    // Core - 核心逻辑
    // ============================================================
    const Core = {
        fab: null,

        createFab() {
            if (document.getElementById('sbi-fab')) return;

            // 加载保存的位置
            STATE.fabPosition = Utils.loadPosition();

            // 创建根容器
            const root = document.createElement('div');
            root.className = 'sbi-root';
            root.id = 'sbi-fab';
            root.style.right = STATE.fabPosition.right + 'px';
            root.style.top = STATE.fabPosition.top + 'px';

            // Liquid Glass 结构
            root.innerHTML = `
                <div class="fab-glass"></div>
                <div class="fab-bg"></div>
                <div class="fab-border"></div>
                <div class="fab-highlight"></div>
                <svg class="fab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="6"/>
                    <path d="M21 21l-4.35-4.35"/>
                    <path d="M11 8v6M8 11h6"/>
                </svg>
            `;

            this.fab = root;

            // 左键点击进入选择模式
            root.addEventListener('click', (e) => {
                if (STATE.isDragging) return;
                this.enterSelectMode();
            });

            // 右键拖动
            root.addEventListener('mousedown', (e) => {
                if (e.button !== 2) return; // 只响应右键
                e.preventDefault();
                this.startDrag(e);
            });

            root.addEventListener('contextmenu', (e) => e.preventDefault());

            // 拖拽图片
            root.addEventListener('dragover', e => { e.preventDefault(); root.classList.add('drag-over'); });
            root.addEventListener('dragleave', () => root.classList.remove('drag-over'));
            root.addEventListener('drop', async e => {
                e.preventDefault();
                root.classList.remove('drag-over');
                await this.handleDrop(e);
            });

            document.body.appendChild(root);

            // 启动实时主题检测
            ThemeDetector.startRealtime();

            Logger.info('浮动按钮已创建 - 左键选择视频，右键拖动位置，主题实时自适应');
        },

        startDrag(e) {
            STATE.isDragging = true;
            this.fab.classList.add('dragging');

            const startX = e.clientX;
            const startY = e.clientY;
            const startRight = STATE.fabPosition.right;
            const startTop = STATE.fabPosition.top;

            const onMove = (e) => {
                const deltaX = startX - e.clientX;
                const deltaY = e.clientY - startY;

                const newRight = Math.max(10, Math.min(window.innerWidth - 60, startRight + deltaX));
                const newTop = Math.max(10, Math.min(window.innerHeight - 60, startTop + deltaY));

                this.fab.style.right = newRight + 'px';
                this.fab.style.top = newTop + 'px';
                STATE.fabPosition = { right: newRight, top: newTop };
            };

            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                this.fab.classList.remove('dragging');
                Utils.savePosition(STATE.fabPosition);
                setTimeout(() => STATE.isDragging = false, 100);
            };

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        },

        showToast(text) {
            let toast = document.querySelector('.sbi-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.className = 'sbi-toast sbi-root';
                toast.innerHTML = `
                    <div class="toast-glass"></div>
                    <div class="toast-bg"></div>
                    <div class="toast-border"></div>
                    <div class="toast-text"></div>
                `;
                document.body.appendChild(toast);
            }
            toast.querySelector('.toast-text').textContent = text;
            toast.setAttribute('data-theme', STATE.isDarkTheme ? 'dark' : 'light');
            return toast;
        },

        removeToast(toast, delay = 1500) {
            setTimeout(() => toast?.parentNode?.removeChild(toast), delay);
        },

        enterSelectMode() {
            if (STATE.isSelectMode) {
                this.exitSelectMode();
                return;
            }

            STATE.isSelectMode = true;
            this.fab.classList.add('select-mode');

            const toast = this.showToast('点击视频提取当前帧，按 ESC 取消');

            const overlay = document.createElement('div');
            overlay.className = 'sbi-select-overlay sbi-root';
            overlay.id = 'sbi-overlay';
            overlay.setAttribute('data-theme', STATE.isDarkTheme ? 'dark' : 'light');
            document.body.appendChild(overlay);

            overlay.addEventListener('click', async (e) => {
                const elements = document.elementsFromPoint(e.clientX, e.clientY);
                const video = elements.find(el => el.tagName === 'VIDEO');
                this.exitSelectMode();
                if (video) {
                    await this.extractVideoFrame(video);
                } else {
                    this.removeToast(toast, 500);
                }
            });

            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    this.exitSelectMode();
                    this.removeToast(toast, 500);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        },

        exitSelectMode() {
            STATE.isSelectMode = false;
            this.fab?.classList.remove('select-mode');
            document.getElementById('sbi-overlay')?.remove();
        },

        async extractVideoFrame(video) {
            const toast = this.showToast('提取视频帧...');
            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || video.clientWidth;
                canvas.height = video.videoHeight || video.clientHeight;
                canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

                const base64 = canvas.toDataURL('image/jpeg', 0.9);
                const blob = Utils.dataUrlToBlob(base64);
                await this.searchImage(base64, blob, toast);
            } catch (err) {
                Logger.error('视频帧提取失败:', err);
                toast.querySelector('.toast-text').textContent = '提取失败：' + err.message;
                this.removeToast(toast, 3000);
            }
        },

        async handleDrop(e) {
            const toast = this.showToast('解析图片...');
            try {
                let blob = null;
                const file = e.dataTransfer.files[0];
                if (file?.type.startsWith('image/')) {
                    blob = file;
                } else {
                    const html = e.dataTransfer.getData('text/html');
                    const src = html.match(/src=["']([^"']+)/)?.[1] || e.dataTransfer.getData('text/uri-list');
                    if (src) {
                        toast.querySelector('.toast-text').textContent = '获取网络图片...';
                        blob = await (await fetch(src)).blob();
                    }
                }
                if (!blob) throw new Error('未检测到图片');
                const base64 = await Utils.blobToDataUrl(blob);
                await this.searchImage(base64, blob, toast);
            } catch (err) {
                Logger.error('拖拽处理失败:', err);
                toast.querySelector('.toast-text').textContent = '失败：' + err.message;
                this.removeToast(toast, 3000);
            }
        },

        async searchImage(base64, blob, toast) {
            toast.querySelector('.toast-text').textContent = '启动 Google Lens...';
            await GM.setValue(CONFIG.STORAGE_KEY_IMAGE, base64);
            await GM.setValue(CONFIG.STORAGE_KEY_TIMESTAMP, Date.now());
            GM.openInTab(`https://www.google.com/imghp?hl=zh-CN&${CONFIG.AUTO_MODE_PARAM}`, { active: false });
            await this.searchYandex(blob, toast);
            if (this.fab) this.fab.style.display = 'flex';
        },

        async searchYandex(blob, toast) {
            for (const host of CONFIG.YANDEX_HOSTS) {
                toast.querySelector('.toast-text').textContent = `连接 ${host}...`;
                try {
                    if (await this.yandexApiSearch(blob, host)) {
                        toast.querySelector('.toast-text').textContent = '识图完成！';
                        this.removeToast(toast);
                        return;
                    }
                } catch { }
                try {
                    const url = await this.uploadToCatbox(blob);
                    if (url) {
                        GM.openInTab(`https://${host}/images/search?rpt=imageview&url=${encodeURIComponent(url)}`, { active: true });
                        toast.querySelector('.toast-text').textContent = '识图完成！';
                        this.removeToast(toast);
                        return;
                    }
                } catch { }
            }
            toast.querySelector('.toast-text').textContent = '通道拥挤，请手动上传';
            GM.openInTab('https://yandex.com/images/search?rpt=imageview', { active: true });
            this.removeToast(toast, 2000);
        },

        yandexApiSearch(blob, host) {
            return new Promise((resolve) => {
                const form = new FormData();
                form.append('upfile', blob, 'frame.jpg');
                GM.xmlHttpRequest({
                    method: 'POST',
                    url: `https://${host}/images/touch/search?rpt=imageview&format=json&request=%7B%22blocks%22%3A%5B%7B%22block%22%3A%22cbir-uploader__get-cbir-id%22%7D%5D%7D`,
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    data: form,
                    timeout: CONFIG.REQUEST_TIMEOUT,
                    onload: res => {
                        try {
                            const p = JSON.parse(res.responseText).blocks?.find(b => b.block === 'cbir-uploader__get-cbir-id')?.params;
                            if (p?.cbirId) {
                                GM.openInTab(`https://${host}/images/search?cbir_id=${p.cbirId}&rpt=imageview&url=${p.originalImageUrl}`, { active: true });
                                resolve(true);
                            } else resolve(false);
                        } catch { resolve(false); }
                    },
                    onerror: () => resolve(false)
                });
            });
        },

        uploadToCatbox(blob) {
            return new Promise((resolve, reject) => {
                const form = new FormData();
                form.append('reqtype', 'fileupload');
                form.append('fileToUpload', blob, 'image.jpg');
                GM.xmlHttpRequest({
                    method: 'POST',
                    url: CONFIG.CATBOX_API,
                    data: form,
                    timeout: CONFIG.REQUEST_TIMEOUT,
                    onload: res => res.responseText?.startsWith('http') ? resolve(res.responseText.trim()) : reject(),
                    onerror: reject
                });
            });
        },

        async runGoogleLensInjection() {
            const toast = this.showToast('注入 Google Lens...');
            try {
                const base64 = await GM.getValue(CONFIG.STORAGE_KEY_IMAGE);
                const ts = await GM.getValue(CONFIG.STORAGE_KEY_TIMESTAMP);
                if (!base64 || Date.now() - ts > CONFIG.DATA_EXPIRE_TIME) {
                    toast.querySelector('.toast-text').textContent = '任务已过期';
                    this.removeToast(toast, 2000);
                    return;
                }
                await GM.deleteValue(CONFIG.STORAGE_KEY_IMAGE);

                const file = new File([Utils.dataUrlToBlob(base64)], 'frame.jpg', { type: 'image/jpeg' });
                const loop = setInterval(() => {
                    const input = document.querySelector('input[type="file"]');
                    if (input) {
                        clearInterval(loop);
                        const dt = new DataTransfer();
                        dt.items.add(file);
                        input.files = dt.files;
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                        toast.querySelector('.toast-text').textContent = '识图已启动';
                        this.removeToast(toast);
                    } else {
                        document.querySelector('[aria-label*="Search by image"], [aria-label*="按图搜索"], .nDcEnd')?.click();
                    }
                }, 800);
                setTimeout(() => clearInterval(loop), 15000);
            } catch {
                toast.querySelector('.toast-text').textContent = '注入失败';
                this.removeToast(toast, 2000);
            }
        }
    };

    // ============================================================
    // init - 初始化
    // ============================================================
    function init() {
        if (Utils.isGoogleImagePage() && Utils.isAutoMode()) {
            Core.runGoogleLensInjection();
        } else if (!Utils.isGoogleImagePage()) {
            StyleManager.inject();
            Core.createFab();
            Logger.info('v2.1.0 已启动 - Liquid Glass UI + 自动主题');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
    } else {
        setTimeout(init, 500);
    }
})();
// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2025-12-29
// @description  try to take over the world!
// @author       You
// @match        https://thisvid.com/playlist/351885/video/muscular-trainer-gets-deep-dicked-by-his-skinny-client/
// @icon         http://thisvid.com/favicon.ico
// @grant        none
// @updateURL    https://raw.githubusercontent.com/wuren194/Safari-/main/Safari%20%E6%88%AA%E5%9B%BE%E6%90%9C%E5%9B%BE.user.js
// @downloadURL  https://raw.githubusercontent.com/wuren194/Safari-/main/Safari%20%E6%88%AA%E5%9B%BE%E6%90%9C%E5%9B%BE.user.js
// @supportURL   https://github.com/wuren194/Safari-/issues
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
})();