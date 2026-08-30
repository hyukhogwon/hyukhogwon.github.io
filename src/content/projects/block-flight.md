---
title: "해외여행 항공블럭관리"
kicker: "Operations platform"
summary: "항공블럭 계약과 출발일별 좌석·마감·요금을 관리하는 플랫폼을 레포 설정부터 33회 릴리스까지 단독으로 운영했습니다."
period: "2026.03—2026.08"
role: "프론트엔드 단독 담당, 레포·CI·배포·기능 개발과 운영"
order: 5
stack: ["TypeScript", "React", "webpack", "TanStack Query", "Jotai", "xlsx"]
impact:
  - "13개 조회 조건을 draft/submitted 모델로 분리"
  - "PATCH 없는 API 위에서 미변경·지정·초기화 3상태 구현"
  - "독립 레포 구성 후 v0.2.0부터 v0.34.0까지 33회 릴리스"
---

## 문제와 역할

항공사와 확보한 좌석 블럭 계약, 출발일별 좌석과 마감, 24개 요금 항목을 함께 관리해야 했습니다. 조회 조건이 13개라 입력할 때마다 서버 요청이 바뀌면 사용자가 어떤 조건으로 결과를 보고 있는지 알기 어려웠습니다. 수정 API는 PUT만 제공해 빈 값이 미변경인지 초기화인지 구분해야 했습니다.

프론트엔드를 단독으로 맡아 레포 설정과 기능 개발, CI, 배포를 운영했습니다. 모노레포에서 독립 레포로 분리한 뒤 환경별 webpack 설정도 구성했습니다.

## 입력 상태와 서버 조건을 분리

화면 입력은 `draft`, 마지막으로 조회한 값은 `submitted`에 뒀습니다. 입력 중에는 목록 쿼리가 움직이지 않고 조회 버튼을 눌렀을 때만 서버 조건을 교체합니다.

```ts
type SearchState = { draft: Filters; submitted: Filters };

const submit = (state: SearchState): SearchState => ({
  draft: state.draft,
  submitted: normalizeFilters(state.draft),
});
```

PUT payload는 원본과 폼 값을 비교해 diff만 구성했습니다. 필드를 건드리지 않은 상태, 값을 지정한 상태, 기존 값을 비우려는 상태를 구분하는 표현을 따로 뒀습니다.

```ts
const UNCHANGED = Symbol('unchanged');

function diffField<T>(before: T | null, after: T | null) {
  if (Object.is(before, after)) return UNCHANGED;
  return after === null ? { clear: true } : { value: after };
}

export function buildUpdate(before: Contract, after: Contract) {
  return omitUnchanged(mapFields(after, (value, key) => diffField(before[key], value)));
}
```

## 제약 안에서 운영 가능한 구조

엑셀 날짜는 문자열, 일련번호, 지역화 표기 등 네 형태로 들어왔습니다. 먼저 하나의 날짜 타입으로 정규화한 뒤 기존 데이터의 24개 요금과 비교하고 사용자가 선택한 항목만 반영했습니다.

수정할 수 없는 공용 UI에서 숫자 입력과 sticky header 결함도 발견했습니다. 공용 코드를 복제하지 않고 앱 경계에 작은 우회 컴포넌트를 뒀으며, 왜 필요한지와 제거 조건을 함께 기록했습니다. 임시 해법이 이름 없는 영구 사양이 되지 않게 한 조치였습니다.

v0.2.0부터 v0.34.0까지 33회 릴리스를 운영했습니다. 단독 개발에서 속도를 유지한 힘은 많은 추상화가 아니라 상태 경계와 배포 절차를 작게 명시한 데 있었습니다.

<p class="disclosure">실무에서 사용한 구현 기법을 바탕으로 회사·서비스·도메인 식별 정보를 제거하고 다시 작성한 예시입니다. 운영 소스 원문이 아닙니다.</p>
