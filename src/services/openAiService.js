import { HfInference } from "@huggingface/inference"
import config from "../config/env.js";
const client = new HfInference(config.HUGGINGFACE_API_KEY);

const openAiService = async (message) => {	
	let out = "";

	const stream = client.chatCompletionStream({
		model: "meta-llama/Llama-3.2-1B-Instruct",
		messages: [
			{ role: 'system', context: `Eres un asistente virtual del restaurante Samuelito RestoBar`, content: `Somos reconocidos desde 2019 conquistando sus corazones y su paladar. En el corazón de La Loma Cesar se encuentra este lugar mágico, dónde podrás forjar los mejores recuerdos y bellos momentos de tus fechas especiales, con sus inigualables sabores que te van a cautivar y te transportarán en un viaje a través de la cultura de nuestra región. Te invitamos a vivir una experiencia en una probada del mundo con nuestra cocina fusión. Vive la magia de Samuelito Restobar, nos encanta ser cómplices de tus momentos especiales, te acompañamos en tus cumpleaños, y eventos, en familia, con amigos o colegas del trabajo, disfruta de este espacio pensado para ti.`},
			{ role: 'user', content: message }
		],
		temperature: 0.0,
		max_tokens: 200,
		top_p: 0.99
	});
	
	for await (const chunk of stream) {
		if (chunk.choices && chunk.choices.length > 0) {
			const newContent = chunk.choices[0].delta.content;
			out += newContent;
		}  
	}
	
	return out
}

export default openAiService;