// ==UserScript==
// @name         一同看视频下载器 v8.0 (沉浸式播放器)
// @namespace    http://tampermonkey.net/
// @version      9.0
// @description  一键用 Downie 4 下载一同看视频，自定义沉浸式播放器界面。配合 Fetch/XHR 拦截器，无视前端 SPA 加密。
// @author       Antigravity & You
// @match        *://www.yitongkan.com/*
// @match        *://yitongkan.com/*
// @match        *://*.yitongkan.com/*
// @match        *://*.gv1069.vip/*
// @match        *://gv1069.vip/*
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        GM_setClipboard
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';
    // ═══════════════════════════════════════════════════════════════════════════
    // § 0. 视频卡片「在新标签页打开」按钮注入
    // ═══════════════════════════════════════════════════════════════════════════
    const CARD_BTN_ATTR = 'ytk-newtab-injected';

    const injectNewTabButtons = () => {
        const overlays = document.querySelectorAll(
            'div[class*="from-pink-500"][class*="inset-0"]:not([ytk-overlay-done])'
        );

        overlays.forEach(overlay => {
            overlay.setAttribute('ytk-overlay-done', '1');

            // 精准找 Tailwind group 容器（classList 里有独立的 "group" class）
            let card = overlay.parentElement;
            while (card && card !== document.body) {
                if (card.classList.contains('group')) break;
                card = card.parentElement;
            }
            if (!card || card === document.body) return;
            if (card.hasAttribute(CARD_BTN_ATTR)) return;
            card.setAttribute(CARD_BTN_ATTR, '1');

            // 取 href：card 本身是 <a> 则直接取，否则找内部第一个有 href 的 <a>
            const getHref = () => {
                if (card.tagName === 'A' && card.getAttribute('href')) {
                    return card.getAttribute('href');
                }
                const inner = card.querySelector('a[href]');
                return inner ? inner.getAttribute('href') : null;
            };

            if (getComputedStyle(card).position === 'static') {
                card.style.position = 'relative';
            }

            const btn = document.createElement('button');
            btn.textContent = '↗';
            btn.title = '在新标签页打开';
            btn.style.cssText = `
                position: absolute;
                top: 6px;
                right: 6px;
                z-index: 2147483647;
                width: 30px;
                height: 30px;
                border-radius: 8px;
                border: none;
                background: rgba(0,0,0,0.65);
                color: #fff;
                font-size: 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.15s ease;
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
                line-height: 1;
                padding: 0;
                pointer-events: auto;
            `;

            card.addEventListener('mouseenter', () => btn.style.opacity = '1');
            card.addEventListener('mouseleave', () => btn.style.opacity = '0');

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const href = getHref();
                if (!href) return;
                const fullUrl = href.startsWith('/') ? location.origin + href : href;
                window.open(fullUrl, '_blank');
            });

            card.appendChild(btn);
        });
    };


    // 监听 DOM 变化，SPA 动态加载卡片时也能注入
    const cardObserver = new MutationObserver(() => injectNewTabButtons());
    cardObserver.observe(document.documentElement, { childList: true, subtree: true });
    // 立即执行一次
    if (document.body) {
        injectNewTabButtons();
    } else {
        document.addEventListener('DOMContentLoaded', injectNewTabButtons);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // § 1. 拦截器 Hook 模块 (XHR / Fetch)
    // ═══════════════════════════════════════════════════════════════════════════
    const originalFetch = window.fetch;
    const originalXHR = XMLHttpRequest.prototype.open;
    const detectedUrls = new Set();

    // 拦截 fetch
    window.fetch = async function (input, init) {
        const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
        if (url && url.includes('.m3u8')) {
            handleM3u8Found(url);
        }
        return originalFetch.apply(this, arguments);
    };

    // 拦截 XHR
    XMLHttpRequest.prototype.open = function (method, url, ...args) {
        if (typeof url === 'string' && url.includes('.m3u8')) {
            handleM3u8Found(url);
        }
        return originalXHR.apply(this, [method, url, ...args]);
    };

    function handleM3u8Found(url) {
        let fullUrl = url.startsWith('/') ? location.origin + url : url;
        // 过滤掉已捕获的
        if (detectedUrls.has(fullUrl)) return;
        detectedUrls.add(fullUrl);
        console.log('[ytk-downloader] 抓取到 .m3u8 地址:', fullUrl);

        if (document.body) {
            setupImmersiveUI(fullUrl);
        } else {
            document.addEventListener('DOMContentLoaded', () => setupImmersiveUI(fullUrl));
        }
    }

    // 监听 DOM 中的 video 元素进行兜底检测（防止原生播放器不走 fetch/XHR）
    const checkOriginalVideo = () => {
        if (document.querySelector('.ytk-player-container')) return;
        
        const videosInDom = document.querySelectorAll('video');
        for (const vid of videosInDom) {
            let src = vid.src || vid.getAttribute('src') || '';
            if (src && src.includes('.m3u8')) {
                handleM3u8Found(src);
                return;
            }
            const sources = vid.querySelectorAll('source');
            for (const s of sources) {
                let sSrc = s.src || s.getAttribute('src') || '';
                if (sSrc && sSrc.includes('.m3u8')) {
                    handleM3u8Found(sSrc);
                    return;
                }
            }
        }
    };
    setInterval(checkOriginalVideo, 500);

    // ═══════════════════════════════════════════════════════════════════════════
    // § 2. SPA 路由监控模块
    // ═══════════════════════════════════════════════════════════════════════════
    let currentUrl = location.href;
    const checkUrlChange = () => {
        if (location.href !== currentUrl) {
            currentUrl = location.href;
            handleUrlChanged();
        }
    };
    setInterval(checkUrlChange, 500);

    const wrapHistory = (type) => {
        const orig = history[type].bind(history);
        return function (...args) {
            const res = orig(...args);
            checkUrlChange();
            return res;
        };
    };
    // pushState 已经在 § 0 里完整处理，这里只需要包一层 replaceState
    history.replaceState = wrapHistory('replaceState');

    window.addEventListener('popstate', checkUrlChange);
    window.addEventListener('hashchange', checkUrlChange);

    function isPlayPage() {
        const path = location.pathname;
        return path.includes('play') || 
               path.includes('/gv') || 
               path.includes('/mv') || 
               path.includes('/tv') || 
               path.includes('/video') || 
               path.includes('/watch') || 
               path.includes('/content') || 
               path.includes('/detail');
    }

    function handleUrlChanged() {
        console.log('[ytk-downloader] 路由变化检测:', location.href);
        // 不管是不是播放页，只要路由变了，就彻底清除之前的 UI 并重置捕获状态
        destroyImmersiveUI();
        detectedUrls.clear();
        videos = [];
        selectedUrls = {};
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // § 3. 样式注入
    // ═══════════════════════════════════════════════════════════════════════════
    const injectStyles = () => {
        if (document.getElementById('ytk-immersive-styles')) return;
        const style = document.createElement('style');
        style.id = 'ytk-immersive-styles';
        style.textContent = `
            body.ytk-immersive > *:not(.ytk-player-container):not(script):not(style):not(link) {
                display: none !important;
            }

            body.ytk-immersive {
                margin: 0 !important;
                padding: 0 !important;
                background: #0a0a0a !important;
                overflow-x: hidden !important;
                overflow-y: hidden !important;
            }

            .ytk-player-container {
                position: fixed !important;
                inset: 0 !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                background: linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%) !important;
                font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
                z-index: 2147483647 !important;
                padding: 32px !important;
                box-sizing: border-box !important;
                gap: 16px !important;
            }

            .ytk-exit-btn {
                position: absolute;
                top: 20px;
                left: 20px;
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 10px;
                color: #fff;
                cursor: pointer;
                z-index: 2147483647;
                font-size: 13px;
                font-weight: 500;
                transition: all 0.2s ease;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }

            .ytk-exit-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.05);
            }

            .ytk-header {
                width: 100%;
                max-width: 1000px;
                text-align: center;
            }

            .ytk-video-title {
                font-size: 22px;
                font-weight: 700;
                color: #fff;
                margin: 0;
                text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
            }

            .ytk-video-box {
                width: 100%;
                max-width: 1000px;
                aspect-ratio: 16 / 9;
                background: #000;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08);
            }

            .ytk-video-box video {
                width: 100% !important;
                height: 100% !important;
                object-fit: contain;
                background: #000;
            }

            .ytk-controls {
                width: 100%;
                max-width: 1000px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                flex-wrap: wrap;
            }

            .ytk-quality-group {
                display: flex;
                gap: 4px;
                background: rgba(255, 255, 255, 0.04);
                padding: 4px;
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.06);
            }

            .ytk-quality-btn {
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                background: transparent;
                color: rgba(255, 255, 255, 0.5);
                border: none;
            }

            .ytk-quality-btn:hover {
                background: rgba(255, 255, 255, 0.08);
                color: rgba(255, 255, 255, 0.8);
            }

            .ytk-quality-btn.active {
                background: rgba(0, 122, 255, 0.8);
                color: #fff;
            }

            .ytk-quality-btn.disabled {
                opacity: 0.3;
                cursor: not-allowed;
                pointer-events: none;
            }

            .ytk-action-btn {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: none;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
            }

            .ytk-action-btn.primary {
                background: linear-gradient(135deg, #007aff 0%, #00c6ff 100%);
                color: #fff;
                box-shadow: 0 4px 14px rgba(0, 122, 255, 0.5);
            }

            .ytk-action-btn svg {
                width: 18px;
                height: 18px;
                fill: currentColor;
            }

            .ytk-action-btn.secondary {
                background: rgba(255, 255, 255, 0.1);
                color: rgba(255, 255, 255, 0.9);
                border: 1px solid rgba(255, 255, 255, 0.15);
            }

            .ytk-action-btn:hover {
                transform: translateY(-2px);
            }

            .ytk-action-btn.success {
                background: linear-gradient(135deg, #34c759 0%, #30d158 100%) !important;
                box-shadow: 0 6px 24px rgba(52, 199, 89, 0.4) !important;
            }

            .ytk-search-box {
                position: absolute;
                top: 20px;
                right: 20px;
                display: flex;
                align-items: center;
                gap: 8px;
                background: rgba(255, 255, 255, 0.08);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 12px;
                padding: 6px 12px;
                z-index: 100;
            }

            .ytk-search-input {
                width: 180px;
                background: transparent;
                border: none;
                outline: none;
                color: #fff;
                font-size: 14px;
                font-family: inherit;
            }

            .ytk-search-input::placeholder {
                color: rgba(255, 255, 255, 0.4);
            }

            .ytk-search-btn {
                width: 28px;
                height: 28px;
                border-radius: 8px;
                border: none;
                background: rgba(0, 122, 255, 0.8);
                color: #fff;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }

            .ytk-search-btn:hover {
                background: rgba(0, 122, 255, 1);
                transform: scale(1.05);
            }

            .ytk-search-btn svg {
                width: 14px;
                height: 14px;
                fill: currentColor;
            }

            .ytk-progress-bar {
                width: 100%;
                max-width: 1000px;
                height: 4px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 2px;
                overflow: hidden;
                display: none;
            }

            .ytk-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #007aff, #00c6ff);
                border-radius: 2px;
                transition: width 0.3s ease;
                width: 0%;
            }
        `;
        document.head.appendChild(style);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // § 4. 辅助函数
    // ═══════════════════════════════════════════════════════════════════════════
    const sanitizeFilename = (name) => {
        if (!name) return 'video';
        return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 120) || 'video';
    };

    const copyToClipboard = (text) => {
        if (typeof GM_setClipboard !== 'undefined') {
            GM_setClipboard(text);
            return true;
        }
        try {
            navigator.clipboard.writeText(text);
            return true;
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            return true;
        }
    };

    const gmFetch = (url) => {
        return new Promise((resolve, reject) => {
            const gmXhr = typeof GM_xmlhttpRequest !== 'undefined' ? GM_xmlhttpRequest :
                (typeof GM !== 'undefined' && GM.xmlHttpRequest ? GM.xmlHttpRequest : null);
            if (gmXhr) {
                gmXhr({
                    method: 'GET', url: url, responseType: 'text', timeout: 5000,
                    headers: { 'Referer': location.origin + '/' },
                    onload: (r) => r.status === 200 ? resolve(r.responseText) : reject(new Error(`HTTP ${r.status}`)),
                    onerror: () => reject(new Error('Network Error')),
                    ontimeout: () => reject(new Error('Timeout'))
                });
            } else {
                fetch(url).then(r => r.ok ? r.text() : Promise.reject()).then(resolve).catch(reject);
            }
        });
    };

    const detectQualities = async (baseUrl) => {
        const pathMatch = baseUrl.match(/\/(\d+)\/index\.m3u8/);
        if (!pathMatch) return [{ url: baseUrl, name: '默认', priority: 0 }];

        const currentQ = pathMatch[1];
        const qualities = [
            { value: '1800', label: '1080p' }, { value: '1080', label: '1080p' },
            { value: '900', label: '720p' }, { value: '720', label: '720p' },
            { value: '600', label: '480p' }, { value: '480', label: '480p' },
            { value: '360', label: '360p' },
        ];

        const results = await Promise.all(
            qualities.map(async (q) => {
                const testUrl = baseUrl.replace(`/${currentQ}/`, `/${q.value}/`);
                try {
                    const content = await gmFetch(testUrl);
                    if (content.includes('#EXTM3U') && (content.includes('.ts') || content.includes('#EXTINF'))) {
                        return { url: testUrl, name: q.label, value: q.value, priority: parseInt(q.value) };
                    }
                } catch { }
                return null;
            })
        );

        const validQualities = [];
        const seen = new Set();
        results.filter(Boolean).sort((a, b) => b.priority - a.priority).forEach(r => {
            if (!seen.has(r.name)) { seen.add(r.name); validQualities.push(r); }
        });

        if (validQualities.length === 0) {
            const label = parseInt(currentQ) >= 1000 ? '高清' : `${currentQ}p`;
            validQualities.push({ url: baseUrl, name: label, priority: parseInt(currentQ) });
        }
        return validQualities;
    };

    const getVideoTitle = () => {
        const headings = document.querySelectorAll('h1, h2, h3, [role="heading"]');
        for (const h of headings) {
            const text = h.textContent.trim();
            if (text && text !== '一同看' && text.length > 2 && text.length < 200) return text;
        }
        let title = document.title || '';
        title = title.replace(/\s*[-–—|·_]\s*一同看.*$/gi, '').replace(/\s*一同看.*$/gi, '').trim();
        if (title && title.length > 2) return title;
        return null;
    };

    const loadHlsJs = () => {
        return new Promise((resolve) => {
            if (window.Hls) return resolve();
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.4.12/hls.min.js';
            script.onload = () => resolve();
            script.onerror = () => resolve();
            document.head.appendChild(script);
        });
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // § 5. UI 核心交互模块
    // ═══════════════════════════════════════════════════════════════════════════
    let videos = [];
    let container = null;
    let headerEl = null;
    let controlsEl = null;
    let progressBar = null;
    let selectedUrls = {};
    let currentTitle = '';
    let playVideoFn = null;

    const setupImmersiveUI = async (m3u8Url) => {
        if (!isPlayPage()) return;
        
        injectStyles();

        // 如果已经存在 UI，只将其添加进源并刷新控制面板
        if (document.querySelector('.ytk-player-container')) {
            addVideo(m3u8Url);
            return;
        }

        currentTitle = getVideoTitle() || 'video';
        document.body.classList.add('ytk-immersive');

        container = document.createElement('div');
        container.className = 'ytk-player-container';

        // 退出按钮
        const exitBtn = document.createElement('button');
        exitBtn.className = 'ytk-exit-btn';
        exitBtn.textContent = '退出沉浸模式';
        exitBtn.onclick = () => {
            destroyImmersiveUI();
        };

        // 标题区域
        headerEl = document.createElement('div');
        headerEl.className = 'ytk-header';
        headerEl.innerHTML = `
            <h1 class="ytk-video-title">${sanitizeFilename(currentTitle)}</h1>
        `;

        // 搜索框
        const searchBox = document.createElement('div');
        searchBox.className = 'ytk-search-box';
        searchBox.innerHTML = `
            <input type="text" class="ytk-search-input" placeholder="搜索视频..." />
            <button class="ytk-search-btn" title="搜索">
                <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            </button>
        `;

        const searchInput = searchBox.querySelector('.ytk-search-input');
        const searchBtn = searchBox.querySelector('.ytk-search-btn');
        const doSearch = () => {
            const keyword = searchInput.value.trim();
            if (keyword) {
                window.location.href = `https://www.yitongkan.com/seacher-${encodeURIComponent(keyword)}-1.html`;
            }
        };
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') doSearch();
        });
        searchBtn.addEventListener('click', doSearch);

        // 视频盒子与播放器
        const videoBox = document.createElement('div');
        videoBox.className = 'ytk-video-box';
        const newVideo = document.createElement('video');
        newVideo.controls = true;
        newVideo.autoplay = true;
        videoBox.appendChild(newVideo);

        // 进度条
        progressBar = document.createElement('div');
        progressBar.className = 'ytk-progress-bar';
        progressBar.innerHTML = '<div class="ytk-progress-fill"></div>';

        // 控制面板
        controlsEl = document.createElement('div');
        controlsEl.className = 'ytk-controls';
        controlsEl.innerHTML = `
            <div class="ytk-quality-group">
                <button class="ytk-quality-btn active" data-quality="1080p">1080p</button>
                <button class="ytk-quality-btn" data-quality="720p">720p</button>
                <button class="ytk-quality-btn" data-quality="480p">480p</button>
            </div>
            <button class="ytk-action-btn primary" id="ytk-downie-btn" title="下载视频">
                <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            </button>
        `;

        container.appendChild(exitBtn);
        container.appendChild(searchBox);
        container.appendChild(headerEl);
        container.appendChild(controlsEl);
        container.appendChild(videoBox);
        container.appendChild(progressBar);
        document.body.appendChild(container);

        // 播放方法
        playVideoFn = async (url) => {
            if (newVideo.canPlayType('application/vnd.apple.mpegurl')) {
                newVideo.src = url;
            } else {
                await loadHlsJs();
                if (window.Hls) {
                    if (window.ytkHls) {
                        window.ytkHls.destroy();
                    }
                    const hls = new window.Hls();
                    hls.loadSource(url);
                    hls.attachMedia(newVideo);
                    window.ytkHls = hls;
                } else {
                    newVideo.src = url;
                }
            }
        };

        // 定时轮询更新标题，防止 SPA 渲染延迟导致抓取不到正确的视频名字
        let titleRetry = 0;
        const titleTimer = setInterval(() => {
            const freshTitle = getVideoTitle();
            if (freshTitle && freshTitle !== 'video') {
                currentTitle = freshTitle;
                const titleH1 = headerEl.querySelector('.ytk-video-title');
                if (titleH1) titleH1.textContent = sanitizeFilename(currentTitle);
            }
            titleRetry++;
            if (titleRetry > 10) clearInterval(titleTimer);
        }, 1000);

        // 初始化播放
        await playVideoFn(m3u8Url);
        addVideo(m3u8Url);
    };

    const destroyImmersiveUI = () => {
        document.body.classList.remove('ytk-immersive');
        const el = document.querySelector('.ytk-player-container');
        if (el) {
            const video = el.querySelector('video');
            if (video) {
                video.pause();
                video.src = '';
                video.load();
            }
            el.remove();
        }
        if (window.ytkHls) {
            window.ytkHls.destroy();
            window.ytkHls = null;
        }
        container = null;
        headerEl = null;
        controlsEl = null;
        progressBar = null;
        playVideoFn = null;
    };

    const bindDownloadButton = () => {
        const btn = document.getElementById('ytk-downie-btn');
        if (!btn) return;
        btn.onclick = function () {
            let url = selectedUrls[0];
            if (!url && videos.length > 0 && videos[0].qualities.length > 0) {
                url = videos[0].qualities[0].url;
            }
            if (!url) return;

            const finalName = sanitizeFilename(currentTitle || 'video');
            copyToClipboard(finalName);
            window.location.href = `downie://XUOpenURL?url=${encodeURIComponent(url)}&title=${encodeURIComponent(finalName)}`;
            
            this.innerHTML = '已发送';
            this.classList.add('success');
            setTimeout(() => {
                this.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;
                this.classList.remove('success');
            }, 2000);
        };
    };

    const renderControls = () => {
        if (!controlsEl) return;

        const standardQualities = ['1080p', '720p', '480p'];
        const availableQualities = videos.length > 0 && videos[0].qualities.length > 0
            ? videos[0].qualities
            : [];

        if (!selectedUrls[0] && availableQualities.length > 0) {
            selectedUrls[0] = availableQualities[0].url;
        }

        controlsEl.innerHTML = `
            <div class="ytk-quality-group">
                ${standardQualities.map(name => {
                    const quality = availableQualities.find(q => q.name === name);
                    const isAvailable = !!quality;
                    const isActive = quality && selectedUrls[0] === quality.url;
                    const classes = ['ytk-quality-btn'];
                    if (isActive) classes.push('active');
                    if (!isAvailable && availableQualities.length > 0) classes.push('disabled');
                    return `<button class="${classes.join(' ')}" data-url="${quality ? quality.url : ''}" data-name="${name}">${name}</button>`;
                }).join('')}
            </div>
            <button class="ytk-action-btn primary" id="ytk-downie-btn" title="下载视频">
                <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            </button>
        `;

        controlsEl.querySelectorAll('.ytk-quality-btn:not(.disabled)').forEach(btn => {
            btn.onclick = () => {
                if (btn.dataset.url) {
                    selectedUrls[0] = btn.dataset.url;
                    renderControls();
                    if (playVideoFn) playVideoFn(btn.dataset.url);
                }
            };
        });

        bindDownloadButton();
    };

    const addVideo = async (url) => {
        if (videos.find(v => v.url === url)) return;
        const video = { url, qualities: [] };
        videos.push(video);
        renderControls();
        video.qualities = await detectQualities(url);
        renderControls();
    };

})();