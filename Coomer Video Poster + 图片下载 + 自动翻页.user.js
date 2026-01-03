// ==UserScript==
// @name         Coomer Video Poster + 图片下载 + 自动翻页
// @namespace    http://tampermonkey.net/
// @version      7.2
// @description  视频封面 + 图片下载按钮 + 自动翻页
// @author       老司机
// @match        https://coomer.su/*
// @match        https://coomer.party/*
// @match        https://kemono.su/*
// @match        https://kemono.party/*
// @match        https://*.coomer.st/*
// @match        https://*.coomer.su/*
// @match        https://*.kemono.su/*
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// @connect      coomer.st
// @connect      coomer.su
// @connect      coomer.party
// @connect      kemono.su
// @connect      kemono.party
// ==/UserScript==

(function () {
    'use strict';

    const DEFAULT_CONFIG = { scale: 1.0, iconColor: '#ffffff', autoPagerEnabled: true };
    let CONFIG = {
        scale: GM_getValue('scale', DEFAULT_CONFIG.scale),
        iconColor: GM_getValue('iconColor', DEFAULT_CONFIG.iconColor),
        autoPagerEnabled: GM_getValue('autoPagerEnabled', DEFAULT_CONFIG.autoPagerEnabled)
    };

    GM_registerMenuCommand('⚙️ 设置缩放倍率', () => {
        const input = prompt('请输入缩放倍率 (0.1 - 2.0)', CONFIG.scale);
        if (input !== null) {
            const v = parseFloat(input);
            if (v >= 0.1 && v <= 2.0) {
                GM_setValue('scale', v);
                CONFIG.scale = v;
                alert('已设置为 ' + v + '，刷新生效');
            }
        }
    });

    GM_registerMenuCommand('📄 ' + (CONFIG.autoPagerEnabled ? '关闭' : '开启') + '自动翻页', () => {
        CONFIG.autoPagerEnabled = !CONFIG.autoPagerEnabled;
        GM_setValue('autoPagerEnabled', CONFIG.autoPagerEnabled);
        alert('自动翻页已' + (CONFIG.autoPagerEnabled ? '开启' : '关闭') + '，刷新生效');
    });

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

        // 检查是否已经有wrapper了，如果有就删除旧的
        const pc = findPlayerContainer(video);
        const te = pc || video;
        const nextSibling = te.nextElementSibling;
        if (nextSibling && nextSibling.classList.contains('cvp-wrapper')) {
            // 删除旧的wrapper
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

    // ========== 图片下载按钮 ==========
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

    function addDownloadButtons() {
        document.querySelectorAll('img').forEach(img => {
            if (img.closest('.coomer-img-wrapper') || img.dataset.dlAdded) return;
            if (img.width < 80 || img.height < 80) return;

            const src = img.dataset.src || img.src || '';
            if (!src.includes('coomer') && !src.includes('kemono')) return;
            if (src.includes('icon') || src.includes('avatar') || src.includes('logo') || src.includes('banner')) return;

            // 从父级<a>标签获取原图链接
            const originalUrl = findParentLink(img);
            if (!originalUrl) return;

            img.dataset.dlAdded = '1';

            // 从URL的?f=参数获取原始文件名
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

                // 使用GM_download下载
                GM_download({
                    url: originalUrl,
                    name: filename,
                    onerror: function (err) {
                        console.log('GM_download失败，尝试直接打开', err);
                        window.open(originalUrl, '_blank');
                    }
                });
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
        lastInserted: null, // 记录最后插入的元素
        scrollListenerAdded: false, // 标记是否已添加滚动监听

        // 检测是否在帖子页面
        isPostPage() {
            const pattern = /^https?:\/\/[^\/]*(coomer|kemono)\.(st|su|party)\/[^\/]+\/user\/[^\/]+\/post\/\d+/;
            const result = pattern.test(window.location.href);
            console.log('[AutoPager] URL匹配测试:', window.location.href, '结果:', result);
            return result;
        },

        // 提取帖子内容容器
        getPageContent() {
            // 尝试多个选择器
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
                if (elem) {
                    console.log('[AutoPager] 找到内容容器:', sel);
                    return elem;
                }
            }

            console.log('[AutoPager] 未找到内容容器，尝试使用body');
            return document.body;
        },

        // 查找下一页链接
        findNextLink() {
            console.log('[AutoPager] 开始查找下一页链接...');

            // 优先从最后插入的内容中查找，否则从整个页面查找
            const searchRoot = this.lastInserted || document;
            console.log('[AutoPager] 查找范围:', this.lastInserted ? '最后插入的元素' : '整个页面');

            // 获取当前帖子ID
            const currentMatch = window.location.href.match(/\/post\/(\d+)/);
            const currentId = currentMatch ? parseInt(currentMatch[1]) : 0;
            console.log('[AutoPager] 当前帖子ID:', currentId);

            // 策略1: 查找标准的下一页链接
            const standardSelectors = [
                'a[rel="next"]',
                'a.next',
                'a.next-post',
                'a[href*="/post/"]:has-text("Next")',
                'a[href*="/post/"]:has-text("下一篇")',
                '.pagination a:last-child',
                '.post-navigation a.next'
            ];

            for (const sel of standardSelectors) {
                try {
                    const link = searchRoot.querySelector(sel);
                    if (link && link.href && link.href.includes('/post/')) {
                        console.log('[AutoPager] 找到下一页链接 (标准):', link.href);
                        return link.href;
                    }
                } catch (e) { }
            }

            // 策略2: 查找包含"Next"、"下一篇"等文本的链接
            const allLinks = Array.from(searchRoot.querySelectorAll('a[href*="/post/"]'));
            for (const link of allLinks) {
                const text = link.textContent.trim().toLowerCase();
                if (text.includes('next') || text.includes('下一篇') || text.includes('下一个') || text === '→' || text === '»') {
                    console.log('[AutoPager] 找到下一页链接 (文本匹配):', link.href);
                    return link.href;
                }
            }

            // 策略3: 通过当前帖子ID查找下一个帖子
            if (currentId > 0) {
                console.log('[AutoPager] 当前帖子ID:', currentId);

                // 查找页面上所有帖子链接
                const postLinks = Array.from(document.querySelectorAll('a[href*="/post/"]'));
                console.log('[AutoPager] 页面上找到', postLinks.length, '个帖子链接');

                // 打印所有链接的URL和ID
                const allPostData = postLinks.map(a => {
                    const m = a.href.match(/\/post\/(\d+)/);
                    return { url: a.href, id: m ? parseInt(m[1]) : 0 };
                });
                console.log('[AutoPager] 所有帖子链接:', allPostData);

                const postIds = allPostData
                    .map(item => item.id)
                    .filter(id => id > 0 && id > currentId)
                    .sort((a, b) => a - b);

                console.log('[AutoPager] 大于当前ID的帖子:', postIds);

                if (postIds.length > 0) {
                    const nextId = postIds[0];
                    const nextUrl = window.location.href.replace(/\/post\/\d+/, '/post/' + nextId);
                    console.log('[AutoPager] 找到下一页链接 (ID递增):', nextUrl);
                    return nextUrl;
                } else {
                    console.log('[AutoPager] 策略3失败：没有大于当前ID的帖子');
                }
            }

            // 策略4: 尝试查找导航按钮（通过aria-label或data属性）
            const navButtons = document.querySelectorAll('button, a');
            for (const btn of navButtons) {
                const ariaLabel = btn.getAttribute('aria-label') || '';
                const title = btn.getAttribute('title') || '';
                if ((ariaLabel.toLowerCase().includes('next') || title.toLowerCase().includes('next')) && btn.href) {
                    console.log('[AutoPager] 找到下一页链接 (导航按钮):', btn.href);
                    return btn.href;
                }
            }

            console.log('[AutoPager] 未找到下一页链接');
            return null;
        },

        // 创建分隔符
        createSeparator(pageNum, url) {
            const sep = document.createElement('div');
            sep.className = 'autopager-page-separator';
            sep.innerHTML = `<div class="autopager-page-info">第 ${pageNum} 页</div>`;
            sep.dataset.pageUrl = url;
            return sep;
        },

        // 创建加载指示器
        createLoader() {
            const loader = document.createElement('div');
            loader.className = 'autopager-loading';
            loader.innerHTML = '<div class="autopager-loading-spinner"></div><div>正在加载下一页...</div>';
            return loader;
        },

        // 创建结束提示
        createEndMarker() {
            const end = document.createElement('div');
            end.className = 'autopager-end';
            end.textContent = '没有更多帖子了';
            return end;
        },

        // 加载下一页
        async loadNextPage() {
            console.log('[AutoPager] loadNextPage 被调用');
            console.log('[AutoPager] 当前状态 - loading:', this.loading, 'ended:', this.ended);

            // 检查当前是否还在帖子页面
            if (!this.isPostPage()) {
                console.log('[AutoPager] 当前不在帖子页面，停止自动翻页');
                this.ended = true;
                return;
            }

            if (this.loading || this.ended) {
                console.log('[AutoPager] 跳过加载：正在加载或已结束');
                return;
            }

            const nextUrl = this.findNextLink();
            console.log('[AutoPager] findNextLink 返回:', nextUrl);
            console.log('[AutoPager] 已加载URL列表:', Array.from(this.loadedUrls));

            if (!nextUrl || this.loadedUrls.has(nextUrl)) {
                console.log('[AutoPager] 没有下一页或已加载，设置ended=true');
                this.ended = true;
                const container = this.getPageContent();
                if (container && container.parentElement) {
                    container.parentElement.appendChild(this.createEndMarker());
                }
                return;
            }

            this.loading = true;
            this.loadedUrls.add(nextUrl);
            console.log('[AutoPager] 开始加载:', nextUrl);

            const container = this.getPageContent();
            console.log('[AutoPager] 容器:', container ? container.tagName : 'null');
            console.log('[AutoPager] 容器父元素:', container?.parentElement ? container.parentElement.tagName : 'null');
            console.log('[AutoPager] 容器父元素ID:', container?.parentElement?.id);
            console.log('[AutoPager] 容器父元素class:', container?.parentElement?.className);

            // 输出父元素的display样式
            if (container?.parentElement) {
                const parentStyle = window.getComputedStyle(container.parentElement);
                console.log('[AutoPager] 父元素display:', parentStyle.display);
                console.log('[AutoPager] 父元素flexDirection:', parentStyle.flexDirection);
                console.log('[AutoPager] 父元素gridTemplateColumns:', parentStyle.gridTemplateColumns);
            }

            // 输出父元素的所有子元素
            if (container?.parentElement) {
                const children = Array.from(container.parentElement.children);
                console.log('[AutoPager] 父元素子元素数量:', children.length);
                console.log('[AutoPager] 父元素子元素:', children.map(c => ({
                    tag: c.tagName,
                    class: c.className,
                    id: c.id
                })));
            }

            if (!container || !container.parentElement) {
                console.log('[AutoPager] 容器或父元素不存在，终止加载');
                this.loading = false;
                return;
            }

            // 强制修改父元素的flex方向为column，确保垂直排列
            if (container.parentElement) {
                const parentStyle = window.getComputedStyle(container.parentElement);
                if (parentStyle.display === 'flex' && parentStyle.flexDirection === 'row') {
                    console.log('[AutoPager] 检测到flex-direction: row，强制改为column');
                    container.parentElement.style.flexDirection = 'column';
                }
            }

            const loader = this.createLoader();
            container.parentElement.appendChild(loader);
            console.log('[AutoPager] 加载指示器已插入');

            // 使用iframe加载页面（支持React SPA）
            try {
                console.log('[AutoPager] 创建iframe加载页面...');
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = nextUrl;
                document.body.appendChild(iframe);

                // 等待iframe加载完成
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('iframe加载超时'));
                    }, 15000);

                    iframe.onload = () => {
                        clearTimeout(timeout);
                        console.log('[AutoPager] iframe加载完成');

                        // 等待React渲染（额外延迟）
                        setTimeout(resolve, 1000);
                    };

                    iframe.onerror = () => {
                        clearTimeout(timeout);
                        reject(new Error('iframe加载失败'));
                    };
                });

                // 从iframe中提取内容
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                console.log('[AutoPager] 开始提取iframe内容');

                const newContent = iframeDoc.querySelector('#main section.site-section--post') ||
                    iframeDoc.querySelector('section.site-section--post') ||
                    iframeDoc.querySelector('.post') ||
                    iframeDoc.querySelector('main');

                console.log('[AutoPager] 提取到的新内容:', newContent ? newContent.tagName : 'null');

                // 删除iframe
                iframe.remove();

                if (newContent) {
                    this.pageNum++;
                    console.log('[AutoPager] 准备插入第', this.pageNum, '页');

                    // 移除加载器
                    loader.remove();

                    // 确定插入位置：如果有lastInserted就在它后面，否则在当前容器后面
                    const insertAfter = this.lastInserted || container;
                    console.log('[AutoPager] 插入位置:', insertAfter === container ? '当前容器后' : '最后插入元素后');

                    // 插入分隔符
                    const separator = this.createSeparator(this.pageNum, nextUrl);
                    insertAfter.after(separator);

                    // 插入新内容（在分隔符之后）
                    const cloned = newContent.cloneNode(true);
                    separator.after(cloned);
                    console.log('[AutoPager] 新内容已插入DOM');

                    // 记录最后插入的元素
                    this.lastInserted = cloned;

                    // 处理新加载页面的视频和图片
                    processAllVideos();
                    addDownloadButtons();

                    // 更新历史记录（可选）
                    // history.replaceState({}, '', nextUrl);

                    console.log('[AutoPager] 已加载第 ' + this.pageNum + ' 页:', nextUrl);

                    // 预加载下几页
                    this.preloadNext();
                } else {
                    console.log('[AutoPager] 未找到新内容，结束翻页');
                    loader.remove();
                    this.ended = true;
                    container.parentElement.appendChild(this.createEndMarker());
                }
            } catch (e) {
                console.error('[AutoPager] 加载失败:', e);
                loader.remove();
                this.ended = true;
            }

            this.loading = false;
            console.log('[AutoPager] loadNextPage 完成，loading=false');
        },

        // 预加载下几页
        preloadNext() {
            if (this.preloadQueue.length >= this.maxPreload) return;

            // 递归预加载
            setTimeout(() => {
                if (!this.ended && this.preloadQueue.length < this.maxPreload) {
                    this.loadNextPage();
                }
            }, 500);
        },

        // 获取页面HTML
        fetchPage(url) {
            console.log('[AutoPager] fetchPage 被调用，URL:', url);
            return new Promise((resolve, reject) => {
                if (typeof GM_xmlhttpRequest !== 'undefined') {
                    console.log('[AutoPager] 使用 GM_xmlhttpRequest');
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: url,
                        onload: (response) => {
                            console.log('[AutoPager] GM_xmlhttpRequest 成功，状态:', response.status);
                            resolve(response.responseText);
                        },
                        onerror: (error) => {
                            console.error('[AutoPager] GM_xmlhttpRequest 失败:', error);
                            reject(error);
                        }
                    });
                } else {
                    console.log('[AutoPager] 使用 fetch (降级)');
                    // 降级到fetch
                    fetch(url)
                        .then(r => {
                            console.log('[AutoPager] fetch 成功，状态:', r.status);
                            return r.text();
                        })
                        .then(resolve)
                        .catch(err => {
                            console.error('[AutoPager] fetch 失败:', err);
                            reject(err);
                        });
                }
            });
        },

        // 滚动监听
        handleScroll() {
            if (!this.enabled || this.loading || this.ended) return;

            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            // 距离底部800px时触发
            if (scrollTop + windowHeight >= documentHeight - 800) {
                this.loadNextPage();
            }
        },

        // 初始化
        init() {
            console.log('[AutoPager] 初始化开始...');
            console.log('[AutoPager] 当前URL:', window.location.href);
            console.log('[AutoPager] 配置状态:', CONFIG.autoPagerEnabled ? '已启用' : '已禁用');

            if (!CONFIG.autoPagerEnabled) {
                console.log('[AutoPager] 自动翻页已禁用');
                return;
            }

            // 监听URL变化（SPA路由变化）- 无论初始页面是什么都启动
            let lastUrl = window.location.href;
            const urlChangeObserver = new MutationObserver(() => {
                const currentUrl = window.location.href;
                if (currentUrl !== lastUrl) {
                    console.log('[AutoPager] URL变化检测:', lastUrl, '->', currentUrl);
                    lastUrl = currentUrl;

                    // 保存当前滚动位置
                    const scrollPos = window.scrollY || document.documentElement.scrollTop;
                    console.log('[AutoPager] 保存滚动位置:', scrollPos);

                    // 先清理自动翻页插入的内容（无论跳转到哪里都清理）
                    this.cleanup();

                    // 恢复滚动位置
                    requestAnimationFrame(() => {
                        window.scrollTo(0, scrollPos);
                        console.log('[AutoPager] 恢复滚动位置:', scrollPos);
                    });

                    // 检查新URL是否为帖子页面
                    if (this.isPostPage()) {
                        console.log('[AutoPager] 进入帖子页面，启动自动翻页');
                        this.startPaging(currentUrl);
                    } else {
                        console.log('[AutoPager] 离开帖子页面');
                        this.ended = true;
                        this.enabled = false;
                    }
                }
            });

            urlChangeObserver.observe(document.body, {
                childList: true,
                subtree: true
            });

            // 如果当前就是帖子页面，立即启动
            const isPost = this.isPostPage();
            console.log('[AutoPager] 是否为帖子页面:', isPost);

            if (isPost) {
                this.startPaging(window.location.href);
            } else {
                console.log('[AutoPager] 非帖子页面，等待跳转到帖子页');
            }

            console.log('[AutoPager] URL监听器已启动');
        },

        // 启动自动翻页
        startPaging(url) {
            const container = this.getPageContent();
            console.log('[AutoPager] 页面内容容器:', container ? container.className : '未找到');

            this.enabled = true;
            this.reset();
            this.loadedUrls.add(url);

            // 监听滚动（如果之前没有监听）
            if (!this.scrollListenerAdded) {
                let scrollTimer;
                window.addEventListener('scroll', () => {
                    clearTimeout(scrollTimer);
                    scrollTimer = setTimeout(() => this.handleScroll(), 150);
                }, { passive: true });
                this.scrollListenerAdded = true;
                console.log('[AutoPager] 滚动监听器已添加');
            }

            // 预加载前3页
            setTimeout(() => {
                console.log('[AutoPager] 准备预加载下一页...');
                for (let i = 0; i < this.maxPreload; i++) {
                    setTimeout(() => {
                        if (!this.ended && this.preloadQueue.length < this.maxPreload) {
                            this.preloadQueue.push(i);
                            // 只在第一页时预加载，之后通过滚动触发
                            if (i === 0) this.loadNextPage();
                        }
                    }, i * 1000);
                }
            }, 2000);

            console.log('[AutoPager] 自动翻页已启用');
        },

        // 清理插入的内容
        cleanup() {
            console.log('[AutoPager] 清理自动翻页插入的内容...');

            // 1. 删除所有分隔符后面紧邻的内容页面
            document.querySelectorAll('.autopager-page-separator').forEach(separator => {
                const nextContent = separator.nextElementSibling;
                if (nextContent && !nextContent.classList.contains('autopager-page-separator')
                    && !nextContent.classList.contains('autopager-loading')
                    && !nextContent.classList.contains('autopager-end')) {
                    nextContent.remove();
                }
                separator.remove();
            });

            // 2. 删除所有加载指示器
            document.querySelectorAll('.autopager-loading').forEach(el => el.remove());

            // 3. 删除所有结束标记
            document.querySelectorAll('.autopager-end').forEach(el => el.remove());

            // 4. 清空lastInserted引用
            this.lastInserted = null;

            console.log('[AutoPager] 清理完成');
        },

        // 重置状态
        reset() {
            console.log('[AutoPager] 重置自动翻页状态');
            this.loading = false;
            this.ended = false;
            this.pageNum = 1;
            this.loadedUrls.clear();
            this.preloadQueue = [];
            this.lastInserted = null;
        }
    };

    function processAllVideos() { document.querySelectorAll('video:not(.cvp-inline-video)').forEach(processVideo) }

    function init() {
        setTimeout(() => {
            processAllVideos();
            addDownloadButtons();
            new MutationObserver(() => {
                processAllVideos();
                addDownloadButtons();
            }).observe(document.body, { childList: true, subtree: true });
        }, 1000);
        window.addEventListener('load', () => setTimeout(() => { processAllVideos(); addDownloadButtons() }, 2000));

        // 启动自动翻页
        AutoPager.init();
    }

    init();
    console.log('Coomer v7.2 已加载 - 视频封面 + 图片下载 + 自动翻页');
})();
