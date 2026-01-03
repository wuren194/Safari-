// ==UserScript==
// @name         书签侧边栏（优化浅色模式）
// @namespace    https://github.com/user/bookmark-sidebar
// @version      3.2.0
// @description  Safari侧边栏书签管理器 - Liquid Glass UI（深/浅色自适应优化版）
// @author       Antigravity
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // ========== 配置 ==========
    const CONFIG = {
        triggerWidth: 8, // 保留用于JS逻辑，但实际样式由CSS控制
        sidebarWidth: 300, // 不再用于样式，仅作参考（或者可以移除）
        position: 'left',
        animationDuration: 300,
        autoHideDelay: 500,
        storageKey: 'bookmark_sidebar_v3'
    };

    // ========== 默认书签数据 ==========
    const DEFAULT_BOOKMARKS = [
        { id: 'ws_1', type: 'bookmark', title: 'Greasy Fork', url: 'https://greasyfork.org/zh-CN', favicon: '' },
        { id: 'ws_2', type: 'bookmark', title: 'BoysHalfwayHouse', url: 'https://www.boyshalfwayhouse.com/', favicon: '' },
        { id: 'ws_3', type: 'bookmark', title: 'Google 图片', url: 'https://www.google.com/imghp?hl=zh-CN', favicon: '' },
        { id: 'ws_4', type: 'bookmark', title: 'IAFD', url: 'https://www.iafd.com/index.asp', favicon: '' },
        { id: 'ws_5', type: 'bookmark', title: 'Just the Gays', url: 'https://justthegays.com/', favicon: '' },
        { id: 'ws_6', type: 'bookmark', title: 'Gay for Fans', url: 'https://gayforfans.com/', favicon: '' },
        { id: 'ws_7', type: 'bookmark', title: 'Instagrammen', url: 'https://mens1069.com/archives/category/%e8%a6%96%e9%a0%bb', favicon: '' },
        { id: 'ws_8', type: 'bookmark', title: 'iGay69', url: 'https://igay69.com/category/porn/str8boys/', favicon: '' },
        { id: 'ws_9', type: 'bookmark', title: 'SEX GAY PLUS', url: 'https://sexgayplus.com/', favicon: '' },
        { id: 'ws_10', type: 'bookmark', title: 'MyVidster', url: 'https://www.myvidster.com/', favicon: '' },
        { id: 'ws_11', type: 'bookmark', title: '搜同', url: 'https://74.222.3.60/', favicon: '' },
        { id: 'ws_12', type: 'bookmark', title: 'TT1069', url: 'https://www.tt1069.com/bbs/forum.php', favicon: '' },
        { id: 'ws_13', type: 'bookmark', title: 'bad.news', url: 'https://bad.news/', favicon: '' },
        { id: 'ws_14', type: 'bookmark', title: 'Gay Male Tube', url: 'https://www.gaymaletube.com/', favicon: '' },
        { id: 'ws_15', type: 'bookmark', title: 'SSM 鹹豆漿', url: 'https://www.ssm.fun/?forumId=4', favicon: '' },
        { id: 'ws_16', type: 'bookmark', title: 'BoyFriendTv', url: 'https://www.boyfriendtv.com/', favicon: '' },
        { id: 'ws_17', type: 'bookmark', title: 'ThisVid', url: 'https://de.thisvid.com/categories/gay/', favicon: '' },
        { id: 'ws_18', type: 'bookmark', title: 'XVIDEOS', url: 'https://www.xvideos.com/gay', favicon: '' },
        { id: 'ws_19', type: 'bookmark', title: 'Pornhub', url: 'https://cn.pornhub.com/gayporn', favicon: '' },
        { id: 'ws_20', type: 'bookmark', title: 'XNXX', url: 'https://www.xnxx.com/', favicon: '' },
        { id: 'ws_21', type: 'bookmark', title: 'MyMuscleVideo', url: 'https://mymusclevideo.com/', favicon: '' },
        { id: 'ws_22', type: 'bookmark', title: 'SpankBang', url: 'https://spankbang.com/', favicon: '' },
        { id: 'ws_23', type: 'bookmark', title: 'XL GayTube', url: 'https://www.xl-gaytube.com/', favicon: '' },
        { id: 'ws_24', type: 'bookmark', title: 'FullBoys', url: 'https://fullboys.com/', favicon: '' },
        { id: 'ws_25', type: 'bookmark', title: 'GayForIt', url: 'https://www.gayforit.eu/', favicon: '' },
        { id: 'ws_26', type: 'bookmark', title: 'PornOne', url: 'https://pornone.com/', favicon: '' },
        { id: 'ws_27', type: 'bookmark', title: 'VK Boys', url: 'https://vk.com/video/@club210978469', favicon: '' },
        { id: 'ws_28', type: 'bookmark', title: 'MeatyHunks', url: 'https://www.meatyhunks.com/', favicon: '' },
        { id: 'ws_29', type: 'bookmark', title: 'Gay.Bingo', url: 'https://ch.gay.bingo/', favicon: '' },
        { id: 'ws_30', type: 'bookmark', title: 'Str8ongay', url: 'https://m.str8ongay.com/', favicon: '' },
        { id: 'ws_31', type: 'bookmark', title: 'SizeSurvey', url: 'https://www.sizesurvey.com/result.html', favicon: '' },
        { id: 'ws_32', type: 'bookmark', title: 'Monstercockland', url: 'https://monstercockland.com/', favicon: '' },
        { id: 'ws_33', type: 'bookmark', title: 'PeekVids', url: 'https://www.peekvids.com/', favicon: '' },
        { id: 'ws_34', type: 'bookmark', title: 'Stag Homme', url: 'https://staghomme.com/models', favicon: '' },
        { id: 'ws_35', type: 'bookmark', title: 'GayTxxx', url: 'https://gaytxxx.com/', favicon: '' },
        { id: 'ws_36', type: 'bookmark', title: 'xHamster', url: 'https://xhamster.com/gay', favicon: '' },
        { id: 'ws_37', type: 'bookmark', title: '漫蛙漫画', url: 'https://manwa.me/', favicon: '' },
        { id: 'ws_38', type: 'bookmark', title: 'MenGem', url: 'https://www.mengem.com/', favicon: '' },
        { id: 'ws_39', type: 'bookmark', title: 'DVD-Flix', url: 'https://dvd-flix.com/', favicon: '' },
        { id: 'ws_40', type: 'bookmark', title: 'VideosXGAYS', url: 'https://www.videosxgays.com/en/', favicon: '' },
        { id: 'ws_41', type: 'bookmark', title: 'GayPornVideos', url: 'https://gaypornvideos.cc/', favicon: '' },
        { id: 'ws_42', type: 'bookmark', title: 'DVD Gay Online', url: 'https://dvdgayonline.net/', favicon: '' },
        { id: 'ws_43', type: 'bookmark', title: 'FreePornVideosHDGay', url: 'https://freepornvideoshdgay.com/', favicon: '' },
        { id: 'ws_44', type: 'bookmark', title: 'Big Big Gay', url: 'https://big-big-gay.com/', favicon: '' },
        { id: 'ws_45', type: 'bookmark', title: 'Músculo Duro', url: 'https://musculoduro.net/', favicon: '' },
        { id: 'ws_46', type: 'bookmark', title: 'Garoto Safado', url: 'https://garotosafado.net/', favicon: '' },
        { id: 'ws_47', type: 'bookmark', title: 'Blackout Social', url: 'https://blackoutsocialvideos.com/', favicon: '' },
        { id: 'ws_48', type: 'bookmark', title: 'MaxeGatos', url: 'https://www.maxegatos.net/', favicon: '' },
        { id: 'ws_49', type: 'bookmark', title: 'Meu Mundo Gay', url: 'https://meumundogay.net/', favicon: '' },
        { id: 'ws_50', type: 'bookmark', title: 'HD GAY SEX', url: 'https://hdgay.net/', favicon: '' },
        { id: 'ws_51', type: 'bookmark', title: 'Coomer', url: 'https://coomer.su/', favicon: '' },
        { id: 'ws_52', type: 'bookmark', title: 'Asiangaylove', url: 'https://asiangaylove.com/', favicon: '' },
        { id: 'ws_53', type: 'bookmark', title: 'BT4G', url: 'https://bt4gprx.com/', favicon: '' },
        { id: 'ws_54', type: 'bookmark', title: 'Mariah Network', url: 'https://mariahcareynetwork.com/', favicon: '' },
        { id: 'ws_55', type: 'bookmark', title: '欧美采访', url: 'https://www.webcamjackers.com/', favicon: '' },
        { id: 'ws_56', type: 'bookmark', title: 'BOYSTUDIO', url: 'https://boy-studio.com/', favicon: '' },
        { id: 'ws_57', type: 'bookmark', title: 'Tranny Videos', url: 'https://trannyvideosx.com/', favicon: '' },
        { id: 'ws_58', type: 'bookmark', title: 'CAM4 中国', url: 'https://zh.cam4.com/male/chinese', favicon: '' },
        { id: 'ws_59', type: 'bookmark', title: 'BOSS直聘', url: 'https://www.zhipin.com/', favicon: '' },
        { id: 'ws_60', type: 'bookmark', title: 'SuperPorn', url: 'https://www.superporn.com/gay', favicon: '' },
        { id: 'ws_61', type: 'bookmark', title: 'Asian Gay Porn', url: 'https://www.asiangayporn.net/', favicon: '' },
        { id: 'ws_62', type: 'bookmark', title: '好色 Tv', url: 'https://hsex.icu/', favicon: '' },
        { id: 'ws_63', type: 'bookmark', title: '飞兔云', url: 'https://www.xn--9kq10e0y7h.site/home.html', favicon: '' },
        { id: 'ws_64', type: 'bookmark', title: 'GuyWH', url: 'https://guywh.com/', favicon: '' },
        { id: 'ws_65', type: 'bookmark', title: 'Gemini Enterprise', url: 'https://business.gemini.google/', favicon: '' }
    ];

    // ========== Liquid Glass 样式 ==========
    const injectStyles = () => {
        const style = document.createElement('style');
        style.id = 'bookmark-sidebar-styles';
        style.textContent = `
            /* ═══════════════════════════════════════════════════════
               样式隔离 - 防止页面样式影响侧边栏
               ═══════════════════════════════════════════════════════ */
            .bks-root,
            .bks-root * {
                box-sizing: border-box !important;
            }
            .bks-root {
                contain: layout style;
                isolation: isolate;
            }

            /* ═══════════════════════════════════════════════════════
               深色主题（默认） & 公共变量
               ═══════════════════════════════════════════════════════ */
            .bks-root,
            .bks-root[data-theme="dark"] {
                --lg-blur: 12px;
                --lg-saturation: 1.2;
                --lg-brightness: 1.05;
                --lg-bg-opacity: 0.15;
                --lg-border-opacity: 0.3;
                --lg-radius: 24px;
                --lg-radius-sm: 12px;
                --lg-text-primary: #ffffff;
                --lg-text-secondary: rgba(255, 255, 255, 0.6);
                --lg-icon-color: #ffffff;
                --lg-panel-bg: rgba(20, 20, 35, var(--lg-bg-opacity));
                --lg-border-color: rgba(255, 255, 255, var(--lg-border-opacity));
                --lg-highlight-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
                --lg-item-bg: rgba(255, 255, 255, 0.05);
                --lg-item-hover: rgba(255, 255, 255, 0.1);
                --lg-item-border: rgba(255, 255, 255, 0.06);
                --lg-btn-bg: rgba(255, 255, 255, 0.12);
                --lg-btn-hover: rgba(255, 255, 255, 0.2);
                --lg-btn-border: rgba(255, 255, 255, 0.15);
                --lg-input-bg: rgba(255, 255, 255, 0.06);
                --lg-input-border: rgba(255, 255, 255, 0.1);
                --lg-scrollbar: rgba(255, 255, 255, 0.12);

                /* 浮层 & 菜单用 */
                --lg-overlay-bg: rgba(30, 30, 50, 0.7);
                --lg-overlay-border: rgba(255, 255, 255, 0.15);
                --lg-divider-color: rgba(255, 255, 255, 0.1);
                --lg-menu-hover-bg: rgba(255, 255, 255, 0.12);

                /* 危险色 */
                --lg-danger-bg: rgba(255, 80, 80, 0.2);
                --lg-danger-weak-bg: rgba(255, 80, 80, 0.15);
                --lg-danger-color: #ff6b6b;
            }

            /* ═══════════════════════════════════════════════════════
               浅色主题（参考插件样式A）
               ═══════════════════════════════════════════════════════ */
            .bks-root[data-theme="light"] {
                --lg-blur: 12px;
                --lg-saturation: 1.1;
                --lg-brightness: 1.0;
                --lg-bg-opacity: 0.2;
                --lg-border-opacity: 0.5;
                --lg-text-primary: rgba(0, 0, 0, 0.8);
                --lg-text-secondary: rgba(0, 0, 0, 0.55);
                --lg-icon-color: rgba(0, 0, 0, 0.8);
                --lg-panel-bg: rgba(255, 255, 255, var(--lg-bg-opacity));
                --lg-border-color: rgba(255, 255, 255, var(--lg-border-opacity));
                --lg-highlight-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
                --lg-item-bg: rgba(255, 255, 255, 0.3);
                --lg-item-hover: rgba(255, 255, 255, 0.5);
                --lg-item-border: rgba(255, 255, 255, 0.4);
                --lg-btn-bg: rgba(255, 255, 255, 0.5);
                --lg-btn-hover: rgba(255, 255, 255, 0.7);
                --lg-btn-border: rgba(255, 255, 255, 0.6);
                --lg-input-bg: rgba(255, 255, 255, 0.3);
                --lg-input-border: rgba(255, 255, 255, 0.5);
                --lg-scrollbar: rgba(0, 0, 0, 0.15);

                --lg-overlay-bg: rgba(255, 255, 255, var(--lg-bg-opacity));
                --lg-overlay-border: rgba(255, 255, 255, var(--lg-border-opacity));
                --lg-divider-color: rgba(0, 0, 0, 0.08);
                --lg-menu-hover-bg: rgba(255, 255, 255, 0.4);

                --lg-danger-bg: rgba(255, 80, 80, 0.18);
                --lg-danger-weak-bg: rgba(255, 255, 255, 0.3);
                --lg-danger-color: #ff3b30;
            }

            /* 触发区域 */
            .bks-trigger {
                position: fixed;
                top: 0;
                ${CONFIG.position}: 0;
                width: 1vh; /* 约8-10px */
                height: 100vh;
                z-index: 2147483646;
                background: transparent;
            }
            .bks-trigger:hover {
                background: linear-gradient(
                    ${CONFIG.position === 'left' ? 'to right' : 'to left'},
                    rgba(100, 150, 255, 0.25),
                    transparent
                );
            }

            /* 侧边栏容器 */
            .bks-sidebar {
                position: fixed;
                top: 0;
                ${CONFIG.position}: -${CONFIG.sidebarWidth + 20}px;
                width: ${CONFIG.sidebarWidth}px;
                height: 100vh;
                z-index: 2147483647;
                font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
                font-size: 13px;
                transition: ${CONFIG.position} ${CONFIG.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: none;
            }
            .bks-sidebar.bks-visible {
                ${CONFIG.position}: 0;
                pointer-events: auto;
            }

            /* ═══════════════════════════════════════════════════════
               Liquid Glass 核心结构
               ═══════════════════════════════════════════════════════ */
            .bks-glass {
                position: absolute;
                inset: 16px;
                border-radius: var(--lg-radius);
                overflow: hidden;
            }

            .bks-glass-warp {
                position: absolute;
                inset: -30px;
                backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturation)) brightness(var(--lg-brightness));
                -webkit-backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturation)) brightness(var(--lg-brightness));
            }

            .bks-glass-bg {
                position: absolute;
                inset: 0;
                background: var(--lg-panel-bg);
                border-radius: inherit;
            }

            .bks-glass-border {
                position: absolute;
                inset: 0;
                border-radius: inherit;
                border: 1px solid var(--lg-border-color);
                box-shadow:
                    inset 0 1px 1px rgba(255, 255, 255, 0.15),
                    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
                pointer-events: none;
            }

            .bks-glass-highlight {
                position: absolute;
                inset: 0;
                border-radius: inherit;
                background: var(--lg-highlight-bg);
                pointer-events: none;
            }

            .bks-glass-content {
                position: relative;
                z-index: 10;
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            /* 头部 */
            .bks-header {
                padding: 16px 18px 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-shrink: 0;
            }
            .bks-title {
                font-size: 15px;
                font-weight: 600;
                color: var(--lg-text-primary);
                letter-spacing: -0.3px;
            }
            .bks-header-actions {
                display: flex;
                gap: 8px;
            }

            /* ═══════════════════════════════════════════════════════
               深色模式 - 按钮样式
               ═══════════════════════════════════════════════════════ */

            .bks-root[data-theme="dark"] .bks-btn-icon,
            .bks-root:not([data-theme]) .bks-btn-icon {
                width: 28px;
                height: 28px;
                border: 1px solid rgba(255, 255, 255, 0.15);
                background: rgba(255, 255, 255, 0.12);
                border-radius: 10px;
                color: #ffffff;
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .bks-root[data-theme="dark"] .bks-btn-icon:hover,
            .bks-root:not([data-theme]) .bks-btn-icon:hover {
                background: rgba(255, 255, 255, 0.25);
                transform: scale(1.05);
            }
            .bks-root[data-theme="dark"] .bks-btn-icon svg,
            .bks-root:not([data-theme]) .bks-btn-icon svg {
                width: 1.1em;
                height: 1.1em;
                stroke: #ffffff;
                fill: none;
                stroke-width: 2;
            }

            /* ═══════════════════════════════════════════════════════
               浅色模式 - 按钮样式（参考插件样式A）
               ═══════════════════════════════════════════════════════ */
            .bks-root[data-theme="light"] .bks-btn-icon {
                width: 28px;
                height: 28px;
                border: 1px solid rgba(255, 255, 255, 0.5);
                background: rgba(255, 255, 255, 0.5);
                border-radius: 10px;
                color: rgba(0, 0, 0, 0.8);
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .bks-root[data-theme="light"] .bks-btn-icon:hover {
                background: rgba(255, 255, 255, 0.7);
                border-color: rgba(255, 255, 255, 0.7);
                transform: scale(1.05);
            }

            /* ═══════════════════════════════════════════════════════
               图标颜色切换（分开定义深色和浅色模式）
               ═══════════════════════════════════════════════════════ */
            /* 公共 SVG 样式 */
            /* 公共 SVG 样式 */
            .bks-btn-icon svg,
            .bks-item-btn svg,
            .bks-btn svg {
                width: 14px;
                height: 14px;
                stroke: currentColor;
                fill: none;
                transition: stroke 0.2s ease, color 0.2s ease;
                vertical-align: middle;
                margin-top: -2px; /* 视觉微调 */
            }
            .bks-item-btn svg {
                width: 0.8em;
                height: 0.8em;
            }

            /* 深色模式 & 默认：白色图标 */
            .bks-root[data-theme="dark"] .bks-btn-icon,
            .bks-root[data-theme="dark"] .bks-item-btn,
            .bks-root[data-theme="dark"] .bks-btn,
            .bks-root:not([data-theme]) .bks-btn-icon,
            .bks-root:not([data-theme]) .bks-item-btn,
            .bks-root:not([data-theme]) .bks-btn {
                color: #ffffff;
            }
            .bks-root[data-theme="dark"] .bks-btn-icon svg,
            .bks-root[data-theme="dark"] .bks-item-btn svg,
            .bks-root[data-theme="dark"] .bks-btn svg,
            .bks-root:not([data-theme]) .bks-btn-icon svg,
            .bks-root:not([data-theme]) .bks-item-btn svg,
            .bks-root:not([data-theme]) .bks-btn svg {
                stroke: #ffffff;
            }

            /* 浅色模式：黑色图标 */
            .bks-root[data-theme="light"] .bks-btn-icon,
            .bks-root[data-theme="light"] .bks-item-btn,
            .bks-root[data-theme="light"] .bks-btn {
                color: #000000;
            }
            .bks-root[data-theme="light"] .bks-btn-icon svg,
            .bks-root[data-theme="light"] .bks-item-btn svg,
            .bks-root[data-theme="light"] .bks-btn svg {
                stroke: #000000;
            }

            /* ═══════════════════════════════════════════════════════
               搜索框样式
               ═══════════════════════════════════════════════════════ */
            .bks-search-wrap {
                padding: 0 16px 12px;
                flex-shrink: 0;
                display: flex;
                justify-content: center;
            }

            .bks-root[data-theme="dark"] .bks-search,
            .bks-root:not([data-theme]) .bks-search {
                width: 100%;
                max-width: 20em; /* 260px approx */
                padding: 0.8em 1.25em; /* 10px 16px */
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 1.5em;
                color: #ffffff;
                font-size: 13px; /* Font size stays 13px, everything else relative to it */
                outline: none;
                transition: all 0.2s;
                box-sizing: border-box;
            }
            .bks-root[data-theme="dark"] .bks-search::placeholder,
            .bks-root:not([data-theme]) .bks-search::placeholder {
                color: rgba(255, 255, 255, 0.5);
            }
            .bks-root[data-theme="dark"] .bks-search:focus,
            .bks-root:not([data-theme]) .bks-search:focus {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(100, 150, 255, 0.4);
                box-shadow: 0 0 0 2px rgba(100, 150, 255, 0.1);
            }

            .bks-root[data-theme="light"] .bks-search {
                width: 100%;
                max-width: 260px;
                padding: 10px 16px;
                background: rgba(255, 255, 255, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.5);
                border-radius: 20px;
                color: rgba(0, 0, 0, 0.8);
                font-size: 12px;
                outline: none;
                transition: all 0.2s;
                box-sizing: border-box;
            }
            .bks-root[data-theme="light"] .bks-search::placeholder {
                color: rgba(0, 0, 0, 0.45);
            }
            .bks-root[data-theme="light"] .bks-search:focus {
                background: rgba(255, 255, 255, 0.5);
                border-color: rgba(255, 255, 255, 0.7);
                box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
            }

            /* 书签列表 */
            .bks-list {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 0 12px 12px;
            }
            .bks-list::-webkit-scrollbar {
                width: 5px;
            }
            .bks-list::-webkit-scrollbar-track {
                background: transparent;
            }
            .bks-list::-webkit-scrollbar-thumb {
                background: var(--lg-scrollbar);
                border-radius: 3px;
            }
            .bks-list::-webkit-scrollbar-thumb:hover {
                background: var(--lg-btn-hover);
            }

            /* 书签项 - 紧凑卡片风格 */
            .bks-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 10px;
                background: var(--lg-item-bg);
                border-radius: 10px;
                border: 1px solid var(--lg-item-border);
                cursor: pointer;
                transition: all 0.15s ease;
                margin-bottom: 3px;
            }
            .bks-item:hover {
                background: var(--lg-item-hover);
                border-color: var(--lg-border-color);
            }

            /* ═══════════════════════════════════════════════════════
               浅色模式 - 书签项样式（参考插件样式A）
               ═══════════════════════════════════════════════════════ */
            .bks-root[data-theme="light"] .bks-item {
                background: rgba(255, 255, 255, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.4);
            }
            .bks-root[data-theme="light"] .bks-item:hover {
                background: rgba(255, 255, 255, 0.5);
                border-color: rgba(255, 255, 255, 0.6);
            }
            .bks-root[data-theme="light"] .bks-item-favicon {
                background: rgba(255, 255, 255, 0.5);
            }
            .bks-item-favicon {
                width: 18px;
                height: 18px;
                border-radius: 5px;
                object-fit: contain;
                flex-shrink: 0;
                background: var(--lg-btn-bg);
                padding: 2px;
            }
            .bks-item-title {
                flex: 1;
                color: var(--lg-text-primary);
                font-size: 12px;
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .bks-item-actions {
                display: none;
                gap: 4px;
            }
            .bks-item:hover .bks-item-actions {
                display: flex;
            }
            .bks-item-btn {
                width: 20px;
                height: 20px;
                border: none;
                background: var(--lg-btn-bg);
                border-radius: 6px;
                color: var(--lg-text-secondary);
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: all 0.15s;
            }
            .bks-item-btn:hover {
                background: var(--lg-btn-hover);
                color: var(--lg-text-primary);
            }
            .bks-item-btn.bks-drag {
                cursor: grab;
            }
            .bks-item-btn.bks-drag:active {
                cursor: grabbing;
            }
            .bks-item-btn svg {
                width: 10px;
                height: 10px;
            }

            /* 删除模式 */
            .bks-delete-mode .bks-item {
                cursor: pointer;
            }
            .bks-delete-mode .bks-item.bks-selected {
                background: var(--lg-danger-bg) !important;
                border-color: var(--lg-danger-bg) !important;
            }
            .bks-delete-mode .bks-item-actions {
                display: none !important;
            }
            .bks-delete-mode .bks-item-checkbox {
                display: flex !important;
            }
            .bks-item-checkbox {
                display: none;
                width: 18px;
                height: 18px;
                border: 2px solid var(--lg-text-secondary);
                border-radius: 50%;
                flex-shrink: 0;
                align-items: center;
                justify-content: center;
                transition: all 0.15s;
            }
            .bks-item.bks-selected .bks-item-checkbox {
                background: var(--lg-danger-color);
                border-color: var(--lg-danger-color);
            }
            .bks-item.bks-selected .bks-item-checkbox::after {
                content: '✓';
                color: white;
                font-size: 10px;
                font-weight: bold;
            }
            .bks-delete-bar {
                display: none;
                padding: 10px 16px;
                background: var(--lg-danger-weak-bg);
                border-bottom: 1px solid var(--lg-danger-bg);
                flex-shrink: 0;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
            }
            .bks-delete-bar.bks-show {
                display: flex;
            }
            .bks-delete-bar-text {
                font-size: 12px;
                color: var(--lg-danger-color);
            }
            .bks-delete-bar-actions {
                display: flex;
                gap: 8px;
            }
            .bks-delete-bar-btn {
                padding: 6px 12px;
                border: none;
                border-radius: 8px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.15s;
            }
            .bks-delete-bar-btn.bks-cancel {
                background: rgba(255, 255, 255, 0.15);
                color: var(--lg-text-primary);
            }
            .bks-delete-bar-btn.bks-confirm {
                background: var(--lg-danger-color);
                color: white;
            }
            .bks-delete-bar-btn:hover {
                transform: scale(1.03);
            }

            /* 拖拽状态 */
            .bks-item.bks-dragging {
                opacity: 0.5;
                transform: scale(0.98);
            }
            .bks-item.bks-drag-over {
                border-color: rgba(100, 150, 255, 0.6) !important;
                background: rgba(100, 150, 255, 0.1) !important;
            }

            /* 底部操作栏 */
            .bks-footer {
                padding: 10px 14px 14px;
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .bks-btn {
                width: 100%;
                padding: 10px;
                border: 1px solid var(--lg-input-border);
                border-radius: var(--lg-radius-sm);
                background: var(--lg-btn-bg);
                color: var(--lg-text-primary);
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }
            .bks-btn:hover {
                background: var(--lg-btn-hover);
            }
            .bks-btn svg {
                width: 12px;
                height: 12px;
                stroke: currentColor;
                fill: none;
                stroke-width: 2;
            }

            /* 模态框 */
            .bks-modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(8px);
                z-index: 2147483648;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: all 0.25s;
            }
            .bks-modal-overlay.bks-show {
                opacity: 1;
                visibility: visible;
            }
            .bks-modal {
                position: relative;
                width: 320px;
                max-width: 90vw;
                border-radius: var(--lg-radius);
                overflow: hidden;
                transform: scale(0.95);
                transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .bks-modal-overlay.bks-show .bks-modal {
                transform: scale(1);
            }
            .bks-modal-warp {
                position: absolute;
                inset: -30px;
                backdrop-filter: blur(20px) saturate(1.3);
                -webkit-backdrop-filter: blur(20px) saturate(1.3);
            }
            .bks-modal-bg {
                position: absolute;
                inset: 0;
                background: var(--lg-overlay-bg);
            }
            .bks-modal-border {
                position: absolute;
                inset: 0;
                border-radius: inherit;
                border: 1px solid var(--lg-overlay-border);
                pointer-events: none;
            }
            .bks-modal-content {
                position: relative;
                z-index: 10;
            }
            .bks-modal-header {
                padding: 18px 20px;
                font-size: 16px;
                font-weight: 600;
                color: var(--lg-text-primary);
                border-bottom: 1px solid var(--lg-divider-color);
            }
            .bks-modal-body {
                padding: 20px;
            }
            .bks-form-group {
                margin-bottom: 16px;
            }
            .bks-form-group:last-child {
                margin-bottom: 0;
            }
            .bks-label {
                display: block;
                font-size: 12px;
                font-weight: 500;
                color: var(--lg-text-secondary);
                margin-bottom: 8px;
            }
            .bks-input {
                width: 100%;
                padding: 10px 14px;
                background: var(--lg-input-bg);
                border: 1px solid var(--lg-input-border);
                border-radius: 12px;
                color: var(--lg-text-primary);
                font-size: 13px;
                outline: none;
                transition: all 0.2s;
                box-sizing: border-box;
            }
            .bks-input:focus {
                border-color: rgba(100, 150, 255, 0.4);
                box-shadow: 0 0 0 3px rgba(100, 150, 255, 0.15);
            }
            .bks-modal-footer {
                padding: 16px 20px;
                border-top: 1px solid var(--lg-divider-color);
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            .bks-modal-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 12px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .bks-modal-btn-cancel {
                background: rgba(255, 255, 255, 0.1);
                color: var(--lg-text-secondary);
                border: 1px solid var(--lg-divider-color);
            }
            .bks-root[data-theme="light"] .bks-modal-btn-cancel {
                background: rgba(255, 255, 255, 0.5);
                color: var(--lg-text-secondary);
                border: 1px solid rgba(255, 255, 255, 0.5);
            }
            .bks-modal-btn-cancel:hover {
                background: rgba(255, 255, 255, 0.15);
                color: var(--lg-text-primary);
            }
            .bks-root[data-theme="light"] .bks-modal-btn-cancel:hover {
                background: rgba(255, 255, 255, 0.7);
            }
            .bks-modal-btn-confirm {
                background: rgba(100, 150, 255, 0.3);
                color: #fff;
                border: 1px solid rgba(100, 150, 255, 0.4);
            }
            .bks-modal-btn-confirm:hover {
                background: rgba(100, 150, 255, 0.45);
                transform: scale(1.03);
            }

            /* 空状态 */
            .bks-empty {
                text-align: center;
                padding: 40px 20px;
                color: var(--lg-text-secondary);
            }
            .bks-empty-icon {
                font-size: 32px;
                margin-bottom: 12px;
                opacity: 0.5;
            }
            .bks-empty-text {
                font-size: 13px;
                line-height: 1.5;
            }

            /* 右键菜单 */
            .bks-context-menu {
                position: fixed;
                border-radius: 14px;
                overflow: hidden;
                min-width: 160px;
                z-index: 2147483649;
                opacity: 0;
                visibility: hidden;
                transform: scale(0.95);
                transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .bks-context-menu.bks-show {
                opacity: 1;
                visibility: visible;
                transform: scale(1);
            }
            .bks-context-warp {
                position: absolute;
                inset: -20px;
                backdrop-filter: blur(20px) saturate(1.3);
                -webkit-backdrop-filter: blur(20px) saturate(1.3);
            }
            .bks-context-bg {
                position: absolute;
                inset: 0;
                background: var(--lg-overlay-bg);
            }
            .bks-context-border {
                position: absolute;
                inset: 0;
                border-radius: inherit;
                border: 1px solid var(--lg-overlay-border);
                pointer-events: none;
            }
            .bks-context-content {
                position: relative;
                z-index: 10;
                padding: 6px;
            }
            .bks-context-item {
                padding: 10px 14px;
                border-radius: 10px;
                color: var(--lg-text-primary);
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 13px;
                transition: background 0.15s;
            }
            .bks-context-item:hover {
                background: var(--lg-menu-hover-bg);
            }
            .bks-context-item.bks-danger:hover {
                background: var(--lg-danger-bg);
                color: var(--lg-danger-color);
            }
            .bks-context-divider {
                height: 1px;
                background: var(--lg-divider-color);
                margin: 6px 0;
            }

            /* Toast */
            .bks-toast {
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                padding: 12px 24px;
                border-radius: 14px;
                overflow: hidden;
                z-index: 2147483650;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .bks-toast.bks-show {
                opacity: 1;
                visibility: visible;
                transform: translateX(-50%) translateY(0);
            }
            .bks-toast-warp {
                position: absolute;
                inset: -20px;
                backdrop-filter: blur(20px) saturate(1.3);
                -webkit-backdrop-filter: blur(20px) saturate(1.3);
            }
            .bks-toast-bg {
                position: absolute;
                inset: 0;
                background: var(--lg-overlay-bg);
            }
            .bks-toast-border {
                position: absolute;
                inset: 0;
                border-radius: inherit;
                border: 1px solid var(--lg-overlay-border);
                pointer-events: none;
            }
            .bks-toast-content {
                position: relative;
                z-index: 10;
                color: var(--lg-text-primary);
                font-size: 13px;
            }

            /* ═══════════════════════════════════════════════════════
               设置面板样式
               ═══════════════════════════════════════════════════════ */
            .bks-settings-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2147483648;
                opacity: 0;
                visibility: hidden;
                transition: all 0.25s ease;
            }
            .bks-settings-overlay.bks-show {
                opacity: 1;
                visibility: visible;
            }
            .bks-settings {
                position: relative;
                width: 320px;
                max-width: 90vw;
                border-radius: var(--lg-radius);
                overflow: hidden;
                transform: scale(0.95);
                transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .bks-settings-overlay.bks-show .bks-settings {
                transform: scale(1);
            }
            .bks-settings .bks-modal-content {
                position: relative;
                z-index: 10;
            }
            .bks-settings-section {
                margin-bottom: 16px;
            }
            .bks-settings-section:last-child {
                margin-bottom: 0;
            }
            .bks-settings-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--lg-text-primary);
                margin-bottom: 4px;
            }
            .bks-settings-desc {
                font-size: 12px;
                color: var(--lg-text-secondary);
                margin-bottom: 12px;
            }
            .bks-settings-divider {
                height: 1px;
                background: var(--lg-border-color);
                margin: 16px 0;
            }
            .bks-theme-options {
                display: flex;
                gap: 8px;
            }
            .bks-theme-btn {
                flex: 1;
                padding: 10px 8px;
                border: 1px solid var(--lg-btn-border);
                background: var(--lg-btn-bg);
                border-radius: 10px;
                color: var(--lg-text-primary);
                font-size: 12px;
                cursor: pointer;
                transition: all 0.15s ease;
            }
            .bks-theme-btn:hover {
                background: var(--lg-btn-hover);
            }
            .bks-theme-btn.bks-active {
                background: linear-gradient(135deg, #007AFF, #5856D6);
                border-color: transparent;
                color: #fff;
            }
            .bks-import-export {
                display: flex;
                gap: 8px;
            }
            .bks-settings-btn {
                flex: 1;
                padding: 10px 12px;
                border: 1px solid var(--lg-btn-border);
                background: var(--lg-btn-bg);
                border-radius: 10px;
                color: var(--lg-text-primary);
                font-size: 12px;
                cursor: pointer;
                transition: all 0.15s ease;
            }
            .bks-settings-btn:hover {
                background: var(--lg-btn-hover);
            }
        `;
        document.head.appendChild(style);
    };

    // ========== 主类 ==========
    class BookmarkSidebar {
        constructor() {
            this.bookmarks = this.loadBookmarks();
            this.isVisible = false;
            this.hideTimeout = null;
            this.searchQuery = '';
            this.editingItem = null;
            this.init();
        }

        init() {
            injectStyles();
            this.createTrigger();
            this.createSidebar();
            this.createModal();
            this.createContextMenu();
            this.createToast();
            this.createSettingsPanel();
            this.bindEvents();
            this.initZoomCompensation();
        }

        // 缩放补偿：让侧边栏始终保持100%大小
        initZoomCompensation() {
            this.applyZoomCompensation();
            window.addEventListener('resize', () => this.applyZoomCompensation());
            setInterval(() => this.applyZoomCompensation(), 1000);
        }

        applyZoomCompensation() {
            // Safari中检测页面缩放的可靠方式
            let pageZoom = 1;

            // 方法1: 使用visualViewport（Safari支持）
            if (window.visualViewport) {
                pageZoom = window.visualViewport.scale;
            }

            // 方法2: outerWidth / innerWidth（但要排除工具栏影响）
            // Safari全屏时 outerWidth === innerWidth
            if (pageZoom === 1 && window.outerWidth && window.innerWidth) {
                const ratio = window.outerWidth / window.innerWidth;
                // 只有明显的缩放才处理（排除工具栏等微小差异）
                if (ratio > 1.05 || ratio < 0.95) {
                    pageZoom = ratio;
                }
            }

            // 只有当页面真正被缩放时才补偿
            if (Math.abs(pageZoom - 1) > 0.05) {
                const scale = 1 / pageZoom;
                document.querySelectorAll('.bks-root').forEach(el => {
                    el.style.zoom = scale;
                });
                if (this.trigger) {
                    this.trigger.style.zoom = scale;
                }
            } else {
                // 100%缩放时确保zoom为1
                document.querySelectorAll('.bks-root').forEach(el => {
                    el.style.zoom = 1;
                });
                if (this.trigger) {
                    this.trigger.style.zoom = 1;
                }
            }
        }

        loadBookmarks() {
            try {
                const data = localStorage.getItem(CONFIG.storageKey);
                return data ? JSON.parse(data) : DEFAULT_BOOKMARKS;
            } catch {
                return DEFAULT_BOOKMARKS;
            }
        }

        saveBookmarks() {
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(this.bookmarks));
        }

        generateId() {
            return 'bm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        createTrigger() {
            this.trigger = document.createElement('div');
            this.trigger.className = 'bks-trigger';
            document.body.appendChild(this.trigger);
        }

        createSidebar() {
            this.sidebar = document.createElement('div');
            this.sidebar.className = 'bks-sidebar bks-root notranslate';
            this.sidebar.setAttribute('translate', 'no');
            this.sidebar.innerHTML = `
                <div class="bks-glass">
                    <div class="bks-glass-warp"></div>
                    <div class="bks-glass-bg"></div>
                    <div class="bks-glass-border"></div>
                    <div class="bks-glass-highlight"></div>
                    <div class="bks-glass-content">
                        <div class="bks-header">
                            <div class="bks-title">书签</div>
                            <div class="bks-header-actions">
                                <div class="bks-btn-icon" data-action="delete-mode" title="删除书签" role="button">
                                    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </div>
                                <div role="button" class="bks-btn-icon" data-action="settings" title="设置">
                                    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                                </div>
                                <div class="bks-btn-icon" data-action="close" title="关闭" role="button">
                                    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </div>
                            </div>
                        </div>
                        <div class="bks-delete-bar">
                            <span class="bks-delete-bar-text">已选择 <span class="bks-delete-count">0</span> 个书签</span>
                            <div class="bks-delete-bar-actions">
                                <button class="bks-delete-bar-btn bks-cancel">取消</button>
                                <button class="bks-delete-bar-btn bks-confirm">删除</button>
                            </div>
                        </div>
                        <div class="bks-search-wrap">
                            <input type="text" class="bks-search" placeholder="搜索书签...">
                        </div>
                        <div class="bks-list"></div>
                        <div class="bks-footer">
                            <div class="bks-btn" data-action="add-current" role="button">
                                <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                添加当前页
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(this.sidebar);
            this.listEl = this.sidebar.querySelector('.bks-list');
            this.searchInput = this.sidebar.querySelector('.bks-search');
            this.renderBookmarks();
        }

        createModal() {
            this.modalOverlay = document.createElement('div');
            this.modalOverlay.className = 'bks-modal-overlay bks-root notranslate';
            this.modalOverlay.setAttribute('translate', 'no');
            this.modalOverlay.innerHTML = `
                <div class="bks-modal">
                    <div class="bks-modal-warp"></div>
                    <div class="bks-modal-bg"></div>
                    <div class="bks-modal-border"></div>
                    <div class="bks-modal-content">
                        <div class="bks-modal-header">添加书签</div>
                        <div class="bks-modal-body">
                            <div class="bks-form-group">
                                <label class="bks-label">标题</label>
                                <input type="text" class="bks-input" id="bks-title-input" placeholder="输入标题">
                            </div>
                            <div class="bks-form-group bks-url-group">
                                <label class="bks-label">网址</label>
                                <input type="text" class="bks-input" id="bks-url-input" placeholder="https://...">
                            </div>
                        </div>
                        <div class="bks-modal-footer">
                            <div class="bks-modal-btn bks-modal-btn-cancel" role="button">取消</div>
                            <div class="bks-modal-btn bks-modal-btn-confirm" role="button">确定</div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(this.modalOverlay);
        }

        createSettingsPanel() {
            this.settingsPanel = document.createElement('div');
            this.settingsPanel.className = 'bks-settings-overlay bks-root notranslate';
            this.settingsPanel.setAttribute('translate', 'no');
            this.settingsPanel.innerHTML = `
                <div class="bks-settings">
                    <div class="bks-glass-warp"></div>
                    <div class="bks-glass-bg"></div>
                    <div class="bks-glass-border"></div>
                    <div class="bks-glass-highlight"></div>
                    <div class="bks-modal-content">
                        <div class="bks-modal-header">设置</div>
                        <div class="bks-modal-body">
                            <div class="bks-settings-section">
                                <div class="bks-settings-title">主题样式</div>
                                <div class="bks-settings-desc">为当前网站选择主题</div>
                                <div class="bks-theme-options">
                                    <button class="bks-theme-btn" data-theme="auto">自动</button>
                                    <button class="bks-theme-btn" data-theme="light">浅色</button>
                                    <button class="bks-theme-btn" data-theme="dark">深色</button>
                                </div>
                            </div>
                            <div class="bks-settings-divider"></div>
                            <div class="bks-settings-section">
                                <div class="bks-settings-title">数据管理</div>
                                <div class="bks-settings-desc">导入或导出书签</div>
                                <div class="bks-import-export">
                                    <button class="bks-settings-btn" data-action="export">导出书签</button>
                                    <button class="bks-settings-btn" data-action="import">导入书签</button>
                                </div>
                                <input type="file" id="bks-import-file" accept=".json" style="display:none">
                            </div>
                        </div>
                        <div class="bks-modal-footer">
                            <button class="bks-modal-btn bks-modal-btn-cancel">关闭</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(this.settingsPanel);

            // 绑定设置面板事件
            this.bindSettingsEvents();
        }

        bindSettingsEvents() {
            // 主题选择
            this.settingsPanel.querySelectorAll('.bks-theme-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const theme = btn.dataset.theme;
                    this.setThemePreference(theme);
                    this.updateThemeButtons();
                    this.hideSettings();
                });
            });

            // 导出书签
            this.settingsPanel.querySelector('[data-action="export"]').addEventListener('click', () => {
                this.exportBookmarks();
            });

            // 导入书签
            this.settingsPanel.querySelector('[data-action="import"]').addEventListener('click', () => {
                this.settingsPanel.querySelector('#bks-import-file').click();
            });

            this.settingsPanel.querySelector('#bks-import-file').addEventListener('change', (e) => {
                this.importBookmarks(e);
            });

            // 关闭按钮
            this.settingsPanel.querySelector('.bks-modal-btn-cancel').addEventListener('click', () => {
                this.hideSettings();
            });

            // 点击背景关闭
            this.settingsPanel.addEventListener('click', (e) => {
                if (e.target === this.settingsPanel) {
                    this.hideSettings();
                }
            });
        }

        setThemePreference(theme) {
            const domain = window.location.hostname;
            const prefs = this.getThemePreferences();
            prefs[domain] = theme;

            // 使用 GM 存储（比 localStorage 更可靠）
            try {
                GM_setValue('bks_theme_prefs', JSON.stringify(prefs));
            } catch {
                localStorage.setItem('bks_theme_prefs', JSON.stringify(prefs));
            }

            if (theme === 'auto') {
                // 自动模式：启动实时检测
                this.startRealtimeThemeDetection();
            } else {
                // 固定主题：停止自动检测，直接应用
                this.stopRealtimeThemeDetection();
                this.currentTheme = theme;
                this.applyTheme(theme);
            }

            this.showToast(`已设置为${theme === 'auto' ? '自动' : theme === 'light' ? '浅色' : '深色'}主题`);
        }

        getThemePreferences() {
            try {
                // 优先使用 GM 存储
                const gmValue = GM_getValue('bks_theme_prefs', null);
                if (gmValue) {
                    return JSON.parse(gmValue);
                }
                return JSON.parse(localStorage.getItem('bks_theme_prefs') || '{}');
            } catch {
                return {};
            }
        }

        getCurrentThemePreference() {
            const domain = window.location.hostname;
            return this.getThemePreferences()[domain] || 'auto';
        }

        updateThemeButtons() {
            const current = this.getCurrentThemePreference();
            this.settingsPanel.querySelectorAll('.bks-theme-btn').forEach(btn => {
                btn.classList.toggle('bks-active', btn.dataset.theme === current);
            });
        }

        showSettings() {
            this.updateThemeButtons();
            this.settingsPanel.classList.add('bks-show');
            // 应用当前主题到设置面板
            this.settingsPanel.setAttribute('data-theme', this.currentTheme);
        }

        hideSettings() {
            this.settingsPanel.classList.remove('bks-show');
        }

        exportBookmarks() {
            const data = JSON.stringify(this.bookmarks, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `书签备份_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showToast('书签已导出');
        }

        importBookmarks(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (Array.isArray(data)) {
                        this.bookmarks = data;
                        this.saveBookmarks();
                        this.renderBookmarks();
                        this.showToast(`已导入 ${data.length} 个书签`);
                    } else {
                        this.showToast('文件格式错误');
                    }
                } catch {
                    this.showToast('导入失败：无效的JSON文件');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        }

        createContextMenu() {
            this.contextMenu = document.createElement('div');
            this.contextMenu.className = 'bks-context-menu bks-root notranslate';
            this.contextMenu.setAttribute('translate', 'no');
            this.contextMenu.innerHTML = `
                <div class="bks-context-warp"></div>
                <div class="bks-context-bg"></div>
                <div class="bks-context-border"></div>
                <div class="bks-context-content">
                    <div class="bks-context-item" data-action="open">→ 新标签页打开</div>
                    <div class="bks-context-divider"></div>
                    <div class="bks-context-item" data-action="edit">✎ 编辑</div>
                    <div class="bks-context-item" data-action="copy">⎘ 复制链接</div>
                    <div class="bks-context-divider"></div>
                    <div class="bks-context-item bks-danger" data-action="delete">✕ 删除</div>
                </div>
            `;
            document.body.appendChild(this.contextMenu);
        }

        createToast() {
            this.toast = document.createElement('div');
            this.toast.className = 'bks-toast bks-root notranslate';
            this.toast.setAttribute('translate', 'no');
            this.toast.innerHTML = `
                <div class="bks-toast-warp"></div>
                <div class="bks-toast-bg"></div>
                <div class="bks-toast-border"></div>
                <div class="bks-toast-content"></div>
            `;
            document.body.appendChild(this.toast);
        }

        showToast(message) {
            this.toast.querySelector('.bks-toast-content').textContent = message;
            this.toast.classList.add('bks-show');
            clearTimeout(this.toastTimer);
            this.toastTimer = setTimeout(() => {
                this.toast.classList.remove('bks-show');
            }, 2000);
        }

        renderBookmarks() {
            const query = this.searchQuery.toLowerCase();

            if (this.bookmarks.length === 0) {
                this.listEl.innerHTML = `
                    <div class="bks-empty">
                        <div class="bks-empty-icon">∅</div>
                        <div class="bks-empty-text">还没有书签<br>点击下方按钮添加</div>
                    </div>
                `;
                return;
            }

            let html = '';
            this.bookmarks.forEach(item => {
                if (item.type !== 'bookmark') return;
                if (query && !item.title.toLowerCase().includes(query) && !item.url.toLowerCase().includes(query)) {
                    return;
                }
                const favicon = item.favicon || `https://www.google.com/s2/favicons?sz=32&domain=${new URL(item.url).hostname}`;
                html += `
                    <div class="bks-item" data-id="${item.id}" data-url="${this.escapeHtml(item.url)}" draggable="true">
                        <div class="bks-item-checkbox"></div>
                        <img class="bks-item-favicon" src="${favicon}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><rect fill=%22%23555%22 width=%2216%22 height=%2216%22 rx=%224%22/><text x=%228%22 y=%2212%22 font-size=%2210%22 fill=%22white%22 text-anchor=%22middle%22>${item.title.charAt(0).toUpperCase()}</text></svg>'">
                        <span class="bks-item-title">${this.escapeHtml(item.title)}</span>
                        <div class="bks-item-actions">
                            <div class="bks-item-btn" data-action="edit" title="编辑" role="button">
                                <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </div>
                            <div class="bks-item-btn bks-drag" data-action="drag" title="拖拽排序" role="button">
                                <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/></svg>
                            </div>
                        </div>
                    </div>
                `;
            });

            this.listEl.innerHTML = html || `
                <div class="bks-empty">
                    <div class="bks-empty-icon">🔍</div>
                    <div class="bks-empty-text">没有找到匹配的书签</div>
                </div>
            `;

            // 渲染完成后重新应用主题，确保新图标正确显示
            if (this.currentTheme) {
                this.applyTheme(this.currentTheme);
            }
        }

        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        bindEvents() {
            // 删除模式状态
            this.deleteMode = false;
            this.selectedForDelete = new Set();

            // 触发区域
            this.trigger.addEventListener('mouseenter', () => this.show());

            // 侧边栏悬停
            this.sidebar.addEventListener('mouseenter', () => {
                if (this.hideTimeout) {
                    clearTimeout(this.hideTimeout);
                    this.hideTimeout = null;
                }
            });
            this.sidebar.addEventListener('mouseleave', () => {
                this.hideTimeout = setTimeout(() => this.hide(), CONFIG.autoHideDelay);
            });

            // 搜索
            this.searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.renderBookmarks();
            });

            // 书签点击
            this.listEl.addEventListener('click', (e) => {
                const item = e.target.closest('.bks-item');
                const actionBtn = e.target.closest('[data-action]');

                // 删除模式下的点击处理
                if (this.deleteMode && item) {
                    e.preventDefault();
                    e.stopPropagation();
                    const id = item.dataset.id;
                    if (this.selectedForDelete.has(id)) {
                        this.selectedForDelete.delete(id);
                        item.classList.remove('bks-selected');
                    } else {
                        this.selectedForDelete.add(id);
                        item.classList.add('bks-selected');
                    }
                    this.updateDeleteCount();
                    return;
                }

                if (actionBtn && item) {
                    e.stopPropagation();
                    if (actionBtn.dataset.action === 'drag') return; // 拖拽按钮不处理点击
                    this.handleItemAction(actionBtn.dataset.action, item.dataset.id);
                    return;
                }

                if (item && item.dataset.url) {
                    e.preventDefault();
                    e.stopPropagation();
                    const link = document.createElement('a');
                    link.href = item.dataset.url;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.click();
                }
            });

            // 拖拽排序
            this.listEl.addEventListener('dragstart', (e) => {
                const item = e.target.closest('.bks-item');
                if (item && !this.deleteMode) {
                    this.draggedItem = item;
                    item.classList.add('bks-dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', item.dataset.id);
                }
            });

            this.listEl.addEventListener('dragend', (e) => {
                const item = e.target.closest('.bks-item');
                if (item) {
                    item.classList.remove('bks-dragging');
                    this.draggedItem = null;
                }
                this.listEl.querySelectorAll('.bks-item').forEach(el => el.classList.remove('bks-drag-over'));
            });

            this.listEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                const item = e.target.closest('.bks-item');
                if (item && item !== this.draggedItem) {
                    this.listEl.querySelectorAll('.bks-item').forEach(el => el.classList.remove('bks-drag-over'));
                    item.classList.add('bks-drag-over');
                }
            });

            this.listEl.addEventListener('drop', (e) => {
                e.preventDefault();
                const targetItem = e.target.closest('.bks-item');
                if (targetItem && this.draggedItem && targetItem !== this.draggedItem) {
                    const draggedId = this.draggedItem.dataset.id;
                    const targetId = targetItem.dataset.id;

                    const draggedIdx = this.bookmarks.findIndex(b => b.id === draggedId);
                    const targetIdx = this.bookmarks.findIndex(b => b.id === targetId);

                    if (draggedIdx !== -1 && targetIdx !== -1) {
                        const [removed] = this.bookmarks.splice(draggedIdx, 1);
                        this.bookmarks.splice(targetIdx, 0, removed);
                        this.saveBookmarks();
                        this.renderBookmarks();
                        this.showToast('顺序已调整');
                    }
                }
                this.listEl.querySelectorAll('.bks-item').forEach(el => el.classList.remove('bks-drag-over'));
            });

            // 右键菜单
            this.listEl.addEventListener('contextmenu', (e) => {
                if (this.deleteMode) return; // 删除模式下禁用右键菜单
                const item = e.target.closest('.bks-item');
                if (item) {
                    e.preventDefault();
                    this.showContextMenu(e.clientX, e.clientY, item.dataset.id);
                }
            });

            document.addEventListener('click', () => {
                this.contextMenu.classList.remove('bks-show');
            });

            this.contextMenu.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]')?.dataset.action;
                if (action && this.contextMenuItemId) {
                    this.handleItemAction(action, this.contextMenuItemId);
                    this.contextMenu.classList.remove('bks-show');
                }
            });

            // 头部按钮
            this.sidebar.querySelector('.bks-header-actions').addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action]');
                if (btn) {
                    if (btn.dataset.action === 'close') this.hide();
                    if (btn.dataset.action === 'settings') this.showSettings();
                    if (btn.dataset.action === 'delete-mode') this.enterDeleteMode();
                }
            });

            // 删除栏按钮
            this.sidebar.querySelector('.bks-delete-bar').addEventListener('click', (e) => {
                if (e.target.classList.contains('bks-cancel')) {
                    this.exitDeleteMode();
                }
                if (e.target.classList.contains('bks-confirm')) {
                    this.confirmBatchDelete();
                }
            });

            // 底部按钮
            this.sidebar.querySelector('.bks-footer').addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action]');
                if (btn && btn.dataset.action === 'add-current') {
                    this.showAddBookmarkModal();
                }
            });

            // 模态框
            this.modalOverlay.addEventListener('click', (e) => {
                if (e.target === this.modalOverlay) this.hideModal();
                if (e.target.classList.contains('bks-modal-btn-cancel')) this.hideModal();
                if (e.target.classList.contains('bks-modal-btn-confirm')) this.confirmModal();
            });

            // 初始化主题
            this.initTheme();
        }

        enterDeleteMode() {
            this.deleteMode = true;
            this.selectedForDelete.clear();
            this.listEl.classList.add('bks-delete-mode');
            this.sidebar.querySelector('.bks-delete-bar').classList.add('bks-show');
            this.updateDeleteCount();
        }

        exitDeleteMode() {
            this.deleteMode = false;
            this.selectedForDelete.clear();
            this.listEl.classList.remove('bks-delete-mode');
            this.sidebar.querySelector('.bks-delete-bar').classList.remove('bks-show');
            this.listEl.querySelectorAll('.bks-item.bks-selected').forEach(el => el.classList.remove('bks-selected'));
        }

        updateDeleteCount() {
            this.sidebar.querySelector('.bks-delete-count').textContent = this.selectedForDelete.size;
        }

        confirmBatchDelete() {
            if (this.selectedForDelete.size === 0) {
                this.showToast('请先选择要删除的书签');
                return;
            }
            const count = this.selectedForDelete.size;
            this.selectedForDelete.forEach(id => {
                const idx = this.bookmarks.findIndex(b => b.id === id);
                if (idx !== -1) this.bookmarks.splice(idx, 1);
            });
            this.saveBookmarks();
            this.exitDeleteMode();
            this.renderBookmarks();
            this.showToast(`已删除 ${count} 个书签`);
        }

        initTheme() {
            // 检查用户是否为当前网站设置了主题偏好
            const preference = this.getCurrentThemePreference();

            if (preference === 'auto') {
                // 自动模式：使用实时检测
                this.startRealtimeThemeDetection();
            } else {
                // 用户指定了固定主题
                this.currentTheme = preference;
                this.applyTheme(preference);
            }
        }

        startRealtimeThemeDetection() {
            // 先停止已有的检测，避免重复
            this.stopRealtimeThemeDetection();

            // 初次检测
            this.detectAndApplyTheme();

            // 使用 MutationObserver 监听 DOM 变化
            this.themeObserver = new MutationObserver(() => {
                this.detectAndApplyTheme();
            });
            this.themeObserver.observe(document.body, {
                attributes: true,
                attributeFilter: ['style', 'class'],
                childList: false,
                subtree: false
            });

            // 监听系统主题变化
            if (window.matchMedia) {
                const mql = window.matchMedia('(prefers-color-scheme: light)');
                this.themeMediaQueryHandler = () => this.detectAndApplyTheme();
                if (mql.addEventListener) {
                    mql.addEventListener('change', this.themeMediaQueryHandler);
                } else if (mql.addListener) {
                    mql.addListener(this.themeMediaQueryHandler);
                }
            }

            // 定时采样（每500ms），确保动态页面也能正确响应
            this.themeInterval = setInterval(() => {
                this.detectAndApplyTheme();
            }, 500);

            // 监听滚动事件（节流处理）
            this.themeScrollHandler = () => {
                if (this.scrollTimeout) return;
                this.scrollTimeout = setTimeout(() => {
                    this.detectAndApplyTheme();
                    this.scrollTimeout = null;
                }, 100);
            };
            window.addEventListener('scroll', this.themeScrollHandler, { passive: true });
        }

        stopRealtimeThemeDetection() {
            // 停止 MutationObserver
            if (this.themeObserver) {
                this.themeObserver.disconnect();
                this.themeObserver = null;
            }

            // 停止定时器
            if (this.themeInterval) {
                clearInterval(this.themeInterval);
                this.themeInterval = null;
            }

            // 移除滚动监听
            if (this.themeScrollHandler) {
                window.removeEventListener('scroll', this.themeScrollHandler);
                this.themeScrollHandler = null;
            }

            // 移除媒体查询监听
            if (this.themeMediaQueryHandler && window.matchMedia) {
                const mql = window.matchMedia('(prefers-color-scheme: light)');
                if (mql.removeEventListener) {
                    mql.removeEventListener('change', this.themeMediaQueryHandler);
                } else if (mql.removeListener) {
                    mql.removeListener(this.themeMediaQueryHandler);
                }
                this.themeMediaQueryHandler = null;
            }

            // 清理滚动timeout
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
                this.scrollTimeout = null;
            }
        }

        detectAndApplyTheme() {
            // 如果用户选择了固定主题，则不进行自动检测
            const preference = this.getCurrentThemePreference();
            if (preference !== 'auto') {
                return;
            }

            const sampleX = CONFIG.position === 'left' ? 150 : window.innerWidth - 150;
            const sampleY = window.innerHeight / 2;

            const elements = document.elementsFromPoint(sampleX, sampleY);
            let bgColor = null;

            for (const el of elements) {
                if (el.closest('.bks-root') || el.closest('.bks-trigger')) continue;

                const style = window.getComputedStyle(el);
                const bg = style.backgroundColor;

                if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') continue;

                bgColor = bg;
                break;
            }

            // 兜底：检查 body 和 html 的背景色
            if (!bgColor || bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)') {
                bgColor = window.getComputedStyle(document.body).backgroundColor;
            }
            if (!bgColor || bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)') {
                bgColor = window.getComputedStyle(document.documentElement).backgroundColor;
            }

            // 如果还是透明，使用系统主题偏好，或默认浅色
            let brightness;
            if (!bgColor || bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)') {
                // 使用系统主题偏好
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    brightness = 50; // 当作深色
                } else {
                    brightness = 200; // 当作浅色（默认）
                }
            } else {
                brightness = this.getColorBrightness(bgColor);
            }

            const newTheme = brightness > 128 ? 'light' : 'dark';

            // 每次都强制应用主题，确保所有图标状态正确
            this.currentTheme = newTheme;
            this.applyTheme(newTheme);
        }

        getColorBrightness(color) {
            if (!color) {
                try {
                    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 230 : 30;
                } catch {
                    return 128;
                }
            }

            const c = color.trim().toLowerCase();
            if (c === 'transparent' || c === 'rgba(0, 0, 0, 0)') {
                try {
                    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 230 : 30;
                } catch {
                    return 128;
                }
            }

            const match = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
                const r = parseInt(match[1], 10);
                const g = parseInt(match[2], 10);
                const b = parseInt(match[3], 10);
                return (r * 299 + g * 587 + b * 114) / 1000;
            }

            return 128;
        }

        applyTheme(theme) {
            // 设置 data-theme 属性，CSS filter 会自动处理图标颜色反转
            document.querySelectorAll('.bks-root').forEach(el => {
                el.setAttribute('data-theme', theme);
            });
        }

        show() {
            this.isVisible = true;
            this.sidebar.classList.add('bks-visible');
            if (this.hideTimeout) {
                clearTimeout(this.hideTimeout);
                this.hideTimeout = null;
            }
            // 每次显示时强制刷新主题，确保图标正确
            this.detectAndApplyTheme();
        }

        hide() {
            this.isVisible = false;
            this.sidebar.classList.remove('bks-visible');
        }

        showContextMenu(x, y, itemId) {
            this.contextMenuItemId = itemId;
            this.contextMenu.style.left = `${x}px`;
            this.contextMenu.style.top = `${y}px`;
            this.contextMenu.classList.add('bks-show');
        }

        handleItemAction(action, itemId) {
            const item = this.bookmarks.find(b => b.id === itemId);
            if (!item) return;

            switch (action) {
                case 'open':
                    window.open(item.url, '_blank');
                    break;
                case 'edit':
                    this.showEditModal(item);
                    break;
                case 'copy':
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(item.url).then(
                            () => this.showToast('链接已复制'),
                            () => this.showToast('复制失败')
                        );
                    } else {
                        const ta = document.createElement('textarea');
                        ta.value = item.url;
                        document.body.appendChild(ta);
                        ta.select();
                        try {
                            document.execCommand('copy');
                            this.showToast('链接已复制');
                        } catch {
                            this.showToast('复制失败');
                        }
                        document.body.removeChild(ta);
                    }
                    break;
                case 'delete':
                    this.deleteItem(itemId);
                    break;
            }
        }

        deleteItem(id) {
            const idx = this.bookmarks.findIndex(b => b.id === id);
            if (idx !== -1) {
                this.bookmarks.splice(idx, 1);
                this.saveBookmarks();
                this.renderBookmarks();
                this.showToast('已删除');
            }
        }

        showAddBookmarkModal() {
            this.modalMode = 'add';
            this.modalOverlay.querySelector('.bks-modal-header').textContent = '添加书签';
            this.modalOverlay.querySelector('#bks-title-input').value = document.title;
            this.modalOverlay.querySelector('#bks-url-input').value = window.location.href;
            this.modalOverlay.classList.add('bks-show');
        }

        showEditModal(item) {
            this.modalMode = 'edit';
            this.editingItem = item;
            this.modalOverlay.querySelector('.bks-modal-header').textContent = '编辑书签';
            this.modalOverlay.querySelector('#bks-title-input').value = item.title;
            this.modalOverlay.querySelector('#bks-url-input').value = item.url;
            this.modalOverlay.classList.add('bks-show');
        }

        hideModal() {
            this.modalOverlay.classList.remove('bks-show');
            this.editingItem = null;
        }

        confirmModal() {
            const title = this.modalOverlay.querySelector('#bks-title-input').value.trim();
            const url = this.modalOverlay.querySelector('#bks-url-input').value.trim();

            if (!title || !url) {
                this.showToast('请填写完整');
                return;
            }

            if (this.modalMode === 'add') {
                this.bookmarks.unshift({
                    id: this.generateId(),
                    type: 'bookmark',
                    title,
                    url,
                    favicon: ''
                });
                this.showToast('书签已添加');
            } else if (this.modalMode === 'edit' && this.editingItem) {
                this.editingItem.title = title;
                this.editingItem.url = url;
                this.showToast('已保存');
            }

            this.saveBookmarks();
            this.renderBookmarks();
            this.hideModal();
        }
    }

    // ========== 启动 ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new BookmarkSidebar());
    } else {
        new BookmarkSidebar();
    }
})();