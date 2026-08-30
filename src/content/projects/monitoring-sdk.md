---
title: "브라우저 모니터링 SDK"
kicker: "Observability experiment"
summary: "외부 APM 없이 데이터를 직접 보관하는 조건에서 수집·보안·검증 구조를 만들고, 운영 데이터가 가설을 지지하지 않자 수집을 중단했습니다."
period: "2026.04—2026.06"
role: "SDK·수집 API·테스트·운영 감사 도구 설계와 구현"
order: 6
stack: ["TypeScript", "Jest", "Playwright", "rrweb", "Next.js API", "Web Vitals"]
impact:
  - "에러·네트워크·성능·세션·breadcrumb·replay 수집기 구현"
  - "11개 파일 137개 테스트와 5개 E2E 시나리오"
  - "4일 실측에서 대상 0건을 확인하고 가설 기각·수집 비활성화"
---

## 제약에서 시작한 실험

상용 APM을 쓰지 않고 데이터는 내부에 보관해야 했습니다. 브라우저 오류만 모으면 재현 단서가 부족하므로 네트워크, Web Vitals, 세션, 사용자 행동과 DOM replay까지 함께 봐야 했습니다. 한편 입력값이나 응답 body가 개인정보를 포함할 위험도 컸습니다.

## 수집기의 생명주기를 통일

각 채널은 설치와 해제를 같은 계약으로 구현했습니다. 페이지 이동과 재초기화 때 monkey patch와 이벤트 리스너가 중복되지 않게 만들고, SDK 본체는 어떤 수집기인지 몰라도 정리할 수 있습니다.

```ts
type Collector = { install(): () => void };

export function startMonitoring(collectors: Collector[]) {
  const teardowns = collectors.map((collector) => collector.install());
  return () => teardowns.reverse().forEach((teardown) => teardown());
}
```

에러는 30초 동안 같은 지문을 묶고 occurrence만 갱신했습니다. replay는 상시 기록하되 오류가 생겼을 때 최근 윈도우만 보냈습니다. 부분 스트림을 잘라 보내면 재생이 깨져, payload 상한을 넘긴 윈도우는 통째로 버리는 방식으로 바꿨습니다.

## 수집보다 먼저 둔 보안 경계

body 캡처는 기본 허용에서 allowlist opt-in으로 뒤집었습니다. 클라이언트가 허용한 경로라도 서버가 한 번 더 확인하고 민감한 키와 입력 요소는 마스킹했습니다.

```ts
const allowedBodies = new Set(['/catalog/search', '/orders/summary']);

export function captureBody(path: string, body: unknown) {
  if (!allowedBodies.has(path)) return undefined;
  return redact(body, ['password', 'token', 'phone', 'email']);
}
```

수집 패키지에는 11개 파일 137개 테스트를 두고 실제 브라우저에서 5개 smoke 시나리오를 돌렸습니다. 수집 데이터의 비율과 attribution 누락도 반복해서 감사했습니다. 외부 네트워크가 전체 이벤트의 83%를 차지한다는 사실을 찾아 같은 출처 판정 함수로 전면 제외했습니다.

## 중단도 결과다

hydration 이전 오류를 별도로 잡으면 의미 있는 데이터가 나올 것이라는 가설을 세우고 철수 조건을 먼저 적었습니다. 4일간 운영 데이터를 확인했지만 대상은 0건이었습니다. 가설을 기각하고 두 달간의 실험도 종료해 수집 스위치를 내렸습니다. 구현을 유지하는 것보다 운영 근거에 따라 멈추는 편이 맞았습니다.

<p class="disclosure">실무에서 사용한 구현 기법을 바탕으로 회사·서비스·도메인 식별 정보를 제거하고 다시 작성한 예시입니다. 운영 소스 원문이 아닙니다.</p>
