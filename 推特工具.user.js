// ==UserScript==
// @name         推特工具
// @name:zh-CN   推特工具
// @namespace    http://tampermonkey.net/
// @version      1.2.0
// @description  推特增强工具：Downie下载按钮（超精简版，彻底修复视频问题）
// @author       Antigravity
// @match        https://x.com/*
// @match        https://twitter.com/*
// @exclude      https://x.com/i/cards-frame/*
// @exclude      https://twitter.com/i/cards-frame/*
// @compatible   safari
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const svgIcon = `<svg viewBox="0 0 24 24" style="width: 18px; height: 18px;"><g><path d="M3,14 v5 q0,2 2,2 h14 q2,0 2,-2 v-5 M7,10 l4,4 q1,1 2,0 l4,-4 M12,3 v11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></g></svg>`;

    // 添加样式
    function addStyle() {
        if (document.getElementById('tt-style')) return;
        const style = document.createElement('style');
        style.id = 'tt-style';
        style.textContent = `
            .tmd-btn-wrap { margin-left: auto !important; display: flex !important; align-items: center !important; order: 999 !important; }
            .tmd-btn { cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 9999px; width: 34px; height: 34px; color: rgb(113, 118, 123); transition: background-color 0.2s, color 0.2s; }
            .tmd-btn:hover { background-color: rgba(29, 161, 242, 0.1); color: rgb(29, 155, 240); }
            .tmd-btn.done svg { color: rgb(0, 186, 124) !important; }
        `;
        document.head.appendChild(style);
    }

    // 发送到 Downie
    function sendToDownie(url) {
        window.location.href = `downie://X?url=${encodeURIComponent(url)}`;
    }

    // 注入按钮
    function injectButton(article) {
        if (article.dataset.tmd) return;
        article.dataset.tmd = '1';

        const actionBar = article.querySelector('div[role="group"][aria-label]');
        const tweetLink = article.querySelector('a[href*="/status/"]');
        if (!actionBar || !tweetLink) return;

        const wrap = document.createElement('div');
        wrap.className = 'tmd-btn-wrap';

        const btn = document.createElement('div');
        btn.className = 'tmd-btn';
        btn.innerHTML = svgIcon;

        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            sendToDownie(tweetLink.href.split('?')[0]);
            btn.classList.add('done');
            setTimeout(() => btn.classList.remove('done'), 2000);
        };

        wrap.appendChild(btn);
        actionBar.appendChild(wrap);
    }

    // 扫描页面（下载按钮）
    function scan() {
        document.querySelectorAll('article:not([data-tmd])').forEach(injectButton);
    }

    // ========== 时间格式化 ==========
    const WEEKDAYS = {
        'zh': ['日', '一', '二', '三', '四', '五', '六'],
        'zh-CN': ['日', '一', '二', '三', '四', '五', '六'],
        'en': ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    };
    const LANG = document.documentElement.getAttribute('lang') || 'zh-CN';

    function formatTime() {
        const selectors = 'article time[datetime*=":"]';
        document.querySelectorAll(selectors).forEach(timeEl => {
            if (timeEl.dataset.ttFormatted) return;
            timeEl.dataset.ttFormatted = '1';

            const datetime = timeEl.getAttribute('datetime');
            if (!datetime) return;

            const date = new Date(datetime);
            if (isNaN(date.getTime())) return;

            const ye = date.getFullYear();
            const mo = date.getMonth() + 1;
            const da = date.getDate();
            const ho = ('0' + date.getHours()).slice(-2);
            const mi = ('0' + date.getMinutes()).slice(-2);

            const formatted = `${ye}年${mo}月${da}日 ${ho}:${mi}`;

            const span = document.createElement('span');
            span.className = 'tt-time';
            span.textContent = formatted;
            if (timeEl.style) span.style.cssText = timeEl.style.cssText;

            timeEl.style.display = 'none';
            timeEl.parentNode?.appendChild(span);
        });
    }

    // 使用 setInterval 代替 MutationObserver（更安全）
    function init() {
        addStyle();
        scan();
        formatTime();
        // 每2秒扫描一次
        setInterval(() => {
            scan();
            formatTime();
        }, 2000);
        console.log('[推特工具] v1.2.1 已启动');
    }

    // 延迟启动，确保页面完全加载
    setTimeout(init, 1000);
})();
