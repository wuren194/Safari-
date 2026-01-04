// ==UserScript==
// @name         Behance 最高画质下载按钮
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  在 Behance 图片上添加下载按钮，自动获取最高画质
// @author       Baby's Man
// @match        https://www.behance.net/gallery/*
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @connect      *
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/wuren194/Safari-/main/Behance%20%E6%9C%80%E9%AB%98%E7%94%BB%E8%B4%A8%E4%B8%8B%E8%BD%BD%E6%8C%89%E9%92%AE.user.js
// @downloadURL  https://raw.githubusercontent.com/wuren194/Safari-/main/Behance%20%E6%9C%80%E9%AB%98%E7%94%BB%E8%B4%A8%E4%B8%8B%E8%BD%BD%E6%8C%89%E9%92%AE.user.js
// @supportURL   https://github.com/wuren194/Safari-/issues
// ==/UserScript==

(function () {
    'use strict';

    // 样式
    const style = document.createElement('style');
    style.textContent = `
        .nr-download-btn {
            position: absolute;
            top: 15px;
            right: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            cursor: pointer;
            z-index: 10000;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            opacity: 0;
            transform: translateY(-5px);
        }
        .project-module.image:hover .nr-download-btn {
            opacity: 1;
            transform: translateY(0);
        }
        .nr-download-btn:hover {
            background: #0057ff;
            border-color: #0057ff;
            transform: scale(1.1) !important;
        }
        .nr-download-btn svg {
            width: 18px;
            height: 18px;
            fill: #333;
            transition: fill 0.2s;
        }
        .nr-download-btn:hover svg {
            fill: white;
        }
        .nr-download-btn.downloading {
            pointer-events: none;
            opacity: 0.9 !important;
        }
        .nr-download-btn.downloading svg {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // 下载图标 SVG
    const downloadIcon = `<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;
    const loadingIcon = `<svg viewBox="0 0 24 24"><path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/></svg>`;

    // 获取最高画质 URL
    function getHighResUrl(url) {
        if (!url) return null;
        if (url.includes('/project_modules/fs/') || url.includes('/project_modules/source/')) {
            return url;
        }
        return url.replace(/\/project_modules\/[a-zA-Z0-9_]+\//, '/project_modules/fs/');
    }

    // 从 URL 获取文件名
    function getFileName(url) {
        try {
            const cleanUrl = url.split('?')[0];
            const parts = cleanUrl.split('/');
            return parts[parts.length - 1] || `behance_${Date.now()}.jpg`;
        } catch (e) {
            return `behance_${Date.now()}.jpg`;
        }
    }

    // 下载图片
    function downloadImage(url, button) {
        if (!url) return;

        if (button.classList.contains('downloading')) return;
        button.classList.add('downloading');
        button.innerHTML = loadingIcon;

        const highResUrl = getHighResUrl(url);
        const fileName = getFileName(highResUrl);

        console.log('Attempting download:', highResUrl);

        let isDone = false;

        // 超时保底：5秒没反应直接打开原图
        const timeoutId = setTimeout(() => {
            if (!isDone) {
                console.warn('Download timed out, falling back to direct open');
                isDone = true;
                fallbackOpen(highResUrl, button);
                alert('下载超时，已为您在新窗口打开原图。您可以手动保存。'); // 提示用户
            }
        }, 5000);

        GM_xmlhttpRequest({
            method: 'GET',
            url: highResUrl,
            responseType: 'blob',
            onload: function (response) {
                if (isDone) return;
                clearTimeout(timeoutId);

                if (response.status === 200) {
                    console.log('Download success, creating blob...');
                    const blob = response.response;
                    const objectUrl = window.URL.createObjectURL(blob);

                    // Safari 特殊处理：尝试直接跳转到 Blob URL
                    // 这通常会触发下载，而不是在新标签页打开（如果是图片偶尔会打开）
                    // 相比 a.click()，location.href 在 Safari async callback 中更稳定
                    const a = document.createElement('a');
                    a.href = objectUrl;
                    a.download = fileName;
                    a.style.display = 'none';
                    document.body.appendChild(a);

                    // 尝试点击
                    setTimeout(() => {
                        a.click();
                        // 给一点时间让浏览器响应
                        setTimeout(() => {
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(objectUrl);
                            resetButton(button);
                            isDone = true;
                        }, 1000);
                    }, 0);

                } else {
                    console.error('Download failed, status:', response.status);
                    // 也许猜的 fs 地址不对，回退到原始地址
                    if (url !== highResUrl) {
                        console.log('Retrying with original url...');
                        downloadImage(url, button); // 递归重试原始地址
                        isDone = true; // 防止超时触发
                        clearTimeout(timeoutId);
                        return;
                    }
                    fallbackOpen(highResUrl, button);
                    isDone = true;
                }
            },
            onerror: function (err) {
                if (isDone) return;
                clearTimeout(timeoutId);
                console.error('GM_xmlhttpRequest failed:', err);
                fallbackOpen(highResUrl, button);
                isDone = true;
            }
        });
    }

    function resetButton(button) {
        button.classList.remove('downloading');
        button.innerHTML = downloadIcon;
    }

    function fallbackOpen(url, button) {
        window.open(url, '_blank');
        resetButton(button);
    }

    // 处理单个图片模块
    function processModule(module) {
        if (module.dataset.nrProcessed) return;

        // 找到图片 URL
        const img = module.querySelector('img');
        if (!img) return;

        let imgUrl = img.src || img.dataset.src;
        if (!imgUrl && img.srcset) {
            imgUrl = img.srcset.split(' ').pop();
        }
        if (!imgUrl) return;

        // 标记已处理
        module.dataset.nrProcessed = 'true';

        // 确保模块相对定位，以便按钮绝对定位
        if (getComputedStyle(module).position === 'static') {
            module.style.position = 'relative';
        }

        // 创建按钮
        const btn = document.createElement('div');
        btn.className = 'nr-download-btn';
        btn.innerHTML = downloadIcon;
        btn.title = 'Download Original';

        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const currentUrl = img.currentSrc || img.src || imgUrl;
            downloadImage(currentUrl, btn);
        };

        // 直接插入到模块中，不依赖任何子容器
        module.appendChild(btn);
    }

    // 扫描页面
    function scan() {
        const modules = document.querySelectorAll('.project-module.image');
        modules.forEach(processModule);
    }

    // 启动
    function init() {
        scan();
        const observer = new MutationObserver((mutations) => {
            scan();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }

})();
