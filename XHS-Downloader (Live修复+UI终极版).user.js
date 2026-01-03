// ==UserScript==
// @name           XHS-Downloader (Live修复+UI终极版)
// @namespace      xhs_downloader_v4_final_ui_zip
// @homepage       https://github.com/JoeanAmier/XHS-Downloader
// @version        2.3.18-Zip-UI-Fix
// @tag            小红书
// @tag            RedNote
// @description    提取小红书作品/用户链接，下载无水印图文/视频，完美支持评论区高清图片/Live下载 (清晰的ZIP开关)
// @author         JoeanAmier & Assistant
// @match          http*://www.xiaohongshu.com/*
// @match          http*://www.xiaohongshu.com/explore/*
// @icon64         data:image/png;base64,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
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          unsafeWindow
// @grant          GM_setClipboard
// @grant          GM_registerMenuCommand
// @grant          GM_unregisterMenuCommand
// @grant          GM_xmlhttpRequest
// @connect        sns-webpic-qc.xhscdn.com
// @connect        ci.xiaohongshu.com
// @connect        sns-img-hw.xhscdn.com
// @connect        sns-video-bd.xhscdn.com
// @connect        *.xhscdn.com
// @license        GNU General Public License v3.0
// @run-at         document-end
// @require        https://cdnjs.cloudflare.com/ajax/libs/jszip/3.9.1/jszip.min.js
// ==/UserScript==

(function () {
    'use strict';

    // ==========================================================================
    // Part 1: 基础设置与网络拦截
    // ==========================================================================
    const commentMediaMap = new Map();
    function startNetworkSniffer() {
        function injectSniffer() {
            const sendData = (data) => window.dispatchEvent(new CustomEvent('xhs-sniffer-data', { detail: data }));
            const originalFetch = window.fetch;
            window.fetch = async function (...args) {
                const response = await originalFetch.apply(this, args);
                const url = args[0] instanceof Request ? args[0].url : args[0];
                if (typeof url === 'string' && (url.includes('/api/sns/web/v2/comment/page') || url.includes('/api/sns/web/v2/comment/sub/page'))) {
                    try { const clone = response.clone(); clone.json().then(data => sendData(data)).catch(() => { }); } catch (e) { }
                }
                return response;
            };
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.open = function (method, url) { this._xhs_url = url; return originalOpen.apply(this, arguments); };
            XMLHttpRequest.prototype.send = function (body) {
                this.addEventListener('load', function () {
                    if (this._xhs_url && (this._xhs_url.includes('comment/page') || this._xhs_url.includes('comment/sub/page'))) {
                        try { const data = JSON.parse(this.responseText); sendData(data); } catch (e) { }
                    }
                });
                return originalSend.apply(this, arguments);
            };
        }
        const script = document.createElement('script');
        script.textContent = `(${injectSniffer.toString()})();`;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
        window.addEventListener('xhs-sniffer-data', (e) => {
            const res = e.detail;
            if (!res || !res.data) return;
            let comments = [];
            if (Array.isArray(res.data.comments)) comments = res.data.comments;
            else if (Array.isArray(res.data.cursor_comments)) comments = res.data.cursor_comments;
            else if (Array.isArray(res.data)) comments = res.data;
            comments.forEach(processComment);
        });
    }
    function processComment(cmt) {
        if (!cmt) return;
        if (cmt.picture) saveMedia(cmt.id, cmt.user_info, cmt.picture);
        if (cmt.sub_comments && Array.isArray(cmt.sub_comments)) cmt.sub_comments.forEach(sub => { if (sub.picture) saveMedia(sub.id, sub.user_info, sub.picture); });
    }
    function saveMedia(id, userInfo, picture) {
        let mediaUrl = picture.url;
        let type = 'image';
        const liveOrVideoUrl = picture.live_photo_url || picture.video_url;
        if (liveOrVideoUrl) {
            type = 'live';
            try {
                let safeUrl = liveOrVideoUrl.startsWith('http:') ? liveOrVideoUrl.replace('http:', 'https:') : liveOrVideoUrl;
                const urlObj = new URL(safeUrl);
                mediaUrl = `https://sns-video-bd.xhscdn.com${urlObj.pathname}${urlObj.search}`;
            } catch (e) { mediaUrl = liveOrVideoUrl; }
        } else {
            try {
                let baseUrl = picture.url;
                if (picture.info_list && picture.info_list.length > 0) baseUrl = picture.info_list[0].url;
                const match = baseUrl.match(/\/([a-zA-Z0-9]+)(?:!|\?|$)/);
                // [FIX 1] 使用 ci.xiaohongshu.com 并去除参数
                if (match && match[1]) mediaUrl = `https://ci.xiaohongshu.com/${match[1]}`;
                // [FIX 1] fallback 逻辑也去除水印参数
                else mediaUrl = picture.url.split('!')[0];
            } catch (e) { mediaUrl = picture.url; }
        }
        if (mediaUrl && mediaUrl.startsWith('http:')) mediaUrl = mediaUrl.replace('http:', 'https:');
        commentMediaMap.set(id, { id: id, nickname: userInfo ? userInfo.nickname : '匿名', url: mediaUrl, type: type });
    }
    function startDomObserver() {
        const style = document.createElement('style');
        style.textContent = `.xhs-cmt-dl-btn { position: absolute; bottom: 6px; right: 6px; width: 30px; height: 30px; background: rgba(255,255,255,0.9); border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 999; transition: transform 0.2s; opacity: 0.8; } .xhs-cmt-dl-btn:hover { transform: scale(1.1); opacity: 1; background: #fff; } .comment-picture { position: relative !important; overflow: visible !important; }`;
        document.head.appendChild(style);
        const observer = new MutationObserver(() => {
            const comments = document.querySelectorAll('.comment-item');
            comments.forEach(el => {
                if (el.dataset.xhsProcessed) return;
                const domId = el.id;
                if (domId) {
                    const realId = domId.replace('comment-', '');
                    const mediaData = commentMediaMap.get(realId);
                    if (mediaData) {
                        const picContainer = el.querySelector('.comment-picture');
                        if (picContainer) {
                            el.dataset.xhsProcessed = 'true';
                            picContainer.appendChild(createDlBtn(mediaData));
                        }
                    }
                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    function createDlBtn(mediaData) {
        const btn = document.createElement('div');
        btn.className = 'xhs-cmt-dl-btn';
        const color = mediaData.type === 'live' ? '#ff2442' : '#333';
        btn.innerHTML = mediaData.type === 'live' ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="${color}"><path d="M8 5v14l11-7z"/></svg>` : `<svg viewBox="0 0 24 24" width="16" height="16" fill="${color}"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const ext = mediaData.type === 'live' ? '.mp4' : '.png';
            await downloadFile(mediaData.url, `评论_${mediaData.nickname}_${mediaData.id}${ext}`);
        }, true);
        return btn;
    }
    startNetworkSniffer();
    startDomObserver();

    // ==========================================================================
    // Part 3: UI & 交互 (v2.3.18 终极交互版)
    // ==========================================================================

    const showImageSelectionModal = (items, name) => {
        const existing = document.getElementById('imageSelectionOverlay');
        if (existing) existing.remove();

        if (!document.getElementById('xhs-dual-select-css')) {
            const style = document.createElement('style');
            style.id = 'xhs-dual-select-css';
            style.textContent = `
                .image-selection-modal { background: white; border-radius: 12px; width: 90%; max-width: 900px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 50px 100px rgba(0,0,0,0.5); z-index: 2147483647; font-family: system-ui; position: relative; }
                .image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; padding: 20px; overflow-y: auto; background: #f9f9f9; }
                .image-card { border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; background: #fff; user-select: none; transition: box-shadow 0.2s; }
                .image-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                .card-thumb { height: 150px; width: 100%; object-fit: cover; border-bottom: 1px solid #f0f0f0; pointer-events: none; }
                .card-actions { padding: 8px; display: flex; flex-direction: column; gap: 6px; }
                .action-label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #666; cursor: pointer; padding: 8px; border-radius: 6px; transition: all 0.15s; border: 1px solid transparent; }
                .action-label:hover { background: #f5f5f5; }
                .action-label.checked { background: #fff0f2; border-color: #ffb3bc; color: #ff2442; font-weight: 500; }
                .action-label.disabled { opacity: 0.4; cursor: not-allowed; filter: grayscale(1); }
                .action-label input { display: none; } 
                .chk-icon { width: 16px; height: 16px; border: 1px solid #ccc; border-radius: 4px; background: white; display: flex; align-items: center; justify-content: center; color: transparent; font-size: 12px; }
                .action-label.checked .chk-icon { background: #ff2442; border-color: #ff2442; color: white; }
                .action-label.checked .chk-icon::after { content: "✓"; }
                .badge-vid { background: #ff2442; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-left: auto; }
                .modal-footer { padding: 16px; background: #fff; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 12px; align-items: center; }
                .sel-btn { font-size: 13px; color: #666; background: none; border: 1px solid #ddd; padding: 6px 12px; border-radius: 100px; cursor: pointer; }
                .sel-btn:hover { background: #f5f5f5; color: #333; }
                .primary-btn { background: #ff2442; color: white; border: none; padding: 8px 24px; border-radius: 20px; cursor: pointer; font-weight: bold; }
                .secondary-btn { background: #eee; color: #333; border: none; padding: 8px 20px; border-radius: 20px; cursor: pointer; }
                .counter-badge { font-size: 14px; color: #333; background: #f0f0f0; padding: 4px 12px; border-radius: 4px; margin-right: auto; }
                .count-num { color: #ff2442; font-weight: bold; margin: 0 2px; }
                
                /* 新版 ZIP 开关样式 */
                .zip-toggle {
                    display: flex; align-items: center; gap: 8px; 
                    padding: 6px 16px; border-radius: 100px; 
                    border: 1px solid #ddd; cursor: pointer; transition: all 0.2s;
                    font-size: 13px; color: #666; background: #fff;
                    margin-right: 16px; user-select: none;
                }
                .zip-toggle:hover { background: #f9f9f9; }
                .zip-toggle.active { 
                    background: #fff0f2; border-color: #ff2442; color: #ff2442; font-weight: 500;
                }
            `;
            document.head.appendChild(style);
        }

        const overlay = document.createElement('div');
        overlay.id = 'imageSelectionOverlay';
        Object.assign(overlay.style, { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 2147483646, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(2px)' });
        
        const modal = document.createElement('div');
        modal.className = 'image-selection-modal';
        
        const header = document.createElement('div');
        header.style.cssText = "padding: 16px 24px; border-bottom: 1px solid #eee; font-weight: bold; font-size: 18px; display: flex; justify-content: space-between; align-items: center;";
        header.innerHTML = `
            <span>选择下载内容</span>
            <div class="counter-badge">已选: <span id="sel-img-count" class="count-num">0</span>图 <span id="sel-vid-count" class="count-num">0</span>视频</div>
        `;
        
        const grid = document.createElement('div');
        grid.className = 'image-grid';

        const updateCounter = () => {
            const imgC = grid.querySelectorAll('.chk-img.checked').length;
            const vidC = grid.querySelectorAll('.chk-vid.checked').length;
            modal.querySelector('#sel-img-count').textContent = imgC;
            modal.querySelector('#sel-vid-count').textContent = vidC;
        };

        items.forEach(item => {
            const hasVideo = !!item.vidUrl;
            const card = document.createElement('div');
            card.className = 'image-card';
            
            const img = document.createElement('img');
            img.src = item.preview;
            img.className = 'card-thumb';
            card.appendChild(img);

            const actions = document.createElement('div');
            actions.className = 'card-actions';

            // 图片
            const lblImg = document.createElement('div');
            lblImg.className = 'action-label chk-img checked';
            lblImg.innerHTML = `<span class="chk-icon"></span> <span>图片 (.png)</span>`;
            lblImg.dataset.url = item.imgUrl;
            lblImg.dataset.bak = item.preview; 
            lblImg.dataset.idx = item.index;
            lblImg.dataset.type = 'png';
            lblImg.addEventListener('click', (e) => { e.stopPropagation(); lblImg.classList.toggle('checked'); updateCounter(); }, true);
            actions.appendChild(lblImg);

            // 视频
            const lblVid = document.createElement('div');
            lblVid.className = hasVideo ? 'action-label chk-vid checked' : 'action-label chk-vid disabled';
            lblVid.innerHTML = `<span class="chk-icon"></span> <span>视频 (.mp4)</span>${hasVideo ? '<span class="badge-vid">LIVE</span>' : ''}`;
            if (hasVideo) {
                lblVid.dataset.url = item.vidUrl;
                lblVid.dataset.bak = item.rawVidUrl;
                lblVid.dataset.idx = item.index;
                lblVid.dataset.type = 'mp4';
                lblVid.addEventListener('click', (e) => { e.stopPropagation(); lblVid.classList.toggle('checked'); updateCounter(); }, true);
            }
            actions.appendChild(lblVid);

            card.appendChild(actions);
            grid.appendChild(card);
        });

        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        
        const leftBtns = document.createElement('div');
        leftBtns.style.marginRight = 'auto';
        leftBtns.style.display = 'flex';
        leftBtns.style.gap = '8px';

        const btnAllImg = document.createElement('button');
        btnAllImg.className = 'sel-btn';
        btnAllImg.textContent = '全选图片';
        
        const btnAllVid = document.createElement('button');
        btnAllVid.className = 'sel-btn';
        btnAllVid.textContent = '全选视频';

        leftBtns.append(btnAllImg, btnAllVid);

        // ZIP 开关 (大按钮样式)
        let isZipEnabled = true;
        const zipToggle = document.createElement('div');
        zipToggle.className = 'zip-toggle active';
        zipToggle.textContent = '✅ 已开启打包';
        
        zipToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            isZipEnabled = !isZipEnabled;
            if (isZipEnabled) {
                zipToggle.classList.add('active');
                zipToggle.textContent = '✅ 已开启打包';
            } else {
                zipToggle.classList.remove('active');
                zipToggle.textContent = '⬜️ 不打包 (散图)';
            }
        }, true);

        const btnCancel = document.createElement('button');
        btnCancel.className = 'secondary-btn';
        btnCancel.textContent = '取消';

        const btnDl = document.createElement('button');
        btnDl.className = 'primary-btn';
        btnDl.textContent = '开始下载';

        footer.append(leftBtns, zipToggle, btnCancel, btnDl);

        modal.append(header, grid, footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        updateCounter();

        const close = () => overlay.remove();
        btnCancel.addEventListener('click', close, true);

        let allImg = true;
        btnAllImg.addEventListener('click', (e) => {
            e.stopPropagation(); allImg = !allImg;
            grid.querySelectorAll('.chk-img').forEach(el => allImg ? el.classList.add('checked') : el.classList.remove('checked'));
            updateCounter();
        }, true);

        let allVid = true;
        btnAllVid.addEventListener('click', (e) => {
            e.stopPropagation(); allVid = !allVid;
            grid.querySelectorAll('.chk-vid:not(.disabled)').forEach(el => allVid ? el.classList.add('checked') : el.classList.remove('checked'));
            updateCounter();
        }, true);

        btnDl.addEventListener('click', async (e) => {
            e.stopPropagation();
            const tasks = [];
            grid.querySelectorAll('.action-label.checked').forEach(el => {
                if (el.dataset.url) {
                    tasks.push({
                        url: el.dataset.url,
                        bak: el.dataset.bak || '',
                        index: el.dataset.idx,
                        ext: '.' + el.dataset.type
                    });
                }
            });

            if (tasks.length === 0) return showToast('请至少选择一项');
            
            close();
            showToast(`开始下载 ${tasks.length} 个文件...`);
            await downloadFiles(tasks, name, isZipEnabled);
        }, true);
    };

    // 4. 数据提取
    const generateImageUrl = note => {
        let images = note.imageList;
        let results = [];
        try {
            images.forEach((item, index) => {
                // 图片：主链 ci.xiaohongshu，备用链 urlDefault
                let imgUrl = '';
                let rawImgUrl = item.urlDefault || '';
                if (item.info_list && item.info_list.length > 0) {
                     const sorted = [...item.info_list].sort((a,b)=>(b.width||0)*(b.height||0)-(a.width||0)*(a.height||0));
                     rawImgUrl = sorted[0].url;
                }
                if (rawImgUrl) {
                    let match = rawImgUrl.match(/\/([a-zA-Z0-9]+)(?:!|\?|$)/);
                    if (match && match[1]) imgUrl = `https://ci.xiaohongshu.com/${match[1]}?imageView2/format/png`;
                    else imgUrl = rawImgUrl.split('!')[0];
                }

                // 视频：主链 sns-video-bd，备用链 rawVidUrl
                let vidUrl = '';
                let rawVidUrl = '';
                
                // [FIX 2] 普通视频笔记识别增强
                if (item.stream && item.stream.h264 && item.stream.h264.length > 0) rawVidUrl = item.stream.h264[0].masterUrl;
                // 如果 imageList 里找不到视频，尝试在 note.video 结构里找 (普通视频笔记通常在这里)
                if (!rawVidUrl && index === 0 && note.video && note.video.media && note.video.media.stream && note.video.media.stream.h264) rawVidUrl = note.video.media.stream.h264[0].masterUrl;

                else if (item.livePhotoUrl) rawVidUrl = item.livePhotoUrl;
                else if (item.video_url) rawVidUrl = item.video_url;
                
                if (rawVidUrl) {
                    try {
                        let safeUrl = rawVidUrl.startsWith('http:') ? rawVidUrl.replace('http:', 'https:') : rawVidUrl;
                        const urlObj = new URL(safeUrl);
                        vidUrl = `https://sns-video-bd.xhscdn.com${urlObj.pathname}${urlObj.search}`;
                    } catch (e) { vidUrl = rawVidUrl; }
                }

                results.push({ 
                    index: index + 1, 
                    preview: item.urlDefault || item.url, 
                    imgUrl: imgUrl, 
                    vidUrl: vidUrl,
                    rawVidUrl: rawVidUrl 
                });
            });
            return results;
        } catch (error) { return []; }
    };

    // 5. 下载器 (智能降级)
    const downloadFiles = async (items, name, isZip) => {
        const downloadResults = [];
        const failedItems = [];
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const idxStr = String(item.index).padStart(2, '0');
            const fileName = `${name}_${idxStr}${item.ext}`;
            
            showToast(`下载中 (${i+1}/${items.length}):\n${fileName}`);
            
            // 1. 尝试主链接
            let blob = await downloadFile(item.url);
            
            // 2. 失败则尝试备用链接 (图片或视频的原始链接)
            if (!blob && item.bak) {
                console.warn(`Primary failed, fallback to backup: ${item.bak}`);
                blob = await downloadFile(item.bak);
            }

            if (blob) {
                if (!isZip) {
                    triggerDownload(fileName, blob);
                    await new Promise(res => setTimeout(res, 300));
                }
                downloadResults.push({ name: fileName, file: blob });
            } else {
                console.error(`Failed to download: ${fileName}`);
                failedItems.push(fileName);
            }
        }

        if (failedItems.length > 0) {
            showToast(`完成，但有 ${failedItems.length} 个失败`);
        } else {
            showToast(isZip ? '下载完成，正在打包...' : '所有文件下载完毕');
        }

        if (isZip && downloadResults.length > 0) {
            try {
                const zip = new JSZip();
                downloadResults.forEach(item => zip.file(item.name, item.file));
                const content = await zip.generateAsync({ type: "blob", compression: "STORE" });
                triggerDownload(`${name}.zip`, content);
            } catch (error) { console.error(error); showToast('ZIP打包失败'); }
        }
    };

    const downloadFile = async (link) => {
        try {
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: link,
                    responseType: 'blob',
                    headers: { "Accept": "*/*" }, 
                    onload: (res) => {
                        if (res.status >= 200 && res.status < 300) resolve(res.response);
                        else {
                            console.error(`HTTP ${res.status} for ${link}`);
                            resolve(null);
                        }
                    },
                    onerror: (e) => { console.error(e); resolve(null); },
                    ontimeout: () => resolve(null)
                });
            });
            return response;
        } catch (error) { return null; }
    };

    // 入口
    const download = async (urls, note) => {
        const name = extractName();
        const items = generateImageUrl(note);
        if (!items || items.length === 0) return abnormal("无法解析数据");
        showImageSelectionModal(items, name);
    };

    // 辅助
    const triggerDownload = (name, blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const tempLink = document.createElement("a");
        tempLink.href = blobUrl; tempLink.download = name;
        document.body.appendChild(tempLink); tempLink.click();
        document.body.removeChild(tempLink); URL.revokeObjectURL(blobUrl);
    };
    function showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        Object.assign(toast.style, { position: 'fixed', left: '50%', bottom: '10rem', transform: 'translateX(-50%)', padding: '12px 20px', background: 'rgba(0,0,0,0.85)', color: '#fff', borderRadius: '8px', zIndex: '2147483647', pointerEvents: 'none', fontSize: '14px', textAlign: 'center', whiteSpace: 'pre-wrap' });
        document.body.appendChild(toast);
        setTimeout(() => { if(toast.parentNode) toast.remove(); }, 3000);
    }
    const abnormal = (text) => showToast(text);
    const extractName = () => {
        let name = document.title.replace(/ - 小红书$/, "").replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "");
        return name.substring(0, 64) || 'download';
    };
    const extractNoteInfo = () => {
        const match = window.location.href.match(/\/explore\/([^?]+)/);
        return match ? unsafeWindow.__INITIAL_STATE__.note.noteDetailMap[match[1]] : null;
    };
    const extractDownloadLinks = async () => {
        if (window.location.href.includes("/explore/")) {
            let note = extractNoteInfo();
            if (note && note.note) download(null, note.note);
        }
    };
    const iconBase64 = "data:image/png;base64,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";
    let config={position:{bottom:'6rem',left:'1rem'}};
    const createIcon = () => {
        const icon = document.createElement('div');
        icon.style = `position: fixed; bottom: ${config.position.bottom}; left: ${config.position.left}; width: 64px; height: 64px; background: white; border-radius: 50%; cursor: pointer; z-index: 9999; box-shadow: 0 3px 5px rgba(0,0,0,0.24); background-image: url(${iconBase64}); background-size: cover; transition: transform 0.2s;`;
        icon.onclick = () => extractDownloadLinks();
        icon.title = "点击下载";
        return icon;
    };
    document.body.appendChild(createIcon());
})();
