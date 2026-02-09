## ADDED Requirements

### Requirement: Content summary and intensity rating are clearly distinguished

On the book details page, when both "Comfort Read" (automated content summary: no warnings found) and the Subtext Suitability Scale (SSS) are shown, the system SHALL distinguish them so users do not interpret "Comfort Read" and "Not yet assessed" as contradictory. The system SHALL provide a short label or context for each (e.g. "Content summary" for the Comfort Read badge, "Intensity rating" or "Subtext Suitability" for the SSS row). When the book has Comfort Read and SSS "Not yet assessed" (S0), the system SHALL provide one line of explanatory copy (e.g. in tooltip or below the SSS pill) stating that no content warnings were found but intensity was not rated due to limited information.

#### Scenario: Book has Comfort Read and Not yet assessed (S0)

- **GIVEN** the book has analysis complete with zero warnings (Comfort Read) and sss_level S0_NO_INPUT ("Not yet assessed")
- **WHEN** the book details page is rendered
- **THEN** the Comfort Read badge has label or context indicating it is the content summary (e.g. "Content summary")
- **AND** the SSS row has label or context indicating it is the intensity/suitability rating
- **AND** explanatory copy clarifies that we didn't find content warnings but couldn't rate intensity (e.g. in tooltip or inline)

#### Scenario: Book has Comfort Read and a rated SSS (S1–S4)

- **GIVEN** the book has Comfort Read and sss_level in { S1_GENTLE, S2_MILD, S3_MODERATE, S4_INTENSE }
- **WHEN** the book details page is rendered
- **THEN** the two concepts (content summary vs intensity) are still labeled or contextualized so they are not confused
