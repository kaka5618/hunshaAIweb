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
  type: string;
  r2Key: string | null;
  generationStatus: string;
  errorMessage: string | null;
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
    images
      .filter(image => image.generationStatus === "success" && !image.errorMessage && image.r2Key && image.type === "full_body")
      .map(image => [image.recommendationId, image.r2Key as string]),
  );
  const imageByRecommendationAndType = new Map(
    images
      .filter(image => image.generationStatus === "success" && !image.errorMessage && image.r2Key)
      .map(image => [`${image.recommendationId}:${image.type}`, image.r2Key as string]),
  );

  const sections = recommendations
    .map(recommendation => {
      const imageUrl = imageByRecommendationId.get(recommendation.id);
      const necklineImage = imageByRecommendationAndType.get(`${recommendation.id}:neckline_detail`);
      const waistImage = imageByRecommendationAndType.get(`${recommendation.id}:waist_detail`);
      const sleeveImage = imageByRecommendationAndType.get(`${recommendation.id}:sleeve_detail`);

      return `
        <section class="recommendation">
          <div class="recommendation-header">
            <div>
              <p class="eyebrow">Direction ${recommendation.rank}</p>
              <h2>${escapeHtml(recommendation.styleName)}</h2>
            </div>
            <div class="badges">
              <span>${escapeHtml(recommendation.silhouette)}</span>
              <span>${escapeHtml(recommendation.neckline)}</span>
            </div>
          </div>
          ${
            imageUrl
              ? `<img class="look-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(recommendation.styleName)}" />`
              : ""
          }
          <div class="facts">
            <div><strong>Silhouette</strong><p>${escapeHtml(recommendation.silhouette)}</p></div>
            <div><strong>Neckline</strong><p>${escapeHtml(recommendation.neckline)}</p></div>
            <div><strong>Fabric</strong><p>${escapeHtml(recommendation.fabric)}</p></div>
            <div><strong>Budget</strong><p>${money(recommendation.budgetMin)}-${money(recommendation.budgetMax)}</p></div>
          </div>
          <div class="editorial-grid">
            <div>
              <h3>Why it works</h3>
              <p>${escapeHtml(recommendation.whyItWorks)}</p>
            </div>
            <div>
              <h3>Venue fit</h3>
              <p>${escapeHtml(recommendation.venueMatch)}</p>
            </div>
            <div>
              <h3>Budget guardrail</h3>
              <p>${escapeHtml(recommendation.budgetGuardrail)}</p>
            </div>
            <div>
              <h3>Avoid first</h3>
              <p>${escapeHtml(recommendation.whatToAvoid)}</p>
            </div>
          </div>
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
          <h3>Visual detail notes</h3>
          <div class="captions">
            <div>
              ${necklineImage ? `<img src="${escapeHtml(necklineImage)}" alt="Neckline detail" />` : ""}
              <strong>Neckline</strong>
              <p>${escapeHtml(recommendation.detailCaptions.neckline)}</p>
            </div>
            <div>
              ${waistImage ? `<img src="${escapeHtml(waistImage)}" alt="Waist detail" />` : ""}
              <strong>Waist</strong>
              <p>${escapeHtml(recommendation.detailCaptions.waist)}</p>
            </div>
            <div>
              ${sleeveImage ? `<img src="${escapeHtml(sleeveImage)}" alt="Sleeve detail" />` : ""}
              <strong>Sleeve</strong>
              <p>${escapeHtml(recommendation.detailCaptions.sleeve)}</p>
            </div>
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
        background: #f7f2ea;
        color: #1f1b16;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.55;
      }
      main { max-width: 980px; margin: 0 auto; padding: 48px 28px; }
      header { background: #fffaf3; border: 1px solid #d8cdbd; border-radius: 14px; padding: 30px; margin-bottom: 24px; }
      h1 { font-size: 48px; line-height: 1.05; margin: 0 0 14px; }
      h2 { font-size: 30px; margin: 0; }
      h3 { font-size: 15px; margin: 24px 0 8px; text-transform: uppercase; letter-spacing: 0.08em; }
      p { margin: 0; }
      ul { margin: 8px 0 0; padding-left: 20px; }
      li { margin: 6px 0; }
      blockquote { margin: 8px 0 0; padding: 14px 18px; background: #f8f6f1; border-left: 3px solid #7a8565; }
      .eyebrow { color: #6d6a61; font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; }
      .report-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 22px; }
      .report-summary div { border: 1px solid #e4dacb; border-radius: 10px; padding: 14px; background: rgba(255,255,255,0.55); }
      .recommendation {
        background: #fffaf3;
        border: 1px solid #d8cdbd;
        border-radius: 14px;
        padding: 26px;
        margin: 0 0 24px;
        page-break-inside: avoid;
      }
      .recommendation-header { display: flex; justify-content: space-between; gap: 20px; align-items: start; }
      .badges { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
      .badges span { border: 1px solid #d8d0c3; border-radius: 999px; padding: 6px 12px; color: #5f694c; }
      .look-image { display: block; width: 100%; max-height: 520px; object-fit: cover; object-position: top; border-radius: 12px; margin: 22px 0; }
      .facts, .captions, .columns, .editorial-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 20px; }
      .facts { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .columns { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .editorial-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .facts div, .captions div, .editorial-grid div, .columns div { background: rgba(255,255,255,0.65); border: 1px solid #e4dacb; border-radius: 10px; padding: 14px; }
      .captions img { width: 100%; height: 150px; object-fit: cover; object-position: top; border-radius: 8px; margin-bottom: 12px; }
      strong { display: block; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #6d6a61; margin-bottom: 4px; }
      .print-note { color: #6d6a61; margin-top: 8px; }
      @media print {
        body { background: #fff; }
        main { max-width: none; padding: 0; }
        .recommendation { border-color: #ddd; }
      }
      @media (max-width: 720px) {
        h1 { font-size: 34px; }
        .report-summary, .facts, .captions, .columns, .editorial-grid { grid-template-columns: 1fr; }
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
        <div class="report-summary">
          <div><strong>Directions</strong><p>${recommendations.length}</p></div>
          <div><strong>Visuals</strong><p>${imageByRecommendationAndType.size}</p></div>
          <div><strong>Format</strong><p>Printable HTML report</p></div>
        </div>
      </header>
      ${sections}
    </main>
  </body>
</html>`;
}
