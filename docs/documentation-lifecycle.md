# Documentation Lifecycle

Use this guidance during an explicitly requested or adopted documentation reorganisation or
cleanup. [document-locations.md](document-locations.md) chooses the path for one Sarathi
record; this page explains how a larger documentation tree stays findable and current over
time. Completing ordinary Sarathi delivery does not automatically move its documents.

An established layout remains the default. Adopt a new layout only when the repository
owner chooses it or when concrete search, ownership, or stale-document problems justify the
move. A small documentation set does not need indexes, ledgers, or migration machinery.

## Organise For The Search

When a repository benefits from grouping documents by purpose, this is a useful starting
shape:

| Folder | Primary use |
| --- | --- |
| `docs/specs/` | Current product and system intent: what must be true |
| `docs/designs/` | Current technical decisions: how and why the system is built |
| `docs/plans/` | Sequencing and completion for active or paused work |
| `docs/slices/` | Focused changes to an accepted baseline |
| `docs/reviews/` | Current assessments, audits, findings, and feedback records |
| `docs/knowledge/` | Research, surveys, integration notes, and learned constraints |
| `docs/operations/` | Procedures used repeatedly, such as local setup and publishing |
| `docs/status/` | Current checkpoints, progress, and resume information |
| `docs/user/` | End-user setup and guidance |
| `docs/archive/` | Closed or superseded material, mirroring its former live location |

A plan finishes; a procedure is used repeatedly. Research informs a decision; it does not
approve one. Generated product content that happens to be Markdown stays with the product
assets rather than being moved into this documentation shape.

Repositories may use other folder names or organise by feature or component. Preserve a
layout that already makes ownership and search clear. Record the convention in the
repository guidance instead of making agents infer it from the tree.

## Give Each Document One Owner And Path

Every durable claim or decision that needs documentation has one authoritative source and
one canonical path. That source may instead be code, configuration, a test, or another
system of record when a separate document would add no value. When documents own the
decision, they should not compete for authority:

- a specification owns what must be true;
- a design owns how and why;
- a plan owns sequencing and completion;
- a procedure owns how recurring work is performed;
- research records what was learned;
- evidence records what was observed; and
- archived material controls no current decision.

Assign a mixed document according to its main use. Split it only when the new boundaries
make ownership or search materially clearer. When a split is large or a content loss would
be material, an independent reviewer compares the old revision with the new files,
including headings, prose, lists, tables, diagrams, and code blocks. Record any intentional
content change separately from the move.

## Decide When A Document Leaves The Live Tree

- **Finite plans of any scope** move to the matching archive location when their work is
  delivered, cancelled, or transferred to a named live owner. The relevant delivery
  assessments must support that result. Feedback may be `received`, `unavailable`, or
  `not-applicable` under [feedback-and-learning.md](feedback-and-learning.md); unresolved
  `requested` feedback keeps the plan live when later work or acceptance depends on it. A
  plan assessment alone does not show that delivery finished. Roadmaps, standing delivery
  controls, and paused plans with a resume point remain live.
- **Review and assessment evidence** moves only after its subject is no longer a current
  candidate. Keep the defined `open | claimed-fixed | closed` finding states. When an open
  finding still matters, record its disposition and the live work that owns it before
  archiving the report. Name the successor assessment or status record when one exists; an
  abandoned target may have none.
- **Status** is replaced in place. Archive a retired checkpoint narrative only when it has
  continuing historical value; give an immutable checkpoint a date.
- **Research** is not archived merely because it is old. Archive it when its useful results
  have been absorbed by named current documents and the move records those destinations.
- **Slices** remain live while they are needed to explain an accepted change. They may move
  with their assessment after the resulting behavior and decisions have been absorbed into
  the current baseline and no open work depends on the slice.

Mirror the live tree under `docs/archive/` where the repository uses a central archive, so
the former purpose remains visible from the path. Exclude archived material from ordinary
search and never cite it as current authority or current evidence.

## Use Stable Names

Living documents use stable names without dates, such as `spec.md`,
`authentication.design.md`, or `running-locally.md`. Dates belong in immutable
point-in-time material such as review checkpoints, measured baselines, and archived status
narratives. Do not combine `latest` with a date.

## Move Without Losing Readers Or Evidence

Use a rename so version control can follow the file. Apart from necessary link changes,
keep a pure move separate from content edits. Update repository links, tooling, publication
manifests, and canonical Sarathi path configuration. Do not silently rewrite the path or
hash in an approval or assessment binding. Preserve the old binding as history; changed
bytes make an approval stale, and the new document must receive the review or approval
required by [approval-gates.md](approval-gates.md).

Search for paths constructed from segments as well as literal paths. Tests and tooling may
spell one location as `Path("docs") / "designs" / name` or
`path.join("docs", "designs", name)`.

Normally, update links directly and remove the old path. Preserve a redirect or a short
compatibility page when published documentation or an external consumer relies on the old
path. Mark it clearly as compatibility-only, point to the canonical document, and exclude
it from indexes of current authority.

For a large move, keep an old-to-new path manifest and check it independently. Compare each
moved file with its earlier revision, allowing only the intended link changes, and list
every file that also received a content edit. Split mixed documents or sweep archives in a
separate review unit when combining that work would make loss or semantic change difficult
to judge.

## Add Only The Navigation The Tree Needs

Use distinct navigation surfaces when the repository is large enough to need them:

- A routing page, conventionally `docs/README.md`, answers common questions and routes by
  topic or document purpose. It links directly to files in small areas and to a maintained
  folder index in larger areas.
- A folder index lists the files below a large or easily misread folder, such as reviews or
  the archive. Generate it from document content when practical and check that generated
  output is current. Small folders should be linked directly rather than receiving another
  index.
- A review ledger tracks only current documents whose claims can drift from the code and
  whose currency is not already checked elsewhere. Each row names the document, review
  state, basis, and review date. Add this ledger only when the repository has a concrete
  recurring staleness problem or an accepted maintenance requirement.

The same document path may appear in navigation and in a currency ledger because those
surfaces answer different questions. Do not repeat summaries, status, or ownership in
several hand-maintained lists.

## Check The Chosen Convention

Every repository should check that relative documentation links resolve and that paths
recorded in Sarathi state exist. Extend the normal local quality gate and CI only for the
surfaces the repository adopts:

- a routing structure checks that every document in its declared scope is reachable;
- archive navigation checks that every archived document in its declared scope is
  reachable;
- a generated index checks that it matches the files and source fields it represents; and
- a review ledger checks that its rows refer to real documents, without missing or
  duplicate documents from the ledger's declared scope.

These checks establish path and coverage consistency. They do not prove that a document is
correct or current against the product; that requires the recorded review.

## Adopt The Convention In Reviewable Steps

1. Agree on the folder convention and why the current layout is inadequate.
2. Classify each affected file by primary use and record old and new paths.
3. Rename files and update links, tooling, and canonical Sarathi paths while preserving
   historical review and approval bindings.
4. Check the moved paths and links. Add independent review before splitting content or
   archiving documents when the move is large or content loss would be material.
5. Apply the lifecycle rules and add only the routing, indexes, ledger, and automated checks
   justified by the resulting tree.
6. Review current intent against the code separately from the mechanical reorganisation.
