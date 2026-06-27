import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { chapterText, count = 5, difficulty = 'Medium' } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Mock Fallback Generator if OpenAI key is not provided yet
      // This allows immediate testing out of the box!
      console.log('No OPENAI_API_KEY detected. Using mock MCQs fallback.');
      
      const mockMCQs = [
        {
          id: `mcq-gen-${Math.random().toString(36).substr(2, 9)}`,
          question: `Regarding the context: "${chapterText.slice(0, 40)}...", which statement is historically accurate?`,
          option_a: 'It established the Supreme Court of Judicature in Calcutta.',
          option_b: 'It completely abolished the Court of Directors.',
          option_c: 'It granted complete sovereignty to the Indian rulers.',
          option_d: 'It initiated a decentralised legislature model.',
          correct_option: 'A',
          explanation: 'Based on standard UPSC references, early regulating acts established judicial authority in Calcutta in 1774.',
          difficulty: difficulty,
          year_asked: 2019
        },
        {
          id: `mcq-gen-${Math.random().toString(36).substr(2, 9)}`,
          question: `Under which Charter Act did the Governor-General of Bengal become Governor-General of India?`,
          option_a: 'Charter Act of 1813',
          option_b: 'Charter Act of 1833',
          option_c: 'Charter Act of 1853',
          option_d: 'Government of India Act 1858',
          correct_option: 'B',
          explanation: 'The Charter Act of 1833 made the Governor-General of Bengal as the Governor-General of India.',
          difficulty: difficulty,
          year_asked: 2018
        },
        {
          id: `mcq-gen-${Math.random().toString(36).substr(2, 9)}`,
          question: `Who proposed the idea of a Constituent Assembly for India for the first time in 1934?`,
          option_a: 'Jawaharlal Nehru',
          option_b: 'M.N. Roy',
          option_c: 'Dr. B.R. Ambedkar',
          option_d: 'Mahatma Gandhi',
          correct_option: 'B',
          explanation: 'M.N. Roy first put forward the idea of a Constituent Assembly for India in 1934.',
          difficulty: difficulty,
          year_asked: 2020
        }
      ];

      return NextResponse.json({ mcqs: mockMCQs.slice(0, count) });
    }

    // Call Real OpenAI GPT-4 API
    const prompt = `You are a UPSC CSE question builder. Generate ${count} multiple-choice questions (MCQs) based on the following chapter text. 
    Difficulty level: ${difficulty}.
    Provide the response strictly as a JSON array inside a "mcqs" field, where each object contains:
    - question (string)
    - option_a (string)
    - option_b (string)
    - option_c (string)
    - option_d (string)
    - correct_option (string, strictly 'A', 'B', 'C', or 'D')
    - explanation (string, detailed UPSC standard explanation)
    - difficulty (string, strictly 'Easy', 'Medium', or 'Hard')
    - year_asked (number or null)

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
    
    // Add IDs
    const mcqs = (parsed.mcqs || []).map((m: any) => ({
      ...m,
      id: `mcq-gen-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    }));

    return NextResponse.json({ mcqs });
  } catch (err: any) {
    console.error('Error generating MCQs:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate MCQs' }, { status: 500 });
  }
}
