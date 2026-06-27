import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { question, chapterContext } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.log('No OPENAI_API_KEY detected. Using mock chat fallback.');
      
      let answer = 'Thank you for your query. To connect this chat to real-time GPT-4 responses, please configure your `OPENAI_API_KEY` in `.env.local`.';

      // Simulating a smart match based on content
      const q = question.toLowerCase();
      if (q.includes('regulating') || q.includes('1773')) {
        answer = 'The Regulating Act of 1773 was the first step of British intervention in regulating the East India Company. It appointed Warren Hastings as Governor-General of Bengal and laid the foundations of central administration in India.';
      } else if (q.includes('1833') || q.includes('charter')) {
        answer = 'The Charter Act of 1833 marked the final phase of British administrative centralisation. It created the Governor-General of India (William Bentinck) and turned the Company into an administrative agent of the Crown.';
      } else if (q.includes('drafting') || q.includes('constituent')) {
        answer = 'The Constituent Assembly set up the Drafting Committee on August 29, 1947. Dr. B. R. Ambedkar chaired the committee, leading the formulation of the Indian Constitution.';
      }

      return NextResponse.json({ answer });
    }

    const prompt = `You are a UPSC CSE study mentor. Answer the student's question based on the provided chapter context. 
    Be clear, highly educational, and refer to standard constitutional frameworks.
    
    Chapter Context:
    ${chapterContext}
    
    Student Question:
    ${question}`;

    const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      })
    });

    const result = await apiResponse.json();
    const answer = result.choices[0].message.content;

    return NextResponse.json({ answer });
  } catch (err: any) {
    console.error('Error in chat API:', err);
    return NextResponse.json({ error: err.message || 'Failed to chat' }, { status: 500 });
  }
}
