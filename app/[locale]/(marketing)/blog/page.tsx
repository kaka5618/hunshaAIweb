import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
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
  proof: string[];
  heroCard: {
    label: string;
    title: string;
    body: string;
    meta: string;
  };
  testimonialTitle: string;
  testimonialSubtitle: string;
  testimonials: Array<{
    name: string;
    location: string;
    wedding: string;
    avatar: string;
    quote: string;
    outcome: string;
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
    proof: ["3 style directions", "AI try-on visuals", "Budget guardrails"],
    heroCard: {
      label: "Most saved story",
      title: "She stopped shopping by screenshot and started shopping by fit logic.",
      body: "The report turned a folder of mixed inspiration into three clear dress directions: one romantic, one clean, and one dramatic enough for the venue.",
      meta: "Garden venue · $1,800 budget · V-neck preference",
    },
    testimonialTitle: "What brides are saying",
    testimonialSubtitle:
      "Short notes from brides using the report to walk into appointments with a clearer budget, dress direction, and fitting language.",
    testimonials: [
      {
        name: "Maya Chen",
        location: "Chicago, IL",
        wedding: "Garden ceremony",
        avatar: "/bridal/testimonials/profile-01.jpg",
        quote:
          "I had a folder full of dresses and no filter. The report gave me a V-neck direction, a softer waist option, and words I could actually use at the salon.",
        outcome: "Booked two boutiques with a focused fitting list.",
      },
      {
        name: "Sofia Martinez",
        location: "Miami, FL",
        wedding: "Beach dinner wedding",
        avatar: "/bridal/testimonials/profile-02.jpg",
        quote:
          "It understood that beach did not mean casual. The fabric notes helped me avoid heavy lace, and I stopped saying yes to every pretty dress.",
        outcome: "Chose lightweight tulle and a cleaner neckline.",
      },
      {
        name: "Emma Reed",
        location: "London, UK",
        wedding: "Winter city venue",
        avatar: "/bridal/testimonials/profile-03.jpg",
        quote:
          "The useful part was not just the picture. It explained why one silhouette made sense for my venue, budget, and the kind of photos I wanted.",
        outcome: "Compared three silhouettes without panic scrolling.",
      },
      {
        name: "Clara Thompson",
        location: "Austin, TX",
        wedding: "Modern chapel",
        avatar: "/bridal/testimonials/profile-04.jpg",
        quote:
          "I used the exact wording in the report at the salon. It made me sound prepared and helped me say no to dresses that were pretty but wrong for the brief.",
        outcome: "Kept the appointment under budget.",
      },
      {
        name: "Nora Bennett",
        location: "Portland, OR",
        wedding: "Forest lodge",
        avatar: "/bridal/testimonials/profile-05.jpg",
        quote:
          "I wanted sleeves but was worried they would feel heavy. The report separated sleeve shape from fabric weight, which made the fitting conversation much easier.",
        outcome: "Asked for sheer sleeves instead of heavy coverage.",
      },
      {
        name: "Ava Collins",
        location: "New York, NY",
        wedding: "City hall and dinner",
        avatar: "/bridal/testimonials/profile-06.jpg",
        quote:
          "The best part was the shortlist. I stopped bouncing between ball gowns and slip dresses and finally had three looks that matched the actual day.",
        outcome: "Skipped styles that did not match the venue.",
      },
      {
        name: "Grace Walker",
        location: "Toronto, CA",
        wedding: "Art gallery reception",
        avatar: "/bridal/testimonials/profile-07.jpg",
        quote:
          "I showed the report to my maid of honor before shopping. It gave us the same vocabulary, so the appointment felt calmer and less opinion-heavy.",
        outcome: "Used one shared style brief with friends.",
      },
      {
        name: "Leah Brooks",
        location: "Seattle, WA",
        wedding: "Rainy spring garden",
        avatar: "/bridal/testimonials/profile-08.jpg",
        quote:
          "It caught that I wanted romantic, but not overly sweet. The notes on neckline and lace density helped me avoid dresses that swallowed my frame.",
        outcome: "Focused on lighter lace and a defined waist.",
      },
      {
        name: "Hannah Price",
        location: "Denver, CO",
        wedding: "Mountain ceremony",
        avatar: "/bridal/testimonials/profile-09.jpg",
        quote:
          "I was worried my budget would look limiting. The report made the budget feel like a design boundary instead of a problem.",
        outcome: "Tried structured gowns without upgrading the budget.",
      },
      {
        name: "Isabella Grant",
        location: "San Diego, CA",
        wedding: "Coastal terrace",
        avatar: "/bridal/testimonials/profile-10.jpg",
        quote:
          "I liked both strapless and V-neck. Seeing them split across different directions made it easier to test both without mixing every idea together.",
        outcome: "Compared two necklines in one appointment.",
      },
      {
        name: "Olivia Hart",
        location: "Boston, MA",
        wedding: "Historic library",
        avatar: "/bridal/testimonials/profile-11.jpg",
        quote:
          "The consultant script was surprisingly useful. I did not have to overexplain my screenshots, and the stylist pulled better dresses on the first round.",
        outcome: "Got stronger salon pulls in the first hour.",
      },
      {
        name: "Rachel Moore",
        location: "Atlanta, GA",
        wedding: "Ballroom evening",
        avatar: "/bridal/testimonials/profile-12.jpg",
        quote:
          "I wanted drama but not a costume. The report gave me one bold option and two safer ones, so I could compare without losing the mood.",
        outcome: "Balanced statement detail with practical movement.",
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
    proof: ["3 个风格方向", "AI 试穿视觉图", "预算边界建议"],
    heroCard: {
      label: "最常被收藏的故事",
      title: "她不再靠截图盲选婚纱，而是带着适合自己的判断去试纱。",
      body: "报告把混乱的灵感图整理成三个清楚方向：一个浪漫、一个干净、一个更适合正式场地。",
      meta: "花园婚礼 · $1,800 预算 · 偏好 V 领",
    },
    testimonialTitle: "用户留言",
    testimonialSubtitle:
      "更像真实试纱前后的短留言：用户关心的不是漂亮截图，而是能不能带着清楚预算、款式方向和沟通话术去婚纱店。",
    testimonials: [
      {
        name: "Maya Chen",
        location: "芝加哥",
        wedding: "花园仪式",
        avatar: "/bridal/testimonials/profile-01.jpg",
        quote:
          "我收藏了很多婚纱图，但完全没有筛选标准。报告给了我 V 领方向、柔和腰线选择，还有试纱时可以直接说的话。",
        outcome: "用清单预约了两家婚纱店。",
      },
      {
        name: "Sofia Martinez",
        location: "迈阿密",
        wedding: "海边晚宴婚礼",
        avatar: "/bridal/testimonials/profile-02.jpg",
        quote:
          "它理解海边不等于随便。面料建议让我避开厚重蕾丝，也让我不再对每一条漂亮裙子都点头。",
        outcome: "确定轻盈薄纱和干净领口。",
      },
      {
        name: "Emma Reed",
        location: "伦敦",
        wedding: "冬季城市场地",
        avatar: "/bridal/testimonials/profile-03.jpg",
        quote:
          "最有用的不是图片，而是它解释了为什么某个廓形适合我的场地、预算和想要的照片感觉。",
        outcome: "不再反复刷图，直接比较 3 个廓形。",
      },
      {
        name: "Clara Thompson",
        location: "奥斯汀",
        wedding: "现代教堂婚礼",
        avatar: "/bridal/testimonials/profile-04.jpg",
        quote:
          "我在婚纱店直接用了报告里的表达。听起来更有准备，也更容易拒绝那些漂亮但不符合需求的裙子。",
        outcome: "试纱过程没有超预算。",
      },
      {
        name: "Nora Bennett",
        location: "波特兰",
        wedding: "森林小屋婚礼",
        avatar: "/bridal/testimonials/profile-05.jpg",
        quote:
          "我想要袖子，又怕显得厚重。报告把袖型和面料重量分开讲，试纱时沟通起来简单很多。",
        outcome: "优先看透明袖，而不是厚重遮盖。",
      },
      {
        name: "Ava Collins",
        location: "纽约",
        wedding: "市政厅加晚宴",
        avatar: "/bridal/testimonials/profile-06.jpg",
        quote:
          "最有用的是它帮我缩小范围。我不再在大裙摆和吊带裙之间反复横跳，而是有了 3 个真正适合当天的方向。",
        outcome: "跳过了不适合场地的款式。",
      },
      {
        name: "Grace Walker",
        location: "多伦多",
        wedding: "艺术馆晚宴",
        avatar: "/bridal/testimonials/profile-07.jpg",
        quote:
          "我先把报告发给伴娘看。我们终于有同一套表达，试纱时没有那么多临时意见，节奏更稳。",
        outcome: "和朋友用同一份风格简报。",
      },
      {
        name: "Leah Brooks",
        location: "西雅图",
        wedding: "春季花园婚礼",
        avatar: "/bridal/testimonials/profile-08.jpg",
        quote:
          "它看出来我想要浪漫，但不要太甜。领口和蕾丝密度的建议，帮我避开了会压身形的裙子。",
        outcome: "重点看轻盈蕾丝和明确腰线。",
      },
      {
        name: "Hannah Price",
        location: "丹佛",
        wedding: "山地仪式",
        avatar: "/bridal/testimonials/profile-09.jpg",
        quote:
          "我一直担心预算太限制选择。报告把预算变成了设计边界，而不是问题本身。",
        outcome: "在不加预算的情况下试了结构感婚纱。",
      },
      {
        name: "Isabella Grant",
        location: "圣地亚哥",
        wedding: "海岸露台",
        avatar: "/bridal/testimonials/profile-10.jpg",
        quote:
          "我同时喜欢抹胸和 V 领。报告把它们放进不同方案里，我可以分别试，而不是把所有想法混在一起。",
        outcome: "一次预约里比较了两个领口。",
      },
      {
        name: "Olivia Hart",
        location: "波士顿",
        wedding: "历史图书馆",
        avatar: "/bridal/testimonials/profile-11.jpg",
        quote:
          "顾问话术真的有用。我不用解释一堆截图，造型师第一轮拿出来的裙子就更接近我的需求。",
        outcome: "第一小时就试到了更准的款式。",
      },
      {
        name: "Rachel Moore",
        location: "亚特兰大",
        wedding: "晚宴舞厅",
        avatar: "/bridal/testimonials/profile-12.jpg",
        quote:
          "我想要有气场，但不想像表演服。报告给了我一个大胆方案和两个更稳的方案，可以比较但不丢掉氛围。",
        outcome: "在亮点和行动方便之间找到平衡。",
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
              <h2 className="text-4xl font-semibold tracking-tight text-[#1f1b16] md:text-5xl">
                {content.testimonialTitle}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#685f55]">
              {content.testimonialSubtitle}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {content.testimonials.map(testimonial => (
                <TestimonialCard
                  key={testimonial.name}
                  testimonial={testimonial}
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
}: {
  testimonial: BlogContent["testimonials"][number];
}) {
  return (
    <article className="flex min-h-[25rem] flex-col rounded-[1.6rem] border border-[#d8cdbd] bg-white/85 p-6 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start gap-4">
        <Image
          src={testimonial.avatar}
          alt={`${testimonial.name} profile photo`}
          width={72}
          height={72}
          className="h-16 w-16 flex-none rounded-full object-cover ring-4 ring-[#f6eee3] shadow-sm"
        />
        <div className="min-w-0">
          <p className="font-semibold text-[#1f1b16]">{testimonial.name}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-[#756a5c]">
            <MapPin className="h-3.5 w-3.5" />
            {testimonial.location}
          </p>
          <div className="mt-3 inline-flex rounded-full bg-[#f3eadc] px-3 py-1 text-xs font-semibold text-[#7a654f]">
            {testimonial.wedding}
          </div>
        </div>
        <div className="ml-auto flex flex-none items-center gap-1 text-[#a77541]">
          {Array.from({ length: 5 }).map((_, starIndex) => (
            <Star key={starIndex} className="h-3.5 w-3.5 fill-current" />
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3">
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#f3eadc] text-[#8a735b]">
          <Quote className="h-4 w-4" />
        </div>
        <p className="text-sm leading-7 text-[#4f473f]">
          {testimonial.quote}
        </p>
      </div>

      <div className="mt-auto pt-6">
        <div className="flex items-start gap-2 border-t border-[#eadfce] pt-5 text-sm font-semibold text-[#1f1b16]">
          <Heart className="h-4 w-4 text-[#a77541]" />
          {testimonial.outcome}
        </div>
      </div>
    </article>
  );
}
