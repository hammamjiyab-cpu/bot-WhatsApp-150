// plugins/ميدجورني.js
// Hammam Bot- AI Image Generator 🎨

import fetch from 'node-fetch'
import axios from 'axios'

const BASE_URL = 'https://image.pollinations.ai/prompt'
const MAX_IMAGES = 5 // أقصى عدد صور في الطلب الواحد

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 تحويل النسب العربية إلى إنجليزية (للتوثيق فقط)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ASPECT_RATIOS = {
    'مربع': '1:1',
    '1:1': '1:1',
    'square': '1:1',
    'عمودي': '9:16',
    '9:16': '9:16',
    'portrait': '9:16',
    'افقي': '16:9',
    '16:9': '16:9',
    'landscape': '16:9',
    'widescreen': '16:9',
    'عريض': '16:9',
    '4:3': '4:3',
    'standard': '4:3',
    '3:2': '3:2',
    'classic': '3:2',
    'بانوراما': '21:9',
    '21:9': '21:9'
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎭 أنماط جاهزة للاستخدام السريع
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const STYLE_PRESETS = {
    'انمي': 'anime style, vibrant colors, cel-shaded, detailed, studio ghibli inspired',
    'واقعي': 'ultra realistic, hyper-detailed, 8K resolution, professional photography, photorealistic',
    'سايبربانك': 'cyberpunk style, neon lights, futuristic city, rain-soaked streets, blade runner aesthetic',
    'فنتازيا': 'fantasy art, magical atmosphere, ethereal lighting, intricate details, digital painting',
    'بكسل': 'pixel art style, 16-bit, retro game aesthetic, crisp edges, nostalgic',
    'زيتي': 'oil painting style, textured brushstrokes, classical art, canvas texture, masterpiece',
    'رصاص': 'pencil sketch, hand-drawn, grayscale, detailed linework, artistic',
    'ثلاثي_الابعاد': '3D render, octane render, cinematic lighting, unreal engine 5, high quality',
    'مانجا': 'manga art style, black and white, screen tones, dynamic angles, japanese comic',
    'مظلم': 'dark aesthetic, moody atmosphere, low-key lighting, cinematic noir, dramatic shadows',
    'فيكتوري': 'victorian era style, steampunk elements, ornate details, classical',
    'مائي': 'watercolor painting, soft edges, flowing colors, artistic, dreamy',
    'مستقبلي': 'futuristic sci-fi, holographic displays, sleek technology, clean lines',
    'كرتون': 'cartoon style, vibrant, disney pixar inspired, 3d animated style',
    'كوميك': 'comic book style, bold lines, vibrant colors, pop art, superhero style',
    'مينيمال': 'minimalist, clean design, simple, elegant, white space, modern',
    'فلامنكو': 'dark fantasy, gothic, baroque, dramatic lighting, intricate details',
    'طبيعة': 'nature photography, national geographic, wildlife, landscape, golden hour',
    'باستيل': 'pastel colors, soft aesthetic, kawaii, cute, dreamy, light tones',
    'ريترو': 'retro style, vintage, 80s aesthetic, synthwave, nostalgic, grainy'
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 قوالب جاهزة للاستخدام السريع
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PROMPT_PRESETS = {
    'فتاة_المطر': 'beautiful young woman with long dark hair, wearing a blue hooded jacket, serious expression, rain-soaked streets reflecting neon lights, futuristic cyberpunk city background, soft diffused light, cinematic, hyperrealistic',
    'عارضة_أزياء': 'fashion editorial photo, androgynous model posing, soft pastel pink and purple lighting, dreamy ethereal atmosphere, denim outfit, high fashion, vogue magazine quality',
    'محارب': 'epic fantasy warrior standing on a cliff edge, dramatic sunset sky, flowing cape, intricately detailed armor with glowing runes, cinematic composition, god rays, hyperrealistic, 8K',
    'غابة_سحرية': 'enchanted forest with bioluminescent plants, glowing mushrooms, ancient trees, floating particles of light, ethereal atmosphere, fairy tale aesthetic, magical realism, ultra-detailed',
    'مدينة_المستقبل': 'futuristic city 2150, flying vehicles, holographic advertisements, towering crystal skyscrapers, clean energy, utopian society, golden hour lighting, sci-fi architectural marvel',
    'تنين': 'majestic dragon perched on a mountain peak, scales shimmering with iridescent colors, smoke rising from nostrils, full moon background, epic fantasy digital painting, hyper-detailed',
    'قهوة_الصباح': 'cozy coffee shop interior, morning sunlight streaming through windows, steam rising from ceramic cup, books on wooden table, warm tones, hygge aesthetic, photorealistic',
    'ساموراي': 'lone samurai in cherry blossom garden, katana glinting in sunset light, falling petals, traditional japanese architecture background, ink wash painting style meets photorealism',
    'محيط': 'deep ocean scene, sun rays penetrating water surface, whale silhouette in distance, coral reef, bioluminescent jellyfish, underwater photography, national geographic quality',
    'بورتريه': 'studio portrait, professional lighting, bokeh background, sharp focus on eyes, fashion magazine quality, subtle makeup, natural expression, 85mm lens aesthetic',
    'مخلوق_فضائي': 'alien creature design, bioluminescent skin, multiple eyes, exotic alien flora background, scientific illustration style meets sci-fi art, highly detailed anatomy',
    'قلعة': 'gothic castle on haunted hill, full moon, lightning strike, dark stormy sky, dramatic lighting, victorian horror aesthetic, detailed stonework, bats circling towers',
    'قطط': 'adorable fluffy kitten playing with yarn, soft natural lighting, shallow depth of field, cute pet photography, detailed fur texture, heartwarming',
    'سيارة': 'luxury sports car on coastal highway, sunset, motion blur, professional automotive photography, sleek design, reflections, dramatic sky',
    'فضاء': 'astronaut floating in deep space, colorful nebula background, distant galaxies, stars, photorealistic, nasa style, awe-inspiring cosmic scene',
    'روبوت': 'futuristic humanoid robot, sleek metallic design, glowing blue eyes, standing in high-tech laboratory, sci-fi, detailed mechanical parts, cinematic lighting',
    'شاطئ': 'tropical beach paradise, crystal clear turquoise water, white sand, palm trees, sunset, drone photography, vacation aesthetic, serene',
    'جبال': 'majestic snow-capped mountains, alpine lake reflection, pine forest, dramatic clouds, landscape photography, ansel adams style, breathtaking vista',
    'ورود': 'macro photography of roses in full bloom, morning dew drops, soft backlight, garden setting, botanical beauty, ultra-detailed petals',
    'مدينة_ليلاً': 'city skyline at night from rooftop, bokeh lights, long exposure, urban photography, cinematic mood, lonely atmosphere, blade runner vibes'
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 دالة توليد الصورة - Pollinations.ai (مجاني)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function generateImage(prompt, width = 1280, height = 720, seed = null) {
    try {
        // بناء الرابط مع المعلمات
        let url = `${BASE_URL}/${encodeURIComponent(prompt)}`
        
        const params = new URLSearchParams()
        params.append('width', width)
        params.append('height', height)
        params.append('nologo', 'true')
        params.append('enhance', 'true')
        
        if (seed) {
            params.append('seed', seed)
        }
        
        url += `?${params.toString()}`
        
        console.log('[Pollinations]', url.substring(0, 150))

        // تحميل الصورة مباشرة
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })

        // التحقق من أن الرد صورة
        const contentType = response.headers['content-type'] || ''
        if (!contentType.includes('image')) {
            throw new Error('الرد ليس صورة. حاول مجدداً')
        }

        return Buffer.from(response.data)

    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('الصورة غير موجودة. حاول إعادة الصياغة')
        }
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            throw new Error('تعذر الاتصال بالخادم. تأكد من الإنترنت')
        }
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            throw new Error('انتهت مهلة الطلب. حاول مجدداً')
        }
        throw error
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔢 تحويل النسبة إلى أبعاد
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function aspectRatioToDimensions(ratio) {
    const map = {
        '1:1': [1024, 1024],
        '9:16': [576, 1024],
        '16:9': [1280, 720],
        '4:3': [1024, 768],
        '3:2': [1080, 720],
        '21:9': [1680, 720]
    }
    return map[ratio] || [1280, 720]
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 معالج الأوامر الرئيسي
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let handler = async (m, { conn, text, args, usedPrefix, command }) => {

    const react = async (e) => {
        try { await conn.sendMessage(m.chat, { react: { text: e, key: m.key } }) } catch {}
    }

    // ═══════════════ المساعدة ═══════════════
    if (!text || args[0] === 'مساعدة' || args[0] === 'help') {
        await react('🎨')
        
        let helpText = `🎨 *✧ Hammam Bot - مولد الصور المجاني ✧*\n\n`
        helpText += `📝 *الاستخدام الأساسي:*\n`
        helpText += `\`\`\`${usedPrefix}${command} <وصف الصورة>\`\`\`\n\n`
        helpText += `📐 *تحديد الأبعاد:*\n`
        helpText += `\`\`\`${usedPrefix}${command} <وصف> | <نسبة>\`\`\`\n`
        helpText += `النسب: مربع, عمودي, افقي, عريض, 1:1, 9:16, 16:9, 4:3, 3:2\n\n`
        helpText += `🎭 *الأنماط الجاهزة:*\n`
        helpText += `\`\`\`${usedPrefix}${command} نمط <اسم_النمط>\`\`\`\n`
        helpText += `\`\`\`${usedPrefix}${command} <وصف> | نمط <اسم>\`\`\`\n\n`
        helpText += `📦 *القوالب الجاهزة:*\n`
        helpText += `\`\`\`${usedPrefix}${command} قالب <اسم_القالب>\`\`\`\n\n`
        helpText += `💡 *أمثلة:*\n`
        helpText += `• \`${usedPrefix}${command} قطة في الفضاء\`\n`
        helpText += `• \`${usedPrefix}${command} غروب على شاطئ | عريض\`\n`
        helpText += `• \`${usedPrefix}${command} نمط سايبربانك\`\n`
        helpText += `• \`${usedPrefix}${command} قالب محارب\`\n`
        helpText += `• \`${usedPrefix}${command} فتاة انمي | نمط انمي | عمودي\`\n\n`
        helpText += `🔧 *أوامر إضافية:*\n`
        helpText += `• \`${usedPrefix}${command} انماط\` - قائمة الأنماط\n`
        helpText += `• \`${usedPrefix}${command} قوالب\` - قائمة القوالب\n\n`
        helpText += `⚡ *مجاني بالكامل | بدون مفتاح API*\n`
        helpText += `🔮 *Powered by Pollinations.ai*`

        return m.reply(helpText)
    }

    // ═══════════════ قائمة الأنماط ═══════════════
    if (args[0] === 'انماط' || args[0] === 'styles') {
        await react('🎭')
        let styleText = `🎭 *✧ Hammam Bot - الأنماط المتاحة ✧*\n\n`
        const styleNames = Object.keys(STYLE_PRESETS)
        const columns = 2
        for (let i = 0; i < styleNames.length; i += columns) {
            const chunk = styleNames.slice(i, i + columns)
            styleText += `• ${chunk.join(' • ')}\n`
        }
        styleText += `\n📝 *الاستخدام:* \`${usedPrefix}${command} نمط <الاسم>\``
        return m.reply(styleText)
    }

    // ═══════════════ قائمة القوالب ═══════════════
    if (args[0] === 'قوالب' || args[0] === 'templates') {
        await react('📦')
        let templateText = `📦 *✧ Hammam Bot - القوالب الجاهزة ✧*\n\n`
        const templateNames = Object.keys(PROMPT_PRESETS)
        const columns = 2
        for (let i = 0; i < templateNames.length; i += columns) {
            const chunk = templateNames.slice(i, i + columns)
            templateText += `• ${chunk.join(' • ')}\n`
        }
        templateText += `\n📝 *الاستخدام:* \`${usedPrefix}${command} قالب <الاسم>\``
        return m.reply(templateText)
    }

    // ═══════════════ معالجة الإدخال ═══════════════
    let fullText = text
    let aspectRatio = '16:9'
    let prompt = ''
    let styleAddition = ''
    let seed = null
    let negativePrompt = ''

    // تقسيم النص بـ |
    const parts = fullText.split('|').map(p => p.trim()).filter(Boolean)

    for (const part of parts) {
        const lowerPart = part.toLowerCase()

        // فحص النسبة
        if (ASPECT_RATIOS[lowerPart]) {
            aspectRatio = ASPECT_RATIOS[lowerPart]
            continue
        }

        // فحص النمط
        if (lowerPart.startsWith('نمط ') || lowerPart.startsWith('style ')) {
            const styleName = part.replace(/^(نمط|style)\s+/i, '').trim()
            styleAddition = STYLE_PRESETS[styleName] || ''
            if (!styleAddition) {
                return m.reply(`❌ النمط "${styleName}" غير موجود\nاستخدم \`${usedPrefix}${command} انماط\` للقائمة`)
            }
            continue
        }

        // فحص القالب
        if (lowerPart.startsWith('قالب ') || lowerPart.startsWith('template ')) {
            const templateName = part.replace(/^(قالب|template)\s+/i, '').trim()
            const templatePrompt = PROMPT_PRESETS[templateName]
            if (!templatePrompt) {
                return m.reply(`❌ القالب "${templateName}" غير موجود\nاستخدم \`${usedPrefix}${command} قوالب\` للقائمة`)
            }
            prompt = templatePrompt
            continue
        }

        // فحص seed
        if (lowerPart.startsWith('بذرة ') || lowerPart.startsWith('seed ')) {
            seed = parseInt(part.replace(/^(بذرة|seed)\s+/i, '').trim())
            if (isNaN(seed)) seed = null
            continue
        }

        // فحص negative prompt
        if (lowerPart.startsWith('بدون ') || lowerPart.startsWith('no ') || lowerPart.startsWith('negative ')) {
            negativePrompt = part.replace(/^(بدون|no|negative)\s+/i, '').trim()
            continue
        }

        // الباقي يعتبر prompt
        if (!prompt) {
            prompt = part
        } else {
            prompt += ', ' + part
        }
    }

    // إذا مافيش prompt، استخدم النمط فقط
    if (!prompt && styleAddition) {
        prompt = styleAddition
        styleAddition = ''
    }

    // إذا مافيش prompt أساساً
    if (!prompt) {
        return m.reply(`❌ *يرجى كتابة وصف للصورة*\n\n📝 مثال: \`${usedPrefix}${command} قطة في الفضاء\``)
    }

    // دمج النمط مع الوصف
    let finalPrompt = prompt
    if (styleAddition) {
        finalPrompt = `${prompt}, ${styleAddition}`
    }

    // إضافة negative prompt
    if (negativePrompt) {
        finalPrompt += `, -(${negativePrompt})`
    }

    // تحسين الجودة تلقائياً
    if (!finalPrompt.toLowerCase().includes('quality') && 
        !finalPrompt.toLowerCase().includes('detailed') &&
        !finalPrompt.toLowerCase().includes('resolution')) {
        finalPrompt += ', high quality, highly detailed'
    }

    // تحويل النسبة لأبعاد
    const [width, height] = aspectRatioToDimensions(aspectRatio)
    const aspectLabel = Object.entries(ASPECT_RATIOS).find(([k, v]) => v === aspectRatio)?.[0] || aspectRatio

    // ═══════════════ بدء التوليد ═══════════════
    await react('🎨')
    
    let statusText = `🎨 *Hammam Bot ترسم...*\n\n`
    statusText += `📝 *الوصف:* ${finalPrompt.substring(0, 100)}${finalPrompt.length > 100 ? '...' : ''}\n`
    statusText += `📐 *النسبة:* ${aspectLabel} (${width}x${height})\n`
    if (seed) statusText += `🎲 *البذرة:* ${seed}\n`
    statusText += `⏳ *يرجى الانتظار...*`

    await conn.sendMessage(m.chat, { react: { text: '🎨', key: m.key } }).catch(() => {})

    try {
        const startTime = Date.now()

        // توليد الصورة
        const imageBuffer = await generateImage(finalPrompt, width, height, seed)
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
        const fileSizeMB = (imageBuffer.length / 1024 / 1024).toFixed(2)

        // حذف رسالة الانتظار

        // إرسال الصورة
        const caption = `🎨 *✧ Hammam Bot - AI Art ✧*\n\n` +
            `📝 *الوصف:* ${finalPrompt.substring(0, 150)}${finalPrompt.length > 150 ? '...' : ''}\n` +
            `📐 *الأبعاد:* ${width}x${height} (${aspectLabel})\n` +
            `📦 *الحجم:* ${fileSizeMB} MB\n` +
            `⏱️ *الوقت:* ${elapsed} ثانية\n` +
            (seed ? `🎲 *البذرة:* ${seed}\n` : '') +
            `\n🔮 *Powered by Pollinations.ai*`

        await conn.sendMessage(m.chat, {
            image: imageBuffer,
            caption: caption,
            mimetype: 'image/jpeg'
        }, { quoted: m })

        await react('✅')

    } catch (error) {
        console.error('[Pollinations] Error:', error.message)
        await react('❌')
        
        let errorMsg = `❌ *فشل توليد الصورة*\n\n⚠️ ${error.message}`
        
        // اقتراحات للحل
        if (error.message.includes('تعذر الاتصال')) {
            errorMsg += '\n\n💡 *تأكد من اتصالك بالإنترنت*'
        } else if (error.message.includes('404') || error.message.includes('غير موجودة')) {
            errorMsg += '\n\n💡 *حاول إعادة صياغة الوصف بشكل مختلف*'
        } else if (error.message.includes('انتهت مهلة')) {
            errorMsg += '\n\n💡 *حاول مجدداً، قد يكون الخادم مشغولاً*'
        }
        
        return m.reply(errorMsg)
    }
}

handler.command = ['ميدجورني', 'تخيل', 'تت', 'generate', 'pollinations']
handler.tags = ['ai']
handler.help = ['ميدجورني <وصف>', 'تخيل <وصف> | <نسبة>', 'رسم نمط <اسم>']

export default handler