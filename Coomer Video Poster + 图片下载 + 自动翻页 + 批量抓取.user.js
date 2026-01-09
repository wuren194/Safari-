// ==UserScript==
// @name         Coomer Video Poster + 图片下载 + 自动翻页 + 批量抓取
// @namespace    http://tampermonkey.net/
// @version      10.8
// @description  视频封面 + 图片下载按钮 + 自动翻页 + 批量抓取用户所有帖子 (油猴极速版)
// @author       老司机 & AI优化
// @match        *://coomer.su/*
// @match        *://coomer.party/*
// @match        *://coomer.st/*
// @match        *://kemono.su/*
// @match        *://kemono.party/*
// @match        *://kemono.st/*
// @match        *://*.coomer.su/*
// @match        *://*.coomer.st/*
// @match        *://*.coomer.party/*
// @match        *://*.kemono.su/*
// @match        *://*.kemono.st/*
// @match        *://*.kemono.party/*
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @run-at       document-end
// @connect      coomer.st
// @connect      coomer.su
// @connect      coomer.party
// @connect      kemono.st
// @connect      kemono.su
// @connect      kemono.party
// @connect      *
// @updateURL    https://raw.githubusercontent.com/wuren194/Safari-/main/Coomer%20Video%20Poster%20%2B%20%E5%9B%BE%E7%89%87%E4%B8%8B%E8%BD%BD%20%2B%20%E8%87%AA%E5%8A%A8%E7%BF%BB%E9%A1%B5%20%2B%20%E6%89%B9%E9%87%8F%E6%8A%93%E5%8F%96.user.js
// @downloadURL  https://raw.githubusercontent.com/wuren194/Safari-/main/Coomer%20Video%20Poster%20%2B%20%E5%9B%BE%E7%89%87%E4%B8%8B%E8%BD%BD%20%2B%20%E8%87%AA%E5%8A%A8%E7%BF%BB%E9%A1%B5%20%2B%20%E6%89%B9%E9%87%8F%E6%8A%93%E5%8F%96.user.js
// @supportURL   https://github.com/wuren194/Safari-/issues
// ==/UserScript==

(function () {
    'use strict';

    // ========== 配置 ==========
    const CONFIG = {
        scale: GM_getValue('scale', 1.0),
        iconColor: GM_getValue('iconColor', '#ffffff'),
        CONCURRENCY: 2, // 降低并发数保证稳定
        REQUEST_TIMEOUT: 25000, // 请求超时 25秒
        RETRY_COUNT: 3, // 最大重试次数
        RETRY_DELAY: 1000, // 重试间隔基础(指数退避)
        REQUEST_GAP: 500, // 请求间隔
        Z_LAYERS: { BUTTON: 2147483641, MODAL: 2147483650 }
    };

    // ========== 状态 ==========
    const STATE = {
        allMedia: [],
        allPostUrls: [],
        selectedItems: new Set(),
        currentTab: 'image',
        stopScraping: false,
        isModalOpen: false
    };

    // ========== 样式注入 ==========
    GM_addStyle(`
        :root {
            --apple-glass: rgba(30, 30, 30, 0.85);
            --apple-accent: #0a84ff;
            --apple-border: rgba(255, 255, 255, 0.12);
            --text-primary: rgba(255, 255, 255, 0.95);
            --text-secondary: rgba(255, 255, 255, 0.6);
        }
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
        
        /* 悬浮按钮 */
        #coomer-btn-container{position:fixed!important;right:24px!important;bottom:100px!important;display:flex!important;flex-direction:column!important;gap:12px!important;z-index:${CONFIG.Z_LAYERS.BUTTON}!important}
        .coomer-float-btn{width:56px!important;height:56px!important;background:var(--apple-glass)!important;backdrop-filter:blur(25px)!important;-webkit-backdrop-filter:blur(25px)!important;border-radius:50%!important;cursor:pointer!important;box-shadow:0 4px 16px rgba(0,0,0,0.3)!important;border:1px solid var(--apple-border)!important;display:flex!important;align-items:center;justify-content:center!important;transition:transform 0.2s!important}
        .coomer-float-btn:hover{transform:scale(1.1)!important;background:rgba(50,50,50,0.9)!important}
        .coomer-float-btn svg{width:26px;height:26px;fill:#fff}
        
        /* 模态框 */
        #coomer-modal{display:none;position:fixed!important;top:50%!important;left:50%!important;transform:translate(-50%,-50%) scale(0.96)!important;width:92vw!important;max-width:1400px!important;height:88vh!important;background:var(--apple-glass)!important;backdrop-filter:blur(50px)!important;-webkit-backdrop-filter:blur(50px)!important;border-radius:20px!important;border:1px solid var(--apple-border)!important;box-shadow:0 20px 60px rgba(0,0,0,0.5)!important;z-index:${CONFIG.Z_LAYERS.MODAL}!important;flex-direction:column!important;overflow:hidden!important;font-family:-apple-system,BlinkMacSystemFont,sans-serif!important;opacity:0;pointer-events:none;transition:opacity 0.3s,transform 0.3s!important;color:#fff}
        #coomer-modal.show{display:flex!important;opacity:1!important;transform:translate(-50%,-50%) scale(1)!important;pointer-events:auto}
        .coomer-header{padding:18px 24px!important;display:flex!important;align-items:center;gap:16px!important;border-bottom:1px solid var(--apple-border)!important;background:rgba(255,255,255,0.02)!important;flex-wrap:wrap}
        .coomer-header h2{margin:0!important;font-size:18px!important;font-weight:600!important;color:var(--text-primary)!important}
        .coomer-tab-group{background:rgba(0,0,0,0.3)!important;padding:4px!important;border-radius:10px!important;display:flex!important;gap:2px!important}
        .coomer-tab-btn{padding:8px 18px!important;border:none!important;border-radius:8px!important;cursor:pointer!important;background:transparent!important;color:var(--text-secondary)!important;font-size:14px!important;font-weight:500!important;transition:all 0.2s!important}
        .coomer-tab-btn.active{background:var(--apple-accent)!important;color:#fff!important;box-shadow:0 2px 8px rgba(10, 132, 255, 0.4)!important}
        .coomer-action-btn{padding:8px 18px!important;border:none!important;border-radius:10px!important;cursor:pointer!important;background:rgba(255,255,255,0.1)!important;color:#fff!important;font-size:14px!important;font-weight:500!important;transition:all 0.2s!important}
        .coomer-action-btn:hover{background:rgba(255,255,255,0.2)!important}
        .coomer-action-btn.primary{background:var(--apple-accent)!important}
        .coomer-action-btn.downie{background:#ff9500!important}
        .coomer-grid-container{flex:1!important;overflow-y:auto!important;padding:20px!important}
        
        /* 图片卡片 */
        .coomer-media-grid.image-grid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(160px,1fr))!important;gap:14px!important}
        .coomer-media-grid.image-grid .coomer-m-card{aspect-ratio:1!important}
        
        /* 视频卡片 - 大 16:9 */
        .coomer-media-grid.video-grid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(400px,1fr))!important;gap:20px!important}
        .coomer-media-grid.video-grid .coomer-m-card{aspect-ratio:16/9!important}
        
        .coomer-m-card{position:relative!important;background:rgba(255,255,255,0.05)!important;border-radius:12px!important;overflow:hidden!important;cursor:pointer!important;transition:transform 0.2s,box-shadow 0.2s!important;border:3px solid transparent!important}
        .coomer-m-card:hover{transform:scale(1.02)!important;box-shadow:0 12px 28px rgba(0,0,0,0.4)!important}
        .coomer-m-card.selected{border-color:var(--apple-accent)!important;background:rgba(10,132,255,0.15)!important}
        .coomer-m-card img,.coomer-m-card video{width:100%!important;height:100%!important;object-fit:cover!important}
        .coomer-m-card .badge{position:absolute!important;top:10px!important;left:10px!important;background:rgba(0,0,0,0.75)!important;color:#fff!important;padding:4px 10px!important;border-radius:6px!important;font-size:12px!important}
        .coomer-m-card .type-badge{position:absolute!important;bottom:10px!important;left:10px!important;background:rgba(10, 132, 255, 0.9)!important;color:#fff!important;padding:4px 10px!important;border-radius:6px!important;font-size:11px!important;text-transform:uppercase!important}
        .coomer-m-card .check-mark{position:absolute!important;top:10px!important;right:10px!important;width:26px!important;height:26px!important;border-radius:50%!important;border:2px solid rgba(255,255,255,0.5)!important;background:rgba(0,0,0,0.4)!important;display:flex!important;align-items:center;justify-content:center!important}
        .coomer-m-card.selected .check-mark{background:var(--apple-accent)!important;border-color:var(--apple-accent)!important}
        .coomer-m-card.selected .check-mark::after{content:'✓'!important;color:#fff!important;font-size:14px!important;font-weight:700!important}
        .coomer-m-card .play-icon{position:absolute!important;top:50%!important;left:50%!important;transform:translate(-50%,-50%)!important;width:60px!important;height:60px!important;background:rgba(0,0,0,0.6)!important;border-radius:50%!important;display:flex!important;align-items:center;justify-content:center!important}
        .coomer-m-card .play-icon svg{width:28px;height:28px;fill:#fff;margin-left:4px}
        
        /* 视频时长 */
        .coomer-m-card .duration{position:absolute!important;bottom:10px!important;right:10px!important;background:rgba(0,0,0,0.85)!important;color:#fff!important;padding:4px 10px!important;border-radius:6px!important;font-size:13px!important;font-weight:600!important;font-family:'SF Mono',Monaco,monospace!important}
        
        /* 进度条 */
        #coomer-progress{display:none;position:fixed!important;bottom:40px!important;left:50%!important;transform:translateX(-50%)!important;width:500px!important;max-width:90vw!important;padding:24px!important;background:var(--apple-glass)!important;backdrop-filter:blur(50px)!important;-webkit-backdrop-filter:blur(50px)!important;border-radius:18px!important;border:1px solid var(--apple-border)!important;box-shadow:0 12px 48px rgba(0,0,0,0.5)!important;z-index:2147483660!important;color:#fff;text-align:center;font-family:-apple-system,sans-serif}
        .coomer-prog-bar{width:100%!important;height:8px!important;background:rgba(255,255,255,0.1)!important;border-radius:4px!important;overflow:hidden!important;margin-top:14px!important}
        .coomer-prog-fill{height:100%!important;background:var(--apple-accent)!important;width:0%!important;transition:width 0.2s!important}
        #coomer-prog-stop{color:#ff453a!important;text-decoration:none!important;font-size:13px!important;margin-top:14px!important;display:inline-block!important;cursor:pointer}
        .coomer-prog-detail{font-size:12px;color:var(--text-secondary);margin-top:8px}
        
        /* 空状态 */
        .coomer-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-secondary);font-size:16px}
        .coomer-empty svg{width:80px;height:80px;fill:rgba(255,255,255,0.2);margin-bottom:20px}
        .coomer-empty-btn{margin-top:20px}
        
        /* 统计栏 */
        .coomer-stats{display:flex;gap:20px;font-size:13px;color:var(--text-secondary)}
        
    `);

    // ========== 工具函数 ==========
    const Utils = {
        getSafeFilename: (url) => {
            try {
                const fMatch = url.match(/[?&]f=([^&]+)/);
                if (fMatch) return decodeURIComponent(fMatch[1]);
                return url.split('/').pop().split('?')[0] || 'media';
            } catch { return 'media'; }
        },
        getBaseUrl: (url) => url?.split('?')[0] || url,
        isUserPage: () => {
            const path = window.location.pathname;
            return /^\/(onlyfans|fansly|patreon|fanbox|fantia|gumroad|subscribestar|dlsite|boosty|discord|afdian)\/user\/[^\/]+\/?$/.test(path);
        },
        isPostPage: () => {
            return /\/(onlyfans|fansly|patreon|fanbox|fantia|gumroad|subscribestar|dlsite|boosty|discord|afdian)\/user\/[^\/]+\/post\//.test(window.location.pathname);
        },
        getCurrentOffset: () => {
            const match = window.location.search.match(/[?&]o=(\d+)/);
            return match ? parseInt(match[1]) : 0;
        }
    };

    // ========== 批量抓取核心 (API 稳定版) ==========
    const Scraper = {
        // 带重试的JSON请求
        async fetchJsonWithRetry(url, retries = CONFIG.RETRY_COUNT) {
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    const text = await this.gmFetch(url);
                    if (text) {
                        return JSON.parse(text);
                    }
                } catch (e) {
                    console.log(`[Coomer] API请求失败 ${attempt}/${retries}: ${e.message}`);
                }

                if (attempt < retries) {
                    const delay = CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
                    await new Promise(r => setTimeout(r, delay));
                }
            }
            return null;
        },

        // GM_xmlhttpRequest Promise 包装 (模拟浏览器请求)
        gmFetch(url) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    timeout: CONFIG.REQUEST_TIMEOUT,
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Referer': window.location.origin + '/',
                        'Origin': window.location.origin,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    anonymous: false, // 发送cookie
                    onload: (response) => {
                        if (response.status === 200) {
                            resolve(response.responseText);
                        } else {
                            reject(new Error(`HTTP ${response.status}`));
                        }
                    },
                    onerror: (e) => reject(new Error('Network error')),
                    ontimeout: () => reject(new Error('Timeout'))
                });
            });
        },

        // 解析当前URL获取service和user
        parseUserUrl() {
            const match = window.location.pathname.match(/^\/(onlyfans|fansly|patreon|fanbox|fantia|gumroad|subscribestar|dlsite|boosty|discord|afdian)\/user\/([^\/]+)/);
            if (match) {
                return { service: match[1], userId: match[2] };
            }
            return null;
        },

        // 解析帖子URL
        parsePostUrl(url) {
            const match = url.match(/\/(onlyfans|fansly|patreon|fanbox|fantia|gumroad|subscribestar|dlsite|boosty|discord|afdian)\/user\/([^\/]+)\/post\/([^\/\?]+)/);
            if (match) {
                return { service: match[1], userId: match[2], postId: match[3] };
            }
            return null;
        },

        // 从API获取用户所有帖子列表
        async fetchAllPostsFromApi(service, userId) {
            const baseHost = window.location.origin;
            const allPosts = [];
            let offset = 0;
            const limit = 50; // API 每页限制

            while (true) {
                const apiUrl = `${baseHost}/api/v1/${service}/user/${userId}?o=${offset}`;
                console.log(`[Coomer] 获取帖子列表: offset=${offset}`);

                const posts = await this.fetchJsonWithRetry(apiUrl);

                if (!posts || !Array.isArray(posts) || posts.length === 0) {
                    break;
                }

                allPosts.push(...posts);

                if (posts.length < limit) {
                    break; // 没有更多了
                }

                offset += limit;
                await new Promise(r => setTimeout(r, CONFIG.REQUEST_GAP));
            }

            console.log(`[Coomer] API获取到 ${allPosts.length} 个帖子`);
            return allPosts;
        },

        // 从API帖子数据中提取媒体
        extractMediaFromApiPost(post, postIndex, service, userId) {
            const results = [];
            const baseHost = window.location.origin;
            const postUrl = `${baseHost}/${service}/user/${userId}/post/${post.id}`;
            const seen = new Set();

            // 处理 attachments (通常是图片和视频)
            if (post.attachments && Array.isArray(post.attachments)) {
                post.attachments.forEach(att => {
                    const src = att.path ? `${baseHost}/data${att.path}` : att.server ? `https://${att.server}/data${att.path}` : null;
                    if (!src) return;

                    const baseUrl = Utils.getBaseUrl(src);
                    if (seen.has(baseUrl)) return;
                    seen.add(baseUrl);

                    const name = att.name || '';
                    const isVideo = /\.(mp4|m4v|webm|mov|avi|mkv)/i.test(name) || /\.(mp4|m4v|webm|mov|avi|mkv)/i.test(src);

                    results.push({
                        type: isVideo ? 'video' : 'image',
                        src: src,
                        thumb: src,
                        name: name,
                        postUrl: postUrl,
                        postIndex: postIndex,
                        page: Math.floor(postIndex / 25) + 1,
                        format: isVideo ? (name.match(/\.(mp4|m4v|webm|mov)/i)?.[1] || 'mp4') : (name.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg'),
                        duration: null
                    });
                });
            }

            // 处理 file (通常是视频)
            if (post.file && post.file.path) {
                const src = `${baseHost}/data${post.file.path}`;
                const baseUrl = Utils.getBaseUrl(src);

                if (!seen.has(baseUrl)) {
                    seen.add(baseUrl);
                    const name = post.file.name || '';
                    const isVideo = /\.(mp4|m4v|webm|mov|avi|mkv)/i.test(name) || /\.(mp4|m4v|webm|mov|avi|mkv)/i.test(src);

                    results.push({
                        type: isVideo ? 'video' : 'image',
                        src: src,
                        thumb: src,
                        name: name,
                        postUrl: postUrl,
                        postIndex: postIndex,
                        page: Math.floor(postIndex / 25) + 1,
                        format: isVideo ? 'mp4' : 'jpg',
                        duration: null
                    });
                }
            }

            return results;
        },

        // 从用户列表页收集帖子链接
        collectPostLinksFromPage() {
            const results = [];
            const seen = new Set();

            document.querySelectorAll('article a[href*="/post/"], [class*="post-card"] a[href*="/post/"], .card-list__items a[href*="/post/"]').forEach(el => {
                const url = el.href;
                if (!url || seen.has(url)) return;
                seen.add(url);
                results.push(url);
            });

            return results;
        },

        // 获取下一页按钮 (用户列表页)
        getNextPageButton() {
            const selectors = [
                'a.next',
                'a[title="Next page"]',
                '.paginator a:last-child',
                'a[href*="?o="]:not([href*="o=0"])',
                'a.paginator__link--next'
            ];

            for (const sel of selectors) {
                const btns = document.querySelectorAll(sel);
                for (const btn of btns) {
                    const href = btn.href || '';
                    const currentOffset = Utils.getCurrentOffset();
                    const btnOffsetMatch = href.match(/[?&]o=(\d+)/);
                    const btnOffset = btnOffsetMatch ? parseInt(btnOffsetMatch[1]) : -1;
                    if (btnOffset > currentOffset) return btn;

                    const text = btn.textContent?.trim().toLowerCase();
                    if (text === 'next' || text === '>' || text === '»') return btn;
                }
            }
            return null;
        },

        // 等待页面加载
        waitForPageLoad(timeout = 3000) {
            return new Promise(resolve => {
                const startTime = Date.now();
                let lastCount = document.querySelectorAll('article, [class*="post-card"]').length;
                let stableCount = 0;

                const check = () => {
                    const currentCount = document.querySelectorAll('article, [class*="post-card"]').length;
                    if (currentCount === lastCount && currentCount > 0) {
                        stableCount++;
                        if (stableCount >= 2) { resolve(true); return; }
                    } else {
                        stableCount = 0;
                        lastCount = currentCount;
                    }
                    if (Date.now() - startTime > timeout) { resolve(false); return; }
                    setTimeout(check, 150);
                };
                setTimeout(check, 200);
            });
        },

        // 主抓取循环 - API版
        async startBatchScrape() {
            const isUser = Utils.isUserPage();
            const isPost = Utils.isPostPage();

            if (!isUser && !isPost) {
                alert('请在用户列表页或帖子详情页使用！');
                return;
            }

            const prog = document.getElementById('coomer-progress');
            const fill = document.getElementById('coomer-prog-fill');
            const txt = document.getElementById('coomer-prog-txt');
            const detail = document.getElementById('coomer-prog-detail');

            prog.style.display = 'block';
            STATE.stopScraping = false;
            STATE.allMedia = [];

            let posts = [];
            let userInfo = null;

            if (isUser) {
                userInfo = this.parseUserUrl();
            } else if (isPost) {
                const postInfo = this.parsePostUrl(window.location.href);
                if (postInfo) {
                    userInfo = { service: postInfo.service, userId: postInfo.userId };
                }
            }

            if (!userInfo) {
                txt.textContent = '❌ 无法解析用户信息';
                setTimeout(() => prog.style.display = 'none', 2000);
                return;
            }

            // ========== 阶段1: 通过API获取所有帖子 ==========
            txt.textContent = '阶段1: 通过API获取帖子列表...';
            fill.style.width = '0%';
            detail.textContent = `用户: ${userInfo.userId} (${userInfo.service})`;

            posts = await this.fetchAllPostsFromApi(userInfo.service, userInfo.userId);

            if (STATE.stopScraping || posts.length === 0) {
                txt.textContent = '❌ 获取帖子失败或没有帖子';
                setTimeout(() => prog.style.display = 'none', 2000);
                return;
            }

            console.log(`[Coomer] 阶段1完成，共 ${posts.length} 个帖子`);

            // ========== 阶段2: 从API数据直接提取媒体 ==========
            txt.textContent = `阶段2: 解析 ${posts.length} 个帖子的媒体...`;
            fill.style.width = '50%';
            detail.textContent = '直接从API数据提取,无需加载页面';

            const allMedia = [];
            const seenMedia = new Set();

            posts.forEach((post, idx) => {
                if (STATE.stopScraping) return;

                const media = this.extractMediaFromApiPost(post, idx, userInfo.service, userInfo.userId);

                media.forEach(m => {
                    const key = Utils.getBaseUrl(m.src);
                    if (!seenMedia.has(key)) {
                        seenMedia.add(key);
                        allMedia.push(m);
                    }
                });
            });

            // 按 postIndex 排序
            allMedia.sort((a, b) => a.postIndex - b.postIndex);
            STATE.allMedia = allMedia;

            const imgCount = allMedia.filter(m => m.type === 'image').length;
            const vidCount = allMedia.filter(m => m.type === 'video').length;

            txt.textContent = `完成！${imgCount} 张图片, ${vidCount} 个视频`;
            detail.textContent = `共处理 ${posts.length} 个帖子`;
            fill.style.width = '100%';

            console.log(`[Coomer] 抓取完成: ${imgCount} 图片, ${vidCount} 视频`);

            setTimeout(() => {
                prog.style.display = 'none';
                UI.updateStats();
                UI.renderGrid();
                document.getElementById('coomer-modal').classList.add('show');
            }, 1500);
        },

        // 直接调用 Downie4 下载选中的视频
        sendToDownie() {
            const selectedVideos = Array.from(STATE.selectedItems)
                .map(i => STATE.allMedia[i])
                .filter(m => m && m.type === 'video');

            if (selectedVideos.length === 0) {
                alert('请先选择要下载的视频！');
                return;
            }

            // Downie4 支持 URL scheme
            // 格式: downie://XcallbackUrl/addDownload?url=编码后的URL
            // 或者批量: downie://XcallbackUrl/addDownloads?urls=url1,url2,url3

            if (selectedVideos.length === 1) {
                // 单个视频
                const url = encodeURIComponent(selectedVideos[0].src);
                window.location.href = `downie://XcallbackUrl/addDownload?url=${url}`;
            } else {
                // 多个视频 - 逐个发送
                let count = 0;
                const sendNext = () => {
                    if (count >= selectedVideos.length) {
                        alert(`已发送 ${selectedVideos.length} 个视频到 Downie4！`);
                        return;
                    }
                    const url = encodeURIComponent(selectedVideos[count].src);
                    window.location.href = `downie://XcallbackUrl/addDownload?url=${url}`;
                    count++;
                    setTimeout(sendNext, 500); // 间隔 0.5 秒发下一个
                };

                if (confirm(`即将发送 ${selectedVideos.length} 个视频到 Downie4，确定？`)) {
                    sendNext();
                }
            }
        },

        // 复制选中的视频链接到剪贴板（备用）
        copyVideosForDownie() {
            const selectedVideos = Array.from(STATE.selectedItems)
                .map(i => STATE.allMedia[i])
                .filter(m => m && m.type === 'video');

            if (selectedVideos.length === 0) {
                alert('请先选择要下载的视频！');
                return;
            }
            const urls = selectedVideos.map(v => v.src).join('\n');
            GM_setClipboard(urls);
            alert(`已复制 ${selectedVideos.length} 个视频链接到剪贴板！\n\n打开 Downie4，粘贴即可批量下载。`);
        },

        async downloadSelected() {
            const targets = Array.from(STATE.selectedItems).map(i => STATE.allMedia[i]).filter(Boolean);
            if (targets.length === 0) return alert('未选择任何项目！');

            const prog = document.getElementById('coomer-progress');
            const fill = document.getElementById('coomer-prog-fill');
            const txt = document.getElementById('coomer-prog-txt');

            prog.style.display = 'block';
            STATE.stopScraping = false;

            for (let i = 0; i < targets.length; i++) {
                if (STATE.stopScraping) break;

                fill.style.width = `${(i / targets.length) * 100}%`;
                txt.textContent = `下载中 ${i + 1} / ${targets.length}`;

                try {
                    GM_download({
                        url: targets[i].src,
                        name: Utils.getSafeFilename(targets[i].src),
                        onerror: () => window.open(targets[i].src, '_blank')
                    });
                    await new Promise(r => setTimeout(r, 200));
                } catch (e) {
                    console.error('[Coomer] Download error:', e);
                }
            }

            prog.style.display = 'none';
        }
    };

    // ========== UI ==========
    const UI = {
        init() {
            if (document.getElementById('coomer-btn-container')) return;

            const html = `
                <div id="coomer-btn-container">
                    <div class="coomer-float-btn" id="coomer-main-btn" title="媒体库">
                        <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3.72L9 13l-3 4h12l-4-5z"/></svg>
                    </div>
                </div>
                <div id="coomer-modal">
                    <div class="coomer-header">
                        <h2>📦 媒体库</h2>
                        <div class="coomer-tab-group">
                            <button class="coomer-tab-btn active" data-tab="image">🖼️ 图片</button>
                            <button class="coomer-tab-btn" data-tab="video">🎬 视频</button>
                        </div>
                        <div class="coomer-stats">
                            <span id="coomer-img-count">📷 0 张图片</span>
                            <span id="coomer-vid-count">🎥 0 个视频</span>
                        </div>
                        <div style="flex:1"></div>
                        <button class="coomer-action-btn" id="coomer-select-all">全选</button>
                        <button class="coomer-action-btn" id="coomer-invert">反选</button>
                        <button class="coomer-action-btn primary" id="coomer-download">下载选中</button>
                        <button class="coomer-action-btn downie" id="coomer-downie">Downie4</button>
                        <span id="coomer-count" style="font-size:13px;color:var(--text-secondary);margin:0 12px">已选: 0</span>
                        <button class="coomer-action-btn" id="coomer-close" style="width:36px;height:36px;border-radius:50%;padding:0;font-size:20px">×</button>
                    </div>
                    <div class="coomer-grid-container">
                        <div class="coomer-media-grid image-grid" id="coomer-grid"></div>
                    </div>
                </div>
                <div id="coomer-progress">
                    <div style="font-size:15px;font-weight:500"><span id="coomer-prog-txt">处理中...</span></div>
                    <div class="coomer-prog-bar"><div class="coomer-prog-fill" id="coomer-prog-fill"></div></div>
                    <div class="coomer-prog-detail" id="coomer-prog-detail"></div>
                    <a id="coomer-prog-stop">停止</a>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', html);
            this.bindEvents();
        },

        bindEvents() {
            document.getElementById('coomer-main-btn').onclick = () => {
                document.getElementById('coomer-modal').classList.add('show');
                if (STATE.allMedia.length === 0) {
                    this.renderEmptyState();
                } else {
                    this.renderGrid();
                }
            };

            document.getElementById('coomer-prog-stop').onclick = () => {
                STATE.stopScraping = true;
            };

            document.getElementById('coomer-close').onclick = () => {
                document.getElementById('coomer-modal').classList.remove('show');
            };

            document.querySelectorAll('.coomer-tab-btn').forEach(btn => {
                btn.onclick = () => {
                    document.querySelectorAll('.coomer-tab-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    STATE.currentTab = btn.dataset.tab;
                    this.renderGrid();
                };
            });

            document.getElementById('coomer-select-all').onclick = () => {
                const filtered = this.getFilteredItems();
                STATE.selectedItems = new Set(filtered.map((_, i) => STATE.allMedia.indexOf(filtered[i])));
                this.renderGrid();
            };

            document.getElementById('coomer-invert').onclick = () => {
                const filtered = this.getFilteredItems();
                const newSet = new Set();
                filtered.forEach((item) => {
                    const realIdx = STATE.allMedia.indexOf(item);
                    if (!STATE.selectedItems.has(realIdx)) newSet.add(realIdx);
                });
                STATE.selectedItems = newSet;
                this.renderGrid();
            };

            document.getElementById('coomer-download').onclick = () => Scraper.downloadSelected();
            document.getElementById('coomer-downie').onclick = () => Scraper.sendToDownie();
        },

        renderEmptyState() {
            const grid = document.getElementById('coomer-grid');
            grid.className = 'coomer-media-grid image-grid';

            const canScrape = Utils.isUserPage() || Utils.isPostPage();
            grid.innerHTML = `
                <div class="coomer-empty" style="grid-column: 1 / -1">
                    <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3.72L9 13l-3 4h12l-4-5z"/></svg>
                    <p>还没有收集任何媒体</p>
                    ${canScrape ?
                    `<button class="coomer-action-btn primary coomer-empty-btn" id="coomer-start-scrape">🚀 开始抓取 (${CONFIG.CONCURRENCY}x并发)</button>
                         <p style="font-size:12px;margin-top:12px;color:var(--text-secondary)">推荐在用户列表页使用，速度更快</p>` :
                    '<p style="font-size:13px;margin-top:8px">请在用户列表页或帖子详情页使用</p>'
                }
                </div>
            `;

            if (canScrape) {
                document.getElementById('coomer-start-scrape').onclick = () => {
                    document.getElementById('coomer-modal').classList.remove('show');
                    Scraper.startBatchScrape();
                };
            }
        },

        updateStats() {
            const imgCount = STATE.allMedia.filter(m => m.type === 'image').length;
            const vidCount = STATE.allMedia.filter(m => m.type === 'video').length;
            document.getElementById('coomer-img-count').textContent = `📷 ${imgCount} 张图片`;
            document.getElementById('coomer-vid-count').textContent = `🎥 ${vidCount} 个视频`;
        },

        getFilteredItems() {
            return STATE.allMedia.filter(m => m.type === STATE.currentTab);
        },

        renderGrid() {
            const grid = document.getElementById('coomer-grid');
            const items = this.getFilteredItems();

            if (items.length === 0) {
                this.renderEmptyState();
                return;
            }

            grid.className = STATE.currentTab === 'video' ? 'coomer-media-grid video-grid' : 'coomer-media-grid image-grid';

            grid.innerHTML = items.map((item) => {
                const realIdx = STATE.allMedia.indexOf(item);
                const isSelected = STATE.selectedItems.has(realIdx);
                const thumb = item.thumb || item.src || '';
                const isVideo = item.type === 'video';

                // 如果是视频，尝试获取时长
                let durationHtml = '';
                if (isVideo && item.duration) {
                    const mins = Math.floor(item.duration / 60);
                    const secs = Math.floor(item.duration % 60);
                    durationHtml = `<div class="duration">${mins}:${String(secs).padStart(2, '0')}</div>`;
                }

                return `
                    <div class="coomer-m-card ${isSelected ? 'selected' : ''}" data-idx="${realIdx}">
                        ${thumb ? `<img src="${thumb}" loading="lazy" ${isVideo ? `data-video-src="${item.src}"` : ''}>` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#222;color:#555;font-size:32px">📎</div>'}
                        ${isVideo ? '<div class="play-icon"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>' : ''}
                        <div class="badge">P${item.page}</div>
                        <div class="type-badge">${item.format}</div>
                        ${durationHtml}
                        <div class="check-mark"></div>
                    </div>
                `;
            }).join('');

            // 点击选择
            grid.querySelectorAll('.coomer-m-card').forEach(card => {
                card.onclick = () => {
                    const idx = parseInt(card.dataset.idx);
                    if (STATE.selectedItems.has(idx)) {
                        STATE.selectedItems.delete(idx);
                        card.classList.remove('selected');
                    } else {
                        STATE.selectedItems.add(idx);
                        card.classList.add('selected');
                    }
                    document.getElementById('coomer-count').textContent = `已选: ${STATE.selectedItems.size}`;
                };

                // 如果是视频，尝试加载时长
                const img = card.querySelector('img[data-video-src]');
                if (img) {
                    const videoSrc = img.getAttribute('data-video-src');
                    const idx = parseInt(card.dataset.idx);
                    const item = STATE.allMedia[idx];

                    if (item && !item.duration) {
                        const video = document.createElement('video');
                        video.preload = 'metadata';
                        video.onloadedmetadata = () => {
                            if (video.duration && isFinite(video.duration)) {
                                item.duration = video.duration;
                                const mins = Math.floor(video.duration / 60);
                                const secs = Math.floor(video.duration % 60);
                                const durationEl = document.createElement('div');
                                durationEl.className = 'duration';
                                durationEl.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
                                card.appendChild(durationEl);
                            }
                            video.src = '';
                        };
                        video.onerror = () => { video.src = ''; };
                        video.src = videoSrc;
                    }
                }
            });

            document.getElementById('coomer-count').textContent = `已选: ${STATE.selectedItems.size}`;
            this.updateStats();
        }
    };

    // ========== 原有功能保留 ==========
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
        if (nextSibling && nextSibling.classList.contains('cvp-wrapper')) nextSibling.remove();
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

    function findParentLink(el) {
        let p = el.parentElement;
        for (let i = 0; i < 10 && p; i++) {
            if (p.tagName === 'A' && p.href) {
                const h = p.href;
                if ((h.includes('.coomer.') || h.includes('.kemono.')) && h.includes('/data/') && /\.(jpg|jpeg|png|gif|webp)/i.test(h)) return h;
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
            const originalUrl = findParentLink(img);
            if (!originalUrl) return;
            img.dataset.dlAdded = '1';
            let filename = 'image.jpg';
            const fMatch = originalUrl.match(/[?&]f=([^&]+)/);
            if (fMatch) filename = decodeURIComponent(fMatch[1]);
            else filename = originalUrl.split('/').pop().split('?')[0];
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
                GM_download({ url: originalUrl, name: filename, onerror: () => window.open(originalUrl, '_blank') });
            };
            wrapper.appendChild(btn);
        });
    }

    function processAllVideos() { document.querySelectorAll('video:not(.cvp-inline-video)').forEach(processVideo) }

    function init() {
        setTimeout(() => {
            processAllVideos();
            addDownloadButtons();
            UI.init();
            new MutationObserver(() => {
                processAllVideos();
                addDownloadButtons();
            }).observe(document.body, { childList: true, subtree: true });
        }, 1000);
    }

    init();
    console.log('Coomer v9.0 已加载 - 并发抓取加速版');
})();
