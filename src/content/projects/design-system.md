---
title: "프레임워크 중립 디자인 시스템"
kicker: "Design infrastructure"
summary: "React에 묶여 있던 UI 규칙을 Core·Styles·Binding으로 나눠 React와 Vue가 같은 동작과 토큰을 공유하게 했습니다."
period: "2025.02—2026.08"
role: "아키텍처 재설계, Core·React 컴포넌트 구현, Vue 서비스 확산"
order: 3
stack: ["TypeScript", "React", "Vue 3", "SCSS", "Storybook", "Vitest"]
impact:
  - "UI 규칙을 프레임워크 밖 순수 Core로 분리"
  - "Vue 서비스에 SVG 아이콘 123개와 주요 UI 컴포넌트 적용"
  - "Storybook·배포·Figma Code Connect 문서 흐름 구성"
---

## 문제와 구조

기존 디자인 시스템은 React와 CSS-in-JS 구현에 동작 규칙이 섞여 있었습니다. Vue 3 서비스에서 같은 디자인을 쓰려면 컴포넌트를 복사하거나 규칙을 다시 구현해야 했습니다. 프레임워크가 달라져도 접근성, 상태 표현, 스타일 계약은 같아야 했습니다.

Core는 props를 class와 `data-*` 속성으로 바꾸는 순수 함수만 가집니다. Styles는 그 계약을 해석하는 SCSS, Binding은 렌더링과 이벤트 전달만 맡습니다. Core 테스트를 통과하면 React와 Vue 구현이 같은 상태 규칙을 쓴다는 전제를 세울 수 있습니다.

```ts
type TabState = { active?: boolean; disabled?: boolean; size?: 'sm' | 'md' };

export function tabProps(state: TabState) {
  return {
    className: ['ds-tab', state.size && `ds-tab--${state.size}`]
      .filter(Boolean)
      .join(' '),
    'data-active': state.active ? '' : undefined,
    'data-disabled': state.disabled ? '' : undefined,
  };
}
```

Tab의 키보드 탐색도 DOM 프레임워크에서 떼어냈습니다. 현재 위치에서 방향키로 다음 항목을 찾되 비활성 항목은 건너뛰고 양 끝은 순환합니다.

```ts
export function nextEnabledIndex(items: Array<{ disabled: boolean }>, current: number, direction: 1 | -1) {
  for (let offset = 1; offset <= items.length; offset += 1) {
    const index = (current + offset * direction + items.length) % items.length;
    if (!items[index].disabled) return index;
  }
  return current;
}
```

## 제품 요구를 견디는 API

디자인 variant를 enum으로 전부 고정하면 실제 제품에서 작은 요구가 생길 때마다 시스템을 우회하게 됩니다. 상태와 크기처럼 규칙이 명확한 값은 타입으로 닫고 콘텐츠와 액션 영역은 슬롯으로 열었습니다. Tab, Notice, 검색 필드, Pagination, Spinner, EmptyState 등을 이 기준으로 구현했습니다.

Vue 서비스에는 색상·타이포·간격 토큰과 SVG 아이콘 123개, 폼·모달·테이블·날짜 선택 컴포넌트를 적용했습니다. 빌드 환경에서 사설 패키지를 받을 수 없어 토큰을 로컬로 동기화하고 생성물을 커밋했습니다. 이상적인 배포 방식보다 실제 제약 안에서 재현 가능한 흐름을 우선했습니다.

React와 Vue가 같은 상태 규칙과 스타일 계약을 공유하게 됐고, Storybook과 Figma Code Connect로 디자인 문서와 코드의 거리도 줄였습니다. 프레임워크 중립성은 모든 코드를 추상화하는 일이 아니라 오래 유지할 규칙만 적절한 경계 밖으로 옮기는 일이었습니다.

<p class="disclosure">실무에서 사용한 구현 기법을 바탕으로 회사·서비스·도메인 식별 정보를 제거하고 다시 작성한 예시입니다. 운영 소스 원문이 아닙니다.</p>
