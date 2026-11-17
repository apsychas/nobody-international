// What we are looking for, where we look, and where we must not look.
// The private scout page reads everything from here. (scout/brief.py is the
// same brief for the command-line tool.)

export const ARCHETYPE = `We are looking for a person, not a film: someone with a unique perspective during difficult or unprecedented times.

The model is Pavel Talankin, a school videographer in a small Russian town. When the war began he was told to film children reciting support for it. He saw a call for stories, answered with a long, angry letter, kept filming for two years, and the film won an Oscar. But the next person need not resemble him. What they share is this:

1. A UNIQUE PERSPECTIVE. They see something from where they stand that almost
   nobody else can show: from inside an institution, a job, a family, a street,
   a profession, a community. Ordinary position, extraordinary view.
2. DIFFICULT OR UNPRECEDENTED TIMES. Something large is happening around them
   now: a war, a crackdown, a disaster, an epidemic, a collapse, a closure, a
   mass departure, a sudden new rule, a change nobody there has lived through
   before. The story is still under way.
3. A VOICE. In their own posts, letters, recordings or interviews they are
   funny, angry, tender, specific. You would follow them for ninety minutes.
4. THEY WANT TO TELL IT. They already speak, post, write or film in their own
   name, or have asked to be heard.
5. THEY KEEP A RECORD. Video, photographs, diaries, voice notes, documents.
   Strongest when recording is part of their job or routine and goes back years.
6. NOT YET FOUND. Some film experience, local prizes and local press are fine.
   Only international prize winners and established film or media
   professionals are out.`;

export const RUBRIC = {
  perspective: 'Do they see this from a position almost nobody else can show?',
  moment: 'Are they living through difficult or unprecedented times right now, with the story still under way?',
  voice: 'Is their own voice distinctive on the page or on camera?',
  drive: 'Do they visibly want to tell this story themselves?',
  record: 'Do they already keep a record (video, photos, diaries, documents)? Highest when it is part of their job or goes back years.',
  undiscovered: 'Are they still unknown to the film world and international press? (Local prizes, local press and amateur film experience do not count against them.)',
}; // each scored 0-3; 18 is the ceiling

export const LANES = {
  'witnesses': 'First-hand accounts from people living through an upheaval right now: a war, flood, epidemic, closure, strike, crackdown or mass departure, told from where they stand.',
  'local-press': 'Regional and small-town news sites: profiles of ordinary workers who document their workplace, town or community.',
  'first-person': "Open letters, long first-person posts and essays published under the author's own name.",
  'institution-channels': 'Channels and pages run by an institution with a tiny audience (a school, parish, clinic, club, town hall), where the person behind the camera is credited or identifiable by their role.',
  'small-channels': 'Very small video or audio channels (under ~20k followers) run by workers or residents documenting daily life from inside.',
  'community-archives': 'Village chroniclers, home-movie keepers, parish, union and school archivists, community radio hosts.',
  'first-timers': 'Public lists from community media workshops, first-film labs and local storytelling contests: applicants and local winners alike.',
};

// Kinds of story. Every lead is filed under one, and a search can be narrowed to some.
export const STORY_TYPES = {
  education: 'Schools, universities, children and teaching',
  health: 'Hospitals, clinics, care homes and public health',
  work: 'Factories, mines, ports, farms, transport and labour',
  land: 'Land, water, environment, climate and extraction',
  war: 'War, the military, conscription and security forces',
  migration: 'Migration, borders, exile and displacement',
  justice: 'Courts, police, prisons and detention',
  government: 'Local government, elections, corruption and public services',
  disaster: 'Disasters, epidemics and emergencies',
  economy: 'Economic collapse, closures, debt and poverty',
  community: 'Faith, culture, tradition and community life',
  other: 'Anything else',
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
