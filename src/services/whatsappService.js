import sendToWhatsApp from "../services/httpRequest/sendToWhatsApp.js";

class WhatsAppService {
  async sendMessage(to, body, messageId) {
    try {
      const data = {
        messaging_product: 'whatsapp',
        to,
        text: { body },
      };

      await sendToWhatsApp(data);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async markAsRead(messageId) {
    try {
      const data = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      };
  
      await sendToWhatsApp(data);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  async sendInteractiveButtons(to, bodyText, buttons) {
    try {
      const data = {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: "button",
          body: { text: bodyText },
          action: {
            buttons: buttons,
          },
        },
      };

      await sendToWhatsApp(data);
    } catch (error) {
      console.log("Error: ", error);
    }
  }

  async sendUrl(to, action) {
    try {
      const data = {
        recipient_type: 'individual',
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: "flow",
          header: {
            type: "text",
            text: "Hacer pedido"
          },
          body: { 
            text: "Haz clic aquí 👇" 
          },
          action
        },
      };
  
      await sendToWhatsApp(data);
    } catch (error) {
      console.log("Error: ", error);
    }
  }

  async sendMediaMessage(to, type, mediaUrl, caption) {
    try {
      
      const mediaObject = {};
  
      switch (type) {
        case 'image':
          mediaObject.image = { link: mediaUrl, caption: caption };
          break;
        case 'audio':
          mediaObject.audio = { link: mediaUrl };
          break;
        case 'video':
          mediaObject.video = { link: mediaUrl, caption: caption };
          break;
        case 'document':
          mediaObject.document = { link: mediaUrl, caption: caption, filename: 'carta-FestivalMexicano.pdf' };
          break;
        default:
          throw new Error('Not Supported Media Type');
      }
  
      const data = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: type,
        ...mediaObject,
      };
  
      await sendToWhatsApp(data);
    } catch (error) {
      console.log("Error: ", error);
    }
  }

  async sendContactMessage(to, contact) {
    try {
      const data = {
        messaging_product: 'whatsapp',
        to,
        type: 'contacts',
        contacts: [contact],
      };
  
      await sendToWhatsApp(data);
      
    } catch (error) {
      console.log("Error: ", error);
    }
  }

  async sendLocationMessage(to, latitude, longitude, name, address) {
    try {
      
      const data = {
        messaging_product: 'whatsapp',
        to,
        type: 'location',
        location: {
          latitude: latitude,
          longitude: longitude,
          name: name,
          address: address
        }
      };
      
      await sendToWhatsApp(data);
    } catch (error) {
      console.log("Error: ", error);
    }
  }
}

export default new WhatsAppService();