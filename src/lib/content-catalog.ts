export type ServiceFieldKind = "text" | "textarea" | "select" | "date" | "multiselect" | "file";

export type ServiceFieldDefinition = {
  id: string;
  label: string;
  kind: ServiceFieldKind;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: string[];
  accept?: string;
  showWhen?: {
    field: string;
    equals: string;
  };
};

export type ServiceDefinition = {
  key: string;
  name: string;
  description: string;
  whatYouGet: string;
  perfectFor: string;
  priceLabel: string;
  rateCents: number;
  turnaroundDays: number;
  rushHours: 24 | 48;
  orderIndex: number;
  isOrderable: boolean;
  fields: ServiceFieldDefinition[];
};

export const RUSH_RATE_CENTS = 2;
export const RANK_RATE_CENTS = 10;
export const FILE_ACCEPT = ".docx,.txt,.md,.mp3,.mp4,.wav";
export const FORTY_EIGHT_HOUR_RUSH_KEYS = [
  "technical-article",
  "thought-leadership",
  "interview",
] as const;

export function getRushLabel(serviceKey?: string | null) {
  const hours = FORTY_EIGHT_HOUR_RUSH_KEYS.includes(
    (serviceKey ?? "") as (typeof FORTY_EIGHT_HOUR_RUSH_KEYS)[number],
  )
    ? 48
    : 24;
  return `Rush +$0.02/pw (${hours}hr delivery)`;
}

export const supportedLanguages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Dutch",
  "Swedish",
  "Norwegian",
  "Danish",
  "Finnish",
  "Polish",
  "Czech",
  "Romanian",
  "Hungarian",
  "Greek",
  "Turkish",
  "Arabic",
  "Hebrew",
  "Hindi",
  "Bengali",
  "Urdu",
  "Punjabi",
  "Tamil",
  "Telugu",
  "Chinese (Simplified)",
  "Chinese (Traditional)",
  "Japanese",
  "Korean",
  "Indonesian",
  "Vietnamese",
] as const;

export const serviceTiers = [
  {
    value: "on-demand",
    label: "On-demand",
    detail: "Standard service pricing for one-off or managed briefs.",
  },
  {
    value: "rank",
    label: "Rank",
    detail: "Adds $0.10/word to the standard service rate for rank-focused delivery.",
  },
] as const;

export const serviceCatalog: ServiceDefinition[] = [
  {
    key: "seo-content",
    name: "SEO Content",
    description: "Publication-placed, keyword-optimised content written to earn links and rank.",
    whatYouGet:
      "Publication-placed, keyword-optimised content written to earn links and rank.",
    perfectFor:
      "Agencies building off-site link profiles and third-party placements.",
    priceLabel: "$0.05/word",
    rateCents: 5,
    turnaroundDays: 5,
    rushHours: 24,
    orderIndex: 1,
    isOrderable: true,
    fields: [
      {
        id: "article_topic_direction",
        label: "Article topic / direction",
        kind: "textarea",
        placeholder:
          "What should the article be about? Add the proposed topic, angle, or any key points you want covered.",
        hint: "A rough direction is enough — we’ll develop the final publication-fit angle.",
      },
      {
        id: "target_publication",
        label: "Target publication",
        kind: "text",
        required: true,
        placeholder:
          "e.g. TechRadar — https://www.techradar.com/ or: UK fintech publication, publication not yet confirmed",
        hint: "If the exact publication isn’t confirmed, tell us the type of publication you’re targeting.",
      },
      {
        id: "client_anchor_text",
        label: "Client anchor text",
        kind: "text",
        required: true,
        placeholder: "Paste the anchor text exactly as it should appear.",
        hint: "We’ll plan the article around a natural placement rather than inserting the anchor after writing.",
      },
      {
        id: "target_url",
        label: "Target URL",
        kind: "text",
        required: true,
        placeholder: "https://example.com/page",
        hint: "This is the page the client anchor should link to.",
      },
      {
        id: "anchor_flexibility",
        label: "Anchor flexibility",
        kind: "select",
        required: true,
        options: ["Exact only", "Close variant allowed", "Broad concept allowed"],
        hint: "Choose Exact only if the wording must appear exactly as supplied.",
      },
      {
        id: "link_or_source_restrictions",
        label: "Link or source restrictions",
        kind: "select",
        required: true,
        options: ["No additional restrictions", "Yes — I’ll specify below"],
        hint: "Only add requirements beyond our standard SEO Content linking and sourcing process.",
      },
      {
        id: "link_or_source_restrictions_detail",
        label: "Specify link or source restrictions",
        kind: "textarea",
        showWhen: {
          field: "link_or_source_restrictions",
          equals: "Yes — I’ll specify below",
        },
        placeholder:
          "e.g. competitors that must not be linked to, prohibited source types, no links in the opening paragraph, external-link restrictions, sensitive topics, or other placement requirements.",
      },
    ],
  },
  {
    key: "blog-post",
    name: "Blog Post",
    description: "Promise-led, audience-first posts that deliver real value and drive traffic.",
    whatYouGet:
      "Promise-led, audience-first posts that deliver real value and drive traffic.",
    perfectFor:
      "Brands and agencies publishing regularly to an owned channel.",
    priceLabel: "$0.05/word",
    rateCents: 5,
    turnaroundDays: 5,
    rushHours: 24,
    orderIndex: 2,
    isOrderable: true,
    fields: [
      {
        id: "blog_route",
        label: "Blog route",
        kind: "select",
        options: [
          "Not sure — you decide",
          "Brand blog, owned channel",
          "Guest post, external publication",
          "How-to or explainer",
          "Opinion or POV piece",
        ],
        hint: "Not sure? Leave it blank and we’ll pick the right format based on the brief.",
      },
      {
        id: "call_to_action_detail",
        label: "Call to action",
        kind: "text",
        placeholder: "e.g. Book a demo, Download the guide, Subscribe",
        hint: "Leave blank if you don’t want a CTA or want us to suggest one.",
      },
    ],
  },
  {
    key: "article",
    name: "Article",
    description: "Editorial-depth pieces for any channel, whether analytical, reported, or opinion-led.",
    whatYouGet:
      "Editorial-depth pieces — reported, analytical, or opinion-led — for any channel.",
    perfectFor:
      "Trade publications, industry platforms, and high-authority placements.",
    priceLabel: "$0.05/word",
    rateCents: 5,
    turnaroundDays: 6,
    rushHours: 24,
    orderIndex: 3,
    isOrderable: true,
    fields: [
      {
        id: "article_type",
        label: "Article type",
        kind: "select",
        options: [
          "Not sure — you decide",
          "Analytical explainer",
          "Reported feature",
          "Opinion or commentary",
          "Case-led industry piece",
          "Data-supported article",
          "Brand-adjacent editorial",
        ],
      },
      {
        id: "source_material",
        label: "Source material or research",
        kind: "textarea",
        placeholder:
          "Paste any facts, data, reports, case studies, or research you want included.",
        hint: "The more you share, the less we’ll need to clarify later.",
      },
      {
        id: "quotes_or_case_studies",
        label: "Quotes or case studies to include",
        kind: "textarea",
        placeholder:
          "Paste approved quotes, spokesperson name and title, or case study details.",
      },
    ],
  },
  {
    key: "technical-article",
    name: "Technical Article",
    description: "Accurate, claim-safe technical content written by specialists who know the field.",
    whatYouGet:
      "Accurate, claim-safe technical content written by specialists who know the field.",
    perfectFor:
      "SaaS, cybersecurity, finance, medical, and other regulated industries.",
    priceLabel: "$0.07/word",
    rateCents: 7,
    turnaroundDays: 7,
    rushHours: 48,
    orderIndex: 4,
    isOrderable: true,
    fields: [
      {
        id: "industry_or_field",
        label: "Industry or field",
        kind: "text",
        required: true,
        placeholder: "e.g. cybersecurity, SaaS, fintech, medical, legal",
        hint: "We’ll match you with a writer who already knows the terminology.",
      },
      {
        id: "technical_depth",
        label: "Technical depth required",
        kind: "select",
        options: [
          "Not sure",
          "Introductory — assumes no prior knowledge",
          "Intermediate — some familiarity assumed",
          "Advanced — written for practitioners",
        ],
      },
      {
        id: "claims_or_specs",
        label: "Claims or specifications to include",
        kind: "textarea",
        placeholder:
          "Paste any technical claims, product specs, regulatory details, or facts that must appear — with your source if possible.",
        hint:
          "Unsupported technical claims are a common blocker. The more you provide, the faster we can produce.",
      },
    ],
  },
  {
    key: "thought-leadership",
    name: "Expert Writing / Thought Leadership",
    description: "Thesis-led, evidence-backed content that positions real expertise — not just opinion.",
    whatYouGet:
      "Thesis-led, evidence-backed content that positions real expertise — not just opinion.",
    perfectFor:
      "Founders and executives building a credible public voice.",
    priceLabel: "$0.07/word",
    rateCents: 7,
    turnaroundDays: 7,
    rushHours: 48,
    orderIndex: 5,
    isOrderable: true,
    fields: [
      {
        id: "author_name_title",
        label: "Author name and title",
        kind: "text",
        required: true,
        placeholder: "e.g. Sarah Mitchell, Head of Product, Acme Inc.",
      },
      {
        id: "thesis",
        label: "Thesis or main argument",
        kind: "textarea",
        placeholder:
          "What’s the point of view? What should the reader think or do differently after reading?",
        hint:
          "Even a rough direction helps us build a credible argument rather than a generic opinion piece.",
      },
      {
        id: "voice_samples",
        label: "Author voice samples",
        kind: "textarea",
        placeholder:
          "Links to past articles, LinkedIn posts, interview transcripts — anything that shows how the author writes or speaks.",
      },
    ],
  },
  {
    key: "personal-pr",
    name: "Personal PR",
    description: "Reputation-safe, evidence-backed content that builds credibility for individuals.",
    whatYouGet:
      "Reputation-safe, evidence-backed content that builds credibility for individuals.",
    perfectFor:
      "Visa applications, award submissions, and media positioning.",
    priceLabel: "$0.05/word",
    rateCents: 5,
    turnaroundDays: 5,
    rushHours: 24,
    orderIndex: 6,
    isOrderable: true,
    fields: [
      {
        id: "pr_route",
        label: "Article route",
        kind: "select",
        required: true,
        options: [
          "Not sure — you decide",
          "Bylined expertise piece",
          "Founder or leader perspective",
          "Profile",
          "Career narrative",
          "High-stakes evidence article, such as visa, awards, or legal",
        ],
      },
      {
        id: "subject_details",
        label: "Subject name, title, and company",
        kind: "text",
        required: true,
        placeholder: "e.g. James Okafor, Chief Technology Officer, Finova",
      },
      {
        id: "credentials",
        label: "Key achievements and credentials",
        kind: "textarea",
        required: true,
        placeholder:
          "Paste a bio, CV highlights, awards, speaking engagements, publications, or anything that establishes credibility.",
        hint:
          "Exact dates, titles, and credentials matter here. The more accurate your source material, the safer and stronger the article.",
      },
      {
        id: "sensitivity_use_case",
        label: "Sensitivity or use case",
        kind: "text",
        placeholder: "e.g. talent visa application, award submission, media positioning",
        hint:
          "We treat high-stakes evidence pieces with stricter proof standards.",
      },
    ],
  },
  {
    key: "press-release",
    name: "Press Release",
    description: "Fact-locked, media-ready announcements written to get picked up and published.",
    whatYouGet:
      "Fact-locked, media-ready announcements written to get picked up and published.",
    perfectFor:
      "Launches, funding rounds, partnerships, and company news.",
    priceLabel: "$0.05/word",
    rateCents: 5,
    turnaroundDays: 4,
    rushHours: 24,
    orderIndex: 7,
    isOrderable: true,
    fields: [
      {
        id: "announcement",
        label: "The announcement — in one sentence",
        kind: "text",
        placeholder: "e.g. Acme Inc. raises $5M Series A to expand into EMEA",
        hint:
          "If you can’t state it in one sentence, the release may not be ready yet. Add what you have and we’ll flag what’s missing.",
      },
      {
        id: "release_type",
        label: "Release type",
        kind: "select",
        options: [
          "Not sure",
          "Hard news, such as launch, funding, hire, or partnership",
          "Data or report release",
          "Statement or sensitive announcement",
        ],
      },
      {
        id: "embargo_date",
        label: "Embargo date",
        kind: "date",
      },
      {
        id: "dateline_city",
        label: "Dateline city",
        kind: "text",
        placeholder: "e.g. London, New York",
      },
      {
        id: "spokesperson_quote",
        label: "Spokesperson quote",
        kind: "textarea",
        placeholder:
          "Paste an approved quote with speaker name and title, or leave blank and we’ll draft one for your approval.",
      },
      {
        id: "media_contact",
        label: "Media contact details",
        kind: "text",
        placeholder: "Name, email, phone — we’ll include this at the foot of the release.",
      },
    ],
  },
  {
    key: "interview",
    name: "Interview",
    description: "Quote-faithful, narrative-aware content built from real interviews and transcripts.",
    whatYouGet:
      "Quote-faithful, narrative-aware content built from real interviews and transcripts.",
    perfectFor:
      "Founder stories, customer voices, and expert perspectives.",
    priceLabel: "$0.05/word",
    rateCents: 5,
    turnaroundDays: 5,
    rushHours: 48,
    orderIndex: 8,
    isOrderable: true,
    fields: [
      {
        id: "interview_subject",
        label: "Interview subject",
        kind: "text",
        required: true,
        placeholder: "Name, title, and company of the person being interviewed.",
      },
      {
        id: "transcript_files",
        label: "Upload transcript or recording",
        kind: "file",
        accept: FILE_ACCEPT,
        hint: "This is the primary source material. Accepted files: .docx, .txt, .mp3, .mp4, .wav. Max 50MB per file.",
      },
      {
        id: "pasted_transcript",
        label: "Paste transcript",
        kind: "textarea",
        placeholder: "Paste the interview transcript here if you have it.",
      },
      {
        id: "interview_format",
        label: "Format",
        kind: "select",
        options: [
          "Not sure — you decide",
          "Q&A format",
          "Narrative feature built from the interview",
          "Founder story",
          "Customer voice or case study",
        ],
      },
    ],
  },
  {
    key: "editing",
    name: "Editing",
    description: "Diagnosis-first editing that sharpens structure, voice, and clarity — nothing lost.",
    whatYouGet:
      "Diagnosis-first editing that sharpens structure, voice, and clarity — nothing lost.",
    perfectFor:
      "Strong drafts that need a professional eye — including AI-assisted content.",
    priceLabel: "$0.05/word",
    rateCents: 5,
    turnaroundDays: 4,
    rushHours: 24,
    orderIndex: 9,
    isOrderable: true,
    fields: [
      {
        id: "draft_files",
        label: "Upload your draft",
        kind: "file",
        accept: ".docx,.txt,.md",
        hint: "Accepted files: .docx, .txt, .md. Max 50MB per file. Multiple files allowed.",
      },
      {
        id: "editing_type",
        label: "What kind of editing do you need?",
        kind: "multiselect",
        options: [
          "Structural edit — sequence, argument, and flow",
          "Copy edit — clarity, grammar, and style",
          "AI content edit — humanise and improve AI-generated draft",
          "Not sure — assess and recommend",
        ],
        hint: "Leave all unchecked and we’ll assess the draft and choose the right approach.",
      },
      {
        id: "preserve_notes",
        label: "What should be preserved?",
        kind: "text",
        placeholder:
          "e.g. keep the author’s voice, preserve all factual claims, don’t change the structure",
      },
    ],
  },
  {
    key: "rewriting",
    name: "Rewriting",
    description: "Controlled transformation — same intent, clearer structure, stronger execution.",
    whatYouGet:
      "Controlled transformation — same intent, clearer structure, stronger execution.",
    perfectFor:
      "Existing content that isn't performing or representing the brand it should.",
    priceLabel: "$0.05/word",
    rateCents: 5,
    turnaroundDays: 4,
    rushHours: 24,
    orderIndex: 10,
    isOrderable: true,
    fields: [
      {
        id: "existing_content_files",
        label: "Upload the existing content",
        kind: "file",
        accept: ".docx,.txt,.md",
        hint: "Accepted files: .docx, .txt, .md, or a URL in notes. Max 50MB per file.",
      },
      {
        id: "rewrite_reason",
        label: "Why does this need rewriting?",
        kind: "select",
        options: [
          "Not sure — explain below",
          "It’s not performing — needs a better angle or structure",
          "The brand voice or tone is wrong",
          "It’s outdated — needs to be refreshed",
          "It was AI-generated and needs humanising",
          "The brief changed after it was written",
        ],
      },
      {
        id: "must_stay_same",
        label: "What must stay the same?",
        kind: "text",
        placeholder:
          "e.g. keep the core message, preserve specific claims, maintain the same word count",
        hint:
          "Same intent, stronger execution — we’ll transform structure and voice without losing what’s working.",
      },
    ],
  },
  {
    key: "ai-content-rescue",
    name: "AI Content Rescue",
    description: "Human-rebuilt copy from your AI draft — coming soon.",
    whatYouGet:
      "Human-rebuilt copy from your AI draft — restructured, fact-checked, and rewritten to read as though a specialist wrote it from scratch.",
    perfectFor:
      "Agencies and teams sitting on AI-generated drafts that aren't publish-ready, on-brand, or safe to send to a client.",
    priceLabel: "$0.05/word",
    rateCents: 5,
    turnaroundDays: 5,
    rushHours: 24,
    orderIndex: 11,
    isOrderable: false,
    fields: [],
  },
  {
    key: "aeo-ai-search-content",
    name: "AEO/AI Search Content",
    description: "Answer-structured, citation-ready AI search content — coming soon.",
    whatYouGet:
      "Answer-structured, citation-ready content written to be surfaced and quoted by ChatGPT, Perplexity, Google AI Overviews, and other answer engines.",
    perfectFor:
      "Brands and agencies building visibility in AI-powered search — where the goal is being cited, not just ranked.",
    priceLabel: "$0.07/word",
    rateCents: 7,
    turnaroundDays: 7,
    rushHours: 24,
    orderIndex: 12,
    isOrderable: false,
    fields: [],
  },
  {
    key: "linkedin-post",
    name: "LinkedIn Post",
    description: "Scroll-stopping social content for founders and executives — coming soon.",
    whatYouGet:
      "Scroll-stopping posts written in your voice — built to grow reach and authority.",
    perfectFor:
      "Founders, executives, and personal brands publishing consistently on LinkedIn.",
    priceLabel: "$0.07/word",
    rateCents: 7,
    turnaroundDays: 3,
    rushHours: 24,
    orderIndex: 13,
    isOrderable: false,
    fields: [],
  },
  {
    key: "email-sequence",
    name: "Email Sequence",
    description: "Purposeful, conversion-focused email flows — coming soon.",
    whatYouGet:
      "Purposeful, conversion-focused emails that move readers from interest to action.",
    perfectFor:
      "Onboarding flows, nurture sequences, launches, and re-engagement campaigns.",
    priceLabel: "$100/per email",
    rateCents: 10000,
    turnaroundDays: 4,
    rushHours: 24,
    orderIndex: 14,
    isOrderable: false,
    fields: [],
  },
  {
    key: "case-study",
    name: "Case Study",
    description: "Proof-led customer stories and sales assets — coming soon.",
    whatYouGet:
      "Proof-led stories that turn client results into compelling sales assets.",
    perfectFor:
      "Sales teams, agencies, and brands that need to demonstrate real-world impact.",
    priceLabel: "$100/fixed",
    rateCents: 10000,
    turnaroundDays: 6,
    rushHours: 24,
    orderIndex: 15,
    isOrderable: false,
    fields: [],
  },
];

export const serviceCatalogByName = new Map(
  serviceCatalog.map((service) => [service.name.toLowerCase(), service]),
);

export const serviceCatalogByKey = new Map(
  serviceCatalog.map((service) => [service.key, service]),
);

export function getServiceByName(name: string | null | undefined) {
  return serviceCatalogByName.get((name ?? "").trim().toLowerCase()) ?? null;
}
