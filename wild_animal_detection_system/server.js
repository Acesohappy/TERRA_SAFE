import express from 'express';
    import cors from 'cors';
    import { OpenAI } from "openai";

    const app = express();
    const port = 3000;

    app.use(cors());
    app.use(express.json());

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    app.post('/describe', async (req, res) => {
      const { animal } = req.body;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "system", content: "You are a helpful assistant that provides detailed descriptions of animals." },
          { role: "user", content: `Provide a detailed description of a ${animal}. Include information about its habitat, behavior, and any interesting facts.` }],
        });

        const description = completion.choices[0].message.content;
        res.json({ description });
      } catch (error) {
        console.error('Error fetching description from OpenAI:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
    });
