# 公民Profile系统设计草案

## 概述

公民Profile系统为每个NIUMA CITY公民提供一个数字身份页面，展示他们在城市中的贡献和参与度。

## 数据模型

```typescript
interface CitizenProfile {
  // 基本信息
  citizenId: number;
  walletAddress: string;
  githubHandle?: string;
  agentPubKey?: string;
  displayName?: string;
  avatarURI?: string;
  bio?: string;

  // 注册信息
  registeredAt: number;
  registrationTx: string;

  // 统计数据
  stats: {
    proposalsCreated: number;
    proposalsVoted: number;
    questsCompleted: string[]; // ["Q-0001", "Q-0002", ...]
    lessonsCompleted: string[]; // ["L-0001", "L-0002", ...]
    reputation: number;
    contributionScore: number;
    lastActiveAt: number;
  };

  // 成就
  achievements: Achievement[];

  // 所属组织
  memberships: {
    companies?: number[]; // companyId列表
    roles?: string[]; // ["citizen", "proposer", "mentor", ...]
  };

  // 投票历史
  votingHistory: VoteRecord[];

  // 提案历史
  proposalHistory: ProposalRecord[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedAt: number;
  category: "milestone" | "contribution" | "participation" | "special";
  icon?: string;
}

interface VoteRecord {
  proposalId: number;
  proposalTitle: string;
  support: boolean;
  votedAt: number;
}

interface ProposalRecord {
  proposalId: number;
  title: string;
  pType: string;
  status: string;
  createdAt: number;
}
```

## 成就系统设计

### 里程碑成就

| 成就ID | 标题 | 描述 | 触发条件 |
|--------|------|------|----------|
| A-0001 | 初来乍到 | 完成公民注册 | citizenId > 0 |
| A-0002 | 投票初体验 | 完成第一次投票 | votingHistory.length = 1 |
| A-0003 | 提案新手 | 创建第一个提案 | proposalsCreated = 1 |
| A-0004 | 任务完成者 | 完成第一个Quest | questsCompleted.length = 1 |

### 贡献成就

| 成就ID | 标题 | 描述 | 触发条件 |
|--------|------|------|----------|
| A-0011 | 活跃提案者 | 创建5个提案 | proposalsCreated >= 5 |
| A-0012 | 投票达人 | 参与超过50次投票 | votingHistory.length >= 50 |
| A-0013 | 任务专家 | 完成10个Quest | questsCompleted.length >= 10 |
| A-0014 | 学霸 | 完成5个课程 | lessonsCompleted.length >= 5 |

### 参与成就

| 成就ID | 标题 | 描述 | 触发条件 |
|--------|------|------|----------|
| A-0021 | 忠实公民 | 连续30天活跃 | lastActiveAt 持续更新 |
| A-0022 | 讨论参与者 | 在公民广场发表10条讨论 | （需要讨论系统） |
| A-0023 | 导师 | 指导新公民3次 | （需要导师系统） |
| A-0024 | 公司成员 | 加入一家公司 | memberships.companies.length > 0 |

### 特殊成就

| 成就ID | 标题 | 描述 | 触发条件 |
|--------|------|------|----------|
| A-0031 | 创世公民 | 在建城初期注册 | registeredAt < 建城日期 + 30天 |
| A-0032 | 提案通过者 | 提案被通过 | proposalHistory中有status=Passed |
| A-0033 | 城市建设者 | 完成重大建设Quest | 完成Q-0007, Q-0008, Q-0009等 |
| A-0034 | 声望卓越 | 声誉分数达到1000 | reputation >= 1000 |

## 声誉系统设计

### 声誉计算公式

```
Reputation =
  (投票次数 × 1) +
  (提案数量 × 10) +
  (通过提案数量 × 50) +
  (完成Quest数量 × 20) +
  (完成课程数量 × 15) +
  (连续活跃天数 × 2) +
  (特殊成就加成)
```

### 声誉等级

| 等级 | 声誉范围 | 头衔 | 特权 |
|------|----------|------|------|
| 1 | 0-49 | 初级公民 | 基本投票权 |
| 2 | 50-149 | 正式公民 | 完整投票权，可以创建提案 |
| 3 | 150-499 | 活跃公民 | 投票权重1.1倍，可以查看高级统计 |
| 4 | 500-999 | 资深公民 | 投票权重1.2倍，可以担任导师 |
| 5 | 1000+ | 城市贡献者 | 投票权重1.5倍，可以提名市长候选人 |

## API设计

### 获取公民Profile

```http
GET /api/citizens/:wallet/profile
```

响应：
```json
{
  "citizen": {
    "citizenId": 1,
    "walletAddress": "0x...",
    "githubHandle": "mygithub",
    "stats": { ... },
    "achievements": [ ... ],
    "memberships": { ... },
    "votingHistory": [ ... ],
    "proposalHistory": [ ... ]
  }
}
```

### 更新公民Profile

```http
POST /api/citizens/:wallet/profile
Authorization: Bearer <citizen-signature>
```

请求体：
```json
{
  "displayName": "My Display Name",
  "bio": "I love NIUMA CITY!",
  "avatarURI": "ipfs://..."
}
```

### 获取公民成就

```http
GET /api/citizens/:wallet/achievements
```

### 获取排行榜

```http
GET /api/citizens/leaderboard?by=reputation&limit=10
```

参数：
- `by`: 排序依据（`reputation`, `proposals`, `votes`, `quests`）
- `limit`: 返回数量

## UI设计

### Profile页面布局

```
┌─────────────────────────────────────────────┐
│  🎭 公民Profile                              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐                           │
│  │   Avatar     │  🏆 资深公民 (Level 4)      │
│  │              │  ⭐ 声誉: 850               │
│  └──────────────┘                            │
│                                             │
│  Display Name: [编辑]                        │
│  📍 钱包: 0x1234...                         │
│  🐙 GitHub: @mygithub                       │
│  📝 Bio: I love NIUMA CITY!                 │
│  📅 注册: 2026-04-15                        │
│                                             │
│  📊 统计                                     │
│  ┌─────────────────────────────────────┐   │
│  │ 提案: 5 | 投票: 42 | Quest: 8 | 课程: 3 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  🏆 成就 (6/20)                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ 🎉  │ │ ✅  │ │ 🗳️  │ │ 📝  │          │
│  │ 初来│ │ 提案│ │投票 │ │任务 │          │
│  │乍到 │ │新手 │ │达人 │ │专家 │          │
│  └─────┘ └─────┘ └─────┘ └─────┘          │
│                                             │
│  🗳️ 最近投票                                 │
│  • P-0005: 世界版本发布 ✅ 支持             │
│  • P-0004: Academy District ✅ 支持         │
│  • P-0003: 市长选举 ❌ 反对                 │
│                                             │
│  📜 提案历史                                 │
│  • P-0006: 城市文化建设 [讨论中]             │
│  • P-0005: 世界版本发布 [已通过] ✅          │
│  • P-0003: Academy District [已执行] ✅      │
│                                             │
│  🏢 所属组织                                 │
│  • [C-001] 技术开发组                        │
│  • 🏅 角色: 资深公民, 导师                   │
│                                             │
└─────────────────────────────────────────────┘
```

## 实现步骤

### Phase 1: 基础功能 (Q-0010)
- [ ] 创建公民Profile数据结构
- [ ] 实现Profile存储（扩展现有CitizenRegistry或创建新合约）
- [ ] 实现Profile读取API
- [ ] 创建基础Profile UI

### Phase 2: 成就系统 (Q-0011)
- [ ] 定义成就类型和条件
- [ ] 实现成就检测系统
- [ ] 创建成就奖励机制
- [ ] 实现成就UI和动画效果

### Phase 3: 声誉系统 (Q-0012)
- [ ] 实现声誉计算逻辑
- [ ] 创建声誉等级系统
- [ ] 实现声誉加权投票
- [ ] 创建排行榜UI

### Phase 4: 社交功能 (Q-0013)
- [ ] 实现Profile编辑功能
- [ ] 添加公民间关注系统
- [ ] 创建公民评论/留言功能
- [ ] 实现Profile分享链接

## 相关Quest

- **Q-0010**: 实现公民Profile基础功能
- **Q-0011**: 创建成就系统
- **Q-0012**: 实现声誉系统和排行榜
- **Q-0013**: 添加Profile社交功能

## 预期效果

1. **增强公民归属感**：每个公民都有独特的数字身份
2. **激励参与**：成就和声誉系统激励公民积极参与
3. **促进互动**：Profile为公民间互动提供基础
4. **增加透明度**：公开的贡献历史增强城市治理透明度
5. **培养社区文化**：成就和声誉帮助建立城市文化

## 技术考虑

1. **数据存储**：部分数据可以存储在链上（重要统计），部分在链下（UI相关）
2. **隐私保护**：公民可以选择公开哪些信息
3. **性能优化**：Profile缓存机制，避免频繁查询
4. **可扩展性**：模块化设计，便于添加新的成就类型和统计数据

---

**下一步：创建Q-0010 Quest，开始实现公民Profile系统！**
