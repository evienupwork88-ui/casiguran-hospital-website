# 0001 - Bounded CMS Spreadsheet Batches

Date: 2026-10-29
Status: Accepted

## Context

Editors need to add repeatable CMS records in batches without bypassing the
existing Super Admin approval flow. Spreadsheet imports cannot carry uploaded
PDFs or training images, and FAQ removal is an archive operation rather than a
permanent delete.

## Decision

- Parse `.xlsx` workbooks in the browser with `read-excel-file`; provide
  Excel-compatible CSV header templates and validate a row preview before
  submission.
- Limit each import request to 25 records and each bulk action to 100 IDs.
- Send each batch through authenticated, CSRF-protected backend endpoints that
  validate with the existing Zod schemas and use the existing approval
  middleware.
- Report row-level partial failures explicitly. FAQ bulk removal sets
  `is_active` to false; document metadata imports may reference only files
  already uploaded through Documents.
- Keep document and training image uploads in their existing upload flows.

## Consequences

Large workbooks must be split into multiple imports. Database operations are
processed sequentially and are not transactional; the response identifies
successful and failed rows so partial completion is visible. Editors submit
one approval request per batch.
