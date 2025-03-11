import whatsappService from './whatsappService.js';
import appendToSheet from './googleSheetsService.js';
import openAiService from './openAiService.js';
import { response } from 'express';

class MessageHandler {

  constructor() {
    this.appointmentState = {};
    this.hiringState = {};
    this.assistandState = {};
  }

  async handleIncomingMessage(message, senderInfo) {
    try {
        if (message?.type === 'text') {
            const incomingMessage = message.text.body.toLowerCase().trim();
        if (this.isGreeting(incomingMessage)) {
            await this.sendWelcomeMessage(message.from, message.id, senderInfo);
            await this.sendWelcomeMenu(message.from);
          } else if (incomingMessage === 'ayuda') {
            await this.helpMenu(message.from);
          } else if (incomingMessage === 'carta') {
            await this.sendMedia(message.from);
          } else if (incomingMessage === 'ubicacion') {
            await this.sendLocation(message.from);
          } else if (incomingMessage === 'asesor') {
            await this.sendContact(message.from);
          } else if (this.appointmentState[message.from]) {
              await this.handleAppointmentFlow(message.from, incomingMessage);
          } else if (this.hiringState[message.from]) {
              await this.handleHiringFlow(message.from, incomingMessage);
          } else if (this.assistandState[message.from]) {
              await this.handleAssistandFlow(message.from, incomingMessage);
          } else {
              await this.handleMenuOption(message.from, incomingMessage);
          }
            await whatsappService.markAsRead(message.id);
          } else if (message?.type === 'interactive') {
              const option = message?.interactive?.button_reply?.id;
              await this.handleMenuOption(message.from, option);
              await whatsappService.markAsRead(message.id);
          }
    } catch (error) {
        console.log("Error: ", error);
    }
  }

  isGreeting(message) {
    const greetings = ["hola", "buenas", "buenos dias", "buenas tardes", "buenas noches", "saludos", "como estás", "hl", "gracias", "muchas gracias"];
    return greetings.includes(message);
  }

  getSenderName(senderInfo) {
    return senderInfo.profile?.name || senderInfo.wa_id || "Cliente";
  }

  async sendWelcomeMessage(to, messageId, senderInfo) {
    try {
        const name = this.getSenderName(senderInfo).match(/^(\w+)/)?.[1];
        const welcomeMessage = `¡Hola 👋 ${name}!\nBienvenido a *Samuelito RestoBar*🌭🍔🍟🍕\n\n¿En qué te puedo ayudar? 😊\n\nEscribe *ayuda* si la necesitas`;
        await whatsappService.sendMessage(to, welcomeMessage, messageId);
    } catch (error) {
        console.log("Error: ", error);
    }
  }

  async sendWelcomeMenu(to) {
    const menuMessage = "Elige una Opción"
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
    const menuMessage = "*¿Está correcta la información?*"
    const buttons = [
      {
        type: 'reply', reply: { id: 'opt1', title: 'Si, continuar ✅' }
      },
      {
        type: 'reply', reply: { id: 'option_1', title: 'No, corregir ❌' }
      }
    ];

    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async menuOpcional(to, op) {
    const menuMessage = "Quieres continuar?"
    const buttons = [
      {
        type: 'reply', reply: { id: 'op_1', title: 'Si ✅' }
      },
      {
        type: 'reply', reply: { id: 'option_2', title: 'No ❌' }
      },
      {
        type: 'reply', reply: { id: 'op_3', title: 'Hablar con asesor 🤵' }
      }
    ];

    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async menuUrl(to) {
    const bodyText = "Elige lo que quieres en nuestro menú y vuelve acá para decirme 😊: "
    const action =
    {
      name: "cta_url",
      parameters: {
        display_text: "Ver menú",
        url: "https://wa.me/c/573153652520"
      }
    };
    await whatsappService.sendUrl(to, bodyText, action);
  }

  waiting = (delay, callback) => {
    setTimeout(callback, delay);
  };
  
  async handleMenuOption(to, option) {
    let response;
    switch (option) {
      case 'option_1':
        this.hiringState[to] = { step: 'pedido' }
        response = "*Continuemos con tu pedido* 😊";
        break;
      case 'option_2':
        this.appointmentState[to] = { step: 'reserva' }
        await this.sendMediaEvento(to)
        response = "*Continuemos con tu reservación* 😊";
        break;
      case 'option_3':
        this.assistandState[to] = { step: 'question' };
        response = 'Realiza tu pregunta: ❓';
        break;

      case 'op_1':
        response = "¡Recibido!\nMuchas gracias por tu reserva 🤗\n\nTe esperamos!"
        await this.sendLocation(to);
        break;
      case 'option_4':
        response = "Te esperamos en nuestro restaurante! 📍"
        await this.sendLocation(to);
        break;
      case 'option_6':
        response = "Para hablar con un asesor escribe al siguiente contacto 📱"
        await this.sendContact(to);
        break;
      case 'opt1':
        response = '¡Pedido recibido!\nPronto nos pondremos en contacto contigo! 🤗';
        break;
      case 'op_3':
        response = 'Entiendo\nEspera un momento 🤗 te comunicaré con un asesor...';
        break;
      default:
        response = "Oops😔\nPorfa, elige una de las opciones del menú o escribe *Hola* para volver a empezar\nTambién, escribe *Carta* para verla.";
    }
    await whatsappService.sendMessage(to, response);
  }

  async handleAppointmentFlow(to, message) {
    const state = this.appointmentState[to];
    let response;
  
    switch (state.step) {
      case 'reserva':
        state.evento = "Festival Gastronómico Mexicano";
        state.step = 'nombre';
        response = "Para continuar con tu reserva danos los siguientes datos por favor 😊:\n\n*Nombre completo:*";
        break;
      case 'nombre':
        state.nombre = message;
        state.step = 'cantidad';
        response = `*Mesa para cuantos:* `;
        break;
      case 'cantidad':
        state.cantidad = message;
        state.step = 'hora';
        response = '*Hora:* ';
        break;
      case 'hora':
        state.hora = message;
        state.step = 'confirma';
        response = this.completeAppointment(to);
        this.menuOpcional(to)
        break;
      default:
        response = "Lo siento 😔 no entendí tu respuesta\nPor Favor, elige una de las opciones del menú.";
    }
    await whatsappService.sendMessage(to, response);
  }


  async handleHiringFlow(to, message) {
    const state = this.hiringState[to];
    let response;

    switch (state.step) {
      case 'pedido':
        state.step = 'producto';
        this.menuUrl(to);
        response = "Ahora, dime qué producto quieres comprar?";
        break;
      case 'producto':
        state.producto = message;
        state.step = 'nombre';
        response = "*Nombre completo:* ";
        break;
      case 'nombre':
        state.nombre = message;
        state.step = 'celular';
        response = '*Celular de contacto:* 📱';
        break;
      case 'celular':
        state.celular = message;
        state.step = 'direccion';
        response = '*Dirección de domicilio completa:* 🏠';
        break;
      case 'direccion':
        state.direccion = message;
        response = this.completeHiring(to);
        this.menuOpcionalHiring(to);
        break;
      default:
        response = "Lo siento 😔 no entendí tu respuesta\nPor Favor, elige una de las opciones del menú.";
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

  completeHiring(to) {
    const appointment = this.hiringState[to];
    delete this.hiringState[to];

    const userData = [
      to,
      appointment.nombre,
      appointment.producto,
      appointment.celular,
      appointment.direccion,
      new Date().toISOString()
    ]

    appendToSheet(userData);

    return `*Carrito de compras*🛍️🛒\n\n*Nombre completo:* ${appointment.nombre}\n*Pedido:* ${appointment.producto}\n*Celular:* ${appointment.celular}\n*Dirección:* ${appointment.direccion}\n\n*Confirma la información para continuar.* 😊`
  }

  completeAppointment(to) {
    const appointment = this.appointmentState[to];
    delete this.appointmentState[to];

    const userData = [
      to,
      appointment.nombre,
      appointment.evento,
      appointment.cantidad,
      appointment.hora,
      new Date().toISOString()
    ]

    appendToSheet(userData);

    return `*Resumen reservación* 📋\n\n*Nombre completo:* ${appointment.nombre}\n*Evento:* ${appointment.evento}\n*Cuantas personas:* ${appointment.cantidad}\n*Hora:* ${appointment.hora}\n\n*Verifica que la información esté correcta* 😊`
  }



  async handleAssistandFlow(to, message) {
    const state = this.assistandState[to];
    let response;

    const menuMessage = "¿Resolví tu pregunta?"
    const buttons = [
      { type: 'reply', reply: { id: 'option_4', title: "Si, Gracias 😊" } },
      { type: 'reply', reply: { id: 'option_3', title: 'Hacer otra pregunta' } },
      { type: 'reply', reply: { id: 'option_6', title: 'Asesor 🤵' } }
    ];

    if (state.step === 'question') {
      response = await openAiService(message);
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