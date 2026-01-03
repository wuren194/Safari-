// ==UserScript==
// @name         Coomer Video Poster + 图片下载 + 自动翻页 (Safari版)
// @namespace    http://tampermonkey.net/
// @version      7.2-safari
// @description  视频封面 + 图片下载按钮 + 自动翻页 - Safari 适配版
// @author       老司机
// @match        https://coomer.su/*
// @match        https://coomer.party/*
// @match        https://kemono.su/*
// @match        https://kemono.party/*
// @match        https://*.coomer.st/*
// @match        https://*.coomer.su/*
// @match        https://*.kemono.su/*
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // Safari 适配：使用 localStorage 替代 GM_getValue/GM_setValue
    const storageGet = (key, defaultValue) => {
        try {
            const val = localStorage.getItem('coomer_' + key);
            if (val === null) return defaultValue;
            return JSON.parse(val);
        } catch (e) {
            return defaultValue;
        }
    };

    const storageSet = (key, value) => {
        try {
            localStorage.setItem('coomer_' + key, JSON.stringify(value));
        } catch (e) {
            console.error('[Coomer Safari] 存储失败:', e);
        }
    };

    const DEFAULT_CONFIG = { scale: 1.0, iconColor: '#ffffff', autoPagerEnabled: true };
    let CONFIG = {
        scale: storageGet('scale', DEFAULT_CONFIG.scale),
        iconColor: storageGet('iconColor', DEFAULT_CONFIG.iconColor),
        autoPagerEnabled: storageGet('autoPagerEnabled', DEFAULT_CONFIG.autoPagerEnabled)
    };

    const style = document.createElement('style');
    style.textContent = `
    .cvp-wrapper{display:flex;justify-content:center;width:100%}
    .video-poster-container{display:inline-block;background:#1a1a2e;border-radius:4px;overflow:hidden;aspect-ratio:16/9;position:relative;cursor:pointer}
    .video-poster-container:hover .video-poster-play-btn{transform:translate(-50%,-50%) scale(1.1)!important}
    .video-poster-image{width:100%;height:100%;background:#0a0a15;background-size:contain;background-position:center;background-repeat:no-repeat}
    .video-poster-play-btn{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transition:transform .2s}
    .video-poster-play-btn svg{filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))}
    .video-poster-duration{position:absolute;top:8px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:white;padding:4px 8px;border-radius:4px;font-size:14px;font-weight:500}
    .video-poster-loading{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:30px;height:30px;border:3px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:cvp-spin 1s linear infinite}
    @keyframes cvp-spin{to{transform:translate(-50%,-50%) rotate(360deg)}}
    .cvp-inline-video{aspect-ratio:16/9;background:#000;display:block}
    .cvp-hidden-player{display:none!important}
    .coomer-img-wrapper{position:relative;display:inline-block;line-height:0}
    .coomer-dl-btn{position:absolute;right:10px;bottom:10px;width:42px;height:42px;background:rgba(0,0,0,0.75);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;transition:all .25s ease;z-index:999;border:2px solid rgba(255,255,255,0.3);box-shadow:0 4px 12px rgba(0,0,0,0.5)}
    .coomer-img-wrapper:hover .coomer-dl-btn{opacity:1}
    .coomer-dl-btn:hover{background:rgba(0,0,0,0.95);transform:scale(1.15)}
    .coomer-dl-btn svg{width:22px;height:22px;fill:#fff}
    .autopager-page-separator{margin:40px 0;padding:20px 0;border-top:2px dashed rgba(255,255,255,0.2);position:relative;text-align:center}
    .autopager-page-info{display:inline-block;background:rgba(0,0,0,0.85);color:#fff;padding:8px 20px;border-radius:20px;font-size:14px;font-weight:500;box-shadow:0 2px 8px rgba(0,0,0,0.3)}
    .autopager-loading{margin:40px 0;text-align:center;color:#fff;font-size:16px}
    .autopager-loading-spinner{display:inline-block;width:40px;height:40px;border:4px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:autopager-spin 1s linear infinite;margin-bottom:10px}
    @keyframes autopager-spin{to{transform:rotate(360deg)}}
    .autopager-end{margin:40px 0;text-align:center;color:#888;font-size:14px}
    
    /* Safari 设置按钮 */
    #coomer-safari-settings{position:fixed;bottom:80px;right:20px;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border:none;cursor:pointer;box-shadow:0 4px 15px rgba(102,126,234,0.4);z-index:99999;display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s}
    #coomer-safari-settings:hover{transform:scale(1.1);box-shadow:0 6px 20px rgba(102,126,234,0.6)}
    #coomer-safari-settings svg{width:24px;height:24px;fill:white}
    `;
    document.head.appendChild(style);

    const processedVideos = new WeakSet();

    function formatDuration(s) { if (!s || !isFinite(s)) return null; return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') }

    function captureVideoFrame(src, cb) {
        const v = document.createElement('video');
        v.crossOrigin = 'anonymous'; v.muted = true; v.playsInline = true; v.preload = 'metadata';
        let done = false;
        const fin = r => { if (done) return; done = true; v.pause(); v.src = ''; cb(r) };
        v.onloadeddata = () => v.currentTime = 0.1;
        v.onseeked = () => { try { const c = document.createElement('canvas'); c.width = v.videoWidth || 640; c.height = v.videoHeight || 360; c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); fin({ poster: c.toDataURL('image/jpeg', 0.8), duration: v.duration }) } catch (e) { fin({ poster: null, duration: v.duration }) } };
        v.onerror = () => fin({ poster: null, duration: null });
        setTimeout(() => fin({ poster: null, duration: null }), 20000);
        v.src = src; v.load();
    }

    function findPlayerContainer(v) { let c = v.parentElement; for (let i = 0; i < 5 && c; i++) { if (c.classList.contains('fluid_video_wrapper') || c.classList.contains('fp-player') || c.classList.contains('video-js')) return c; c = c.parentElement } return null }

    function createInlinePlayer(src, poster, wrapper, w) { const v = document.createElement('video'); v.className = 'cvp-inline-video'; v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true; v.style.width = w; if (poster) v.poster = poster; wrapper.innerHTML = ''; wrapper.appendChild(v); v.play().catch(() => { }) }

    function processVideo(video) {
        if (processedVideos.has(video) || video.classList.contains('cvp-inline-video')) return;

        const pc = findPlayerContainer(video);
        const te = pc || video;
        const nextSibling = te.nextElementSibling;
        if (nextSibling && nextSibling.classList.contains('cvp-wrapper')) {
            nextSibling.remove();
        }

        processedVideos.add(video);
        let src = video.src || (video.querySelector('source')?.src);
        if (!src) return;
        const ep = video.poster || '';
        const pe = te.parentElement;
        if (!pe) return;
        const wp = (CONFIG.scale * 100) + '%';
        const wr = document.createElement('div'); wr.className = 'cvp-wrapper';
        const cont = document.createElement('div'); cont.className = 'video-poster-container'; cont.style.width = wp;
        const img = document.createElement('div'); img.className = 'video-poster-image'; cont.appendChild(img);
        const ld = document.createElement('div'); ld.className = 'video-poster-loading'; cont.appendChild(ld);
        const pb = document.createElement('div'); pb.className = 'video-poster-play-btn';
        pb.innerHTML = '<svg width="68" height="68" viewBox="0 0 68 68" fill="none"><circle cx="34" cy="34" r="34" fill="rgba(0,0,0,0.6)"/><path d="M27 22L48 34L27 46V22Z" fill="' + CONFIG.iconColor + '"/></svg>';
        cont.appendChild(pb);
        const dur = document.createElement('div'); dur.className = 'video-poster-duration'; cont.appendChild(dur);
        wr.appendChild(cont);
        te.classList.add('cvp-hidden-player');
        try { video.pause(); video.muted = true; video.autoplay = false } catch (e) { }
        pe.insertBefore(wr, te.nextSibling);
        let fp = ep;
        cont.onclick = e => { e.preventDefault(); e.stopPropagation(); createInlinePlayer(src, fp, wr, wp) };
        captureVideoFrame(src, r => { ld.remove(); pb.style.display = 'block'; if (r.poster) { img.style.backgroundImage = 'url(' + r.poster + ')'; fp = r.poster } else if (ep) { img.style.backgroundImage = 'url(' + ep + ')' } const dt = formatDuration(r.duration); if (dt) dur.textContent = dt });
    }

    // ========== 图片下载按钮 (Safari 适配) ==========
    function findParentLink(el) {
        let p = el.parentElement;
        for (let i = 0; i < 10 && p; i++) {
            if (p.tagName === 'A' && p.href) {
                const h = p.href;
                if (h.includes('.coomer.') && h.includes('/data/') && /\.(jpg|jpeg|png|gif|webp)/i.test(h)) {
                    return h;
                }
            }
            p = p.parentElement;
        }
        return null;
    }

    // Safari 适配：使用 fetch + blob URL 替代 GM_download
    function downloadFile(url, filename) {
        fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(blobUrl);
                }, 100);
            })
            .catch(err => {
                console.log('[Coomer Safari] 下载失败，尝试直接打开', err);
                window.open(url, '_blank');
            });
    }

    function addDownloadButtons() {
        document.querySelectorAll('img').forEach(img => {
            if (img.closest('.coomer-img-wrapper') || img.dataset.dlAdded) return;
            if (img.width < 80 || img.height < 80) return;

            const src = img.dataset.src || img.src || '';
            if (!src.includes('coomer') && !src.includes('kemono')) return;
            if (src.includes('icon') || src.includes('avatar') || src.includes('logo') || src.includes('banner')) return;

            const originalUrl = findParentLink(img);
            if (!originalUrl) return;

            img.dataset.dlAdded = '1';

            let filename = 'image.jpg';
            const fMatch = originalUrl.match(/[?&]f=([^&]+)/);
            if (fMatch) {
                filename = decodeURIComponent(fMatch[1]);
            } else {
                filename = originalUrl.split('/').pop().split('?')[0];
            }

            const wrapper = document.createElement('div');
            wrapper.className = 'coomer-img-wrapper';
            img.parentNode.insertBefore(wrapper, img);
            wrapper.appendChild(img);

            const btn = document.createElement('div');
            btn.className = 'coomer-dl-btn';
            btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>';
            btn.title = '下载原图: ' + filename;

            btn.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                downloadFile(originalUrl, filename);
            };

            wrapper.appendChild(btn);
        });
    }

    // ========== 自动翻页功能 ==========
    const AutoPager = {
        enabled: false,
        loading: false,
        ended: false,
        pageNum: 1,
        loadedUrls: new Set(),
        preloadQueue: [],
        maxPreload: 3,
        lastInserted: null,
        scrollListenerAdded: false,

        isPostPage() {
            const pattern = /^https?:\/\/[^\/]*(coomer|kemono)\.(st|su|party)\/[^\/]+\/user\/[^\/]+\/post\/\d+/;
            return pattern.test(window.location.href);
        },

        getPageContent() {
            const selectors = [
                '#main section.site-section--post',
                'section.site-section--post',
                '#main .post',
                '.post-container',
                'main article',
                'main',
                '#content',
                '.content'
            ];

            for (const sel of selectors) {
                const elem = document.querySelector(sel);
                if (elem) return elem;
            }
            return document.body;
        },

        findNextLink() {
            const searchRoot = this.lastInserted || document;
            const currentMatch = window.location.href.match(/\/post\/(\d+)/);
            const currentId = currentMatch ? parseInt(currentMatch[1]) : 0;

            const standardSelectors = [
                'a[rel="next"]',
                'a.next',
                'a.next-post',
                '.pagination a:last-child',
                '.post-navigation a.next'
            ];

            for (const sel of standardSelectors) {
                try {
                    const link = searchRoot.querySelector(sel);
                    if (link && link.href && link.href.includes('/post/')) {
                        return link.href;
                    }
                } catch (e) { }
            }

            const allLinks = Array.from(searchRoot.querySelectorAll('a[href*="/post/"]'));
            for (const link of allLinks) {
                const text = link.textContent.trim().toLowerCase();
                if (text.includes('next') || text.includes('下一篇') || text === '→' || text === '»') {
                    return link.href;
                }
            }

            if (currentId > 0) {
                const postLinks = Array.from(document.querySelectorAll('a[href*="/post/"]'));
                const postIds = postLinks
                    .map(a => {
                        const m = a.href.match(/\/post\/(\d+)/);
                        return m ? parseInt(m[1]) : 0;
                    })
                    .filter(id => id > 0 && id > currentId)
                    .sort((a, b) => a - b);

                if (postIds.length > 0) {
                    const nextId = postIds[0];
                    return window.location.href.replace(/\/post\/\d+/, '/post/' + nextId);
                }
            }

            return null;
        },

        createSeparator(pageNum, url) {
            const sep = document.createElement('div');
            sep.className = 'autopager-page-separator';
            sep.innerHTML = `<div class="autopager-page-info">第 ${pageNum} 页</div>`;
            sep.dataset.pageUrl = url;
            return sep;
        },

        createLoader() {
            const loader = document.createElement('div');
            loader.className = 'autopager-loading';
            loader.innerHTML = '<div class="autopager-loading-spinner"></div><div>正在加载下一页...</div>';
            return loader;
        },

        createEndMarker() {
            const end = document.createElement('div');
            end.className = 'autopager-end';
            end.textContent = '没有更多帖子了';
            return end;
        },

        async loadNextPage() {
            if (!this.isPostPage()) {
                this.ended = true;
                return;
            }

            if (this.loading || this.ended) return;

            const nextUrl = this.findNextLink();
            if (!nextUrl || this.loadedUrls.has(nextUrl)) {
                this.ended = true;
                const container = this.getPageContent();
                if (container && container.parentElement) {
                    container.parentElement.appendChild(this.createEndMarker());
                }
                return;
            }

            this.loading = true;
            this.loadedUrls.add(nextUrl);

            const container = this.getPageContent();
            if (!container || !container.parentElement) {
                this.loading = false;
                return;
            }

            if (container.parentElement) {
                const parentStyle = window.getComputedStyle(container.parentElement);
                if (parentStyle.display === 'flex' && parentStyle.flexDirection === 'row') {
                    container.parentElement.style.flexDirection = 'column';
                }
            }

            const loader = this.createLoader();
            container.parentElement.appendChild(loader);

            try {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = nextUrl;
                document.body.appendChild(iframe);

                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('加载超时')), 15000);
                    iframe.onload = () => { clearTimeout(timeout); setTimeout(resolve, 1000); };
                    iframe.onerror = () => { clearTimeout(timeout); reject(new Error('加载失败')); };
                });

                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const newContent = iframeDoc.querySelector('#main section.site-section--post') ||
                    iframeDoc.querySelector('section.site-section--post') ||
                    iframeDoc.querySelector('.post') ||
                    iframeDoc.querySelector('main');

                iframe.remove();

                if (newContent) {
                    this.pageNum++;
                    loader.remove();

                    const insertAfter = this.lastInserted || container;
                    const separator = this.createSeparator(this.pageNum, nextUrl);
                    insertAfter.after(separator);

                    const cloned = newContent.cloneNode(true);
                    separator.after(cloned);
                    this.lastInserted = cloned;

                    processAllVideos();
                    addDownloadButtons();

                    this.preloadNext();
                } else {
                    loader.remove();
                    this.ended = true;
                    container.parentElement.appendChild(this.createEndMarker());
                }
            } catch (e) {
                console.error('[AutoPager Safari] 加载失败:', e);
                loader.remove();
                this.ended = true;
            }

            this.loading = false;
        },

        preloadNext() {
            if (this.preloadQueue.length >= this.maxPreload) return;
            setTimeout(() => {
                if (!this.ended && this.preloadQueue.length < this.maxPreload) {
                    this.loadNextPage();
                }
            }, 500);
        },

        handleScroll() {
            if (!this.enabled || this.loading || this.ended) return;

            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            if (scrollTop + windowHeight >= documentHeight - 800) {
                this.loadNextPage();
            }
        },

        init() {
            if (!CONFIG.autoPagerEnabled) return;

            let lastUrl = window.location.href;
            const urlChangeObserver = new MutationObserver(() => {
                const currentUrl = window.location.href;
                if (currentUrl !== lastUrl) {
                    lastUrl = currentUrl;
                    const scrollPos = window.scrollY || document.documentElement.scrollTop;
                    this.cleanup();
                    requestAnimationFrame(() => window.scrollTo(0, scrollPos));

                    if (this.isPostPage()) {
                        this.startPaging(currentUrl);
                    } else {
                        this.ended = true;
                        this.enabled = false;
                    }
                }
            });

            urlChangeObserver.observe(document.body, { childList: true, subtree: true });

            if (this.isPostPage()) {
                this.startPaging(window.location.href);
            }
        },

        startPaging(url) {
            const container = this.getPageContent();
            this.enabled = true;
            this.reset();
            this.loadedUrls.add(url);

            if (!this.scrollListenerAdded) {
                let scrollTimer;
                window.addEventListener('scroll', () => {
                    clearTimeout(scrollTimer);
                    scrollTimer = setTimeout(() => this.handleScroll(), 150);
                }, { passive: true });
                this.scrollListenerAdded = true;
            }

            setTimeout(() => {
                for (let i = 0; i < this.maxPreload; i++) {
                    setTimeout(() => {
                        if (!this.ended && this.preloadQueue.length < this.maxPreload) {
                            this.preloadQueue.push(i);
                            if (i === 0) this.loadNextPage();
                        }
                    }, i * 1000);
                }
            }, 2000);
        },

        cleanup() {
            document.querySelectorAll('.autopager-page-separator').forEach(separator => {
                const nextContent = separator.nextElementSibling;
                if (nextContent && !nextContent.classList.contains('autopager-page-separator')
                    && !nextContent.classList.contains('autopager-loading')
                    && !nextContent.classList.contains('autopager-end')) {
                    nextContent.remove();
                }
                separator.remove();
            });
            document.querySelectorAll('.autopager-loading').forEach(el => el.remove());
            document.querySelectorAll('.autopager-end').forEach(el => el.remove());
            this.lastInserted = null;
        },

        reset() {
            this.loading = false;
            this.ended = false;
            this.pageNum = 1;
            this.loadedUrls.clear();
            this.preloadQueue = [];
            this.lastInserted = null;
        }
    };

    // Safari 设置按钮
    function createSettingsButton() {
        const btn = document.createElement('button');
        btn.id = 'coomer-safari-settings';
        btn.title = '设置';
        btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>';

        btn.onclick = () => {
            const scale = prompt('请输入缩放倍率 (0.1 - 2.0)：', CONFIG.scale);
            if (scale !== null) {
                const v = parseFloat(scale);
                if (v >= 0.1 && v <= 2.0) {
                    storageSet('scale', v);
                    CONFIG.scale = v;
                    alert('缩放倍率已设置为 ' + v + '，刷新生效');
                }
            }

            const autoPager = confirm('是否启用自动翻页？\n（点击"确定"启用，点击"取消"禁用）');
            storageSet('autoPagerEnabled', autoPager);
            CONFIG.autoPagerEnabled = autoPager;
        };

        document.body.appendChild(btn);
    }

    function processAllVideos() { document.querySelectorAll('video:not(.cvp-inline-video)').forEach(processVideo) }

    function init() {
        setTimeout(() => {
            processAllVideos();
            addDownloadButtons();
            createSettingsButton();
            new MutationObserver(() => {
                processAllVideos();
                addDownloadButtons();
            }).observe(document.body, { childList: true, subtree: true });
        }, 1000);
        window.addEventListener('load', () => setTimeout(() => { processAllVideos(); addDownloadButtons() }, 2000));

        AutoPager.init();
    }

    init();
    console.log('[Coomer Safari v7.2] 已加载 - 视频封面 + 图片下载 + 自动翻页');
})();
