exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const SYSTEM_PROMPT = `Kamu adalah Damz AI. Jawab singkat, padat, dan langsung ke inti.
Gunakan bahasa Indonesia kecuali pengguna pakai bahasa lain.
Jangan bertele-tele, jangan ulang pertanyaan, jangan basa-basi panjang.
Pertanyaan simpel jawab 1-3 kalimat. Perkenalkan dirimu sebagai "Damz AI" jika ditanya.`;

  try {
    const { messages } = JSON.parse(event.body);
    const groqMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.API_KEY
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        max_tokens: 2048,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (data.error) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: data.error }) };
    }

    const reply = data.choices?.[0]?.message?.content || 'Maaf, tidak bisa merespons.';
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ content: [{ text: reply }] })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: { message: err.message } })
    };
  }
};
