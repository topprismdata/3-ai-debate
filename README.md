# 3-AI Debate

**A multi-model second-opinion utility for structured deliberation in
employee-agent workflows.**

`NATIVE AI` · `INTERNAL UTILITY` · `INTERNAL EVALUATION`

> **Native AI question:** When one model's answer is not enough, how can
> an employee agent deliberately seek independent opinions, expose
> disagreement, and synthesize a decision?

This project is derived from the `llmcouncil` idea and replaces
API-provider integration with CLI-based providers. Preserve upstream
attribution prominently.

------------------------------------------------------------------------

## Use it for

-   architecture review;
-   model / method selection;
-   red-team review;
-   important client reasoning;
-   ambiguous trade-offs;
-   high-value second opinions.

## Do not use it for

-   deterministic calculation;
-   routine factual retrieval;
-   tasks where three correlated model outputs add no evidence;
-   latency-sensitive repetitive automation.

------------------------------------------------------------------------

## Architecture

``` text
Question
  ↓
parallel independent model responses
  ↓
agreement / disagreement extraction
  ↓
chair / synthesis protocol
  ↓
decision + dissent trace
```

The value is not "three AIs are better than one." The value is making
**disagreement explicit and reviewable**.

------------------------------------------------------------------------

## Evidence discipline

The current repository includes working examples and protocols, but not
a rigorous external benchmark showing higher decision quality.

Therefore classify it as **Internal Utility / Internal Evaluation**.

Recommended future evaluation:

-   blind expert preference;
-   error detection rate;
-   calibration improvement;
-   incremental value versus one strong model;
-   latency / cost trade-off.

------------------------------------------------------------------------

## Provider configuration

Model names change quickly. Keep the README provider-neutral and move
current model identifiers to configuration examples.

Avoid statements such as "no cost concerns." CLI subscriptions still
have economic and rate-limit constraints.

------------------------------------------------------------------------

## TopPrism metadata

``` yaml
topprism:
  purpose: native-ai
  capability: multi-model-deliberation
  platform_layer: organizational-intelligence
  maturity: internal-utility
  evidence:
    type: internal-evaluation
  provenance:
    derived_from: llmcouncil
```
