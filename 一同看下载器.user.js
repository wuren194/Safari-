// ==UserScript==
// @name         一同看视频下载器 v7.1 (macOS 26 极致通透+右键拖拽)
// @namespace    http://tampermonkey.net/
// @version      7.1
// @description  一键用 Downie 4 下载一同看视频，搭载超高透 macOS 26 UI，支持右键随意拖拽面板。
// @author       Antigravity & You
// @match        *://www.yitongkan.com/*
// @match        *://yitongkan.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        GM_setClipboard
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // § 1. LIQUID GLASS DESIGN SYSTEM (ai_studio_code.html Style)
    // ═══════════════════════════════════════════════════════════════════════════
    const injectStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            :root {
                /* ─────── 材质基底 (Material Base) ─────── */
                /* 核心：极低不透明度 + SVG 物理置换 = 真正的液态玻璃 */
                --glass-bg: rgba(35, 35, 35, 0.30);
                --glass-blur: blur(0px) saturate(110%);
                --liquid-filter: url(#ytk-liquid-filter);

                /* ─────── 光照系统 (Lighting System) ─────── */
                --glass-border: rgba(255, 255, 255, 0.08);
                --glass-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.08);
                --glass-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);

                /* ─────── 交互态 (Interaction) ─────── */
                --glass-hover: rgba(255, 255, 255, 0.03);
                --glass-active: rgba(255, 255, 255, 0.06);

                /* ─────── 品牌色 (Accent) ─────── */
                --accent-color: #0a84ff;
                --accent-glow: rgba(10, 132, 255, 0.4);

                /* ─────── 字体 (Typography) ─────── */
                --font-stack: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
                --text-primary: rgba(255, 255, 255, 0.95);
                --text-secondary: rgba(255, 255, 255, 0.6);

                /* ─────── 圆角 ─────── */
                --radius-xl: 24px;
                --radius-lg: 16px;
                --radius-md: 12px;
                --radius-sm: 8px;

                /* ─────── 动画 ─────── */
                --spring: cubic-bezier(0.16, 1, 0.3, 1);
                --ease-out: cubic-bezier(0.25, 1, 0.5, 1);
            }

            /* ═══════════════════════════════════════════════════════════════════════ */
            /* § PANEL CONTAINER                                                        */
            /* ═══════════════════════════════════════════════════════════════════════ */
            .ytk-panel {
                position: fixed;
                top: 20%; 
                right: 24px;
                width: 320px;
                border-radius: var(--radius-xl);
                z-index: 2147483647;
                font-family: var(--font-stack);
                overflow: hidden;
                box-shadow: var(--glass-shadow);
                transition: 
                    opacity 0.3s var(--spring), 
                    transform 0.35s var(--spring);
                transform: translate3d(0, 0, 0);
                -webkit-font-smoothing: antialiased;
                opacity: 1;
                background: transparent;
            }
            .ytk-panel.hidden { 
                opacity: 0; 
                pointer-events: none; 
                transform: translateX(20px) scale(0.96); 
            }

            /* ═══════════════════════════════════════════════════════════════════════ */
            /* § LIQUID GLASS WARP LAYER                                               */
            /* ═══════════════════════════════════════════════════════════════════════ */
            .ytk-glass-warp {
                position: absolute;
                inset: 0;
                background: var(--glass-bg);
                backdrop-filter: var(--glass-blur);
                -webkit-backdrop-filter: var(--glass-blur);
                filter: var(--liquid-filter);
                border: 1px solid var(--glass-border);
                box-shadow: var(--glass-shadow), var(--glass-highlight);
                border-radius: inherit;
                z-index: -1;
            }

            /* ═══════════════════════════════════════════════════════════════════════ */
            /* § CONTENT CONTAINER                                                     */
            /* ═══════════════════════════════════════════════════════════════════════ */
            .ytk-content {
                position: relative; 
                z-index: 2;
                height: 100%; 
                display: flex; 
                flex-direction: column;
            }

            /* ═══════════════════════════════════════════════════════════════════════ */
            /* § HEADER                                                                */
            /* ═══════════════════════════════════════════════════════════════════════ */
            .ytk-header {
                padding: 18px 24px;
                display: flex; 
                justify-content: space-between; 
                align-items: center;
                border-bottom: 1px solid var(--glass-border);
                background: rgba(255, 255, 255, 0.02);
                cursor: move;
            }
            .ytk-title { 
                font-size: 15px; 
                font-weight: 600; 
                color: var(--text-primary); 
                letter-spacing: -0.3px; 
            }
            .ytk-close {
                width: 24px; 
                height: 24px; 
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.1); 
                border: none;
                color: var(--text-secondary);
                display: flex; 
                align-items: center; 
                justify-content: center;
                font-size: 14px; 
                cursor: pointer; 
                transition: all 0.2s;
            }
            .ytk-close:hover { 
                background: rgba(255, 255, 255, 0.2); 
                color: #fff; 
            }

            /* ═══════════════════════════════════════════════════════════════════════ */
            /* § BODY                                                                  */
            /* ═══════════════════════════════════════════════════════════════════════ */
            .ytk-body { 
                padding: 20px; 
                color: var(--text-primary); 
            }

            /* ═══════════════════════════════════════════════════════════════════════ */
            /* § CARD COMPONENT                                                        */
            /* ═══════════════════════════════════════════════════════════════════════ */
            .ytk-card {
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid transparent;
                border-radius: var(--radius-md); 
                padding: 14px; 
                margin-bottom: 16px;
                transition: all 0.2s;
            }
            .ytk-card:hover {
                background: rgba(255, 255, 255, 0.06);
            }
            .ytk-card:focus-within {
                box-shadow: inset 0 0 0 2px var(--accent-color);
                background: rgba(10, 132, 255, 0.08);
            }
            .ytk-label-row {
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 8px;
                font-size: 11px; 
                color: var(--text-secondary); 
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .ytk-val { 
                color: var(--text-primary); 
                font-size: 13px; 
                word-break: break-all; 
                font-family: "SF Mono", "Menlo", monospace; 
                outline: none;
                line-height: 1.5;
            }
            .ytk-refresh { 
                color: var(--accent-color); 
                cursor: pointer; 
                border: none; 
                background: none; 
                padding: 0; 
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                transition: opacity 0.15s;
            }
            .ytk-refresh:hover { 
                opacity: 0.7; 
            }

            /* ═══════════════════════════════════════════════════════════════════════ */
            /* § QUALITY GRID                                                          */
            /* ═══════════════════════════════════════════════════════════════════════ */
            .ytk-grid { 
                display: grid; 
                grid-template-columns: repeat(3, 1fr); 
                gap: 8px; 
                margin-bottom: 20px; 
            }
            .ytk-q-btn {
                background: rgba(255, 255, 255, 0.08); 
                border: 1px solid transparent;
                padding: 10px 8px; 
                border-radius: var(--radius-sm);
                color: var(--text-primary); 
                font-size: 12px;
                font-weight: 500;
                cursor: pointer; 
                transition: all 0.2s;
            }
            .ytk-q-btn:hover { 
                background: rgba(255, 255, 255, 0.12);
                transform: scale(1.02);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            .ytk-q-btn.active {
                background: var(--accent-color); 
                color: #fff;
                box-shadow: 0 2px 10px var(--accent-glow);
            }

            /* ═══════════════════════════════════════════════════════════════════════ */
            /* § ACTION BUTTONS                                                        */
            /* ═══════════════════════════════════════════════════════════════════════ */
            .ytk-actions { 
                display: flex; 
                gap: 10px; 
            }
            .ytk-btn-lg {
                flex: 1; 
                padding: 12px 16px; 
                border-radius: var(--radius-sm); 
                border: none;
                font-size: 13px; 
                font-weight: 500; 
                cursor: pointer; 
                transition: all 0.2s;
            }
            .ytk-primary { 
                background: var(--accent-color); 
                color: #fff; 
                box-shadow: 0 2px 10px var(--accent-glow);
            }
            .ytk-primary:hover { 
                filter: brightness(1.1);
                transform: scale(1.02);
            }
            .ytk-secondary { 
                background: rgba(255, 255, 255, 0.1); 
                color: var(--text-primary); 
            }
            .ytk-secondary:hover { 
                background: rgba(255, 255, 255, 0.15);
            }
            .ytk-empty { 
                text-align: center; 
                color: var(--text-secondary); 
                font-size: 13px; 
                padding: 24px 0; 
            }

            /* ═══════════════════════════════════════════════════════════════════════ */
            /* § MINIMIZED FLOATING BALL                                               */
            /* ═══════════════════════════════════════════════════════════════════════ */
            .ytk-ball {
                position: fixed; 
                top: 50%; 
                right: 24px;
                width: 48px; 
                height: 48px; 
                border-radius: 50%;
                background: var(--glass-bg);
                backdrop-filter: var(--glass-blur);
                -webkit-backdrop-filter: var(--glass-blur);
                filter: var(--liquid-filter);
                border: 1px solid var(--glass-border);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
                z-index: 2147483647;
                display: flex; 
                align-items: center; 
                justify-content: center;
                color: #fff; 
                font-size: 20px; 
                cursor: pointer;
                transform: scale(0); 
                opacity: 0; 
                transition: all 0.3s var(--spring);
            }
            .ytk-ball.visible { 
                transform: scale(1); 
                opacity: 1; 
            }
            .ytk-ball:hover { 
                transform: scale(1.1); 
                background: rgba(50, 50, 50, 0.5);
            }
            .ytk-ball.visible:hover { 
                transform: scale(1.1); 
            }
        `;
        document.head.appendChild(style);
    };

    // ===================== LIQUID GLASS SVG =====================
    const injectGlobalFilter = () => {
        if (document.getElementById('ytk-liquid-filter-svg')) return;
        // 如果旧的滤镜存在，移除它
        const old = document.getElementById('lpsg-liquid-filter-svg');
        if (old) old.remove();

        const div = document.createElement('div');
        div.innerHTML = `
            <svg id="ytk-liquid-filter-svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">
                <defs>
                    <filter id="ytk-liquid-filter" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
                        <feImage href="data:image/jpeg;base64,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PYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj8x+wjo4qY7M9iKmKg6MrIrErALzBeYEyZ0y50yZkyZ7yBeULzBeYazl0T6R9KPRPYj0T2J9B9Ppj07+X/AF0NiNiNCNCNiNiNiNCViNiViNiViNiVAdiVAdCdCdCVCdD1D+U/XBWRWI2I0I2I0I2JUQ2I2JUI2JUI2JURWJUI0I0I2JUI2JUI2JUI2J0P//EABkQAQEBAQEBAAAAAAAAAAAAAAECABEDEP/aAAgBAQABAgB1atWrVq1atWrVq1atWrVq1atWrVq1atWrVq+OrVq1atWrVq1atWrVq1atWrVq1atWrVq1atXxVppppppdWrVq1atWrVq1NNNNNNNNNNNNNPVWmmmmms6tWrVq1atWpppppppppppppp6q0000uc51atWrVq1ammmmmmmmmmmmmt1Vpppc5znVq1atWrVqaaaaaaaaaaaaaeqtNLnOc51atWrVq1ammmmmmmmmmmmmnqrS5znOc6tWrVq16222mmmmmmlVppp6tKuc5znOrVq1a9TbbbbTTTTTSq000qtLnOc5zq1atWrW0222200000qqqtKqrnOc5zq1atTbbbbbbbbTTTSqqqqqq5znOc6tTTTbbbbbbbbTTTSqqqqrlVznOctNNNtttttttttNNNNKqqqrqznKqrTTTTbbbbbbbbbTTTSqqqqrqznOc5aaaabbbbbbbbbaaaaVVVVVdWc5znVq1NNttttttttttNNKqqqqudWc5znVq16tbbbbbbbbbbTTSqqqq5XVnOc6tWrVrb1tttttttttNNKqqqqrWrK5VWmmm2230bbbbbbaaaXOc5zlVa1KuVVppptttt9G22222mmlzlVznK6tWVVWmmmm2222222222mlznOc5znLWppVVWmmm22222229bTWrOc5znOc+hZZZZZZZZZWta1rWta1rRRRRRRRRZZZZZZZZZWta1rWta1rRRRRRRRRZZZZZZZZZZZZe9a1rWta1rWitaKLLLLLLLLLLLLLLLLL3rWta1rWtFbLLLLLLLLLLLLLLLLLLLL3vWta1rWita1ssssssss+hZZZZZZZZe961rWta0Vre97LLLLLLLLLLLPoWWWWWXrWta1oorWta3ssss+hZZZZ9Cyyyyyyyyiita1orWta1ve9llllllllllllllllFFa0VorWta1ve9llllllllllllllllllFFFaK1rWta1rWiyyyyyyyyyyyyiiiiiiitFFa1rWta1oosoosssssoooosoooorRRRWta1rWta0UUUUUWUUUUUUUUUUUVoooorWta1rWtaKKKKKKmiiiiiiiiiiiiiiitd73ve61oSiiipoqaKKKKKKKKKK0UUUVrve973vREREZoSihEooooorRRRRWtd73ve61oSiiipoqaKKKKKKKKKK0UUUVrve973vREREZoSihEooooorRRRRWtd73ve61oSiiipoqaKKKKKKKKKK0UUUVrve973vREREZoSihEooooorRRRRWtd73ve9EREREREoSiiiiitFllllla73ve9ERERERESiiiiiitH0PoWWWWVrXe96IiIiMoiJRRRRRRWjwlFFllllFFd6IiIiIlCUUUUUUUUUePHjx48ePCIiIiIiIiUUUUUUUUUUUePHjx48ePHjx48ePHjx48eIiUUUUUUJRRRX//xAAWEQADAAAAAAAAAAAAAAAAAAABYJD/2gAIAQIBAz8AtEV7/8QAFxEBAQEBAAAAAAAAAAAAAAAAAAECEP/aAAgBAwEBAgCtNNNNNNNNNNNNNNNNNNNNNNNNNNNNNcrTTTTTTTTTTTTTTTTTTTTTTTTTTTTTXKrTTTTTTTU000000000000000000001FVpppppqampqaaaaaaaaaaaaaaaaaaaa5Vaaaaampqampqammmmmmmmmmmlaaaaaaiq0001NTU1NTU1NTTTTTTTTTTSqqtNNNcqtNNSyzU1LNTU1NTTTTTTTTTSqqq001ytNLLLLNTU1NTU1NTbbbTTTTTSqqq001ytNLLLLLNTU1NTU3NttttNNNNNKqq001KrSyyyyyzU1NTU3Nzc02220000qqqqrSqqyyyyyzU1NTU3Nzc3NttttNNNKqqqqqqqqssssss1NTU3Nzc3NzbbbbTTTSqqqqqqrLLLLLNTU1Nzc3Nzc22220000qqqqqqqqssss1NTU3Nzc3NzbbbbbTTSqqqqqqqqqqzU1NTc3Nzc3Nzbc22000qqqqqqqqqqqtTU3Nzc3Nzc3NtzbTTSqqqqrKqqqqqtNNzc23Nzc3Nzc3NTU1KqqqrKqqqqqtNNNNttzc3Nzc3NzU1NLLLLLKqqqqqqqq0022223Nzc3NzU1NSyyyyyyqqqqqqqrTTbbbbc3Nzc3NTU1LLLLLLKsqqqqqqrTTTTbbbc3Nzc1NTU1LLLLLLIKqqqqqrTTTTTbbbTc3NTU1NTU1LLLLLKqqqqqqqq0000222023NTU1NTU1LLLLLKqqqqqqqq000000003NTU1NTU1LLLLLNKrTSqqqqtNNNNNNtNNTU1NSzUssss00qq0qqqqrTTTTTTTTTU1NTUs1LLLNNNKrTTTSqqq00000000001NTU1LNTU0000qtNNNKqqqtNNNNNNNNTU1NTUs1NNNNNKss1NNNK000001NKrK0000001NNTU0s000000qq000001NKrStNNNNK1NNNNStNNNNNKqtNNNNNNNK0000000rU0000rTTTTTSq00000rTTTTTTTTTTTTTTTTStNNNNKr/xAAUEQEAAAAAAAAAAAAAAAAAAACg/9oACAEDAQM/AAAf/9k=" result="DISPLACEMENT_MAP" preserveAspectRatio="xMidYMid slice" />
                        
                        <!-- Create edge mask from source alpha -->
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0.3 0.3 0.3 0 0
                            0.3 0.3 0.3 0 0
                            0.3 0.3 0.3 0 0
                            0 0 0 1 0" result="EDGE_INTENSITY" />
                        <feComponentTransfer in="EDGE_INTENSITY" result="EDGE_MASK">
                            <feFuncA type="discrete" tableValues="0 0.1 1" />
                        </feComponentTransfer>

                        <feOffset in="SourceGraphic" dx="0" dy="0" result="CENTER_ORIGINAL" />

                        <!-- Chromatic Aberration: RED -->
                        <feDisplacementMap in="SourceGraphic" in2="DISPLACEMENT_MAP" scale="25" xChannelSelector="R"
                            yChannelSelector="B" result="RED_DISPLACED" />
                        <feColorMatrix in="RED_DISPLACED" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
                            result="RED_CHANNEL" />

                        <!-- Chromatic Aberration: GREEN -->
                        <feDisplacementMap in="SourceGraphic" in2="DISPLACEMENT_MAP" scale="23" xChannelSelector="R"
                            yChannelSelector="B" result="GREEN_DISPLACED" />
                        <feColorMatrix in="GREEN_DISPLACED" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"
                            result="GREEN_CHANNEL" />

                        <!-- Chromatic Aberration: BLUE -->
                        <feDisplacementMap in="SourceGraphic" in2="DISPLACEMENT_MAP" scale="21" xChannelSelector="R"
                            yChannelSelector="B" result="BLUE_DISPLACED" />
                        <feColorMatrix in="BLUE_DISPLACED" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"
                            result="BLUE_CHANNEL" />

                        <!-- Combine with Screen Blend -->
                        <feBlend in="GREEN_CHANNEL" in2="BLUE_CHANNEL" mode="screen" result="GB_COMBINED" />
                        <feBlend in="RED_CHANNEL" in2="GB_COMBINED" mode="screen" result="RGB_COMBINED" />

                        <feGaussianBlur in="RGB_COMBINED" stdDeviation="0.3" result="ABERRATED_BLURRED" />
                        <feComposite in="ABERRATED_BLURRED" in2="EDGE_MASK" operator="in" result="EDGE_ABERRATION" />

                        <!-- Inverted Mask for Center -->
                        <feComponentTransfer in="EDGE_MASK" result="INVERTED_MASK">
                            <feFuncA type="table" tableValues="1 0" />
                        </feComponentTransfer>
                        <feComposite in="CENTER_ORIGINAL" in2="INVERTED_MASK" operator="in" result="CENTER_CLEAN" />

                        <feComposite in="EDGE_ABERRATION" in2="CENTER_CLEAN" operator="over" />
                    </filter>
                </defs>
            </svg>
        `;
        document.body.appendChild(div);
    };

    // ===================== 拖拽逻辑 =====================
    const makeDraggable = (el) => {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        el.addEventListener('contextmenu', (e) => { e.preventDefault(); });

        el.addEventListener('mousedown', (e) => {
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
            el.style.transform = 'none';
            el.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            el.style.left = `${initialLeft + dx}px`;
            el.style.top = `${initialTop + dy}px`;
        });

        window.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            el.style.transition = '';
            el.style.cursor = '';
        });
    };

    // ===================== 核心逻辑 =====================
    const sanitizeFilename = (name) => {
        if (!name) return 'video';
        return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 120) || 'video';
    };

    const copyToClipboard = (text) => {
        if (typeof GM_setClipboard !== 'undefined') {
            GM_setClipboard(text);
            return true;
        }
        try {
            navigator.clipboard.writeText(text);
            return true;
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            return true;
        }
    };

    const gmFetch = (url) => {
        return new Promise((resolve, reject) => {
            const gmXhr = typeof GM_xmlhttpRequest !== 'undefined' ? GM_xmlhttpRequest :
                (typeof GM !== 'undefined' && GM.xmlHttpRequest ? GM.xmlHttpRequest : null);
            if (gmXhr) {
                gmXhr({
                    method: 'GET', url: url, responseType: 'text', timeout: 5000,
                    headers: { 'Referer': location.origin + '/' },
                    onload: (r) => r.status === 200 ? resolve(r.responseText) : reject(new Error(`HTTP ${r.status}`)),
                    onerror: () => reject(new Error('Network Error')),
                    ontimeout: () => reject(new Error('Timeout'))
                });
            } else {
                fetch(url).then(r => r.ok ? r.text() : Promise.reject()).then(resolve).catch(reject);
            }
        });
    };

    const detectQualities = async (baseUrl) => {
        const pathMatch = baseUrl.match(/\/(\d+)\/index\.m3u8/);
        if (!pathMatch) return [{ url: baseUrl, name: '默认', priority: 0 }];

        const currentQ = pathMatch[1];
        const qualities = [
            { value: '1800', label: '1080p' }, { value: '1080', label: '1080p' },
            { value: '900', label: '720p' }, { value: '720', label: '720p' },
            { value: '600', label: '480p' }, { value: '480', label: '480p' },
            { value: '360', label: '360p' },
        ];

        const results = await Promise.all(
            qualities.map(async (q) => {
                const testUrl = baseUrl.replace(`/${currentQ}/`, `/${q.value}/`);
                try {
                    const content = await gmFetch(testUrl);
                    if (content.includes('#EXTM3U') && (content.includes('.ts') || content.includes('#EXTINF'))) {
                        return { url: testUrl, name: q.label, value: q.value, priority: parseInt(q.value) };
                    }
                } catch { }
                return null;
            })
        );

        const validQualities = [];
        const seen = new Set();
        results.filter(Boolean).sort((a, b) => b.priority - a.priority).forEach(r => {
            if (!seen.has(r.name)) { seen.add(r.name); validQualities.push(r); }
        });

        if (validQualities.length === 0) {
            const label = parseInt(currentQ) >= 1000 ? '高清' : `${currentQ}p`;
            validQualities.push({ url: baseUrl, name: label, priority: parseInt(currentQ) });
        }
        return validQualities;
    };

    const getVideoTitle = () => {
        const headings = document.querySelectorAll('h1, h2, h3, [role="heading"]');
        for (const h of headings) {
            const text = h.textContent.trim();
            if (text && text !== '一同看' && text.length > 2 && text.length < 200) return text;
        }
        let title = document.title || '';
        title = title.replace(/\s*[-–—|·_]\s*一同看.*$/gi, '').replace(/\s*一同看.*$/gi, '').trim();
        if (title && title.length > 2) return title;
        return null;
    };

    // ===================== UI 逻辑 (Rewrite v2) =====================
    let videos = [];
    let panel = null;
    let minimizedBtn = null;
    let selectedUrls = {};
    let currentTitle = '';

    const toggleUI = (show) => {
        if (!panel || !minimizedBtn) return;
        if (show) {
            panel.classList.remove('hidden');
            minimizedBtn.classList.remove('visible');
        } else {
            panel.classList.add('hidden');
            minimizedBtn.classList.add('visible');
        }
    };

    const createUI = () => {
        if (document.querySelector('.ytk-panel')) return;

        // Main Panel: Container clips the borders
        panel = document.createElement('div');
        panel.className = 'ytk-panel';
        panel.innerHTML = `
            <div class="ytk-glass-warp"></div>
            <div class="ytk-content">
                <div class="ytk-header" title="右键拖动">
                    <span class="ytk-title">YTK Downloader</span>
                    <button class="ytk-close">×</button>
                </div>
                <div class="ytk-body">
                    <div class="ytk-empty">Scanning for media...</div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // Minimized Ball
        minimizedBtn = document.createElement('div');
        minimizedBtn.className = 'ytk-ball';
        minimizedBtn.innerHTML = '⚡️';
        minimizedBtn.title = '双击恢复';
        minimizedBtn.onclick = () => toggleUI(true);
        document.body.appendChild(minimizedBtn);

        // Events
        panel.querySelector('.ytk-close').onclick = () => toggleUI(false);
        makeDraggable(panel);
        makeDraggable(minimizedBtn);
    };

    const refreshTitle = () => {
        const newTitle = getVideoTitle();
        if (newTitle) {
            currentTitle = newTitle;
            const titleEl = panel.querySelector('.ytk-val');
            if (titleEl) titleEl.textContent = sanitizeFilename(currentTitle);
            return true;
        }
        return false;
    };

    const renderVideos = () => {
        const body = panel.querySelector('.ytk-body');
        if (!body) return;

        if (videos.length === 0) {
            body.innerHTML = '<div class="ytk-empty">No videos detected</div>';
            return;
        }

        videos.forEach((video, i) => {
            if (!selectedUrls[i] && video.qualities.length > 0) {
                selectedUrls[i] = video.qualities[0].url;
            }
        });
        const video = videos[0];
        const filename = sanitizeFilename(currentTitle || 'video');

        // New Card-based Layout
        body.innerHTML = `
            <div class="ytk-card">
                <div class="ytk-label-row">
                    <span>FILENAME 文件名</span>
                    <button class="ytk-refresh">Refresh</button>
                </div>
                <div class="ytk-val" contenteditable="true" spellcheck="false">${filename}</div>
            </div>

            <div class="ytk-label-row"><span>QUALITY 画质</span></div>
            <div class="ytk-grid">
                ${video.qualities.map((q, qi) => `
                    <button class="ytk-q-btn ${selectedUrls[0] === q.url ? 'active' : ''}" data-url="${q.url}">
                        ${q.name}
                    </button>
                `).join('')}
            </div>

            <div class="ytk-actions">
                <button class="ytk-btn-lg ytk-primary">Downie 下载</button>
                <button class="ytk-btn-lg ytk-secondary">Copy Name</button>
            </div>
        `;

        // Event Bindings
        body.querySelector('.ytk-refresh').onclick = () => {
            if (refreshTitle()) {
                const b = body.querySelector('.ytk-refresh');
                b.textContent = 'Done';
                setTimeout(() => b.textContent = 'Refresh', 1000);
            }
        };

        const titleInput = body.querySelector('.ytk-val');
        titleInput.addEventListener('input', (e) => { currentTitle = e.target.textContent; });
        titleInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });

        body.querySelectorAll('.ytk-q-btn').forEach(btn => {
            btn.onclick = () => {
                selectedUrls[0] = btn.dataset.url;
                renderVideos();
            };
        });

        body.querySelector('.ytk-primary').onclick = (e) => {
            const finalUrl = selectedUrls[0];
            const finalName = sanitizeFilename(currentTitle || 'video');
            const encodedUrl = encodeURIComponent(finalUrl);

            copyToClipboard(finalName);

            const downieUrl = `downie://XUOpenURL?url=${encodedUrl}`;
            window.location.href = downieUrl;

            e.target.textContent = 'In Downie...';
            setTimeout(() => { e.target.textContent = 'Downie 下载'; }, 3000);
        };

        body.querySelector('.ytk-secondary').onclick = (e) => {
            copyToClipboard(sanitizeFilename(currentTitle));
            e.target.textContent = 'Copied!';
            setTimeout(() => e.target.textContent = 'Copy Name', 1500);
        };
    };

    const addVideo = async (url) => {
        if (videos.find(v => v.url === url)) return;
        const video = { url, qualities: [] };
        videos.push(video);
        renderVideos();
        video.qualities = await detectQualities(url);
        renderVideos();
    };

    const scanVideos = () => {
        document.querySelectorAll('video').forEach(video => {
            const src = video.getAttribute('src') || '';
            if (src.includes('.m3u8')) {
                let fullUrl = src.startsWith('/') ? location.origin + src : src;
                addVideo(fullUrl);
            }
        });
    };

    const init = () => {
        if (!location.pathname.includes('play-')) return;
        injectStyles();
        injectGlobalFilter();
        createUI();

        let attempts = 0;
        const titleInterval = setInterval(() => {
            attempts++;
            const title = getVideoTitle();
            if (title) {
                currentTitle = title;
                renderVideos();
                clearInterval(titleInterval);
            } else if (attempts >= 20) {
                clearInterval(titleInterval);
            }
        }, 500);

        scanVideos();
        new MutationObserver(scanVideos).observe(document.body, { childList: true, subtree: true });
        setInterval(scanVideos, 2000);
    };

    document.body ? init() : document.addEventListener('DOMContentLoaded', init);
})();