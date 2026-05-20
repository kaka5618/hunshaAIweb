import type { BridalQuizAnswers, BridalRecommendationDraft, BridalReportLanguage } from "./types";

function list(values: string[]) {
  return values.length > 0 ? values.join(", ") : "No preference";
}

function outputLanguage(locale: BridalReportLanguage) {
  return locale === "zh" ? "Simplified Chinese" : "English";
}

export function buildBridalRecommendationPrompt(
  answers: BridalQuizAnswers,
  locale: BridalReportLanguage = "en",
) {
  return [
    "You are a senior bridal stylist creating a paid bridal look report.",
    "Return only valid JSON. Do not include markdown, commentary, or code fences.",
    `Write every user-facing value in ${outputLanguage(locale)}.`,
    "Create exactly 3 distinct bridal dress recommendations for the bride.",
    "Each recommendation must be practical for shopping appointments, budget-aware, and emotionally reassuring without overpromising fit.",
    "Use the bride's quiz answers as constraints, not as loose inspiration.",
    "Write like a real bridal stylist reviewing the bride's answers before a first appointment: make judgments, call out tradeoffs, and explain why you are prioritizing one feature over another.",
    "Avoid vague praise. Every recommendation must include the reasoning behind the choice, the risk it avoids, and how the bride should evaluate it in the fitting room.",
    "The report should feel worth paying for: specific, advisory, and grounded in the user's venue, season, budget, neckline, coverage, body comfort notes, and shopping concerns.",
    "Do not use generic filler such as timeless, perfect, stunning, dream, or flattering unless you explain the concrete feature behind it.",
    "Make every recommendation operational: name the silhouette, neckline, fabric behavior, try-on order, and what the bride should ask the consultant to pull.",
    "Keep styleName under 6 words. Keep consultantScript to one sentence the bride can actually say in a store.",
    "venueMatch, whyItWorks, whatToAvoid, budgetGuardrail, and salesPressureReminder must each be 2-4 substantial sentences, not fragments.",
    "tryFirst must contain 3 or 4 concrete appointment actions, each with a short reason. skipFirst must contain 2 or 3 concrete things to avoid first, each with a short reason.",
    "detailCaptions must each be 1-2 sentences that explain what to look for in the generated detail image and how to judge it during a fitting.",
    "budgetMin and budgetMax must fit inside the stated dress budget when a numeric range is available, leaving room for alterations where possible.",
    "Do not repeat the same advice across all three recommendations. Each plan must represent a different decision path and a different reason to try it.",
    "",
    "Required JSON shape:",
    JSON.stringify(
      {
        recommendations: [
          {
            rank: 1,
            styleName: "Short memorable style name",
            silhouette: "Primary silhouette",
            neckline: "Primary neckline",
            fabric: "Primary fabric or texture",
            venueMatch: "Why this fits the venue and season",
            whyItWorks: "Why this works for her preferences and comfort notes",
            whatToAvoid: "Specific features to avoid first",
            budgetMin: 1200,
            budgetMax: 2600,
            budgetGuardrail: "How to stay inside budget while shopping",
            tryFirst: ["Specific feature to ask for"],
            skipFirst: ["Specific feature to skip"],
            consultantScript: "One sentence she can say to a bridal consultant",
            salesPressureReminder: "One sentence that helps her resist pressure",
            detailCaptions: {
              neckline: "Caption for neckline detail image",
              waist: "Caption for waist/detail image",
              sleeve: "Caption for sleeve/coverage detail image",
            },
          },
        ],
      },
      null,
      2,
    ),
    "",
    "Bride quiz answers:",
    `Venue: ${answers.venue}`,
    `Season: ${answers.season}`,
    `Dress budget: ${answers.dressBudget}`,
    `Style words: ${list(answers.styleWords)}`,
    `Preferred silhouettes: ${list(answers.silhouettes)}`,
    `Preferred necklines: ${list(answers.necklines)}`,
    `Coverage preference: ${answers.coverage}`,
    `Body comfort notes: ${list(answers.bodyComfort)}`,
    `Shopping concerns: ${list(answers.shoppingConcerns)}`,
    `Appointment goal: ${answers.appointmentGoal}`,
  ].join("\n");
}

export function buildFallbackBridalRecommendations(
  answers: BridalQuizAnswers,
  locale: BridalReportLanguage = "en",
): BridalRecommendationDraft[] {
  const budgetMax = Number.parseInt(answers.dressBudget.match(/\d+/g)?.at(-1) ?? "2500", 10);
  const safeBudgetMax = Number.isFinite(budgetMax) ? budgetMax : 2500;
  const safeBudgetMin = Math.max(500, Math.round(safeBudgetMax * 0.45));
  const firstSilhouette = answers.silhouettes[0] ?? "A-line";
  const firstNeckline = answers.necklines[0] ?? "soft scoop";

  if (locale === "zh") {
    return [
      {
        rank: 1,
        styleName: "清爽场地浪漫",
        silhouette: firstSilhouette,
        neckline: firstNeckline,
        fabric: "挺括 crepe 搭配柔软内衬",
        venueMatch: `${firstSilhouette} 的线条适合 ${answers.season} 的 ${answers.venue}，因为它有足够的婚礼正式感，但不会让场地感被复杂装饰抢走。这个方向的重点不是“越华丽越好”，而是让你进店后先建立一个舒服、清楚、预算可控的基准。`,
        whyItWorks: `我会把这套作为第一试穿方向，因为它把重点放在 ${answers.styleWords.join("、") || "干净精致的婚纱感"}，同时照顾你的遮盖和舒适需求。上身结构要提供支撑，但不能用过硬束身换取视觉效果；你试穿时需要重点感受坐下、抬手和走路是否轻松。`,
        whatToAvoid: "先避开厚重钉珠、过硬裙撑和只在静态照片里好看的款式。这些元素容易把注意力从你本人转移到婚纱重量上，也更容易推高修改费和配饰预算。",
        budgetMin: safeBudgetMin,
        budgetMax: safeBudgetMax,
        budgetGuardrail: "先要求顾问拿低于预算上限的样衣，把修改费、头纱和内衣预算留出来。如果一件样衣接近预算顶端，只有在它几乎不需要结构性修改时才值得继续考虑。",
        tryFirst: ["有支撑的上身结构", "走动轻松的裙摆", "不会摩擦皮肤的内衬"],
        skipFirst: ["大面积厚重钉珠", "非常硬的蓬裙", "没有提前提到的流行元素"],
        consultantScript: `我想先试 ${firstSilhouette}，领口接近 ${firstNeckline}，整体要利落但不要牺牲舒适度。`,
        salesPressureReminder: "你可以先离开再决定；合适的婚纱应该同时符合风格、预算和身体感受。现场情绪很容易放大优点，所以至少用一次走动和坐下测试来确认。",
        detailCaptions: {
          neckline: `${firstNeckline} 领口让上半身更有重点，但不会压住脸部。试穿时看锁骨附近是否干净、肩带是否稳定。`,
          waist: "轻微收腰能给比例，不需要过紧束身。重点看腰线是否自然落在身体最舒服的位置。",
          sleeve: "需要遮盖时，袖型应该像原设计的一部分，而不是临时加上去。抬手和拥抱动作要一起测试。",
        },
      },
      {
        rank: 2,
        styleName: "柔和经典编辑感",
        silhouette: answers.silhouettes[1] ?? firstSilhouette,
        neckline: answers.necklines[1] ?? firstNeckline,
        fabric: "哑光 satin 或 mikado",
        venueMatch: `哑光面料在 ${answers.venue} 拍照更干净，也适合做第二套对照方向。这个方向适合判断你到底需要多少“正式感”，而不是被蕾丝和装饰先带着走。`,
        whyItWorks: "它有正式婚纱存在感，但不会强迫你进入过度戏剧化的路线。如果第一套显得太轻或太日常，这套可以帮你比较结构、面料和仪式感是否更符合期待。",
        whatToAvoid: "先避开主要靠超长拖尾撑气场的款式，因为它很容易增加修改和行动成本。如果拖尾是唯一亮点，而上身支撑、腰线和行走体验一般，就不应该作为优先选择。",
        budgetMin: safeBudgetMin,
        budgetMax: safeBudgetMax,
        budgetGuardrail: "比较基础裙价和修改报价后，再决定是否增加披肩、外裙或头纱。不要在主裙还没确认前先被配件带高总价。",
        tryFirst: ["哑光主面料", "内置支撑结构", "简洁背部细节"],
        skipFirst: ["易变形的透明拼接", "过大的蝴蝶结", "临时加价的外裙"],
        consultantScript: "请先帮我拿拍照干净、走动方便、不要太多装饰的经典款。",
        salesPressureReminder: "一件婚纱可以很好看，但仍然不一定是最适合你的选择。你要比较的是整体方案，而不是某一个镜头里的惊艳感。",
        detailCaptions: {
          neckline: "干净领口给项链、头纱和发型留出空间。",
          waist: "顺滑腰线让整体更耐看，也更容易控制预算。",
          sleeve: "袖型或披肩需要和主面料一致，避免像后加配件。",
        },
      },
      {
        rank: 3,
        styleName: "轻盈浪漫纹理",
        silhouette: "A-line",
        neckline: firstNeckline,
        fabric: "轻纱搭配克制蕾丝",
        venueMatch: `${answers.season} 适合轻盈纹理，但蕾丝密度要控制，避免压过场地。这个方向适合作为浪漫感对照款，用来判断你是否真的需要更多纹理和柔和度。`,
        whyItWorks: "如果前两个方向显得太素，它可以作为更柔软的对照款。重点不是追求复杂，而是看蕾丝、薄纱和轮廓是否让你本人更放松、更像自己。",
        whatToAvoid: "先跳过图案过密、像表演服或让视线离开脸部的蕾丝。若上身纹理让脖颈和肩线显得拥挤，即使照片局部好看也不建议优先保留。",
        budgetMin: safeBudgetMin,
        budgetMax: safeBudgetMax,
        budgetGuardrail: "询问蕾丝、贴花和裙摆修改是否单独加价，再判断是否值得保留。浪漫细节可以加分，但它必须服务于预算和行动舒适度。",
        tryFirst: ["轻量蕾丝位置", "柔软裙摆体积", "稳定但不勒的肩带"],
        skipFirst: ["刮皮肤的上身", "密集贴花", "超长教堂拖尾"],
        consultantScript: "我想比较一套更柔和浪漫的款式，但它仍然需要轻便、好走、预算可控。",
        salesPressureReminder: "把这套当作对照款，不要因为现场气氛就立刻下定。",
        detailCaptions: {
          neckline: "领口附近的纹理应该修饰脸部，而不是让上半身变拥挤。",
          waist: "腰部少量纹理能增加层次，但不要打乱比例。",
          sleeve: "轻薄袖型最好和裙身材质呼应，整体才会完整。",
        },
      },
    ];
  }

  return [
    {
      rank: 1,
      styleName: "Clean Venue-Ready Romance",
      silhouette: firstSilhouette,
      neckline: firstNeckline,
      fabric: "structured crepe with soft lining",
      venueMatch: `A polished ${firstSilhouette} shape works well for ${answers.venue} in ${answers.season} because it gives enough bridal structure without making the setting feel over-styled. I would use this as your baseline appointment look: it tells you quickly whether clean structure, controlled movement, and practical coverage solve the main brief before you try more decorative gowns.`,
      whyItWorks: `This is the strongest first lane because it keeps the focus on ${answers.styleWords.join(", ") || "a refined bridal feel"} while respecting your coverage preference. The bodice should support without feeling like shapewear, and the skirt should let you sit, walk, and turn without fighting the dress. In the fitting room, judge this by comfort first and mirror impact second.`,
      whatToAvoid: "Skip heavy embellishment, stiff underskirts, and samples that only look good when you stand still. Those details can distract from your face, add alteration cost, and make the appointment feel more expensive than it needs to be before you have a clear baseline.",
      budgetMin: safeBudgetMin,
      budgetMax: safeBudgetMax,
      budgetGuardrail: "Start with samples under your top budget so alterations, foundation pieces, and accessories still fit. If a gown is near the top of the range, only keep it in contention if the consultant says the neckline, hem, and bodice need minimal changes.",
      tryFirst: ["structured bodice", "simple skirt movement", "comfortable lining"],
      skipFirst: ["very heavy beading", "stiff skirts", "trend details you did not request"],
      consultantScript: `I want a ${firstSilhouette} gown with a ${firstNeckline} neckline that feels polished but comfortable.`,
      salesPressureReminder: "You can pause before saying yes; the right dress should match the look, the budget, and the way your body feels in motion. Ask to walk and sit before discussing deposits.",
      detailCaptions: {
        neckline: `A ${firstNeckline} neckline keeps the upper body balanced and intentional. Check that the edge sits cleanly and does not pull when you move your shoulders.`,
        waist: "A lightly defined waist adds shape without making the dress feel restrictive. The best version should give proportion without requiring an uncomfortable corset feel.",
        sleeve: "Soft coverage details can be added without changing the main silhouette. Test arm movement so coverage does not become the reason the dress feels fussy.",
      },
    },
    {
      rank: 2,
      styleName: "Soft Editorial Classic",
      silhouette: answers.silhouettes[1] ?? firstSilhouette,
      neckline: answers.necklines[1] ?? firstNeckline,
      fabric: "matte satin or mikado",
      venueMatch: `The fabric photographs cleanly and suits a ${answers.venue} setting because the surface reads polished without needing many decorative elements. This should be your comparison option for structure and formality: if the first look feels too relaxed, this tells you whether a more editorial fabric gives the right amount of ceremony.`,
      whyItWorks: "It gives bridal presence without forcing a high-drama gown if that feels uncomfortable. The value is in the neckline, waist placement, and fabric weight rather than ornament. That makes it easier to judge fit and alteration needs honestly.",
      whatToAvoid: "Avoid dresses that rely on dramatic trains as the main selling point. A train can photograph beautifully, but if the bodice fit, walking comfort, or total alteration cost is weak, it should not carry the decision.",
      budgetMin: safeBudgetMin,
      budgetMax: safeBudgetMax,
      budgetGuardrail: "Compare base dress price and alteration estimates before adding veils or overskirts. Keep accessories out of the decision until you know the main dress can stand on its own.",
      tryFirst: ["matte fabric", "supportive internal structure", "minimal back detail"],
      skipFirst: ["fragile sheer panels", "oversized bows", "unplanned overskirts"],
      consultantScript: "Please pull gowns that feel classic in photos and easy to move in during the appointment.",
      salesPressureReminder: "A dress can be beautiful and still not be the best choice for you. If the consultant keeps selling the drama but cannot explain comfort or alteration cost, slow the decision down.",
      detailCaptions: {
        neckline: "A cleaner neckline gives accessories room to work.",
        waist: "A smooth waist keeps the look timeless instead of busy.",
        sleeve: "Optional sleeve coverage should feel integrated, not like an afterthought.",
      },
    },
    {
      rank: 3,
      styleName: "Light Romantic Texture",
      silhouette: "A-line",
      neckline: firstNeckline,
      fabric: "soft tulle with restrained lace",
      venueMatch: `Light texture gives movement for ${answers.season} without overpowering the venue. This direction is useful if the cleaner options feel too plain, but it still needs to stay controlled enough that the lace supports the setting instead of becoming the whole story.`,
      whyItWorks: "It is a useful third try-on lane because it tests whether romance and texture make you feel more like yourself. The key is restraint: the lace should frame the neckline, waist, and sleeve areas without making the upper body feel crowded.",
      whatToAvoid: "Skip lace patterns that feel costume-like, scratchy, or distracting near the face. If the detail only looks good in close-up but makes the full silhouette busy, it should not beat the cleaner options.",
      budgetMin: safeBudgetMin,
      budgetMax: safeBudgetMax,
      budgetGuardrail: "Ask whether lace, appliques, and hem changes increase alteration cost. Romantic texture is worth paying for only when it improves the overall look and does not create a hidden alteration bill.",
      tryFirst: ["light lace placement", "soft skirt volume", "comfortable straps"],
      skipFirst: ["scratchy bodices", "dense appliques", "very long cathedral trains"],
      consultantScript: "I want to compare one softer romantic option, but it still needs to feel wearable.",
      salesPressureReminder: "Keep this as a comparison dress, not a pressure purchase.",
      detailCaptions: {
        neckline: "Soft texture near the neckline should frame, not crowd, the face.",
        waist: "Subtle texture at the waist can add interest while keeping proportions clean.",
        sleeve: "Light sleeve detail works best when it matches the gown fabric.",
      },
    },
  ];
}
