type ReportRecommendation = {
  rank: number;
  styleName: string;
  silhouette: string;
  neckline: string;
  fabric: string;
  venueMatch: string;
  whyItWorks: string;
  whatToAvoid: string;
  budgetMin: number;
  budgetMax: number;
  budgetGuardrail: string;
  tryFirst: string[];
  skipFirst: string[];
  consultantScript: string;
  salesPressureReminder: string;
  detailCaptions: {
    neckline: string;
    waist: string;
    sleeve: string;
  };
};

type ReportImage = {
  recommendationId: string;
  r2Key: string | null;
};

type BuildBridalReportHtmlParams = {
  title: string;
  generatedAt: Date;
  recommendations: Array<ReportRecommendation & { id: string }>;
  images: ReportImage[];
};

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function list(items: string[]) {
  return items.map(item => `<li>${escapeHtml(item)}</li>`).join("");
}

function money(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

export function buildBridalReportHtml({
  title,
  generatedAt,
  recommendations,
  images,
}: BuildBridalReportHtmlParams) {
  const imageByRecommendationId = new Map(
    images.filter(image => image.r2Key).map(image => [image.recommendationId, image.r2Key as string]),
  );

  const sections = recommendations
    .map(recommendation => {
      const imageUrl = imageByRecommendationId.get(recommendation.id);

      return `
        <section class="recommendation">
          <div class="recommendation-header">
            <div>
              <p class="eyebrow">Direction ${recommendation.rank}</p>
              <h2>${escapeHtml(recommendation.styleName)}</h2>
            </div>
            <span>${escapeHtml(recommendation.silhouette)}</span>
          </div>
          ${
            imageUrl
              ? `<img class="look-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(recommendation.styleName)}" />`
              : ""
          }
          <div class="facts">
            <div><strong>Neckline</strong><p>${escapeHtml(recommendation.neckline)}</p></div>
            <div><strong>Fabric</strong><p>${escapeHtml(recommendation.fabric)}</p></div>
            <div><strong>Budget</strong><p>${money(recommendation.budgetMin)}-${money(recommendation.budgetMax)}</p></div>
          </div>
          <h3>Why it works</h3>
          <p>${escapeHtml(recommendation.whyItWorks)}</p>
          <h3>Venue fit</h3>
          <p>${escapeHtml(recommendation.venueMatch)}</p>
          <h3>Budget guardrail</h3>
          <p>${escapeHtml(recommendation.budgetGuardrail)}</p>
          <div class="columns">
            <div>
              <h3>Try first</h3>
              <ul>${list(recommendation.tryFirst)}</ul>
            </div>
            <div>
              <h3>Skip first</h3>
              <ul>${list(recommendation.skipFirst)}</ul>
            </div>
          </div>
          <h3>Consultant script</h3>
          <blockquote>${escapeHtml(recommendation.consultantScript)}</blockquote>
          <h3>Sales pressure reminder</h3>
          <p>${escapeHtml(recommendation.salesPressureReminder)}</p>
          <div class="captions">
            <div><strong>Neckline</strong><p>${escapeHtml(recommendation.detailCaptions.neckline)}</p></div>
            <div><strong>Waist</strong><p>${escapeHtml(recommendation.detailCaptions.waist)}</p></div>
            <div><strong>Sleeve</strong><p>${escapeHtml(recommendation.detailCaptions.sleeve)}</p></div>
          </div>
        </section>
      `;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        background: #f8f6f1;
        color: #171717;
        font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
        line-height: 1.55;
      }
      main { max-width: 980px; margin: 0 auto; padding: 48px 28px; }
      header { border-bottom: 1px solid #ded8cd; padding-bottom: 28px; margin-bottom: 28px; }
      h1 { font-size: 48px; line-height: 1.05; margin: 0 0 14px; }
      h2 { font-size: 30px; margin: 0; }
      h3 { font-size: 15px; margin: 24px 0 8px; text-transform: uppercase; letter-spacing: 0.08em; }
      p { margin: 0; }
      ul { margin: 8px 0 0; padding-left: 20px; }
      li { margin: 6px 0; }
      blockquote { margin: 8px 0 0; padding: 14px 18px; background: #f8f6f1; border-left: 3px solid #7a8565; }
      .eyebrow { color: #6d6a61; font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; }
      .recommendation {
        background: #fff;
        border: 1px solid #ded8cd;
        border-radius: 14px;
        padding: 26px;
        margin: 0 0 24px;
        page-break-inside: avoid;
      }
      .recommendation-header { display: flex; justify-content: space-between; gap: 20px; align-items: start; }
      .recommendation-header span { border: 1px solid #d8d0c3; border-radius: 999px; padding: 6px 12px; color: #5f694c; }
      .look-image { display: block; width: 100%; max-height: 520px; object-fit: cover; object-position: top; border-radius: 12px; margin: 22px 0; }
      .facts, .captions, .columns { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 20px; }
      .columns { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .facts div, .captions div { background: #f8f6f1; border-radius: 10px; padding: 14px; }
      strong { display: block; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #6d6a61; margin-bottom: 4px; }
      .print-note { color: #6d6a61; margin-top: 8px; }
      @media print {
        body { background: #fff; }
        main { max-width: none; padding: 0; }
        .recommendation { border-color: #ddd; }
      }
      @media (max-width: 720px) {
        h1 { font-size: 34px; }
        .facts, .captions, .columns { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <p class="eyebrow">Find My Bridal Look</p>
        <h1>${escapeHtml(title)}</h1>
        <p>Generated ${escapeHtml(generatedAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }))}</p>
        <p class="print-note">Use your browser print dialog to save this report as a PDF.</p>
      </header>
      ${sections}
    </main>
  </body>
</html>`;
}
