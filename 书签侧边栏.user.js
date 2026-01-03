// ==UserScript==
// @name         书签侧边栏
// @namespace    https://github.com/user/bookmark-sidebar
// @version      3.1.0
// @description  Safari侧边栏书签管理器 - Liquid Glass UI
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
        triggerWidth: 8,
        sidebarWidth: 300,
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
               Liquid Glass 变量 - 深色主题（默认）
               ═══════════════════════════════════════════════════════ */
            .bks-root, .bks-root[data-theme="dark"] {
                --lg-blur: 12px;
                --lg-saturation: 1.2;
                --lg-brightness: 1.05;
                --lg-bg-opacity: 0.15;
                --lg-border-opacity: 0.3;
                --lg-radius: 24px;
                --lg-radius-sm: 12px;
                --lg-text-primary: #fff;
                --lg-text-secondary: rgba(255, 255, 255, 0.6);
                --lg-panel-bg: rgba(20, 20, 35, var(--lg-bg-opacity));
                --lg-border-color: rgba(255, 255, 255, var(--lg-border-opacity));
                --lg-highlight-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
                --lg-item-bg: rgba(255, 255, 255, 0.05);
                --lg-item-hover: rgba(255, 255, 255, 0.1);
                --lg-item-border: rgba(255, 255, 255, 0.06);
                --lg-btn-bg: rgba(255, 255, 255, 0.12);
                --lg-btn-hover: rgba(255, 255, 255, 0.2);
                --lg-input-bg: rgba(255, 255, 255, 0.06);
                --lg-input-border: rgba(255, 255, 255, 0.1);
                --lg-scrollbar: rgba(255, 255, 255, 0.12);
            }

            /* 浅色主题 */
            .bks-root[data-theme="light"] {
                --lg-blur: 16px;
                --lg-saturation: 1.1;
                --lg-brightness: 1.0;
                --lg-bg-opacity: 0.25;
                --lg-border-opacity: 0.5;
                --lg-text-primary: rgba(0, 0, 0, 0.85);
                --lg-text-secondary: rgba(0, 0, 0, 0.55);
                --lg-panel-bg: rgba(255, 255, 255, var(--lg-bg-opacity));
                --lg-border-color: rgba(255, 255, 255, var(--lg-border-opacity));
                --lg-highlight-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, transparent 50%);
                --lg-item-bg: rgba(255, 255, 255, 0.35);
                --lg-item-hover: rgba(255, 255, 255, 0.5);
                --lg-item-border: rgba(255, 255, 255, 0.4);
                --lg-btn-bg: rgba(255, 255, 255, 0.45);
                --lg-btn-hover: rgba(255, 255, 255, 0.6);
                --lg-input-bg: rgba(255, 255, 255, 0.4);
                --lg-input-border: rgba(255, 255, 255, 0.5);
                --lg-scrollbar: rgba(0, 0, 0, 0.15);
            }

            /* 触发区域 */
            .bks-trigger {
                position: fixed;
                top: 0;
                ${CONFIG.position}: 0;
                width: ${CONFIG.triggerWidth}px;
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
            .bks-btn-icon {
                width: 28px;
                height: 28px;
                border: 1px solid rgba(255, 255, 255, 0.15);
                background: var(--lg-btn-bg);
                border-radius: 10px;
                color: var(--lg-text-secondary);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .bks-btn-icon:hover {
                background: rgba(255, 255, 255, 0.25);
                color: var(--lg-text-primary);
                transform: scale(1.05);
            }
            .bks-btn-icon svg {
                width: 14px;
                height: 14px;
                stroke: currentColor;
                fill: none;
                stroke-width: 2;
            }

            /* 搜索框 */
            .bks-search-wrap {
                padding: 0 16px 12px;
                flex-shrink: 0;
            }
            .bks-search {
                width: 100%;
                padding: 10px 16px;
                background: var(--lg-input-bg);
                border: 1px solid var(--lg-input-border);
                border-radius: 20px;
                color: var(--lg-text-primary);
                font-size: 12px;
                outline: none;
                transition: all 0.2s;
                box-sizing: border-box;
            }
            .bks-search::placeholder {
                color: var(--lg-text-secondary);
            }
            .bks-search:focus {
                background: var(--lg-item-hover);
                border-color: rgba(100, 150, 255, 0.4);
                box-shadow: 0 0 0 2px rgba(100, 150, 255, 0.1);
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
                align-items: center;
                justify-content: center;
                transition: all 0.15s;
            }
            .bks-item-btn:hover {
                background: var(--lg-btn-hover);
                color: var(--lg-text-primary);
            }
            .bks-item-btn.bks-delete:hover {
                background: rgba(255, 80, 80, 0.25);
                color: #ff6b6b;
            }
            .bks-item-btn svg {
                width: 10px;
                height: 10px;
                stroke: currentColor;
                fill: none;
                stroke-width: 2;
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

            /* 主题切换按钮组 */
            .bks-theme-switcher {
                display: flex;
                gap: 2px;
                padding: 3px;
                background: var(--lg-input-bg);
                border-radius: 10px;
                border: 1px solid var(--lg-input-border);
            }
            .bks-theme-btn {
                flex: 1;
                padding: 5px 8px;
                border: none;
                background: transparent;
                color: var(--lg-text-secondary);
                font-size: 11px;
                cursor: pointer;
                border-radius: 7px;
                transition: all 0.15s;
            }
            .bks-theme-btn:hover {
                color: var(--lg-text-primary);
            }
            .bks-theme-btn.active {
                background: var(--lg-btn-bg);
                color: var(--lg-text-primary);
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
                background: rgba(30, 30, 50, 0.6);
            }
            .bks-modal-border {
                position: absolute;
                inset: 0;
                border-radius: inherit;
                border: 1px solid rgba(255, 255, 255, 0.2);
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
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.12);
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
                border-top: 1px solid rgba(255, 255, 255, 0.1);
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
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .bks-modal-btn-cancel:hover {
                background: rgba(255, 255, 255, 0.15);
                color: var(--lg-text-primary);
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
                background: rgba(30, 30, 50, 0.7);
            }
            .bks-context-border {
                position: absolute;
                inset: 0;
                border-radius: inherit;
                border: 1px solid rgba(255, 255, 255, 0.15);
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
                background: rgba(255, 255, 255, 0.12);
            }
            .bks-context-item.bks-danger:hover {
                background: rgba(255, 80, 80, 0.2);
                color: #ff6b6b;
            }
            .bks-context-divider {
                height: 1px;
                background: rgba(255, 255, 255, 0.1);
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
                background: rgba(30, 30, 50, 0.7);
            }
            .bks-toast-border {
                position: absolute;
                inset: 0;
                border-radius: inherit;
                border: 1px solid rgba(255, 255, 255, 0.15);
                pointer-events: none;
            }
            .bks-toast-content {
                position: relative;
                z-index: 10;
                color: var(--lg-text-primary);
                font-size: 13px;
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
            this.bindEvents();
            this.initZoomCompensation();
        }

        // 缩放补偿：让侧边栏始终保持100%大小
        initZoomCompensation() {
            this.applyZoomCompensation();

            // 监听缩放变化
            window.addEventListener('resize', () => this.applyZoomCompensation());

            // 定期检查（某些浏览器缩放不触发resize）
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
            this.sidebar.className = 'bks-sidebar bks-root';
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
                                <button class="bks-btn-icon" data-action="settings" title="导入/导出">
                                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                                </button>
                                <button class="bks-btn-icon" data-action="close" title="关闭">
                                    <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            </div>
                        </div>
                        <div class="bks-search-wrap">
                            <input type="text" class="bks-search" placeholder="搜索书签...">
                        </div>
                        <div class="bks-list"></div>
                        <div class="bks-footer">
                            <button class="bks-btn" data-action="add-current">
                                <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                添加当前页
                            </button>
                            <div class="bks-theme-switcher">
                                <button class="bks-theme-btn active" data-theme="dark">深色</button>
                                <button class="bks-theme-btn" data-theme="light">浅色</button>
                                <button class="bks-theme-btn" data-theme="auto">自动</button>
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
            this.modalOverlay.className = 'bks-modal-overlay bks-root';
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
                            <button class="bks-modal-btn bks-modal-btn-cancel">取消</button>
                            <button class="bks-modal-btn bks-modal-btn-confirm">确定</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(this.modalOverlay);
        }

        createContextMenu() {
            this.contextMenu = document.createElement('div');
            this.contextMenu.className = 'bks-context-menu bks-root';
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
            this.toast.className = 'bks-toast bks-root';
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
            setTimeout(() => {
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
                    <div class="bks-item" data-id="${item.id}" data-url="${this.escapeHtml(item.url)}">
                        <img class="bks-item-favicon" src="${favicon}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><rect fill=%22%23555%22 width=%2216%22 height=%2216%22 rx=%224%22/><text x=%228%22 y=%2212%22 font-size=%2210%22 fill=%22white%22 text-anchor=%22middle%22>${item.title.charAt(0).toUpperCase()}</text></svg>'">
                        <span class="bks-item-title">${this.escapeHtml(item.title)}</span>
                        <div class="bks-item-actions">
                            <button class="bks-item-btn" data-action="edit" title="编辑">
                                <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="bks-item-btn bks-delete" data-action="delete" title="删除">
                                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
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
        }

        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        bindEvents() {
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

            // 书签点击 - 新标签页打开
            this.listEl.addEventListener('click', (e) => {
                const item = e.target.closest('.bks-item');
                const actionBtn = e.target.closest('[data-action]');

                if (actionBtn && item) {
                    e.stopPropagation();
                    this.handleItemAction(actionBtn.dataset.action, item.dataset.id);
                    return;
                }

                if (item && item.dataset.url) {
                    e.preventDefault();
                    e.stopPropagation();
                    // 使用a标签模拟点击，更可靠
                    const link = document.createElement('a');
                    link.href = item.dataset.url;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.click();
                }
            });

            // 右键菜单
            this.listEl.addEventListener('contextmenu', (e) => {
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
                }
            });

            // 底部按钮
            this.sidebar.querySelector('.bks-footer').addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action]');
                if (btn && btn.dataset.action === 'add-current') {
                    this.showAddBookmarkModal();
                }

                // 主题切换
                const themeBtn = e.target.closest('[data-theme]');
                if (themeBtn) {
                    this.setTheme(themeBtn.dataset.theme);
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

        initTheme() {
            const savedTheme = localStorage.getItem('bks_theme') || 'auto';
            this.setTheme(savedTheme);

            // 监听系统主题变化
            window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
                if (this.currentTheme === 'auto') {
                    this.applyAutoTheme();
                }
            });
        }

        setTheme(mode) {
            this.currentTheme = mode;
            localStorage.setItem('bks_theme', mode);

            // 更新按钮状态
            this.sidebar.querySelectorAll('.bks-theme-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === mode);
            });

            // 应用主题
            if (mode === 'auto') {
                this.applyAutoTheme();
            } else {
                this.applyTheme(mode);
            }
        }

        applyAutoTheme() {
            // 检测页面背景亮度
            const bgColor = window.getComputedStyle(document.body).backgroundColor;
            const brightness = this.getColorBrightness(bgColor);

            // 亮度 > 128 认为是浅色背景，使用浅色主题
            // 否则使用深色主题
            const theme = brightness > 128 ? 'light' : 'dark';
            this.applyTheme(theme);
        }

        getColorBrightness(color) {
            // 解析 rgb/rgba 颜色
            const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
                const r = parseInt(match[1]);
                const g = parseInt(match[2]);
                const b = parseInt(match[3]);
                // 使用相对亮度公式
                return (r * 299 + g * 587 + b * 114) / 1000;
            }
            // 默认返回深色
            return 0;
        }

        applyTheme(theme) {
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
                    navigator.clipboard.writeText(item.url);
                    this.showToast('链接已复制');
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

        showSettings() {
            const exportData = JSON.stringify(this.bookmarks, null, 2);
            const newData = prompt('导入/导出书签数据 (JSON格式):', exportData);
            if (newData && newData !== exportData) {
                try {
                    this.bookmarks = JSON.parse(newData);
                    this.saveBookmarks();
                    this.renderBookmarks();
                    this.showToast('导入成功');
                } catch {
                    this.showToast('格式错误');
                }
            }
        }
    }

    // ========== 启动 ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new BookmarkSidebar());
    } else {
        new BookmarkSidebar();
    }
})();
