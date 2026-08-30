---
title: "광고 주문·결제 플랫폼과 기술 리딩"
kicker: "Commerce operations"
summary: "주문부터 서명, 입금·결제, 집행, 취소·환불까지 이어지는 운영 플랫폼을 만들고 FE 3명의 개발 기준과 일정 위험을 조율했습니다."
period: "2025.01—2025.06"
role: "FE 리드, 아키텍처와 공통 기반 설계, 주문·결제·취소 구현"
order: 2
stack: ["TypeScript", "React", "Next.js", "TanStack Query", "Jotai", "GitLab CI"]
impact:
  - "FE 3명의 기능 분담·코드 리뷰·개발 기준 수립"
  - "제휴점·주문·주문라인 3단 계층과 결제·취소 흐름 구현"
  - "인프라와 QA 일정 위험을 분리해 계획한 Phase 1 출시"
---

## 문제와 역할

영업 조직이 광고 상품을 판매한 뒤 계약 서명, 입금과 결제, 집행, 취소와 환불까지 처리하는 신규 플랫폼이 필요했습니다. 광고 상태와 결제 상태는 가능한 조합이 정해져 있었고 카드·가상계좌·잔여금은 처리 방식도 달랐습니다.

FE 3명 중 리드를 맡아 프로젝트 구조와 구현 기준을 정했습니다. 제휴점·주문·결제 처리·취소 화면을 직접 만들고, 공통 컴포넌트와 API 클라이언트, CI와 환경별 배포 흐름을 구성했습니다. 기능 단위로 역할을 나누고 코드 리뷰에서 폼, 서버 상태, 오류 처리의 기준을 맞췄습니다.

## 상태 조합을 데이터로 표현

광고 상태와 결제 상태가 서로를 제한하는 규칙을 양방향 룩업 테이블로 만들었습니다. UI는 규칙을 다시 해석하지 않고 선택 가능한 값만 계산합니다.

```ts
const allowedPaymentByAd = {
  pending: ['waiting', 'paid'],
  active: ['paid'],
  cancelled: ['cancelled', 'refunded'],
} as const;

export function isSelectable(adStatus: AdStatus, payment: PaymentStatus) {
  return allowedPaymentByAd[adStatus].includes(payment as never);
}
```

서버가 내려주는 액션 타입은 디스패처 한 곳에서 처리했습니다. 화면은 결제 수단별 이동 방식이나 외부 시스템 경로를 몰라도 됩니다.

```ts
const paymentActions: Record<PaymentAction, (order: Order) => Promise<void>> = {
  openCard: (order) => openCardWindow(order.redirectUrl),
  issueAccount: (order) => openAccountModal(order),
  useBalance: (order) => confirmBalance(order),
  openExternalCancel: (order) => routeToCancelSystem(order.id),
};

export const processPayment = (action: PaymentAction, order: Order) =>
  paymentActions[action](order);
```

## 공통 구조와 일정 조율

앱이 디자인 시스템을 직접 가져오지 않도록 공통 래핑 레이어를 두고 폼·테이블·필터·모달을 모았습니다. API 응답 인터셉터도 공통화해 인증과 업무 오류를 같은 방식으로 처리했습니다. 제휴점, 주문, 주문라인의 3단 계층은 rowSpan 계산을 별도 변환 함수로 분리했고 일괄 요청 중 일부만 실패하면 실패 대상만 다시 확인할 수 있게 했습니다.

인프라 발급과 QA 일정이 한꺼번에 밀릴 가능성이 보여 개발·스테이지 환경을 먼저 준비하고 상용 환경은 출시 일정에 맞춰 분리했습니다. Phase 1을 계획한 일정에 출시했고 공통 구조와 개발 패턴을 후속 담당자에게 넘겼습니다. 리드 역할에서 중요한 일은 제 코드를 많이 만드는 것이 아니라, 세 명이 같은 방식으로 판단하고 위험을 일찍 드러내도록 만드는 일이었습니다.

<p class="disclosure">실무에서 사용한 구현 기법을 바탕으로 회사·서비스·도메인 식별 정보를 제거하고 다시 작성한 예시입니다. 운영 소스 원문이 아닙니다.</p>
