// ==UserScript==
// @name         manwa图片下载PDF版
// @namespace    https://github.com/coofo/someScript
// @version      0.3.1
// @license      AGPL License
// @description  下载漫画为PDF格式（含章节书签）
// @author       coofo
// @updateURL    https://github.com/coofo/someScript/raw/main/tampermonkey/manwa.user.js
// @downloadURL  https://github.com/coofo/someScript/raw/main/tampermonkey/manwa.user.js
// @supportURL   https://github.com/coofo/someScript/issues
// @include      /^https://manwa.(me|live|vip|fun)/book/\d+/
// @require      https://cdnjs.cloudflare.com/ajax/libs/sweetalert2/11.15.10/sweetalert2.all.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
// @require      https://greasyfork.org/scripts/442002-coofoutils/code/coofoUtils.js?version=1107527
// @require      https://greasyfork.org/scripts/453330-coofoutils-tampermonkeyutils/code/coofoUtils-tampermonkeyUtils.js?version=1106599
// @connect      img.manwa.me
// @connect      img.manwa.live
// @connect      img.manwa.vip
// @connect      img.manwa.fun
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function (tools) {
    'use strict';

    const { jsPDF } = window.jspdf;

    let setting = tools.setting;

    Object.assign(setting, {
        def: {
            /**
             * PDF文件名格式
             */
            pdfNameTemplate: "[manwa][${bookId}]${bookName}",

            /**
             * 章节书签名格式
             */
            bookmarkNameTemplate: "${idx_index3} - ${chapterName}"
        },
        threadNum: 5,
        downloadRetryTimes: 2,
        selectType: "all",
        pdfQuality: 1.0
    });

    function padNumber(num, length) {
        let str = String(num);
        while (str.length < length) {
            str = '0' + str;
        }
        return str;
    }

    function sanitizeFileName(name) {
        if (!name) return '';
        return name.replace(/[\\/:*?"<>|]/g, '_').trim();
    }

    function getTextContent(selector) {
        let el = document.querySelector(selector);
        return el ? el.innerText.trim() : '';
    }

    function arrayBufferToBase64(buffer) {
        let binary = '';
        let bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function getImageDimensions(imageData, imageType) {
        return new Promise((resolve, reject) => {
            let blob = new Blob([imageData], { type: `image/${imageType}` });
            let url = URL.createObjectURL(blob);
            let img = new Image();
            img.onload = function() {
                URL.revokeObjectURL(url);
                resolve({ width: img.width, height: img.height });
            };
            img.onerror = function() {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };
            img.src = url;
        });
    }

    function detectImageType(uint8Array) {
        if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8) {
            return 'JPEG';
        } else if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50) {
            return 'PNG';
        } else if (uint8Array[0] === 0x47 && uint8Array[1] === 0x49) {
            return 'GIF';
        } else if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49) {
            return 'WEBP';
        }
        return 'JPEG';
    }

    GM_registerMenuCommand("文件名设置", function () {
        let html = `PDF文件名格式<br/><input id="pdfNameTemplate" style="width: 90%;"><br/>
                    章节书签名格式<br/><input id="bookmarkNameTemplate" style="width: 90%;"><br/>
                        <!--<button id="saveTemplate">保存</button><button id="resetTemplate">默认值</button>-->`;
        Swal.fire({
            title: '命名模板设置',
            html: html,
            footer: `<div><table border="1">
                             <tr><td>巨集</td><td>说明</td></tr>
                             <tr><td>\${bookId}</td><td>漫画ID</td></tr>
                             <tr><td>\${bookName}</td><td>漫画名</td></tr>
                             <tr><td>\${selectType}</td><td>water/adult/all</td></tr>
                             <tr><td>\${chapterId}</td><td>章节ID</td></tr>
                             <tr><td>\${chapterName}</td><td>章节名</td></tr>
                             <tr><td>\${idx}</td><td>章节序号（原始）</td></tr>
                          </table><br>
                          <table border="1">
                             <tr><td>后缀</td><td>说明（取到值时才生效，取不到则替换为空字符串）</td></tr>
                             <tr><td>empty</td><td>未取到时填充为空字符串</td></tr>
                             <tr><td>parenthesis</td><td>圆括号</td></tr>
                             <tr><td>squareBracket</td><td>方括号</td></tr>
                             <tr><td>curlyBracket</td><td>大括号</td></tr>
                             <tr><td>index2</td><td>向前添0补全至2位</td></tr>
                             <tr><td>index3</td><td>向前添0补全至3位（以此类推）</td></tr>
                         </table></div>`,
            confirmButtonText: '保存',
            showDenyButton: true,
            denyButtonText: `恢复默认`,
            showCancelButton: true,
            cancelButtonText: '取消'
        }).then((result) => {
            if (result.isConfirmed) {
                let templateSetting = {
                    pdfNameTemplate: $('#pdfNameTemplate').val(),
                    bookmarkNameTemplate: $('#bookmarkNameTemplate').val()
                };
                GM_setValue("templateSetting", templateSetting);
            } else if (result.isDenied) {
                GM_deleteValue("templateSetting");
            }
        });
        let templateSetting = Object.assign({}, setting.def, GM_getValue("templateSetting", {}));

        $('#pdfNameTemplate').val(templateSetting.pdfNameTemplate);
        $('#bookmarkNameTemplate').val(templateSetting.bookmarkNameTemplate);
    });

    GM_registerMenuCommand("删除该位置之后所有", function () {
        let editBtn = $("#user_js_edit");
        editBtn.text("删之后");
    });

    $("a.detail-bottom-btn").after('<a id="user_js_download" class="detail-bottom-btn" style="width: auto;padding: 0 15px;">⬇下载PDF</a>');

    let btn = $("#user_js_download");
    btn.after('<a id="user_js_edit" class="detail-bottom-btn" style="width: auto;padding: 0 15px;">删除项</a>');

    $("#user_js_edit").click(function () {
        let editBtn = $("#user_js_edit");
        if (editBtn.text() === "删除项") {
            editBtn.text("确定");
        } else if (editBtn.text() === "确定") {
            editBtn.text("删除项");
        }
    });

    $("li[idx]").click(function () {
        let editBtn = $("#user_js_edit");
        let btnText = editBtn.text();
        if (btnText === "删除项") {
            return true;
        } else if (btnText === "删之后") {
            let idx = $(this).attr("idx");
            let deleteAfter = false;
            $("li[idx]").toArray().forEach(li => {
                if (deleteAfter) {
                    $(li).remove();
                } else {
                    let thisIdx = $(li).attr("idx");
                    if (thisIdx === idx) {
                        deleteAfter = true;
                    }
                }
            });
            editBtn.text("删除项");
            return false;
        } else {
            this.remove();
            return false;
        }
    });

    tools.runtime.downloadTask.showMsg = function (msg) {
        btn.html(msg);
    };

    btn.click(async function () {
        if (tools.runtime.nowDownloading) return;
        tools.runtime.nowDownloading = true;

        Object.assign(setting, setting.def, GM_getValue("templateSetting", {}));

        let context = tools.runtime.downloadTask;

        let url = window.location.href;
        let urlMatch = url.match(tools.manwa.regex.bookUrl);

        let rawBookName = getTextContent("h1.detail-main-info-title");
        if (!rawBookName) {
            rawBookName = getTextContent("h1");
        }
        if (!rawBookName) {
            rawBookName = document.title.split('-')[0].trim();
        }
        let cleanBookName = sanitizeFileName(rawBookName);

        let authorEls = document.querySelectorAll("p.detail-main-info-author a");
        let author = Array.from(authorEls).map(a => a.innerText.trim()).join(',');

        // 重置计数器
        context.generateTaskNum = 0;
        context.generatedTaskNum = 0;
        context.downloadTaskNum = 0;
        context.downloadedTaskNum = 0;

        Object.assign(context, {
            types: [],
            allImages: [],
            bookInfo: {
                bookId: urlMatch[1],
                bookName: cleanBookName,
                bookNameRaw: rawBookName,
                author: author
            }
        });

        let adultList = $("ul#adult-list-select li");
        let waterList = $("ul#detail-list-select li");

        if (setting.selectType === "all" || setting.selectType === "adult" || waterList.length <= 0) {
            let adultType = {
                parent: context,
                typeInfo: { selectType: "adult" },
                chapters: []
            };
            context.types.push(adultType);

            for (let i = 0; i < adultList.length; i++) {
                let li = $(adultList[i]);
                let idx = li.attr("idx");
                let chapterLink = li.find('a.chapteritem');
                let chapterId = chapterLink.attr("href").match(/(\d+)$/)[1];
                let rawChapterName = chapterLink.attr("title") || chapterLink.text().trim();
                let cleanChapterName = sanitizeFileName(rawChapterName);

                let idxNum = Number(idx) + 1;
                let idxFormatted = padNumber(idxNum, 3);

                let chapter = {
                    parent: adultType,
                    chapterInfo: {
                        chapterId: chapterId,
                        chapterName: cleanChapterName,
                        chapterNameRaw: rawChapterName,
                        idx: idx,
                        idxNum: idxNum,
                        idxFormatted: idxFormatted
                    },
                    images: []
                };
                adultType.chapters.push(chapter);
            }
        }

        if (setting.selectType === "all" || setting.selectType === "water" || adultList.length <= 0) {
            let waterType = {
                parent: context,
                typeInfo: { selectType: "water" },
                chapters: []
            };
            context.types.push(waterType);

            for (let i = 0; i < waterList.length; i++) {
                let li = $(waterList[i]);
                let idx = li.attr("idx");
                let chapterLink = li.find('a.chapteritem');
                let chapterId = chapterLink.attr("href").match(/(\d+)$/)[1];
                let rawChapterName = chapterLink.attr("title") || chapterLink.text().trim();
                let cleanChapterName = sanitizeFileName(rawChapterName);

                let idxNum = Number(idx) + 1;
                let idxFormatted = padNumber(idxNum, 3);

                let chapter = {
                    parent: waterType,
                    chapterInfo: {
                        chapterId: chapterId,
                        chapterName: cleanChapterName,
                        chapterNameRaw: rawChapterName,
                        idx: idx,
                        idxNum: idxNum,
                        idxFormatted: idxFormatted
                    },
                    images: []
                };
                waterType.chapters.push(chapter);
            }
        }

        Swal.fire({
            title: '下载中',
            html: `<div id="progressGT">解析章节</div>
                   <div><progress id="progressG" value="0" max="100" style="width: 100%;"></progress></div>
                   <div id="progressDT">下载图片</div>
                   <div><progress id="progressD" value="0" max="100" style="width: 100%;"></progress></div>
                   <div id="progressPT">生成PDF</div>
                   <div><progress id="progressP" value="0" max="100" style="width: 100%;"></progress></div>`,
            showConfirmButton: false,
            allowOutsideClick: false
        });

        let getUrlPool = coofoUtils.service.threadPoolTaskExecutor.create(1);
        let downloadPool = coofoUtils.service.threadPoolTaskExecutor.create(setting.threadNum);

        try {
            // 第一步：解析所有章节获取图片URL
            let allChapters = context.types.flatMap(type => type.chapters);
            tools.runtime.downloadTask.generateTaskNum = allChapters.length;

            for (let chapter of allChapters) {
                await new Promise((resolve, reject) => {
                    coofoUtils.service.retryablePromise.create((res, rej) => {
                        getUrlPool.execute((resPool, rejPool) => {
                            setTimeout(() => tools.manwa.downloadHelp.generateTask({
                                success: resPool,
                                failed: rejPool
                            }, chapter), 500);
                        }).then(r => res(r), r => rej(r));
                    }, setting.downloadRetryTimes).then(resolve, reject);
                });
                tools.runtime.downloadTask.generatedTaskNum++;
                tools.runtime.downloadTask.refreshGenerateStatus();
            }

            // 第二步：下载所有图片
            let allImages = allChapters.flatMap(chapter => chapter.images);
            tools.runtime.downloadTask.downloadTaskNum = allImages.length;

            let downloadPromises = allImages.map(image => {
                return coofoUtils.service.retryablePromise.create((res, rej) => {
                    downloadPool.execute((resPool, rejPool) => {
                        tools.manwa.downloadHelp.downloadImage({
                            success: resPool,
                            failed: rejPool
                        }, image);
                    }).then(r => res(r), r => rej(r));
                }, setting.downloadRetryTimes);
            });

            await Promise.all(downloadPromises);

            // 第三步：生成PDF
            $('#progressPT').html('生成PDF中...');

            let pdf = null;
            let isFirstPage = true;
            let totalImages = allImages.length;
            let processedImages = 0;
            let currentPageNum = 0;

            // 存储书签信息
            let bookmarks = [];

            for (let chapter of allChapters) {
                // 记录章节开始页码
                let chapterStartPage = currentPageNum + 1;

                // 使用模板生成书签名
                let bookmarkInfo = Object.assign({}, context.bookInfo, chapter.parent.typeInfo, chapter.chapterInfo);
                let bookmarkTitle = coofoUtils.commonUtils.format.string.filePathByMap(setting.bookmarkNameTemplate, bookmarkInfo);

                let chapterHasImages = false;

                for (let image of chapter.images) {
                    if (!image.imageFile) continue;

                    try {
                        let imageType = detectImageType(image.imageFile);
                        let dimensions = await getImageDimensions(image.imageFile, imageType.toLowerCase());

                        let pageWidth = dimensions.width;
                        let pageHeight = dimensions.height;

                        if (isFirstPage) {
                            pdf = new jsPDF({
                                orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
                                unit: 'px',
                                format: [pageWidth, pageHeight],
                                compress: false
                            });
                            isFirstPage = false;
                        } else {
                            pdf.addPage([pageWidth, pageHeight], pageWidth > pageHeight ? 'landscape' : 'portrait');
                        }

                        currentPageNum++;

                        // 记录章节第一张图的页码
                        if (!chapterHasImages) {
                            chapterStartPage = currentPageNum;
                            chapterHasImages = true;
                        }

                        let base64Data = arrayBufferToBase64(image.imageFile);
                        let imageDataUrl = `data:image/${imageType.toLowerCase()};base64,${base64Data}`;

                        pdf.addImage(imageDataUrl, imageType, 0, 0, pageWidth, pageHeight, undefined, 'NONE');

                        image.imageFile = null;

                    } catch (e) {
                        console.error('处理图片失败:', e);
                    }

                    processedImages++;
                    $('#progressP').attr("value", processedImages);
                    $('#progressP').attr("max", totalImages);
                    $('#progressPT').html(`生成PDF (${processedImages}/${totalImages})`);
                }

                // 只有章节有图片才添加书签
                if (chapterHasImages) {
                    bookmarks.push({
                        title: bookmarkTitle,
                        page: chapterStartPage
                    });
                }
            }

            if (pdf) {
                // 添加书签
                $('#progressPT').html('添加书签...');

                for (let bookmark of bookmarks) {
                    pdf.outline.add(null, bookmark.title, { pageNumber: bookmark.page });
                }

                // 设置PDF元数据
                pdf.setProperties({
                    title: context.bookInfo.bookNameRaw || context.bookInfo.bookName,
                    author: context.bookInfo.author || '',
                    subject: '漫画',
                    creator: 'manwa PDF Downloader'
                });

                // 使用模板生成PDF文件名
                let pdfFileName = coofoUtils.commonUtils.format.string.filePathByMap(setting.pdfNameTemplate, context.bookInfo) + ".pdf";
                pdf.save(pdfFileName);

                tools.runtime.downloadTask.showFinished(tools.runtime.downloadTask.downloadedTaskNum, 0);
                tools.runtime.nowDownloading = false;
                Swal.fire({
                    icon: 'success',
                    title: 'PDF下载完成',
                    text: pdfFileName
                });
            } else {
                throw new Error('没有可用的图片生成PDF');
            }

        } catch (error) {
            console.error(error);
            tools.runtime.nowDownloading = false;
            Swal.fire('下载失败', error.message || error, 'error');
        }
    });

})((function () {

    function padNumber(num, length) {
        let str = String(num);
        while (str.length < length) {
            str = '0' + str;
        }
        return str;
    }

    function sanitizeFileName(name) {
        if (!name) return '';
        return name.replace(/[\\/:*?"<>|]/g, '_').trim();
    }

    const tools = {
        setting: {},
        runtime: {
            nowDownloading: false,
            downloadTask: {
                generateTaskNum: 0,
                generatedTaskNum: 0,
                downloadTaskNum: 0,
                downloadedTaskNum: 0,
                showMsg: function (msg) {
                    console.log(msg);
                },
                refreshGenerateStatus: function () {
                    let completeNum = tools.runtime.downloadTask.generatedTaskNum;
                    let totalNum = tools.runtime.downloadTask.generateTaskNum;
                    $('#progressGT').html(`解析章节 (${completeNum}/${totalNum})`);
                    let progress = $('#progressG');
                    progress.attr("value", completeNum);
                    progress.attr("max", totalNum);
                },
                refreshDownLoadStatus: function () {
                    let completeNum = tools.runtime.downloadTask.downloadedTaskNum;
                    let totalNum = tools.runtime.downloadTask.downloadTaskNum;
                    $('#progressDT').html(`下载图片 (${completeNum}/${totalNum})`);
                    let progress = $('#progressD');
                    progress.attr("value", completeNum);
                    progress.attr("max", totalNum);
                },
                showFinished: function (completeNum, retryTimesOutNum) {
                    let msg = "下载完成：" + completeNum;
                    if (retryTimesOutNum > 0) {
                        msg = msg + " - " + retryTimesOutNum;
                    }
                    this.showMsg(msg);
                }
            }
        },

        manwa: {
            regex: {
                bookUrl: /^https:\/\/manwa.[a-zA-Z]+\/book\/(\d+)/
            },
            api: {
                getImgUrl: function (chapterId, onSuccess, onError) {
                    $.ajax({
                        url: `/chapter/${chapterId}`,
                        type: 'get',
                        contentType: "text/html; charset=utf-8",
                        success: function (request) {
                            let div = document.createElement("div");
                            div.innerHTML = request;
                            let imgUrls = [];
                            let divSelector = $(div);
                            let imgs = divSelector.find("div.view-main-1 img.content-img");
                            for (let i = 0; i < imgs.length; i++) {
                                imgUrls[i] = $(imgs[i]).attr("data-r-src");
                            }
                            onSuccess(imgUrls);
                        },
                        error: onError
                    });
                },
            },
            downloadHelp: {
                generateTask: function (taskItem, chapter) {
                    tools.manwa.api.getImgUrl(chapter.chapterInfo.chapterId, function (imgUrls) {
                        for (let j = 0; j < imgUrls.length; j++) {
                            let imgUrl = imgUrls[j];
                            let noQUrl;
                            let qIdx = imgUrl.lastIndexOf('?');
                            if (qIdx < 0) {
                                noQUrl = imgUrl;
                            } else {
                                noQUrl = imgUrl.substring(0, qIdx);
                            }

                            let suffix = '';
                            let lastDot = noQUrl.lastIndexOf('.');
                            if (lastDot > 0 && lastDot > noQUrl.lastIndexOf('/')) {
                                suffix = noQUrl.substring(lastDot);
                            }
                            if (!suffix || suffix.length > 5) {
                                suffix = '.jpg';
                            }

                            let index = j + 1;
                            chapter.images.push({
                                parent: chapter,
                                imgUrl: imgUrl,
                                imageInfo: {
                                    index: padNumber(index, 3),
                                    indexNum: index,
                                    suffix: suffix
                                },
                                imageFile: null
                            });
                        }
                        taskItem.success();
                    }, function () {
                        taskItem.failed();
                    });
                },

                downloadImage: function (taskItem, image) {
                    let url = coofoUtils.commonUtils.format.url.fullUrl(image.imgUrl);
                    let request = new XMLHttpRequest();
                    request.open("GET", url, true);
                    request.responseType = "arraybuffer";
                    request.onload = function () {
                        if (200 === request.status) {
                            let r = request.response;
                            let a = "my2ecret782ecret";
                            let i = CryptoJS.enc.Utf8.parse(a);
                            let l = CryptoJS.lib.WordArray.create(r);
                            let e = CryptoJS.AES.decrypt({ciphertext: l}, i, {iv: i, padding: CryptoJS.pad.Pkcs7});
                            let o = function (e) {
                                const t = e.sigBytes, r = e.words, a = new Uint8Array(t);
                                for (let n = 0, s = 0; n != t;) {
                                    let i = r[s++];
                                    if (a[n++] = (4278190080 & i) >>> 24, n == t) break;
                                    if (a[n++] = (16711680 & i) >>> 16, n == t) break;
                                    if (a[n++] = (65280 & i) >>> 8, n == t) break;
                                    a[n++] = 255 & i;
                                }
                                return a;
                            };
                            image.imageFile = o(e);
                            taskItem.success();
                            tools.runtime.downloadTask.downloadedTaskNum++;
                            tools.runtime.downloadTask.refreshDownLoadStatus();
                        } else {
                            console.error("download error: " + url);
                            taskItem.failed();
                        }
                    };
                    request.onerror = function() {
                        console.error("download error: " + url);
                        taskItem.failed();
                    };
                    request.send();
                }
            }
        }
    };
    return tools;
})());