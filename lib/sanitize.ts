import sanitizeHtml from "sanitize-html";

// TipTap/리치에디터가 생성하는 태그만 허용하는 서버사이드 allowlist.
// content_html은 작성/수정 시 한 번, 렌더 시 한 번 더(레거시 행 방어) 통과시킨다.
const ALLOWED_TAGS = [
  "p",
  "br",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "ul",
  "ol",
  "li",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "code",
  "pre",
  "a",
  "img",
  "figure",
  "figcaption",
  "span"
];

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    span: ["class"],
    code: ["class"],
    pre: ["class"]
  },
  // http/https/mailto/tel + 같은 도메인 상대경로(/media/...)만 허용 → javascript:, data: 스크립트 차단
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: {
    // 이미지에 한해 data:image 인라인 허용(에디터 붙여넣기 대비). 스크립트성 data:는 위 allowedSchemes에서 막힘
    img: ["http", "https", "data"]
  },
  allowProtocolRelative: false,
  // style 속성 전면 차단(postcss 경로 회피 + CSS 기반 우회 차단)
  allowedStyles: {},
  // 외부 링크에는 안전 rel 자동 부여(탭내빙 방지 + referrer 누수 방지)
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow" }, true)
  },
  disallowedTagsMode: "discard"
};

export function sanitizeContentHtml(input: string): string {
  if (!input) return "";
  return sanitizeHtml(input, OPTIONS);
}
