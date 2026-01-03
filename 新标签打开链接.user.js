// ==UserScript==
// @name         新标签打开链接
// @namespace    https://github.com/user/open-links-new-tab
// @version      1.0.0
// @description  所有链接都在新标签页打开
// @author       Antigravity
// @match        *://*/*
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // 处理点击事件
    document.addEventListener('click', function (e) {
        // 找到被点击的链接
        const link = e.target.closest('a[href]');

        if (!link) return;

        const href = link.getAttribute('href');

        // 忽略特殊链接
        if (!href ||
            href.startsWith('#') ||
            href.startsWith('javascript:') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            link.getAttribute('download') !== null) {
            return;
        }

        // 如果已经是新标签页打开，不处理
        if (link.target === '_blank') return;

        // 如果按住了修饰键（Cmd/Ctrl），让浏览器自己处理
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;

        // 阻止默认行为
        e.preventDefault();
        e.stopPropagation();

        // 获取完整URL
        const url = link.href;

        // 后台打开新标签页（不切换焦点）
        // Safari中用window.open后立即blur可以实现后台打开
        const newWindow = window.open(url, '_blank');
        if (newWindow) {
            newWindow.blur();
            window.focus();
        }

    }, true); // 使用捕获阶段，优先处理

})();
