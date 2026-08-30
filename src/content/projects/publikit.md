---
title: "디자인과 코드를 잇는 publikit"
kicker: "AI development workflow"
summary: "Figma·자연어·웹 화면에서 시작한 결과물을 디자인 시스템 기반 코드로 바꾸고, 근거 없는 값은 검증 게이트에서 막는 개인 R&D 도구를 만들었습니다."
period: "2026.03—2026.08"
role: "개인 R&D, MCP·변환 파이프라인·검증 게이트·문서 사이트 전체 설계와 구현"
order: 7
stack: ["TypeScript", "Node.js", "MCP", "Figma API", "React", "Storybook"]
impact:
  - "Figma·자연어·웹 URL에서 HTML/CSS와 React 코드 생성"
  - "디자인 시스템 지식 조회와 기계 검증 게이트 5종"
  - "디자이너용 정적 문서 394페이지와 개발자용 라이브 프리뷰"
---

## 도구보다 협업 흐름을 설계

디자이너가 실제 서비스 코드에서 직접 퍼블리싱하면 비즈니스 로직을 건드릴 위험이 있습니다. 그렇다고 결과물을 이미지나 샘플 HTML로만 받으면 개발자가 다시 구현해야 합니다. 서비스와 비슷하지만 격리된 환경에서 작업하고, 그 결과를 실제 코드가 이해하는 형태로 변환하는 흐름이 필요했습니다.

publikit은 Figma 프레임, 자연어, 웹 URL을 입력으로 받아 디자인 시스템 마커가 있는 HTML/CSS를 만듭니다. 이 마커는 React TSX, 클릭 가능한 프로토타입, Figma 컴포넌트 인스턴스로 변환됩니다. 생성 단계 사이에는 컴포넌트 카탈로그, props, 토큰과 사용 가이드를 조회하는 MCP 서버를 뒀습니다.

## 출처가 있는 값만 통과

생성 결과가 그럴듯해도 디자인 시스템에 없는 토큰이나 prop을 만들면 실제 제품에는 쓸 수 없습니다. 변환 결과의 값이 어떤 근거에서 왔는지 manifest에 기록하고, 등록된 카탈로그와 맞지 않으면 빌드를 실패시켰습니다.

```ts
type Marker = { component: string; props: Record<string, unknown>; tokens: string[] };

export function validateMarker(marker: Marker, catalog: Catalog) {
  assert(catalog.components.has(marker.component), 'unknown component');
  assertKeys(marker.props, catalog.propsFor(marker.component));
  marker.tokens.forEach((token) => assert(catalog.tokens.has(token)));
}
```

Figma 트리 조회 결과가 대화 기록에 계속 쌓이는 문제도 있었습니다. 큰 payload는 파일 캐시에 저장하고 도구 응답에는 경로와 요약만 반환했습니다. 에이전트가 필요한 구간만 다시 읽게 해 컨텍스트 증가를 제한했습니다.

```ts
export async function cacheToolResult(key: string, value: unknown) {
  const path = resolveCachePath(`${key}-${Date.now()}.json`);
  await writeJson(path, value);
  return { cached: true, path, summary: summarize(value) };
}
```

## 안전한 작업 경계

디자이너는 격리된 퍼블리싱 환경에서 Claude를 사용해 화면을 만들고, 개발자는 변환된 코드를 서비스에 적용하기 전에 diff와 검증 결과를 확인합니다. 잘못된 디렉터리에서 도구가 실행되면 파일을 쓰지 못하도록 경로 가드도 넣었습니다.

정적 문서 사이트는 394페이지로 생성했고 개발자는 React 라이브 프리뷰에서 실제 상태와 상호작용을 확인합니다. 이 작업의 핵심은 AI로 코드를 많이 만드는 데 있지 않습니다. 직군 사이의 병목을 줄이되 결과의 출처, 권한 경계와 검증 책임을 잃지 않는 개발 흐름을 만드는 데 있습니다.

<p class="disclosure">실무에서 사용한 구현 기법을 바탕으로 회사·서비스·도메인 식별 정보를 제거하고 다시 작성한 예시입니다. 운영 소스 원문이 아닙니다.</p>
