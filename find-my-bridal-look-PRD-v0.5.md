# Find My Bridal Look — 项目需求文档 v0.5

| 字段 | 内容 |
|---|---|
| 版本 | v0.5 |
| 日期 | 2026-05-14 |
| 项目阶段 | MVP / Phase 1 |
| 框架 | Next.js (App Router) |
| 构建工具 | OpenAI Codex |
| 目标市场 | 英语市场，优先美国、英国、加拿大、澳大利亚 |

> **v0.5 相较 v0.3 的主要变更：**
> - 技术栈全部确定（含调研依据）
> - AI 图像生成方案确定为 Seedream 4.5（ByteDance）
> - 数据库确定为 Neon PostgreSQL
> - 文件存储确定为 Cloudflare R2
> - 报告价格确定为 $19.9
> - 新增特写细节图生成规范（袖口、领口、腰部等）
> - 新增单份报告成本测算与毛利分析
> - 新增完整 Quiz 题目设计
> - 新增 /generating 等待页 UX 规范
> - 新增退款政策规则
> - 移除所有 [TODO] 待定项，全部补全为明确决策

---

## 一、项目定位

Find My Bridal Look 是一个面向海外准新娘的独立 AI 婚纱风格顾问工具。核心不是让用户看到自己穿婚纱的效果，而是在用户进入婚纱店之前，帮助她先明确风格方向、婚礼场景匹配、预算边界、试纱优先级和沟通话术。

**用户购买的不是一次性 AI 图片，而是一份可反复查看、下载、分享、带去婚纱店沟通的 Bridal Style & Appointment Confidence Report。**

账号系统的定位是"**报告保险箱**"，不是会员体系。

### 竞品认知与差异化

| 竞品 | 定位 | 差距 |
|---|---|---|
| Bridely.co | AI 婚纱虚拟试穿 + 款式浏览 | 重图片轻决策，无报告，无话术 |
| The Knot Fashion Quiz | 免费风格测验 | 无 AI 生成图，无付费报告 |
| aiweddingdress.com | AI 婚纱设计工具 | 设计向，非决策向，订阅制 $23.2/月 |
| David's Bridal Quiz | 免费引导进店 | 无报告，目的是促进线下销售 |

**核心差异**：提供"独立于商家的客观婚纱决策报告"，包含试纱话术和预算护盾建议——这是竞品均未做到的。

---

## 二、定价与收入模型

### 2.1 报告定价

**单次报告售价：$19.9 USD（一次性付费，不订阅）**

定价依据：
- 竞品中 aiweddingdress.com 订阅制起步 $23.2/月（功能更弱）
- 目标用户的婚纱预算通常在 $500–$3,000+，报告定价远低于决策风险成本
- 一次性付费门槛低，适合"冲动决策"场景
- $19.9 落在"可接受但值得认真对待"的心理价位区间

### 2.2 单份报告成本测算

基于 Seedream 4.5 API 调研数据（$0.04/张）和 DeepSeek API 报告文案生成（约 3000-5000 input tokens + 2000 output tokens）：

| 成本项 | 说明 | 费用 |
|---|---|---|
| AI 图像生成 | 15 张图 × $0.04（预览复用第 1 张全身图） | $0.60 |
| LLM 报告文案 | DeepSeek V4 Flash 生成推荐文案、话术、报告正文 | ~$0.01 |
| Creem 支付手续费 | 按 Creem 后台实际费率估算 | ~$0.88 |
| Neon 数据库 | 按月分摊（免费套餐初期为 $0） | ~$0.02 |
| Cloudflare R2 | 零出口流量费，存储按用量 | ~$0.01 |
| Resend 邮件 | 免费套餐 3,000 封/月 | ~$0.01 |
| **合计变动成本** | | **~$1.53** |
| **单份毛利** | $19.9 - $1.53 | **~$18.37（毛利率 92.3%）** |

> **生成失败备用成本**：按 10% 失败重试率，额外 $0.064，毛利率仍超过 91%。

---

## 三、技术栈选型（含调研依据）

### 3.1 完整技术栈

| 层级 | 选型 | 版本 | 选择依据 |
|---|---|---|---|
| 前端框架 | **Next.js** | App Router | 用户确认 |
| 构建工具 | **OpenAI Codex** | — | 用户确认 |
| 数据库 | **Neon PostgreSQL** | serverless | 用户确认 |
| 文件存储 | **Cloudflare R2** | — | 用户确认；零出口流量费，图片密集型应用节省成本最显著 |
| ORM | **Drizzle ORM** | latest | 与 Neon serverless 原生兼容；bundle 仅 7.4KB（Prisma 1.6MB）；Next.js + Vercel 冷启动最快 |
| 认证系统 | **NextAuth.js v5 (Auth.js)** | v5 | 免费开源；Neon + Drizzle adapter 官方支持；支持 Google OAuth + Email Magic Link |
| 邮件服务 | **Resend** | — | 专为 Next.js/React 设计；React Email 集成；免费 3,000 封/月；$20/月 50,000 封 |
| 支付 | **Creem** | — | 适合一次性数字商品收款；支持 Checkout、Webhook 签名验证和支付状态回调 |
| AI 图像生成 | **Seedream 4.5** | ByteDance | 原生支持虚拟试穿、服装替换、特写细节图；$0.04/张；4K 输出；最多 14 张参考图输入 |
| AI 文案生成 | **DeepSeek API** | deepseek-v4-flash | 生成推荐理由、报告正文、试纱话术；低成本、低延迟，适合批量生成结构化报告文案 |
| 部署 | **Vercel** | — | Next.js 官方推荐；自动 CI/CD；Edge Functions 与 Neon serverless 配合最佳 |
| CDN | **Cloudflare** | — | R2 + Cloudflare CDN 全球加速 AI 生成图片 |

### 3.2 为什么选 Drizzle 而不是 Prisma

根据 2026 年多份独立基准测试（makerkit.dev、designrevision.com、tech-insider.org）：

- Drizzle bundle 7.4KB vs Prisma 7.x 的 1.6MB（即使 Prisma 7 大幅优化后仍差距悬殊）
- Vercel Edge Function 环境下 Drizzle 冷启动 50-100ms vs Prisma 80-150ms
- Drizzle 有 Neon serverless driver 官方支持，连接池配置更简单
- 对单人开发者：Drizzle TypeScript-native schema，无需额外 generate 步骤

### 3.3 为什么选 Seedream 4.5 而不是 FASHN.ai

| 对比项 | FASHN.ai | Seedream 4.5 |
|---|---|---|
| 定位 | 专业服装试穿 API | 通用图像生成+编辑，含试穿 |
| 价格 | $0.075/张 | $0.04/张（低 47%） |
| 特写细节图 | 不支持单独生成细节图 | 支持，可单独 prompt 生成领口/腰部/袖口 |
| 婚纱场景图 | 不支持 | 支持，直接 prompt 生成婚礼场景 |
| 参考图输入 | 1-2 张 | 最多 14 张，人物一致性更强 |
| Next.js 示例 | 官方提供 | 通过 OpenRouter/BytePlus REST API 接入 |
| 用于婚纱的验证 | 是（FASHN 专为此设计） | 是（PicWish 等产品已用 Seedream 实现婚纱试穿） |

**结论**：Seedream 4.5 成本更低、功能更全（特写细节图是差异化关键），选用 Seedream 4.5 通过 BytePlus API 或 OpenRouter 接入。

### 3.4 Seedream API 接入方式

推荐通过 **OpenRouter** 接入（$0.04/张，即时开户，无需企业认证）：

```bash
POST https://openrouter.ai/api/v1/chat/completions
Authorization: Bearer $OPENROUTER_API_KEY
model: "bytedance-seed/seedream-4.5"
```

备选：**BytePlus（字节火山引擎国际版）**，官方直连，企业账号需注册审核。

### 3.5 DeepSeek 文案生成方案

报告文案生成推荐使用 **DeepSeek V4 Flash**，API 模型名：`deepseek-v4-flash`。

选择依据：
- 报告文案属于结构化长文生成，不需要高强度链式推理；重点是稳定遵循模板、语气自然、成本可控。
- DeepSeek V4 Flash 适合高频、低延迟的用户流程，可在用户等待图片生成或支付过程中同步生成报告正文。
- DeepSeek 官方已在 2026-04-24 发布 V4 系列；旧模型名 `deepseek-chat` 和 `deepseek-reasoner` 将于 2026-07-24 停用，因此新项目不应依赖旧模型名。
- 若后续需要更复杂的风格排序、预算约束冲突判断或多轮质量审校，可把审核/重排步骤单独切到 `deepseek-v4-pro`，但 MVP 的正文生成默认使用 `deepseek-v4-flash`。

推荐调用方式：

```bash
POST https://api.deepseek.com/chat/completions
Authorization: Bearer $DEEPSEEK_API_KEY
model: "deepseek-v4-flash"
```

推荐输出策略：
- 使用 JSON 输出，后端校验字段完整性后再写入数据库。
- 一次调用生成 3 个风格方向的完整文案，减少网络延迟和上下文重复成本。
- Prompt 中固定英文输出，因为目标市场为英语市场。
- 不把用户原始照片传给 LLM；只传 Quiz 答案、预算、场地、风格偏好、身材/舒适度偏好等结构化文本。

---

## 四、AI 图像生成规格

### 4.1 每份报告的图像生成计划

完整报告包含 **3 个推荐风格方向**，每个方向生成以下图像：

| 图像类型 | 数量 | 说明 |
|---|---|---|
| 全身婚纱试穿图 | 1 张 | 用户照片参考 + 婚纱风格描述，生成用户身着该风格婚纱的效果图 |
| 领口特写图 | 1 张 | 该风格领口细节的特写，配文字说明 |
| 腰部/裙摆特写图 | 1 张 | 腰部收腰线条或裙摆铺展效果的特写，配文字说明 |
| 袖口/肩部特写图 | 1 张 | 袖型、肩部设计细节特写，配文字说明 |
| 婚礼场景图 | 1 张 | 该风格婚纱出现在对应婚礼场景（如花园/教堂/海滩）中的氛围图（无用户人像） |

**每个风格方向共 5 张图，3 个方向合计 15 张。**

免费预览：第 1 个风格方向的全身试穿图（加水印/模糊处理，前端实现），不额外生成。

**单份完整报告总计生成：15 张图**

### 4.2 特写图生成策略

特写图不是从全身图裁剪，而是**独立 prompt 生成**，原因：
- 独立生成分辨率更高，细节更清晰
- 可控制光线、角度、背景（白底 vs 自然光）
- 比裁剪更适合在报告 PDF 中作为"设计说明插图"使用

特写图 prompt 模板（以领口为例）：
```
Close-up photography of a [neckline_type] neckline on a [fabric_type] wedding gown.
Soft studio lighting, white or soft cream background, ultra-detailed fabric texture,
shallow depth of field, professional bridal editorial style, 2K resolution.
No face, no full body, focus only on the neckline area.
```

### 4.3 生成时序与用户体验

```
用户上传照片 + 完成 Quiz
         ↓
后端创建生成任务队列
         ↓
并行生成：先生成 3 个方向的全身图（最优先）
         ↓
用户进入 /generating 页面
         ↓
第 1 张全身图完成 → 立即展示免费预览页（无需等待全部完成）
         ↓
后台继续生成剩余 14 张特写图和场景图（付费后解锁）
         ↓
用户支付后进入完整报告页（图片已提前生成完毕）
```

生成预计耗时（Seedream 4.5 单张 5-17 秒，并行 3 张）：
- 首张全身图（用户等待）：约 15-30 秒
- 完整 15 张（后台并行）：约 45-90 秒
- 用户支付流程通常需要 60 秒以上，进入报告页时基本已生成完毕

### 4.4 /generating 页面 UX 规范

用户在等待期间看到：

```
[婚纱相关动效插画 / 优雅 loading 动画]

"We're crafting your bridal style portrait..."
"This usually takes about 20-30 seconds."

[进度提示，循环显示]
✦ Analyzing your style preferences...
✦ Designing your silhouette...
✦ Generating your bridal look...

[温馨提示]
"Please keep this tab open while we work our magic ✨"
```

超时处理（>90 秒未完成）：
```
"Your look is taking a little longer than usual.
We'll send it to your email as soon as it's ready."
[输入邮箱保存进度] → 邮件通知完成后继续
```

### 4.5 图像失败处理

| 场景 | 处理方式 |
|---|---|
| 照片质量不合格（模糊/遮挡太多） | 上传阶段提前检测，引导重传 |
| 单张图生成失败 | 自动重试 2 次，仍失败则跳过并在报告中标注 |
| 全部生成失败 | 系统异常，报告标记 Failed，允许重试，不重新付款 |

---

## 五、Bridal Style Quiz 设计

### 5.1 Quiz 结构

共 10 个问题，单问题逐步展示，支持返回修改，全程无需注册。

预计完成时间：3-5 分钟

### 5.2 完整题目列表

**Q1. What kind of venue are you getting married at?**
> 帮助系统判断场景匹配和氛围
- 🌿 Garden / Outdoor
- ⛪ Church / Chapel
- 🏛️ Ballroom / Banquet Hall
- 🏖️ Beach / Waterfront
- 🌲 Forest / Rustic Barn
- 💍 Courthouse / Intimate Elopement
- 🤷 Not decided yet

---

**Q2. When's the big day?**
> 影响面料选择（薄纱 vs 厚缎）和整体风格
- 🌸 Spring (Mar–May)
- ☀️ Summer (Jun–Aug)
- 🍂 Fall (Sep–Nov)
- ❄️ Winter (Dec–Feb)
- 🤷 Not sure yet

---

**Q3. How would you describe your dream bridal vibe?**
> 核心风格锚点，允许多选（最多 2 个）
- 🌹 Romantic & Dreamy
- 👑 Classic & Timeless
- 🌾 Bohemian & Free-spirited
- 🖤 Modern & Minimalist
- 🎞️ Vintage & Old Hollywood
- 🌺 Whimsical & Fairytale

---

**Q4. What's your wedding dress budget?**
> 影响风格推荐和预算护盾建议
- Under $500
- $500–$1,000
- $1,000–$2,000
- $2,000–$4,000
- $4,000+
- I'm flexible — if I love it, I'll find a way

---

**Q5. How strict are you about staying in budget?**
> 影响报告中的"销售压力提醒"强度
- Very strict — I have a firm limit
- Somewhat flexible — maybe 10-15% over
- Open to options — budget is a guide, not a rule

---

**Q6. Is there any part of your body you'd like the dress to flatter or cover?**
> 影响版型推荐和"什么该避开"建议
- Arms / Shoulders
- Back
- Waist / Midsection
- Hips / Thighs
- I want to show everything off!
- No specific concerns

---

**Q7. Which dress silhouette excites you most? (Pick up to 2)**
> 影响版型方向推荐
- 👗 A-Line (flared from waist, flattering for all)
- 🎀 Ball Gown (full skirt, princess style)
- 🖤 Sheath / Column (sleek, straight)
- 🐟 Mermaid / Trumpet (fitted, dramatic flare at hem)
- 🌸 Empire Waist (high waist, flowy skirt)
- I have no idea — surprise me!

---

**Q8. What neckline do you prefer?**
> 影响领口推荐和领口特写图生成
- 💕 Sweetheart
- 🌹 V-Neck (deep or subtle)
- ✨ Off-the-Shoulder / Bardot
- 🎀 Strapless
- 🌿 High Neck / Illusion Neck
- 💫 Square Neck
- No strong preference

---

**Q9. What fabric feels most "you"?**
> 影响面料推荐、特写图质感描述和话术
- Delicate Lace
- Flowing Chiffon
- Sleek Satin
- Soft Tulle
- Structured Mikado / Crepe
- No preference — whatever works best for my style

---

**Q10. What's your biggest concern about going dress shopping?**
> 影响报告中的"销售场景提醒"和"试纱前须知"板块
- Being pushed toward styles I don't love
- Feeling pressured to go over budget
- Not knowing the right vocabulary to describe what I want
- Being overwhelmed by too many options
- Worrying the style won't work for my body
- I feel pretty prepared, actually!

---

### 5.3 Quiz UX 要求

- 单问题逐步展示（非全部在一页），减少认知负担
- 顶部显示进度条（如"Question 3 of 10"）
- 支持"← Back"返回修改前一题
- 全程无需注册，答案存入匿名 Session
- 最后一题结束后，平滑过渡到照片上传页面

---

## 六、账号系统设计原则

### 6.1 注册时机必须后置

用户在以下阶段**不需要**注册：
- 浏览首页
- 完成 Bridal Style Quiz（10 题）
- 上传照片
- 勾选授权确认
- 生成免费预览
- 查看免费预览结果

用户在以下行为发生时**必须**注册/登录：
- 点击 Unlock My Full Report
- 进入 Checkout 页面前
- 下载完整 PDF 报告
- 保存报告到 My Reports
- 生成或管理分享链接

### 6.2 为什么后置注册

正确逻辑：用户先完成测验 → 上传照片 → 看到免费预览，产生"这个工具理解我"的感觉后，再要求注册。此时用户已有明确付费意向，注册阻力明显降低。

账号系统的定位是"**报告保险箱**"，不是会员体系。

### 6.3 登录方式

MVP 第一版支持：
1. **Google OAuth**（适合英语市场用户，一键授权）
2. **Email Magic Link**（避免密码问题，Resend + NextAuth.js 发送）

邮箱 + 密码登录后续支持，不是第一优先级。

### 6.4 登录弹窗文案

不要写：
> "Please register to continue."

推荐写：

**Save Your Bridal Report**

*Create a free account so your report doesn't get lost. You'll be able to download it, revisit it before appointments, and share it privately with friends or your bridal consultant.*

按钮：
- **Continue with Google**
- **Continue with Email**
- **Already have an account? Log in**

---

## 七、完整用户流程

```
[首页] → 点击 [Find My Bridal Look]
    ↓
[/quiz] 完成 10 题 Bridal Style Quiz（无需注册）
    ↓
[/upload] 上传照片 + 勾选授权/年龄/AI 模拟声明
    ↓
系统创建匿名 Session，启动 Seedream 图像生成队列
    ↓
[/generating] 等待页（约 15-30 秒首图完成）
    ↓
[/preview/:id] 免费预览页
  ├── 展示第 1 个推荐方向
  ├── 全身试穿图（水印/模糊）
  ├── 部分推荐理由（其余锁定）
  └── 按钮：[Unlock My Full Report]
    ↓
弹出注册/登录弹窗（Google 或 Magic Link）
    ↓
登录成功 → 匿名 Session 绑定到正式账号
    ↓
[/checkout/:id] 支付页（Creem Checkout）
    ↓
支付 $19.9 → Creem webhook 验证
    ↓
系统解锁完整报告（图片已在后台生成完毕）
生成 PDF → 激活分享链接 → 发送邮件通知
    ↓
[/report/:reportId] 完整报告页
  ├── 3 个风格方向，每个包含：
  │   ├── 全身试穿图
  │   ├── 3 张特写图（领口/腰部/袖口）+ 文字说明
  │   ├── 婚礼场景图
  │   ├── 推荐理由（Why it works）
  │   ├── 谨慎项（What to watch out for）
  │   ├── 预算边界建议
  │   ├── 优先试哪些/先跳过哪些
  │   └── 给婚纱顾问的沟通话术
  ├── [Download PDF]
  └── [Share with Friends / Vote]
    ↓
[/my-reports] 可随时登录查看历史报告
```

---

## 八、报告内容结构

### 8.1 完整报告页面结构（每个风格方向）

```
Style Direction #1 — [风格名称，如 "Romantic Garden Bride"]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[全身试穿图]

Why This Works for You
[3-4 句推荐理由，基于 Quiz 答案个性化生成]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Design Details

[领口特写图]          [腰部特写图]          [袖口特写图]
Sweetheart Neckline   Ruched Waist           Cap Sleeve
[说明文字]             [说明文字]             [说明文字]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌿 Venue Match
[婚礼场景图]
"Perfect for your garden ceremony — the A-line silhouette and..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Budget Guardrail
Expect: $1,200–$2,400 for this style category.
Watch for: Lace appliqués and longer trains add $300–$600.
Your limit: $2,000. You have room — but ask upfront.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Try First / ⏭️ Skip for Now
Try First: A-line with lace overlay, sweetheart neckline, chapel train
Skip for Now: Full ball gown skirt, corset back

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 Your Consultant Script
"I'm looking for a romantic A-line with a sweetheart neckline,
ideally in lace or lace-over-satin. My budget is around $2,000.
Can you show me a few options in that range first?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Sales Pressure Reminder
"If a consultant shows you something outside your stated style and
budget in the first 10 minutes, it's okay to say:
'I'd love to try that later — can we start with what I described?'"
```

### 8.2 特写图文字说明规范

每张特写图附带 2-3 句说明，内容由 DeepSeek API 根据 Quiz 答案生成，格式如下：

**领口说明示例：**
> "The sweetheart neckline creates a flattering frame that balances wider hips and draws the eye upward. The soft curve suits your romantic style and works beautifully with lace overlays."

**腰部说明示例：**
> "This ruched waist creates definition without tightness — ideal for your stated concern about the midsection. The gathering adds dimension while remaining comfortable through a long ceremony."

**袖口说明示例：**
> "The delicate cap sleeve adds coverage for your arms without feeling heavy or outdated. It softens bare shoulders while keeping the overall look light for a garden setting."

### 8.3 报告底部通用板块

```
📋 Your Appointment Checklist
□ Wear nude seamless underwear and a strapless bra
□ Bring your shoes (or shoes with similar heel height)
□ Take photos of every dress you try, even ones you don't love
□ Ask: "What's the production time for this style?"
□ Don't say yes on the first appointment — it's okay to sleep on it

🔗 Share This Report
[Generate Private Share Link]
Let your maid of honor, mom, or bridal consultant see your style direction.
(Your personal details, budget info, and original photo are never shared.)
```

---

## 九、匿名 Session 机制

### 9.1 匿名 Session 数据结构（Neon + Drizzle）

```typescript
// schema/anonymous-session.ts
export const anonymousSessions = pgTable('anonymous_sessions', {
  id: text('id').primaryKey(), // UUID
  userId: text('user_id').references(() => users.id),
  status: text('status').notNull().default('active'), // active | bound | expired
  quizAnswers: jsonb('quiz_answers'),
  photoId: text('photo_id'),
  photoQualityStatus: text('photo_quality_status'), // pending | passed | failed
  recommendationDraft: jsonb('recommendation_draft'),
  previewImageUrl: text('preview_image_url'),
  generationStatus: text('generation_status').default('pending'), // pending | generating | done | failed
  deviceInfo: jsonb('device_info'), // UA, referrer, UTM
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  expiresAt: timestamp('expires_at'), // 72小时后过期
});
```

### 9.2 绑定逻辑

用户登录后：
```
AnonymousSession.userId = currentUser.id
AnonymousSession.status = 'bound'
```

绑定后 UserAccount 拥有：
`QuizAnswer → UploadedPhoto → BridalRecommendation → GeneratedImage → ReportDraft → Payment → Report → ShareToken`

### 9.3 绑定失败处理

弹窗提示：
> "We couldn't save your report to your account. Please try again before continuing to checkout."

不得清除已生成的免费预览数据。

---

## 十、数据库结构（Neon PostgreSQL + Drizzle ORM）

### 10.1 核心表关系

```
users
 ├── anonymous_sessions (userId FK, nullable)
 ├── quiz_answers (userId FK, nullable | sessionId FK)
 ├── uploaded_photos (userId FK, nullable | sessionId FK)
 ├── bridal_recommendations (userId FK | sessionId FK)
 │    └── generated_images (recommendationId FK)
 ├── reports (userId FK)
 │    ├── payments (reportId FK)
 │    └── votes (reportId FK)
 └── share_tokens (reportId FK)
```

### 10.2 UserAccount

| 字段 | 类型 | 说明 |
|---|---|---|
| id | text PK | UUID |
| email | text UNIQUE | 用户邮箱 |
| name | text nullable | 用户名称 |
| avatarUrl | text nullable | 头像（来自 Google OAuth） |
| authProvider | text | google / magic_link |
| emailVerified | boolean | 邮箱是否验证 |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |
| lastLoginAt | timestamp | 最近登录时间 |

### 10.3 UploadedPhoto

| 字段 | 类型 | 说明 |
|---|---|---|
| id | text PK | UUID |
| sessionId | text FK | 匿名 Session ID |
| userId | text FK nullable | 绑定后写入 |
| r2Key | text | Cloudflare R2 存储路径 |
| processedR2Key | text nullable | 处理后照片的 R2 路径 |
| uploadStatus | text | uploaded / processing / failed |
| qualityScore | float nullable | 照片质量评分（0-1） |
| moderationStatus | text | pending / approved / rejected |
| expiresAt | timestamp | 原始照片 72 小时后自动删除 |
| createdAt | timestamp | — |

### 10.4 GeneratedImage

| 字段 | 类型 | 说明 |
|---|---|---|
| id | text PK | UUID |
| sessionId | text FK | — |
| userId | text FK nullable | — |
| recommendationId | text FK | 所属推荐方向 |
| type | text | full_body / neckline_detail / waist_detail / sleeve_detail / venue_scene |
| r2Key | text | Cloudflare R2 存储路径 |
| thumbnailR2Key | text nullable | 缩略图路径 |
| generationStatus | text | pending / generating / success / failed |
| seedreamPrompt | text | 使用的 prompt（用于调试） |
| promptVersion | text | prompt 版本号（方便迭代优化） |
| retryCount | int | 重试次数 |
| errorMessage | text nullable | 失败原因 |
| expiresAt | timestamp | 180 天后过期 |
| createdAt | timestamp | — |

### 10.5 BridalRecommendation

| 字段 | 类型 | 说明 |
|---|---|---|
| id | text PK | UUID |
| sessionId | text FK | — |
| userId | text FK nullable | — |
| reportId | text FK nullable | 生成报告后关联 |
| rank | int | 1/2/3（推荐优先级） |
| styleName | text | 风格名称（如 "Romantic Garden Bride"） |
| silhouette | text | 推荐版型 |
| neckline | text | 推荐领口 |
| fabric | text | 推荐面料 |
| venueMatch | text | 场景匹配描述 |
| whyItWorks | text | 推荐理由（DeepSeek 生成） |
| whatToAvoid | text | 谨慎项 |
| budgetMin | int | 预算下限（美元） |
| budgetMax | int | 预算上限（美元） |
| budgetGuardrail | text | 预算边界建议 |
| tryFirst | text | 优先试的元素 |
| skipFirst | text | 先跳过的元素 |
| consultantScript | text | 给婚纱顾问的话术 |
| salesPressureReminder | text | 销售场景提醒 |
| appointmentChecklist | text | 试纱清单（JSON array） |
| createdAt | timestamp | — |

### 10.6 Report

| 字段 | 类型 | 说明 |
|---|---|---|
| id | text PK | UUID |
| sessionId | text FK | — |
| userId | text FK | — |
| title | text | 报告标题（如"Your Bridal Style Report"） |
| status | text | draft / preview_generated / awaiting_payment / paid / generating / ready / failed / expired |
| isPaid | boolean | 是否已付费 |
| pdfR2Key | text nullable | PDF 文件 R2 路径 |
| shareToken | text UNIQUE nullable | 分享 Token（不可猜测 UUID） |
| shareEnabled | boolean | 是否允许分享 |
| shareExpiresAt | timestamp | 分享链接过期时间（180 天） |
| expiresAt | timestamp | 报告过期时间（180 天） |
| createdAt | timestamp | — |
| updatedAt | timestamp | — |

### 10.7 Payment

| 字段 | 类型 | 说明 |
|---|---|---|
| id | text PK | UUID |
| userId | text FK | — |
| sessionId | text FK nullable | — |
| reportId | text FK | — |
| provider | text | creem |
| amount | int | 金额（分，1990 = $19.90） |
| currency | text | usd |
| status | text | pending / paid / failed / refunded |
| creemCheckoutId | text UNIQUE | Creem Checkout ID |
| creemPaymentId | text nullable | Creem Payment / Order ID |
| refundReason | text nullable | 退款原因 |
| createdAt | timestamp | — |
| paidAt | timestamp nullable | 支付成功时间 |

### 10.8 Vote

| 字段 | 类型 | 说明 |
|---|---|---|
| id | text PK | UUID |
| reportId | text FK | — |
| recommendationId | text FK | — |
| voteType | text | best_overall / best_for_venue / most_elegant / most_you |
| voterName | text nullable | 投票人名称（可选填） |
| voterIpHash | text | IP Hash（防刷票） |
| createdAt | timestamp | — |

---

## 十一、文件存储（Cloudflare R2）

### 11.1 为什么选 R2

根据 2026 年调研（digitalapplied.com、leanopstech.com）：
- 零出口流量费（AWS S3 出口费 $0.09/GB）
- 图片密集型应用（AI 生成图频繁读取）节省成本最显著
- 服务 10TB 数据时：R2 约 $15/月 vs S3 约 $891/月（仅出口费）
- S3 兼容 API，SDK 无需改动，只需修改 endpoint

### 11.2 R2 存储目录结构

```
bridal-app/
├── uploads/
│   └── {sessionId}/{photoId}/original.jpg        # 原始照片（72小时后删除）
│   └── {sessionId}/{photoId}/processed.jpg       # 处理后照片（72小时后删除）
├── generated/
│   └── {reportId}/{recommendationId}/
│       ├── full_body.jpg
│       ├── neckline_detail.jpg
│       ├── waist_detail.jpg
│       ├── sleeve_detail.jpg
│       └── venue_scene.jpg
└── reports/
    └── {reportId}/report.pdf                     # 完整报告 PDF
```

### 11.3 访问控制

- 原始上传照片：**私有**，仅通过 Signed URL 访问（有效期 1 小时）
- AI 生成图片（付费报告）：**私有**，通过 Signed URL 访问
- 分享页图片：通过独立 R2 public bucket 存储，仅包含用户授权分享的图片
- PDF：私有，仅 Signed URL 下载

---

## 十二、支付系统

### 12.1 支付前必须登录

用户必须在进入 Checkout 前完成登录。原因：支付记录需绑定账号；避免支付成功但报告无人认领。

### 12.2 Creem 集成要点

```
前端：Creem Checkout（托管支付页面，减少支付合规负担）
后端：Creem Webhook 验证签名（payment/checkout completed 事件）
不信任前端传回的支付状态，以 Webhook 为准
```

Checkout 创建要求：
- 后端使用 `CREEM_API_KEY` 调用 Creem Checkout API
- 使用独立的一次性商品 `CREEM_REPORT_PRODUCT_ID`，价格固定为 $19.90
- Checkout metadata 必须包含 `userId`、`sessionId`、`reportId`、`productType=bridal_report`
- success_url 指向 `/payment-success?reportId=:reportId`
- cancel_url 指向 `/preview/:reportId`

### 12.3 支付成功后的处理

1. 验证 Creem webhook 签名
2. 根据 webhook metadata 读取 `reportId` 和 `userId`
3. 幂等更新 Payment.status = 'paid'
4. 更新 Report.status = 'generating' → 'ready'
5. 解锁已生成的完整报告（图片在付费前已后台生成）
6. 生成 PDF（html-pdf-node 或 Puppeteer）
7. 激活 shareToken
8. 发送邮件通知（Resend）
9. 跳转 /report/:reportId

### 12.4 支付成功但报告失败

用户提示：
> "Your payment was successful, but we couldn't finish generating your report. You can retry generation from My Reports without paying again."

系统处理：Report.status = 'failed'，保留 Payment 记录，允许免费重试。

### 12.5 防止重复支付

如果 reportId 已 Paid，点击 Unlock 直接跳转 /report/:reportId，不再显示支付界面。

---

## 十三、退款政策

### 13.1 退款规则（需在 /refund-policy 页面和 Checkout 前公示）

| 场景 | 处理 |
|---|---|
| 报告生成失败，系统无法修复 | 全额退款 |
| 支付后 10 分钟内未查看报告（且报告已生成）| 可联系客服申请退款，个案处理 |
| 报告已生成并成功交付 | 不退款（数字商品，已交付） |
| 生成质量明显异常（所有图片均失败） | 免费重新生成，如仍不满意可申请退款 |

### 13.2 Refund Policy 页面核心文案

> "Because your report is a custom-generated digital product created specifically for you, we generally cannot offer refunds once it has been successfully generated and delivered. However, if there is a technical issue that prevents your report from being generated, you will receive a full refund automatically. If you have concerns about your report quality, please contact us within 48 hours of purchase at support@[domain].com"

---

## 十四、邮件通知（Resend）

### 14.1 发送时机

| 邮件类型 | 触发条件 | 优先级 |
|---|---|---|
| Magic Link 登录 | 用户选择 Email Magic Link | 必须，实时发送 |
| 支付成功确认 | Creem webhook 收到 | 必须 |
| 报告生成完成 | Report.status = 'ready' | 必须 |
| 报告生成失败通知 | Report.status = 'failed' | 建议 |
| 生成超时通知 | /generating 等待 >90 秒 | 建议 |

### 14.2 报告完成邮件

**Subject**: Your Bridal Style Report Is Ready ✨

正文要点：
- View My Bridal Report 按钮（链接：`/login?redirect=/report/:reportId`）
- Download PDF 入口
- Share 入口
- 隐私说明（原始照片已安全删除）

### 14.3 支付成功邮件

**Subject**: Payment confirmed — we're preparing your bridal report

> 如报告 <60 秒完成，合并两封为一封报告完成邮件。

---

## 十五、页面结构与路由

| 路径 | 页面 | 访问规则 |
|---|---|---|
| `/` | 首页 / Landing Page | 公开 |
| `/quiz` | Bridal Style Quiz | 公开 |
| `/upload` | 照片上传 | 公开（需 sessionId） |
| `/generating` | 生成中等待页 | 公开（需 sessionId） |
| `/preview/:id` | 免费预览页 | 公开（需 sessionId） |
| `/login` | 登录页 / 弹窗 | 公开 |
| `/checkout/:id` | 支付页 | 必须登录 |
| `/payment-success` | 支付成功过渡页 | 必须登录 |
| `/report/:reportId` | 完整报告页 | 必须登录 + 报告所属权验证 |
| `/my-reports` | 我的报告列表 | 必须登录 |
| `/share/:shareToken` | 分享投票页 | 公开（token 校验） |
| `/privacy` | 隐私政策 | 公开 |
| `/terms` | 使用条款 | 公开 |
| `/refund-policy` | 退款政策 | 公开 |
| `/admin` | 基础管理后台 | 管理员 |

### 15.1 Preview 页面逻辑

1. 未登录可访问，用 sessionId 读取数据
2. 点击 Unlock → 弹出登录弹窗
3. 登录成功 → Session 绑定 → 跳转 /checkout/:id
4. 已登录用户点击 Unlock → 直接进入 /checkout/:id
5. 报告已支付 → 点击 Unlock → 直接跳转 /report/:reportId

### 15.2 Report 页面权限

```typescript
// 访问校验
if (!currentUser) redirect('/login?redirect=/report/' + reportId)
if (report.userId !== currentUser.id) return <Forbidden />
```

---

## 十六、数据保存策略

| 数据类型 | 保存时长 | 说明 |
|---|---|---|
| 原始上传照片（R2） | 72 小时 | 生成报告后自动删除，隐私保护 |
| 处理后临时照片（R2） | 72 小时 | 同上 |
| AI 生成图片（R2） | 180 天 | 报告核心内容 |
| PDF 报告（R2） | 180 天 | 用户可下载 |
| 分享链接 | 180 天 | 默认有效期 |
| 匿名 Session | 72 小时 | 未绑定账号自动清理 |
| 支付记录（Neon） | 7 年 | 财务合规要求 |
| 用户账号数据 | 用户主动删除前 | — |

用户可见说明（报告页面底部）：
> "Your original uploaded photo is stored temporarily for report generation only and deleted automatically within 72 hours. Your generated report remains available for 180 days."

---

## 十七、安全要求

### 17.1 账号安全

- NextAuth.js v5 管理 Session Token，存储在 httpOnly Cookie
- Magic Link 有效期：10 分钟
- Google OAuth token 由 NextAuth 安全处理
- 支持退出登录（清除 Session）
- 用户只能访问自己的完整报告

### 17.2 文件访问安全

- 原始照片：私有 R2，Signed URL，有效期 1 小时
- 生成图片（付费）：私有 R2，Signed URL，有效期 24 小时
- 分享页图片：独立 public bucket，不含用户原始照片
- 分享 Token：UUID v4，不可猜测，可禁用

### 17.3 支付安全

- 使用 Creem 托管 Checkout，不在服务器处理原始卡号
- Webhook 必须验证 Creem 签名头，避免伪造支付成功事件
- 不信任前端传回的支付状态
- 防止重复支付：每个 reportId 只能支付一次

### 17.4 分享页隐私保护

分享页（/share/:shareToken）**绝对不得**展示：
- 用户邮箱、姓名
- 原始上传照片
- 完整 Quiz 答案
- 预算金额
- 支付状态
- 私密备注
- 后台管理链接

---

## 十八、My Reports 页面

### 18.1 页面目的

- 让用户找回已购买报告
- 让用户下载 PDF
- 让用户复制分享链接
- 让用户查看朋友投票结果

路径：`/my-reports`，必须登录访问。

### 18.2 报告状态

| 状态 | 用户可见文字 |
|---|---|
| draft | In Progress |
| preview_generated | Preview Ready |
| awaiting_payment | Awaiting Payment |
| paid | Payment Confirmed |
| generating | Generating Your Report... |
| ready | ✓ Ready to View |
| failed | Generation Failed — Retry Available |
| expired | Expired |

### 18.3 空状态文案

**No bridal reports yet**

*Start your bridal style quiz to discover your wedding dress direction before your first appointment.*

按钮：**Find My Bridal Look**

---

## 十九、分享与投票功能

### 19.1 分享页内容

分享页（/share/:shareToken）展示：
- 用户选择分享的造型图（全身试穿图，不含原始照片）
- 风格名称和简短描述
- 投票按钮（4 个类型）
- 当前投票结果
- 引导访客自己生成报告的 CTA

### 19.2 投票类型

- 💕 Best Overall
- 🌿 Best for Your Venue
- ✨ Most Elegant
- 💖 Most "You"

每个 IP + reportId 只能投票一次（voterIpHash 去重）。

---

## 二十、开发优先级

Phase 1 MVP 开发顺序：

| 优先级 | 模块 |
|---|---|
| P0（核心流程） | 匿名 Session 机制 |
| P0 | Bridal Style Quiz（10 题） |
| P0 | 照片上传 + 照片质量检测 + 授权确认 |
| P0 | Seedream 4.5 图像生成接口（全身图 + 特写图 + 场景图） |
| P0 | DeepSeek API 推荐文案生成 |
| P0 | 免费预览页（水印/模糊处理） |
| P1（账号和支付） | NextAuth.js v5 登录系统（Google + Magic Link） |
| P1 | 匿名 Session 绑定正式账号 |
| P1 | Creem Checkout + Webhook |
| P1 | 完整报告页（含特写图 + 文字说明） |
| P2（报告交付） | PDF 生成 + 下载 |
| P2 | My Reports 页面 |
| P2 | Resend 邮件通知 |
| P2 | 分享投票页 |
| P3（管理） | 基础管理后台（订单/生成记录/异常） |

---

## 二十一、MVP 验收标准

### 21.1 用户流程验收

- [ ] 用户进入首页，点击 Find My Bridal Look
- [ ] 无需注册完成 10 题 Quiz
- [ ] 无需注册上传照片并完成授权确认
- [ ] 系统在 30 秒内展示免费预览（含 1 张全身试穿图）
- [ ] 用户点击 Unlock My Full Report，弹出登录弹窗
- [ ] Google Login 或 Magic Link 登录成功，不丢失 Quiz 数据
- [ ] 用户进入 Creem Checkout，完成 $19.9 支付
- [ ] 支付成功后进入完整报告页（3 个方向 × 5 张图 = 15 张）
- [ ] 每张特写图旁有对应文字说明
- [ ] 用户可下载 PDF 报告
- [ ] 用户可生成分享链接
- [ ] 用户退出后再次登录，在 My Reports 找回报告

### 21.2 关键商业指标（MVP 上线后观察）

| 指标 | 目标值 | 说明 |
|---|---|---|
| 首页 → 开始 Quiz 转化率 | ≥ 20% | 核心漏斗入口 |
| Quiz 完成率 | ≥ 50% | 10 题需控制节奏 |
| 照片上传率 | ≥ 25% | 上传是关键摩擦点 |
| 预览页 → 点击 Unlock 率 | 5%-10% | 核心付费意愿验证 |
| 登录弹窗完成率 | ≥ 40% | 低于此值需优化弹窗文案 |
| 登录后付款完成率 | ≥ 25% | 低于此值需优化 Checkout 页 |
| 整体免费预览 → 付费转化率 | 2%-4% | MVP 阶段目标 |
| 报告 PDF 下载率 | ≥ 60% | 验证报告回访价值 |
| 分享链接生成率 | ≥ 10% | 验证社交传播潜力 |
| 退款率 | < 8% | 高于此值需检查图像质量 |

---

## 二十二、环境变量清单（给 Codex 参考）

```bash
# 数据库
DATABASE_URL=postgresql://...neon.tech/bridal-app

# 认证 (NextAuth.js v5)
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# 文件存储 (Cloudflare R2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=bridal-app
R2_PUBLIC_URL=https://...r2.dev  # 公开 bucket CDN 地址（分享页图片）

# AI 图像生成 (Seedream 4.5 via OpenRouter)
OPENROUTER_API_KEY=
SEEDREAM_MODEL=bytedance-seed/seedream-4.5

# AI 文案生成 (DeepSeek API)
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-v4-flash

# 支付 (Creem)
CREEM_API_KEY=
CREEM_WEBHOOK_SECRET=
CREEM_REPORT_PRODUCT_ID=
# 可选：本地测试/自定义 API 地址
CREEM_API_BASE=https://api.creem.io
CREEM_SIMULATE=false

# 邮件 (Resend)
RESEND_API_KEY=
EMAIL_FROM=hello@[domain].com

# 应用
NEXT_PUBLIC_APP_URL=https://[domain].com
```

---

## 附录：产品逻辑总结（v0.5 核心思路）

**用户路径**：无注册体验 → 免费预览产生信任 → 点击解锁 → 注册保存报告 → 支付 $19.9 → 查看含特写细节图的完整报告 → 下载/分享/回访。

**技术路径**：Next.js + Neon + Drizzle + NextAuth.js + Cloudflare R2 + Seedream 4.5 + DeepSeek API + Creem + Resend + Vercel。

**核心差异化**：
1. 报告中的特写细节图（领口/腰部/袖口）+ 文字说明，让用户真正理解婚纱的设计语言
2. 提供试纱话术和预算护盾——独立于商家的客观建议
3. 一次性付费，无订阅压力，决策门槛低
EOF
