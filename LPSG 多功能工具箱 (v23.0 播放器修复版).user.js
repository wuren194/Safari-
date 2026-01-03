// ==UserScript==
// @name         LPSG 多功能工具箱 (v23.0 播放器修复版)
// @namespace    http://tampermonkey.net/
// @version      23.4 (Batch Download)
// @description  【分批下载】支持一次选几万张图片自动分批下载（每批30张，批次间暂停2秒），防止 Safari 崩溃；修复视频播放问题。
// @author       You & MBing & Optimized by AI Architect
// @match        *://*.lpsg.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=lpsg.com
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // 1. CONFIG
    const CONFIG = {
        DEBUG_MODE: false,
        MIN_WIDTH: 200, MIN_HEIGHT: 150,
        REQUEST_DELAY: 500, CONCURRENCY: 5, DRAG_THRESHOLD: 5,
        // 分批下载配置
        BATCH_DOWNLOAD: {
            BATCH_SIZE: 30,           // 每批下载数量
            BATCH_DELAY: 2000,        // 批次间暂停时间(ms)
            ITEM_DELAY: 100,          // 单个文件下载间隔(ms)
        },
        DIMENSIONS: {
            VIDEO_CARD_HEIGHT: 240, IMG_CARD_HEIGHT: 220, LINK_CARD_HEIGHT: 200,
            VERIFICATION_CARD_HEIGHT: 380,
        },
        SELECTORS: {
            MODAL: '#lpsg-modal', GRID_CONTAINER: '#vs-container', GRID: '#lpsg-grid',
            PLACEHOLDER: '#vs-placeholder', MAIN_BTN: '#lpsg-btn', PROGRESS: '#lpsg-progress',
            SCRAPE_CONFIG: '#scrape-config', COUNT: '#lpsg-count', PROG_TXT: '#prog-txt',
            PROG_FILL: '#prog-fill', INPUT_START: '#s-start', INPUT_END: '#s-end',
            BUTTON_CONTAINER: '#lpsg-button-container',
        },
        REGEX: {
            IMAGE: /\.(jpg|jpeg|png|webp|gif|avif|bmp|tiff)(\?|$)/i,
            VIDEO: /\.(mp4|mov|m4v|webm)(\?|$)/i,
            LPSG_ATTACHMENT: /-(jpg|jpeg|png|webp|gif|avif|bmp|tiff)\.\d+\/?$/i,
            URL_CLEAN: /\.(ggpht\.com|\.blogspot\.com)/,
        },
        HELPER_CONFIG: { autoSwitchInterval: 2500, defaultVolume: 0.05 },
        HELPER_SELECTORS: {
            BALL: 'lpsg-helper-btn', MODAL: 'lpsg-helper-modal', CLOSE: 'lpsg-helper-close',
            CLASSES: {
                MODAL_OPEN: 'lpsgh-modal-open', TAB_BTN: 'lpsgh-tab-btn', TAB_PANE: 'lpsgh-tab-pane', ACTIVE: 'lpsgh-active',
                HEADER: 'lpsgh-header', TAB_GROUP: 'lpsgh-tab-group', CONTENT: 'lpsgh-content',
                SETTING_ITEM: 'lpsgh-setting-item', SETTING_LABEL: 'lpsgh-setting-label',
                INPUT: 'lpsgh-input', SWITCH: 'lpsgh-switch', SWITCH_CHECKED: 'lpsgh-checked',
                VIDEO_FMT_BTN: 'lpsgh-video-fmt-btn', CLOSE_ICON: 'lpsgh-close-icon',
                VERI_CONTAINER: 'lpsgh-verification-container', VERI_LABEL: 'lpsgh-verification-label'
            }
        },
        Z_LAYERS: {
            BUTTON: 2147483641, MODAL: 2147483650, CONFIG_MODAL: 2147483665, HELPER_MODAL: 2147483650,
        },
    };

    // 2. STATE
    const STATE = {
        allMedia: [], selectedItems: new Set(), currentTab: 'image',
        isMouseDown: false, isDragging: false, dragMode: null, lastHoveredIndex: -1,
        dragStartX: 0, dragStartY: 0, stopScraping: false, activeScrapeRequests: [], activeDownloadRequest: null,
        virtual: {
            rowHeight: 215, items: [], cols: 1, lastStartRow: -1,
            renderedNodes: new Map(), imageObserver: null,
        },
        tabs: {
            'image': { items: null, scrollTop: 0, selection: new Set() },
            'video': { items: null, scrollTop: 0, selection: new Set() },
            'link': { items: null, scrollTop: 0, selection: new Set() },
            'verification': { items: null, scrollTop: 0, selection: new Set() },
        },
        HELPER_STATE: { shouldContinueSwitching: true, }
    };

    // 3. Logger
    const Logger = {
        info: (msg) => console.log(`[LPSG Toolbox] ${msg}`),
        error: (msg, err) => console.error(`[LPSG Toolbox] ${msg}`, err),
        warn: (msg) => console.warn(`[LPSG Toolbox] ${msg}`),
        debug: (msg) => { if (CONFIG.DEBUG_MODE) console.log(`[LPSG Toolbox Debug] ${msg}`); }
    };

    // 4. StyleManager
    const StyleManager = {
        CSS: `
            :root {
                --apple-glass: rgba(30, 30, 30, 0.40); --apple-glass-light: rgba(255, 255, 255, 0.08);
                --apple-glass-hover: rgba(255, 255, 255, 0.15); --apple-accent: #0a84ff;
                --apple-highlight: rgba(255, 255, 255, 0.2); --apple-border: rgba(255, 255, 255, 0.12);
                --apple-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); --sf-font: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
                --text-primary: rgba(255, 255, 255, 0.95); --text-secondary: rgba(255, 255, 255, 0.6);
            }
            html.lpsg-modal-open, body.lpsg-modal-open { overflow: hidden !important; }
            #lpsg-button-container { position: fixed !important; right: 24px !important; bottom: 100px !important; left: auto !important; top: auto !important; transform: none !important; padding-bottom: env(safe-area-inset-bottom) !important; display: flex !important; flex-direction: column !important; gap: 16px !important; z-index: ${CONFIG.Z_LAYERS.BUTTON} !important; }
            #lpsg-btn, #${CONFIG.HELPER_SELECTORS.BALL} { position: relative !important; right: auto !important; bottom: auto !important; width: 52px !important; height: 52px !important; background: var(--apple-glass) !important; backdrop-filter: blur(25px) saturate(180%) !important; -webkit-backdrop-filter: blur(25px) saturate(180%) !important; border-radius: 50% !important; cursor: pointer !important; box-shadow: 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 var(--apple-highlight) !important; border: 1px solid rgba(0,0,0,0.1) !important; display: flex !important; align-items: center; justify-content: center !important; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important; }
            #lpsg-btn:hover, #${CONFIG.HELPER_SELECTORS.BALL}:hover { transform: scale(1.1) !important; background: rgba(50, 50, 50, 0.8) !important; }
            #lpsg-btn svg, #${CONFIG.HELPER_SELECTORS.BALL} svg { width: 24px; height: 24px; fill: #fff; opacity: 0.9; }
            #lpsg-btn.loading { pointer-events: none !important; opacity: 0.8 !important; }
            #lpsg-btn.loading svg { display: none !important; }
            #lpsg-btn.loading::after { content: '' !important; width: 20px !important; height: 20px !important; border: 2px solid #fff !important; border-top-color: transparent !important; border-radius: 50% !important; animation: spin 0.8s linear infinite !important; }
            @keyframes spin { to { transform: rotate(360deg); } }
            #lpsg-modal { display: none; position: fixed !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) scale(0.96) !important; width: 92vw !important; height: 88vh !important; background: var(--apple-glass) !important; backdrop-filter: blur(50px) saturate(200%) !important; -webkit-backdrop-filter: blur(50px) saturate(200%) !important; border-radius: 24px !important; border: 1px solid var(--apple-border) !important; box-shadow: var(--apple-shadow), inset 0 1px 0 rgba(255,255,255,0.15) !important; z-index: ${CONFIG.Z_LAYERS.MODAL} !important; flex-direction: column !important; overflow: hidden !important; font-family: var(--sf-font) !important; opacity: 0; pointer-events: none; transition: opacity 0.3s, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important; -webkit-user-select: none; user-select: none; }
            #lpsg-modal.show { display: flex !important; opacity: 1 !important; transform: translate(-50%, -50%) scale(1) !important; pointer-events: auto; }
            .lpsg-header { padding: 18px 24px !important; display: flex !important; align-items: center; gap: 16px !important; border-bottom: 1px solid var(--apple-border) !important; background: rgba(255,255,255,0.02) !important; }
            .lpsg-header h2 { margin: 0 !important; font-size: 17px !important; font-weight: 600 !important; color: var(--text-primary) !important; letter-spacing: -0.02em !important; min-height: 20px; }
            .filter-bar { padding: 12px 24px !important; display: none; align-items: center !important; gap: 10px !important; font-size: 13px !important; color: var(--text-secondary) !important; border-bottom: 1px solid var(--apple-border) !important; }
            .filter-bar.active-bar { display: flex !important; }
            .action-btn, .tab-btn, .fmt-tag { padding: 6px 14px !important; border: none !important; border-radius: 8px !important; cursor: pointer !important; background: var(--apple-glass-light) !important; color: #fff !important; font-size: 13px !important; font-weight: 500 !important; transition: background 0.2s !important; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05) !important; }
            .action-btn:hover, .tab-btn:hover, .fmt-tag:hover { background: var(--apple-glass-hover) !important; }
            .action-btn:active { transform: scale(0.96) !important; }
            .tab-btn.active, .fmt-tag.active, .action-btn.primary { background: var(--apple-accent) !important; color: #fff !important; box-shadow: 0 2px 10px rgba(10, 132, 255, 0.4), inset 0 1px 0 rgba(255,255,255,0.2) !important; }
            .tab-group { background: rgba(0,0,0,0.2) !important; padding: 3px !important; border-radius: 10px !important; display: flex !important; gap: 2px !important; }
            #lpsg-modal .tab-btn { background: transparent !important; box-shadow: none !important; color: var(--text-secondary) !important; }
            #lpsg-modal .tab-btn.active { background: rgba(255,255,255,0.15) !important; color: #fff !important; box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important; }
            .filter-input { width: 70px !important; background: rgba(0,0,0,0.3) !important; color: #fff !important; border: 1px solid var(--apple-border) !important; border-radius: 6px !important; padding: 4px 8px !important; text-align: center !important; font-family: var(--sf-font) !important; }
            .grid-container { position: relative !important; flex: 1 !important; overflow-y: auto !important; padding: 20px 24px !important; background: transparent !important; }
            .grid-container::-webkit-scrollbar { width: 0 !important; }
            .m-card { position: relative !important; background: rgba(255,255,255,0.04) !important; border-radius: 12px !important; overflow: hidden !important; cursor: pointer !important; display: flex !important; flex-direction: column !important; transition: transform 0.2s, box-shadow 0.2s !important; border: 1px solid transparent !important; contain: content; transform: translateZ(0); }
            .m-card:hover { background: rgba(255,255,255,0.08) !important; transform: scale(1.02) !important; box-shadow: 0 12px 24px rgba(0,0,0,0.3) !important; z-index: 5 !important; }
            .m-card.selected { box-shadow: inset 0 0 0 2px var(--apple-accent) !important; background: rgba(10, 132, 255, 0.1) !important; }
            .m-card img { width: 100% !important; height: 100% !important; object-fit: contain !important; pointer-events: none !important; background-color: rgba(0,0,0,0.1); }
            .m-card.video-card { height: ${CONFIG.DIMENSIONS.VIDEO_CARD_HEIGHT}px !important; background: #000 !important; }
            .m-card.link-c { height: ${CONFIG.DIMENSIONS.LINK_CARD_HEIGHT}px !important; }
            .m-card.verification-card { height: ${CONFIG.DIMENSIONS.VERIFICATION_CARD_HEIGHT}px !important; display: flex !important; flex-direction: column !important; padding: 0 !important; gap: 0 !important; background: rgba(30,30,30,0.5) !important; border: 1px solid rgba(255,255,255,0.05); }
            .veri-header { display: flex; padding: 16px; gap: 14px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05); align-items: flex-start; }
            .veri-avatar { flex-shrink: 0; }
            .veri-avatar img { width: 56px !important; height: 56px !important; border-radius: 50%; object-fit: cover !important; box-shadow: 0 4px 12px rgba(0,0,0,0.4); border: 2px solid rgba(255,255,255,0.1); }
            .veri-info { flex: 1; overflow: hidden; }
            .veri-info h3 { margin: 0 0 6px 0; font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .veri-info h3 a { color: var(--text-primary); text-decoration: none; transition: color 0.2s; }
            .veri-info h3 a:hover { color: var(--apple-accent); }
            .veri-info p { margin: 2px 0; font-size: 11px; line-height: 1.4; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .veri-info strong { color: rgba(255,255,255,0.5); font-weight: 400; margin-right: 4px; }
            .veri-images { flex: 1; padding: 12px; display: grid; grid-template-columns: repeat(2, 1fr); grid-auto-rows: 1fr; gap: 8px; overflow-y: auto; }
            .veri-images img { width: 100% !important; height: 100% !important; border-radius: 6px; object-fit: cover; box-shadow: 0 2px 8px rgba(0,0,0,0.2); transition: opacity 0.2s; background: rgba(0,0,0,0.2); }
            .veri-images img:hover { opacity: 0.8; }
            .video-container { position: relative !important; width: 100% !important; height: 100% !important; display: flex !important; align-items: center; justify-content: center; }
            .play-bar { position: absolute !important; bottom: 12px !important; left: 50% !important; transform: translateX(-50%) !important; padding: 0 16px !important; height: 32px !important; border-radius: 16px !important; background: rgba(30, 30, 30, 0.75) !important; color: #fff !important; display: flex !important; align-items: center; justify-content: center !important; gap: 6px !important; cursor: pointer !important; z-index: 20 !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; border: 1px solid rgba(255,255,255,0.15) !important; font-size: 13px !important; font-weight: 500 !important; transition: background 0.2s !important; box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important; width: auto !important; }
            .play-bar:hover { background: rgba(50, 50, 50, 0.9) !important; transform: translateX(-50%) scale(1.05) !important; }
            .check-mark { position: absolute !important; top: 10px !important; right: 10px !important; width: 24px !important; height: 24px !important; border-radius: 50% !important; border: 1.5px solid rgba(255,255,255,0.6) !important; background: rgba(0,0,0,0.2) !important; z-index: 15 !important; backdrop-filter: blur(4px); display: flex !important; align-items: center; justify-content: center !important; transition: all 0.2s !important; }
            .m-card.selected::after { content: '' !important; position: absolute !important; inset: 0 !important; border: 3px solid var(--apple-accent) !important; border-radius: 12px !important; z-index: 100 !important; pointer-events: none !important; }
            .m-card.selected .check-mark { background: var(--apple-accent) !important; border-color: transparent !important; box-shadow: 0 2px 8px rgba(10, 132, 255, 0.5) !important; }
            .m-card.selected .check-mark::after { content: '✓' !important; color: white !important; font-size: 14px !important; font-weight: 700 !important; }
            .video-close-btn { position: absolute !important; top: 12px !important; left: 12px !important; width: 30px !important; height: 30px !important; border-radius: 50% !important; background: rgba(60, 60, 60, 0.6) !important; backdrop-filter: blur(10px) !important; display: flex !important; align-items: center; justify-content: center !important; cursor: pointer !important; z-index: 30 !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.1) !important; font-size: 18px !important; line-height: 1 !important; }
            .link-card { padding: 24px 28px !important; display: flex !important; flex-direction: column !important; height: 100% !important; justify-content: space-between !important; color: var(--text-secondary) !important; font-size: 13px; }
            .link-title { color: #fff !important; margin-bottom: 8px !important; font-weight: 600 !important; line-height: 1.5 !important; font-size: 14px !important; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
            .badge { position: absolute !important; top: 12px !important; left: 12px !important; background: rgba(0,0,0,0.6) !important; color: #fff !important; padding: 4px 8px !important; border-radius: 6px !important; font-size: 11px !important; font-weight: 500 !important; backdrop-filter: blur(8px) !important; z-index: 10 !important; }
            #lpsg-progress, #scrape-config { position: fixed !important; z-index: ${CONFIG.Z_LAYERS.CONFIG_MODAL} !important; background: var(--apple-glass) !important; backdrop-filter: blur(50px) saturate(200%) !important; -webkit-backdrop-filter: blur(50px) saturate(200%) !important; border-radius: 24px !important; border: 1px solid var(--apple-border) !important; box-shadow: var(--apple-shadow), inset 0 1px 0 rgba(255,255,255,0.15) !important; color: #fff !important; }
            #lpsg-progress { display: none; flex-direction: column; bottom: 40px !important; left: 50% !important; transform: translateX(-50%) !important; width: 400px !important; padding: 24px !important; align-items: center; }
            #scrape-config { display: none; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; width: 320px !important; padding: 24px !important; text-align: center; }
            .prog-bar { width: 100% !important; height: 5px !important; background: rgba(255,255,255,0.1) !important; border-radius: 3px !important; overflow: hidden !important; margin-top: 12px !important; }
            .prog-fill { height: 100% !important; background: var(--apple-accent) !important; width: 0% !important; transition: width 0.2s !important; box-shadow: 0 0 10px rgba(10,132,255,0.5) !important; }
            .media-grid { display: grid !important; gap: 16px !important; position: absolute !important; left: 24px !important; right: 24px !important; will-change: transform; }
            #vs-placeholder { position: absolute !important; top: 0 !important; width: 1px !important; }
            body.lpsg-dragging .m-card:hover { transform: none !important; box-shadow: none !important; z-index: 1 !important; }
            #${CONFIG.HELPER_SELECTORS.MODAL} { display: none; position: fixed !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) scale(0.96) !important; width: 380px !important; max-height: 80vh !important; background: var(--apple-glass) !important; backdrop-filter: blur(50px) saturate(200%) !important; -webkit-backdrop-filter: blur(50px) saturate(200%) !important; border-radius: 24px !important; border: 1px solid var(--apple-border) !important; box-shadow: var(--apple-shadow), var(--apple-highlight) !important; z-index: ${CONFIG.Z_LAYERS.HELPER_MODAL} !important; display: flex; flex-direction: column !important; overflow: hidden !important; font-family: var(--sf-font) !important; opacity: 0; pointer-events: none; transition: opacity 0.3s, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important; color: #fff !important; }
            #${CONFIG.HELPER_SELECTORS.MODAL}.${CONFIG.HELPER_SELECTORS.CLASSES.MODAL_OPEN} { display: flex !important; opacity: 1 !important; transform: translate(-50%, -50%) scale(1) !important; pointer-events: auto !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.HEADER} { padding: 18px 24px !important; border-bottom: 1px solid var(--apple-border) !important; background: rgba(255,255,255,0.02) !important; display: flex !important; align-items: center !important; justify-content: space-between !important; cursor: move !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.HEADER} h2 { margin: 0 !important; font-size: 16px !important; font-weight: 600 !important; color: var(--text-primary) !important; letter-spacing: 1px; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.TAB_GROUP} { padding: 12px 24px 0 !important; display: flex !important; gap: 8px !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.TAB_BTN} { flex: 1; text-align: center; padding: 8px 0 !important; border: none !important; border-radius: 8px !important; background: rgba(255,255,255,0.05) !important; color: var(--text-secondary) !important; cursor: pointer !important; font-size: 13px !important; transition: all 0.2s !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.TAB_BTN}.${CONFIG.HELPER_SELECTORS.CLASSES.ACTIVE} { background: var(--apple-accent) !important; color: #fff !important; box-shadow: 0 0 15px rgba(10, 132, 255, 0.4) !important; font-weight: 500 !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.CONTENT} { padding: 20px 24px !important; overflow-y: auto !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.TAB_PANE} { display: none !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.TAB_PANE}.${CONFIG.HELPER_SELECTORS.CLASSES.ACTIVE} { display: block !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.SETTING_ITEM} { display: flex !important; align-items: center !important; justify-content: space-between !important; padding: 14px 0 !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.SETTING_ITEM}:last-child { border-bottom: none !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.SETTING_LABEL} { font-size: 14px !important; color: var(--text-primary) !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.INPUT} { width: 60px !important; background: rgba(0,0,0,0.3) !important; border: 1px solid var(--apple-border) !important; color: #fff !important; padding: 6px 8px !important; border-radius: 8px !important; text-align: center !important; font-family: var(--sf-font) !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.SWITCH} { position: relative !important; width: 44px !important; height: 24px !important; background: rgba(255,255,255,0.1) !important; border-radius: 12px !important; cursor: pointer !important; transition: background 0.3s !important; border: 1px solid rgba(255,255,255,0.1) !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.SWITCH}.${CONFIG.HELPER_SELECTORS.CLASSES.SWITCH_CHECKED} { background: var(--apple-accent) !important; border-color: transparent !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.SWITCH}::after { content: '' !important; position: absolute !important; top: 2px !important; left: 2px !important; width: 18px !important; height: 18px !important; background: #fff !important; border-radius: 50% !important; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important; box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.SWITCH}.${CONFIG.HELPER_SELECTORS.CLASSES.SWITCH_CHECKED}::after { transform: translateX(20px) !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.VIDEO_FMT_BTN} { display: inline-block !important; margin: 8px 4px !important; padding: 4px 12px !important; border-radius: 12px !important; background: rgba(10, 132, 255, 0.15) !important; color: #fff !important; border: 1px solid rgba(10, 132, 255, 0.3) !important; font-size: 12px !important; cursor: pointer !important; backdrop-filter: blur(4px) !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.VIDEO_FMT_BTN}:hover { background: rgba(10, 132, 255, 0.3) !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.CLOSE_ICON} { width: 28px !important; height: 28px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; background: rgba(255,255,255,0.1) !important; cursor: pointer !important; color: #fff !important; font-size: 18px !important; font-weight: bold !important; border: none !important; line-height: 1 !important; transition: background 0.2s !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.CLOSE_ICON}:hover { background: rgba(255,59,48,0.8) !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.VERI_CONTAINER} { margin-top: 6px !important; padding: 0 !important; background: transparent !important; border: none !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.VERI_CONTAINER} img { max-width: 100% !important; height: auto !important; border-radius: 4px !important; display: block !important; margin: 3px 0 !important; }
            .${CONFIG.HELPER_SELECTORS.CLASSES.VERI_LABEL} { font-size: 11px !important; color: #aaaaaa !important; text-align: left !important; margin: 2px 0 4px !important; font-weight: 400 !important; }
            @media (max-width: 768px) {
                /* 主模态框：全屏 + 安全区域 */
                #lpsg-modal { 
                    width: 100% !important; 
                    height: 100% !important; 
                    max-height: 100% !important;
                    border-radius: 0 !important; 
                    top: 0 !important; 
                    left: 0 !important; 
                    transform: none !important; 
                    border: none !important;
                    padding-top: env(safe-area-inset-top) !important;
                    padding-bottom: env(safe-area-inset-bottom) !important;
                }
                #lpsg-modal.show { transform: none !important; }
                
                /* 浮动按钮：适配底部安全区域 */
                #lpsg-button-container { 
                    bottom: calc(80px + env(safe-area-inset-bottom)) !important; 
                    right: 16px !important; 
                }
                #lpsg-btn, #lpsg-helper-btn { 
                    width: 46px !important; 
                    height: 46px !important; 
                }
                
                /* 头部：垂直堆叠布局 */
                .lpsg-header { 
                    padding: 12px 12px !important; 
                    gap: 8px !important; 
                    flex-wrap: wrap !important;
                    justify-content: flex-start !important;
                }
                .lpsg-header h2 { 
                    display: none !important; 
                }
                .lpsg-header .tab-group { 
                    order: 1 !important;
                    flex: 0 0 auto !important;
                }
                .lpsg-header > div[style*="flex:1"] {
                    display: none !important;
                }
                .lpsg-header #lpsg-all,
                .lpsg-header #lpsg-invert,
                .lpsg-header #lpsg-scrape-btn { 
                    display: none !important; 
                }
                .lpsg-header #lpsg-count { 
                    order: 2 !important;
                    margin: 0 auto 0 8px !important;
                    font-size: 12px !important;
                }
                .lpsg-header #lpsg-close { 
                    order: 3 !important;
                    margin-left: auto !important;
                }
                
                /* Tab 按钮 */
                .tab-group { 
                    overflow-x: auto !important; 
                    -webkit-overflow-scrolling: touch !important; 
                    gap: 2px !important;
                    flex-shrink: 0 !important;
                }
                .tab-btn { 
                    padding: 6px 10px !important; 
                    font-size: 12px !important; 
                    white-space: nowrap !important; 
                    flex-shrink: 0 !important;
                }
                
                /* 筛选栏 */
                .filter-bar { 
                    flex-wrap: wrap !important; 
                    gap: 6px !important; 
                    padding: 8px 12px !important; 
                    justify-content: flex-start !important;
                }
                .filter-bar .fmt-tag { 
                    padding: 4px 8px !important; 
                    font-size: 11px !important; 
                }
                .filter-bar .action-btn { 
                    padding: 6px 12px !important; 
                    font-size: 12px !important; 
                }
                .filter-bar label { 
                    font-size: 11px !important; 
                }
                
                /* 网格容器 */
                .grid-container { 
                    padding: 12px !important; 
                }
                .media-grid { 
                    left: 12px !important; 
                    right: 12px !important; 
                    gap: 8px !important; 
                }
                
                /* 卡片 */
                .m-card.video-card { height: 180px !important; }
                .m-card.link-c { height: 140px !important; }
                .m-card.verification-card { height: 280px !important; }
                .link-card { padding: 12px !important; }
                .link-title { font-size: 13px !important; }
                
                /* 进度条 & 配置模态 */
                #lpsg-progress { 
                    width: calc(100% - 32px) !important; 
                    left: 16px !important;
                    right: 16px !important;
                    bottom: calc(60px + env(safe-area-inset-bottom)) !important; 
                    transform: none !important;
                    padding: 16px !important;
                }
                #scrape-config { 
                    width: calc(100% - 32px) !important; 
                    max-width: 320px !important;
                }
                
                /* Helper 设置模态 */
                #lpsg-helper-modal { 
                    width: calc(100% - 32px) !important; 
                    max-width: 360px !important;
                    max-height: 70vh !important;
                }
            }
        `,
        inject() {
            if (typeof GM_addStyle !== 'undefined') {
                GM_addStyle(this.CSS);
            } else {
                const style = document.createElement('style');
                style.id = 'lpsg-toolbox-styles';
                style.innerHTML = this.CSS;
                document.head.appendChild(style);
            }
        }
    };

    // 5. Utils
    const Utils = {
        createElement(tag, attributes = {}, children = []) {
            const el = document.createElement(tag);
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'textContent') el.textContent = value;
                else if (key === 'innerHTML') el.innerHTML = value;
                else if (key === 'className') el.className = value;
                else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.substring(2).toLowerCase(), value);
                else if (key === 'dataset' && typeof value === 'object') Object.assign(el.dataset, value);
                else el.setAttribute(key, value);
            });
            children.forEach(child => {
                if (typeof child === 'string') el.appendChild(document.createTextNode(child));
                else if (child instanceof Node) el.appendChild(child);
            });
            return el;
        },
        getSafeTitle: () => (document.title || 'lpsg_download').split('|')[0].trim().replace(/[\\/:\*?"<>|]/g, '-'),
        toCleanAbsoluteUrl(url) {
            if (!url) return '';
            try {
                let absUrl = new URL(url, window.location.origin).href;
                if (absUrl.startsWith('http:')) absUrl = absUrl.replace(/^http:/, 'https:');
                if (absUrl.match(CONFIG.REGEX.URL_CLEAN)) absUrl = absUrl.replace(/\/s(\d+)-h\//, '/s$1/');
                return absUrl;
            } catch (e) { return url; }
        },
        getBaseUrl: (url) => { try { return decodeURIComponent(url.split('?')[0]); } catch (e) { return url.split('?')[0]; } },
        getCurrentPageNumber: (url) => { const match = (url || window.location.href).match(/page-(\d+)/); return match ? parseInt(match[1]) : 1; },
        verifyImage(item) {
            return new Promise((resolve) => {
                if (item.type !== 'image') return resolve(item);
                if (item.src.match(/avatar|smilie|smile|emoji|icon|logo|clear\.png|button|reaction|xenforo/i)) return resolve(null);
                const img = new Image();
                img.src = item.src;
                const timer = setTimeout(() => resolve(null), 5000);
                img.onload = () => {
                    clearTimeout(timer);
                    if (img.naturalWidth > CONFIG.MIN_WIDTH && img.naturalHeight > CONFIG.MIN_HEIGHT) {
                        item.w = img.naturalWidth;
                        item.h = img.naturalHeight;
                        resolve(item);
                    } else resolve(null);
                };
                img.onerror = () => { clearTimeout(timer); resolve(null); };
            });
        },
        makeDraggable(el) {
            let isDragging = false, startX, startY, initLeft, initTop;
            const header = el.querySelector(`.${CONFIG.HELPER_SELECTORS.CLASSES.HEADER}`);
            const dragTarget = header || el;
            dragTarget.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                isDragging = true;
                startX = e.clientX; startY = e.clientY;
                const rect = el.getBoundingClientRect();
                initLeft = rect.left; initTop = rect.top;
                el.style.transition = 'none';
                dragTarget.style.cursor = 'grabbing';
            });
            window.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                el.style.left = `${initLeft + (e.clientX - startX)}px`;
                el.style.top = `${initTop + (e.clientY - startY)}px`;
            });
            window.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    el.style.transition = '';
                    dragTarget.style.cursor = header ? 'move' : 'pointer';
                }
            });
        },
        async fetchVerificationImageUrls(profileUrl) {
            const fetchPage = (url) => new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET", url, responseType: 'text',
                    onload: r => (r.status >= 200 && r.status < 400) ? resolve(r.responseText) : reject(new Error(`Status ${r.status}`)),
                    onerror: err => reject(err), onabort: () => reject(new Error('Aborted')), ontimeout: () => reject(new Error('Timeout'))
                });
            });

            try {
                const html = await fetchPage(profileUrl);
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const possibleSelectors = [
                    '.verification-image img', '.memberVerification img', '.member-verification img', 'img[alt*="verification"]',
                    'img[alt*="Verification"]', '.block-body img', '.messageContent img', '.bbImage[data-src*="verification"]', 'img.bbImage'
                ];
                let verificationImgs = new Set();
                for (const selector of possibleSelectors) {
                    doc.querySelectorAll(selector).forEach(img => {
                        const src = Utils.toCleanAbsoluteUrl(img.src || img.dataset.src || img.dataset.url);
                        if (src) verificationImgs.add(src);
                    });
                }
                if (verificationImgs.size === 0 && !profileUrl.includes('/verification')) {
                    const verifyUrl = profileUrl.replace(/\/?$/, '') + '/verification';
                    try {
                        const verifyHtml = await fetchPage(verifyUrl);
                        const verifyDoc = parser.parseFromString(verifyHtml, 'text/html');
                        verifyDoc.querySelectorAll('img.bbImage, .block-body img').forEach(img => {
                            const src = Utils.toCleanAbsoluteUrl(img.src || img.dataset.src);
                            if (src) verificationImgs.add(src);
                        });
                    } catch (innerErr) {
                        Logger.debug(`Could not fetch secondary verification URL ${verifyUrl}: ${innerErr.message}`);
                    }
                }
                return Array.from(verificationImgs);
            } catch (err) {
                Logger.warn(`Fetching verification images failed for ${profileUrl}:`, err);
                return [];
            }
        },
    };

    // 6. Core
    const Core = {
        async extractAllFromContext(context, pageNum) {
            const mediaResults = [], verificationResults = [];
            const mediaSeen = new Set(), verificationSeen = new Set();
            const allVerificationImageUrls = new Set();

            const verificationPromises = [];
            context.querySelectorAll('article.message').forEach((article, index) => {
                const userCell = article.querySelector('.message-cell--user');
                const userExtras = userCell?.querySelector('.message-userExtras');
                if (!userExtras) return;
                let verificationLink = null;
                userExtras.querySelectorAll('dl > dt').forEach(dt => {
                    if (dt.textContent.toLowerCase().includes('verification') || dt.textContent.includes('确认')) {
                        const link = dt.nextElementSibling?.querySelector('a');
                        if (link?.href) verificationLink = link.href;
                    }
                });
                if (verificationLink && !verificationSeen.has(verificationLink)) {
                    verificationSeen.add(verificationLink);
                    let userInfoHtml = '';
                    userExtras.querySelectorAll('dl.pairs').forEach(dl => {
                        const dt = dl.querySelector('dt')?.textContent.trim();
                        const dd = dl.querySelector('dd')?.textContent.trim();
                        if (dt && dd && dt.toLowerCase() !== 'verification') {
                            userInfoHtml += `<p><strong>${dt}:</strong> ${dd}</p>`;
                        }
                    });
                    const userInfo = {
                        userName: userCell.querySelector('.message-name .username')?.textContent || 'Unknown',
                        userAvatar: Utils.toCleanAbsoluteUrl(userCell.querySelector('.avatar img')?.src),
                        userProfileUrl: Utils.toCleanAbsoluteUrl(verificationLink),
                        userInfoHtml: userInfoHtml,
                        page: pageNum, order: index, type: 'verification'
                    };
                    verificationPromises.push(
                        Utils.fetchVerificationImageUrls(userInfo.userProfileUrl).then(imageUrls => {
                            if (imageUrls.length > 0) {
                                imageUrls.forEach(url => allVerificationImageUrls.add(Utils.getBaseUrl(url)));
                                verificationResults.push({ ...userInfo, verificationImages: imageUrls });
                            }
                        })
                    );
                }
            });

            await Promise.all(verificationPromises);

            const { IMAGE, VIDEO, LPSG_ATTACHMENT } = CONFIG.REGEX;
            const markMediaSeen = (url) => mediaSeen.add(Utils.getBaseUrl(url));
            const isMediaSeen = (url) => mediaSeen.has(Utils.getBaseUrl(url));

            context.querySelectorAll('img, video').forEach(el => {
                if (el.matches('.smilie, .emoji, .avatar img')) return;

                let src = el.dataset.src || el.src || el.getAttribute('poster');

                if (el.tagName === 'VIDEO') {
                    let vSrc = el.currentSrc || el.src;
                    if (!vSrc || vSrc === window.location.href) {
                        const source = el.querySelector('source');
                        if (source) vSrc = source.src || source.dataset.src;
                    }
                    if (vSrc && !vSrc.startsWith('blob:') && !vSrc.startsWith('data:')) {
                        src = vSrc;
                    }
                }

                if (!src || src.startsWith('data:')) return;

                let highResSrc = Utils.toCleanAbsoluteUrl(src);
                if (allVerificationImageUrls.has(Utils.getBaseUrl(highResSrc))) return;

                const parentLink = el.closest('a');
                if (parentLink) {
                    const pHref = parentLink.href;
                    if (IMAGE.test(pHref) || LPSG_ATTACHMENT.test(pHref)) {
                        const potentialHighRes = Utils.toCleanAbsoluteUrl(pHref);
                        if (!allVerificationImageUrls.has(Utils.getBaseUrl(potentialHighRes))) highResSrc = potentialHighRes;
                    }
                    else if (VIDEO.test(pHref)) {
                        highResSrc = Utils.toCleanAbsoluteUrl(pHref);
                    }
                }

                if (isMediaSeen(highResSrc)) return;
                markMediaSeen(highResSrc);

                let format = 'jpg';
                const vidMatch = highResSrc.match(VIDEO);
                const imgMatch = highResSrc.match(IMAGE) || highResSrc.match(LPSG_ATTACHMENT);

                let type = 'image';
                if (el.tagName === 'VIDEO' || el.closest('[data-video-url]') || vidMatch) {
                    type = 'video';
                    format = 'mp4';
                } else if (imgMatch) {
                    format = imgMatch[1].toLowerCase();
                }

                mediaResults.push({
                    type,
                    src: highResSrc,
                    thumb: Utils.toCleanAbsoluteUrl(el.poster || el.src || src),
                    page: pageNum,
                    format
                });
            });

            context.querySelectorAll('a:not(:has(img))').forEach(a => {
                const href = Utils.toCleanAbsoluteUrl(a.href);
                if (isMediaSeen(href) || allVerificationImageUrls.has(Utils.getBaseUrl(href))) return;

                if (VIDEO.test(href)) {
                    mediaResults.push({ type: 'video', src: href, thumb: '', page: pageNum, format: 'mp4' });
                    markMediaSeen(href);
                } else if (IMAGE.test(href) || LPSG_ATTACHMENT.test(href)) {
                    let format = 'jpg';
                    const match = href.match(IMAGE) || href.match(LPSG_ATTACHMENT);
                    if (match) format = match[1].toLowerCase();
                    mediaResults.push({ type: 'image', src: href, thumb: href, page: pageNum, format });
                    markMediaSeen(href);
                } else if (!href.match(/\/members\/|\/forums\/|\/goto\/post|javascript:/) && !a.closest('.bbCodeBlock-sourceJump, .bbCodeBlock-title')) {
                    const msg = a.closest('.message-content');
                    if (msg) {
                        const floor = msg.closest('.message')?.querySelector('.message-attribution-main')?.textContent?.trim().split(/\s+/).pop() || "#?";
                        mediaResults.push({ type: 'link', href, text: `[${floor}] ${msg.innerText.substring(0, 100)}...`, page: pageNum });
                        markMediaSeen(href);
                    }
                }
            });
            return [...mediaResults, ...verificationResults];
        },
        async filterValidMedia(rawItems) {
            const promises = rawItems.map(item => (item.type === 'image' ? Utils.verifyImage(item) : Promise.resolve(item)));
            const results = await Promise.all(promises);
            return results.filter(item => item !== null);
        },
        async startBatchScrape() {
            const startInput = document.querySelector(CONFIG.SELECTORS.INPUT_START);
            const endInput = document.querySelector(CONFIG.SELECTORS.INPUT_END);
            const start = parseInt(startInput?.value, 10);
            const end = parseInt(endInput?.value, 10);
            if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0 || start > end) {
                alert('请输入有效的起止页码，且起始页不能大于结束页。');
                return;
            }
            const baseUrl = window.location.href.split('/page-')[0].split('?')[0].replace(/\/$/, '');
            const prog = document.querySelector(CONFIG.SELECTORS.PROGRESS);
            const fill = document.querySelector(CONFIG.SELECTORS.PROG_FILL);
            const txt = document.querySelector(CONFIG.SELECTORS.PROG_TXT);
            document.querySelector(CONFIG.SELECTORS.SCRAPE_CONFIG).style.display = 'none';
            prog.style.display = 'flex';
            STATE.stopScraping = false;
            STATE.activeScrapeRequests = [];
            const pageData = new Map();
            const tasks = Array.from({ length: end - start + 1 }, (_, i) => start + i);
            const total = tasks.length;
            let completed = 0;
            txt.innerText = `准备中... 0 / ${total} 页.`;
            fill.style.width = '0%';
            const worker = async () => {
                while (tasks.length > 0) {
                    if (STATE.stopScraping) return;
                    const pageNum = tasks.shift();
                    if (pageNum === undefined) continue;
                    const url = pageNum === 1 ? baseUrl : `${baseUrl}/page-${pageNum}`;
                    try {
                        const html = await new Promise((resolve, reject) => GM_xmlhttpRequest({ method: "GET", url, onload: r => resolve(r.responseText), onerror: reject, onabort: () => reject(new Error('Aborted')), ontimeout: () => reject(new Error('Timeout')) }));
                        if (STATE.stopScraping) return;
                        const doc = new DOMParser().parseFromString(html, "text/html");
                        const rawItems = await Core.extractAllFromContext(doc, pageNum);
                        const validItems = await Core.filterValidMedia(rawItems);
                        if (validItems.length > 0) pageData.set(pageNum, validItems);
                    } catch (e) {
                        Logger.error(`Page ${pageNum} error`, e);
                    } finally {
                        completed++;
                        if (!STATE.stopScraping) {
                            txt.innerText = `抓取中... ${completed} / ${total} 页已完成。`;
                            fill.style.width = `${(completed / total) * 100}%`;
                        }
                    }
                    if (!STATE.stopScraping) await new Promise(r => setTimeout(r, CONFIG.REQUEST_DELAY));
                }
            };
            await Promise.all(Array(CONFIG.CONCURRENCY).fill(0).map(worker));
            txt.innerText = STATE.stopScraping ? '已中止' : '处理最终结果...';
            if (!STATE.stopScraping) {
                const getDedupKey = (item) => Utils.getBaseUrl(item.type === 'link' ? item.href : item.src || item.userProfileUrl);
                const seenKeys = new Set(STATE.allMedia.map(getDedupKey));
                const newMedia = [...STATE.allMedia];
                const sortedPages = Array.from(pageData.keys()).sort((a, b) => a - b);
                const fetchedItems = sortedPages.flatMap(pageNum => pageData.get(pageNum) || []);
                fetchedItems.forEach(item => {
                    const key = getDedupKey(item);
                    if (!seenKeys.has(key)) {
                        newMedia.push(item);
                        seenKeys.add(key);
                    }
                });
                newMedia.sort((a, b) => a.page - b.page || a.order - b.order);
                STATE.allMedia = newMedia;
            }
            txt.innerText = STATE.stopScraping ? '已中止' : '已完成';
            Object.keys(STATE.tabs).forEach(key => STATE.tabs[key].items = null);
            setTimeout(() => { prog.style.display = 'none'; Core.renderGrid(true); }, 1000);
        },
        async downloadBatch() {
            const targets = Array.from(STATE.selectedItems).map(i => STATE.virtual.items[i]).filter(Boolean);
            if (targets.length === 0) return alert('未选择任何项目！');
            const prog = document.querySelector(CONFIG.SELECTORS.PROGRESS);
            const fill = document.querySelector(CONFIG.SELECTORS.PROG_FILL);
            const txt = document.querySelector(CONFIG.SELECTORS.PROG_TXT);
            prog.style.display = 'flex';
            STATE.stopScraping = false;
            const title = Utils.getSafeTitle();
            const { BATCH_SIZE, BATCH_DELAY, ITEM_DELAY } = CONFIG.BATCH_DOWNLOAD;
            const totalBatches = Math.ceil(targets.length / BATCH_SIZE);
            let seq = 1;
            let downloaded = 0;

            for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
                if (STATE.stopScraping) {
                    txt.innerText = '下载已中止';
                    await new Promise(r => setTimeout(r, 1500));
                    break;
                }

                const batchStart = batchIndex * BATCH_SIZE;
                const batchEnd = Math.min(batchStart + BATCH_SIZE, targets.length);
                const currentBatch = targets.slice(batchStart, batchEnd);

                txt.innerText = `批次 ${batchIndex + 1}/${totalBatches} | 总进度 ${downloaded}/${targets.length}`;

                for (let i = 0; i < currentBatch.length; i++) {
                    if (STATE.stopScraping) break;

                    const item = currentBatch[i];
                    const overallIndex = batchStart + i;
                    fill.style.width = `${Math.round((overallIndex / targets.length) * 100)}%`;
                    txt.innerText = `批次 ${batchIndex + 1}/${totalBatches} | 下载中 ${overallIndex + 1}/${targets.length}`;

                    try {
                        let finalUrl = item.src;
                        if (item.type === 'video' && !finalUrl.endsWith('.mp4') && !finalUrl.match(/\.(mov|m4v|webm)/)) {
                            finalUrl = finalUrl.replace('attachments/posters', 'video').replace('/lsvideo/thumbnails', '/lsvideo/videos').replace('/posters/', '/video/').replace(/\.(jpg|png|webp|gif)(\?.*)?$/i, '.mp4');
                        }
                        const blob = await new Promise((resolve, reject) => GM_xmlhttpRequest({ method: "GET", url: finalUrl, responseType: 'blob', headers: { "Referer": window.location.href }, onload: r => r.status === 200 ? resolve(r.response) : reject(new Error(r.statusText)), onerror: reject, onabort: () => reject(new Error('Aborted')) }));
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        let ext = item.format || (finalUrl.split('?')[0].split('.').pop()) || 'jpg';
                        a.download = `${title}-${String(seq).padStart(4, '0')}.${ext}`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(a.href);
                        seq++;
                        downloaded++;
                    } catch (e) {
                        Logger.error('下载失败', e);
                    }

                    // 每个文件之间的小间隔
                    if (i < currentBatch.length - 1) {
                        await new Promise(r => setTimeout(r, ITEM_DELAY));
                    }
                }

                // 批次之间的暂停，让 Safari 喘口气
                if (batchIndex < totalBatches - 1 && !STATE.stopScraping) {
                    txt.innerText = `批次 ${batchIndex + 1} 完成，暂停 ${BATCH_DELAY / 1000} 秒...`;
                    await new Promise(r => setTimeout(r, BATCH_DELAY));
                }
            }

            if (!STATE.stopScraping) {
                txt.innerText = `全部完成！共下载 ${downloaded} 个文件`;
                fill.style.width = '100%';
                await new Promise(r => setTimeout(r, 2000));
            }
            prog.style.display = 'none';
        },
        createCardContent(item) {
            const fragment = document.createDocumentFragment();
            const placeholderSrc = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
            if (item.type === 'verification') {
                const headerDiv = Utils.createElement('div', { className: 'veri-header' });
                const avatarDiv = Utils.createElement('div', { className: 'veri-avatar' });
                avatarDiv.appendChild(Utils.createElement('img', { src: item.userAvatar || placeholderSrc, alt: `${item.userName} avatar` }));
                const infoDiv = Utils.createElement('div', { className: 'veri-info' });
                infoDiv.innerHTML = `<h3><a href="${item.userProfileUrl}" target="_blank" rel="noopener noreferrer">${item.userName}</a></h3>${item.userInfoHtml}`;
                headerDiv.appendChild(avatarDiv);
                headerDiv.appendChild(infoDiv);
                const imagesDiv = Utils.createElement('div', { className: 'veri-images' });
                item.verificationImages.forEach(imgSrc => imagesDiv.appendChild(Utils.createElement('img', { src: imgSrc, loading: 'lazy' })));
                fragment.appendChild(headerDiv);
                fragment.appendChild(imagesDiv);
            } else if (item.type === 'video') {
                const container = Utils.createElement('div', { className: 'video-container' });
                const thumb = item.poster || item.thumb || placeholderSrc;
                if (thumb === placeholderSrc && !item.poster && !item.thumb) {
                    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#000;color:#555;font-size:40px;">▶</div><div class="play-bar"><div class="play-icon-small">▶</div><span>播放</span></div>`;
                } else {
                    container.innerHTML = `<img src="${placeholderSrc}" data-src="${thumb}" decoding="async"><div class="play-bar"><div class="play-icon-small">▶</div><span>播放</span></div>`;
                }
                fragment.appendChild(container);
            } else if (item.type === 'image') {
                fragment.appendChild(Utils.createElement('img', { src: placeholderSrc, dataset: { src: item.thumb }, decoding: 'async' }));
            } else if (item.type === 'link') {
                const card = Utils.createElement('div', { className: 'link-card' });
                card.innerHTML = `<div class="link-title">${item.text}</div><a href="${item.href}" target="_blank" class="action-btn" onmousedown="event.stopPropagation()">打开链接</a>`;
                fragment.appendChild(card);
            }
            if (item.type !== 'link' && item.type !== 'verification') fragment.appendChild(Utils.createElement('div', { className: 'badge', textContent: `P${item.page}` }));
            if (item.type !== 'verification') fragment.appendChild(Utils.createElement('div', { className: 'check-mark' }));
            return fragment;
        },
        getFilteredItems() {
            const dedup = document.getElementById('f-dedup')?.checked;
            const activeFmts = Array.from(document.querySelectorAll('#f-image .fmt-tag.active')).map(e => e.dataset.fmt);
            const fmts = new Set(activeFmts);
            let list = STATE.allMedia.filter(m => {
                if (STATE.currentTab === 'image') {
                    if (m.type !== 'image') return false;
                    if (fmts.has(m.format)) return true;
                    if (m.format === 'jpeg' && fmts.has('jpg')) return true;
                    if (fmts.has('other')) {
                        const commonFmts = ['jpg', 'jpeg', 'png', 'gif'];
                        if (!commonFmts.includes(m.format)) return true;
                    }
                    if (fmts.size === 0) return true;
                    return false;
                }
                return m.type === STATE.currentTab;
            });
            if (dedup && STATE.currentTab !== 'verification') {
                const map = new Map();
                list.forEach(item => {
                    const key = item.type === 'link' ? item.href : Utils.getBaseUrl(item.src);
                    if (!map.has(key)) map.set(key, item);
                });
                list = Array.from(map.values());
            }
            return list;
        },
        renderGrid(force = false) {
            const container = document.querySelector(CONFIG.SELECTORS.GRID_CONTAINER);
            if (!container) return;
            if (force || !STATE.tabs[STATE.currentTab].items) {
                if (STATE.virtual.imageObserver) STATE.virtual.renderedNodes.forEach(node => { node.querySelectorAll('img[data-src]').forEach(img => STATE.virtual.imageObserver.unobserve(img)); });
                STATE.virtual.renderedNodes.clear();
                document.querySelector(CONFIG.SELECTORS.GRID).innerHTML = '';
                STATE.virtual.items = Core.getFilteredItems();
                STATE.tabs[STATE.currentTab].items = [...STATE.virtual.items];
                STATE.virtual.lastStartRow = -1;
                if (force) STATE.selectedItems = new Set(STATE.tabs[STATE.currentTab].selection);
                else { STATE.selectedItems.clear(); STATE.tabs[STATE.currentTab].selection.clear(); STATE.tabs[STATE.currentTab].scrollTop = 0; }
            } else {
                STATE.virtual.items = STATE.tabs[STATE.currentTab].items;
                STATE.selectedItems = new Set(STATE.tabs[STATE.currentTab].selection);
            }
            document.querySelectorAll('.filter-bar').forEach(b => b.classList.remove('active-bar'));
            const currentFilterBar = document.getElementById(`f-${STATE.currentTab}`);
            if (currentFilterBar) currentFilterBar.classList.add('active-bar');
            document.querySelector(CONFIG.SELECTORS.COUNT).innerText = `已选: ${STATE.selectedItems.size}`;
            Core.updateVirtualDOM(true);
            requestAnimationFrame(() => { container.scrollTop = STATE.tabs[STATE.currentTab].scrollTop; });
        },
        updateVirtualDOM(force = false) {
            const container = document.querySelector(CONFIG.SELECTORS.GRID_CONTAINER);
            const grid = document.querySelector(CONFIG.SELECTORS.GRID);
            const placeholder = document.querySelector(CONFIG.SELECTORS.PLACEHOLDER);
            if (!container || !grid) return;
            const containerW = container.clientWidth - 48;
            let cols;
            if (STATE.currentTab === 'video') cols = (containerW >= 1100 ? 3 : (containerW >= 700 ? 2 : 1));
            else if (STATE.currentTab === 'link') cols = (containerW >= 600 ? 2 : 1);
            else if (STATE.currentTab === 'verification') {
                cols = (containerW >= 1600 ? 4 : (containerW >= 1000 ? 3 : (containerW >= 600 ? 2 : 1)));
            }
            else {
                // Image tab responsive logic
                if (containerW >= 1600) cols = 6;
                else if (containerW >= 1200) cols = 5;
                else if (containerW >= 900) cols = 4;
                else if (containerW >= 600) cols = 3;
                else if (containerW >= 350) cols = 2;
                else cols = 1;
            }
            const { VIDEO_CARD_HEIGHT, LINK_CARD_HEIGHT, IMG_CARD_HEIGHT, VERIFICATION_CARD_HEIGHT } = CONFIG.DIMENSIONS;
            let rowHeight;
            if (STATE.currentTab === 'video') rowHeight = VIDEO_CARD_HEIGHT + 16;
            else if (STATE.currentTab === 'link') rowHeight = LINK_CARD_HEIGHT + 16;
            else if (STATE.currentTab === 'verification') rowHeight = VERIFICATION_CARD_HEIGHT + 16;
            else rowHeight = IMG_CARD_HEIGHT + 16;
            STATE.virtual.cols = cols;
            grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
            const totalRows = Math.ceil(STATE.virtual.items.length / cols);
            placeholder.style.height = `${totalRows * rowHeight}px`;
            const scrollTop = container.scrollTop;
            const buffer = 5;
            const visibleRows = Math.ceil(container.clientHeight / rowHeight);
            const currentRow = Math.floor(scrollTop / rowHeight);
            let startRow = STATE.virtual.lastStartRow;
            if (force || startRow === -1 || Math.abs(currentRow - startRow) > buffer) startRow = Math.max(0, currentRow - buffer);
            if (!force && startRow === STATE.virtual.lastStartRow) return;
            STATE.virtual.lastStartRow = startRow;
            const endIndex = Math.min(STATE.virtual.items.length, (startRow + visibleRows + buffer * 2) * cols);
            const startIndex = startRow * cols;
            grid.style.transform = `translateY(${startRow * rowHeight}px)`;
            const visibleSet = new Set();
            for (let i = startIndex; i < endIndex; i++) visibleSet.add(i);
            for (const [idx, node] of STATE.virtual.renderedNodes.entries()) {
                if (!visibleSet.has(idx)) {
                    node.querySelectorAll('img').forEach(img => { if (STATE.virtual.imageObserver) STATE.virtual.imageObserver.unobserve(img); });
                    node.remove();
                    STATE.virtual.renderedNodes.delete(idx);
                }
            }
            for (let i = startIndex; i < endIndex; i++) {
                const item = STATE.virtual.items[i];
                if (!item) continue;
                const isSel = STATE.selectedItems.has(i);
                if (STATE.virtual.renderedNodes.has(i)) {
                    const node = STATE.virtual.renderedNodes.get(i);
                    if (node.classList.contains('selected') !== isSel) node.classList.toggle('selected', isSel);
                } else {
                    let cardClass = 'm-card';
                    if (item.type === 'video') cardClass += ' video-card';
                    else if (item.type === 'link') cardClass += ' link-c';
                    else if (item.type === 'verification') cardClass += ' verification-card';
                    if (isSel) cardClass += ' selected';
                    const card = Utils.createElement('div', { className: cardClass, dataset: { idx: i } });
                    card.appendChild(Core.createCardContent(item));
                    grid.appendChild(card);
                    STATE.virtual.renderedNodes.set(i, card);
                    card.querySelectorAll('img').forEach(img => { if (STATE.virtual.imageObserver) STATE.virtual.imageObserver.observe(img); });
                }
            }
        },
        initUI() {
            if (document.getElementById(CONFIG.SELECTORS.MODAL)) return;
            const modalHTML = `
                <div id="lpsg-modal" translate="no" class="notranslate">
                    <div class="lpsg-header">
                        <h2></h2>
                        <div class="tab-group">
                            <button class="tab-btn active" data-tab="image">图片</button>
                            <button class="tab-btn" data-tab="video">视频</button>
                            <button class="tab-btn" data-tab="link">链接</button>
                            <button class="tab-btn" data-tab="verification">验证</button>
                        </div>
                        <div style="flex:1"></div>
                        <button class="action-btn" id="lpsg-all">全选</button>
                        <button class="action-btn" id="lpsg-invert">反选</button>
                        <button class="action-btn primary" id="lpsg-scrape-btn">多页抓取</button>
                        <span id="lpsg-count" style="font-size:13px;color:rgba(255,255,255,0.6);margin:0 15px;min-width:60px;text-align:right">已选: 0</span>
                        <button class="action-btn" id="lpsg-close" style="width:32px;height:32px;border-radius:50%;padding:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1)">×</button>
                    </div>
                    <div class="filter-bar active-bar" id="f-image"><span class="fmt-tag active" data-fmt="jpg">JPG</span><span class="fmt-tag active" data-fmt="png">PNG</span><span class="fmt-tag active" data-fmt="gif">GIF</span><span class="fmt-tag active" data-fmt="other">Other</span><span style="margin-left:10px;font-size:12px;opacity:0.8">筛选 > 200px</span><label style="cursor:pointer;margin-left:10px;display:flex;align-items:center;gap:5px"><input type="checkbox" id="f-dedup" checked> 去重</label><div style="flex:1"></div><button class="action-btn primary" id="btn-batch-dl">下载</button></div>
                    <div class="filter-bar" id="f-video"><div style="flex:1"></div><button class="action-btn primary" id="btn-video-dl">下载视频</button></div>
                    <div class="filter-bar" id="f-link"><div style="flex:1"></div><button class="action-btn primary" id="btn-copy-links">复制链接</button></div>
                    <div class="filter-bar" id="f-verification"><div style="flex:1"></div><span style="font-size:12px;opacity:0.6;">验证信息在“多页抓取”时自动获取</span></div>
                    <div class="grid-container" id="vs-container"><div id="vs-placeholder"></div><div class="media-grid" id="lpsg-grid"></div></div>
                </div>
                <div id="scrape-config" translate="no" class="notranslate"><h3 style="margin:0 0 20px 0;font-size:17px;font-weight:600">批量抓取</h3><div style="margin:15px 0;display:flex;justify-content:space-between;align-items:center"><span>起始页</span><input type="number" id="s-start" value="1" class="filter-input"></div><div style="margin:15px 0;display:flex;justify-content:space-between;align-items:center"><span>结束页</span><input type="number" id="s-end" value="3" class="filter-input"></div><div style="display:flex;gap:12px;margin-top:25px"><button class="action-btn" id="btn-scrape-cancel" style="flex:1;height:36px">取消</button><button class="action-btn primary" id="btn-scrape-go" style="flex:1;height:36px">开始</button></div></div>
                <div id="lpsg-progress" translate="no" class="notranslate"><div style="font-size:14px;font-weight:600;margin-bottom:5px;width:100%"><span id="prog-txt">处理中...</span></div><div class="prog-bar"><div class="prog-fill" id="prog-fill"></div></div><a href="javascript:;" id="prog-stop" style="color:#ff453a;text-decoration:none;font-size:12px;margin-top:10px;">停止</a></div>
                <div id="lpsg-button-container"></div>`;
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // 单独创建浮动按钮并直接添加到 body，避免继承页面 transform
            const btnContainer = document.getElementById('lpsg-button-container');
            if (btnContainer) {
                btnContainer.innerHTML = `
                    <div id="lpsg-btn" title="打开下载页面"><svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg></div>
                    <div id="${CONFIG.HELPER_SELECTORS.BALL}" title="打开设置页面"><svg viewBox="0 0 24 24"><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/></svg></div>
                `;
                // 强制重新定位到 body 末尾，脱离任何可能有 transform 的祖先
                document.body.appendChild(btnContainer);
            }
        },
        bindEvents() {
            const scrollContainer = document.querySelector(CONFIG.SELECTORS.GRID_CONTAINER);
            if (scrollContainer) {
                STATE.virtual.imageObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            img.src = img.dataset.src || img.src;
                            if (img.dataset.src) img.removeAttribute('data-src');
                            observer.unobserve(img);
                        }
                    });
                }, { root: scrollContainer, rootMargin: '200px', threshold: 0.01 });
            }
            document.querySelector(CONFIG.SELECTORS.MAIN_BTN).onclick = async function () {
                if (this.classList.contains('loading')) return;
                if (STATE.allMedia.length === 0) {
                    this.classList.add('loading');
                    try {
                        const raw = await Core.extractAllFromContext(document, Utils.getCurrentPageNumber());
                        STATE.allMedia = await Core.filterValidMedia(raw);
                        Object.keys(STATE.tabs).forEach(k => STATE.tabs[k].items = null);
                    } catch (e) { Logger.error('Init scrape error', e); }
                    finally { this.classList.remove('loading'); }
                }
                Core.renderGrid(true);
                document.querySelector(CONFIG.SELECTORS.MODAL).classList.add('show');
                document.body.classList.add('lpsg-modal-open');
            };
            document.getElementById('lpsg-close').onclick = () => { document.querySelector(CONFIG.SELECTORS.MODAL).classList.remove('show'); document.body.classList.remove('lpsg-modal-open'); };
            document.querySelectorAll('#lpsg-modal .tab-btn').forEach(b => b.onclick = () => {
                if (STATE.currentTab === b.dataset.tab) return;
                STATE.tabs[STATE.currentTab].scrollTop = document.querySelector(CONFIG.SELECTORS.GRID_CONTAINER).scrollTop;
                STATE.currentTab = b.dataset.tab;
                document.querySelectorAll('#lpsg-modal .tab-btn').forEach(t => t.classList.remove('active'));
                b.classList.add('active');
                Core.renderGrid(true);
            });
            document.getElementById('f-dedup').onchange = () => Core.renderGrid(true);
            document.querySelectorAll('#f-image .fmt-tag').forEach(t => t.onclick = () => { t.classList.toggle('active'); Core.renderGrid(true); });
            document.getElementById('lpsg-scrape-btn').onclick = () => {
                const maxPage = (() => { try { const p = document.querySelector('.pageNav-main'); const a = p?.querySelectorAll('li.pageNav-page a'); return a?.length > 0 ? (parseInt(a[a.length - 1].textContent) || 1) : 1; } catch { return 1; } })();
                document.getElementById('s-start').value = Utils.getCurrentPageNumber();
                document.getElementById('s-end').value = maxPage;
                document.querySelector(CONFIG.SELECTORS.SCRAPE_CONFIG).style.display = 'block';
            };
            document.getElementById('btn-scrape-cancel').onclick = () => document.querySelector(CONFIG.SELECTORS.SCRAPE_CONFIG).style.display = 'none';
            document.getElementById('btn-scrape-go').onclick = Core.startBatchScrape;
            document.getElementById('prog-stop').onclick = () => { STATE.stopScraping = true; if (STATE.activeDownloadRequest) STATE.activeDownloadRequest.abort(); STATE.activeScrapeRequests.forEach(r => r.abort()); };
            document.getElementById('btn-batch-dl').onclick = Core.downloadBatch;
            document.getElementById('btn-video-dl').onclick = Core.downloadBatch;
            document.getElementById('btn-copy-links').onclick = () => { const links = Array.from(STATE.selectedItems).map(i => STATE.virtual.items[i].href).join('\n'); navigator.clipboard.writeText(links).then(() => alert('已复制!')); };
            const toggleSel = (idx, add) => {
                const realIdx = parseInt(idx);
                if (STATE.virtual.items[realIdx]?.type === 'verification') return;
                if (add) STATE.selectedItems.add(realIdx); else STATE.selectedItems.delete(realIdx);
                STATE.tabs[STATE.currentTab].selection = new Set(STATE.selectedItems);
                const card = STATE.virtual.renderedNodes.get(realIdx);
                if (card) card.classList.toggle('selected', add);
                document.querySelector(CONFIG.SELECTORS.COUNT).innerText = `已选: ${STATE.selectedItems.size}`;
            };
            document.getElementById('lpsg-all').onclick = () => {
                STATE.selectedItems = new Set(STATE.virtual.items.map((item, i) => item.type !== 'verification' ? i : -1).filter(i => i !== -1));
                STATE.tabs[STATE.currentTab].selection = new Set(STATE.selectedItems);
                Core.renderGrid(true);
            };
            document.getElementById('lpsg-invert').onclick = () => {
                const newSet = new Set();
                STATE.virtual.items.forEach((item, i) => { if (item.type !== 'verification' && !STATE.selectedItems.has(i)) newSet.add(i); });
                STATE.selectedItems = newSet;
                STATE.tabs[STATE.currentTab].selection = new Set(STATE.selectedItems);
                Core.renderGrid(true);
            };
            document.querySelector(CONFIG.SELECTORS.GRID_CONTAINER).addEventListener('scroll', () => { requestAnimationFrame(() => Core.updateVirtualDOM()); }, { passive: true });
            const grid = document.querySelector(CONFIG.SELECTORS.GRID);
            grid.addEventListener('click', (e) => {
                const pb = e.target.closest('.play-bar');
                if (pb) {
                    e.stopPropagation();
                    const card = pb.closest('.m-card');
                    const item = STATE.virtual.items[parseInt(card.dataset.idx)];
                    const container = card.querySelector('.video-container');
                    container.classList.add('playing');

                    // [修改] 智能播放逻辑：不再暴力替换，而是优先信任原链接
                    let vUrl = item.src;

                    // 只有当链接看起来完全不是视频时，才尝试进行“推测替换”
                    // 并且保留了参数(?...)
                    const isVideoUrl = vUrl.match(/\.(mp4|mov|m4v|webm)(\?|$)/i);
                    if (!isVideoUrl && (item.type === 'video' || item.poster)) {
                        let base = item.poster || item.src;
                        // 尝试推测 mp4 地址，保留参数
                        vUrl = base.replace('attachments/posters', 'video')
                            .replace('/lsvideo/thumbnails', '/lsvideo/videos')
                            .replace('/posters/', '/video/')
                            .replace(/\.(jpg|png|webp|gif)/i, '.mp4');
                    }

                    container.innerHTML = `<video src="${vUrl}" style="width:100%;height:100%;object-fit:contain;" controls autoplay playsinline></video><div class="video-close-btn">×</div>`;
                    const v = container.querySelector('video');
                    const close = container.querySelector('.video-close-btn');

                    const restore = (ev) => {
                        if (ev) ev.stopPropagation();
                        v.pause(); v.src = "";
                        container.classList.remove('playing');
                        const thumb = item.poster || item.thumb;
                        if (!thumb) {
                            container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#000;color:#555;font-size:40px;">▶</div><div class="play-bar"><div class="play-icon-small">▶</div><span>播放</span></div>`;
                        } else {
                            container.innerHTML = `<img src="${thumb}" decoding="async"><div class="play-bar"><div class="play-icon-small">▶</div><span>播放</span></div>`;
                        }
                    };
                    close.onclick = restore;

                    // [新增] 自动容错重试机制
                    v.onerror = () => {
                        let currentSrc = v.src;
                        // 如果是mp4失败，尝试推测 mov
                        if (currentSrc.includes('.mp4')) {
                            console.log('MP4 failed, trying MOV...');
                            v.src = currentSrc.replace('.mp4', '.mov');
                        }
                        // 如果是mov失败，尝试 m4v
                        else if (currentSrc.includes('.mov')) {
                            console.log('MOV failed, trying M4V...');
                            v.src = currentSrc.replace('.mov', '.m4v');
                        }
                        // 如果都失败了，显示错误界面
                        else {
                            container.innerHTML = `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);color:#ff453a;"><div style="margin-bottom:12px">无法播放</div><button class="action-btn" onclick="window.open('${vUrl}');event.stopPropagation()">打开链接</button><div class="video-close-btn">×</div></div>`;
                            container.querySelector('.video-close-btn').onclick = restore;
                        }
                    };
                }
            });
            grid.addEventListener('mousedown', (e) => {
                if (e.target.closest('.play-bar, video, .video-close-btn, .action-btn, .verification-card')) return;
                STATE.isMouseDown = true; STATE.isDragging = false;
                STATE.dragStartX = e.clientX; STATE.dragStartY = e.clientY;
            });
            window.addEventListener('mousemove', (e) => {
                if (!STATE.isMouseDown) return;
                if (!STATE.isDragging) {
                    if (Math.hypot(e.clientX - STATE.dragStartX, e.clientY - STATE.dragStartY) > CONFIG.DRAG_THRESHOLD) {
                        STATE.isDragging = true;
                        document.body.classList.add('lpsg-dragging');
                        const card = document.elementFromPoint(STATE.dragStartX, STATE.dragStartY)?.closest('.m-card');
                        if (card) {
                            e.preventDefault();
                            const idx = parseInt(card.dataset.idx);
                            STATE.dragMode = STATE.selectedItems.has(idx) ? 'del' : 'add';
                            toggleSel(idx, STATE.dragMode === 'add');
                            STATE.lastHoveredIndex = idx;
                        }
                    }
                }
                if (STATE.isDragging) {
                    e.preventDefault();
                    const card = e.target.closest('.m-card');
                    if (card) {
                        const idx = parseInt(card.dataset.idx);
                        if (idx !== STATE.lastHoveredIndex) { toggleSel(idx, STATE.dragMode === 'add'); STATE.lastHoveredIndex = idx; }
                    }
                }
            });
            window.addEventListener('mouseup', (e) => {
                if (!STATE.isMouseDown) return;
                if (!STATE.isDragging) { const card = e.target.closest('.m-card'); if (card) toggleSel(card.dataset.idx, !STATE.selectedItems.has(parseInt(card.dataset.idx))); }
                STATE.isMouseDown = false; STATE.isDragging = false; STATE.lastHoveredIndex = -1;
                document.body.classList.remove('lpsg-dragging');
            });
        }
    };
    const HelperCore = {
        replaceUnplayableVideos() {
            const posters = document.getElementsByClassName("video-easter-egg-poster");
            if (posters.length === 0) { HelperCore.enlargeAndMuteVideo(); return; }
            if (posters.length > 5) CONFIG.HELPER_CONFIG.autoSwitchInterval = 5000;
            for (let i = posters.length - 1; i >= 0; i--) {
                const container = posters[i].parentElement.parentElement;
                const imgUrl = posters[i].children[0].src;
                const videoUrl = imgUrl.replace("attachments/posters", "video").replace("/lsvideo/thumbnails", "lsvideo/videos").replace(".jpg", ".mp4");
                const newDiv = Utils.createElement("div", { className: "lpsgh-newVideoDiv" });
                newDiv.innerHTML = `<video onloadstart="this.volume=${CONFIG.HELPER_CONFIG.defaultVolume}" style="width:100%; max-height:750px; border-radius:8px;" controls poster="${imgUrl}"><source data-src="${videoUrl}" src="${videoUrl}">您的浏览器无法播放此视频。</video>`;
                const btnGroup = Utils.createElement("div", { style: "margin-top: 5px;" });
                ['mov', 'm4v', 'mp4'].forEach(fmt => {
                    const btn = Utils.createElement("span", { className: CONFIG.HELPER_SELECTORS.CLASSES.VIDEO_FMT_BTN, textContent: "切换 " + fmt.toUpperCase() });
                    btn.onclick = () => {
                        STATE.HELPER_STATE.shouldContinueSwitching = false;
                        const vidDiv = container.querySelector(".lpsgh-newVideoDiv");
                        if (vidDiv) vidDiv.innerHTML = vidDiv.innerHTML.replace(/\.(mp4|m4v|mov)/g, '.' + fmt);
                    };
                    btnGroup.appendChild(btn);
                });
                container.appendChild(newDiv);
                container.appendChild(btnGroup);
                posters[i].parentElement.remove();
            }
            document.querySelectorAll(".video-easter-egg-blocker, .video-easter-egg-overlay").forEach(el => el.remove());
            HelperCore.enlargeAndMuteVideo();
            setTimeout(HelperCore.checkVideosAndUpdate, CONFIG.HELPER_CONFIG.autoSwitchInterval);
        },
        checkVideosAndUpdate() {
            if (!STATE.HELPER_STATE.shouldContinueSwitching) return;
            let allLoaded = true;
            document.querySelectorAll('video').forEach(video => {
                if (video.readyState < 4) {
                    allLoaded = false;
                    video.querySelectorAll('source').forEach(source => {
                        const src = source.src || source.getAttribute('data-src');
                        if (!src) return;
                        let newSrc = src.endsWith('.mp4') ? src.replace('.mp4', '.mov') : (src.endsWith('.mov') ? src.replace('.mov', '.m4v') : src.replace('.m4v', '.mp4'));
                        source.src = newSrc;
                        source.setAttribute('data-src', newSrc);
                    });
                    video.load();
                }
            });
            if (!allLoaded) setTimeout(HelperCore.checkVideosAndUpdate, CONFIG.HELPER_CONFIG.autoSwitchInterval);
        },
        enlargeAndMuteVideo() {
            document.querySelectorAll('video').forEach(video => {
                if (video.parentElement.className !== 'lpsgh-newVideoDiv') {
                    video.style.cssText = 'width:100%; max-height:750px; border-radius:8px;';
                    video.volume = CONFIG.HELPER_CONFIG.defaultVolume;
                    video.parentElement.before(video);
                }
            });
            document.querySelectorAll('div.bbMediaWrapper--inline').forEach(el => el.style.width = '100%');
        },
        applyImageSettings() {
            const maxWidth = localStorage.getItem('LPSG_MaxImgWidth');
            const onePicLine = localStorage.getItem('LPSG_OnePicPerLine') === 'true';
            const enlargeAtt = localStorage.getItem('LPSG_EnlargeAttachment') === 'true';
            document.querySelectorAll('.message-cell.message-cell--main img:not(.smilie)').forEach(img => { img.style.maxWidth = (maxWidth && maxWidth > 0) ? `${maxWidth}px` : ''; });
            document.querySelectorAll('.bbImageWrapper, .inserted-img, .bbImage, .bbMediaWrapper').forEach(el => { el.style.display = onePicLine ? 'block' : 'inline-block'; });
            if (enlargeAtt) {
                if (document.querySelectorAll('img.inserted-img').length === 0) {
                    document.querySelectorAll('section.message-attachments').forEach(section => {
                        section.querySelectorAll('a.file-preview.js-lbImage').forEach(link => {
                            const img = Utils.createElement('img', { src: link.href, className: 'inserted-img', style: `max-width: ${maxWidth ? `${maxWidth}px` : ''}; height: auto; margin: 5px; display: ${onePicLine ? 'block' : 'inline-block'};` });
                            section.appendChild(img);
                        });
                        section.querySelectorAll('ul.attachmentList').forEach(ul => ul.style.display = 'none');
                    });
                }
            } else {
                document.querySelectorAll('img.inserted-img').forEach(img => img.remove());
                document.querySelectorAll('ul.attachmentList').forEach(ul => ul.style.display = '');
            }
        },
        insertVerificationImages() {
            document.querySelectorAll('article.message').forEach(article => {
                if (article.querySelector('.' + CONFIG.HELPER_SELECTORS.CLASSES.VERI_CONTAINER)) return;
                const userExtras = article.querySelector('.message-cell--user .message-userExtras');
                if (!userExtras) return;
                let verificationLink = null;
                userExtras.querySelectorAll('dt').forEach(dt => {
                    const text = dt.textContent.toLowerCase();
                    if (text.includes('verification') || text.includes('确认')) {
                        const link = dt.nextElementSibling?.querySelector('a');
                        if (link?.href) verificationLink = link.href;
                    }
                });
                if (verificationLink) HelperCore.fetchAndDisplayVerification(verificationLink, userExtras);
            });
        },
        async fetchAndDisplayVerification(profileUrl, insertAfterElement) {
            const container = Utils.createElement('div', { className: CONFIG.HELPER_SELECTORS.CLASSES.VERI_CONTAINER });
            container.innerHTML = `<div class="lpsgh-verification-loading" style="text-align:center;color:#888;font-size:12px;">加载中...</div>`;
            insertAfterElement.after(container);
            try {
                const imgs = await Utils.fetchVerificationImageUrls(profileUrl);
                container.innerHTML = '';
                const label = Utils.createElement('div', { className: CONFIG.HELPER_SELECTORS.CLASSES.VERI_LABEL, textContent: '验证照片' });
                container.appendChild(label);
                if (imgs.length > 0) {
                    imgs.slice(0, 3).forEach(src => container.appendChild(Utils.createElement('img', { src, loading: 'lazy', onerror: (e) => e.target.remove() })));
                } else {
                    container.innerHTML += `<div style="text-align:center;color:#888;font-size:12px;padding:4px 0;cursor:pointer;" onclick="window.open('${profileUrl}', '_blank');">点击查看</div>`;
                }
            } catch (err) {
                container.innerHTML = `<div class="${CONFIG.HELPER_SELECTORS.CLASSES.VERI_LABEL}">验证照片</div><div style="text-align:center;color:#888;font-size:12px;padding:4px 0;cursor:pointer;" onclick="window.open('${profileUrl}', '_blank');">点击查看</div>`;
            }
        },
        applyFlowSettings() {
            const hideUser = localStorage.getItem('LPSG_HideUserInfo') === 'true';
            const foldPost = localStorage.getItem('LPSG_FoldPost') === 'true';
            document.querySelectorAll('.message-userExtras').forEach(el => { el.style.display = hideUser ? 'none' : ''; });
            if (foldPost && !window._lpsghFoldBound) {
                document.body.addEventListener('click', (e) => {
                    const inner = e.target.closest('.message-inner');
                    if (!inner || e.target.closest('a, video, img, input, button')) return;
                    inner.classList.toggle('lpsgh-folded');
                    inner.style.height = inner.classList.contains('lpsgh-folded') ? '150px' : '';
                    inner.style.overflowY = inner.classList.contains('lpsgh-folded') ? 'hidden' : '';
                });
                window._lpsghFoldBound = true;
            }
            HelperCore.insertVerificationImages();
        },
        initUI() {
            if (document.getElementById(CONFIG.HELPER_SELECTORS.MODAL)) return;
            const C = CONFIG.HELPER_SELECTORS.CLASSES;
            const modal = Utils.createElement('div', { id: CONFIG.HELPER_SELECTORS.MODAL });
            modal.innerHTML = `
                <div class="${C.HEADER}"><h2>设置页面</h2><button class="${C.CLOSE_ICON}" id="${CONFIG.HELPER_SELECTORS.CLOSE}" type="button">×</button></div>
                <div class="${C.TAB_GROUP}"><button class="${C.TAB_BTN} ${C.ACTIVE}" data-tab="video">视频</button><button class="${C.TAB_BTN}" data-tab="image">图片</button><button class="${C.TAB_BTN}" data-tab="flow">浏览</button></div>
                <div class="${C.CONTENT}">
                    <div class="${C.TAB_PANE} ${C.ACTIVE}" id="tab-video"><div class="${C.SETTING_ITEM}"><span class="${C.SETTING_LABEL}">解锁视频限制</span><div class="${C.SWITCH} ${C.SWITCH_CHECKED}" title="Always On"></div></div><div style="font-size:12px;color:var(--text-secondary);margin-top:10px;">* 视频下方会自动出现格式切换按钮 (MP4/MOV/M4V)。<br>* 若无法播放，请尝试点击手动切换。</div></div>
                    <div class="${C.TAB_PANE}" id="tab-image"><div class="${C.SETTING_ITEM}"><span class="${C.SETTING_LABEL}">图片最大宽度 (px)</span><input class="${C.INPUT}" id="inp-max-w" placeholder="无"></div><div class="${C.SETTING_ITEM}"><span class="${C.SETTING_LABEL}">单列显示图片</span><div class="${C.SWITCH}" id="sw-one-line"></div></div><div class="${C.SETTING_ITEM}"><span class="${C.SETTING_LABEL}">自动放大附件</span><div class="${C.SWITCH}" id="sw-enlarge"></div></div></div>
                    <div class="${C.TAB_PANE}" id="tab-flow"><div class="${C.SETTING_ITEM}"><span class="${C.SETTING_LABEL}">隐藏用户信息</span><div class="${C.SWITCH}" id="sw-hide-user"></div></div><div class="${C.SETTING_ITEM}"><span class="${C.SETTING_LABEL}">点击折叠帖子</span><div class="${C.SWITCH}" id="sw-fold"></div></div></div>
                </div>`;
            document.body.appendChild(modal);
        },
        bindEvents() {
            const C = CONFIG.HELPER_SELECTORS.CLASSES;
            const modal = document.getElementById(CONFIG.HELPER_SELECTORS.MODAL);
            const ball = document.getElementById(CONFIG.HELPER_SELECTORS.BALL);
            if (!modal || !ball) return;
            const openModal = () => modal.classList.add(C.MODAL_OPEN);
            const closeModal = () => modal.classList.remove(C.MODAL_OPEN);
            ball.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openModal(); });
            modal.querySelector(`#${CONFIG.HELPER_SELECTORS.CLOSE}`).addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); closeModal(); });
            modal.addEventListener('click', e => e.stopPropagation());
            document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains(C.MODAL_OPEN)) closeModal(); });
            Utils.makeDraggable(modal);
            const tabs = modal.querySelectorAll('.' + C.TAB_BTN);
            const panes = modal.querySelectorAll('.' + C.TAB_PANE);
            tabs.forEach((btn, idx) => btn.addEventListener('click', (e) => { e.stopPropagation(); tabs.forEach(t => t.classList.remove(C.ACTIVE)); panes.forEach(p => p.classList.remove(C.ACTIVE)); btn.classList.add(C.ACTIVE); panes[idx].classList.add(C.ACTIVE); }));
            const bindSwitch = (id, key, callback) => { const el = document.getElementById(id); if (!el) return; el.classList.toggle(C.SWITCH_CHECKED, localStorage.getItem(key) === 'true'); el.addEventListener('click', (e) => { e.stopPropagation(); localStorage.setItem(key, el.classList.toggle(C.SWITCH_CHECKED)); if (callback) callback(); }); };
            const bindInput = (id, key, callback) => { const el = document.getElementById(id); if (!el) return; el.value = localStorage.getItem(key) || ''; el.addEventListener('change', () => { localStorage.setItem(key, el.value); if (callback) callback(); }); el.addEventListener('click', e => e.stopPropagation()); };
            bindInput('inp-max-w', 'LPSG_MaxImgWidth', HelperCore.applyImageSettings);
            bindSwitch('sw-one-line', 'LPSG_OnePicPerLine', HelperCore.applyImageSettings);
            bindSwitch('sw-enlarge', 'LPSG_EnlargeAttachment', HelperCore.applyImageSettings);
            bindSwitch('sw-hide-user', 'LPSG_HideUserInfo', HelperCore.applyFlowSettings);
            bindSwitch('sw-fold', 'LPSG_FoldPost', HelperCore.applyFlowSettings);

            HelperCore.applyImageSettings();
            HelperCore.applyFlowSettings();
        }
    };

    function init() {
        Logger.info('Initializing LPSG Toolbox v23.0...');
        StyleManager.inject();
        const mainInit = () => {
            Core.initUI();
            Core.bindEvents();
            Logger.info('Downloader UI Initialized.');
            HelperCore.initUI();
            HelperCore.bindEvents();
            HelperCore.replaceUnplayableVideos();
            const observer = new MutationObserver(() => HelperCore.insertVerificationImages());
            observer.observe(document.body, { childList: true, subtree: true });
            Logger.info('Helper Module Initialized.');
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mainInit);
        else mainInit();
        if (typeof GM_registerMenuCommand !== 'undefined') {
            GM_registerMenuCommand('打开下载页面', () => document.querySelector(CONFIG.SELECTORS.MAIN_BTN)?.click());
            GM_registerMenuCommand('打开设置页面', () => document.getElementById(CONFIG.HELPER_SELECTORS.BALL)?.click());
        }
    }

    init();

})();
