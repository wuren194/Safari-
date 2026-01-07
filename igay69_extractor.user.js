// ==UserScript==
// @name         iGay69 Google Drive Extractor
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  批量提取 iGay69 页面的 Google Drive 下载链接并直接下载
// @author       Antigravity
// @match        https://igay69.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_addStyle
// @connect      igay69.com
// @connect      drive.google.com
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ========== 样式注入 ==========
    GM_addStyle(`
        #igay-extractor-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            border: none;
        }
        #igay-extractor-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 30px rgba(102, 126, 234, 0.6);
        }
        #igay-extractor-btn svg {
            width: 28px;
            height: 28px;
            fill: white;
        }
        #igay-extractor-panel {
            position: fixed;
            bottom: 100px;
            right: 30px;
            width: 400px;
            max-height: 500px;
            background: rgba(20, 20, 30, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            z-index: 99998;
            overflow: hidden;
            display: none;
            flex-direction: column;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        #igay-extractor-panel.show {
            display: flex;
        }
        .igay-panel-header {
            padding: 16px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: 600;
            font-size: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .igay-panel-close {
            cursor: pointer;
            opacity: 0.8;
            transition: opacity 0.2s;
            font-size: 20px;
        }
        .igay-panel-close:hover {
            opacity: 1;
        }
        .igay-panel-content {
            padding: 16px 20px;
            overflow-y: auto;
            flex: 1;
        }
        .igay-progress-bar {
            height: 6px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 12px;
        }
        .igay-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 3px;
            transition: width 0.3s ease;
            width: 0%;
        }
        .igay-status {
            color: rgba(255, 255, 255, 0.7);
            font-size: 13px;
            margin-bottom: 16px;
        }
        .igay-link-list {
            max-height: 200px;
            overflow-y: auto;
            margin-bottom: 16px;
        }
        .igay-link-item {
            padding: 10px 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
        }
        .igay-link-title {
            color: white;
            font-size: 13px;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .igay-link-status {
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 4px;
            white-space: nowrap;
        }
        .igay-link-status.pending {
            background: rgba(255, 193, 7, 0.2);
            color: #ffc107;
        }
        .igay-link-status.success {
            background: rgba(76, 175, 80, 0.2);
            color: #4caf50;
        }
        .igay-link-status.error {
            background: rgba(244, 67, 54, 0.2);
            color: #f44336;
        }
        .igay-btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        .igay-btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            width: 100%;
            margin-bottom: 10px;
        }
        .igay-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .igay-btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        .igay-btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            width: 100%;
        }
        .igay-btn-secondary:hover {
            background: rgba(255, 255, 255, 0.15);
        }
        .igay-btn-group {
            display: flex;
            gap: 10px;
        }
        .igay-btn-group .igay-btn {
            flex: 1;
        }
    `);

    // ========== 状态管理 ==========
    let extractedLinks = [];
    let isExtracting = false;

    // ========== UI 创建 ==========
    function createUI() {
        // 悬浮按钮
        const btn = document.createElement('button');
        btn.id = 'igay-extractor-btn';
        btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;
        btn.onclick = togglePanel;
        document.body.appendChild(btn);

        // 面板
        const panel = document.createElement('div');
        panel.id = 'igay-extractor-panel';
        panel.innerHTML = `
            <div class="igay-panel-header">
                <span>🔥 iGay69 Extractor</span>
                <span class="igay-panel-close" onclick="document.getElementById('igay-extractor-panel').classList.remove('show')">✕</span>
            </div>
            <div class="igay-panel-content">
                <div class="igay-progress-bar">
                    <div class="igay-progress-fill" id="igay-progress"></div>
                </div>
                <div class="igay-status" id="igay-status">点击开始提取当前页面的所有下载链接</div>
                <div class="igay-link-list" id="igay-link-list"></div>
                <button class="igay-btn igay-btn-primary" id="igay-start-btn" onclick="window.igayStartExtract()">
                    🚀 开始提取
                </button>
                <div class="igay-btn-group" style="display: none;" id="igay-download-btns">
                    <button class="igay-btn igay-btn-primary" onclick="window.igayBatchDownload()">
                        📥 批量下载
                    </button>
                    <button class="igay-btn igay-btn-secondary" onclick="window.igayOpenDownloadPage()">
                        📋 下载助手
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
    }

    function togglePanel() {
        document.getElementById('igay-extractor-panel').classList.toggle('show');
    }

    function updateProgress(percent) {
        document.getElementById('igay-progress').style.width = percent + '%';
    }

    function updateStatus(text) {
        document.getElementById('igay-status').textContent = text;
    }

    function addLinkItem(title, status) {
        const list = document.getElementById('igay-link-list');
        const item = document.createElement('div');
        item.className = 'igay-link-item';
        item.innerHTML = `
            <span class="igay-link-title" title="${title}">${title}</span>
            <span class="igay-link-status ${status}">${status === 'pending' ? '提取中...' : status === 'success' ? '✓ 已找到' : '✗ 失败'}</span>
        `;
        item.id = 'link-' + title.replace(/[^a-zA-Z0-9]/g, '_');
        list.appendChild(item);
        return item;
    }

    function updateLinkItem(title, status) {
        const id = 'link-' + title.replace(/[^a-zA-Z0-9]/g, '_');
        const item = document.getElementById(id);
        if (item) {
            const statusEl = item.querySelector('.igay-link-status');
            statusEl.className = 'igay-link-status ' + status;
            statusEl.textContent = status === 'pending' ? '提取中...' : status === 'success' ? '✓ 已找到' : '✗ 失败';
        }
    }

    // ========== 核心逻辑 ==========

    // 从当前搜索页获取所有文章链接
    function getArticleLinks() {
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
    }

    // 从详情页提取 Google Drive 链接
    function extractGDriveLink(html, title) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // 查找所有 Google Drive 链接
        const gdLinks = doc.querySelectorAll('a[href*="drive.google.com"]');
        
        for (const link of gdLinks) {
            // 检查链接文本是否包含 ebook/download 关键词
            const text = link.textContent.toLowerCase();
            if (text.includes('ebook') || text.includes('download') || text.includes('zip')) {
                return {
                    title: title,
                    shareUrl: link.href,
                    downloadUrl: convertToDirectDownload(link.href)
                };
            }
        }
        
        // 如果没有找到带关键词的，返回第一个 Google Drive 链接
        if (gdLinks.length > 0) {
            return {
                title: title,
                shareUrl: gdLinks[0].href,
                downloadUrl: convertToDirectDownload(gdLinks[0].href)
            };
        }
        
        return null;
    }

    // 将 Google Drive 共享链接转换为直接下载链接
    function convertToDirectDownload(shareUrl) {
        // 提取 file ID
        // 格式1: https://drive.google.com/file/d/FILE_ID/view
        // 格式2: https://drive.google.com/open?id=FILE_ID
        // 格式3: https://drive.google.com/uc?id=FILE_ID
        
        let fileId = null;
        
        const match1 = shareUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        const match2 = shareUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        
        if (match1) {
            fileId = match1[1];
        } else if (match2) {
            fileId = match2[1];
        }
        
        if (fileId) {
            return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
        
        // 如果无法解析，返回原链接
        return shareUrl;
    }

    // 开始提取
    window.igayStartExtract = async function() {
        if (isExtracting) return;
        isExtracting = true;
        extractedLinks = [];
        
        const startBtn = document.getElementById('igay-start-btn');
        const downloadBtns = document.getElementById('igay-download-btns');
        startBtn.disabled = true;
        startBtn.textContent = '⏳ 提取中...';
        downloadBtns.style.display = 'none';
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
            downloadBtns.style.display = 'flex';
        }
        
        isExtracting = false;
    };

    // 使用 GM_xmlhttpRequest 获取页面
    function fetchPage(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: function(response) {
                    if (response.status === 200) {
                        resolve(response.responseText);
                    } else {
                        reject(new Error('HTTP ' + response.status));
                    }
                },
                onerror: function(err) {
                    reject(err);
                }
            });
        });
    }

    // 批量下载
    window.igayBatchDownload = function() {
        if (extractedLinks.length === 0) {
            alert('没有可下载的链接');
            return;
        }
        
        updateStatus(`正在尝试下载 ${extractedLinks.length} 个文件...`);
        
        // 逐个触发下载，间隔 500ms 避免被浏览器拦截
        extractedLinks.forEach((link, index) => {
            setTimeout(() => {
                // 尝试使用 GM_download
                if (typeof GM_download !== 'undefined') {
                    GM_download({
                        url: link.downloadUrl,
                        name: link.title + '.zip',
                        onerror: function() {
                            // 失败时打开链接
                            window.open(link.downloadUrl, '_blank');
                        }
                    });
                } else {
                    // 直接打开下载链接
                    window.open(link.downloadUrl, '_blank');
                }
            }, index * 500);
        });
        
        updateStatus(`已触发 ${extractedLinks.length} 个下载任务，请检查浏览器下载`);
    };

    // 打开下载助手页面
    window.igayOpenDownloadPage = function() {
        if (extractedLinks.length === 0) {
            alert('没有可下载的链接');
            return;
        }
        
        // 创建一个新窗口显示所有链接
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>iGay69 下载助手</title>
    <meta charset="utf-8">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            padding: 40px;
            color: white;
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 28px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
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
        .link-card:hover {
            background: rgba(255, 255, 255, 0.08);
            transform: translateX(5px);
        }
        .link-title {
            flex: 1;
            font-size: 16px;
            font-weight: 500;
        }
        .link-actions {
            display: flex;
            gap: 10px;
        }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            text-decoration: none;
            transition: all 0.2s;
        }
        .btn-download {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .btn-download:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .btn-view {
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }
        .btn-view:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        .header-actions {
            text-align: center;
            margin-bottom: 30px;
        }
        .btn-all {
            padding: 15px 40px;
            font-size: 16px;
        }
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
            links.forEach((url, i) => {
                setTimeout(() => window.open(url, '_blank'), i * 500);
            });
        }
    </script>
</body>
</html>
        `;
        
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    // ========== 初始化 ==========
    createUI();
    console.log('🔥 iGay69 Extractor 已加载');
})();
