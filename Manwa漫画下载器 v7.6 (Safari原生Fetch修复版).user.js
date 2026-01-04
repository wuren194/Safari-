// ==UserScript==
// @name         Manwa漫画下载器 v7.6 (Safari原生Fetch修复版)
// @namespace    https://github.com/coofo/someScript
// @version      7.6
// @license      AGPL License
// @description  修复“未找到图片”错误：改用原生Fetch获取章节HTML，完美继承浏览器Cookie；保留正则暴力提取兜底；UI保持macOS 26风格。
// @author       You
// @match        *://manwa.me/book/*
// @match        *://manwa.live/book/*
// @match        *://manwa.vip/book/*
// @match        *://manwa.fun/book/*
// @match        *://*.manwa.me/book/*
// @match        *://*.manwa.live/book/*
// @match        *://*.manwa.vip/book/*
// @match        *://*.manwa.fun/book/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
// @connect      *
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/wuren194/Safari-/main/Manwa%E6%BC%AB%E7%94%BB%E4%B8%8B%E8%BD%BD%E5%99%A8%20v7.6%20%28Safari%E5%8E%9F%E7%94%9FFetch%E4%BF%AE%E5%A4%8D%E7%89%88%29.user.js
// @downloadURL  https://raw.githubusercontent.com/wuren194/Safari-/main/Manwa%E6%BC%AB%E7%94%BB%E4%B8%8B%E8%BD%BD%E5%99%A8%20v7.6%20%28Safari%E5%8E%9F%E7%94%9FFetch%E4%BF%AE%E5%A4%8D%E7%89%88%29.user.js
// @supportURL   https://github.com/wuren194/Safari-/issues
// ==/UserScript==

(function () {
    'use strict';

    // ==========================================
    // 1. 配置常量
    // ==========================================
    const CONFIG = {
        concurrency: 4,        // Safari建议并发稍低一点
        maxRetries: 3,
        timeout: 15000,
        aesKey: "my2ecret782ecret"
    };

    // ==========================================
    // 2. 样式系统 (macOS 26 Liquid Glass)
    // ==========================================
    const injectStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            :root {
                --glass-bg: rgba(30, 30, 30, 0.60);
                --glass-blur: blur(40px) saturate(180%);
                --glass-border: rgba(255, 255, 255, 0.15);
                --glass-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
                --accent-color: #0a84ff;
                --text-primary: #ffffff;
                --text-secondary: rgba(255, 255, 255, 0.6);
                --font-stack: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
            }
            .ytk-panel {
                position: fixed; top: 15%; right: 24px; width: 320px;
                background: var(--glass-bg);
                backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);
                border: 1px solid var(--glass-border);
                box-shadow: var(--glass-shadow);
                border-radius: 20px; overflow: hidden;
                font-family: var(--font-stack); z-index: 999999;
                color: #fff; transition: opacity 0.3s, transform 0.3s;
                user-select: none;
            }
            .ytk-panel.hidden { opacity: 0; pointer-events: none; transform: translateX(20px); }
            .ytk-header {
                padding: 16px 20px; border-bottom: 1px solid var(--glass-border);
                display: flex; justify-content: space-between; align-items: center;
                background: rgba(255,255,255,0.05); cursor: move;
            }
            .ytk-header h3 { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; }
            .ytk-close { background:none; border:none; color:rgba(255,255,255,0.6); font-size:20px; cursor:pointer; padding:0; line-height:1; }
            .ytk-close:hover { color: #fff; }
            .ytk-body { padding: 20px; }
            .ytk-btn {
                width: 100%; padding: 12px; border-radius: 12px; border: none;
                background: var(--accent-color); color: #fff; font-weight: 600; font-size: 14px;
                cursor: pointer; margin-top: 15px; 
                box-shadow: 0 4px 12px rgba(10,132,255,0.3);
                transition: transform 0.1s, background 0.2s;
            }
            .ytk-btn:disabled { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.3); cursor: not-allowed; box-shadow: none; }
            .ytk-btn:hover:not(:disabled) { background: #0071e3; transform: scale(1.02); }
            .prog-row { margin-top: 15px; font-size: 12px; color: var(--text-secondary); }
            .prog-bar-bg { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-top: 8px; overflow: hidden; }
            .prog-bar-fill { height: 100%; background: var(--accent-color); width: 0%; transition: width 0.2s; }
            .info-item { margin-bottom: 10px; font-size: 13px; display: flex; justify-content: space-between; align-items: center; }
            .info-val { color: var(--text-primary); font-weight: 500; max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .ytk-ball {
                position: fixed; right: 24px; bottom: 100px; width: 50px; height: 50px;
                background: rgba(30,30,30,0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.2); border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                cursor: pointer; z-index: 999999; box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                transition: transform 0.2s;
            }
            .ytk-ball:hover { transform: scale(1.1); background: rgba(50,50,50,0.8); }
            .ytk-ball.hidden { display: none !important; }
        `;
        document.head.appendChild(style);
    };

    // ==========================================
    // 3. 核心工具
    // ==========================================
    class TaskQueue {
        constructor(concurrency) {
            this.concurrency = concurrency;
            this.running = 0;
            this.queue = [];
        }
        add(task) {
            return new Promise((resolve, reject) => {
                this.queue.push({ task, resolve, reject });
                this.next();
            });
        }
        next() {
            if (this.running >= this.concurrency || this.queue.length === 0) return;
            const { task, resolve, reject } = this.queue.shift();
            this.running++;
            task().then(resolve).catch(reject).finally(() => {
                this.running--;
                this.next();
            });
        }
    }

    // 核心修改：使用原生 fetch 获取同源 HTML，稳定性极高
    const fetchHTML = async (url) => {
        try {
            const response = await fetch(url, {
                method: 'GET',
                // 不设置 mode: 'no-cors'，因为同源需要读取 body
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        } catch (e) {
            console.error(`Fetch HTML Error for ${url}:`, e);
            throw e;
        }
    };

    // 下载二进制数据仍使用 GM_xhr 以支持跨域
    const fetchBlobWithRetry = (url, retries = CONFIG.maxRetries) => {
        return new Promise((resolve, reject) => {
            const attempt = (n) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    responseType: 'arraybuffer',
                    timeout: CONFIG.timeout,
                    headers: { 'Referer': window.location.href },
                    onload: (r) => {
                        if (r.status === 200) resolve(r.response);
                        else if (n > 0) setTimeout(() => attempt(n - 1), 1000);
                        else reject(new Error(`IMG HTTP ${r.status}`));
                    },
                    onerror: (e) => n > 0 ? setTimeout(() => attempt(n - 1), 1000) : reject(new Error(`Network Error: ${JSON.stringify(e)}`)),
                    ontimeout: () => n > 0 ? setTimeout(() => attempt(n - 1), 1000) : reject(new Error('Timeout'))
                });
            };
            attempt(retries);
        });
    };

    const decryptData = (arrayBuffer) => {
        try {
            const key = CryptoJS.enc.Utf8.parse(CONFIG.aesKey);
            const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
            const decrypted = CryptoJS.AES.decrypt({ ciphertext: wordArray }, key, { iv: key, padding: CryptoJS.pad.Pkcs7 });
            const words = decrypted.words;
            const sigBytes = decrypted.sigBytes;
            const u8 = new Uint8Array(sigBytes);
            for (let i = 0; i < sigBytes; i++) {
                u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
            }
            return u8;
        } catch (e) {
            return new Uint8Array(arrayBuffer);
        }
    };

    const downloadBlob = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    };

    const sanitize = (name) => name.replace(/[\\/:*?"<>|]/g, '_').trim();

    // ==========================================
    // 4. 业务逻辑
    // ==========================================
    let panel, ball;
    let bookTitle = "Unknown";
    let chapters = [];
    const queue = new TaskQueue(CONFIG.concurrency);
    let isDownloading = false;

    const parsePage = () => {
        const h1 = document.querySelector("h1.detail-main-info-title") || document.querySelector("h1");
        if (h1) bookTitle = sanitize(h1.innerText);
        const titleEl = document.getElementById('ytk-ui-title');
        if(titleEl) titleEl.innerText = bookTitle;

        chapters = [];
        const seenIds = new Set();
        
        // 扩展选择器
        const selectors = [
            "ul#adult-list-select li", 
            "ul#detail-list-select li",
            "ul.chapter-list li",
            "li[idx]"
        ];

        selectors.forEach(sel => {
            const nodes = document.querySelectorAll(sel);
            nodes.forEach(li => {
                const a = li.querySelector('a.chapteritem') || li.querySelector('a');
                if (a) {
                    const href = a.getAttribute('href');
                    const idMatch = href ? href.match(/(\d+)$/) : null;
                    if (idMatch) {
                        const id = idMatch[1];
                        if (!seenIds.has(id)) {
                            seenIds.add(id);
                            const name = sanitize(a.getAttribute("title") || a.innerText);
                            const idxAttr = li.getAttribute("idx");
                            const idx = idxAttr ? (parseInt(idxAttr) + 1) : (chapters.length + 1);
                            
                            chapters.push({
                                id: id,
                                name: name,
                                idx: idx,
                                folderName: `第${String(idx).padStart(3, '0')}章 ${name}`
                            });
                        }
                    }
                }
            });
        });

        chapters.sort((a, b) => a.idx - b.idx);
        
        const countEl = document.getElementById('ytk-ui-count');
        const btn = document.getElementById('ytk-btn-dl');
        
        if (countEl) countEl.innerText = `${chapters.length} 话`;
        if (btn) {
            if (chapters.length > 0) {
                btn.removeAttribute('disabled');
                btn.innerText = `下载全部 (${chapters.length}话)`;
                btn.style.background = "#0a84ff";
            } else {
                btn.setAttribute('disabled', 'true');
                btn.innerText = "未找到章节 (点击刷新)";
                btn.onclick = () => { parsePage(); };
            }
        }
    };

    // 核心修复函数：获取图片链接 (正则增强)
    const getChapterImages = async (chapterId) => {
        try {
            // 使用原生 fetch 获取 HTML，解决 Safari 下 GM_xmlhttpRequest 的 Cookie/Referer 问题
            const html = await fetchHTML(`/chapter/${chapterId}`);
            const doc = new DOMParser().parseFromString(html, "text/html");
            let urls = [];

            // 1. 标准 DOM 查找
            const imgs = doc.querySelectorAll("img.content-img, img.lazy");
            imgs.forEach(img => {
                // 尝试所有可能的属性
                const src = img.getAttribute("data-r-src") || img.getAttribute("data-src") || img.getAttribute("src");
                if (src && !src.includes("loading") && !src.includes("favicon")) urls.push(src);
            });

            // 2. 脚本变量提取 (常见于加密或动态加载)
            if (urls.length === 0) {
                // 查找包含 jpg/png 的 script 标签内容
                const scripts = doc.querySelectorAll('script');
                scripts.forEach(s => {
                    const text = s.textContent;
                    if (text.includes('.jpg') || text.includes('.png')) {
                        const matches = text.match(/https?:\\?\/\\?\/[^"';\s]+\.(jpg|png|webp|jpeg)/gi);
                        if (matches) urls.push(...matches.map(u => u.replace(/\\/g, ''))); // 去除转义
                    }
                });
            }

            // 3. 纯文本暴力正则提取 (兜底)
            if (urls.length === 0) {
                console.log(`DOM/Script提取失败，启用暴力正则... 章节ID: ${chapterId}`);
                // 匹配所有 http 开头，图片后缀结尾的字符串
                const regexRaw = /https?:\/\/[^"'\s<>]+\.(jpg|jpeg|png|webp)/gi;
                let match;
                while ((match = regexRaw.exec(html)) !== null) {
                    if (!match[0].includes('logo') && !match[0].includes('icon')) {
                        urls.push(match[0]);
                    }
                }
            }

            return [...new Set(urls)]; // 去重
        } catch (e) {
            console.error(`解析章节 ${chapterId} 失败:`, e);
            throw e; // 抛出错误以便上层捕获
        }
    };

    const startDownload = async () => {
        if (isDownloading) return;
        isDownloading = true;
        
        const btn = document.getElementById('ytk-btn-dl');
        btn.setAttribute('disabled', 'true');
        btn.innerText = "正在初始化...";
        
        const zip = new JSZip();
        let totalImages = 0;
        let processedImages = 0;
        
        const updateProg = (msg, pct) => {
            const bar = document.getElementById('ytk-prog-fill');
            const txt = document.getElementById('ytk-prog-text');
            const status = document.getElementById('ytk-prog-status');
            if(bar) bar.style.width = `${pct}%`;
            if(txt) txt.innerText = `${pct.toFixed(0)}%`;
            if(status) status.innerText = msg;
        };

        try {
            // 1. 解析
            updateProg("正在解析章节...", 5);
            const chapterData = [];
            
            let parsedCount = 0;
            // 串行解析以防 429 Too Many Requests
            for (const chap of chapters) {
                try {
                    const urls = await getChapterImages(chap.id);
                    if (urls.length > 0) {
                        chapterData.push({ ...chap, urls });
                        totalImages += urls.length;
                    } else {
                        console.warn(`章节 [${chap.name}] 未找到图片`);
                    }
                } catch (e) {
                    console.error(`章节 [${chap.name}] 解析出错`, e);
                }
                parsedCount++;
                updateProg(`解析章节: ${parsedCount}/${chapters.length}`, 5 + Math.round((parsedCount/chapters.length)*15));
                // 稍微延时
                await new Promise(r => setTimeout(r, 200));
            }

            if (chapterData.length === 0) throw new Error("解析失败：未能获取任何图片链接，请检查登录状态");

            // 2. 下载
            updateProg(`准备下载 ${totalImages} 张图片...`, 20);
            
            for (const chap of chapterData) {
                let imgIdx = 1;
                for (const url of chap.urls) {
                    await queue.add(async () => {
                        try {
                            const buffer = await fetchBlobWithRetry(url);
                            let data = buffer;
                            try { data = decryptData(buffer); } catch (e) {} // 尝试解密
                            
                            let ext = url.split('?')[0].split('.').pop() || 'jpg';
                            if (ext.length > 4) ext = 'jpg';
                            
                            const filename = `${chap.folderName}/${String(imgIdx).padStart(3, '0')}.${ext}`;
                            zip.file(filename, data);
                        } catch (e) {
                            console.error(`Download failed: ${url}`, e);
                            zip.file(`${chap.folderName}/ERROR_${imgIdx}.txt`, "Failed: " + e.message);
                        }
                        imgIdx++;
                        processedImages++;
                        const progress = 20 + Math.round((processedImages / totalImages) * 75);
                        updateProg(`下载中: ${processedImages}/${totalImages}`, progress);
                    });
                }
            }

            // 3. 打包
            updateProg("正在打包 ZIP...", 95);
            const blob = await zip.generateAsync({ type: "blob" }, (meta) => {
                updateProg(`打包中 ${meta.percent.toFixed(0)}%`, 95 + (meta.percent * 0.05));
            });

            // 4. 保存
            const filename = `${bookTitle}.zip`;
            downloadBlob(blob, filename);
            
            updateProg("下载完成!", 100);
            btn.innerText = "下载完成";
            btn.removeAttribute('disabled');
            btn.style.background = "#30d158";
            isDownloading = false;

        } catch (err) {
            console.error(err);
            updateProg(`错误: ${err.message}`, 0);
            btn.innerText = "重试";
            btn.removeAttribute('disabled');
            btn.style.background = "#ff453a";
            isDownloading = false;
        }
    };

    // ==========================================
    // 5. UI 构建
    // ==========================================
    const createUI = () => {
        injectStyles();

        ball = document.createElement('div');
        ball.className = 'ytk-ball hidden';
        ball.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
        ball.onclick = () => {
            panel.classList.remove('hidden');
            ball.classList.add('hidden');
        };
        makeDraggable(ball);
        document.body.appendChild(ball);

        panel = document.createElement('div');
        panel.className = 'ytk-panel';
        panel.innerHTML = `
            <div class="ytk-header">
                <h3>Manwa Vision</h3>
                <button class="ytk-close">×</button>
            </div>
            <div class="ytk-body">
                <div class="info-item">
                    <span style="color:rgba(255,255,255,0.6)">漫画标题</span>
                    <span class="info-val" id="ytk-ui-title">检测中...</span>
                </div>
                <div class="info-item">
                    <span style="color:rgba(255,255,255,0.6)">章节数量</span>
                    <span class="info-val" id="ytk-ui-count">0 话</span>
                </div>
                
                <button id="ytk-btn-dl" class="ytk-btn" disabled>正在初始化...</button>
                
                <div class="prog-row">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                        <span id="ytk-prog-status">准备就绪</span>
                        <span id="ytk-prog-text">0%</span>
                    </div>
                    <div class="prog-bar-bg">
                        <div class="prog-bar-fill" id="ytk-prog-fill"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        panel.querySelector('.ytk-close').onclick = () => {
            panel.classList.add('hidden');
            ball.classList.remove('hidden');
        };
        
        const btnDl = document.getElementById('ytk-btn-dl');
        if (btnDl) {
            btnDl.onclick = () => {
                if (btnDl.innerText.includes("刷新")) parsePage();
                else startDownload();
            };
        }

        makeDraggable(panel);
    };

    const makeDraggable = (el) => {
        let isDragging = false, startX, startY, initLeft, initTop;
        const header = el.querySelector('.ytk-header') || el;
        
        el.oncontextmenu = e => e.preventDefault();
        header.onmousedown = e => {
            if (e.button !== 2) return;
            e.preventDefault();
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            const rect = el.getBoundingClientRect();
            initLeft = rect.left; initTop = rect.top;
            el.style.transition = 'none';
            el.style.cursor = 'grabbing';
        };
        window.addEventListener('mousemove', e => {
            if (!isDragging) return;
            el.style.left = `${initLeft + (e.clientX - startX)}px`;
            el.style.top = `${initTop + (e.clientY - startY)}px`;
            el.style.right = 'auto';
        });
        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                el.style.transition = '';
                el.style.cursor = 'default';
            }
        });
    };

    setTimeout(() => {
        if (location.href.match(/book\/\d+/)) {
            createUI();
            setTimeout(parsePage, 1000);
        }
    }, 1000);

})();