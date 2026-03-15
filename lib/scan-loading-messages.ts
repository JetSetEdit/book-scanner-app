/**
 * Shared scan progress flavour text for the main scan page and sandbox.
 * First message = scan-specific; last = result; middle = random from pool.
 */

/** Pick n random items from array without replacement (Fisher–Yates slice). */
export function pickRandom<T>(array: T[], n: number): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

export const SCAN_FIRST_MESSAGE = "📚 Finding your book..."

export function getScanLastMessage(warningCount?: number): string {
  if (warningCount === undefined || warningCount === null) {
    return "✅ Scan complete."
  }
  if (warningCount === 0) {
    return "✅ Scan complete — no warnings found."
  }
  return `✅ Scan complete — ${warningCount} warning${warningCount === 1 ? "" : "s"} found.`
}

/** Quick = 3 middle messages, deep = 5. Same pool for both. */
export const MIDDLE_COUNT_QUICK = 3
export const MIDDLE_COUNT_DEEP = 5

/** Interval (ms) between showing each middle message. */
export const FLAVOUR_MESSAGE_INTERVAL_MS = 1800

/** Pool of 100 flavour strings for the middle of the progress sequence. */
export const LOADING_FLAVOUR_TEXT: string[] = [
  "Judging the book by its cover (just this once)...",
  "Checking if the butler did it...",
  "Asking our book club to weigh in...",
  "Looking for red flags and dog-eared pages...",
  "Reading the fine print...",
  "Checking between the chapters...",
  "Consulting the index under 'concerning'...",
  "Skipping to the good bits...",
  "Speed-reading so you don't have to...",
  "Flipping to the back to check the ending...",
  "Currently in our reading era...",
  "Our literary detectives are on the case...",
  "Putting on our reading glasses...",
  "Annotating furiously...",
  "Highlighting anything suspicious in yellow...",
  "Cross-referencing with our book club notes...",
  "Shushing everyone so we can focus...",
  "Arguing with a librarian...",
  "Filing the Dewey Decimal paperwork...",
  "Trying not to spoil it...",
  "We've got you covered...",
  "Almost there — good things take a moment...",
  "Making sure you can read worry-free...",
  "Your reading comfort matters to us...",
  "One sec — we're doing the reading for you...",
  "Looking out for you and your bookshelf...",
  "Giving this one a proper look...",
  "Reading carefully so you can read confidently...",
  "Just making sure this one's right for you...",
  "We read it so you can decide...",
  "Taking our time to get this right...",
  "Almost ready to report back...",
  "Doing our homework on this one...",
  "Turning the pages on your behalf...",
  "Your book, your comfort — we're on it...",
  "Cross-referencing our marginalia...",
  "Consulting the appendix...",
  "Checking our first edition for discrepancies...",
  "Invoking the spirit of our local librarian...",
  "Referencing our annotated bibliography...",
  "Scanning the foreword for clues...",
  "Checking if this is part of a series...",
  "Mentally cataloguing under 'handle with care'...",
  "Comparing notes with Goodreads in our head...",
  "Brushing up on our genre conventions...",
  "Analysing narrative tension...",
  "Reviewing the author's previous works...",
  "Consulting our worn-out copy of the style guide...",
  "Parsing the subtext (it's literally our job)...",
  "Checking the colophon for good measure...",
  "Making a note in the margins...",
  "Applying the Bechdel test and then some...",
  "Sourcing a second opinion from our reading group...",
  "Brushing up on our literary theory...",
  "Treating this with the care of a rare manuscript...",
  "Bribing the librarian with biscuits...",
  "Waking up the night-shift book gnomes...",
  "Asking our resident bookworm (literally)...",
  "Untangling a particularly complex plot thread...",
  "Negotiating with the fiction department...",
  "Convincing the bibliography to cooperate...",
  "Calling in a favour from a retired English teacher...",
  "Interrogating the protagonist...",
  "Making a cup of tea before the difficult chapters...",
  "Our hamster is running the wheel extra fast...",
  "Putting on our serious literary face 🧐...",
  "Spilling tea on the manuscript — mopping it up...",
  "Having a stern word with the antagonist...",
  "Checking under the dustjacket...",
  "Decoding the author's suspiciously neat handwriting...",
  "Asking the cat if she's read it — she has...",
  "Consulting the prophecy on page 394...",
  "Accidentally reading ahead — oops...",
  "Blaming the dog for the delay...",
  "Reticulating the plot splines...",
  "Reading between the lines...",
  "Cracking open the pages...",
  "Flipping through the chapters...",
  "Flagging anything worth a heads-up...",
  "Taking notes on your behalf...",
  "Running our eyes over this one...",
  "Putting the kettle on and getting to work...",
  "Our readers have weighed in...",
  "Closing the book on this one soon...",
  "Checking our notes from last time...",
  "Turning the last few pages...",
  "Wrapping up our review...",
  "Adding our bookmarks...",
  "Almost at the end of the chapter...",
  "Putting the book down in a moment...",
  "Jotting down our final thoughts...",
  "Finishing our review before the library closes...",
  "One last look before we report back...",
  "Dotting the i's and crossing the t's...",
  "Nearly done — no spoilers, we promise...",
  "Checking the blurb for hidden clues...",
  "Consulting our trusty highlighter...",
  "Making sure the ending doesn't shock you...",
  "Running a quick content check...",
  "One more page and we're there...",
]

/** Build the list of middle messages for a run (quick = 3, deep = 5). */
export function getMiddleFlavourMessages(mode: "quick" | "deep"): string[] {
  const n = mode === "quick" ? MIDDLE_COUNT_QUICK : MIDDLE_COUNT_DEEP
  return pickRandom(LOADING_FLAVOUR_TEXT, n)
}
