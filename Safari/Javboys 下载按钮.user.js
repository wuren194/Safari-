// ==UserScript==
// @name         Javboys 下载按钮
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  在 Javboys 视频页面添加 Downie 下载按钮
// @author       Antigravity
// @match        *://javboys.com/*
// @match        *://www.javboys.com/*
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @connect      localhost
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/wuren194/Safari-/main/Javboys%20%E4%B8%8B%E8%BD%BD%E6%8C%89%E9%92%AE.user.js
// @downloadURL  https://raw.githubusercontent.com/wuren194/Safari-/main/Javboys%20%E4%B8%8B%E8%BD%BD%E6%8C%89%E9%92%AE.user.js
// @supportURL   https://github.com/wuren194/Safari-/issues
// ==/UserScript==

(function () {
    'use strict';

    // 等待 DOM 完全加载后再检查
    function init() {
        // 检查是否已添加按钮
        if (document.querySelector('.jb-download-btn')) return;

        // 在所有页面尝试添加按钮，点击时再检测视频
        createButton();
    }

    // 样式
    const style = document.createElement('style');
    style.textContent = `
        .jb-download-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 999999;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
            color: white;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(238, 90, 90, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .jb-download-btn:hover {
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 8px 30px rgba(238, 90, 90, 0.5);
        }

        .jb-download-btn:active {
            transform: scale(0.95);
        }

        .jb-download-btn svg {
            width: 24px;
            height: 24px;
            fill: currentColor;
        }

        .jb-download-btn.success {
            background: linear-gradient(135deg, #34c759 0%, #30d158 100%);
            box-shadow: 0 4px 20px rgba(52, 199, 89, 0.4);
        }

        .jb-download-btn.loading {
            pointer-events: none;
            opacity: 0.7;
        }

        .jb-toast {
            position: fixed;
            bottom: 100px;
            right: 24px;
            z-index: 999999;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 12px 20px;
            border-radius: 12px;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }

        .jb-toast.show {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);

    // 获取标题
    function getTitle() {
        const h1 = document.querySelector('h1.entry-title, h1');
        if (h1) return h1.textContent.trim();
        let title = document.title || '';
        title = title.replace(/\s*[-–—|]\s*Javboys.*$/gi, '').trim();
        return title || 'video';
    }

    // 清理文件名
    function sanitizeFilename(name) {
        return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 120) || 'video';
    }

    // 查找视频嵌入链接
    function findVideoEmbed() {
        // 方法1：从 iframe 找
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of iframes) {
            const src = iframe.src || '';
            if (src.match(/dood|luluvdoo|streamtape|mixdrop|filemoon|streamwish|vidhide|embedrise/i)) {
                return src;
            }
        }

        // 方法2：从页面 HTML 中找 iframe src
        const html = document.body.innerHTML;
        const patterns = [
            /iframe[^>]+src=["']([^"']*(?:dood|luluvdoo)[^"']*)/i,
            /iframe[^>]+src=["']([^"']*(?:streamtape)[^"']*)/i,
            /iframe[^>]+src=["']([^"']*(?:mixdrop)[^"']*)/i,
            /iframe[^>]+src=["']([^"']*(?:filemoon)[^"']*)/i,
            /iframe[^>]+src=["']([^"']*(?:streamwish|vidhide|embedrise)[^"']*)/i,
        ];

        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) return match[1];
        }

        return null;
    }

    // Toast 提示
    function showToast(message, duration = 2000) {
        let toast = document.querySelector('.jb-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'jb-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    // 复制到剪贴板
    function copyToClipboard(text) {
        if (typeof GM_setClipboard !== 'undefined') {
            GM_setClipboard(text);
            return;
        }
        navigator.clipboard.writeText(text).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        });
    }

    // 从 URL 提取视频 ID
    function extractVideoId(url) {
        // doodstream/luluvdoo: https://luluvdoo.com/e/ft5s5y7h7t9c
        const doodMatch = url.match(/\/e\/([a-zA-Z0-9]+)/);
        if (doodMatch) return doodMatch[1];

        // streamtape: https://streamtape.com/v/xxxx
        const stMatch = url.match(/\/v\/([a-zA-Z0-9]+)/);
        if (stMatch) return stMatch[1];

        // 通用：最后一个路径段
        const pathMatch = url.match(/\/([a-zA-Z0-9]+)\/?$/);
        if (pathMatch) return pathMatch[1];

        return null;
    }

    // 发送标题到本地服务
    function saveTitleToService(videoId, title) {
        return new Promise((resolve) => {
            if (typeof GM_xmlhttpRequest !== 'undefined') {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'http://127.0.0.1:18080/add',
                    headers: { 'Content-Type': 'application/json' },
                    data: JSON.stringify({ id: videoId, title: title }),
                    onload: () => resolve(true),
                    onerror: () => resolve(false)
                });
            } else {
                // Fallback to fetch
                fetch('http://127.0.0.1:18080/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: videoId, title: title })
                }).then(() => resolve(true)).catch(() => resolve(false));
            }
        });
    }

    // 下载处理
    async function handleDownload(btn) {
        btn.classList.add('loading');

        const embedUrl = findVideoEmbed();

        if (!embedUrl) {
            showToast('未找到视频链接');
            btn.classList.remove('loading');
            return;
        }

        const title = sanitizeFilename(getTitle());
        const videoId = extractVideoId(embedUrl);

        // 保存标题到本地服务
        if (videoId) {
            const saved = await saveTitleToService(videoId, title);
            if (saved) {
                showToast('标题已保存');
            }
        }

        // 同时复制到剪贴板作为备用
        copyToClipboard(title);

        // 发送给 Downie
        window.location.href = `downie://XUOpenURL?url=${encodeURIComponent(embedUrl)}`;

        // 成功反馈
        btn.classList.remove('loading');
        btn.classList.add('success');
        showToast('已发送到 Downie');

        setTimeout(() => {
            btn.classList.remove('success');
        }, 2000);
    }

    // 创建按钮
    function createButton() {
        const btn = document.createElement('button');
        btn.className = 'jb-download-btn';
        btn.title = '用 Downie 下载';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
        `;
        btn.addEventListener('click', () => handleDownload(btn));
        document.body.appendChild(btn);
    }

    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

