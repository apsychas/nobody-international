#!/usr/bin/env python3
"""Nobody Scout: find people with a story before they make a film.

Commands
  scout   search the public web, in local languages, for people who fit
  intake  read inbound submissions (any language), translate and score them
  match   propose introductions between people whose stories speak to each other
  report  print the review queue, best first

Every lead is a suggestion for a human to read. Nothing here contacts anyone.
"""
import argparse
import json
import sys
import time
from datetime import date
from pathlib import Path
from typing import Literal

import anthropic
from pydantic import BaseModel, Field

from brief import ARCHETYPE, HIGH_RISK, LANES, REGIONS, RUBRIC

MODEL = "claude-opus-5-5"
FALLBACK_BETA = "server-side-fallback-2026-07-01"
DATA = Path(__file__).parent / "data"
LEADS, INTROS = DATA / "leads.jsonl", DATA / "introductions.jsonl"

client = anthropic.Anthropic()


# ---------- shapes ----------------------------------------------------------

class Scores(BaseModel):
    access: int = Field(ge=0, le=3)
    habit: int = Field(ge=0, le=3)
    turn: int = Field(ge=0, le=3)
    voice: int = Field(ge=0, le=3)
    drive: int = Field(ge=0, le=3)
    undiscovered: int = Field(ge=0, le=3)


class Lead(BaseModel):
    kind: Literal["person", "intermediary"]
    name: str = Field(description="Public name or handle exactly as they publish it")
    place: str
    role: str = Field(description="Their job or role, e.g. 'school events coordinator'")
    story: str = Field(description="Two or three sentences in English: what they are inside of, and what is changing")
    in_their_words: str = Field(description="A short quotation in the original language, or empty")
    sources: list[str] = Field(description="Public URLs the claims come from")
    scores: Scores
    themes: list[str] = Field(description="3-6 lowercase tags, e.g. 'school', 'mining town', 'migration'")
    cautions: str = Field(description="Anything a human should check before any contact: safety, minors, consent, doubt about facts")


class LeadList(BaseModel):
    leads: list[Lead]


class Introduction(BaseModel):
    a: str
    b: str
    why: str = Field(description="What these two would recognise in each other")
    first_question: str = Field(description="One question to open their first conversation")


class IntroList(BaseModel):
    introductions: list[Introduction]


# ---------- model calls -----------------------------------------------------

def research(system: str, prompt: str, searches: int) -> str:
    """One web-research turn. Returns the model's written findings."""
    messages = [{"role": "user", "content": prompt}]
    for _ in range(5):  # resume if the server-side search loop pauses
        with client.beta.messages.stream(
            model=MODEL,
            max_tokens=32000,
            betas=[FALLBACK_BETA],
            fallbacks="default",
            thinking={"type": "adaptive"},
            output_config={"effort": "high"},
            system=system,
            tools=[{"type": "web_search_20260209", "name": "web_search", "max_uses": searches}],
            messages=messages,
        ) as stream:
            reply = stream.get_final_message()
        if reply.stop_reason == "refusal":
            return ""
        if reply.stop_reason != "pause_turn":
            return "".join(b.text for b in reply.content if b.type == "text")
        messages = [messages[0], {"role": "assistant", "content": reply.content}]
    return ""


def structure(notes: str, shape, instructions: str):
    """Turn free-text findings into validated records."""
    reply = client.messages.parse(
        model=MODEL,
        max_tokens=16000,
        output_config={"effort": "low"},
        system=instructions,
        messages=[{"role": "user", "content": notes}],
        output_format=shape,
    )
    return reply.parsed_output if reply.stop_reason == "end_turn" else None


# ---------- prompts ---------------------------------------------------------

SCOUT_SYSTEM = f"""You are a scout for Nobody International, a documentary \
initiative that looks for people who have a story only they can tell and want to tell \
it, before the film world has found them.

{ARCHETYPE}
Rules
- Search in the language you are given, using the words a local would use. \
Do not search in English unless English is the language given.
- Only people who have already chosen to publish under their own name or \
handle. Never infer identities, never combine sources to unmask anyone, never \
collect contact details, addresses, family members or employers beyond what \
the person states publicly.
- No minors.
- Skip anyone already covered by national or international press, and anyone \
with an established film or media career. Everyday video experience is fine.
- Prefer three real finds to ten weak ones. If you find nobody, say so.
- For each find give: public name, place, role, what they are inside of, what \
is changing, one short quotation in the original language, the URLs, and what \
a human should check before contact."""

INTERMEDIARY_SYSTEM = f"""You are a scout for Nobody International, a \
documentary initiative that looks for people with a story only they can tell.

In this country, being identified as someone with a critical story to tell \
can cost a person their job, their freedom or their family's safety. So here \
you do NOT look for individuals and you name no private person.

Instead, find the trusted public intermediaries through whom an open call \
for stories could travel, so that people can choose to come to us: \
independent and exile media in the language, diaspora associations, teacher, \
medical and labour networks abroad, university departments, legal aid and \
press-freedom groups, community media trainers, film schools in exile. \
For each give: name, where it is based, who it reaches inside the country, \
why people trust it, the URL. Search in the language given."""


def scout(country: str, language: str, lane: str, searches: int) -> list[dict]:
    risky = country in HIGH_RISK
    if risky:
        system = INTERMEDIARY_SYSTEM
        prompt = f"Country: {country}. Language to search in: {language}."
    else:
        system = SCOUT_SYSTEM
        prompt = (f"Country: {country}. Language to search in: {language}.\n"
                  f"Where to look this time: {LANES[lane]}")
    notes = research(system, prompt, searches)
    if not notes.strip():
        return []
    rubric = "\n".join(f"- {k}: {v}" for k, v in RUBRIC.items())
    parsed = structure(
        notes, LeadList,
        "Convert these scouting notes into records. Invent nothing: leave a "
        "field empty rather than guess. Score each record 0-3 on:\n" + rubric +
        ("\nThese are organisations: set kind to 'intermediary' and all scores to 0."
         if risky else "\nSet kind to 'person'."))
    out = []
    for lead in (parsed.leads if parsed else []):
        row = lead.model_dump()
        row |= {"country": country, "language": language,
                "lane": "intermediaries" if risky else lane,
                "found": date.today().isoformat(), "origin": "scout",
                "total": sum(row["scores"].values()), "status": "unreviewed"}
        out.append(row)
    return out


def intake(path: Path) -> list[dict]:
    """Inbound submissions: a JSON list of {name, country, language, role, story}."""
    rubric = "\n".join(f"- {k}: {v}" for k, v in RUBRIC.items())
    out = []
    for sub in json.loads(path.read_text()):
        parsed = structure(
            json.dumps(sub, ensure_ascii=False), LeadList,
            f"A person wrote to Nobody International, in any language. "
            f"{ARCHETYPE}\nProduce exactly one record of kind 'person' from "
            f"their message. Write 'story' in English, keep 'in_their_words' "
            f"in their language, leave 'sources' empty. Use only what they "
            f"wrote. Score 0-3 on:\n{rubric}")
        if parsed and parsed.leads:
            row = parsed.leads[0].model_dump()
            row |= {"country": sub.get("country", ""), "language": sub.get("language", ""),
                    "lane": "open-call", "found": date.today().isoformat(),
                    "origin": "inbound", "total": sum(row["scores"].values()),
                    "status": "unreviewed"}
            out.append(row)
    return out


def match(leads: list[dict], minimum: int) -> list[dict]:
    people = [{k: l[k] for k in ("name", "country", "role", "story", "themes")}
              for l in leads if l["kind"] == "person" and l["total"] >= minimum]
    if len(people) < 2:
        return []
    parsed = structure(
        json.dumps(people, ensure_ascii=False), IntroList,
        "These people each have a story and do not know each other. Propose "
        "introductions between pairs in DIFFERENT countries who would "
        "recognise something in each other: the same kind of institution, the "
        "same turn, or two halves of one story. Quality over coverage; an "
        "obvious topical overlap is not enough. Use names exactly as given.")
    return [i.model_dump() for i in parsed.introductions] if parsed else []


# ---------- storage and CLI -------------------------------------------------

def load(path: Path) -> list[dict]:
    return [json.loads(l) for l in path.read_text().splitlines() if l.strip()] if path.exists() else []


def append(path: Path, rows: list[dict], key=lambda r: (r["name"].lower(), r["country"])):
    DATA.mkdir(exist_ok=True)
    seen = {key(r) for r in load(path)}
    fresh = [r for r in rows if key(r) not in seen]
    with path.open("a") as f:
        for r in fresh:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    return len(fresh)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("scout")
    s.add_argument("--country", action="append", help="repeatable; default: every region in brief.py")
    s.add_argument("--lane", action="append", choices=list(LANES), help="repeatable; default: all lanes")
    s.add_argument("--searches", type=int, default=10, help="web searches per run")
    s.add_argument("--dry-run", action="store_true", help="print the plan and its size; call nothing")
    i = sub.add_parser("intake"); i.add_argument("file", type=Path)
    m = sub.add_parser("match"); m.add_argument("--min", type=int, default=12)
    r = sub.add_parser("report"); r.add_argument("--min", type=int, default=0)
    a = p.parse_args()

    if a.cmd == "scout":
        regions = [(c, ls) for c, ls in REGIONS if not a.country or c in a.country]
        if a.country and not regions:
            sys.exit(f"Not in brief.py REGIONS: {a.country}")
        plan = []
        for country, languages in regions:
            for language in languages:
                lanes = ["intermediaries"] if country in HIGH_RISK else (a.lane or list(LANES))
                plan += [(country, language, lane) for lane in lanes]
        print(f"{len(plan)} runs, up to {a.searches} searches each", file=sys.stderr)
        if a.dry_run:
            for row in plan:
                print(" / ".join(row))
            return
        for country, language, lane in plan:
            try:
                rows = scout(country, language, lane, a.searches)
            except anthropic.RateLimitError:
                time.sleep(60); rows = scout(country, language, lane, a.searches)
            except anthropic.APIStatusError as e:
                print(f"  skipped {country}/{language}/{lane}: {e.status_code} {e.message}", file=sys.stderr)
                continue
            added = append(LEADS, rows)
            print(f"  {country} / {language} / {lane}: {len(rows)} found, {added} new", file=sys.stderr)

    elif a.cmd == "intake":
        rows = intake(a.file)
        print(f"{len(rows)} read, {append(LEADS, rows)} new")

    elif a.cmd == "match":
        rows = match(load(LEADS), a.min)
        added = append(INTROS, rows, key=lambda r: tuple(sorted((r["a"], r["b"]))))
        print(f"{len(rows)} proposed, {added} new -> {INTROS}")

    elif a.cmd == "report":
        rows = sorted((l for l in load(LEADS) if l["total"] >= a.min or l["kind"] == "intermediary"),
                      key=lambda l: -l["total"])
        for l in rows:
            head = f"[{l['total']:>2}/18]" if l["kind"] == "person" else "[relay]"
            print(f"{head} {l['name']} ({l['role']}, {l['place']}, {l['country']}) via {l['lane']}")
            print(f"        {l['story']}")
            if l["cautions"]:
                print(f"        check: {l['cautions']}")
            for u in l["sources"]:
                print(f"        {u}")
            print()


if __name__ == "__main__":
    main()
