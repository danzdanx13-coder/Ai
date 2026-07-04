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

    const geminiContents = messages.map(msg => {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      const parts = [];
      if (typeof msg.content === 'string') {
        parts.push({ text: msg.content });
      } else if (Array.isArray(msg.content)) {
        msg.content.forEach(item => {
          if (item.type === 'text') parts.push({ text: item.text });
          else if (item.type === 'image') parts.push({ inline_data: { mime_type: item.mime_type, data: item.data } });
        });
      }
      return { role, parts };
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiContents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { maxOutputTokens: 2048, temperature: 0.7 }
      })
    });

    const data = await response.json();

    if (data.error) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: { message: data.error.message } }) };
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, tidak bisa merespons.';
    return { statusCode: 200, headers, body: JSON.stringify({ content: [{ text: reply }] }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: { message: err.message } }) };
  }
};
