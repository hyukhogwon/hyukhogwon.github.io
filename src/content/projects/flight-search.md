---
title: "항공 검색 모듈과 공용 라이브러리"
kicker: "Search platform"
summary: "편도·왕복·다구간과 국내선·국제선의 규칙을 모델링하고, 네 개 여행 도메인이 함께 쓰는 검색 모듈로 분리했습니다."
period: "2026.02—2026.06"
role: "항공 검색 모듈 전체 설계·구현, 공용 패키지 배포와 소비 서비스 연동"
order: 1
stack: ["TypeScript", "React", "Next.js", "Zustand", "Vitest", "Turborepo"]
impact:
  - "PC·모바일 웹과 App WebView에 편도·왕복·다구간 검색 제공"
  - "검색 패키지 공개 API를 5개 subpath로 정리하고 배포 체계 운영"
  - "공지 배너 CLS를 PC 0.197→0.083, 모바일 0.331→0.137로 개선"
---

## 문제와 역할

항공 검색은 여정 유형과 노선 유형의 조합마다 입력 규칙과 결과 페이지 규격이 달랐습니다. 다구간 일정은 앞 구간을 바꾸면 뒤 구간 날짜도 함께 조정해야 했고, 적용하기 전에 전역 검색 조건이 바뀌면 기존 결과 화면까지 흔들렸습니다. 검색 셸은 항공뿐 아니라 세 개 여행 도메인까지 직접 참조하고 있었습니다.

검색 조건 입력과 검증, 결과 URL 생성과 이동까지 항공 검색 모듈 전체를 담당했습니다. 항공 기능을 만드는 동시에 네 개 도메인이 함께 쓰는 검색 셸의 의존 관계를 정리하고 라이브러리 빌드와 배포 순서도 운영했습니다.

## 입력과 확정 상태를 분리

일정 모달 안에서는 `draft`만 바꾸고 적용할 때 `commit`했습니다. 앞 구간 날짜가 바뀌면 이후 구간은 최소 날짜 규칙에 맞춰 순서대로 보정합니다. 취소하면 전역 조건은 그대로 남습니다.

```ts
type Segment = { from: string; to: string; date: string };

export function moveSegment(draft: Segment[], index: number, nextDate: string) {
  return draft.map((segment, cursor) => {
    if (cursor < index) return segment;
    const minimum = cursor === index ? nextDate : draft[cursor - 1].date;
    return { ...segment, date: maxDate(segment.date, minimum) };
  });
}

const applySchedule = () => searchStore.commit(scheduleDraft);
const closeWithoutApply = () => searchStore.restore(snapshot);
```

필수값 검사와 도메인 규칙도 나눴습니다. 국내선 다구간 금지, 왕복 구간 수, 국제선 좌석 단일 선택 같은 규칙을 URL 생성 전에 고정했고 국내선과 국제선 Query Builder는 서로의 예외를 알지 못합니다.

## 셸과 도메인의 경계

검색 셸이 각 도메인의 store와 UI를 직접 가져오던 구조를 슬롯과 typed event bus로 바꿨습니다. 도메인은 필요한 UI 묶음을 등록하고 셸은 공개된 계약만 조립합니다.

```ts
type SearchEvents = {
  navigate: { domain: 'stay' | 'package' | 'flight' };
  'panel:open': { source: 'home' | 'header' };
  'search:success': { destination: string };
};

class SearchEventBus {
  emit<K extends keyof SearchEvents>(type: K, payload: SearchEvents[K]) {
    this.listeners[type]?.forEach((listener) => listener(payload));
  }
}
```

공개 API는 도메인·기능별 5개 subpath로 제한했습니다. 소비 서비스가 내부 파일 경로를 참조하지 않게 만들고, 패키지 배포 뒤 소비 서비스의 버전 승격까지 같은 흐름으로 관리했습니다.

## 결과와 되돌린 결정

검색 모듈은 PC·모바일 웹과 App WebView에 배포했고 인수인계까지 마쳤습니다. 공지 배너는 서버 prefetch와 hydration 구조를 바꾼 뒤 CLS가 PC 0.197에서 0.083, 모바일 0.331에서 0.137로 낮아졌습니다.

한 번은 검색 요약 바 전체를 새 구조로 교체했다가 하루 만에 5개 커밋을 되돌렸습니다. 전면 교체보다 기존 구조에 스냅샷·복원 동작만 넣는 편이 위험과 이행 비용이 낮았습니다. 새 구조를 유지하는 것보다 문제를 더 작게 푸는 판단이 중요했습니다.

<p class="disclosure">실무에서 사용한 구현 기법을 바탕으로 회사·서비스·도메인 식별 정보를 제거하고 다시 작성한 예시입니다. 운영 소스 원문이 아닙니다.</p>
