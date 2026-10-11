// plugins/manga.js
// Hammam Bot— مانجا توك 📚

import axios from 'axios';
import cheerio from 'cheerio';
import baileys from '@whiskeysockets/baileys';
import JSZip from 'jszip';
import { theme } from '../core/theme.js'

const { prepareWAMessageMedia, generateWAMessageFromContent, proto } = baileys;

const DEFAULT_IMAGE = 'https://files.catbox.moe/kl75ae.png';
const CACHE_DURATION = 5 * 60 * 1000;
const MAX_IMAGES_PER_CHAPTER = 50;
const REQUEST_TIMEOUT = 30000;
const RETRY_COUNT = 3;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 Cache System
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const cache = new Map();

function getCached(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCached(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 Utility Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function fetchWithRetry(url, retries = RETRY_COUNT) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.get(url, {
                timeout: REQUEST_TIMEOUT,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'ar,en;q=0.9',
                    'Referer': 'https://mangatuk.com/'
                }
            });
            return response;
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
}

async function createImageMessage(conn, url) {
    if (!url || typeof url !== "string" || !url.startsWith("http")) return null;
    try {
        const media = await prepareWAMessageMedia({ image: { url } }, { upload: conn.waUploadToServer });
        return media.imageMessage || null;
    } catch {
        return null;
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔍 البحث باستخدام API + Carousel
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function searchManga(conn, m, query) {
    const react = async (e) => {
        try { await conn.sendMessage(m.chat, { react: { text: e, key: m.key } }); } catch {}
    };

    await react('🔍');

    try {
        const searchUrl = `https://api.mangatuk.com/api/catalog/search?q=${encodeURIComponent(query)}&limit=10&mature=include`;
        const { data } = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Origin': 'https://mangatuk.com',
                'Referer': 'https://mangatuk.com/'
            }
        });

        const results = data.data || [];

        if (results.length === 0) {
            await react('❌');
            return m.reply(theme.build([{ type: 'title', text: `لا توجد نتائج` }, { type: 'divider' }, { type: 'line', text: `🔮 لا توجد نتائج لـ: ${query}` }]));
        }

        const cards = [];
        for (const manga of results.slice(0, 10)) {
            const imageMsg = await createImageMessage(conn, manga.coverImage);
            if (!imageMsg) continue;

            const rating = manga.ratingAvg ? `⭐ ${manga.ratingAvg}/10` : '⭐ جديد';
            const status = manga.status === 'ongoing' ? '🔄 مستمرة' : '✅ مكتملة';

            cards.push({
                body: proto.Message.InteractiveMessage.Body.fromObject({
                    text: `📚 *${manga.title.substring(0, 35)}*\n${status}\n${rating}\n👁️ ${manga.viewCount?.toLocaleString() || 0}`
                }),
                header: proto.Message.InteractiveMessage.Header.fromObject({
                    hasMediaAttachment: true,
                    imageMessage: imageMsg
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: [{
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📖 عرض الفصول',
                            id: `.فصول_توك ${manga.slug}`
                        })
                    }]
                })
            });
        }

        if (cards.length === 0) {
            await react('⚠️');
            return m.reply(theme.build([{ type: 'title', text: `⚠️ خطأ` }, { type: 'divider' }, { type: 'error', text: `🔮 حدث خطأ في تحميل الصور، حاول مرة أخرى.` }]));
        }

        const carouselMsg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.create({
                            text: `🔍 *نتائج البحث عن:* ${query}\n📊 *العدد:* ${results.length} مانجا`
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.create({
                            text: 'Hammam Bot❄️'
                        }),
                        carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards })
                    })
                }
            }
        }, { quoted: m });

        await conn.relayMessage(m.chat, carouselMsg.message, { messageId: carouselMsg.key.id });
        await react('✅');

    } catch (error) {
        console.error('[Manga] Search error:', error);
        await react('❌');
        await m.reply(theme.build([{ type: 'title', text: `خطأ في البحث` }, { type: 'divider' }, { type: 'error', text: `🔮 ${error.message}` }]));
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📖 جلب الفصول وعرضها في قائمة منسدلة
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function getChaptersFromAPI(slug) {
    const cacheKey = `chapters_${slug}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const apiUrl = `https://api.mangatuk.com/api/series/${slug}/chapters`;
        const { data } = await axios.get(apiUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        if (data.chapters && data.chapters.length > 0) {
            setCached(cacheKey, data.chapters);
            return data.chapters;
        }
    } catch(e) {
        console.log('[Manga] API failed, falling back to scraping');
    }

    const url = `https://mangatuk.com/series/${slug}`;
    const { data } = await fetchWithRetry(url);
    const $ = cheerio.load(data);
    
    const chapters = [];
    
    $('a[href*="/series/"][href*="/"]').each((i, el) => {
        const href = $(el).attr('href');
        const match = href.match(/\/(\d+(?:-[a-f0-9]+)?)$/);
        const title = $(el).find('.chapter-title').text().trim();
        const dateText = $(el).find('.chapter-date').text().trim();
        
        if (match && parseInt(match[1]) < 500) {
            const chapterNum = match[1];
            if (!chapters.find(c => c.number === chapterNum)) {
                chapters.push({
                    number: chapterNum,
                    slug: match[1],
                    title: title || null,
                    url: `https://mangatuk.com${href}`,
                    date: dateText
                });
            }
        }
    });
    
    chapters.sort((a, b) => parseInt(b.number) - parseInt(a.number));
    setCached(cacheKey, chapters);
    return chapters;
}

async function showChapters(conn, m, slug) {
    const react = async (e) => {
        try { await conn.sendMessage(m.chat, { react: { text: e, key: m.key } }); } catch {}
    };

    await react('⏳');

    try {
        const url = `https://mangatuk.com/series/${slug}`;
        const { data } = await fetchWithRetry(url);
        const $ = cheerio.load(data);
        
        const title = $('h1').first().text().trim() || slug;
        const coverImg = $('img[src*="content.mangatuk.com/covers"]').first().attr('src') || DEFAULT_IMAGE;
        
        const chapters = await getChaptersFromAPI(slug);

        if (chapters.length === 0) {
            await react('❌');
            return m.reply(theme.build([{ type: 'title', text: `لا توجد فصول` }, { type: 'divider' }, { type: 'line', text: `🔮 لا توجد فصول لـ: ${slug}` }]));
        }

        const rows = chapters.slice(0, 30).map((ch) => ({
            title: ch.title ? `📖 الفصل ${ch.number} - ${ch.title}` : `📖 الفصل ${ch.number}`,
            description: ch.date ? `📅 ${ch.date}` : `اضغط لعرض الصور`,
            id: `.فصل_توك ${slug}/${ch.slug || ch.number}`
        }));

        const imageMsg = await createImageMessage(conn, coverImg);

        const interactiveMessage = proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({
                text: `📚 *${title.substring(0, 40)}*\n📖 *عدد الفصول:* ${chapters.length}\n👇 اختر الفصل من القائمة`
            }),
            footer: proto.Message.InteractiveMessage.Footer.create({
                text: `Hammam Bot❄️`
            }),
            header: imageMsg ? proto.Message.InteractiveMessage.Header.create({
                hasMediaAttachment: true,
                imageMessage: imageMsg
            }) : proto.Message.InteractiveMessage.Header.create({ hasMediaAttachment: false }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [{
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '📖 اختر الفصل',
                        sections: [{ title: 'الفصول المتاحة', rows }]
                    })
                }]
            })
        });

        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: { message: { interactiveMessage } }
        }, { quoted: m });

        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
        await react('✅');

    } catch (error) {
        console.error('[Manga] Chapters error:', error);
        await react('❌');
        await m.reply(theme.build([{ type: 'title', text: `خطأ في جلب الفصول` }, { type: 'divider' }, { type: 'error', text: `📌 تأكد من صحة slug` }, { type: 'line', text: `مثال: one-piece-gakuen` }]));
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📸 عرض صفحات الفصل
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function getChapterImages(slug, chapterSlug) {
    const cacheKey = `chapter_${slug}_${chapterSlug}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const apiUrl = `https://api.mangatuk.com/api/chapter/${slug}/${chapterSlug}`;
        const { data } = await axios.get(apiUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        if (data.pages && Array.isArray(data.pages)) {
            const images = data.pages.map(p => p.imageUrl || p.url).filter(Boolean);
            if (images.length > 0) {
                setCached(cacheKey, images);
                return images;
            }
        }
    } catch(e) {
        console.log('[Manga] API fetch failed, scraping fallback');
    }

    const url = `https://mangatuk.com/series/${slug}/${chapterSlug}`;
    const { data } = await fetchWithRetry(url);
    const $ = cheerio.load(data);
    
    const images = new Set();
    
    $('figure.app-reader-page img').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.includes('/WP-manga/') && !src.includes('avatar') && !src.includes('cover')) {
            images.add(src);
        }
    });
    
    if (images.size === 0) {
        $('img[src*="/WP-manga/"]').each((i, el) => {
            const src = $(el).attr('src');
            if (src && !src.includes('avatar') && !src.includes('cover')) {
                images.add(src);
            }
        });
    }
    
    const imageList = Array.from(images);
    setCached(cacheKey, imageList);
    return imageList;
}

async function getChapterNavigation(slug, currentSlug) {
    const cacheKey = `nav_${slug}`;
    let chapters = getCached(cacheKey);
    
    if (!chapters) {
        chapters = await getChaptersFromAPI(slug);
        setCached(cacheKey, chapters);
    }
    
    const currentIndex = chapters.findIndex(ch => ch.slug === currentSlug || ch.number === currentSlug);
    
    return {
        prev: currentIndex > 0 ? chapters[currentIndex - 1] : null,
        next: currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null,
        current: chapters[currentIndex],
        chapters
    };
}

async function showChapterPages(conn, m, slug, chapterSlug) {
    const react = async (e) => {
        try { await conn.sendMessage(m.chat, { react: { text: e, key: m.key } }); } catch {}
    };

    const startTime = Date.now();
    await react('⏳');
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})

    try {
        const images = await getChapterImages(slug, chapterSlug);

        if (images.length === 0) {
            await react('❌');
            return m.reply(theme.build([{ type: 'title', text: `لا توجد صور` }, { type: 'divider' }, { type: 'line', text: `🔮 لم يتم العثور على صور في الفصل ${chapterSlug}` }]));
        }

        let imagesToSend = images;
        if (images.length > MAX_IMAGES_PER_CHAPTER) {
            await m.reply(theme.build([{ type: 'title', text: `⚠️ فصل كبير` }, { type: 'divider' }, { type: 'warning', text: `هذا الفصل كبير جداً (${images.length} صفحة)` }, { type: 'line', text: `سيتم إرسال أول ${MAX_IMAGES_PER_CHAPTER} صفحة فقط` }]));
            imagesToSend = images.slice(0, MAX_IMAGES_PER_CHAPTER);
        }

        await m.reply(theme.build([{ type: 'title', text: `📸 جاري إرسال ${imagesToSend.length} صفحة...` }]));

        for (let i = 0; i < imagesToSend.length; i++) {
            try {
                await conn.sendMessage(m.chat, {
                    image: { url: imagesToSend[i] },
                    caption: `📖 *الصفحة ${i+1} من ${imagesToSend.length}*\n📚 *الفصل ${chapterSlug}*`
                }, { quoted: m });
                
                if (i < imagesToSend.length - 1) await new Promise(r => setTimeout(r, 500));
            } catch (err) {
                console.error(`[Manga] Page ${i + 1} failed:`, err.message);
                await m.reply(`⚠️ فشل إرسال الصفحة ${i + 1}`);
            }
        }

        const nav = await getChapterNavigation(slug, chapterSlug);
        let navText = theme.build([{ type: 'title', text: `✅ تم إرسال ${imagesToSend.length} صفحة!` }, { type: 'divider' }, { type: 'line', text: `⏱️ *الوقت:* ${((Date.now() - startTime) / 1000).toFixed(1)} ثانية` }]);
        
        if (nav.prev) {
            navText += `> ⬅️ *السابق:* .فصل_توك ${slug}/${nav.prev.slug || nav.prev.number}\n`;
        }
        if (nav.next) {
            navText += `> ➡️ *التالي:* .فصل_توك ${slug}/${nav.next.slug || nav.next.number}\n`;
        }
        
        await m.reply(navText);
        await react('✅');

    } catch (error) {
        console.error('[Manga] Chapter error:', error);
        await react('❌');
        
        if (error.response?.status === 404) {
            await m.reply(theme.build([{ type: 'title', text: `غير موجود` }, { type: 'divider' }, { type: 'line', text: `🔮 الفصل ${chapterSlug} غير موجود` }, { type: 'line', text: `📌 استخدم .فصول_توك ${slug} للفصول المتاحة` }]));
        } else {
            await m.reply(theme.build([{ type: 'title', text: `خطأ` }, { type: 'divider' }, { type: 'error', text: `🔮 ${error.message}` }]));
        }
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 تحميل الفصل كاملاً كملف ZIP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function downloadFullChapter(conn, m, slug, chapterSlug) {
    const react = async (e) => {
        try { await conn.sendMessage(m.chat, { react: { text: e, key: m.key } }); } catch {}
    };

    await react('⏳');
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})

    try {
        const images = await getChapterImages(slug, chapterSlug);

        if (images.length === 0) {
            throw new Error('لم يتم العثور على صور');
        }

        await m.reply(theme.build([{ type: 'title', text: `📸 تم العثور على ${images.length} صفحة` }, { type: 'divider' }, { type: 'line', text: `🔄 جاري إنشاء ملف ZIP...` }]));

        const zip = new JSZip();

        for (let i = 0; i < images.length; i++) {
            try {
                const imgRes = await axios.get(images[i], { 
                    responseType: 'arraybuffer',
                    timeout: 30000
                });
                zip.file(`page_${String(i + 1).padStart(3, '0')}.jpg`, imgRes.data);
            } catch (err) {
                console.error(`[Manga] Failed to download page ${i + 1}:`, err.message);
                await m.reply(`⚠️ فشل تحميل الصفحة ${i + 1}`);
            }
        }

        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        const fileName = `${slug}_chapter_${chapterSlug}.zip`;
        const fileSizeMB = (zipBuffer.length / 1024 / 1024).toFixed(2);

        await conn.sendMessage(m.chat, {
            document: zipBuffer,
            mimetype: 'application/zip',
            fileName: fileName,
            caption: `📦 *الفصل ${chapterSlug}*\n📄 *الصفحات:* ${images.length}\n📁 *الحجم:* ${fileSizeMB} MB\n📚 *السلسلة:* ${slug}`
        }, { quoted: m });

        await react('✅');
        await m.reply(theme.build([{ type: 'title', text: `✅ تم التحميل!` }, { type: 'divider' }, { type: 'line', text: `📁 *الملف:* ${fileName}` }]));

    } catch (err) {
        console.error('[Manga] Download error:', err);
        await react('❌');
        await m.reply(theme.build([{ type: 'title', text: `فشل التحميل` }, { type: 'divider' }, { type: 'error', text: `🔮 ${err.message}` }]));
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ℹ️ معلومات المانجا
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function mangaInfo(conn, m, slug) {
    const react = async (e) => {
        try { await conn.sendMessage(m.chat, { react: { text: e, key: m.key } }); } catch {}
    };

    await react('ℹ️');

    try {
        const url = `https://mangatuk.com/series/${slug}`;
        const { data } = await fetchWithRetry(url);
        const $ = cheerio.load(data);
        
        const title = $('h1').first().text().trim();
        const coverImg = $('img[src*="content.mangatuk.com/covers"]').first().attr('src');
        const description = $('.app-series-hero-description p').first().text().trim();
        const status = $('.app-inline-chip').filter((i, el) => $(el).text().includes('مستمرة') || $(el).text().includes('مكتملة')).text().trim();
        
        let viewCount = '?', rating = '?';
        $('.app-series-hero-stats .min-w-0').each((i, el) => {
            const text = $(el).find('p').text().trim();
            const label = $(el).find('.truncate').last().text().trim();
            if (label === 'المشاهدات') viewCount = text;
            if (label === 'التقييم') rating = text;
        });
        
        const genres = [];
        $('.app-route-hero-genre-list a').each((i, el) => {
            genres.push($(el).text().trim());
        });
        
        const chapters = await getChaptersFromAPI(slug);
        
        let infoText = theme.build([{ type: 'title', text: `معلومات المانجا` }, { type: 'divider' }, { type: 'line', text: `📚 *${title}*` }, { type: 'line', text: `📝 *الوصف:* ${description.substring(0, 150)}${description.length > 150 ? '...' : ''}` }, { type: 'line', text: `📊 *الحالة:* ${status || 'غير معروف'}` }, { type: 'line', text: `👁️ *المشاهدات:* ${viewCount}` }, { type: 'line', text: `⭐ *التقييم:* ${rating}` }, { type: 'line', text: `📖 *الفصول:* ${chapters.length}` }, { type: 'line', text: `🏷️ *التصنيفات:* ${genres.join(', ')}` }]);

        if (coverImg) {
            await conn.sendMessage(m.chat, {
                image: { url: coverImg },
                caption: infoText
            }, { quoted: m });
        } else {
            await m.reply(infoText);
        }
        
        await react('✅');
        
    } catch (error) {
        console.error('[Manga] Info error:', error);
        await react('❌');
        await m.reply(theme.build([{ type: 'title', text: `خطأ` }, { type: 'divider' }, { type: 'error', text: `📌 تأكد من صحة slug` }]));
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 الأمر الرئيسي
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let handler = async (m, { conn, text, command, usedPrefix }) => {
    const react = async (e) => {
        try { await conn.sendMessage(m.chat, { react: { text: e, key: m.key } }); } catch {}
    };

    if ((command === 'مانجا_توك' && !text) || command === 'مساعدة') {
        await react('📚');
        return conn.sendMessage(m.chat, {
            image: { url: DEFAULT_IMAGE },
            caption: theme.build([{ type: 'title', text: `وحدة المانجا` }, { type: 'divider' }, { type: 'line', text: `🔍 *${usedPrefix}مانجا_توك <الاسم>*` }, { type: 'line', text: `▸ البحث عن مانجا` }, { type: 'line', text: `📖 *${usedPrefix}فصول_توك <slug>*` }, { type: 'line', text: `▸ عرض الفصول` }, { type: 'line', text: `📸 *${usedPrefix}فصل_توك <slug/رقم>*` }, { type: 'line', text: `▸ عرض صور الفصل` }, { type: 'line', text: `📦 *${usedPrefix}تحميل_فصل_توك <slug/رقم>*` }, { type: 'line', text: `▸ تحميل الفصل كـ ZIP` }, { type: 'line', text: `ℹ️ *${usedPrefix}معلومات_مانجا_توك <slug>*` }, { type: 'line', text: `▸ معلومات المانجا` }])
        }, { quoted: m });
    }

    if (command === 'مانجا_توك' && text) return searchManga(conn, m, text);
    
    if (command === 'معلومات_مانجا_توك' || command === 'info_tuk') {
        if (!text) return m.reply(`> ⚠️ *الاستخدام:*\n> .معلومات_مانجا_توك slug\n> 📌 *مثال:* .معلومات_مانجا_توك one-piece-gakuen`);
        return mangaInfo(conn, m, text);
    }
    
    if (command === 'فصول_توك') {
        if (!text) return m.reply(`> ⚠️ *الاستخدام:*\n> .فصول_توك slug\n> 📌 *مثال:* .فصول_توك one-piece-gakuen`);
        return showChapters(conn, m, text);
    }
    
    if (command === 'فصل_توك') {
        const parts = text.split('/');
        const slug = parts[0];
        const chapterNum = parts[1];
        if (!slug || !chapterNum) {
            return m.reply(`> ⚠️ *الاستخدام:*\n> .فصل_توك slug/رقم_الفصل\n> 📌 *مثال:* .فصل_توك one-piece-gakuen/12-9e6c2df0`);
        }
        return showChapterPages(conn, m, slug, chapterNum);
    }
    
    if (command === 'تحميل_فصل_توك' || command === 'zip_tuk') {
        const parts = text.split('/');
        const slug = parts[0];
        const chapterNum = parts[1];
        if (!slug || !chapterNum) {
            return m.reply(`> ⚠️ *الاستخدام:*\n> .تحميل_فصل_توك slug/رقم_الفصل\n> 📌 *مثال:* .تحميل_فصل_توك one-piece-gakuen/12-9e6c2df0`);
        }
        return downloadFullChapter(conn, m, slug, chapterNum);
    }
};

handler.command = ['مانجا_توك', 'فصول_توك', 'فصل_توك', 'تحميل_فصل_توك', 'zip_tuk', 'معلومات_مانجا_توك', 'info_tuk'];
handler.tags = ['anime'];
handler.help = ['مانجا_توك <اسم>', 'فصول_توك <slug>', 'فصل_توك <slug/رقم>', 'تحميل_فصل_توك <slug/رقم>', 'معلومات_مانجا_توك <slug>'];

export default handler;