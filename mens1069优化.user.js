// ==UserScript==
// @name         mens1069优化
// @name:zh-CN   mens1069优化
// @namespace    http://tampermonkey.net/
// @version      3.2.0
// @description  [v3.2] 去除 mens1069.com 广告 + 原地播放 + Downie 下载 (修复列表页跳转)
// @author       Antigravity
// @match        *://*.mens1069.com/*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/wuren194/Safari-/main/mens1069优化.user.js
// @downloadURL  https://raw.githubusercontent.com/wuren194/Safari-/main/mens1069优化.user.js
// @supportURL   https://github.com/wuren194/Safari-/issues
// ==/UserScript==

(function () {
    'use strict';

    // =========================================================================
    // 0. 配置与初始化
    // =========================================================================
    const CONFIG = {
        // 允许的视频域名
        VIDEO_DOMAINS: [
            'streamwish', 'filelions', 'dood', 'streamtape', 'mixdrop',
            'vidhide', 'voe.sx', 'wish', 'soundcloud', 'youtube',
            'youtu.be', 'vimeo', 'dailymotion', 'twitch', 'm1xdrop',
            'swishvideo', 'ouo.io'
        ],
        // 已知广告黑名单 (CSS选择器)
        AD_SELECTORS: [
            '.pm25acp6phk', '[data-cl-overlay]', '[data-cl-popup]',
            'div[id^="rc-widget"]', '.popunder', '.adsbygoogle',
            'iframe[src*="juicyads"]', 'iframe[src*="exoclick"]',
            'a[href*="juicyads"]', 'a[href*="exoclick"]',
            'div[style*="z-index"][style*="fixed"][style*="width: 100%"]',
        ]
    };

    console.log('✅ Antigravity Engine v3.1 启动');

    // =========================================================================
    // 1. CSS 强力去广告 (零性能消耗)
    // =========================================================================
    const css = `
        /* 隐藏已知广告 */
        ${CONFIG.AD_SELECTORS.join(', ')} { display: none !important; visibility: hidden !important; pointer-events: none !important; }
        
        /* 隐藏 body 直属的高层级透明遮罩 */
        body > div[style*="z-index"][style*="fixed"] { display: none !important; }
        body > div[style*="z-index"][style*="absolute"] { display: none !important; }
        
        /* 修复页面滚动 */
        body, html { overflow: auto !important; }

        /* 播放器样式 */
        .m1069-player-wrapper {
            position: relative;
            width: 100%;
            background: #000;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            border: 2px solid #2196F3;
        }
        .m1069-player-btn {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(33, 150, 243, 0.9);
            color: white;
            padding: 15px 30px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 50px;
            pointer-events: none;
            z-index: 10;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        
        /* 下载按钮样式 */
        .m1069-download-btn {
            display: inline-flex;
            align-items: center;
            background-color: #ff2a6d;
            color: #fff !important;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-decoration: none !important;
            margin-left: 10px;
            cursor: pointer;
            border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: all 0.2s;
            z-index: 1000;
        }
        .m1069-download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            background-color: #ff0055;
        }
        
        /* 启动提示 - 持久小徽章 */
        #ag-toast {
            position: fixed;
            top: 12px; left: 12px;
            background: linear-gradient(135deg, #1e88e5, #42a5f5);
            color: white;
            padding: 6px 12px;
            border-radius: 15px;
            z-index: 2147483647;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            opacity: 0.9;
            pointer-events: none;
        }
    `;
    GM_addStyle(css);

    // =========================================================================
    // 2. 核心逻辑：原地视频播放器
    // =========================================================================
    function replaceFakePlayer() {
        const container = document.querySelector('.entry-content');
        if (!container) return;

        // 1. 寻找视频源
        const links = Array.from(container.querySelectorAll('a[href]'));
        let targetUrl = null;

        for (const link of links) {
            if (link.href.includes('ouo.io')) {
                targetUrl = link.href;
                break;
            }
        }
        if (!targetUrl) {
            for (const link of links) {
                if (CONFIG.VIDEO_DOMAINS.some(d => link.href.includes(d))) {
                    targetUrl = link.href;
                    break;
                }
            }
        }

        // 2. 寻找假播放器图片
        const images = Array.from(container.querySelectorAll('img'));

        images.forEach(img => {
            if (img.dataset.agProcessed) return;
            // 过滤小图标 (用 naturalWidth 兼容懒加载)
            const imgWidth = img.naturalWidth || img.width || parseInt(img.getAttribute('width')) || 0;
            if (imgWidth > 0 && imgWidth < 200) return;

            img.dataset.agProcessed = 'true';
            console.log(' [Core] 发现假播放器图片，准备替换');

            // 包装
            const wrapper = document.createElement('div');
            wrapper.className = 'm1069-player-wrapper';
            img.parentNode.insertBefore(wrapper, img);
            wrapper.appendChild(img);

            // 按钮
            const btn = document.createElement('div');
            btn.className = 'm1069-player-btn';
            btn.innerText = targetUrl ? '▶ 点击在本页播放' : '未找到视频源';
            wrapper.appendChild(btn);

            // [NEW] 封面下载按钮
            if (targetUrl) {
                const dlBtn = document.createElement('a');
                dlBtn.style.cssText = `
                    position: absolute;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #ff2a6d;
                    color: white;
                    padding: 10px 25px;
                    font-size: 14px;
                    font-weight: bold;
                    border-radius: 30px;
                    text-decoration: none;
                    z-index: 11;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    border: 1px solid rgba(255,255,255,0.2);
                    transition: transform 0.2s;
                `;
                dlBtn.innerHTML = '⬇ 调用 Downie 下载';

                // 阻止冒泡，避免点击下载时触发播放
                dlBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    const title = document.title.replace('Mens1069', '').trim();
                    GM_setClipboard(title);

                    window.location.href = 'downie://XUOpenLink?url=' + encodeURIComponent(targetUrl);

                    dlBtn.innerHTML = '✅ 标题已复制 + 唤起中...';
                    dlBtn.style.background = '#4CAF50';
                    setTimeout(() => {
                        dlBtn.innerHTML = '⬇ 调用 Downie 下载';
                        dlBtn.style.background = '#ff2a6d';
                    }, 3000);
                });

                // 添加 hover 效果
                dlBtn.addEventListener('mouseenter', () => dlBtn.style.transform = 'translateX(-50%) scale(1.05)');
                dlBtn.addEventListener('mouseleave', () => dlBtn.style.transform = 'translateX(-50%) scale(1)');

                wrapper.appendChild(dlBtn);
            }

            // 替换逻辑
            wrapper.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (!targetUrl) {
                    alert('Antigravity: 当前页面没有找到 ouo.io 视频链接，无法播放。');
                    return;
                }

                console.log(' [Core] 加载视频:', targetUrl);

                // 创建 Iframe
                const iframe = document.createElement('iframe');
                iframe.src = targetUrl;
                iframe.style.width = '100%';
                iframe.style.height = (img.height || 500) + 'px';
                iframe.style.minHeight = '500px';
                iframe.style.border = 'none';
                iframe.allow = 'autoplay; fullscreen';

                wrapper.innerHTML = ''; // 清空
                wrapper.appendChild(iframe);
            });
        });
    }

    // =========================================================================
    // 3. 下载按钮 (Downie)
    // =========================================================================
    function injectDownie() {
        // 只给真正的 Iframe 加下载按钮
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            if (iframe.dataset.agDownie) return;
            const src = iframe.src;
            if (!CONFIG.VIDEO_DOMAINS.some(d => src.includes(d))) return;

            iframe.dataset.agDownie = 'true';

            // 在 iframe 上方插入按钮
            const btn = document.createElement('a');
            btn.className = 'm1069-download-btn';
            btn.innerText = '⬇ 复制标题并下载';
            btn.href = '#';
            btn.onclick = (e) => {
                e.preventDefault();
                const title = document.title.replace('Mens1069', '').trim();
                GM_setClipboard(title);
                window.location.href = 'downie://XUOpenLink?url=' + encodeURIComponent(src); // 尝试触发
                btn.innerText = '✅ 已复制标题';
                setTimeout(() => btn.innerText = '⬇ 复制标题并下载', 2000);
            };

            iframe.parentNode.insertBefore(btn, iframe);
        });
    }

    // =========================================================================
    // 4. Global Click Shield (轻量级防劫持 + 链接净化)
    // =========================================================================
    function initClickShield() {
        console.log('🛡️ [Shield] 启动 Global Click Shield');

        document.addEventListener('click', (e) => {
            const target = e.target;

            // 0. 白名单放行
            if (target.closest('.m1069-download-btn') ||
                target.closest('.m1069-player-wrapper') ||
                target.closest('.m1069-player-btn') ||
                target.closest('iframe')) {
                return;
            }

            // -----------------------------------------------------------------
            // A. 链接净化 (Link Purification) - 解决列表页 Tab-under 广告
            // -----------------------------------------------------------------
            // 策略：检测到点击帖子链接时，立刻阻止冒泡（不让广告脚本知道你点了），
            // 然后手动在新标签页打开。
            const link = target.closest('a');
            if (link && link.href) {
                const href = link.href;

                // 识别必须保护的帖子链接
                // 1. 在 .entry-title 里的链接 (标题)
                // 2. 在 .entry-thumb 里的链接 (缩略图)
                // 3. 任何指向 mens1069.com/archives/ 的链接
                const isPostLink =
                    target.closest('.entry-title') ||
                    target.closest('.entry-thumb') ||
                    (href.includes('/archives/') && !href.includes('/category/'));

                if (isPostLink) {
                    console.log('🛡️ [Purify] 净化链接点击:', href);

                    // 1. 阻止事件传播：这一步最关键，饿死广告脚本
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    // 2. 也是为了防止广告脚本监听 mousedown/mouseup，我们强制在新标签页打开
                    window.open(href, '_blank');
                    return;
                }
            }

            // -----------------------------------------------------------------
            // B. 透明层拦截
            // -----------------------------------------------------------------
            const style = window.getComputedStyle(target);
            const zIndex = parseInt(style.zIndex) || 0;
            const opacity = parseFloat(style.opacity);
            const position = style.position;

            // 特征判定：极其靠上的层级 + 透明/无内容
            if (zIndex > 2000 && (position === 'fixed' || position === 'absolute')) {
                // 如果是透明的，或者是空的 div
                if (opacity < 0.1 || target.innerHTML.trim() === '') {
                    console.log('🛡️ [Shield] 拦截透明层点击:', target);
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    target.remove();
                    return;
                }
            }

            // 全屏遮罩特征
            if (target.style.width === '100%' && target.style.height === '100%' && zIndex > 1000) {
                console.log('🛡️ [Shield] 拦截全屏遮罩:', target);
                e.preventDefault();
                e.stopPropagation();
                target.remove();
            }

        }, true); // Capture Phase
    }

    // =========================================================================
    // 5. 执行控制
    // =========================================================================

    function showToast() {
        if (document.getElementById('ag-toast')) return;
        const t = document.createElement('div');
        t.id = 'ag-toast';
        t.innerText = '✓ 插件已开启';
        document.body.appendChild(t);
        // 不再自动消失
    }

    // =========================================================================
    // 6. 独立下载按钮（保底方案）
    // =========================================================================
    function injectStandaloneDownloadBtn() {
        const container = document.querySelector('.entry-content');
        if (!container || container.dataset.agStandalone) return;

        // 找视频链接
        const links = Array.from(container.querySelectorAll('a[href]'));
        let targetUrl = null;
        for (const link of links) {
            if (link.href.includes('ouo.io') || CONFIG.VIDEO_DOMAINS.some(d => link.href.includes(d))) {
                targetUrl = link.href;
                break;
            }
        }
        if (!targetUrl) return;

        // 检查是否已有播放器 wrapper 上的下载按钮
        if (container.querySelector('.m1069-player-wrapper a[style*="bottom"]')) return;

        container.dataset.agStandalone = 'true';

        // 在 entry-content 顶部插入独立下载按钮
        const dlBtn = document.createElement('a');
        dlBtn.className = 'm1069-download-btn';
        dlBtn.style.cssText = 'display: inline-flex; margin-bottom: 15px;';
        dlBtn.innerHTML = '⬇ 调用 Downie 下载此视频';
        dlBtn.href = '#';
        dlBtn.onclick = (e) => {
            e.preventDefault();
            const title = document.title.replace('Mens1069', '').trim();
            GM_setClipboard(title);
            window.location.href = 'downie://XUOpenLink?url=' + encodeURIComponent(targetUrl);
            dlBtn.innerHTML = '✅ 标题已复制 + 唤起中...';
            setTimeout(() => dlBtn.innerHTML = '⬇ 调用 Downie 下载此视频', 3000);
        };

        container.insertBefore(dlBtn, container.firstChild);
        console.log('📥 [Standalone] 插入独立下载按钮');
    }

    function mainLoop() {
        replaceFakePlayer();
        injectDownie();
        injectStandaloneDownloadBtn(); // 保底下载按钮
        // 简单的垃圾补漏
        document.querySelectorAll('.pm25acp6phk, [data-cl-overlay]').forEach(e => e.remove());
    }

    // 启动
    const init = () => {
        showToast();
        initClickShield(); // 启动 Global Click Shield
        setInterval(mainLoop, 2000);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
