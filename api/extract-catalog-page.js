import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, imagesBase64 } = req.body;
    
    const images = imagesBase64 || (imageBase64 ? [imageBase64] : []);
    
    if (images.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const schema = {
      type: SchemaType.ARRAY,
      description: "Un array di profili tecnici trovati nell'immagine.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          nome: { type: SchemaType.STRING, description: "Nome o codice del profilo (es. Telaio Z 45mm, Art. 1234)" },
          marca: { type: SchemaType.STRING, description: "Marca del profilo se menzionata (es. Domal, Schuco)" },
          base_price: { type: SchemaType.NUMBER, description: "Prezzo base se indicato, altrimenti 0" },
          specs: {
            type: SchemaType.OBJECT,
            properties: {
              aletta_vetro: { type: SchemaType.STRING, description: "Misura dell'aletta di battuta del vetro in mm" },
              sormonto: { type: SchemaType.STRING, description: "Misura del sormonto in mm" },
              spessore_telaio: { type: SchemaType.STRING, description: "Spessore del telaio/profilo in mm" },
              trasmittanza: { type: SchemaType.STRING, description: "Valore Uf (trasmittanza termica)" }
            }
          }
        },
        required: ["nome"]
      }
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
         responseMimeType: "application/json",
         responseSchema: schema
      }
    });

    const prompt = `Sei un esperto tecnico di serramenti e infissi. Il tuo compito è analizzare queste ${images.length} pagine estratte da un catalogo tecnico e individuare TUTTI I PROFILI presenti (telai, ante, traversi, fermavetri, accessori in alluminio/pvc, ecc.).
REGOLE FONDAMENTALI:
1. Trova QUALSIASI elemento che assomigli a un profilo, anche se non sei sicuro di cosa sia. Spesso sono accompagnati da codici (es. Art. 1234, Cod. A45, ecc.).
2. Il campo 'nome' è OBBLIGATORIO: usa il codice alfanumerico o il nome del profilo. Se vedi un disegno tecnico con un codice vicino, QUELLO è il nome.
3. Se mancano dati tecnici (come trasmittanza, sormonto, aletta, ecc.), NON scartare il profilo! Inserisci il profilo nell'array e lascia i campi tecnici vuoti ("") o a 0.
4. Non restituire mai un array vuoto [] a meno che la pagina non sia una foto paesaggistica o una pagina completamente bianca. Se vedi tabelle, disegni tecnici o elenchi di codici, estraili tutti.
5. Se trovi una tabella riassuntiva con 10 codici, crea 10 oggetti separati.`;

    const imageParts = images.map(b64 => ({
      inlineData: {
        data: b64.replace(/^data:image\/\w+;base64,/, ""),
        mimeType: "image/jpeg"
      }
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    try {
      const parsedData = JSON.parse(text);
      return res.status(200).json({ profiles: parsedData });
    } catch (e) {
      console.error("Failed to parse JSON:", text);
      return res.status(500).json({ error: "L'AI non ha restituito un JSON valido", raw: text });
    }

  } catch (error) {
    console.error('Error generating content:', error);
    
    // Passa i codici di stato di Rate Limiting (429) o Service Unavailable (503) al frontend
    if (error.status === 429 || error.message?.includes('[429')) {
       return res.status(429).json({ error: error.message });
    }
    if (error.status === 503 || error.message?.includes('[503')) {
       return res.status(503).json({ error: error.message });
    }
    
    return res.status(500).json({ error: error.message });
  }
}
