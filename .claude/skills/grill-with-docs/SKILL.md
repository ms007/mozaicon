---
name: grill-with-docs
description: Doc-aware grilling session that challenges the plan against the project's thematic docs, sharpens shared vocabulary in docs/glossary.md, and offers inline updates to the relevant thematic doc when decisions crystallise. Use when the user wants to stress-test a plan against the project's language and documented conventions.
---

<what-to-do>

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing.

If a question can be answered by exploring the codebase or reading a thematic doc, do that instead of asking.

</what-to-do>

<supporting-info>

## Doc layout this skill assumes

This is a single-context project. Conventions and decisions live as prose inside thematic deep-dive docs under `docs/` (e.g. `architecture.md`, `shapes.md`, `testing.md`, `ui-primitives.md`, `design-tokens.md`). `CLAUDE.md` is the entry point and points at each one with a short description.

Shared vocabulary lives in `docs/glossary.md` (lazily created). Data-model terms are additionally defined as Zod schemas in `src/types/`, and `CLAUDE.md` lists "Key Concepts" as the onboarding-level glossary.

There is no `docs/adr/` and no separate decision log. Decisions land **inline in the thematic doc that owns the topic** — or in a new thematic doc when nothing existing fits.

## Reading strategy

At session start:

1. Read `docs/glossary.md` if it exists. `CLAUDE.md` is already in context.
2. Do **not** eager-load the thematic docs. Let the topic guide which one(s) to read.

When the conversation touches a thematic doc's territory, read that doc _fully_ before recommending any update to it. The `CLAUDE.md` one-liner is not enough — the decision may already be recorded there in different terms.

## During the session

### Challenge against the existing language

When the user uses a term, check it against (in this order):

1. `docs/glossary.md` (if it exists)
2. `CLAUDE.md` "Key Concepts"
3. The Zod schemas in `src/types/`

If the term conflicts with an existing definition, surface it: "The glossary defines X as …, but you seem to mean …".

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term and name the boundary. "You said 'drag' — do you mean Drag-to-Draw (creating a new shape) or Drag-to-Move (translating an existing one)?"

### Discuss concrete scenarios

When relationships or boundaries are being discussed, stress-test them with specific scenarios. Invent edge cases that force the user to be precise.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code does X, but you just said Y — which is right?"

### Glossary updates — low threshold

Whenever a term is _new_ or _sharpened_ during the session, ask: "Should I add this to `docs/glossary.md`?" Only write on confirmation. Don't batch — capture them as they happen.

If `docs/glossary.md` doesn't exist yet, create it on the first confirmed entry. Bootstrap rules:

- Use mini-group headings (`## Data`, `## Interaction`, `## Tools`, `## Export`, …) — pick the group that fits, add new ones as needed.
- Per entry: bold term, one-sentence definition, optionally one sentence on the boundary against a related term.
- No "Avoid:" lists, no example dialogues, no "Flagged ambiguities" sections.
- Match the prose style of the existing thematic docs.

Once the file exists, match its surrounding style.

### Thematic-doc updates — medium threshold

Only offer to update a thematic doc when both are true:

1. The decision or clarification would change how a future reader of that doc understands or applies a convention.
2. You have actually read the relevant doc in this session — not just the `CLAUDE.md` pointer.

Skip pure confirmations ("yes, that's how it already works") and clarifications that don't shift any convention.

When you do offer, be specific about _where_ in the doc the update lands (which section, which list, which table row). Match the surrounding prose style. Ask before writing.

### When no thematic doc fits

If a topic emerges that doesn't belong in any existing thematic doc, propose creating a new one — name and short outline included in the proposal. Don't create it without confirmation.

</supporting-info>
