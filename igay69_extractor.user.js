// ==UserScript==
// @name         iGay69 Google Drive Extractor (Liquid Glass)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  批量提取 iGay69 页面的 Google Drive 下载链接并直接下载 - Liquid Glass UI
// @author       Antigravity
// @match        https://igay69.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_addStyle
// @connect      igay69.com
// @connect      drive.google.com
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/wuren194/Safari-/main/igay69_extractor.user.js
// @downloadURL  https://raw.githubusercontent.com/wuren194/Safari-/main/igay69_extractor.user.js
// ==/UserScript==

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // § 1. Liquid Glass CSS (精简版)
    // ═══════════════════════════════════════════════════════════════════════════

    const CSS = `
        :root {
            --lg-glass-dark: rgba(30, 30, 30, 0.85);
            --lg-accent: #0a84ff;
            --lg-accent-glow: rgba(10, 132, 255, 0.4);
            --lg-text-primary: rgba(255,255,255,0.95);
            --lg-text-secondary: rgba(255,255,255,0.6);
            --lg-text-tertiary: rgba(255,255,255,0.4);
            --lg-border-subtle: rgba(255,255,255,0.1);
            --lg-border-medium: rgba(255,255,255,0.18);
            --lg-blur: 40px;
            --lg-warp-expand: -30px;
            --lg-radius-xl: 24px;
            --lg-radius-md: 12px;
            --lg-radius-sm: 8px;
            --lg-spring: cubic-bezier(0.16, 1, 0.3, 1);
            --lg-font-stack: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
        }

        .lg-container {
            position: relative;
            overflow: hidden;
            border-radius: var(--lg-radius-xl);
            font-family: var(--lg-font-stack);
            -webkit-font-smoothing: antialiased;
            transform: translate3d(0,0,0);
        }

        .lg-warp {
            position: absolute;
            inset: var(--lg-warp-expand);
            background: var(--lg-glass-dark);
            backdrop-filter: blur(var(--lg-blur)) saturate(180%);
            -webkit-backdrop-filter: blur(var(--lg-blur)) saturate(180%);
            filter: url(#lg-liquid-filter);
            z-index: 0;
        }

        .lg-border {
            position: absolute; inset: 0;
            border-radius: inherit;
            pointer-events: none; z-index: 1;
            box-shadow: inset 0 0 0 1px var(--lg-border-subtle), inset 0 1px 0 rgba(255,255,255,0.18);
        }

        .lg-content {
            position: relative; z-index: 2;
            display: flex; flex-direction: column;
            background: linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(0,0,0,0.05));
        }

        .lg-panel {
            position: fixed;
            width: 360px;
            max-height: 520px;
            box-shadow: 0 16px 48px rgba(0,0,0,0.4);
            z-index: 2147483647;
            transition: opacity 0.25s, transform 0.25s var(--lg-spring);
        }
        .lg-panel.hidden { opacity: 0; pointer-events: none; transform: translateX(20px) scale(0.95); }

        .lg-header {
            padding: 16px 20px;
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid var(--lg-border-subtle);
            cursor: move;
        }
        .lg-title { font-size: 15px; font-weight: 600; color: var(--lg-text-primary); text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
        .lg-close {
            width: 24px; height: 24px; border-radius: 50%;
            background: rgba(255,255,255,0.1); border: none;
            color: var(--lg-text-secondary);
            display: flex; align-items: center; justify-content: center;
            font-size: 14px; cursor: pointer; transition: 0.15s;
        }
        .lg-close:hover { background: rgba(255,255,255,0.25); color: #fff; }

        .lg-body { padding: 20px; color: var(--lg-text-primary); overflow-y: auto; max-height: 400px; }

        .lg-card {
            background: rgba(0,0,0,0.25);
            border: 1px solid var(--lg-border-subtle);
            border-radius: var(--lg-radius-md);
            padding: 12px; margin-bottom: 16px;
        }

        .lg-progress-bar {
            height: 4px;
            background: rgba(255,255,255,0.1);
            border-radius: 2px;
            overflow: hidden;
            margin-bottom: 12px;
        }
        .lg-progress-fill {
            height: 100%;
            background: var(--lg-accent);
            border-radius: 2px;
            transition: width 0.3s ease;
            width: 0%;
        }

        .lg-status {
            color: var(--lg-text-secondary);
            font-size: 13px;
            margin-bottom: 16px;
        }

        .lg-link-list {
            max-height: 180px;
            overflow-y: auto;
            margin-bottom: 16px;
        }
        .lg-link-item {
            padding: 10px 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: var(--lg-radius-sm);
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
        }
        .lg-link-title {
            color: var(--lg-text-primary);
            font-size: 13px;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .lg-link-status {
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 4px;
            white-space: nowrap;
        }
        .lg-link-status.pending { background: rgba(255, 193, 7, 0.2); color: #ffc107; }
        .lg-link-status.success { background: rgba(76, 175, 80, 0.2); color: #4caf50; }
        .lg-link-status.error { background: rgba(244, 67, 54, 0.2); color: #f44336; }

        .lg-btn {
            padding: 10px 16px; border: none;
            border-radius: var(--lg-radius-md);
            font-size: 13px; font-weight: 600;
            cursor: pointer; transition: transform 0.15s var(--lg-spring), background 0.15s;
            width: 100%;
            margin-bottom: 10px;
        }
        .lg-btn-primary {
            background: var(--lg-accent); color: #fff;
            box-shadow: 0 4px 12px var(--lg-accent-glow);
        }
        .lg-btn-primary:hover { transform: scale(1.02); filter: brightness(1.1); }
        .lg-btn-primary:active { transform: scale(0.98); }
        .lg-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; filter: none; }

        .lg-btn-secondary {
            background: rgba(255,255,255,0.12); color: var(--lg-text-primary);
            border: 1px solid var(--lg-border-subtle);
        }
        .lg-btn-secondary:hover { background: rgba(255,255,255,0.2); }

        .lg-btn-group {
            display: none;
        }
        .lg-btn-group.show {
            display: flex;
            gap: 10px;
        }
        .lg-btn-group .lg-btn { flex: 1; margin-bottom: 0; }

        .lg-ball {
            position: fixed; width: 48px; height: 48px;
            border-radius: 50%;
            background: var(--lg-glass-dark);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--lg-border-medium);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-size: 20px; cursor: pointer;
            z-index: 2147483647;
            transition: transform 0.25s var(--lg-spring), opacity 0.25s;
        }
        .lg-ball:hover { transform: scale(1.1); background: rgba(50,50,50,0.9); }
        .lg-ball.hidden { opacity: 0; transform: scale(0.5); pointer-events: none; }
    `;

    // ═══════════════════════════════════════════════════════════════════════════
    // § 2. SVG 液态滤镜注入
    // ═══════════════════════════════════════════════════════════════════════════

    const injectFilter = () => {
        if (document.getElementById('lg-liquid-filter-svg')) return;
        const div = document.createElement('div');
        div.innerHTML = `
            <svg id="lg-liquid-filter-svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">
                <defs>
                    <filter id="lg-liquid-filter" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
                        <feImage href="data:image/jpeg;base64,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tNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNcrTTTTTTTTTTTTTTTTTTTTTTTTTTTTTXKrTTTTTTTU000000000000000000001FVpppppqampqaaaaaaaaaaaaaaaaaaaa5Vaaaaampqampqammmmmmmmmmmlaaaaaaiq0001NTU1NTU1NTTTTTTTTTTSqqtNNNcqtNNSyzU1LNTU1NTTTTTTTTTSqqq001ytNLLLNTU1NTU1NTbbbTTTTTSqqq001ytNLLLLNTU1NTU3NttttNNNNNKqq001KrSyyyyyzU1NTU3Nzc02220000qqqqrSqqyyyyyzU1NTU3Nzc3NttttNNNKqqqqqqqqssssss1NTU3Nzc3NzbbbbTTTSqqqqqqrLLLLLNTU1Nzc3Nzc22220000qqqqqqqqssss1NTU3Nzc3NzbbbbbTTSqqqqqqqqqqzU1NTc3Nzc3Nzbc2220000qqqqqqqqqqqtTU3Nzc3Nzc3NtzbTTSqqqqrKqqqqqtNNzc23Nzc3Nzc3NTU1KqqqrKqqqqqtNNNNttzc3Nzc3NzU1NLLLLLKqqqqqqqq0022223Nzc3NzU1NSyyyyyyqqqqqqqrTTbbbbc3Nzc3NTU1LLLLLLKsqqqqqqrTTTTbbbc3Nzc1NTU1LLLLLLIKqqqqqrTTTTTbbbTc3NTU1NTU1LLLLLKqqqqqqqq0000222023NTU1NTU1LLLLLKqqqqqqqq000000003NTU1NTU1LLLLLNKrTSqqqqtNNNNNNtNNTU1NSzUssss00qq0qqqqrTTTTTTTTTU1NTUs1LLLNNNKrTTTSqqq00000000001NTU1LNTU0000qtNNNKqqqtNNNNNNNNTU1NTUs1NNNNNKss1NNNK000001NKrK0000001NNTU0s000000qq000001NKrStNNNNK1NNNNStNNNNNKqtNNNNNNNK0000000rU0000rTTTTTSq00000rTTTTTTTTTTTTTTTTStNNNNKr/xAAUEQEAAAAAAAAAAAAAAAAAAACg/9oACAEDAQM/AAAf/9k=" result="DISPLACEMENT_MAP" preserveAspectRatio="xMidYMid slice"/>
                        <feDisplacementMap in="SourceGraphic" in2="DISPLACEMENT_MAP" scale="80" xChannelSelector="R" yChannelSelector="B" result="RED"/>
                        <feColorMatrix in="RED" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="R"/>
                        <feDisplacementMap in="SourceGraphic" in2="DISPLACEMENT_MAP" scale="70" xChannelSelector="R" yChannelSelector="B" result="GREEN"/>
                        <feColorMatrix in="GREEN" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="G"/>
                        <feDisplacementMap in="SourceGraphic" in2="DISPLACEMENT_MAP" scale="60" xChannelSelector="R" yChannelSelector="B" result="BLUE"/>
                        <feColorMatrix in="BLUE" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="B"/>
                        <feBlend in="G" in2="B" mode="screen" result="GB"/>
                        <feBlend in="R" in2="GB" mode="screen" result="RGB"/>
                        <feGaussianBlur in="RGB" stdDeviation="0.3"/>
                    </filter>
                </defs>
            </svg>
        `;
        document.body.appendChild(div);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // § 3. 拖拽功能
    // ═══════════════════════════════════════════════════════════════════════════

    const makeDraggable = (el) => {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        el.addEventListener('contextmenu', e => e.preventDefault());

        el.addEventListener('mousedown', e => {
            if (e.button !== 2) return;
            e.preventDefault();
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = el.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            el.style.transition = 'none';
            el.style.right = 'auto';
            el.style.bottom = 'auto';
            el.style.left = `${initialLeft}px`;
            el.style.top = `${initialTop}px`;
            el.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', e => {
            if (!isDragging) return;
            el.style.left = `${initialLeft + e.clientX - startX}px`;
            el.style.top = `${initialTop + e.clientY - startY}px`;
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            el.style.transition = '';
            el.style.cursor = '';
        });
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // § 4. 状态管理
    // ═══════════════════════════════════════════════════════════════════════════

    let extractedLinks = [];
    let isExtracting = false;

    // ═══════════════════════════════════════════════════════════════════════════
    // § 5. 核心提取逻辑
    // ═══════════════════════════════════════════════════════════════════════════

    // 从当前搜索页获取所有文章链接
    const getArticleLinks = () => {
        const articles = document.querySelectorAll('article.blog-entry');
        const links = [];
        articles.forEach(article => {
            const titleLink = article.querySelector('h2.wpex-card-title a, .blog-entry-title a, h2 a');
            if (titleLink) {
                links.push({
                    title: titleLink.textContent.trim(),
                    url: titleLink.href
                });
            }
        });
        return links;
    };

    // 从详情页提取 Google Drive 链接
    const extractGDriveLink = (html, title) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const gdLinks = doc.querySelectorAll('a[href*="drive.google.com"]');

        for (const link of gdLinks) {
            const text = link.textContent.toLowerCase();
            if (text.includes('ebook') || text.includes('download') || text.includes('zip')) {
                return { title, shareUrl: link.href, downloadUrl: convertToDirectDownload(link.href) };
            }
        }

        if (gdLinks.length > 0) {
            return { title, shareUrl: gdLinks[0].href, downloadUrl: convertToDirectDownload(gdLinks[0].href) };
        }
        return null;
    };

    // 将 Google Drive 共享链接转换为直接下载链接
    const convertToDirectDownload = (shareUrl) => {
        let fileId = null;
        const match1 = shareUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        const match2 = shareUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (match1) fileId = match1[1];
        else if (match2) fileId = match2[1];
        if (fileId) return `https://drive.google.com/uc?export=download&id=${fileId}`;
        return shareUrl;
    };

    // 使用 GM_xmlhttpRequest 获取页面
    const fetchPage = (url) => {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: (response) => {
                    if (response.status === 200) resolve(response.responseText);
                    else reject(new Error('HTTP ' + response.status));
                },
                onerror: (err) => reject(err)
            });
        });
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // § 6. UI 创建
    // ═══════════════════════════════════════════════════════════════════════════

    const createUI = () => {
        // 面板
        const panel = document.createElement('div');
        panel.id = 'igay-panel';
        panel.className = 'lg-container lg-panel';
        panel.style.cssText = 'bottom: 100px; right: 24px;';
        panel.innerHTML = `
            <div class="lg-warp"></div>
            <div class="lg-border"></div>
            <div class="lg-content">
                <div class="lg-header">
                    <span class="lg-title">🔥 iGay69 Extractor</span>
                    <button class="lg-close" id="igay-close">×</button>
                </div>
                <div class="lg-body">
                    <div class="lg-progress-bar">
                        <div class="lg-progress-fill" id="igay-progress"></div>
                    </div>
                    <div class="lg-status" id="igay-status">点击开始提取当前页面的所有下载链接</div>
                    <div class="lg-link-list" id="igay-link-list"></div>
                    <button class="lg-btn lg-btn-primary" id="igay-start-btn">🚀 开始提取</button>
                    <div class="lg-btn-group" id="igay-download-btns">
                        <button class="lg-btn lg-btn-primary" id="igay-batch-dl">📥 批量下载</button>
                        <button class="lg-btn lg-btn-secondary" id="igay-helper-dl">📋 下载助手</button>
                    </div>
                </div>
            </div>
        `;

        // 悬浮球
        const ball = document.createElement('div');
        ball.id = 'igay-ball';
        ball.className = 'lg-ball hidden';
        ball.style.cssText = 'bottom: 100px; right: 24px;';
        ball.innerHTML = '📥';

        document.body.appendChild(panel);
        document.body.appendChild(ball);

        // 绑定事件 (使用 addEventListener 而非内联 onclick)
        document.getElementById('igay-close').addEventListener('click', () => {
            panel.classList.add('hidden');
            ball.classList.remove('hidden');
        });

        ball.addEventListener('click', () => {
            ball.classList.add('hidden');
            panel.classList.remove('hidden');
        });

        document.getElementById('igay-start-btn').addEventListener('click', startExtract);
        document.getElementById('igay-batch-dl').addEventListener('click', batchDownload);
        document.getElementById('igay-helper-dl').addEventListener('click', openDownloadPage);

        makeDraggable(panel);
        makeDraggable(ball);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // § 7. UI 更新辅助函数
    // ═══════════════════════════════════════════════════════════════════════════

    const updateProgress = (percent) => {
        document.getElementById('igay-progress').style.width = percent + '%';
    };

    const updateStatus = (text) => {
        document.getElementById('igay-status').textContent = text;
    };

    const addLinkItem = (title, status) => {
        const list = document.getElementById('igay-link-list');
        const item = document.createElement('div');
        item.className = 'lg-link-item';
        item.innerHTML = `
            <span class="lg-link-title" title="${title}">${title}</span>
            <span class="lg-link-status ${status}">${status === 'pending' ? '提取中...' : status === 'success' ? '✓ 已找到' : '✗ 失败'}</span>
        `;
        item.id = 'link-' + title.replace(/[^a-zA-Z0-9]/g, '_');
        list.appendChild(item);
        return item;
    };

    const updateLinkItem = (title, status) => {
        const id = 'link-' + title.replace(/[^a-zA-Z0-9]/g, '_');
        const item = document.getElementById(id);
        if (item) {
            const statusEl = item.querySelector('.lg-link-status');
            statusEl.className = 'lg-link-status ' + status;
            statusEl.textContent = status === 'pending' ? '提取中...' : status === 'success' ? '✓ 已找到' : '✗ 失败';
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // § 8. 提取 & 下载功能
    // ═══════════════════════════════════════════════════════════════════════════

    const startExtract = async () => {
        if (isExtracting) return;
        isExtracting = true;
        extractedLinks = [];

        const startBtn = document.getElementById('igay-start-btn');
        const downloadBtns = document.getElementById('igay-download-btns');
        startBtn.disabled = true;
        startBtn.textContent = '⏳ 提取中...';
        downloadBtns.classList.remove('show');
        document.getElementById('igay-link-list').innerHTML = '';

        const articles = getArticleLinks();

        if (articles.length === 0) {
            updateStatus('❌ 未找到任何文章链接，请确保在搜索结果页使用');
            startBtn.disabled = false;
            startBtn.textContent = '🚀 开始提取';
            isExtracting = false;
            return;
        }

        updateStatus(`正在提取 ${articles.length} 篇文章的下载链接...`);

        let completed = 0;

        for (const article of articles) {
            addLinkItem(article.title, 'pending');

            try {
                const html = await fetchPage(article.url);
                const link = extractGDriveLink(html, article.title);

                if (link) {
                    extractedLinks.push(link);
                    updateLinkItem(article.title, 'success');
                } else {
                    updateLinkItem(article.title, 'error');
                }
            } catch (e) {
                console.error('提取失败:', article.title, e);
                updateLinkItem(article.title, 'error');
            }

            completed++;
            updateProgress((completed / articles.length) * 100);
            updateStatus(`进度: ${completed}/${articles.length}`);
        }

        updateStatus(`✅ 完成! 成功提取 ${extractedLinks.length}/${articles.length} 个链接`);
        startBtn.disabled = false;
        startBtn.textContent = '🔄 重新提取';

        if (extractedLinks.length > 0) {
            downloadBtns.classList.add('show');
        }

        isExtracting = false;
    };

    const batchDownload = () => {
        if (extractedLinks.length === 0) {
            alert('没有可下载的链接');
            return;
        }

        updateStatus(`正在尝试下载 ${extractedLinks.length} 个文件...`);

        extractedLinks.forEach((link, index) => {
            setTimeout(() => {
                if (typeof GM_download !== 'undefined') {
                    GM_download({
                        url: link.downloadUrl,
                        name: link.title + '.zip',
                        onerror: () => window.open(link.downloadUrl, '_blank')
                    });
                } else {
                    window.open(link.downloadUrl, '_blank');
                }
            }, index * 500);
        });

        updateStatus(`已触发 ${extractedLinks.length} 个下载任务`);
    };

    const openDownloadPage = () => {
        if (extractedLinks.length === 0) {
            alert('没有可下载的链接');
            return;
        }

        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>iGay69 下载助手</title>
    <meta charset="utf-8">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            padding: 40px;
            color: white;
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 28px;
            background: linear-gradient(135deg, #0a84ff 0%, #5ac8fa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .container { max-width: 800px; margin: 0 auto; }
        .link-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.2s;
        }
        .link-card:hover { background: rgba(255, 255, 255, 0.08); transform: translateX(5px); }
        .link-title { flex: 1; font-size: 16px; font-weight: 500; }
        .link-actions { display: flex; gap: 10px; }
        .btn {
            padding: 10px 20px; border: none; border-radius: 8px;
            cursor: pointer; font-weight: 600; font-size: 14px;
            text-decoration: none; transition: all 0.2s;
        }
        .btn-download {
            background: #0a84ff; color: white;
            box-shadow: 0 4px 15px rgba(10, 132, 255, 0.4);
        }
        .btn-download:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .btn-view { background: rgba(255, 255, 255, 0.1); color: white; }
        .btn-view:hover { background: rgba(255, 255, 255, 0.2); }
        .header-actions { text-align: center; margin-bottom: 30px; }
        .btn-all { padding: 15px 40px; font-size: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔥 iGay69 下载助手</h1>
        <div class="header-actions">
            <a href="#" class="btn btn-download btn-all" onclick="downloadAll(); return false;">📥 下载全部 (${extractedLinks.length} 个文件)</a>
        </div>
        ${extractedLinks.map((link, i) => `
            <div class="link-card">
                <span class="link-title">${i + 1}. ${link.title}</span>
                <div class="link-actions">
                    <a href="${link.shareUrl}" target="_blank" class="btn btn-view">👁 查看</a>
                    <a href="${link.downloadUrl}" class="btn btn-download" download>📥 下载</a>
                </div>
            </div>
        `).join('')}
    </div>
    <script>
        function downloadAll() {
            const links = ${JSON.stringify(extractedLinks.map(l => l.downloadUrl))};
            links.forEach((url, i) => { setTimeout(() => window.open(url, '_blank'), i * 500); });
        }
    </script>
</body>
</html>
        `;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // § 9. 初始化
    // ═══════════════════════════════════════════════════════════════════════════

    const init = () => {
        const style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        injectFilter();
        createUI();

        console.log('🔥 iGay69 Extractor (Liquid Glass) 已加载');
    };

    if (document.body) {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
