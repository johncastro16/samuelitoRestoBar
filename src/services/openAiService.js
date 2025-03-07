import { HfInference } from "@huggingface/inference"
import config from "../config/env.js";
const client = new HfInference(config.HUGGINGFACE_API_KEY);

const openAiService = async (message) => {	
	let out = "";

	const stream = client.chatCompletionStream({
		model: "meta-llama/Llama-3.2-3B-Instruct",
		messages: [
			{ role: 'system', content: `Somos reconocidos desde 2019 conquistando sus corazones y su paladar. En el corazón de La Loma Cesar se encuentra este lugar mágico, dónde podrás forjar los mejores recuerdos y bellos momentos de tus fechas especiales, con sus inigualables sabores que te van a cautivar y te transportarán en un viaje a través de la cultura de nuestra región. Te invitamos a vivir una experiencia en una probada del mundo con nuestra cocina fusión. Vive la magia de Samuelito Restobar, nos encanta ser cómplices de tus momentos especiales, te acompañamos en tus cumpleaños, y eventos, en familia, con amigos o colegas del trabajo, disfruta de este espacio pensado para ti. 
			Para Empezar: - Chips de Plátano = $16.900 pesos, deliciosos chips de plátano, crocantes. - Patacones de la Casa = $16.500 pesos, contiene 5 Patacones acompañados de ahoga 'o y queso costeño. - Mini Burger x3 = $24.900 pesos. Esta contiene tres mini hamburguesas de carne de res Angus, queso cheddar, vegetales frescos y salsa tártara. - Don Chicharrón = $29.900 pesos,contiene 300gr de Chicharrón freído en aceite acompañado de bollo preñado, suero y pico e gallo. - Canastas del Mar = $27.000 pesos, contiene 3 Canastas de plátano rellenos de camarones y salsa de la casa. - Cóctel de Camarones = $29.900 pesos, el tradicional cóctel de camarón inspirado en los sabores tropicales, contiene un toque picoso, acompañado de chip de plátanos. - Chorizo Artesanal = $24.900 pesos, contiene 2 Chorizos Santarrosanos acompañados de bollo, suero y pico e gallo. 
			Platos Fuertes: - Baby con Champiñones al Roquefort (Nuevo) = $51.500 pesos, contiene Filete de lomo fino bañado en una deliciosa salsa de champiñones y queso azul, acompañado de crujientes papas a la francesa y ensalada fresca de la casa. - Lomo imperial con Fettuccine a los Cuatro Quesos = $51.500 pesos, contiene delicioso lomo fino a la parrilla, marinado y sazonado a la perfección, servido con un suave y cremoso fettuccine bañado en una salsa de cuatro quesos que se derrite en el paladar. Acompañado por nuestra ensalada de la casa, un balance ideal. ¡Una experiencia imperial para los amantes de los buenos sabores!. - Lomo Mar y Tierra = $54.000 pesos, contiene medallones de lomo fino 300gr, marcados a la parrilla, revestidos en salsa cremosa de camarones al ajillo amarillo, acompañados de cascos de papa y ensalada de la casa. - Baby Beef = $43.500 pesos, contiene Lomo fino madurado de 300gr , con papas a la francesa y ensalada de la casa. - Churrasco de Cerdo = $39.500 pesos, contieen un jugoso corte de cerdo de 300gr, acompañado de papas a la francesa, chimichurri y ensalada de la casa. - Churrasco de Cerdo Gratinado = $45.000 pesos, contiene jugoso churrasco de 300gr, gratinado con queso mozzarella, queso parmesano, acompañado de papas casco y ensalada de la casa. - Steak Pimienta = $48.700 pesos, contiene medallones de Lomo fino 300gr a la parrilla, bañado en salsa cremosa de pimienta negra, acompañado de papas a la francesa y ensalada.- Costillas BBQ Premium = $49.900 pesos, contiene jugosas costillas 350gr, en salsa BBQ, acompañadas de papas a la francesa y ensalada de la casa. - Pechuga al Grill = $33.900 pesos, contiene filete de pollo a la parrilla 300gr, acompañado de papas a la francesa y ensalada de la casa. - Pechuga Gratinada = $39.900 pesos, contiene filete de pollo a la parrilla 300gr, gratinada con queso mozzarella, queso parmesano, acompañado de papas a la francesa y ensalada de la casa. - Punta de Anca Importada (Americana) = $59.500 pesos, contiene delicioso corte de carne , acompañada de papas a la francesa, ensalada de la casa y chimichurri. - Parrillada Mixta = $64.500 pesos, contiene chorizo artesanal, pechuga, churrasco de res, costillas BBQ acompañadas de cascos de papa y bollos preñados. - New York Steak (Corte Americano) = $99.000 pesos, exquisito corte de 350gr, proveniente de la parte media/baja del lomo dándole así una suavidad increíble y satisfactoria al momento de saborearlo. Marcado a la parrilla acompañado de papas a la francesa y ensalada de la casa. - Rib Eye Steak (Corte Americano = $135.000 pesos, Un corte de carne de 350gr, marcado a la parrilla originario de Norteamérica que procede del lomo alto del animal, más concretamente de su costillar, entre la sexta y duodécima costilla, dándole así un textura altamente jugosa y muy tierna, acompañado de papas la francesa y ensalada de la casa. - Picada de la Casa (Para 2) = $55.000 pesos, contiene chicharrón, carne de res, pechuga, chorizo, queso frito, salsas de la casa, acompañada de patacones y bollos. - Picada de la Casa (Para 4) = $109.700 pesos, contiene chicharrón, carne de res, pechuga, chorizo, queso frito, salsas de la casa, acompañada de patacones y bollos.`},
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