import LetterWords2 from './all-words/2-letter-words.json';
import LetterWords3 from './all-words/3-letter-words.json';
import LetterWords4 from './all-words/4-letter-words.json';
import LetterWords5 from './all-words/5-letter-words.json';
import LetterWords6 from './all-words/6-letter-words.json';
import LetterWords7 from './all-words/7-letter-words.json';
import LetterWords8 from './all-words/8-letter-words.json';
import LetterWords9 from './all-words/9-letter-words.json';
import LetterWords10 from './all-words/10-letter-words.json';
import LetterWords11 from './all-words/11-letter-words.json';
import LetterWords12 from './all-words/12-letter-words.json';
import LetterWords13 from './all-words/13-letter-words.json';
import LetterWords14 from './all-words/14-letter-words.json';
import LetterWords15 from './all-words/15-letter-words.json';

export const Words4OrLonger: Set<string> = new Set([
    ...LetterWords4.map(w => w.word.toUpperCase()),
    ...LetterWords5.map(w => w.word.toUpperCase()),
    ...LetterWords6.map(w => w.word.toUpperCase()),
    ...LetterWords7.map(w => w.word.toUpperCase()),
    ...LetterWords8.map(w => w.word.toUpperCase()),
    ...LetterWords9.map(w => w.word.toUpperCase()),
    ...LetterWords10.map(w => w.word.toUpperCase()),
    ...LetterWords11.map(w => w.word.toUpperCase()),
    ...LetterWords12.map(w => w.word.toUpperCase()),
    ...LetterWords13.map(w => w.word.toUpperCase()),
    ...LetterWords14.map(w => w.word.toUpperCase()),
    ...LetterWords15.map(w => w.word.toUpperCase()),
]);