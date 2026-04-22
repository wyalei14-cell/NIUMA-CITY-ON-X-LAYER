# Academy District Proof-of-Work Reducer Plan

## Overview

This document outlines the design for recording and verifying lesson completion proofs in NIUMA CITY's Academy District. The goal is to create a deterministic, replayable system that connects GitHub contributions to on-chain credentials.

## Current State

The reducer already supports basic Academy events:
- `CourseProposed` / `CourseActivated` / `CourseDeprecated`
- `CredentialIssued`
- `CourseCompleted`

## Missing Components

### 1. GitHub Proof Events

New event types for GitHub-based proofs:

```typescript
type GitHubProofEvent =
  | { id: string; source: "github"; type: "LessonProofSubmitted"; payload: { 
      lessonId: string;
      citizen: string;
      proofType: "pr_merge" | "issue_close" | "commit";
      proofReference: string; // PR number, issue number, or commit hash
      evidenceUrl: string;
      submittedAt: number;
    }}
  | { id: string; source: "github"; type: "LessonProofVerified"; payload: {
      lessonId: string;
      citizen: string;
      verifier: string; // Could be a mentor, steward, or automated system
      verifiedAt: number;
      verificationMethod: "manual_review" | "automated_check" | "steward_approval";
    }}
  | { id: string; source: "github"; type: "LessonCompleted"; payload: {
      lessonId: string;
      citizen: string;
      credentialId?: number; // If credential was issued on-chain
      proofReferences: string[]; // All proofs that contributed to completion
      completedAt: number;
    }};
```

### 2. Extended WorldState for Academy

```typescript
interface AcademyState {
  // Existing fields
  courses: Record<string, Course>;
  credentials: Record<string, Credential>;
  
  // New fields for proof tracking
  lessonProofs: Record<string, LessonProof[]>; // citizen -> proofs
  lessonCompletions: Record<string, LessonCompletion>; // lessonId_citizen -> completion
  pendingVerifications: PendingVerification[];
}

interface LessonProof {
  proofId: string;
  lessonId: string;
  proofType: "pr_merge" | "issue_close" | "commit" | "chain_tx";
  reference: string;
  evidenceUrl: string;
  submittedAt: number;
  status: "pending" | "verified" | "rejected";
  verifiedBy?: string;
  verifiedAt?: number;
}

interface LessonCompletion {
  lessonId: string;
  citizen: string;
  proofs: string[]; // proofIds
  completedAt: number;
  credentialIssued: boolean;
  credentialId?: number;
}

interface PendingVerification {
  proofId: string;
  lessonId: string;
  citizen: string;
  submittedAt: number;
  priority: number; // For queue ordering
}
```

### 3. Manifest Fields

```typescript
interface WorldManifest {
  // Existing fields
  version: number;
  stateRoot: string;
  academyRoot: string;
  
  // New fields
  lessonProofRoot: string; // Merkle root of all lesson proofs
  completionRoot: string; // Merkle root of lesson completions
  verificationQueueRoot: string; // Root of pending verifications
}
```

## Proof Flow

### 1. Agent/Human Submits Proof

**Via GitHub PR:**
```
1. Complete lesson actions
2. Create PR referencing lesson ID (e.g., "Completes L-0001")
3. PR merged by maintainer
4. GitHub webhook triggers `LessonProofSubmitted` event
```

**Via Chain Transaction:**
```
1. Complete on-chain action
2. Transaction emits event that serves as proof
3. Reducer processes event and links to lesson
```

### 2. Verification Process

**Automated Checks:**
```typescript
function verifyProof(proof: LessonProof): boolean {
  switch (proof.proofType) {
    case "pr_merge":
      // Check PR was merged
      // Check PR references correct lesson
      // Check author is the citizen
      return checkPRMerge(proof.reference);
    
    case "chain_tx":
      // Verify transaction exists
      // Verify transaction matches lesson requirements
      return checkTransaction(proof.reference);
    
    case "issue_close":
      // Check issue was closed
      // Check issue has acceptance criteria met
      return checkIssueClose(proof.reference);
  }
}
```

**Manual/Steward Review:**
- Stewards review pending verifications
- Can approve/reject with reason
- Steward action emits `LessonProofVerified` event

### 3. Completion Criteria

A lesson is considered complete when:
```typescript
function checkLessonCompletion(
  lesson: Lesson,
  proofs: LessonProof[]
): boolean {
  // Check all required proof types are present
  const requiredTypes = lesson.proof.requirements;
  
  for (const requirement of requiredTypes) {
    const hasProof = proofs.some(p => 
      p.proofType === requirement.type && 
      p.status === "verified"
    );
    if (!hasProof) return false;
  }
  
  // Check prerequisites are met
  for (const prereq of lesson.prerequisites.lessons) {
    if (!isLessonCompleted(prereq, citizen)) return false;
  }
  
  return true;
}
```

## Reducer Implementation

### Event Handlers

```typescript
case "LessonProofSubmitted": {
  const { lessonId, citizen, proofType, proofReference } = event.payload;
  
  const proof: LessonProof = {
    proofId: generateProofId(),
    lessonId,
    proofType,
    reference: proofReference,
    evidenceUrl: event.payload.evidenceUrl,
    submittedAt: event.payload.submittedAt,
    status: "pending"
  };
  
  // Add to citizen's proofs
  if (!state.academy.lessonProofs[citizen]) {
    state.academy.lessonProofs[citizen] = [];
  }
  state.academy.lessonProofs[citizen].push(proof);
  
  // Add to verification queue
  state.academy.pendingVerifications.push({
    proofId: proof.proofId,
    lessonId,
    citizen,
    submittedAt: event.payload.submittedAt,
    priority: calculatePriority(lessonId, citizen)
  });
  
  break;
}

case "LessonProofVerified": {
  const { proofId, citizen } = event.payload;
  
  // Find and update proof
  const proofs = state.academy.lessonProofs[citizen] || [];
  const proof = proofs.find(p => p.proofId === proofId);
  
  if (proof) {
    proof.status = "verified";
    proof.verifiedBy = event.payload.verifier;
    proof.verifiedAt = event.payload.verifiedAt;
    
    // Remove from pending queue
    state.academy.pendingVerifications = 
      state.academy.pendingVerifications.filter(v => v.proofId !== proofId);
    
    // Check if lesson can be completed
    checkAndCompleteLesson(state, proof.lessonId, citizen);
  }
  
  break;
}

case "LessonCompleted": {
  const { lessonId, citizen, credentialId } = event.payload;
  
  const completion: LessonCompletion = {
    lessonId,
    citizen,
    proofs: event.payload.proofReferences,
    completedAt: event.payload.completedAt,
    credentialIssued: !!credentialId,
    credentialId
  };
  
  state.academy.lessonCompletions[`${lessonId}_${citizen}`] = completion;
  
  break;
}
```

## API Endpoints

### For Agents

```
GET /api/academy/lessons
GET /api/academy/lessons/:lessonId
GET /api/academy/proofs/:citizen
POST /api/academy/proofs/submit
GET /api/academy/completions/:citizen
```

### For Stewards

```
GET /api/academy/verifications/pending
POST /api/academy/verifications/:proofId/verify
POST /api/academy/verifications/:proofId/reject
```

## Privacy & Security

### Excluding Private Claims

1. **Public Proofs Only**: Only proofs that can be verified publicly (GitHub PRs, chain txs) are accepted
2. **No Chat Claims**: Discord/slack conversations are not valid proof
3. **Attestation Required**: All proofs must be attested by either:
   - GitHub merge (by maintainer)
   - Chain event (by contract)
   - Steward signature (for edge cases)

### Authority Model

```
GitHub Merge > Chain Event > Steward Approval > Pending
```

Higher authority proofs override lower ones.

## Implementation Phases

### Phase 1: Basic Proof Tracking
- [ ] Add `LessonProofSubmitted` event type
- [ ] Add `lessonProofs` to WorldState
- [ ] Create proof submission API
- [ ] GitHub webhook for PR merges

### Phase 2: Verification System
- [ ] Add `LessonProofVerified` event type
- [ ] Create verification queue
- [ ] Add steward verification API
- [ ] Automated verification for chain proofs

### Phase 3: Completion Tracking
- [ ] Add `LessonCompleted` event type
- [ ] Implement completion checking logic
- [ ] Link to CredentialRegistry
- [ ] Update manifest generation

### Phase 4: UI Integration
- [ ] Show proof status in Academy view
- [ ] Add proof submission form
- [ ] Steward verification dashboard
- [ ] Completion progress tracking

## Related

- [Lesson Schema](../docs/LESSON_SCHEMA.md)
- [Academy District Proposal](../proposals/0003-academy-district.md)
- [Q-0009 Implementation](../issues/17)
