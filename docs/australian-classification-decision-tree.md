# Australian Classification Board - Book Rating Decision Tree

This diagram shows how Subtext assigns age ratings based on the Australian Classification Board methodology.

## Overview

The classification process evaluates **6 classifiable elements**: Themes, Violence, Sex, Language, Drug Use, and Nudity. Each content warning is assessed for:
- **Severity** (Mild / Moderate / Severe)  
- **Escalation Weight** (how much the content type escalates the rating)
- **Presentation** (on-page vs referenced, graphic vs vague detail)

These factors combine to produce an **Impact Score** that determines the final rating.

---

## Decision Tree

```mermaid
flowchart TD
    START([📚 Book Scanned]) --> ANALYZE[Analyze Book Content]
    
    ANALYZE --> WARNINGS{Content Warnings<br/>Identified?}
    
    WARNINGS -->|No warnings| G_RATING[/"🟢 G - General<br/>Suitable for all ages"/]
    
    WARNINGS -->|Warnings found| CATEGORIZE[Categorize by Severity]
    
    CATEGORIZE --> CHECK_EXTREME{Contains<br/>Extreme Content?}
    
    %% RC Check
    CHECK_EXTREME -->|"Extreme violence/gore<br/>OR 3+ very high<br/>explicitness warnings"| RC_RATING[/"🔴 RC - Refused<br/>Classification<br/>Not recommended"/]
    
    CHECK_EXTREME -->|No extreme content| CHECK_R18
    
    %% R18+ Check
    CHECK_R18{Sexual Violence<br/>OR Explicit On-Page<br/>Sexual Content<br/>OR Impact ≥ 0.7?}
    
    CHECK_R18 -->|Yes| R18_RATING[/"🔴 R18+<br/>Ages 18+"/]
    
    CHECK_R18 -->|No| CHECK_MA15
    
    %% MA15+ Check
    CHECK_MA15{Impact ≥ 0.3?<br/>OR High-Risk Severe<br/>with Impact ≥ 0.15?<br/>OR Any Severe<br/>with Impact ≥ 0.2?}
    
    CHECK_MA15 -->|Yes| MA15_RATING[/"🟠 MA15+<br/>Ages 15+"/]
    
    CHECK_MA15 -->|No| CHECK_M
    
    %% M Check
    CHECK_M{Moderate Warnings?<br/>OR Impact ≥ 0.1?<br/>OR 3+ Mild + <br/>Mature Content?}
    
    CHECK_M -->|Yes| M_RATING[/"🟡 M - Mature<br/>Ages 13+"/]
    
    CHECK_M -->|No| CHECK_PG
    
    %% PG Check
    CHECK_PG{Mild Warnings<br/>Present?}
    
    CHECK_PG -->|Yes| PG_RATING[/"🟢 PG - Parental<br/>Guidance<br/>Ages 8+"/]
    
    CHECK_PG -->|No| G_RATING
    
    %% Styling
    classDef startEnd fill:#e1f5fe,stroke:#01579b
    classDef process fill:#fff3e0,stroke:#e65100
    classDef decision fill:#f3e5f5,stroke:#7b1fa2
    classDef rating_g fill:#c8e6c9,stroke:#2e7d32,color:#1b5e20
    classDef rating_pg fill:#c8e6c9,stroke:#2e7d32,color:#1b5e20
    classDef rating_m fill:#fff9c4,stroke:#f9a825,color:#f57f17
    classDef rating_ma fill:#ffe0b2,stroke:#e65100,color:#bf360c
    classDef rating_r18 fill:#ffcdd2,stroke:#c62828,color:#b71c1c
    classDef rating_rc fill:#ffcdd2,stroke:#c62828,color:#b71c1c
    
    class START startEnd
    class ANALYZE,CATEGORIZE process
    class WARNINGS,CHECK_EXTREME,CHECK_R18,CHECK_MA15,CHECK_M,CHECK_PG decision
    class G_RATING rating_g
    class PG_RATING rating_pg
    class M_RATING rating_m
    class MA15_RATING rating_ma
    class R18_RATING rating_r18
    class RC_RATING rating_rc
```

---

## Impact Score Calculation

```mermaid
flowchart LR
    subgraph Inputs["📊 Input Factors"]
        SEV[Severity Score<br/>0.0 - 1.0]
        ESC[Escalation Weight<br/>0.0 - 1.0]
        PRES[Presentation<br/>Multiplier<br/>0.7 - 1.3]
    end
    
    subgraph Calculation["⚙️ Calculation"]
        MULT[/"Impact = <br/>Severity × Escalation × Presentation"/]
    end
    
    subgraph Output["📈 Result"]
        IMP[Impact Score<br/>Used for Rating]
    end
    
    SEV --> MULT
    ESC --> MULT
    PRES --> MULT
    MULT --> IMP
```

---

## Escalation Weights by Category

| Category | Content Type | Weight | Typical Rating |
|----------|--------------|--------|----------------|
| **Violence** | Physical violence | 0.45 | MA15+ |
| | Graphic violence | 0.70 | R18+ |
| | Torture | 0.75 | R18+ |
| | Child harm | 0.80 | R18+ |
| **Sexual** | Intense romance | 0.58 | MA15+ |
| | Explicit content | 0.70 | R18+ |
| | Sexual violence | 0.90 | R18+ |
| **Mental Health** | Depression/PTSD | 0.40-0.45 | MA15+ |
| | Self-harm | 0.60 | MA15+ |
| | Suicidal ideation | 0.65 | R18+ |
| **Tropes** | Dark romance | 0.60 | MA15+ |
| | Stalker/Kidnapping | 0.75 | R18+ |

---

## Rating Floors

Certain content types enforce a **minimum rating floor** regardless of calculated impact:

```mermaid
flowchart TD
    FLOOR{Content Type<br/>Check}
    
    FLOOR -->|Sexual Violence| FL_R18["⚠️ Floor: R18+<br/>Always adult-only"]
    FLOOR -->|Incest/Taboo Sex| FL_MA15_1["⚠️ Floor: MA15+<br/>Minimum 15+"]
    FLOOR -->|Explicit Sexual| FL_MA15_2["⚠️ Floor: MA15+<br/>Minimum 15+"]
    FLOOR -->|Other Content| NORMAL["Standard<br/>Impact Calculation"]
    
    classDef floor fill:#ffcdd2,stroke:#c62828
    class FL_R18,FL_MA15_1,FL_MA15_2 floor
```

---

## Presentation Multiplier

How content is presented affects its impact:

| Explicitness | Detail Level | Multiplier |
|--------------|--------------|------------|
| ≥ 0.8 | Graphic | 1.15× |
| ≥ 0.5 | Moderate | 1.00× |
| ≥ 0.3 | Vague/Clinical | 0.90× |
| < 0.3 | Very Vague | 0.85× |

| Proximity | Presence | Multiplier |
|-----------|----------|------------|
| ≥ 0.9 | On-page | 1.10× |
| ≥ 0.6 | Flashback | 1.00× |
| ≥ 0.4 | Off-page | 0.95× |
| ≥ 0.25 | Referenced | 0.90× |
| < 0.25 | Implied | 0.85× |

---

## Classification Summary

| Rating | Age | Description |
|--------|-----|-------------|
| **G** | All ages | No warnings or very mild impact |
| **PG** | 8+ | Mild warnings with mild impact |
| **M** | 13+ | Moderate warnings or content |
| **MA15+** | 15+ | Strong impact, restricted to 15+ |
| **R18+** | 18+ | High impact, adult-only content |
| **RC** | N/A | Refused classification, extreme content |

---

*Based on the [Australian Classification Board Guidelines](https://www.classification.gov.au/) and the Classification (Publications, Films and Computer Games) Act 1995.*
