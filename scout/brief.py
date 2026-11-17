"""What we are looking for, where we look, and where we must not look.

Everything the model is told about "the next Pavel" lives in this file,
so the people running the project can edit it without touching the code.
"""

# Distilled from how Pavel Talankin actually became the protagonist of
# "Mr. Nobody Against Putin": a school events coordinator and videographer
# in Karabash who already filmed everything, saw his job change, answered a
# call for stories with a long angry letter, and wanted the story told.
ARCHETYPE = """\
We are looking for a person, not a film. The person has these traits:

1. INSIDE. They hold an ordinary job or role inside a place outsiders cannot
   film: a school, clinic, mine, port, barracks, parish, call centre, prison,
   town hall, factory floor, fishing fleet, border post.
2. ALREADY RECORDING. They film, photograph, record or write for mundane
   reasons: school videographer, wedding filmer, parish archivist, union
   newsletter, a tiny channel about their town, a diary. The habit predates
   any idea of making a film.
3. A TURN. Something in their world changed and they could not unsee it.
   The story is under way now, not finished.
4. A VOICE. In their own posts, letters or videos they are funny, angry,
   tender, specific. You would follow this person for ninety minutes.
5. WANTS TO TELL IT. This is the trait that matters most. They show, in
   public and in their own name, that they want their story told: they keep
   posting, writing, filming, speaking up, asking to be heard.
6. NOT YET IN THE INDUSTRY. Some video experience is welcome and often a good
   sign: Pavel filmed school events for a living. What rules a person out is
   an established film or media career: festival credits, a production
   company, an agent, a press team.
7. NOWHERE. They live where nobody is looking: a small town, a periphery,
   a language that film funds rarely read.
"""

RUBRIC = {
    "access": "Are they inside something outsiders cannot film?",
    "habit": "Do they already record, for ordinary reasons?",
    "turn": "Is something changing around them right now?",
    "voice": "Is their own voice distinctive on the page or on camera?",
    "drive": "Do they visibly want to tell this story themselves?",
    "undiscovered": "Are they outside the film industry and the national press? "
                    "(Amateur or workplace video experience does not count against them.)",
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
                    "and local storytelling contests: applicants, not winners.",
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
