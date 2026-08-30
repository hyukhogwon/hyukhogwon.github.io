---
title: "파트너 판매 일괄 등록"
kicker: "High-density form"
summary: "재고·요금과 일괄·개별 입력의 4개 저장 경로를 행렬로 정리하고, 오류 우선순위와 부분 재시도를 갖춘 고밀도 폼을 만들었습니다."
period: "2026.07—2026.08"
role: "화면과 상태 모델, 저장·검증 로직, 테스트 설계와 운영 배포"
order: 4
stack: ["TypeScript", "React", "Next.js", "React Hook Form", "Jest", "RTL"]
impact:
  - "4개 저장 분기를 payload 행렬로 명시"
  - "최대 100건 청크 병렬 전송과 실패 청크 재시도"
  - "27 suites·262 tests로 폼·날짜·이탈·저장 경계 검증"
---

## 문제와 역할

여러 상품의 재고와 요금을 한 화면에서 설정해야 했습니다. 재고·요금 탭과 일괄·개별 입력을 조합하면 저장 API가 네 갈래로 나뉩니다. 상품마다 허용 요금 범위가 다르고 기간은 최대 1년이어서 한 번의 입력이 여러 오류를 동시에 만들기도 했습니다. 화면과 상태 모델, 저장·검증 로직과 테스트를 담당해 운영에 배포했습니다.

## 저장 경로를 행렬로 고정

조건문을 화면 이벤트 안에 늘어놓지 않고 작업 종류와 입력 방식을 키로 삼은 payload builder를 만들었습니다. 새 분기를 추가할 때 빠뜨린 조합이 있으면 타입과 테스트가 알려줍니다.

```ts
const builders = {
  inventory: { bulk: buildBulkInventory, individual: buildItemInventory },
  price: { bulk: buildBulkPrice, individual: buildItemPrice },
} satisfies Record<JobType, Record<InputMode, PayloadBuilder>>;

export function buildPayload(state: FormState) {
  return builders[state.jobType][state.inputMode](state);
}
```

전송 대상은 최대 100건씩 나눠 병렬로 보냈습니다. 성공한 청크를 다시 보내지 않도록 실패 단위만 결과에 남겼고 사용자는 실패한 묶음만 재시도할 수 있습니다.

```ts
export async function saveInChunks(items: Item[], size = 100) {
  const chunks = chunk(items, size);
  const results = await Promise.allSettled(chunks.map(saveItems));
  return results.flatMap((result, index) =>
    result.status === 'rejected' ? [{ index, items: chunks[index] }] : [],
  );
}
```

## 사용자가 고칠 순서까지 설계

재고 범위, 요금 범위, 상품별 허용 요금의 교집합, 과거 날짜와 최대 기간을 각각 검사했습니다. 오류를 발견한 순서대로 보여주면 코드 실행 순서가 UX가 됩니다. 오류 종류에 명시적인 우선순위를 두고 가장 먼저 해결해야 할 메시지를 선택했습니다.

정책서, 디자인, QA 테스트 케이스에서 같은 규칙을 다르게 표현한 지점은 표로 대조했습니다. 폼 dirty 조합, 탭 전환, payload, 100건 경계, 날짜 제약과 이탈 경고를 테스트로 고정했습니다. 마지막 확인 기준 27 suites·262 tests가 통과한 상태로 운영 배포했습니다.

<p class="disclosure">실무에서 사용한 구현 기법을 바탕으로 회사·서비스·도메인 식별 정보를 제거하고 다시 작성한 예시입니다. 운영 소스 원문이 아닙니다.</p>
