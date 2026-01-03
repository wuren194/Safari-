// ==UserScript==
// @name                   Twitter 显示正常的日期和时间
// @name:zh-CN             Twitter 显示正常的日期和时间
// @name:zh-TW             Twitter 顯示正常的日期和時間
// @description            在推特上显示完整日期时间，如：2025年12月25日 23:59
// @description:zh-CN      在推特上显示完整日期时间，如：2025年12月25日 23:59
// @description:zh-TW      在推特上顯示完整日期時間，如：2025年12月25日 23:59
// @author                 AeamaN (简化版)
// @namespace              https://github.com/ChinaGodMan/UserScripts
// @license                MIT
// @match                  https://twitter.com/*
// @match                  https://mobile.twitter.com/*
// @match                  https://x.com/*
// @match                  https://mobile.x.com/*
// @grant                  GM_getValue
// @grant                  GM_registerMenuCommand
// @grant                  GM_setValue
// @run-at                 document-body
// @icon                   https://raw.githubusercontent.com/ChinaGodMan/UserScriptsHistory/main/scriptsIcon/x.svg
// @version                2025.6.4.3-简化版
// @updateURL    https://raw.githubusercontent.com/wuren194/Safari-/main/Twitter%20%E6%98%BE%E7%A4%BA%E6%AD%A3%E5%B8%B8%E7%9A%84%E6%97%A5%E6%9C%9F%E5%92%8C%E6%97%B6%E9%97%B4.user.js
// @downloadURL  https://raw.githubusercontent.com/wuren194/Safari-/main/Twitter%20%E6%98%BE%E7%A4%BA%E6%AD%A3%E5%B8%B8%E7%9A%84%E6%97%A5%E6%9C%9F%E5%92%8C%E6%97%B6%E9%97%B4.user.js
// @supportURL   https://github.com/wuren194/Safari-/issues
// ==/UserScript==

(function () {
    'use strict'

    // ============ 设置 ============
    // 日期格式
    // 7 = 70/12/31(四) 23:59
    // 8 = 70/12/31(四) 23:59:59
    const FMT = 7

    // 隐藏广告推广
    const HPP = true

    // 隐藏推荐关注
    const HWTF = true

    // 隐藏私信抽屉
    const HDMD = true

    // 隐藏获取认证
    const HGV = true

    // 循环间隔(ms)
    const INTL = 800
    // ==============================

    const MYNAME = 'sdnt1200'
    const LANG = document.documentElement.getAttribute('lang')

    let s_mutations = true
    let observer = new MutationObserver(function (mutations) {
        s_mutations = mutations
    })

    let hpp = HPP, hwtf = HWTF, hdmd = HDMD, hgv = HGV, fmt = FMT, intl = INTL

    // 日期格式化 - 中文格式
    function datef(date) {
        const YE = date.getFullYear()
        const MO = date.getMonth() + 1
        const DA = date.getDate()
        const HO = ('0' + date.getHours()).slice(-2)
        const MI = ('0' + date.getMinutes()).slice(-2)

        return `${YE}年${MO}月${DA}日 ${HO}:${MI}`
    }

    // 隐藏广告
    function hidepromo() {
        const SEL = 'path[d^="M19.498 3h-15c-1.381 0-2.5 1.12-2.5 2.5v13c0 1.38 1.119 2.5"]'
        const SEL_2 = 'main div[data-testid="sidebarColumn"] section div[data-testid="trend"] div.r-14gqq1x span.css-1qaijid.r-bcqeeo.r-qvutc0'
        const SEL_3 = 'main div[data-testid="primaryColumn"] section article span.css-1jxf684.r-bcqeeo.r-qvutc0.r-poiln3'

        const PROMO = {
            'ja': 'によるプロモーション$',
            'zh-Hant': '^由 .+ 推廣$',
            'zh': '^由 .+ 推广$',
            'en': '^Promoted by '
        }
        const PROMO_L = PROMO[LANG] ?? PROMO['en']

        let elms = document.querySelectorAll(SEL)
        for (let e of elms) {
            let xpe = e.closest('div[data-testid="cellInnerDiv"]')
            if (!xpe) xpe = e.closest('div.css-175oi2r.r-1adg3ll.r-1ny4l3l')
            if (xpe) {
                let ss = s_mutations
                xpe.style.display = 'none'
                s_mutations = ss
            }
        }

        let elms_2 = document.querySelectorAll(SEL_2)
        for (let e of elms_2) {
            if (new RegExp(PROMO_L, 'i').test(e.textContent)) {
                let xpe = e.closest('div[data-testid="trend"]')
                if (xpe) {
                    let ss = s_mutations
                    xpe.style.display = 'none'
                    s_mutations = ss
                }
            }
        }

        let elms_3 = document.querySelectorAll(SEL_3)
        for (let e of elms_3) {
            if (new RegExp(PROMO_L, 'i').test(e.textContent)) {
                let xpe = e.closest('article')
                if (xpe) xpe = xpe.closest('div[data-testid="cellInnerDiv"]')
                if (xpe) {
                    let ss = s_mutations
                    xpe.style.display = 'none'
                    s_mutations = ss
                }
            }
        }
    }

    // 隐藏推荐关注
    function hidewtf() {
        const WTF = {
            'ja': 'おすすめユーザー',
            'zh-Hant': '推薦跟隨',
            'zh': '推荐关注',
            'en': 'Who to follow'
        }
        const WTF_L = WTF[LANG] ?? WTF['en']

        const SEL = 'main div[data-testid="sidebarColumn"] aside[aria-label="' + WTF_L + '"]'
        let elms = document.querySelectorAll(SEL)

        for (let e of elms) {
            let ss = s_mutations
            e.style.display = 'none'
            s_mutations = ss
        }
    }

    // 隐藏私信抽屉
    function hidedmd() {
        const SEL = 'div[data-testid="DMDrawer"]'
        let elms = document.querySelectorAll(SEL)

        for (let e of elms) {
            let ss = s_mutations
            e.style.display = 'none'
            s_mutations = ss
        }
    }

    // 隐藏获取认证
    function hidegv() {
        const GV = {
            'ja': '認証を受ける',
            'zh-Hant': '取得驗證',
            'zh': '获得认证',
            'en': 'Get Verified'
        }
        const GV_L = GV[LANG] ?? GV['en']

        const SEL = 'main div[data-testid="sidebarColumn"] aside[aria-label="' + GV_L + '"]'
        let elms = document.querySelectorAll(SEL)

        for (let e of elms) {
            let ss = s_mutations
            e.style.display = 'none'
            s_mutations = ss
        }
    }

    // 替换日期时间
    function repldatetime() {
        const SEL = 'main div[data-testid="primaryColumn"] section article time[datetime*=":"]'
        const SEL_2 = 'div[aria-labelledby="modal-header"] div[data-testid^="User-Name"] time[datetime]'
        const SEL_3 = 'div[aria-labelledby="modal-header"] div[aria-label] time[datetime]'
        const SEL_4 = 'main section[aria-labelledby="detail-header"] article div[data-testid^="User-Name"] time[datetime]'
        const SEL_5 = 'main section div[data-testid="conversation"] div[aria-label] time[datetime]'

        document.querySelectorAll(SEL + ', ' + SEL_2 + ', ' + SEL_3 + ', ' + SEL_4 + ', ' + SEL_5).forEach(function (e) {
            const SEL_ADD = 'span.us-' + MYNAME

            let d = e.getAttribute('datetime')
            let df = datef(new Date(d))
            let pe = e.parentNode
            let old = pe.querySelectorAll(SEL_ADD)
            let ss = s_mutations

            if (!old.length) {
                let span = document.createElement('span')
                span.className = 'us-' + MYNAME
                span.setAttribute('datetime', d)
                span.setAttribute('local-datetime', df)
                span.textContent = df
                span.style = e.style

                e.style.setProperty('display', 'none')
                pe.appendChild(span)
            } else if (old[0].getAttribute('local-datetime') != df) {
                old[0].setAttribute('local-datetime', df)
                old[0].textContent = df
                old[0].style = e.style
            }

            s_mutations = ss
        })
    }

    // 点击推文新标签页打开 - 记录鼠标按下位置
    let mouseDownPos = { x: 0, y: 0 }
    document.addEventListener('mousedown', function (e) {
        mouseDownPos = { x: e.clientX, y: e.clientY }
    }, true)

    function openInNewTab() {
        document.querySelectorAll('article[data-testid="tweet"]').forEach(article => {
            if (article.dataset.newTabHandled) return
            article.dataset.newTabHandled = 'true'

            article.addEventListener('click', function (e) {
                // 检测是否是文字选择操作（鼠标移动超过 5px 视为拖选）
                const dx = Math.abs(e.clientX - mouseDownPos.x)
                const dy = Math.abs(e.clientY - mouseDownPos.y)
                if (dx > 5 || dy > 5) {
                    return  // 鼠标拖动了，可能在选文字，不拦截
                }

                // 如果有文字被选中，不处理（允许复制）
                const selection = window.getSelection()
                if (selection && selection.toString().trim().length > 0) {
                    return
                }

                // 排除的元素选择器（链接、按钮、媒体、视频控件、引用推文等）
                const excludeSelectors = [
                    'a',
                    'button',
                    '[role="button"]',
                    '[role="link"]',
                    'img',
                    'video',
                    'audio',
                    'input',
                    'textarea',
                    // 推文交互按钮
                    '[data-testid="like"]',
                    '[data-testid="unlike"]',
                    '[data-testid="retweet"]',
                    '[data-testid="unretweet"]',
                    '[data-testid="reply"]',
                    '[data-testid="bookmark"]',
                    '[data-testid="removeBookmark"]',
                    '[data-testid="share"]',
                    '[data-testid="caret"]',
                    // 视频和媒体相关
                    '[data-testid="videoPlayer"]',
                    '[data-testid="videoComponent"]',
                    '[data-testid="playButton"]',
                    '[data-testid="videoButton"]',
                    '[data-testid="tweetPhoto"]',
                    '[data-testid="card.wrapper"]',
                    '[data-testid="card.layoutLarge.media"]',
                    '[data-testid="card.layoutSmall.media"]',
                    // 视频控制元素
                    '[aria-label*="播放"]',
                    '[aria-label*="暂停"]',
                    '[aria-label*="静音"]',
                    '[aria-label*="音量"]',
                    '[aria-label*="全屏"]',
                    '[aria-label*="Play"]',
                    '[aria-label*="Pause"]',
                    '[aria-label*="Mute"]',
                    '[aria-label*="Volume"]',
                    '[aria-label*="Fullscreen"]',
                    '[aria-label*="进度"]',
                    '[aria-label*="progress"]',
                    // 引用推文/转推
                    '[data-testid="quoteTweet"]',
                    '[data-testid="quote"]',
                    'article article',  // 嵌套的推文（引用推文）
                    // 进度条和滑块
                    '[role="slider"]',
                    '[role="progressbar"]',
                    // SVG 图标（通常是按钮的一部分）
                    'svg',
                    // 推文文字区域
                    '[data-testid="tweetText"]',
                    '[lang]'  // 带语言标签的文字内容
                ]

                // 检查点击目标是否在排除列表中
                if (e.target.closest(excludeSelectors.join(', '))) {
                    return
                }

                // 检查是否点击在引用推文区域内
                const quotedTweet = article.querySelector('[data-testid="quoteTweet"], article article')
                if (quotedTweet && quotedTweet.contains(e.target)) {
                    return
                }

                // 检查是否点击在任何可交互的视频/媒体容器内
                const mediaContainer = e.target.closest('[data-testid*="video"], [data-testid*="media"], [data-testid*="player"]')
                if (mediaContainer) {
                    return
                }

                // 查找当前推文的链接（不是引用推文的链接）
                const links = article.querySelectorAll(':scope > div a[href*="/status/"]')
                const link = links[0] || article.querySelector('a[href*="/status/"]')

                if (link) {
                    // 确保不是引用推文的链接
                    const linkInQuote = quotedTweet && quotedTweet.contains(link)
                    if (!linkInQuote) {
                        e.preventDefault()
                        e.stopPropagation()
                        window.open(link.href, '_blank')
                    }
                }
            })
        })
    }

    // 主循环
    function loop() {
        setTimeout(() => {
            if (s_mutations) {
                s_mutations = null

                if (hpp) hidepromo()
                if (hwtf) hidewtf()
                if (hdmd) hidedmd()
                if (hgv) hidegv()
                if (fmt) repldatetime()
                openInNewTab()
            }
            loop()
        }, intl)
    }

    observer.observe(document, { childList: true, subtree: true })
    loop()

    console.log('Twitter日期显示脚本(简化版) 已加载 - 点击推文新标签页打开')
})()
