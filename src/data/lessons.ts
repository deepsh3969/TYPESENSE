import type { Lesson, LessonCategory, LessonStage, LessonStageKind, Level } from '@/types/lesson'
import type { Difficulty } from '@/types/typing'

function stage(
  kind: LessonStageKind,
  label: string,
  text: string,
  goalAccuracy: number,
  goalWpm: number | null = null,
): LessonStage {
  return { kind, label, text, goalAccuracy, goalWpm }
}

function lesson(
  level: number,
  order: number,
  title: string,
  objective: string,
  category: LessonCategory,
  estimatedMinutes: number,
  difficulty: Difficulty,
  keys: string[],
  stages: LessonStage[],
): Lesson {
  return { id: `${level}-${order}`, level, order, title, objective, category, estimatedMinutes, difficulty, keys, stages }
}

export const LESSONS: Lesson[] = [
  // ───────────────────────────── LEVEL 1 — Keyboard Foundations
  lesson(
    1, 1, 'Home Row',
    'Land your fingers on a s d f / j k l ; and strike each key without looking.',
    'foundation', 6, 1,
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
    [
      stage('warmup', 'Warm-up — find the anchors', 'asdf jkl; asdf jkl; ;lkj fdsa ;lkj fdsa fj fj dk dk sl sl a; ;a gh gh jh jg hj gh', 85),
      stage('practice', 'Practice — home row words', 'add a dash; a glad lad; half a flask; ask dad; all fall; a sad gash; a lass asks; glass flask', 90),
      stage('challenge', 'Challenge — full sentences', 'A glad lad added salt, and dad asked for a glass flask. Shall we add half a dash to the salad?', 92),
      stage('mini-test', 'Mini test', 'Has a glad dad asked for a glass flask of salt? Add a dash, then fall back and rest your hands.', 95),
    ],
  ),
  lesson(
    1, 2, 'Left Hand',
    'Build control of the left column: q w e r t, a s d f g, z x c v b.',
    'foundation', 7, 1,
    ['q', 'w', 'e', 'r', 't', 'a', 's', 'd', 'f', 'g', 'z', 'x', 'c', 'v', 'b'],
    [
      stage('warmup', 'Warm-up — left columns', 'qwer asdf zxcv qwer asdf zxcv ws ed fc vb rq az dc fs wq we ed rf', 85),
      stage('practice', 'Practice — left-hand words', 'we said it was very easy; he gave her a bright scarf; a fast red car; she was quite excited', 90),
      stage('challenge', 'Challenge — sentences', 'The quiet weather forced us to leave early. We grabbed a red scarf and waved from the bridge.', 92),
      stage('mini-test', 'Mini test', 'A brave writer fixed the exact number of rare examples without extra effort or frantic retries.', 95),
    ],
  ),
  lesson(
    1, 3, 'Right Hand',
    'Build control of the right column: y u i o p, h j k l, n m.',
    'foundation', 7, 1,
    ['y', 'u', 'i', 'o', 'p', 'h', 'j', 'k', 'l', ';', 'n', 'm'],
    [
      stage('warmup', 'Warm-up — right columns', 'yuiop hjkl; nm,. yuiop hjkl; nm,. yh un jm ik ol p; ;p ol ki mj nu hy', 85),
      stage('practice', 'Practice — right-hand words', 'my only concern; he knew my name; you can look upon; jump over the hill; she sells shells', 90),
      stage('challenge', 'Challenge — sentences', 'You promised your brother a nice lunch on Monday, but he only hummed a quiet tune in reply.', 92),
      stage('mini-test', 'Mini test', 'In your opinion, which option would most quickly improve your position on the team?', 95),
    ],
  ),
  lesson(
    1, 4, 'F and J Anchors',
    'Use the anchor bumps to reset your hands instantly after every reach.',
    'foundation', 5, 1,
    ['f', 'j', 'd', 'k', 's', 'l', 'a', ';'],
    [
      stage('warmup', 'Warm-up — anchor taps', 'fj fj fj dk dk sl sl aj aj jf fd jk ll ;; ff jj fj dk sl a; ;a fj dk sl a;', 85),
      stage('practice', 'Practice — reset often', 'dad and dad ask; add a flask; a sad lass; half a salad; all kids fall; glass flask', 90),
      stage('challenge', 'Challenge — mindful typing', 'Keep your index fingers anchored on f and j while your other hands travel for the far keys.', 92),
      stage('mini-test', 'Mini test', 'Find your balance first: f and j hold the centre of every confident hand on the board.', 95),
    ],
  ),
  lesson(
    1, 5, 'Space Bar',
    'Drop a thumb for every space and keep an even word rhythm.',
    'foundation', 5, 1,
    [' ', 'a', 'd', 'f', 'j', 'k', 'l'],
    [
      stage('warmup', 'Warm-up — one word at a time', 'a a a a d d d d f f f f j j j j k k k k as ad af aj ak al a d f j k l a d', 85),
      stage('practice', 'Practice — short words', 'a lad had a flask; ask dad for a jar; all dads fall; a glass of water; add salt now', 90),
      stage('challenge', 'Challenge — flowing line', 'We left the house at dawn and walked to the shore, watching the calm water shift and shine.', 92),
      stage('mini-test', 'Mini test', 'Small careful steps every day will carry you farther than one hurried sprint ever could.', 95),
    ],
  ),

  // ───────────────────────────── LEVEL 2 — Reach & Control
  lesson(
    2, 1, 'Q W E R T',
    'Stretch the left top row smoothly without lifting your wrist.',
    'reach', 7, 2,
    ['q', 'w', 'e', 'r', 't'],
    [
      stage('warmup', 'Warm-up — top-left reaches', 'qw er ty qw er ty trew tree type wire quiet quite rarely tower queer vote', 85),
      stage('practice', 'Practice — words in context', 'the quiet river was quite wide; we write tiny queries; they were very eager; try to relax', 90),
      stage('challenge', 'Challenge — sentences', 'Every great writer relies on steady practice, not rare bursts of energy at midnight.', 92),
      stage('mini-test', 'Mini test', 'Write three quick queries, then wait for the weary team to reply with the report.', 95),
    ],
  ),
  lesson(
    2, 2, 'Y U I O P',
    'Reach the right top row with relaxed, deliberate motion.',
    'reach', 7, 2,
    ['y', 'u', 'i', 'o', 'p'],
    [
      stage('warmup', 'Warm-up — top-right reaches', 'yu io op yu io op union onion popup your power hurry pour oil lip your', 85),
      stage('practice', 'Practice — words in context', 'you know my opinion; our poor union; open your book; pay your dues; spin the wheel', 90),
      stage('challenge', 'Challenge — sentences', 'You would enjoy a quiet picnic by the open yard, wouldn\'t you? Bring the fruit.', 92),
      stage('mini-test', 'Mini test', 'On your own, type this line without looking down at the keyboard even once.', 95),
    ],
  ),
  lesson(
    2, 3, 'A S D F G',
    'Control the home row and the g reach with your left index.',
    'reach', 6, 2,
    ['a', 's', 'd', 'f', 'g'],
    [
      stage('warmup', 'Warm-up — home plus g', 'as df fg as df fg flag gash half glad sad asked flask glass sage gaff', 85),
      stage('practice', 'Practice — words in context', 'a glad lass asked dad; add salt to the salad; a small flag; half a glass of juice', 90),
      stage('challenge', 'Challenge — sentences', 'Dad asked us to gather fresh herbs from the garden before dusk fell over the yard.', 92),
      stage('mini-test', 'Mini test', 'A slight shift in habits can drastically change your daily results over one year.', 95),
    ],
  ),
  lesson(
    2, 4, 'H J K L',
    'Pair the h reach with your right index while j stays anchored.',
    'reach', 6, 2,
    ['h', 'j', 'k', 'l', ';'],
    [
      stage('warmup', 'Warm-up — home plus h', 'hj kl jk lh hj kl jk lh shall laugh look ask hall lash hook kill', 85),
      stage('practice', 'Practice — words in context', 'he will ask; the lads shall call; she likes all kinds of salad; look left first', 90),
      stage('challenge', 'Challenge — sentences', 'The old clock on the hall wall struck four, and the kitchen filled with warm light.', 92),
      stage('mini-test', 'Mini test', 'Kill the habit of looking down and let your hands learn the layout for themselves.', 95),
    ],
  ),
  lesson(
    2, 5, 'Z X C V B',
    'Curl down to the bottom-left row without twisting your wrist.',
    'reach', 7, 2,
    ['z', 'x', 'c', 'v', 'b'],
    [
      stage('warmup', 'Warm-up — bottom-left', 'zx cv bn zx cv bn buzz cave vine box zebra brave very quick comb best', 85),
      stage('practice', 'Practice — words in context', 'a brave boy visited the cave; buy cheap boxes; the movie was very nice; move with care', 90),
      stage('challenge', 'Challenge — sentences', 'Brave explorers value curiosity, but they always double check their gear before departure.', 92),
      stage('mini-test', 'Mini test', 'Even complex puzzles become simple once you break them into smaller deliberate moves.', 95),
    ],
  ),
  lesson(
    2, 6, 'N and M',
    'Close the gap between your right index and the bottom centre keys.',
    'reach', 5, 2,
    ['n', 'm'],
    [
      stage('warmup', 'Warm-up — centre bottom', 'nm nm mn nm mn mine name man many number nimble minor mood moon', 85),
      stage('practice', 'Practice — words in context', 'my name is norman; many men know; a new moon; numbers matter; calm and steady', 90),
      stage('challenge', 'Challenge — sentences', 'Many beginners underestimate how much rhythm matters once speed increases over time.', 92),
      stage('mini-test', 'Mini test', 'Ninety nine men never mentioned the enormous silver monument near the main road.', 95),
    ],
  ),

  // ───────────────────────────── LEVEL 3 — Accuracy
  lesson(
    3, 1, 'Common Words',
    'Make the fifty most frequent English words automatic.',
    'accuracy', 8, 3,
    [],
    [
      stage('warmup', 'Warm-up — top words', 'the and for you are with this that have from they will can one all', 88),
      stage('practice', 'Practice — words in context', 'you can have that one; they are going to the market; we will see you there; and this too', 92),
      stage('challenge', 'Challenge — paragraph', 'The people who read every day tend to write with more confidence and far less hesitation.', 94),
      stage('mini-test', 'Mini test', 'This is the kind of sentence you will type a thousand times in the next year.', 96),
    ],
  ),
  lesson(
    3, 2, 'Common Bigrams',
    'Smooth out the letter pairs that carry English: th, he, er, in, an, re…',
    'accuracy', 8, 3,
    [],
    [
      stage('warmup', 'Warm-up — pair bursts', 'th he er in an re on at en nd ti es or te of ed is it al ar st to nt', 88),
      stage('practice', 'Practice — pairs in context', 'there is another path; when they enter the room; her idea is fine; on the road again', 92),
      stage('challenge', 'Challenge — paragraph', 'Strength grows when honest practice meets patient attention to the smallest details.', 94),
      stage('mini-test', 'Mini test', 'Instead of guessing, reenter the numbers and check them once more before sending.', 96),
    ],
  ),
  lesson(
    3, 3, 'Common Trigrams',
    'Lock in three-letter units: the, ing, and, ion, ent, her.',
    'accuracy', 8, 3,
    [],
    [
      stage('warmup', 'Warm-up — triple bursts', 'the ing and ion ent her tha int ere tio ter est ers ati hat ate all eth', 88),
      stage('practice', 'Practice — triples in context', 'nothing changes without action; the answer is within reach; she is interested in training', 92),
      stage('challenge', 'Challenge — paragraph', 'The important thing is not winning every argument but understanding each point being made.', 94),
      stage('mini-test', 'Mini test', 'Nothing in this direction requires enormous effort, only consistent attention repeated daily.', 96),
    ],
  ),
  lesson(
    3, 4, 'Capitalization',
    'Shift cleanly for capitals without losing your rhythm.',
    'accuracy', 6, 3,
    [],
    [
      stage('warmup', 'Warm-up — shift taps', 'A The And But Or When With This That From Have They You Will Can Every Next', 88),
      stage('practice', 'Practice — proper nouns', 'Alice And Bob Went To Paris. Every Tuesday We Train. The Quick Brown Fox. Hello There Friend.', 92),
      stage('challenge', 'Challenge — sentences', 'Every New Year Begins With Quiet Reflection And Honest Intentions For The Months Ahead.', 94),
      stage('mini-test', 'Mini test', 'Mistakes Are Data, Not Verdicts. Keep Practicing And Stay Curious About Your Progress.', 96),
    ],
  ),
  lesson(
    3, 5, 'Punctuation',
    'Handle . , ; : ! ? " ( ) - without breaking your cadence.',
    'accuracy', 8, 3,
    ['.', ',', ';', ':', '!', '?', '"', "'", '(', ')', '-'],
    [
      stage('warmup', 'Warm-up — symbol taps', '. , . , . , ; : ! ? " ( ) - . , ; : ! ? " ( ) - x , y . z ; a : b ! c ? d', 85),
      stage('practice', 'Practice — punctuated sentences', 'Wait, really? She said, "yes." (Almost done.) Check the time: 4:30 or so; then leave.', 90),
      stage('challenge', 'Challenge — heavier punctuation', 'The best weeks look like this: plan, do, review — then rest before the next push begins.', 92),
      stage('mini-test', 'Mini test', 'Ready? Breathe. Type "steady beats fast," then check your rhythm once more before continuing.', 95),
    ],
  ),

  // ───────────────────────────── LEVEL 4 — Speed
  lesson(
    4, 1, 'Short Drills',
    'Bursts of clean typing that build raw speed safely.',
    'speed', 6, 3,
    [],
    [
      stage('warmup', 'Warm-up — easy pace', 'type this line without stopping type with a steady pulse keep your hands light and loose', 90),
      stage('practice', 'Practice — controlled burst', 'speed is a byproduct of accuracy; start slow and finish clean; rhythm beats tension every time', 92),
      stage('challenge', 'Challenge — push the pace', 'Ship small improvements daily, and compounding will do the heavy lifting for you.', 93, 35),
      stage('mini-test', 'Mini test', 'Measure twice, cut once, and keep your wrists floating above the desk the whole run.', 95, 35),
    ],
  ),
  lesson(
    4, 2, 'Sentence Drills',
    'Hold accuracy across longer, more varied sentences.',
    'speed', 7, 3,
    [],
    [
      stage('warmup', 'Warm-up — simple sentences', 'She sold sea shells. The clock ticks. Pack my box with five dozen jugs.', 90),
      stage('practice', 'Practice — steady flow', 'We judge fairly, we speak clearly, and we keep our promises under real pressure.', 92),
      stage('challenge', 'Challenge — longer sentences', 'A great paragraph is really a chain of sentences that each carry their own weight.', 93, 35),
      stage('mini-test', 'Mini test', 'The fastest typists are simply the ones who stopped fighting their mistakes and learned from them.', 95, 35),
    ],
  ),
  lesson(
    4, 3, 'Paragraph Drills',
    'Sustain rhythm across a full paragraph without crashing.',
    'speed', 9, 4,
    [],
    [
      stage('warmup', 'Warm-up — short paragraph', 'Focus on rhythm first. Speed will follow naturally. Accuracy is the foundation of pace.', 90),
      stage('practice', 'Practice — full paragraph', 'Good habits form quietly. You sit down, you practise for ten minutes, you note one thing to improve, and you leave. Over weeks, those notes become a curriculum written just for you.', 92),
      stage('challenge', 'Challenge — sustained focus', 'The most useful feedback is specific. Instead of "type better", say "settle the left hand before the stretch". Small targets create small wins, and small wins compound into real skill over months.', 93, 35),
      stage('mini-test', 'Mini test', 'Consistency is a quiet superpower. A modest session every day beats an occasional marathon, because your hands remember rhythm far better than they remember effort.', 95, 35),
    ],
  ),
  lesson(
    4, 4, 'Timed Challenges',
    'Run against the clock while keeping your form intact.',
    'speed', 6, 4,
    [],
    [
      stage('warmup', 'Warm-up — pre-run', 'one two three go keep the pace even no sprinting settle in breathe out', 90),
      stage('practice', 'Practice — thirty clean seconds', 'Thirty seconds of clean typing teaches more than five minutes of flailing. Hold your form.', 92),
      stage('challenge', 'Challenge — full sprint', 'When the timer starts, forget the timer. Let your eyes lead and your hands follow the words.', 93, 40),
      stage('mini-test', 'Mini test', 'This is your measured run: steady, smooth, and accurate from the first key to the very last.', 95, 40),
    ],
  ),

  // ───────────────────────────── LEVEL 5 — Mastery
  lesson(
    5, 1, 'Long-form Typing',
    'Type page-length prose with consistent rhythm and posture.',
    'mastery', 12, 5,
    [],
    [
      stage('warmup', 'Warm-up — easing in', 'long form typing rewards patience and steady posture in equal measure every single day', 90),
      stage('practice', 'Practice — sustained passage', 'There is a particular pleasure in watching a difficult thing become ordinary. The first time you touch type, every key feels like a small decision. The hundredth time, your hands simply go, and you begin thinking about words instead of letters.', 92),
      stage('challenge', 'Challenge — page-length focus', 'Good design is mostly subtraction. Every element on a screen competes for the same scarce resource, which is the users attention, and the ones that do not earn their place should be removed without ceremony. The discipline lies in asking whether a feature helps someone finish what they came to do.', 93, 40),
      stage('mini-test', 'Mini test', 'Engineering is the art of trading one problem for a better one. You cannot remove complexity from a system, only move it to where it does the least harm. A good abstraction moves complexity behind a clean edge.', 95, 40),
    ],
  ),
  lesson(
    5, 2, 'Technical Text',
    'Handle dense technical vocabulary at speed.',
    'mastery', 10, 5,
    [],
    [
      stage('warmup', 'Warm-up — technical terms', 'throughput latency bandwidth index cache queue thread process buffer stream socket compile', 90),
      stage('practice', 'Practice — technical prose', 'The scheduler queues each request, measures its latency, and writes the result to a rolling index kept in memory. If the cache misses, the process falls back to disk and reports the added overhead.', 92),
      stage('challenge', 'Challenge — dense specification', 'A vector store returns approximate nearest neighbours within a defined tolerance, trading exactness for throughput. Choose the tolerance carefully: too wide and results drift, too narrow and the index rebuilds constantly.', 93, 40),
      stage('mini-test', 'Mini test', 'Every abstraction carries a cost. Measure the compilation budget, profile the buffer, and verify that the tensor kernel launches without stalling the pipeline.', 95, 40),
    ],
  ),
  lesson(
    5, 3, 'Code Typing',
    'Type real code with braces, arrows, and tight spacing.',
    'mastery', 12, 5,
    ['{', '}', '(', ')', '=', ';', ':', '/', '>', '-'],
    [
      stage('warmup', 'Warm-up — code symbols', 'const sum = (a, b) => a + b; if (x === null) return []; // note: cache enabled', 85),
      stage('practice', 'Practice — small function', 'function average(list) { const total = list.reduce((a, b) => a + b, 0); return total / list.length; }', 90),
      stage('challenge', 'Challenge — async code', 'async function loadUser(id) { const res = await fetch(`/users/${id}`); if (!res.ok) return null; return res.json(); }', 92, 40),
      stage('mini-test', 'Mini test', 'export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n)); // keeps values in range', 93, 40),
    ],
  ),
  lesson(
    5, 4, 'Numbers',
    'Type digits and mixed alphanumeric strings accurately.',
    'mastery', 10, 5,
    ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    [
      stage('warmup', 'Warm-up — digit runs', '1 2 3 4 5 6 7 8 9 0 10 11 12 13 14 15 16 17 18 19 20 30 40 50 100 128 256', 88),
      stage('practice', 'Practice — realistic data', 'Order 5 boxes of 24 units each; total 120; invoice #4821; due 12/04/2026; ref 77-3x.', 92),
      stage('challenge', 'Challenge — mixed records', 'In 2025, 38% of 1,412 respondents replied within 48 hours, with an average wait of 6.4 minutes.', 93, 40),
      stage('mini-test', 'Mini test', 'Batch 9F-2048 shipped 760 units on 03/17 at 14:20, covering orders #55120 through #55196.', 95, 40),
    ],
  ),
  lesson(
    5, 5, 'Mixed Punctuation',
    'Flow through quotes, brackets, dashes, and symbols without pausing.',
    'mastery', 12, 5,
    ['.', ',', ';', ':', '!', '?', '"', "'", '(', ')', '-', '/', '@', '#'],
    [
      stage('warmup', 'Warm-up — symbol rhythm', 'a, b; c: d! e? "f" (g) - h / i @ j # k (m), n; o: p! q? r, s', 85),
      stage('practice', 'Practice — punctuated prose', 'The brief said: "ship it Friday" (if the tests pass), then notify #team-ops — no exceptions.', 90),
      stage('challenge', 'Challenge — heavy punctuation', 'Consider three rules: (1) start small; (2) measure honestly; (3) iterate — "perfection is a lagging indicator."', 92, 40),
      stage('mini-test', 'Mini test', 'Final check — quotes, dashes, and brackets all in place; count 1,247 rows; status: "done."', 93, 40),
    ],
  ),
]

export const LEVELS: Level[] = [1, 2, 3, 4, 5].map((level) => {
  const lessons = LESSONS.filter((l) => l.level === level)
  const first = lessons[0]
  return {
    level,
    title: ['Keyboard Foundations', 'Reach & Control', 'Accuracy', 'Speed', 'Mastery'][level - 1],
    objective: [
      'Build the muscle memory your hands will rely on forever.',
      'Reach every row with relaxed, controlled motion.',
      'Turn common words, pairs, and punctuation into reflexes.',
      'Convert accuracy into real, repeatable speed.',
      'Type long, technical, and symbolic text with composure.',
    ][level - 1],
    category: (first?.category ?? 'foundation') as LessonCategory,
    lessonIds: lessons.map((l) => l.id),
  }
})

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id)
}
