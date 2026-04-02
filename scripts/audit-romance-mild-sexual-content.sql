-- QA sample: romance-tagged books with only mild sexual_content warnings (no moderate/severe anywhere).
-- Use for human severity calibration — not for auto-upgrading ratings.
-- Adjust romance filter if your schema stores genres differently (e.g. JSONB categories array).

SELECT b.isbn,
       b.title,
       b.author
FROM books b
JOIN content_warnings cw ON cw.book_id = b.id
WHERE (cw.category_id = 'sexual_content' OR cw.category::text = 'sexual_content')
  AND cw.severity = 'mild'
  AND (
    b.categories::text ILIKE '%romance%'
    OR b.categories::text ILIKE '%Romantic%'
    OR b.categories::text ILIKE '%Contemporary%'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM content_warnings cw2
    WHERE cw2.book_id = b.id
      AND cw2.severity IN ('moderate', 'severe')
  )
GROUP BY b.id, b.isbn, b.title, b.author
ORDER BY b.title
LIMIT 200;
