---
'@cascivo/core': minor
---

Add the markup-contract manifest types: `ComponentMeta.contractTier` (`ContractTier`) and `ComponentMeta.anatomy` (`Anatomy`, `AnatomyPart`, `AnatomyDataValues`). They describe the stable `cv-<unit>-<local>` classes and `data-*` attributes of a component; `scripts/contract/generate.ts` turns them into `packages/css/contract.json`.
