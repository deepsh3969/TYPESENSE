/** High-frequency English words, loosely frequency-ordered. */
export const COMMON_WORDS: string[] = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
  'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up',
  'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
  'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
  'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
  'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
  'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'was', 'are',
  'been', 'has', 'had', 'did', 'said', 'each', 'great', 'should', 'very', 'through', 'much',
  'more', 'where', 'much', 'help', 'life', 'need', 'too', 'still', 'feel', 'three', 'state',
  'never', 'same', 'another', 'while', 'last', 'might', 'us', 'right', 'old', 'kind', 'hand',
  'high', 'keep', 'begin', 'seem', 'country', 'place', 'week', 'against', 'company', 'system',
]

/** Words that commonly trip people up — used for weak-word drills and lessons. */
export const TRICKY_WORDS: string[] = [
  'through', 'thought', 'although', 'rough', 'enough', 'brought',
  'there', 'their', 'they', 'three', 'threshold', 'throw',
  'which', 'while', 'white', 'whether', 'wheel', 'world',
  'because', 'become', 'before', 'between', 'behind', 'below',
  'question', 'quick', 'quiet', 'quite', 'queue', 'quicker',
  'necessary', 'occasion', 'occasionally', 'accept', 'except',
  'definitely', 'separate', 'separately', 'relevant', 'privilege',
  'government', 'environment', 'development', 'advertisement',
  'business', 'businesses', 'calendar', 'colleague', 'commitment',
  'different', 'difficult', 'experience', 'experiment',
  'memory', 'minute', 'probably', 'problem', 'program',
  'really', 'receive', 'remember', 'recommend', 'restaurant',
  'success', 'successful', 'surprise', 'though', 'throughout',
  'usually', 'variable', 'variety', 'vegetable', 'vehicle',
  'whether', 'woman', 'women', 'writing', 'written',
]

/** Technical / code-flavoured tokens for the mastery level. */
export const TECHNICAL_TOKENS: string[] = [
  'const', 'function', 'return', 'import', 'export', 'interface',
  'async', 'await', 'promise', 'reduce', 'filter', 'map',
  'array', 'object', 'string', 'number', 'boolean', 'undefined',
  'index', 'length', 'value', 'true', 'false', 'null',
  'class', 'extends', 'public', 'private', 'static',
  'graph', 'query', 'table', 'cache', 'queue', 'stack',
  'pointer', 'buffer', 'stream', 'socket', 'thread', 'process',
  'binary', 'vector', 'matrix', 'tensor', 'kernel', 'compile',
]

export const PUNCTUATION_TOKENS: string[] = [
  '.', ',', ';', ':', '!', '?', '"', "'", '(', ')', '-', '/',
]

export const NUMBER_TOKENS: string[] = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '24', '31', '42', '57', '63', '78', '85', '96', '100', '128',
  '256', '512', '1024', '2048', '4096',
]

/** Letter bigrams ranked by English frequency — used for combination drills. */
export const COMMON_BIGRAMS: string[] = [
  'th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd', 'ti', 'es', 'or', 'te',
  'of', 'ed', 'is', 'it', 'al', 'ar', 'st', 'to', 'nt', 'ng', 'se', 'ha', 'as', 'ou',
  'io', 'le', 've', 'co', 'me', 'de', 'hi', 'ri', 'ro', 'ic', 'ne', 'ea', 'ra', 'ce',
]

export const COMMON_TRIGRAMS: string[] = [
  'the', 'ing', 'and', 'ion', 'ent', 'her', 'tha', 'nth', 'int', 'ere', 'tio', 'ter',
  'est', 'ers', 'ati', 'hat', 'ate', 'all', 'eth', 'his', 'ect', 'for', 'ith', 'ver',
]
