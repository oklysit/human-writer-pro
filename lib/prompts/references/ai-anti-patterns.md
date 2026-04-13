# AI Anti-Patterns Reference

Comprehensive catalog of vocabulary, structural patterns, and rhetorical tells that flag text as AI-generated. Sourced from Wikipedia:Signs of AI writing, GPTZero research, and adversarial testing.

Load this file alongside `voice-profile.md` for ALL drafting modes. The voice profile tells you how to write; this file tells you what NOT to write.

## 1. Banned Vocabulary

### High-Frequency AI Words (strongest tells)
These words appeared at dramatically higher rates after LLM adoption. Using multiple in one document is a near-certain AI flag.

- delve, tapestry (abstract), landscape (abstract), intricate/intricacies
- meticulous/meticulously, pivotal, crucial, vital
- testament, enduring, vibrant, profound
- underscore (verb), bolstered, garner
- interplay, boasts, valuable
- showcasing, highlighting, fostering, emphasizing
- encompassing, enhancing, exemplifies
- groundbreaking, renowned, seamless, cutting-edge
- synergy, leverage (verb), navigate (metaphorical)
- multifaceted, utilize, endeavor, proactive
- stakeholder, facilitate, actionable, impactful
- robust (when not describing statistical methods)

### Mid-Risk AI Words (use sparingly or with qualifiers)
- align with, enhance, ensure, key (as adjective)
- commitment to, diverse array, gateway to
- nestled, in the heart of, rich (cultural context)
- innovative, comprehensive, streamline

### Banned Transitional Words/Phrases
- Furthermore, Moreover, Additionally
- Essentially, Basically, Thus
- In conclusion, Ultimately
- It's worth noting, It's important to note
- Looking back, The reality is
- Moving forward, That said (as opener)

## 2. Banned Structural Patterns

### The "Not Just X" Construction
AI loves negative parallelisms. Never use:
- "Not just X, but also Y"
- "It is not just..., it's..."
- "Not X, but Y" (when framing significance)
- "It's not... it's part of..."
- "No X, no Y, just Z"

### The Copula Dodge
AI avoids "is/are/has" by substituting fancier verbs. Don't replace simple verbs with:
- "serves as" / "stands as" (instead of "is")
- "marks" / "represents" / "signifies" (instead of "is")
- "boasts" / "features" / "offers" (instead of "has")

Just say "is" or "has." Humans use copulas constantly.

### The Rule of Three
AI defaults to exactly three parallel items. Avoid:
- "adjective, adjective, and adjective"
- "short phrase, short phrase, and short phrase"
- Three-item lists as rhetorical flourish

Use two items or four. Never exactly three in parallel structure.

### The Significance Attachment
AI bolts vague importance onto facts. Never write:
- "highlighting/underscoring/emphasizing its importance"
- "reflecting broader trends in..."
- "contributing to the evolving landscape of..."
- "setting the stage for..."
- "marking/shaping the future of..."
- "represents a shift in..."
- "a key turning point"
- "deeply rooted in..."
- "indelible mark on..."

State the fact. Let the reader decide if it's important.

### The "-ing" Attachment
AI appends present participle phrases to add false depth:
- "...highlighting its significance"
- "...ensuring quality outcomes"
- "...showcasing the diversity"
- "...fostering innovation"
- "...cultivating a sense of..."

Cut these trailing phrases. They add nothing.

### The "Despite" Formula
AI uses a rigid problem-solution frame:
- "Despite its [positive words], [subject] faces challenges..."
- "Despite these challenges, [subject] continues to..."
- "Challenges and Legacy" as a section pattern
- Problem -> solution -> future outlook structure

Real writing doesn't resolve neatly. Leave tensions unresolved.

## 3. Banned Rhetorical Patterns

### Regression to the Mean
AI replaces specific details with generic positive descriptions:
- "revolutionary titan of industry" instead of "inventor of the first train-coupling device"
- "a pivotal figure in the field" instead of "she published 3 papers on X between 2018-2020"

Always prefer the specific, weird, concrete detail over the generic assessment.

### Puffing Up Importance
AI inflates significance with stock phrases:
- "stands/serves as a testament to..."
- "is a reminder of..."
- "plays a vital/significant/crucial/pivotal role"
- "focal point of..."
- "evolving landscape of..."

### Vague Attribution (Weasel Words)
AI sources claims vaguely when it doesn't have real citations:
- "Industry reports suggest..."
- "Observers have cited..."
- "Experts argue..."
- "Some critics argue..."
- "Several sources indicate..."
- "Described in scholarship..."

Either cite a specific source or state it as your opinion.

### Elegant Variation / Synonym Substitution
AI avoids repeating proper nouns by cycling through descriptors:
- "the protagonist," "the key player," "the eponymous character" for the same person
- "the organization," "the entity," "the institution" for the same company

Humans repeat names. Just say the name again.

## 4. Formatting Tells

- Excessive boldface on key terms
- Title Case In Every Heading Word
- Overuse of em dashes throughout text
- Curly/smart quotation marks in plain text contexts
- Markdown syntax in non-markdown contexts
- Emoji in professional or academic writing
- Perfectly balanced section lengths
- "Key Takeaways" style formatting
- Rigid heading hierarchy (every section same depth)

## 5. Content Red Flags

### Promotional/Advertisement Tone
- "boasts a vibrant..."
- "rich cultural heritage"
- "natural beauty of..."
- "seamlessly connecting..."
- "value-driven experiences"
- Travel guide or press release register in non-promotional contexts

### Knowledge-Cutoff Artifacts
- "As of my knowledge cutoff..."
- "As of [date]..."
- Collaboration language: "We should explore..."
- Meta-commentary about the writing process itself

### Citation Red Flags (for academic writing)
- Broken URLs, invalid DOIs or ISBNs
- Book citations without page numbers
- DOIs leading to unrelated articles
- Named references declared but never cited
- Tracking parameters (utm_source=) in URLs

## 6. Quick Checklist (Run After Every Draft)

- [ ] Zero words from the High-Frequency AI Words list
- [ ] No "not just X, but also Y" constructions
- [ ] No trailing "-ing" significance phrases
- [ ] No "serves as" / "stands as" copula dodges
- [ ] No exactly-three parallel item lists
- [ ] No "Despite [positive], [subject] faces..." formula
- [ ] No vague attributions without specific sources
- [ ] Specific details preferred over generic assessments
- [ ] No promotional register in non-promotional context
- [ ] Section/paragraph lengths vary naturally
