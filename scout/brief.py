"""What we are looking for, where we look, and where we must not look.

Everything the model is told about "the next Pavel" lives in this file,
so the people running the project can edit it without touching the code.
"""

# Distilled from how Pavel Talankin actually became the protagonist of
# "Mr. Nobody Against Putin": a school events coordinator and videographer
# in Karabash who already filmed everything, saw his job change, answered a
# call for stories with a long angry letter, and wanted the story told.
ARCHETYPE = """\
We are looking for a person, not a film: someone with a unique perspective
during difficult or unprecedented times.

1. A UNIQUE PERSPECTIVE. They see something from where they stand that almost
   nobody else can show: from inside an institution, a job, a family, a street.
2. DIFFICULT OR UNPRECEDENTED TIMES. Something large is happening around them
   now: a war, a crackdown, a disaster, an epidemic, a collapse, a closure, a
   sudden new rule. The story is still under way.
3. A VOICE. In their own posts, letters or recordings they are funny, angry,
   tender, specific. You would follow them for ninety minutes.
4. THEY WANT TO TELL IT. They already speak, post, write or film in their own
   name, or have asked to be heard.
5. THEY KEEP A RECORD. Video, photographs, diaries, documents. Strongest when
   recording is part of their job or goes back years.
6. NOT YET FOUND. Some film experience, local prizes and local press are fine.
   Only international prize winners and established film or media
   professionals are out.
"""

RUBRIC = {
    "perspective": "Do they see this from a position almost nobody else can show?",
    "moment": "Are they living through difficult or unprecedented times right now?",
    "voice": "Is their own voice distinctive on the page or on camera?",
    "drive": "Do they visibly want to tell this story themselves?",
    "record": "Do they already keep a record (video, photos, diaries, documents)?",
    "undiscovered": "Are they still unknown to the film world and international press?",
}  # each scored 0-3; 18 is the ceiling

# Lanes are the kinds of public places such a person leaves traces.
LANES = {
    "local-press": "Regional and small-town news sites: profiles of ordinary "
                   "workers who document their workplace, town or community.",
    "first-person": "Open letters, resignation letters, long first-person posts "
                    "and essays published under the author's own name.",
    "small-channels": "Very small video or audio channels (under ~20k followers) "
                      "run by workers or residents documenting daily life from inside.",
    "community-archives": "Village chroniclers, home-movie keepers, parish, union "
                          "and school archivists, community radio hosts.",
    "first-timers": "Public lists from community media workshops, first-film labs "
                    "and local storytelling contests: applicants and local winners alike.",
}

# In these places a person identified as having a critical story to tell can
# lose their job, their freedom or their family's safety. Pavel was declared
# a "foreign agent" and state media went after his mother. The scout never
# names private individuals here. It maps trusted intermediaries who could
# carry an open call instead, so that people choose to come to us, the way
# Pavel did. Edit with advice from a press-freedom organisation.
HIGH_RISK = {
    "Afghanistan", "Azerbaijan", "Belarus", "China", "Cuba", "Egypt", "Eritrea",
    "Ethiopia", "Iran", "Myanmar", "Nicaragua", "North Korea", "Russia",
    "Saudi Arabia", "Syria", "Tajikistan", "Turkmenistan", "Venezuela", "Vietnam",
}

# (country or region, languages to search in). A starting map, not a canon.
REGIONS = [
    ("Brazil", ["Portuguese"]), ("Mexico", ["Spanish", "Nahuatl"]),
    ("Colombia", ["Spanish"]), ("Peru", ["Spanish", "Quechua"]),
    ("Nigeria", ["English", "Yoruba", "Hausa", "Nigerian Pidgin"]),
    ("Kenya", ["Swahili", "English"]), ("Ghana", ["English", "Twi"]),
    ("South Africa", ["English", "isiZulu", "Afrikaans"]),
    ("Senegal", ["French", "Wolof"]), ("DR Congo", ["French", "Lingala", "Swahili"]),
    ("India", ["Hindi", "Tamil", "Bengali", "Marathi", "Malayalam"]),
    ("Pakistan", ["Urdu", "Punjabi"]), ("Bangladesh", ["Bengali"]),
    ("Indonesia", ["Indonesian", "Javanese"]), ("Philippines", ["Tagalog", "Cebuano"]),
    ("Thailand", ["Thai"]), ("Japan", ["Japanese"]), ("South Korea", ["Korean"]),
    ("Turkey", ["Turkish", "Kurdish"]), ("Georgia", ["Georgian"]),
    ("Armenia", ["Armenian"]), ("Kazakhstan", ["Kazakh", "Russian"]),
    ("Ukraine", ["Ukrainian"]), ("Poland", ["Polish"]), ("Hungary", ["Hungarian"]),
    ("Serbia", ["Serbian"]), ("Romania", ["Romanian"]), ("Moldova", ["Romanian", "Russian"]),
    ("Lebanon", ["Arabic"]), ("Tunisia", ["Arabic", "French"]), ("Morocco", ["Arabic", "Tamazight", "French"]),
    ("United States", ["English", "Spanish"]), ("Greenland", ["Kalaallisut", "Danish"]),
    # High-risk: the scout maps intermediaries only (see HIGH_RISK).
    ("Russia", ["Russian"]), ("Belarus", ["Belarusian", "Russian"]),
    ("Iran", ["Persian"]), ("China", ["Chinese"]), ("Myanmar", ["Burmese"]),
    ("Venezuela", ["Spanish"]), ("Egypt", ["Arabic"]),
]
