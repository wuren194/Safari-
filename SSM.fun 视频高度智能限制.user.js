// ==UserScript==
// @name         SSM.fun 视频高度智能限制
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  限制 ssm.fun 中嵌入视频的最大高度，黑色背景填充
// @author       You
// @match        https://www.ssm.fun/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/wuren194/Safari-/main/SSM.fun%20%E8%A7%86%E9%A2%91%E9%AB%98%E5%BA%A6%E6%99%BA%E8%83%BD%E9%99%90%E5%88%B6.user.js
// @downloadURL  https://raw.githubusercontent.com/wuren194/Safari-/main/SSM.fun%20%E8%A7%86%E9%A2%91%E9%AB%98%E5%BA%A6%E6%99%BA%E8%83%BD%E9%99%90%E5%88%B6.user.js
// @supportURL   https://github.com/wuren194/Safari-/issues
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG_KEY = 'ssm_video_limit_v3';
    const DEFAULT_LIMIT = 1000;
    const STYLE_ID = 'ssm-video-limiter-style-v3';

    function getLimitValue() {
        return parseInt(GM_getValue(CONFIG_KEY, DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;
    }

    // 添加黑色背景的 CSS 规则
    function generateCSS(limitNum) {
        return `
            /* 广泛匹配各种视频容器 */
            .topic-content iframe,
            .topic-content video,
            .topic-content .dplayer,
            .topic-content .dplayer-video-wrap,
            .topic-content [class*="player"],
            .topic-content [class*="video"],
            .reply-content iframe,
            .reply-content video,
            .comment-content iframe,
            .content iframe,
            .content video,
            article iframe,
            article video,
            main iframe,
            main video,
            iframe[src*="player"],
            iframe[src*="video"],
            iframe[src*="bilibili"],
            iframe[src*="youtube"],
            iframe[src*="embed"] {
                max-height: ${limitNum}px !important;
                background-color: #000 !important;
            }
            
            video {
                max-height: ${limitNum}px !important;
                object-fit: contain !important;
                background-color: #000 !important;
            }
            
            /* 视频容器也加黑色背景，防止边缘露白 */
            .dplayer,
            .dplayer-video-wrap,
            [class*="player-container"],
            [class*="video-container"],
            [class*="video-wrapper"] {
                background-color: #000 !important;
            }
        `;
    }

    // 强制设置样式（增加背景色）
    function forceApplyToElements() {
        const limit = getLimitValue();
        const elements = document.querySelectorAll('iframe, video, .dplayer, [class*="player"]');
        
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.height > limit) {
                el.style.setProperty('max-height', `${limit}px`, 'important');
                el.style.setProperty('height', 'auto', 'important');
                el.style.setProperty('background-color', '#000', 'important');
                console.log('[SSM Limiter] 已强制限制:', el, `原高度: ${rect.height}px`);
            }
            
            // 所有视频元素都加黑色背景
            if (el.tagName === 'VIDEO' || el.tagName === 'IFRAME') {
                el.style.setProperty('background-color', '#000', 'important');
            }
        });
    }

    function applyStyle() {
        const limit = getLimitValue();
        let styleEl = document.getElementById(STYLE_ID);

        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = STYLE_ID;
            document.head.appendChild(styleEl);
        }

        styleEl.textContent = generateCSS(limit);
        console.log(`[SSM Limiter] CSS已注入，限制: ${limit}px`);
        
        setTimeout(forceApplyToElements, 300);
    }

    function observeDOM() {
        const observer = new MutationObserver((mutations) => {
            let hasNewMedia = false;
            
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        const tag = node.tagName;
                        if (tag === 'IFRAME' || tag === 'VIDEO' ||
                            node.querySelector?.('iframe, video, .dplayer')) {
                            hasNewMedia = true;
                            break;
                        }
                    }
                }
                if (hasNewMedia) break;
            }
            
            if (hasNewMedia) {
                setTimeout(forceApplyToElements, 200);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    function handleMenuCommand() {
        const current = getLimitValue();
        const input = prompt(
            `当前限制高度：${current}px\n请输入新的最大高度（纯数字）：`,
            current
        );

        if (input !== null) {
            const num = parseInt(input.replace(/\D/g, ''), 10);
            if (num > 0) {
                GM_setValue(CONFIG_KEY, num);
                applyStyle();
                alert(`已设置为 ${num}px`);
            } else {
                alert('无效输入');
            }
        }
    }

    function init() {
        GM_registerMenuCommand('⚙️ 设定视频高度阈值', handleMenuCommand);
        applyStyle();
        observeDOM();
        
        window.addEventListener('load', () => {
            setTimeout(forceApplyToElements, 500);
            setTimeout(forceApplyToElements, 1500);
        });
    }

    init();
})();