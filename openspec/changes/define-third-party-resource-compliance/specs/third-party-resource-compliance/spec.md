## ADDED Requirements

### Requirement: Single source of truth for third-party resources

The project SHALL maintain a single document (e.g. `docs/THIRD_PARTY_RESOURCES.md`) that lists each third-party psychology, NLP, or similar resource that is considered or used for content warnings, SSS, emotional-intensity, or related features. For each resource the document SHALL state: name, source (repo or paper URL), license (e.g. MIT, GPL-3.0, or unlicensed), permitted use (embed with attribution, inspiration-only, or cite-only), and any attribution or citation requirement.

#### Scenario: New resource evaluated

- **GIVEN** the team is considering using or referencing an external repo or dataset (e.g. trigger-warning corpus, emotion-trigger dataset)
- **WHEN** a decision is made to use it or document it for future use
- **THEN** the resource is added to the single source-of-truth document with license and permitted use
- **AND** the document is updated so that attribution or citation requirements are clear

#### Scenario: Contributor checks policy before integrating code

- **GIVEN** a contributor or agent plans to integrate code or data from an external psychology/NLP resource
- **WHEN** they consult the project documentation
- **THEN** they find the third-party resource policy in a known location (e.g. `docs/THIRD_PARTY_RESOURCES.md`)
- **AND** they can determine whether the resource may be embedded, used with attribution, or only cited

---

### Requirement: MIT-licensed resources used only with attribution

The project SHALL use MIT-licensed code or data only when explicit attribution is provided. Attribution SHALL be in the form of a NOTICE file, a dedicated section in the third-party resources document, or another clearly visible place that states the copyright and license (e.g. "Copyright (c) [year] [owner]. Licensed under the MIT License."). The project SHALL NOT embed or depend on GPL-licensed code from third-party psychology/NLP repos (e.g. LitEmo) in the codebase.

#### Scenario: MIT code or data integrated

- **GIVEN** the project integrates code or data from an MIT-licensed resource (e.g. acl23-trigger-warning-assignment)
- **WHEN** the integration is committed
- **THEN** the repo contains clear attribution for that resource (NOTICE or doc) with copyright and "MIT License"
- **AND** the third-party resources document lists the resource and states "embed with attribution"

#### Scenario: No GPL code in codebase

- **GIVEN** a resource is licensed under GPL-3.0 (e.g. LitEmo)
- **WHEN** the team uses that resource
- **THEN** only methodology or ideas from the resource are used (e.g. from papers); no GPL-licensed code from that resource is copied or linked into the Subtext codebase
- **AND** the third-party resources document states that the resource is "inspiration-only" or "methodology only; no code"

---

### Requirement: Unlicensed resources cited; permission sought if redistributing

For third-party psychology/NLP resources that do not specify a license, the project SHALL require citation of the paper or repo when referencing the work. If the project ever embeds code from or redistributes data from an unlicensed resource in a commercial product, the policy SHALL state that permission from the authors should be sought or use SHALL be limited to ideas-only with citation.

#### Scenario: Unlicensed resource referenced in docs or design

- **GIVEN** the project references an unlicensed resource (e.g. EmoTrigger, CovidET, ACE-NLP) in documentation or design
- **WHEN** the reference is made
- **THEN** the resource is listed in the third-party resources document with "unlicensed" and "cite-only" or "ideas-only; cite paper"
- **AND** the document indicates that commercial use or redistribution of their code/data requires permission unless use is limited to ideas and citation

#### Scenario: Future integration of unlicensed code or data

- **GIVEN** the team plans to integrate code or redistribute data from an unlicensed repo
- **WHEN** the policy is consulted
- **THEN** the policy states that permission from the authors should be sought or use limited to ideas-only with citation
- **AND** the single source-of-truth document is updated before integration to reflect the chosen approach
