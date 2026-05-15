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
    "Do not use generic filler such as timeless, perfect, stunning, dream, or flattering unless you explain the concrete feature behind it.",
    "Make every recommendation operational: name the silhouette, neckline, fabric behavior, try-on order, and what the bride should ask the consultant to pull.",
    "Keep styleName under 6 words. Keep consultantScript to one sentence the bride can actually say in a store.",
    "tryFirst must contain 3 concrete items. skipFirst must contain 2 or 3 concrete items.",
    "budgetMin and budgetMax must fit inside the stated dress budget when a numeric range is available, leaving room for alterations where possible.",
    "detailCaptions must read like labels for AI visual detail cards, not generic prose.",
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
        venueMatch: `${firstSilhouette} 的线条适合 ${answers.season} 的 ${answers.venue}，不会让场地感被复杂装饰抢走。`,
        whyItWorks: `它把重点放在 ${answers.styleWords.join("、") || "干净精致的婚纱感"}，同时照顾你的遮盖和舒适需求。`,
        whatToAvoid: "先避开厚重钉珠和过硬裙撑，避免试纱一开始就被重量和价格带偏。",
        budgetMin: safeBudgetMin,
        budgetMax: safeBudgetMax,
        budgetGuardrail: "先要求顾问拿低于预算上限的样衣，把修改费、头纱和内衣预算留出来。",
        tryFirst: ["有支撑的上身结构", "走动轻松的裙摆", "不会摩擦皮肤的内衬"],
        skipFirst: ["大面积厚重钉珠", "非常硬的蓬裙", "没有提前提到的流行元素"],
        consultantScript: `我想先试 ${firstSilhouette}，领口接近 ${firstNeckline}，整体要利落但不要牺牲舒适度。`,
        salesPressureReminder: "你可以先离开再决定；合适的婚纱应该同时符合风格、预算和身体感受。",
        detailCaptions: {
          neckline: `${firstNeckline} 领口让上半身更有重点，但不会压住脸部。`,
          waist: "轻微收腰能给比例，不需要过紧束身。",
          sleeve: "需要遮盖时，袖型应该像原设计的一部分，而不是临时加上去。",
        },
      },
      {
        rank: 2,
        styleName: "柔和经典编辑感",
        silhouette: answers.silhouettes[1] ?? firstSilhouette,
        neckline: answers.necklines[1] ?? firstNeckline,
        fabric: "哑光 satin 或 mikado",
        venueMatch: `哑光面料在 ${answers.venue} 拍照更干净，也适合做第二套对照方向。`,
        whyItWorks: "它有正式婚纱存在感，但不会强迫你进入过度戏剧化的路线。",
        whatToAvoid: "先避开主要靠超长拖尾撑气场的款式，因为它很容易增加修改和行动成本。",
        budgetMin: safeBudgetMin,
        budgetMax: safeBudgetMax,
        budgetGuardrail: "比较基础裙价和修改报价后，再决定是否增加披肩、外裙或头纱。",
        tryFirst: ["哑光主面料", "内置支撑结构", "简洁背部细节"],
        skipFirst: ["易变形的透明拼接", "过大的蝴蝶结", "临时加价的外裙"],
        consultantScript: "请先帮我拿拍照干净、走动方便、不要太多装饰的经典款。",
        salesPressureReminder: "一件婚纱可以很好看，但仍然不一定是最适合你的选择。",
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
        venueMatch: `${answers.season} 适合轻盈纹理，但蕾丝密度要控制，避免压过场地。`,
        whyItWorks: "如果前两个方向显得太素，它可以作为更柔软的对照款。",
        whatToAvoid: "先跳过图案过密、像表演服或让视线离开脸部的蕾丝。",
        budgetMin: safeBudgetMin,
        budgetMax: safeBudgetMax,
        budgetGuardrail: "询问蕾丝、贴花和裙摆修改是否单独加价，再判断是否值得保留。",
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
      venueMatch: `A polished ${firstSilhouette} shape works well for ${answers.venue} in ${answers.season}.`,
      whyItWorks: `It keeps the focus on ${answers.styleWords.join(", ") || "a refined bridal feel"} while respecting your coverage preference.`,
      whatToAvoid: "Skip heavy embellishment before you try clean structured gowns.",
      budgetMin: safeBudgetMin,
      budgetMax: safeBudgetMax,
      budgetGuardrail: "Start with samples under your top budget so alterations and accessories still fit.",
      tryFirst: ["structured bodice", "simple skirt movement", "comfortable lining"],
      skipFirst: ["very heavy beading", "stiff skirts", "trend details you did not request"],
      consultantScript: `I want a ${firstSilhouette} gown with a ${firstNeckline} neckline that feels polished but comfortable.`,
      salesPressureReminder: "You can pause before saying yes; the right dress should match both the look and the budget.",
      detailCaptions: {
        neckline: `A ${firstNeckline} neckline keeps the upper body balanced and intentional.`,
        waist: "A lightly defined waist adds shape without making the dress feel restrictive.",
        sleeve: "Soft coverage details can be added without changing the main silhouette.",
      },
    },
    {
      rank: 2,
      styleName: "Soft Editorial Classic",
      silhouette: answers.silhouettes[1] ?? firstSilhouette,
      neckline: answers.necklines[1] ?? firstNeckline,
      fabric: "matte satin or mikado",
      venueMatch: `The fabric photographs cleanly and suits a ${answers.venue} setting.`,
      whyItWorks: "It gives bridal presence without forcing a high-drama gown if that feels uncomfortable.",
      whatToAvoid: "Avoid dresses that rely on dramatic trains as the main selling point.",
      budgetMin: safeBudgetMin,
      budgetMax: safeBudgetMax,
      budgetGuardrail: "Compare base dress price and alteration estimates before adding veils or overskirts.",
      tryFirst: ["matte fabric", "supportive internal structure", "minimal back detail"],
      skipFirst: ["fragile sheer panels", "oversized bows", "unplanned overskirts"],
      consultantScript: "Please pull gowns that feel classic in photos and easy to move in during the appointment.",
      salesPressureReminder: "A dress can be beautiful and still not be the best choice for you.",
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
      venueMatch: `Light texture gives movement for ${answers.season} without overpowering the venue.`,
      whyItWorks: "It is a useful third try-on lane if the cleaner options feel too plain.",
      whatToAvoid: "Skip lace patterns that feel costume-like or distract from your face.",
      budgetMin: safeBudgetMin,
      budgetMax: safeBudgetMax,
      budgetGuardrail: "Ask whether lace, appliques, and hem changes increase alteration cost.",
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
