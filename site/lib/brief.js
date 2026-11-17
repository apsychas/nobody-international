// What we are looking for, where we look, and where we must not look.
// The private scout page reads everything from here. (scout/brief.py is the
// same brief for the command-line tool.)

export const ARCHETYPE = `We are looking for a person, not a film. The person has these traits:

1. INSIDE. They hold an ordinary job or role inside a place outsiders cannot
   film: a school, clinic, mine, port, barracks, parish, call centre, prison,
   town hall, factory floor, fishing fleet, border post.
2. ALREADY RECORDING. They film, photograph, record or write for mundane
   reasons: school videographer, wedding filmer, parish archivist, union
   newsletter, a tiny channel about their town, a diary.
3. A TURN. Something in their world changed and they could not unsee it.
   The story is under way now, not finished.
4. A VOICE. In their own posts, letters or videos they are funny, angry,
   tender, specific. You would follow this person for ninety minutes.
5. WANTS TO TELL IT. This is the trait that matters most. They show, in
   public and in their own name, that they want their story told.
6. NOT YET IN THE INDUSTRY. Some video experience is welcome and often a good
   sign: Pavel Talankin filmed school events for a living. Local recognition is
   fine too: a town, regional or national prize, a local contest win. What rules
   a person out is any international prize or award, or an established film or
   media career: international festival credits, a production company, an
   agent, a press team.
7. NOWHERE. They live where nobody is looking: a small town, a periphery,
   a language that film funds rarely read.`;

export const RUBRIC = {
  access: 'Are they inside something outsiders cannot film?',
  habit: 'Do they already record, for ordinary reasons?',
  turn: 'Is something changing around them right now?',
  voice: 'Is their own voice distinctive on the page or on camera?',
  drive: 'Do they visibly want to tell this story themselves?',
  undiscovered: 'Are they outside the film industry and the national press? (Amateur or workplace video experience and local prizes do not count against them; any international prize scores 0.)',
}; // each scored 0-3; 18 is the ceiling

export const LANES = {
  'local-press': 'Regional and small-town news sites: profiles of ordinary workers who document their workplace, town or community.',
  'first-person': "Open letters, resignation letters, long first-person posts and essays published under the author's own name.",
  'small-channels': 'Very small video or audio channels (under ~20k followers) run by workers or residents documenting daily life from inside.',
  'community-archives': 'Village chroniclers, home-movie keepers, parish, union and school archivists, community radio hosts.',
  'first-timers': 'Public lists from community media workshops, first-film labs and local storytelling contests: applicants and local winners alike.',
};

// Where being identified as someone with a critical story can cost a person
// their job, freedom or family's safety. The scout names no individuals here;
// it maps intermediaries who could carry an open call. Review this list with a
// press-freedom organisation.
export const HIGH_RISK = new Set([
  'Afghanistan', 'Azerbaijan', 'Belarus', 'China', 'Cuba', 'Egypt', 'Eritrea',
  'Ethiopia', 'Iran', 'Myanmar', 'Nicaragua', 'North Korea', 'Russia',
  'Saudi Arabia', 'Syria', 'Tajikistan', 'Turkmenistan', 'Venezuela', 'Vietnam',
]);

export const REGIONS = [
  ['Brazil', ['Portuguese']], ['Mexico', ['Spanish', 'Nahuatl']],
  ['Colombia', ['Spanish']], ['Peru', ['Spanish', 'Quechua']],
  ['Nigeria', ['English', 'Yoruba', 'Hausa', 'Nigerian Pidgin']],
  ['Kenya', ['Swahili', 'English']], ['Ghana', ['English', 'Twi']],
  ['South Africa', ['English', 'isiZulu', 'Afrikaans']],
  ['Senegal', ['French', 'Wolof']], ['DR Congo', ['French', 'Lingala', 'Swahili']],
  ['India', ['Hindi', 'Tamil', 'Bengali', 'Marathi', 'Malayalam']],
  ['Pakistan', ['Urdu', 'Punjabi']], ['Bangladesh', ['Bengali']],
  ['Indonesia', ['Indonesian', 'Javanese']], ['Philippines', ['Tagalog', 'Cebuano']],
  ['Thailand', ['Thai']], ['Japan', ['Japanese']], ['South Korea', ['Korean']],
  ['Turkey', ['Turkish', 'Kurdish']], ['Georgia', ['Georgian']],
  ['Armenia', ['Armenian']], ['Kazakhstan', ['Kazakh', 'Russian']],
  ['Ukraine', ['Ukrainian']], ['Poland', ['Polish']], ['Hungary', ['Hungarian']],
  ['Serbia', ['Serbian']], ['Romania', ['Romanian']], ['Moldova', ['Romanian', 'Russian']],
  ['Lebanon', ['Arabic']], ['Tunisia', ['Arabic', 'French']], ['Morocco', ['Arabic', 'Tamazight', 'French']],
  ['United States', ['English', 'Spanish']], ['Greenland', ['Kalaallisut', 'Danish']],
  ['Russia', ['Russian']], ['Belarus', ['Belarusian', 'Russian']],
  ['Iran', ['Persian']], ['China', ['Chinese']], ['Myanmar', ['Burmese']],
  ['Venezuela', ['Spanish']], ['Egypt', ['Arabic']],
];
