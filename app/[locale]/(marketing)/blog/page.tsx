import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  Heart,
  MapPin,
  PenLine,
  Quote,
  Sparkles,
  Star,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Background } from "@/components/background";
import { Container } from "@/components/container";
import { generatePageMetadata } from "@/lib/metadata";
import { type Locale } from "@/i18n.config";

type BlogContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  personaLabel: string;
  proof: string[];
  heroCard: {
    label: string;
    title: string;
    body: string;
    meta: string;
  };
  testimonialTitle: string;
  testimonialSubtitle: string;
  sampleLabel: string;
  testimonials: Array<{
    name: string;
    location: string;
    wedding: string;
    quote: string;
    outcome: string;
    palette: string;
  }>;
  guideTitle: string;
  guideSubtitle: string;
  guides: Array<{
    title: string;
    description: string;
    tag: string;
    readTime: string;
  }>;
};

const contentByLocale: Record<Locale, BlogContent> = {
  en: {
    eyebrow: "Bridal style journal",
    title: "Real-feeling wedding dress decisions before the first salon visit",
    subtitle:
      "Read sample bride stories, salon prep notes, and practical styling ideas shaped around the same report flow your customers use.",
    ctaPrimary: "Start the style quiz",
    ctaSecondary: "See pricing",
    personaLabel: "AI persona",
    proof: ["3 style directions", "AI try-on visuals", "Budget guardrails"],
    heroCard: {
      label: "Most saved story",
      title: "She stopped shopping by screenshot and started shopping by fit logic.",
      body: "The report turned a folder of mixed inspiration into three clear dress directions: one romantic, one clean, and one dramatic enough for the venue.",
      meta: "Garden venue · $1,800 budget · V-neck preference",
    },
    testimonialTitle: "Sample bride stories",
    testimonialSubtitle:
      "These fictional reviewer personas show the kind of specific, human feedback the product is designed to create after a bride receives her report.",
    sampleLabel: "Generated sample",
    testimonials: [
      {
        name: "Maya Chen",
        location: "Chicago, IL",
        wedding: "Garden ceremony",
        quote:
          "I had dozens of saved dresses, but no reason for choosing one. The report gave me a V-neck direction, a softer waist option, and exact words to say at the appointment.",
        outcome: "Booked two boutiques with a focused fitting list",
        palette: "from-[#f2d9c7] via-[#f8eee5] to-[#d8b49c]",
      },
      {
        name: "Sofia Martinez",
        location: "Miami, FL",
        wedding: "Beach dinner wedding",
        quote:
          "It understood that beach did not mean casual. The fabric notes helped me avoid heavy lace and the consultant script kept the appointment from turning into a sales pitch.",
        outcome: "Chose lightweight tulle and a clean neckline",
        palette: "from-[#d8e7df] via-[#fbf7ee] to-[#b7c8bc]",
      },
      {
        name: "Emma Reed",
        location: "London, UK",
        wedding: "Winter city venue",
        quote:
          "The best part was seeing why one silhouette made sense for my venue and budget. It felt like a stylist had translated my messy questionnaire into a plan.",
        outcome: "Compared three silhouettes without panic scrolling",
        palette: "from-[#d8d2c8] via-[#f7efe4] to-[#a99886]",
      },
      {
        name: "Clara Thompson",
        location: "Austin, TX",
        wedding: "Modern chapel",
        quote:
          "I used the exact wording in the report at the salon. It made me sound prepared, and it helped me say no to dresses that looked pretty but did not fit the brief.",
        outcome: "Kept the appointment under budget",
        palette: "from-[#eadac0] via-[#fff8ed] to-[#c9a87d]",
      },
    ],
    guideTitle: "Planning notes brides actually use",
    guideSubtitle:
      "Short, practical reads for turning a visual report into a calmer appointment.",
    guides: [
      {
        title: "How to brief a bridal consultant without overexplaining",
        description:
          "Bring three direction names, one budget range, and two non-negotiables. Leave the rest open enough for the consultant to surprise you.",
        tag: "Salon prep",
        readTime: "4 min read",
      },
      {
        title: "What to do when two necklines both look good",
        description:
          "Compare how each neckline affects posture, jewelry, sleeve coverage, and photo angles instead of judging only the mirror moment.",
        tag: "Fit logic",
        readTime: "5 min read",
      },
      {
        title: "Why your venue should change your fabric choices",
        description:
          "Beach, chapel, garden, and ballroom settings each change how much structure, shine, and movement will feel natural.",
        tag: "Venue styling",
        readTime: "6 min read",
      },
    ],
  },
  zh: {
    eyebrow: "新娘造型日志",
    title: "在第一次试纱前，把婚纱选择变成清晰方案",
    subtitle:
      "这里展示示例新娘故事、试纱准备笔记和可执行的造型建议，帮助用户理解报告真正能解决什么问题。",
    ctaPrimary: "开始风格测验",
    ctaSecondary: "查看定价",
    personaLabel: "AI 人物",
    proof: ["3 个风格方向", "AI 试穿视觉图", "预算边界建议"],
    heroCard: {
      label: "最常被收藏的故事",
      title: "她不再靠截图盲选婚纱，而是带着适合自己的判断去试纱。",
      body: "报告把混乱的灵感图整理成三个清楚方向：一个浪漫、一个干净、一个更适合正式场地。",
      meta: "花园婚礼 · $1,800 预算 · 偏好 V 领",
    },
    testimonialTitle: "示例新娘故事",
    testimonialSubtitle:
      "以下是虚构的用户人物和示例评价，用来展示产品希望带给用户的具体体验，不代表真实客户背书。",
    sampleLabel: "生成示例",
    testimonials: [
      {
        name: "Maya Chen",
        location: "芝加哥",
        wedding: "花园仪式",
        quote:
          "我收藏了很多婚纱图，但不知道为什么适合我。报告给了我 V 领方向、柔和腰线选择，还有试纱时可以直接说的话。",
        outcome: "用清单预约了两家婚纱店",
        palette: "from-[#f2d9c7] via-[#f8eee5] to-[#d8b49c]",
      },
      {
        name: "Sofia Martinez",
        location: "迈阿密",
        wedding: "海边晚宴婚礼",
        quote:
          "它理解海边不等于随便。面料建议让我避开厚重蕾丝，顾问话术也让我不会被销售节奏带着走。",
        outcome: "确定轻盈薄纱和干净领口",
        palette: "from-[#d8e7df] via-[#fbf7ee] to-[#b7c8bc]",
      },
      {
        name: "Emma Reed",
        location: "伦敦",
        wedding: "冬季城市场地",
        quote:
          "最有用的是它解释了为什么某个廓形适合我的场地和预算，像是把我混乱的问卷答案翻译成了造型计划。",
        outcome: "不再反复刷图，直接比较 3 个廓形",
        palette: "from-[#d8d2c8] via-[#f7efe4] to-[#a99886]",
      },
      {
        name: "Clara Thompson",
        location: "奥斯汀",
        wedding: "现代教堂婚礼",
        quote:
          "我在婚纱店直接用了报告里的表达。听起来更有准备，也更容易拒绝那些漂亮但不符合需求的裙子。",
        outcome: "试纱过程没有超预算",
        palette: "from-[#eadac0] via-[#fff8ed] to-[#c9a87d]",
      },
    ],
    guideTitle: "用户真正会用到的试纱笔记",
    guideSubtitle:
      "短而实用的内容，帮助用户把视觉报告变成更从容的试纱行动。",
    guides: [
      {
        title: "如何和婚纱顾问沟通，而不是解释一大堆截图",
        description:
          "带上三个方向名、一个预算区间和两个不能妥协的点，其余空间留给顾问发挥。",
        tag: "试纱准备",
        readTime: "4 分钟阅读",
      },
      {
        title: "两个领口都好看时，应该怎么判断",
        description:
          "不要只看镜子里的第一眼，要比较领口对体态、首饰、袖型覆盖和照片角度的影响。",
        tag: "适配判断",
        readTime: "5 分钟阅读",
      },
      {
        title: "为什么婚礼场地会影响面料选择",
        description:
          "海边、教堂、花园和宴会厅，会改变结构感、光泽度和裙摆动态是否自然。",
        tag: "场地造型",
        readTime: "6 分钟阅读",
      },
    ],
  },
};

export async function generateMetadata(
  props: {
    params: Promise<{ locale: Locale }>;
  },
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: "blog" });

  return generatePageMetadata({
    locale: params.locale,
    path: "/blog",
    title: t("title"),
    description: t("subtitle"),
  });
}

interface PageProps {
  params: Promise<{
    locale: Locale;
  }>;
}

export default async function ArticlesIndex(props: PageProps) {
  const params = await props.params;
  const content = contentByLocale[params.locale] ?? contentByLocale.en;
  const localizedPath = (path: string) =>
    params.locale === "en" ? path : `/${params.locale}${path === "/" ? "" : path}`;

  return (
    <main className="relative overflow-hidden bg-[#fbf7ef]">
      <Background />
      <Container className="relative z-10 pb-24 pt-28 md:pt-36">
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(380px,0.98fr)] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dfd1bf] bg-white/70 px-4 py-2 text-sm font-medium text-[#6f5f4d] shadow-sm">
              <Sparkles className="h-4 w-4" />
              {content.eyebrow}
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-[#1f1b16] md:text-7xl">
              {content.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#685f55]">
              {content.subtitle}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={localizedPath("/quiz")}
                className="inline-flex items-center justify-center rounded-full bg-[#171412] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2b2520]"
              >
                {content.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href={localizedPath("/pricing")}
                className="inline-flex items-center justify-center rounded-full border border-[#d8cdbd] bg-white/70 px-6 py-3 text-sm font-semibold text-[#1f1b16] transition hover:bg-white"
              >
                {content.ctaSecondary}
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {content.proof.map(item => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-[#e2d6c7] bg-white/60 px-3 py-1.5 text-sm text-[#6f5f4d]"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#7f8b62]" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-[#d8cdbd] bg-white shadow-2xl shadow-[#9b8264]/10">
              <div className="relative h-[420px]">
                <Image
                  src="/bridal/home-report-table.png"
                  alt={content.heroCard.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1f1b16]/80 via-[#1f1b16]/15 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                    {content.heroCard.label}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold leading-tight">
                    {content.heroCard.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-white/80">
                    {content.heroCard.body}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-t border-[#eadfce] bg-[#fffaf3] p-5 text-sm text-[#6f5f4d]">
                <CalendarDays className="h-4 w-4" />
                {content.heroCard.meta}
              </div>
            </div>
            <div className="absolute -right-4 -top-5 hidden rounded-2xl border border-[#dfd1bf] bg-white/90 p-4 shadow-xl md:block">
              <div className="flex items-center gap-1 text-[#a77541]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-2 max-w-[11rem] text-sm font-medium text-[#1f1b16]">
                Appointment-ready after one report
              </p>
            </div>
          </div>
        </section>

        <section className="mt-24">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a735b]">
                {content.sampleLabel}
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[#1f1b16] md:text-5xl">
                {content.testimonialTitle}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#685f55]">
              {content.testimonialSubtitle}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {content.testimonials.map((testimonial, index) => (
                <TestimonialCard
                  key={testimonial.name}
                  testimonial={testimonial}
                  index={index}
                  personaLabel={content.personaLabel}
                />
            ))}
          </div>
        </section>

        <section className="mt-24 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="rounded-[2rem] border border-[#d8cdbd] bg-[#171412] p-8 text-white shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <PenLine className="h-5 w-5" />
            </div>
            <h2 className="mt-8 text-4xl font-semibold tracking-tight">
              {content.guideTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/70">
              {content.guideSubtitle}
            </p>
          </div>

          <div className="grid gap-4">
            {content.guides.map(guide => (
              <article
                key={guide.title}
                className="rounded-2xl border border-[#d8cdbd] bg-white/75 p-6 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a735b]">
                  <span>{guide.tag}</span>
                  <span className="h-1 w-1 rounded-full bg-[#d8cdbd]" />
                  <span>{guide.readTime}</span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[#1f1b16]">
                  {guide.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#685f55]">
                  {guide.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}

function TestimonialCard({
  testimonial,
  index,
  personaLabel,
}: {
  testimonial: BlogContent["testimonials"][number];
  index: number;
  personaLabel: string;
}) {
  return (
    <article className="flex min-h-[30rem] flex-col rounded-[1.6rem] border border-[#d8cdbd] bg-white/80 p-5 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-xl">
      <div className={`relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br ${testimonial.palette} p-4`}>
        <GeneratedPortrait index={index} name={testimonial.name} personaLabel={personaLabel} />
        <div className="absolute left-4 top-4 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-[#5f4f3f] backdrop-blur">
          {testimonial.wedding}
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3">
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#f3eadc] text-[#8a735b]">
          <Quote className="h-4 w-4" />
        </div>
        <p className="text-sm leading-7 text-[#4f473f]">
          {testimonial.quote}
        </p>
      </div>

      <div className="mt-auto pt-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1f1b16]">
          <Heart className="h-4 w-4 text-[#a77541]" />
          {testimonial.outcome}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-[#eadfce] pt-4">
          <div>
            <p className="font-semibold text-[#1f1b16]">{testimonial.name}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-[#756a5c]">
              <MapPin className="h-3.5 w-3.5" />
              {testimonial.location}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[#a77541]">
            {Array.from({ length: 5 }).map((_, starIndex) => (
              <Star key={starIndex} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function GeneratedPortrait({
  index,
  name,
  personaLabel,
}: {
  index: number;
  name: string;
  personaLabel: string;
}) {
  const initials = name
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2);
  const hairStyles = [
    "left-1/2 top-[4.5rem] h-32 w-32 -translate-x-1/2 rounded-t-[4rem] rounded-b-[2rem] bg-[#2b211b]",
    "left-1/2 top-[4rem] h-36 w-36 -translate-x-1/2 rounded-[4rem] bg-[#3a2a21]",
    "left-1/2 top-[4.25rem] h-36 w-32 -translate-x-1/2 rounded-t-full rounded-b-[1.5rem] bg-[#211a16]",
    "left-1/2 top-[4rem] h-32 w-36 -translate-x-1/2 rounded-t-[4rem] rounded-b-[3rem] bg-[#4a3025]",
  ];

  return (
    <div className="relative h-56 overflow-hidden rounded-2xl bg-white/30">
      <div className="absolute inset-x-6 bottom-0 h-28 rounded-t-[4rem] bg-white/80" />
      <div className="absolute bottom-0 left-1/2 h-24 w-32 -translate-x-1/2 rounded-t-[3rem] bg-[#f8f0e6]" />
      <div className={`absolute ${hairStyles[index % hairStyles.length]}`} />
      <div className="absolute left-1/2 top-[5.5rem] h-24 w-20 -translate-x-1/2 rounded-[45%] bg-[#f1c7a8] shadow-inner" />
      <div className="absolute left-1/2 top-[8.2rem] h-5 w-10 -translate-x-1/2 rounded-b-full border-b-2 border-[#8a5945]" />
      <div className="absolute left-[calc(50%-1.35rem)] top-[7.25rem] h-2 w-2 rounded-full bg-[#2b211b]" />
      <div className="absolute left-[calc(50%+1rem)] top-[7.25rem] h-2 w-2 rounded-full bg-[#2b211b]" />
      <div className="absolute bottom-6 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border border-white/60 bg-white/80 text-lg font-semibold text-[#8a735b] shadow-sm">
        {initials}
      </div>
      <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-[#171412]/80 px-3 py-1 text-xs text-white">
        <Camera className="h-3.5 w-3.5" />
        {personaLabel}
      </div>
    </div>
  );
}
