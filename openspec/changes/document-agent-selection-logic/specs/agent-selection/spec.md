# agent-selection Specification

## Purpose

Defines how the system selects AI models (OpenAI GPT-4o and Google Gemini) for generating content warnings during book scans. The selection logic varies based on scan mode, IP address, and quota status.

## ADDED Requirements

### Requirement: IP-based model assignment for Quick scans

The system SHALL assign a single model (OpenAI or Gemini) to each IP address for Quick scans using a deterministic hash algorithm. The assignment SHALL be consistent for the same IP address and SHALL respect Gemini quota limits.

#### Scenario: IP gets assigned Gemini

- **GIVEN** a user performs a Quick scan (`scanMode === 'quick'`)
- **AND** the IP address hash (deterministic) results in an even number
- **AND** Gemini daily usage is below the warning threshold (default: 15 RPD)
- **WHEN** the scan is processed
- **THEN** `modelAssignment` is set to `'gemini'`
- **AND** `enableGemini: true` and `enableOpenAI: false` in analysis options
- **AND** only Gemini is used for analysis

#### Scenario: IP gets assigned OpenAI

- **GIVEN** a user performs a Quick scan (`scanMode === 'quick'`)
- **AND** the IP address hash results in an odd number OR Gemini daily usage ≥ threshold
- **WHEN** the scan is processed
- **THEN** `modelAssignment` is set to `'openai'`
- **AND** `enableOpenAI: true` and `enableGemini: false` in analysis options
- **AND** only OpenAI is used for analysis

#### Scenario: Same IP always gets same model

- **GIVEN** an IP address `192.168.1.1` performs multiple Quick scans
- **WHEN** each scan is processed
- **THEN** all scans use the same model (deterministic hash ensures consistency)
- **AND** the model assignment does not change unless quota threshold is hit

#### Scenario: Quota threshold forces OpenAI assignment

- **GIVEN** Gemini daily usage has reached or exceeded the warning threshold (default: 15 RPD)
- **WHEN** a new Quick scan is processed
- **THEN** `shouldAssignGemini()` returns `false`
- **AND** all new assignments use OpenAI regardless of IP hash
- **AND** existing assignments (before threshold) are unaffected

### Requirement: Multi-model analysis for Deep scans

The system SHALL use both OpenAI and Gemini models in parallel for Deep scans, regardless of IP address or quota status. Both models SHALL run simultaneously, and results SHALL be combined with cross-validation.

#### Scenario: Deep scan uses both models

- **GIVEN** a user performs a Deep scan (`scanMode === 'deep'`)
- **WHEN** the scan is processed
- **THEN** `modelAssignment` is `null` (IP assignment ignored)
- **AND** `enableOpenAI: true` and `enableGemini: true` in analysis options
- **AND** both models run in parallel via `Promise.allSettled()`
- **AND** results from both models are combined

#### Scenario: Gemini failure in Deep scan is non-fatal

- **GIVEN** a Deep scan is processing
- **AND** Gemini analysis fails (rate limit, API error, etc.)
- **WHEN** the failure occurs
- **THEN** the failure is logged with `console.warn`
- **AND** Gemini returns empty array `[]`
- **AND** OpenAI results are still used
- **AND** the scan completes successfully with OpenAI-only results

#### Scenario: Results combination preserves unique findings

- **GIVEN** a Deep scan completes with both models
- **AND** OpenAI finds warnings `[A, B]` and Gemini finds warnings `[B, C]`
- **WHEN** results are combined
- **THEN** final warnings include `[A, B, C]` (unique findings preserved)
- **AND** warning `B` uses the highest severity from either model
- **AND** agreement score reflects overlap (e.g., 1/3 = 33% agreement)

### Requirement: Gemini quota management

The system SHALL track Gemini daily usage and enforce quota limits to prevent overuse. Quota SHALL reset at UTC midnight, and usage SHALL be tracked in-memory.

#### Scenario: Quota tracking increments on use

- **GIVEN** a scan uses Gemini (Quick assignment or Deep scan)
- **WHEN** Gemini analysis is called
- **THEN** `incrementGeminiUsage()` is called
- **AND** daily usage counter increases by 1
- **AND** counter persists until UTC midnight reset

#### Scenario: Quota resets at UTC midnight

- **GIVEN** Gemini daily usage is tracked
- **WHEN** UTC midnight is reached
- **THEN** usage counter resets to 0
- **AND** `getDailyGeminiUsage()` returns 0
- **AND** new assignments can use Gemini again (if below threshold)

#### Scenario: Threshold prevents new Gemini assignments

- **GIVEN** Gemini daily usage is 15 (at threshold, default)
- **WHEN** `shouldAssignGemini(ip)` is called for a new Quick scan
- **THEN** function returns `false`
- **AND** assignment uses OpenAI instead
- **AND** Deep scans are unaffected (still use both models)

### Requirement: Deterministic hash algorithm

The system SHALL use a deterministic hash function to assign models based on IP address. The hash SHALL produce consistent results for the same IP address.

#### Scenario: Hash produces consistent assignment

- **GIVEN** IP address `192.168.1.1`
- **WHEN** `getModelForIP('192.168.1.1')` is called multiple times
- **THEN** the function always returns the same model (`'gemini'` or `'openai'`)
- **AND** the assignment is based on hash modulo 2 (even → Gemini, odd → OpenAI)

#### Scenario: Different IPs get different assignments

- **GIVEN** two different IP addresses
- **WHEN** `getModelForIP()` is called for each
- **THEN** assignments may differ (50/50 distribution expected over many IPs)
- **AND** each IP gets a consistent assignment

### Requirement: Analysis options respect model assignment

The system SHALL construct analysis options based on scan mode and model assignment, with appropriate defaults for Quick vs Deep scans.

#### Scenario: Quick scan options use single model

- **GIVEN** a Quick scan with `modelAssignment === 'gemini'`
- **WHEN** analysis options are constructed
- **THEN** `enableGemini: true` and `enableOpenAI: false`
- **AND** `enableAdversarial: false` and `enableVerification: false` (defaults)
- **AND** `enableWebEnrichment: true` (default)
- **AND** `maxWarnings: 5` (default)

#### Scenario: Deep scan options use both models

- **GIVEN** a Deep scan (`scanMode === 'deep'`)
- **WHEN** analysis options are constructed
- **THEN** `enableOpenAI: true` and `enableGemini: true` (defaults)
- **AND** `enableAdversarial: true` and `enableVerification: true` (defaults)
- **AND** all options respect `analysisOptions` overrides if provided

#### Scenario: Explicit options override defaults

- **GIVEN** a Quick scan with `analysisOptions: { enableOpenAI: true, enableGemini: true }`
- **WHEN** effective options are constructed
- **THEN** explicit options take precedence over IP-based assignment
- **AND** both models are enabled despite `modelAssignment`
