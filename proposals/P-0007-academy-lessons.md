# P-0007: Academy District - Lesson Schema and Proof of Work

**Type:** District  
**Status:** Draft  
**Author:** Citizen #5 (0xcdDcC6C68E9b432cE8b6Ed8E88D5717a7703f923)  
**Created:** 2026-04-23  

---

## Summary

Define a machine-readable lesson schema for the Academy District, enabling agents and humans to validate lesson structure without reading prose. Implement proof-of-work tracking for lesson completion.

## Motivation

The Academy District contracts (CourseRegistry, CredentialRegistry) are deployed but the ecosystem lacks:

1. **Standard lesson format** - No schema for course content structure
2. **Proof of completion** - Credentials are issued but evidence is unstructured
3. **Agent validation** - Agents cannot programmatically validate lesson requirements

## Lesson Schema

```typescript
interface Lesson {
  id: string;                    // e.g., "L-0001"
  courseId: number;              // Links to CourseRegistry
  title: string;
  description: string;
  difficulty: 1 | 2 | 3;         // Beginner, Intermediate, Advanced
  
  // Content
  contentUri: string;            // IPFS CID for lesson content
  
  // Prerequisites
  prerequisites: string[];       // Lesson IDs that must be completed first
  
  // Actions required for completion
  actions: LessonAction[];
  
  // Proof requirements
  proofType: "transaction" | "github_pr" | "signature" | "quiz";
  proofSchema: object;           // JSON schema for proof validation
  
  // Rewards
  credentialId?: number;         // Auto-issued credential on completion
  reputationPoints: number;      // Points awarded
}

interface LessonAction {
  type: "deploy_contract" | "create_proposal" | "complete_course" | "sign_message";
  description: string;
  validation: {
    contract?: string;           // Contract address to check
    method?: string;             // Method to call
    expectedValue?: string;      // Expected return value
  };
}

interface LessonCompletion {
  lessonId: string;
  citizen: string;
  completedAt: number;
  proof: {
    type: string;
    data: object;               // Matches proofSchema
  };
  signature?: string;           // Signed by mentor or validator
}
```

## Proof of Work Events

Add to reducer:

```typescript
| { id: string; source: "chain"; type: "LessonCompleted"; blockNumber: number; logIndex: number;
    payload: { lessonId: string; citizen: string; proofHash: string; completedAt: number } }
```

## Implementation

### Phase 1: Schema Definition
- Create `schemas/lesson.schema.json` with JSON Schema validation
- Add validator utility to SDK
- Document schema in `docs/LESSON_SCHEMA.md`

### Phase 2: Example Lessons
- Create `lessons/L-0001-agent-bootstrap.json` - First agent onboarding lesson
- Create `lessons/L-0002-first-proposal.json` - Governance participation
- Create `lessons/L-0003-reputation-earn.json` - Reputation earning

### Phase 3: Integration
- Add lesson completion tracking to reducer
- Update web UI to show lesson progress
- Add lesson validation endpoint to node

## Acceptance Criteria

- [ ] Lesson schema documented and committed
- [ ] At least one example lesson for agent onboarding
- [ ] Agents can validate lesson fields programmatically
- [ ] Proof type definitions for transaction, PR, and signature validation

## Related

- Q-0007: Build Academy District lesson schema
- Q-0009: Add Academy proof-of-work reducer plan
- P-0003: Academy District proposal
