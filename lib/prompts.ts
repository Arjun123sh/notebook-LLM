export type PromptType =
    | 'study-guide'
    | 'faq'
    | 'briefing'
    | 'timeline'
    | 'key-topics'
    | 'audio-overview'
    | 'slide-deck'
    | 'video-overview'
    | 'mind-map'
    | 'reports'
    | 'flashcards'
    | 'quiz'
    | 'infographic'
    | 'data-table'
    | 'related-questions';

export const PROMPTS: Record<string, (ctx: string, extra?: { context?: string }) => string> = {
    'study-guide': ctx => `Create a comprehensive Study Guide from these sources. Use clean plain text only - no bold markers **, no citation markers like 【1】 or [1].

Structure:
- KEY CONCEPTS: [explain each concept]
- Q&A SECTION: [5-7 Q&A pairs]
- VOCABULARY: [terms and definitions]
- SUMMARY: [main takeaways]

Sources:
${ctx}`,

    'faq': ctx => `Generate 8-10 FAQs with thorough answers. Use plain text only - no bold **, no citation markers.

Format:
Q: [question]
A: [answer]

Sources:
${ctx}`,

    'briefing': ctx => `Write an executive Briefing Document in plain text - no bold **, no citation markers.

Include:
EXECUTIVE SUMMARY
[2-3 sentences]

KEY FINDINGS
[bullet points]

IMPORTANT DETAILS
[explanation]

CONCLUSIONS & RECOMMENDATIONS
[summary]

Sources:
${ctx}`,

    'timeline': ctx => `Create a chronological Timeline in plain text - no bold **, no citation markers.

Format each entry as:
[Date/Period] - [Event/Development]

Order earliest to most recent.

Sources:
${ctx}`,

    'key-topics': ctx => `Identify 6-8 Key Topics in plain text - no bold **, no citation markers.

For each topic:
- Topic Name: [name]
- Explanation: [2-3 sentences]
- Why it matters: [brief note]

Sources:
${ctx}`,

    'audio-overview': ctx => `Write a podcast-style script in plain text - no bold **, no citation markers.

Format:
ALEX: [dialogue]
SAM: [dialogue]

Include intro, 3-4 main topics, debate moment, and conclusion. ~800 words.

Sources:
${ctx}`,

    'slide-deck': ctx => `Create a Slide Deck outline in plain text - no bold **, no citation markers.

Format:
SLIDE [N]: [Title]
- Key point 1
- Key point 2
Speaker notes: [brief notes]

Create 8-12 slides with conclusions.

Sources:
${ctx}`,

    'video-overview': ctx => `Write a video script in plain text - no bold **, no citation markers.

Format:
[INTRO - 0:00] [narration]
[SECTION: Topic - 0:30] [narration]
[OUTRO - 4:30] [narration]

Include visual direction notes in brackets.

Sources:
${ctx}`,

    'mind-map': ctx => `Create a Mind Map structure in plain text - no bold **, no citation markers.

Format:
CENTRAL TOPIC
- Main Branch 1
  - Sub-topic 1.1
  - Sub-topic 1.2
- Main Branch 2
  - Sub-topic 2.1

4-6 main branches with 2-4 sub-items each.

Sources:
${ctx}`,

    'reports': ctx => `Write a Research Report in plain text - no bold **, no citation markers.

Include:
EXECUTIVE SUMMARY
[2-3 paragraphs]

INTRODUCTION
[background]

METHODOLOGY
[how sources were analyzed]

KEY FINDINGS
[numbered list with evidence]

DETAILED ANALYSIS
[in-depth discussion]

CONCLUSIONS
[what findings mean]

RECOMMENDATIONS
[actionable next steps]

Sources:
${ctx}`,

    'flashcards': ctx => `Create 12-15 Flashcards in plain text - no bold **, no citation markers.

Format:
CARD [N]
FRONT: [Question or term]
BACK: [Answer or definition]

Cover key concepts, terms, and facts.

Sources:
${ctx}`,

    'quiz': ctx => `Create a 10-question Quiz in plain text - no bold **, no citation markers.

Format:
Q[N]: [Question]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
Answer: [Letter] - [Explanation]

Vary difficulty. Cover key concepts.

Sources:
${ctx}`,

    'infographic': ctx => `Design an Infographic outline in plain text - no bold **, no citation markers.

Format:
TITLE: [Catchy title]
SUBTITLE: [One-line description]

SECTION 1: KEY STATISTICS
- [Stat/fact 1]
- [Stat/fact 2]

SECTION 2: MAIN CONCEPTS
- [Concept 1]: [1 sentence]
- [Concept 2]: [1 sentence]

SECTION 3: PROCESS
[Step 1] -> [Step 2] -> [Step 3]

SECTION 4: KEY TAKEAWAYS
- [Takeaway 1]
- [Takeaway 2]

Sources:
${ctx}`,

    'data-table': ctx => `Extract data into formatted tables in plain text - no bold **, no citation markers.

Format:
TABLE: [Title]
| Column 1 | Column 2 | Column 3 |
| Data | Data | Data |

Create multiple tables for different data types. Include descriptions.

Sources:
${ctx}`,

    'related-questions': (ctx, extra?: { context?: string }) => `Based on the following content, generate exactly 5 follow-up questions that a user might ask next.
Each question should be on a new line and should not be prefixed with any numbers, bullets, or symbols.
Only output the questions, one per line, without any additional text.

Content:
${extra?.context || ctx}
`,
    'research-assistant': (ctx: string) => `You are a helpful research assistant. Answer the user's question ONLY based on the provided context.

IMPORTANT FORMATTING RULES:
1. Do NOT use citation markers like [1], [2], 【1】, 【1†L1-L4】 or any similar format
2. Do NOT use markdown bold markers **text** - use plain text only
3. Use clean, readable plain text formatting
4. Use simple bullet points with - or * followed by space
5. Use numbered lists with 1., 2., etc.
6. Use proper paragraphs with line breaks between topics

Context:
${ctx}

If the answer is not in the context, say you don't know. Do not make up information.`,
};
