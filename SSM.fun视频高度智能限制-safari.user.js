// ==UserScript==
// @name         SSM.fun 视频高度智能限制 (Safari版)
// @namespace    http://tampermonkey.net/
// @version      1.4-safari
// @description  限制 ssm.fun 中嵌入视频的最大高度，黑色背景填充 - Safari 适配版
// @author       You
// @match        https://www.ssm.fun/*
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG_KEY = 'ssm_video_limit_v3';
    const DEFAULT_LIMIT = 1000;
    const STYLE_ID = 'ssm-video-limiter-style-v3';

    // Safari 适配：使用 localStorage 替代 GM_getValue
    function getLimitValue() {
        try {
            return parseInt(localStorage.getItem(CONFIG_KEY), 10) || DEFAULT_LIMIT;
        } catch (e) {
            return DEFAULT_LIMIT;
        }
    }

    // Safari 适配：使用 localStorage 替代 GM_setValue
    function setLimitValue(value) {
        try {
            localStorage.setItem(CONFIG_KEY, value);
        } catch (e) {
            console.error('[SSM Limiter] 保存配置失败:', e);
        }
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

            /* 设置按钮样式 */
            #ssm-limiter-settings-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            #ssm-limiter-settings-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
            }
            #ssm-limiter-settings-btn svg {
                width: 24px;
                height: 24px;
                fill: white;
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

    // Safari 适配：用悬浮按钮替代 GM_registerMenuCommand
    function createSettingsButton() {
        const btn = document.createElement('button');
        btn.id = 'ssm-limiter-settings-btn';
        btn.title = '设置视频高度阈值';
        btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>`;

        btn.onclick = () => {
            const current = getLimitValue();
            const input = prompt(
                `当前限制高度：${current}px\n请输入新的最大高度（纯数字）：`,
                current
            );

            if (input !== null) {
                const num = parseInt(input.replace(/\D/g, ''), 10);
                if (num > 0) {
                    setLimitValue(num);
                    applyStyle();
                    alert(`已设置为 ${num}px`);
                } else {
                    alert('无效输入');
                }
            }
        };

        document.body.appendChild(btn);
    }

    function init() {
        applyStyle();
        observeDOM();
        createSettingsButton();

        window.addEventListener('load', () => {
            setTimeout(forceApplyToElements, 500);
            setTimeout(forceApplyToElements, 1500);
        });
    }

    init();
    console.log('[SSM Limiter Safari] 脚本已加载');
})();
