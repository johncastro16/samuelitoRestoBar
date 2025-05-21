import whatsappService from './whatsappService.js';
import appendToSheet from './googleSheetsService.js';
import openAiService from './openAiService.js';
import { createWompiPaymentLink } from './wompiService.js';

function isWithinBusinessHours() {
  // Hora actual en Colombia (GMT-5)
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const colombiaTime = new Date(utc - (5 * 60 * 60000));
  const hour = colombiaTime.getHours();
  const minute = colombiaTime.getMinutes();

  // Horario: 12:00 (12 p.m.) a 22:00 (10 p.m.)
  const opening = 12 * 60; // 12:00 p.m. en minutos
  const closing = 22 * 60; // 10:00 p.m. en minutos
  const current = hour * 60 + minute;

  return current >= opening && current < closing;
}

class MessageHandler {

  constructor() {
    this.appointmentState = {};
    this.assistandState = {};
  }

  async handleIncomingMessage(message, senderInfo, screen, datosReserva, datosPedido, pedidoStr) {
    try {
      if (isWithinBusinessHours()) {
        if (message?.type === 'text') {
          const incomingMessage = message.text.body.toLowerCase().trim();
        if (this.isGreeting(incomingMessage)) {
            await this.sendWelcomeMessage(message.from, message.id, senderInfo);
            await this.sendWelcomeMenu(message.from);
          } else if (incomingMessage === 'ayuda') {
            await this.helpMenu(message.from);
          } else if (incomingMessage === 'carta') {
            await this.sendMedia(message.from);
          } else if (incomingMessage === 'ubicacion' || incomingMessage === 'ubicación') {
            await this.sendLocation(message.from);
          } else if (incomingMessage === 'asesor') {
            await this.sendContact(message.from);
          } 
           else if (this.isQuestion(incomingMessage)) {
            this.assistandState[message.from] = { step: 'question' };
            await this.handleAssistandFlow(message.from, incomingMessage);
          } 
          else if (this.appointmentState[message.from]) {
            await this.handleAppointmentFlow(message.from, incomingMessage);
          } 
          else if (this.assistandState[message.from]) {
            await this.handleAssistandFlow(message.from, incomingMessage);
          } 
          else {
            await this.handleMenuOption(message.from, incomingMessage);
          }
            await whatsappService.markAsRead(message.id);
          } else if (message?.type === 'interactive') {
            if (message?.interactive.type === 'nfm_reply') {
              await this.respFlow(message.from, screen, datosReserva, datosPedido, pedidoStr);
              await whatsappService.markAsRead(message.id);
            }
            else {
              const option = message?.interactive?.button_reply?.id;
              await this.handleMenuOption(message.from, option);
              await whatsappService.markAsRead(message.id);
            }
          }
      } else {
        const msg = "¡Hola! 😊\nNuestro horario de atención es *todos los días* de *12:00 p.m. a 10:00 p.m.*\nPor favor vuelve a escribirnos en nuestro horario laboral o déjanos tu mensaje y pronto te responderemos. ¡Gracias por escribirnos! 😊";
        await whatsappService.sendMessage(message.from, msg, message.id);
        return;
      }
  } catch (error) {
    console.log("Error: ", error);
  }
}

  isGreeting(message) {
    const greetings = ["hola", "hi", "hello", "HL", "Oe", "buenas", "buenos dias", "buenas tardes", "buenas noches", "saludos", "como estás", "hl", "gracias", "muchas gracias"];
    return greetings.includes(message);
  }
  
  isQuestion(message) {
  const lower = message.toLowerCase();
  return (
    lower.includes('que') ||
    lower.includes('qué') ||
    lower.includes('quien') ||
    lower.includes('quién') ||
    lower.includes('cual') ||
    lower.includes('cuál') ||
    lower.includes('cuando') ||
    lower.includes('cuándo') ||
    lower.includes('porque') ||
    lower.includes('por que') ||
    lower.includes('porqué') ||
    lower.includes('por qué') ||
    lower.includes('para que') ||
    lower.includes('para qué') ||
    lower.includes('donde') ||
    lower.includes('dónde') ||
    lower.includes('como') ||
    lower.includes('cómo') ||
    lower.includes('cuanto') ||
    lower.includes('cuánto') ||
    lower.includes('pregunta') ||
    lower.includes('¿') ||
    lower.includes('?')
  );
}

  getSenderName(senderInfo) {
    return senderInfo.profile?.name || senderInfo.wa_id || "Cliente";
  }

  async sendWelcomeMessage(to, messageId, senderInfo) {
    try {
        const name = this.getSenderName(senderInfo).match(/^(\w+)/)?.[1];
        const welcomeMessage = `¡Hola 👋 ${name}!\nBienvenid@ a *Samuelito RestoBar*🌭🍔🍟🍕\n\n¿En qué te puedo ayudar? 😊\n\nEscribe *ayuda* si la necesitas`;
        await whatsappService.sendMessage(to, welcomeMessage, messageId);
    } catch (error) {
        console.log("Error: ", error);
    }
  }

  async sendWelcomeMenu(to) {
    const menuMessage = "Elige una Opción";
    const buttons = [
      {
        type: 'reply', reply: { id: 'option_1', title: 'Pedido 🛒' }
      },
      {
        type: 'reply', reply: { id: 'option_2', title: 'Reservas 📋' }
      },
      {
        type: 'reply', reply: { id: 'option_3', title: 'Hablar con asesor 🤵' }
      }
    ];

    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async menuOpcionalHiring(to) {
    const menuMessage = "¿Nos ayudarías respondiendo una pequeña encuesta?";
    const buttons = [
      {
        type: 'reply', reply: { id: 'opt1', title: 'Si, continuar ✅' }
      },
      {
        type: 'reply', reply: { id: 'option_5', title: 'No, terminar ✖' }
      }
    ];

    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async menuOpcional(to, op) {
    const menuMessage = "Quieres continuar?";
    const buttons = [
      {
        type: 'reply', reply: { id: 'op_1', title: 'Si ✅' }
      },
      {
        type: 'reply', reply: { id: 'option_2', title: 'No ✖' }
      },
      {
        type: 'reply', reply: { id: 'op_3', title: 'Hablar con asesor 🤵' }
      }
    ];

    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async menuPedido(to) {
    const action = {
      name: "flow",
      parameters: {
        "flow_message_version": "3",
        "flow_id": "1293383568429390",
        "flow_cta": "Pedido"
      },
    }
    return await whatsappService.sendFlow(to, action);
  }
  
  async menuReserva(to) {
    const action = {
      name: "flow",
      parameters: {
        "flow_message_version": "3",
        "flow_id": "1040184084592472",
        "flow_cta": "Reserva"
      },
    }
    return await whatsappService.sendFlowReserva(to, action);
  }
  
  async menuCarta(to) {
    const template = { 
      name: "catalogo",
      language: { 
          code: "Es_Co" },
      components: [
          {
            type: "button",
            sub_type: "MPM",
            index: 0,
            "parameters": [
          {
            "type": "action",
            "action": {
              "sections": [
                {
                  "title": "PARA PICAR",
                  "product_items": [
                    {
                      "product_retailer_id": "Chips de Plátano"
                    },
                    {
                      "product_retailer_id": "Patacones de la Casa"
                    },
                    {
                      "product_retailer_id": "Mini Burger x3"
                    },
                    {
                      "product_retailer_id": "Don Chicharrón"
                    },
                    {
                      "product_retailer_id": "Canastas del Mar"
                    },
                    {
                      "product_retailer_id": "Cóctel de Camarones"
                    },
                    {
                      "product_retailer_id": "Chorizo Artesanal"
                    },
                  ]
                },
                {
                  "title": "PLATOS FUERTES",
                  "product_items": [
                    {
                      "product_retailer_id": "Baby con Champiñones al Roquefort (Nuevo)"
                    },
                    {
                      "product_retailer_id": "Lomo imperial con Fettuccine a los Cuatro Quesos"
                    },
                    {
                      "product_retailer_id": "Lomo Mar y Tierra"
                    },
                    {
                      "product_retailer_id": "Baby Beef"
                    },
                    {
                      "product_retailer_id": "Churrasco de Cerdo"
                    },
                    {
                      "product_retailer_id": "Churrasco de Cerdo Gratinado"
                    },
                    {
                      "product_retailer_id": "Steak Pimienta"
                    },
                    {
                      "product_retailer_id": "Costillas BBQ Premium"
                    },
                    {
                      "product_retailer_id": "Pechuga al Grill"
                    },
                    {
                      "product_retailer_id": "Pechuga Gratinada"
                    },
                    {
                      "product_retailer_id": "Punta de Anca Importada (Americana)"
                    },
                    {
                      "product_retailer_id": "Parrillada Mixta"
                    },
                    {
                      "product_retailer_id": "New York Steak"
                    },
                    {
                      "product_retailer_id": "Picada de la Casa (Para 2)"
                    },
                    {
                      "product_retailer_id": "Picada de la Casa (Para 4)"
                    },
                  ]
                }
              ]
            }
          }
        ]
          }
      ] 
  }
    
    return await whatsappService.sendMenu(to, template);
  }

  async menuCarta2(to) {
    const template = { 
      name: "menucarta",
      language: { 
          code: "Es_Co" },
      components: [
          {
            type: "button",
            sub_type: "MPM",
            index: 0,
            "parameters": [
          {
            "type": "action",
            "action": {
              "sections": [
                {
                  "title": "PASTAS",
                  "product_items": [
                    {
                      "product_retailer_id": "Pastas al Ajillo"
                    },
                  ]
                },
                {
                  "title": "PESCADOS Y MARISCOS",
                  "product_items": [
                    {
                      "product_retailer_id": "Cazuela de Mariscos"
                    },
                  ]
                },
                {
                  "title": "ARROCES",
                  "product_items": [
                    {
                      "product_retailer_id": "Arroz Samuelito"
                    },
                    {
                      "product_retailer_id": "Arroz con Camarones"
                    },
                  ]
                },
                {
                  "title": "SÁNDWICHES",
                  "product_items": [
                    {
                      "product_retailer_id": "Club Sándwich"
                    },
                  ]
                },
                {
                  "title": "SUSHI",
                  "product_items": [
                    {
                      "product_retailer_id": "Sushi Samuelito Rolls"
                    },
                  ]
                },
                {
                  "title": "COMIDAS RÁPIDAS",
                  "product_items": [
                    {
                      "product_retailer_id": "Burger La Nuestra"
                    },
                    {
                      "product_retailer_id": "Burger la del Chef"
                    },
                    {
                      "product_retailer_id": "Clasic Burger"
                    },
                    {
                      "product_retailer_id": "La Felipa Burger"
                    },
                    {
                      "product_retailer_id": "Samuelito Burger"
                    },
                    {
                      "product_retailer_id": "Hot Dog Suizo"
                    },
                    {
                      "product_retailer_id": "Desgranado Pupero"
                    },
                  ]
                }
              ]
            }
          }
        ]
          }
      ] 
  }
    
    return await whatsappService.sendMenu(to, template);
  }
  
  async encuesta(to) {
    const action = {
      name: "flow",
      parameters: {
        "flow_message_version": "3",
        "flow_id": "1073257407961051",
        "flow_cta": "Encuesta de satisfacción"
      },
    }
    return await whatsappService.sendFlowEncuesta(to, action);
  }

  waiting = (delay, callback) => {
    setTimeout(callback, delay);
  };
  
  async handleMenuOption(to, option) {
    let response;
    switch (option) {
      case 'option_1':
        await this.menuCarta(to);
        await this.menuCarta2(to);
        response = "Elige lo que quieres pedir en nuestro menú: ";
        break;
      case 'option_2':
        this.appointmentState[to] = { step: 'reserva' }
        await this.sendMediaEvento(to);
        response = "Para continuar con tu reservación escribe *Ok* 😊";
        break;
      case 'option_3':
        this.assistandState[to] = { step: 'question' };
        response = 'Realiza tu pregunta: ❔';
        break;
      case 'option_4':
        response = "Te esperamos en nuestro restaurante! 📍";
        await this.sendLocation(to);
        break;
      case 'option_5':
        response = "Es un placer para nosotros servirles, esperamos pueda disfrutar de su pedido 😊👩‍🍳\nVuelve pronto!";
        break;
      case 'op_3':
        response = 'Entiendo\nEspera un momento 🤗 te comunicaré con un asesor...';
        break;
      case 'opt1':
        await this.encuesta(to);
        response = "Aquí tienes 👆";
        break;
      default:
        response = "Oops😔\nPorfa, elige una de las opciones del menú o escribe *Hola* para volver a empezar\nTambién, escribe *Carta* para verla.";
    }
    await whatsappService.sendMessage(to, response);
  }

  async handleAppointmentFlow(to, message) {
    const state = this.appointmentState[to];
    delete this.appointmentState[to];
    let response;
  
    switch (state.step) {
      case 'reserva':
        await this.menuReserva(to);
        break;
      default:
        response = "Lo siento 😔 no entendí tu respuesta\nPor Favor, elige una de las opciones del menú.";
        await whatsappService.sendMessage(to, response);
      }
  }

  async handleHiringFlow(to, pedido) {
    let response;

    response = `*Pedido:*

${pedido}`;
    await this.menuPedido(to);

      await whatsappService.sendMessage(to, response);
  }

  async respFlow(to, screen, datosReserva, datosPedido, pedidoStr) {
    let response;
    if (screen === "SUMMARY") {
      if (datosPedido.datos.pago === "Efectivo") {
        response = "¡Pedido recibido!\nPronto nos pondremos en contacto contigo! 🤗";
      } else if (datosPedido.datos.pago === "PSE") {
        try {
          // Generar enlace de pago WOMPi
          const idlink = await createWompiPaymentLink(
            datosPedido.monto * 100, // Monto en centavos
            "COP",
            pedidoStr
          );
  
          response = `Resumen de tu pedido🛒:\n\n${pedidoStr}\n\nUtiliza el siguiente *link de pago*:\n\nhttps://checkout.wompi.co/l/${idlink}\n\nLuego, envíanos el comprobante para confirmar tu pedido. ¡Gracias! 😊`;
        } catch (error) {
          response = "Hubo un problema al generar el enlace de pago. Por favor, intenta nuevamente.";
        }
        // this.menuOpcionalHiring(to);
    }
   } else if (screen === "RESUMEN") {
      datosReserva = `
Nombre: ${datosReserva.nombre},
Fecha:  ${datosReserva.fecha},
Hora: ${datosReserva.hora},
Cuantas personas: ${datosReserva.cuantos}
      `
      response = `Recibido ✅\n\nAcabas de Reservar: \n${datosReserva}\n\nUna nueva experiencia te espera!`;
      this.sendLocation(to);
    } else if (screen === "RECOMMEND") {
      response = "¡Recibido!\nMuchas gracias por tu opinión! 🤗";
    }
  
    await whatsappService.sendMessage(to, response);
}


  async helpMenu(to) {
    const response = "Bienvenido al menú de ayuda de *Samuelito Restobar*\n\nPara solicitar la carta escribe *Carta*\nPara hablar con un asesor escribe *Asesor*\nPara solicitar la ubicación escribe *Ubicacion*\n\nEspero te sirva! 😊"
  
    await whatsappService.sendMessage(to, response);
  }

  async sendMedia(to) {
    const mediaUrl = 'https://micarta.s3.us-east-1.amazonaws.com/Men%C3%BA+festival+mexicano.pdf';
    const caption = '¡Aquí tienes la carta!';
    const type = 'document';

    await whatsappService.sendMediaMessage(to, type, mediaUrl, caption);
  }
  
  async sendMediaEvento(to) {
    const mediaUrl = 'https://static.wixstatic.com/media/d1effb_971fd524797549a89cfc903371dbd42d~mv2.png/v1/crop/x_120,y_0,w_1530,h_1155/fill/w_1035,h_782,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/Festival%20mexicano%20logo.png';
    const caption = '¡Festival Gastronómico Mexicano!\n8 y 9 de Marzo, te esperamos!';
    const type = 'image';

    await whatsappService.sendMediaMessage(to, type, mediaUrl, caption);
  }

  completeHiring(data) {
    let userData;
    const spreadsheetId = "1JCQABunMdGF4lfOWwpxbxbmicx2kL0zYyNlHNCWuyxM";

      userData = [
        data.name,
        data.producto,
        data.address,
        data.phone,
        data.pago,
        data.recomendacion,
        new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
      ]

    appendToSheet(userData, spreadsheetId);
  }

  completeAppointment(data) {
    const spreadsheetId = "1atxEZcRm6etjz35vBEJmCJkCKZHvs9A3n76IEeZ3Ldw";
    const userData = [
      data.nombre,
      data.fecha,
      data.hora,
      data.cuantos,
      data.donde,
      new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })
    ]

    appendToSheet(userData, spreadsheetId);
  }

  async handleAssistandFlow(to, message) {
    const state = this.assistandState[to];
    let response;

    const menuMessage = "¿Resolví tu pregunta?";
    const buttons = [
      { type: 'reply', reply: { id: 'option_4', title: "Si, Gracias 😊" } },
      { type: 'reply', reply: { id: 'option_3', title: 'Hacer otra pregunta' } }
    ];

    switch (state.step) {
      case 'question':
        response = await openAiService(message);
        break;
      default:
        response = "Lo siento 😔 no entendí tu respuesta\nPor Favor, elige una de las opciones del menú.";
    }

    delete this.assistandState[to];
    await whatsappService.sendMessage(to, response);
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async sendContact(to) {
    const contact = {
      addresses: [
        {
          street: "Carrera 7 #9-60",
          city: "La Loma",
          state: "Cesar",
          zip: "201038",
          country: "Colombia",
          country_code: "CO",
          type: "WORK"
        }
      ],
      emails: [
        {
          email: "samuelitorestobar@gmail.com",
          type: "WORK"
        }
      ],
      name: {
        formatted_name: "Samuelito RestoBar",
        first_name: "Samuelito",
        last_name: "RestoBar",
        middle_name: "",
        suffix: "",
        prefix: ""
      },
      org: {
        company: "Samuelito RestoBar",
        department: "Atención al Cliente",
        title: "Representante"
      },
      phones: [
        {
          phone: "+573153652520",
          wa_id: "573153652520",
          type: "WORK"
        }
      ],
      urls: [
        {
          url: "https://www.samuelitorestobar.com/",
          type: "WORK"
        }
      ]
    };

    await whatsappService.sendContactMessage(to, contact);
  }

  async sendLocation(to) {
    const latitude = 9.619971;
    const longitude = -73.592176;
    const name = 'Samuelito Restobar';
    const address = 'Cll 10 #9-133, La Loma, El Paso, Cesar'

    await whatsappService.sendLocationMessage(to, latitude, longitude, name, address);
  }

}

export default new MessageHandler();