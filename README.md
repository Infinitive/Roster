# T9 Media Registry

> A private, local-first media catalog and behavioral intelligence system for a personal adult media collection.

**T9 Media Registry** is a mobile-first Progressive Web App (PWA) designed to turn a large personal media collection into a structured, searchable, maintainable, and increasingly intelligent personal library.

The physical media remains on the user's external storage. The Registry is the **metadata, organization, history, analytics, discovery, and decision-support layer** that sits on top of that collection.

The project is intentionally designed around a simple principle:

> **The collection should become easier to browse, easier to maintain, and more useful over time — without requiring the user to manually maintain a complicated database.**

---

## Table of Contents

* [Overview](#overview)
* [What T9 Is](#what-t9-is)
* [Design Philosophy](#design-philosophy)
* [Core Concepts](#core-concepts)
* [Collection Organization](#collection-organization)
* [File Naming Convention](#file-naming-convention)
* [Application Architecture](#application-architecture)
* [Data Model](#data-model)
* [Storage](#storage)
* [Application Areas](#application-areas)
* [Analytics and Intelligence](#analytics-and-intelligence)
* [Discovery](#discovery)
* [Data Integrity and Reconciliation](#data-integrity-and-reconciliation)
* [Provenance and Research Metadata](#provenance-and-research-metadata)
* [PWA and Mobile Design](#pwa-and-mobile-design)
* [AI Integration](#ai-integration)
* [Project Structure](#project-structure)
* [Technology Stack](#technology-stack)
* [Getting Started](#getting-started)
* [Development Commands](#development-commands)
* [Data Import and Export](#data-import-and-export)
* [Privacy and Security](#privacy-and-security)
* [Current State](#current-state)
* [Known Limitations and Ongoing Work](#known-limitations-and-ongoing-work)
* [Design Principles for Future Development](#design-principles-for-future-development)
* [Roadmap](#roadmap)
* [License](#license)

---

# Overview

T9 Media Registry is a **local-first collection management application** for a personal adult media library.

It is not intended to host, distribute, or stream the underlying collection. Instead, it maintains structured metadata describing the files stored elsewhere.

The Registry provides a single interface for:

* browsing the collection
* viewing individual media records
* organizing content by participant count and primary category
* maintaining performers and tags
* recording viewing/session history
* maintaining a watchlist
* evaluating collection and behavioral patterns
* generating discovery recommendations
* reconciling imported metadata
* tracking data provenance
* maintaining collection settings and vocabularies
* importing and exporting registry data
* optionally bridging playback to another application

The current application is implemented as a React + TypeScript PWA with IndexedDB-backed local storage.

The repository contains the **application code and supporting metadata**, not the underlying personal media collection.

---

# What T9 Is

T9 is best understood as a **personal media intelligence layer**.

The physical collection answers:

> "What files do I have?"

The Registry is intended to answer considerably more:

> "What is this?"

> "Where does it belong?"

> "What have I watched?"

> "What consistently performs well?"

> "What have I neglected?"

> "What patterns exist across tags, performers, folders, and sessions?"

> "What should I rediscover?"

> "What should I consider next?"

> "Where is the collection metadata incomplete or inconsistent?"

The application therefore combines several traditionally separate functions:

**Library + Metadata Database + Session Journal + Analytics Engine + Discovery Engine + Data Quality System**

---

# Design Philosophy

T9 was designed around the actual way the collection is browsed and used rather than around generic media-library conventions.

## Low friction

The system should minimize unnecessary decisions.

Browsing is expected to happen primarily on a phone, often through rapid visual scanning. Metadata therefore needs to support browsing rather than obstruct it.

## One-place organization

Every physical file belongs in exactly one collection location.

The Registry should describe that canonical location rather than encourage duplicate copies or redundant categorization.

## Folders represent the primary browse signal

The folder structure deliberately remains relatively shallow.

Secondary information belongs in metadata and filenames rather than being represented by increasingly deep folder trees.

## Structure should grow from real volume

New categories should not be invented simply because a theoretical distinction exists.

Catch-all categories are allowed to function as staging areas. A coherent theme earns its own category when enough actual material accumulates to justify the additional browsing decision.

## Metadata should become more intelligent over time

A newly imported record may begin with imperfect metadata.

The system therefore distinguishes between raw information, parsed information, researched information, and user-confirmed information rather than pretending that every field is equally trustworthy.

## Analytics should support decisions

The purpose of analytics is not to produce attractive numbers for their own sake.

Useful analytics should answer questions such as:

* What is actually being used?
* What performs consistently?
* What is being overlooked?
* Which tags correlate with stronger sessions?
* Which parts of the collection are overrepresented?
* Where are there gaps?
* What should be rediscovered?

---

# Core Concepts

T9 revolves around six primary entities.

| Entity                  | Purpose                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| **Video**               | Canonical metadata record for a collection item                          |
| **Session**             | A historical viewing/session record                                      |
| **Performer**           | Normalized performer identity referenced by videos                       |
| **Tag**                 | Canonical descriptive classification                                     |
| **Watchlist Item**      | Deferred or intentional rediscovery queue                                |
| **Collection Settings** | User-controlled vocabularies, thresholds, preferences, and configuration |

These entities are stored independently and related through stable identifiers.

This allows the application to analyze relationships without duplicating metadata throughout the interface.

---

# Collection Organization

The physical collection follows a deliberately shallow hierarchy.

The primary top-level axis is **participant count**.

The conceptual structure is:

```text
Collection/
├── Favorites/
├── Solo/
│   ├── Monster & Huge/
│   ├── Public & Risky/
│   └── Other Solo/
├── Duo/
│   ├── Monster / XXL / Size/
│   ├── Hard & Rough / Intense/
│   ├── Latino / Ethnic/
│   ├── Muscle / Chav / Bro/
│   ├── Roleplay / Power / Taboo/
│   └── Other Duo/
├── Threesome/
│   ├── DP / Tag-Team / Size+Intense/
│   ├── Hard & Rough / Power/
│   └── Other Threesome/
└── Group/
    ├── Gangbang / Cumdump/
    └── Other Group/
```

The exact physical organization is governed by the collection's reference guide rather than by arbitrary application UI conventions.

## Placement algorithm

When placing a new item:

1. Determine participant count.
2. Select the corresponding top-level category.
3. Identify the strongest remaining browse signal.
4. Resolve competing signals using the established priority hierarchy.
5. Use the appropriate `Other` category when no signal is sufficiently dominant.
6. Never create duplicate physical placements.
7. Never force an ambiguous item into an overly specific category.

The current collection guide establishes the primary priority order as:

```text
Size
  ↓
Rough / Intensity
  ↓
Taboo / Power
  ↓
Muscle
  ↓
Ethnic
  ↓
Other
```

The purpose of this hierarchy is to keep browsing predictable.

---

# File Naming Convention

Physical filenames use a consistent three-part structure:

```text
Performers | Descriptive Title | Key Tags [resolution]
```

For example:

```text
Performer A & Performer B | Descriptive Scene Title | Studio, Size, Breeding, Rough [1080p]
```

The convention exists primarily because the collection is frequently browsed through a mobile file browser where thumbnails may be unreliable.

The filename therefore acts as a **compact secondary metadata display**.

Naming principles include:

* performers first
* use known performer names when available
* use `Unknown` when identity is genuinely unavailable
* use cleaned and informative descriptive titles
* use a small number of consistent key tags
* place resolution at the end
* use `|` as the visual separator
* normalize spelling and abbreviations where appropriate
* avoid unnecessary filename complexity

The application stores both original and normalized metadata where appropriate so that cleanup does not necessarily destroy provenance.

---

# Application Architecture

T9 is a client-side application organized around several layers.

```text
┌─────────────────────────────────────────┐
│              React UI                   │
│ Pages / Components / Layout / Context   │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│             Domain Engines              │
│ Analytics / Discovery / Integrity       │
│ Parsing / Reconciliation / History      │
│ Import & Export                         │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│              Data Model                 │
│ Video / Session / Performer / Tag       │
│ Watchlist / Settings                    │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│          IndexedDB Storage              │
│                idb                      │
└─────────────────────────────────────────┘
```

The architecture intentionally separates:

* presentation
* application state
* domain logic
* storage
* data definitions

This is important because analytics and integrity rules should not be buried inside individual UI components.

---

# Data Model

The central `Video` record contains both collection metadata and lifecycle information.

Conceptually, a video contains:

```text
Video
├── Identity
│   └── id
├── Physical file
│   ├── filename
│   └── relativePath
├── Organization
│   ├── participantCount
│   └── folder
├── Performers
│   ├── performerIds
│   └── performerDisplay
├── Descriptive metadata
│   ├── title
│   ├── tagIds
│   ├── originalTags
│   ├── resolution
│   └── originalResolution
├── Media metadata
│   ├── source
│   ├── duration
│   └── dateAdded
├── Personal metadata
│   ├── personalRating
│   ├── vibe
│   ├── status
│   └── notes
├── Lifecycle
│   ├── createdAt
│   └── updatedAt
└── Provenance / research
    ├── provenance
    ├── researchTitle
    ├── alternateTitle
    ├── productionStudio
    ├── releaseYear
    ├── datasetType
    └── flags
```

Sessions are independent records.

A session can reference multiple videos and contains information such as:

* date
* start time
* duration
* associated video IDs
* session rating
* orgasm status
* vibe
* whether a strong combination was present
* notes
* creation/update timestamps

This separation makes it possible to analyze **collection ownership independently from collection usage**.

---

# Storage

T9 uses **IndexedDB** through the `idb` library.

The database is named:

```text
t9-registry
```

The current schema contains stores for:

```text
videos
sessions
performers
tags
watchlist
settings
```

Indexed fields currently support common operations such as:

* folder lookup
* rating lookup
* date-added lookup
* normalized performer lookup
* normalized tag lookup
* tag-category lookup
* session-date lookup
* watchlist-by-video lookup

Database upgrades are handled through a migration layer.

On initialization, the application also performs canonical tag seeding and relationship reconciliation.

---

# Application Areas

The application currently exposes a number of distinct functional areas.

## Overview

The Overview experience provides a high-level entry point into the collection and its current state.

It is intended to answer:

> "What matters right now?"

rather than simply reproducing a database table.

---

## Collection

The Collection area provides the primary library-browsing experience.

It supports viewing the actual media records and moving from collection-level browsing into individual video details.

The UI uses reusable media-oriented components rather than relying exclusively on dense tables.

---

## Video Detail

Individual video records can be inspected and managed through a dedicated detail view.

This provides a richer representation of the metadata associated with a single item.

The detail layer also provides the appropriate location for future intelligence around an individual item's:

* usage
* ratings
* history
* related performers
* related tags
* discovery status
* metadata quality

---

## Quick Add

Quick Add is intended to make adding a new record fast.

The goal is:

```text
Identify file
    ↓
Enter essential metadata
    ↓
Validate
    ↓
Save
    ↓
Continue browsing
```

The system should not require a complete research workflow every time a new item is encountered.

Metadata can become richer later.

---

## Sessions

Sessions represent actual historical use of the collection.

Rather than treating every video as an isolated rating, session records allow T9 to understand combinations and context.

This enables future analysis such as:

```text
Video → how often used?

Tag → how often associated with strong sessions?

Performer → how often encountered?

Combination → does this group of characteristics perform well?

Time → how does behavior change?
```

---

## Watchlist

The Watchlist provides a deliberate queue for content that the user intends to revisit.

This is distinct from Favorites.

**Favorites** represent a small high-confidence working set.

**Watchlist** represents items that deserve intentional future attention.

---

## Analytics

Analytics is the collection-level intelligence layer.

It is designed to move beyond simple counts and toward relationships between:

* collection composition
* session behavior
* tags
* performers
* folders
* ratings
* time
* usage frequency
* metadata quality

The analytics engine is implemented separately from the page that displays its results.

---

## Discovery

Discovery turns analysis into actionable output.

The goal is not merely to say:

> "Here are your statistics."

It should eventually be able to say:

> "Here are the items you are most likely to want to rediscover."

Potential discovery categories include:

* Rediscover
* Unwatched
* High Signal
* Deep Cut
* underused high-value items
* collection gaps
* neglected folders
* promising tag combinations
* candidate videos

Discovery logic is intentionally separate from UI presentation.

---

## Insight

Insight provides a higher-level surface for interpreting the data produced by the analytical layer.

This allows future intelligence to be presented as conclusions and recommendations rather than requiring the user to interpret raw metrics manually.

---

## Guide

The Guide area exposes the collection's operating rules inside the application.

This is important because the organization system is not self-explanatory.

The guide documents the rules governing:

* placement
* naming
* catch-all categories
* Favorites
* maintenance
* scaling
* edge cases

The supplied Collection Guide remains the authoritative reference for those rules.

---

## Settings / More

Settings and supporting administrative functions provide access to:

* collection configuration
* vocabularies
* thresholds
* preferences
* import/export
* playback configuration
* maintenance and related utilities

---

# Analytics and Intelligence

T9's most important architectural distinction is between **data** and **intelligence**.

A UI component should not independently calculate collection statistics.

Instead:

```text
Raw records
    ↓
Domain engine
    ↓
Normalized analytical result
    ↓
UI presentation
```

This makes analytical behavior:

* testable
* reusable
* easier to audit
* easier to change
* independent of presentation

The current repository includes dedicated engines for analytics, discovery, history, integrity, parsing, reconciliation, and import/export.

---

# Behavioral Intelligence

The long-term purpose of session logging is to create a second dimension of the collection.

There are two fundamentally different questions:

### Ownership

"What exists in the collection?"

### Behavior

"What do I actually use, return to, rate highly, or overlook?"

The intelligence layer exists to compare those two.

This enables concepts such as:

```text
High ownership + high use
High ownership + low use
Low ownership + high performance
Rare + repeatedly successful
Frequently encountered + consistently weak
Unwatched + potentially high signal
```

The important insight is that **collection size does not equal collection value**.

---

# Tag Intelligence

Tags are normalized entities rather than arbitrary strings.

A tag contains:

* stable ID
* display name
* normalized name
* category
* canonical status
* synonyms
* creation metadata

The repository includes a canonical tag dataset.

This allows the system to distinguish between:

```text
Raw tag
    ↓
Normalized tag
    ↓
Canonical category
    ↓
Behavioral performance
```

The architecture is designed to support increasingly sophisticated tag analysis as sufficient session data accumulates.

---

# Performer Intelligence

Performers are also modeled independently.

This allows future analytics to answer questions such as:

* How frequently does a performer occur?
* How often are they associated with sessions?
* What is the average associated session performance?
* When were they last encountered?
* Which performers appear disproportionately in Favorites?
* Which performers are present in the collection but rarely used?

Again, the objective is not simply to create a performer directory.

It is to understand the relationship between the **metadata graph** and actual behavior.

---

# Data Integrity and Reconciliation

Because this is a relational system disguised behind a simple UI, data integrity is a first-class concern.

The repository contains dedicated integrity and reconciliation engines.

These exist to detect and repair relationships involving:

* performers
* tags
* videos
* sessions
* imported records
* canonical metadata

The reconciliation interface provides a way to inspect discrepancies rather than silently changing user data.

This distinction matters:

> **A system should not silently "fix" ambiguous metadata that the user may have intentionally chosen.**

---

# Provenance and Research Metadata

One of the more important architectural features is field-level provenance.

Metadata can have different confidence levels:

```text
raw
parsed
research-confirmed
user-confirmed
```

Optional provenance information can include:

* source
* confidence
* confirmation time
* notes

This allows the application to preserve the distinction between:

> "This is what the original file said."

and

> "This is what the system inferred."

and

> "This has been externally researched."

and

> "The user personally confirmed this."

That distinction becomes increasingly important as automated enrichment is introduced.

---

# PWA and Mobile Design

T9 is designed primarily for **mobile use**, particularly phone-sized interfaces.

The project includes:

* PWA manifest
* service worker
* Apple touch icon
* multiple application icon sizes
* maskable icon
* responsive React UI
* mobile-oriented reusable components

The application is intentionally designed around short, low-friction interactions.

Important mobile principles include:

* readable metadata
* compact cards
* large touch targets
* shallow navigation
* quick filtering
* limited visual clutter
* strong hierarchy
* minimal repetitive data entry

The physical collection itself is also optimized for phone-based browsing, which is why filenames and folder names are treated as part of the user experience rather than merely filesystem implementation details.

---

# AI Integration

The project includes Google Generative AI dependencies and an environment template for optional AI-related configuration.

AI is intended as an **augmentation layer**, not as the authoritative database.

That means AI-generated information should be treated as:

```text
Candidate information
        ↓
Parsed / normalized information
        ↓
Potential research result
        ↓
User confirmation when required
```

The application data model explicitly supports provenance so that automated enrichment can remain distinguishable from user-confirmed information.

AI should never be allowed to silently overwrite trusted user metadata merely because an automated result appears plausible.

---

# Project Structure

The repository is organized approximately as follows:

```text
T9-Media-Registry/
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── public/
│   ├── site.webmanifest
│   ├── sw.js
│   ├── favicon.svg
│   ├── favicon.ico
│   ├── favicon-96x96.png
│   ├── apple-touch-icon.png
│   ├── web-app-manifest-192x192.png
│   ├── web-app-manifest-512x512.png
│   └── brand/
│       ├── roster-logo.png
│       └── roster-wordmark.png
│
├── scripts/
│   └── generateIcons.js
│
├── src/
│   │
│   ├── components/
│   │   ├── ReconciliationPanel.tsx
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── CompactMediaRow.tsx
│   │       ├── EmptyState.tsx
│   │       ├── MediaCard.tsx
│   │       ├── PageHeader.tsx
│   │       ├── PlayButton.tsx
│   │       ├── SegmentedControl.tsx
│   │       ├── T9Mark.tsx
│   │       └── TagChip.tsx
│   │
│   ├── context/
│   │   └── PlaybackContext.tsx
│   │
│   ├── data/
│   │   ├── canonicalTags.ts
│   │   └── seedList.ts
│   │
│   ├── engines/
│   │   ├── analytics.ts
│   │   ├── discovery.ts
│   │   ├── history.ts
│   │   ├── importExport.ts
│   │   ├── integrity.ts
│   │   ├── parser.ts
│   │   └── reconciliation.ts
│   │
│   ├── layouts/
│   │   └── MainLayout.tsx
│   │
│   ├── pages/
│   │   ├── Analytics.tsx
│   │   ├── Collection.tsx
│   │   ├── Discovery.tsx
│   │   ├── Guide.tsx
│   │   ├── Insight.tsx
│   │   ├── More.tsx
│   │   ├── Overview.tsx
│   │   ├── QuickAdd.tsx
│   │   ├── SessionDetail.tsx
│   │   ├── Sessions.tsx
│   │   ├── Settings.tsx
│   │   ├── VideoDetail.tsx
│   │   └── Watchlist.tsx
│   │
│   ├── storage/
│   │   ├── db.ts
│   │   └── migrations.ts
│   │
│   ├── types/
│   │   ├── analytics.ts
│   │   ├── discovery.ts
│   │   └── index.ts
│   │
│   └── utils/
│       ├── initDb.ts
│       ├── playback.ts
│       └── selfCheck.ts
│
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── bun.lock
```

The repository currently follows this separation between UI, engines, storage, types, and utilities.

---

# Technology Stack

## Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* Lucide React

## Application / UI

* React Router
* Motion
* reusable TypeScript UI components

## Persistence

* IndexedDB
* `idb`

## Data

* UUID-based entity identifiers
* normalized performer and tag relationships
* versioned database migrations
* structured import/export

## Optional AI

* Google Generative AI SDK

## Deployment

* Vite production build
* GitHub Actions deployment workflow
* PWA assets and service worker

The current package configuration confirms the primary React, Vite, TypeScript, IndexedDB, routing, UI, motion, and AI dependencies.

---

# Getting Started

## Requirements

A current Node.js/Bun-compatible development environment is recommended.

Clone the repository:

```bash
git clone https://github.com/Infinitive/T9-Media-Registry.git
cd T9-Media-Registry
```

Install dependencies:

```bash
bun install
```

or, where appropriate:

```bash
npm install
```

Create a local environment file from the provided template if AI functionality requiring environment configuration is being used:

```bash
cp .env.example .env
```

Then start the development server:

```bash
bun run dev
```

The current development script starts Vite on port `3000` and binds to `0.0.0.0`.

---

# Development Commands

The current project exposes the following scripts:

```bash
bun run dev
```

Starts the development server.

```bash
bun run build
```

Creates a production build.

The build also creates a `404.html` copy of the application entry point for deployment environments that require SPA fallback behavior.

```bash
bun run preview
```

Serves the production build locally.

```bash
bun run lint
```

Runs the TypeScript compiler in no-emit mode.

```bash
bun run test
```

Runs the repository's self-check suite.

```bash
bun run clean
```

Removes generated build/server artifacts.

These commands correspond to the current `package.json` rather than hypothetical tooling.

---

# Data Import and Export

Because the Registry is local-first, portability is essential.

The architecture includes a dedicated import/export engine rather than coupling data portability to individual pages.

The goal is that the user's registry data should remain recoverable and portable independently of the application interface.

A healthy local-first system should make it possible to:

```text
Export
  ↓
Portable registry data
  ↓
Backup / migration / inspection
  ↓
Import
  ↓
Rebuild local database
```

Import workflows should preserve provenance and should not blindly overwrite trusted records.

---

# Privacy and Security

T9 is designed for a **private personal collection**.

The underlying media files are not part of this repository.

The application primarily stores metadata locally in the browser's IndexedDB database.

This has an important consequence:

> **Installing the application does not require uploading the physical media collection to a central T9 server.**

The repository itself should therefore never contain:

* personal media files
* private collection exports
* private screenshots
* personal session history
* private database dumps
* credentials
* API keys
* `.env` secrets

Only appropriate application code, anonymized/seed data, and project documentation should be committed.

AI integrations should be treated separately from the local-first storage model and configured explicitly.

---

# Current State

The current repository is substantially beyond a blank prototype.

The application already contains:

* React/TypeScript application structure
* routed application pages
* reusable media-oriented UI components
* IndexedDB persistence
* database migrations
* canonical tag data
* performer and tag entities
* video records
* session records
* watchlist records
* collection settings
* analytics engine
* discovery engine
* history engine
* parsing engine
* integrity engine
* reconciliation engine
* import/export engine
* provenance-aware metadata fields
* PWA manifest/service worker/assets
* playback bridge infrastructure
* automated deployment configuration
* repository self-check tooling

The current route structure includes Overview, Insight, Analytics, Discovery, Collection, Video Detail, Sessions, Watchlist, Quick Add, Guide, and supporting settings/more surfaces.

The database layer currently defines stores for videos, sessions, performers, tags, watchlist items, and settings, with migration support and relationship reconciliation.

---

# Known Limitations and Ongoing Work

T9 is an actively developed system.

Some of the intended intelligence and hardening described by the broader project specification are still being implemented.

The most important distinction is:

> **The architecture exists in several places before the complete product behavior does.**

Known areas of ongoing work include:

## Data hardening

The broader project specification calls for stronger guarantees around:

* duplicate detection
* orphan references
* participant/folder mismatches
* malformed identifiers
* tag normalization
* metadata completeness
* structural integrity
* import validation

## Analytics depth

Additional analytical families are planned or being expanded around:

* resolution performance
* temporal comparisons
* collection growth
* recent 30/90-day behavior
* performer intelligence
* folder performance
* tag-level behavioral intelligence
* diversity/concentration
* ownership-versus-use mismatches

## Discovery depth

The long-term Discovery layer is intended to produce more actionable results rather than only analytical summaries.

Examples include:

* Rediscover candidates
* Unwatched candidates
* High Signal items
* Deep Cuts
* underused high-performing items
* collection-gap opportunities

## Visual analytics

The analytical model is intended to support compact visualizations and mobile-friendly summaries as the intelligence layer matures.

## Metadata quality

Imported collections may contain incomplete metadata.

The system therefore needs to distinguish between:

* genuinely unknown data
* unavailable data
* data that has not yet been researched
* data requiring user confirmation

These should not all be treated as the same kind of error.

---

# Design Principles for Future Development

Any future contribution to T9 should preserve the following principles.

## 1. Do not turn T9 into a generic media-management application

The system is intentionally optimized for this collection and this browsing behavior.

Generic features should not be added simply because conventional media applications have them.

## 2. Keep the hierarchy shallow

Do not introduce increasingly nested navigation unless real collection volume demonstrates that it is necessary.

## 3. Keep the physical collection and Registry separate

The Registry describes the physical collection.

It does not need to become the physical collection.

## 4. Prefer relationships over duplication

Performers, tags, sessions, and videos should remain independently modeled entities.

## 5. Keep business logic out of presentation components

Analytics belong in engines.

Parsing belongs in engines.

Integrity validation belongs in engines.

UI components should render results rather than reinvent the rules.

## 6. Preserve provenance

Never erase the distinction between:

```text
Original
Parsed
Researched
Confirmed
```

## 7. Never silently destroy user data

Destructive operations should be explicit.

Imports should be cautious.

Reconciliation should be inspectable.

Migrations should be deliberate.

## 8. Design for touch first

Desktop convenience should not compromise the phone experience.

## 9. Optimize for useful decisions, not maximum metrics

A metric is only valuable if it helps the user understand, maintain, browse, or use the collection.

## 10. Do not over-engineer ahead of evidence

If a category, metric, or workflow does not solve a demonstrated problem, it probably does not belong in the core interface yet.

---

# Roadmap

The long-term development direction can be summarized as:

```text
Phase 1
────────────────────────────
Stable collection registry
Reliable local storage
Core browsing
Sessions
Watchlist
Import / Export
Data integrity
        ↓
Phase 2
────────────────────────────
Normalized metadata
Tag intelligence
Performer intelligence
Folder intelligence
Behavioral analytics
        ↓
Phase 3
────────────────────────────
Discovery engine
Opportunity analysis
Ownership vs. usage analysis
Temporal intelligence
        ↓
Phase 4
────────────────────────────
Higher-level insights
Automated metadata assistance
Research/provenance workflows
Advanced discovery
        ↓
Phase 5
────────────────────────────
Mature personal media intelligence system
```

The system should evolve incrementally rather than through large architectural rewrites.

---

# Collection Maintenance Philosophy

The collection itself follows a deliberately low-maintenance cadence.

The authoritative Collection Guide specifies:

* apply naming and placement rules whenever new files are added
* review catch-all folders when they become meaningfully large
* curate Favorites periodically
* remove true duplicates and inferior near-duplicates
* reconsider oversized folders only when meaningful subdivisions emerge
* avoid forced weekly or monthly reorganization

The intended target is approximately **12 items per folder**, with roughly **18–20 items** treated as a practical mobile-browsing ceiling.

A coherent theme reaching approximately **6–8 items** may justify promotion from an `Other` category into a dedicated folder.

These rules are intended to prevent the organizational system from becoming more burdensome than the collection itself.

---

# Why This Architecture Matters

A conventional spreadsheet can answer:

> "What is row 184?"

A conventional media player can answer:

> "What files can I play?"

T9 is intended to answer something different:

> **"Given everything I own and everything I have actually done with it, what should I know, maintain, or look at next?"**

That requires three layers working together:

```text
COLLECTION
What exists?

        +

BEHAVIOR
What actually happens?

        +

INTELLIGENCE
What should I do with that information?
```

The Registry is being built around that model.

---

# Project Status

**Status:** Active development

**Architecture:** Functional / evolving

**Storage:** Local-first IndexedDB

**Platform:** Progressive Web App

**Primary device target:** Mobile / iPhone

**Repository:** `Infinitive/T9-Media-Registry`

**Default branch:** `main`

The repository is public, but the underlying collection represented by the application is personal and private.

---

# License

The application source currently contains Apache 2.0 license headers in its TypeScript application code.

Unless the repository's top-level licensing configuration is changed, contributors should treat the existing repository license configuration as authoritative.

---

## Final Note

T9 is deliberately not trying to be the biggest, most feature-rich media database possible.

It is trying to be the **right database for one collection and one person**.

The ultimate measure of success is therefore not the number of screens, metrics, charts, or database fields.

It is whether the system makes the collection:

**easier to understand, easier to maintain, faster to browse, and smarter about what deserves attention.**
