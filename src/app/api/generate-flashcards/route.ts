import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { chapterText, count = 3 } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.log('No OPENAI_API_KEY detected. Using mock flashcards fallback.');
      
      const mockFlashcards = [
        {
          id: `fc-gen-${Math.random().toString(36).substr(2, 9)}`,
          front_text: 'What did the Regulating Act of 1773 establish in Calcutta in 1774?',
          back_text: 'The Supreme Court of Judicature, comprising a Chief Justice and three other judges.'
        },
        {
          id: `fc-gen-${Math.random().toString(36).substr(2, 9)}`,
          front_text: 'Who was designated the first Governor-General of India?',
          back_text: 'Lord William Bentinck under the Charter Act of 1833.'
        },
        {
          id: `fc-gen-${Math.random().toString(36).substr(2, 9)}`,
          front_text: 'Who chaired the Constituent Assembly Drafting Committee?',
          back_text: 'Dr. B. R. Ambedkar, appointed on August 29, 1947.'
        }
      ];

      return NextResponse.json({ flashcards: mockFlashcards.slice(0, count) });
    }

    const prompt = `You are a UPSC study tool. Generate ${count} flashcards for spaced repetition based on this text. 
    Provide the response strictly as a JSON array inside a "flashcards" field, where each object contains:
    - front_text (string, query/question)
    - back_text (string, answer/summary definition)

    Chapter Text:
    ${chapterText}`;

    const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    const result = await apiResponse.json();
    const parsed = JSON.parse(result.choices[0].message.content);
    
    const flashcards = (parsed.flashcards || []).map((f: any) => ({
      ...f,
      id: `fc-gen-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    }));

    return NextResponse.json({ flashcards });
  } catch (err: any) {
    console.error('Error generating flashcards:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate flashcards' }, { status: 500 });
  }
}
