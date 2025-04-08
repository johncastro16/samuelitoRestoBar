import messageHandler from './messageHandler.js';

const SCREEN_RESPONSES = {
  RESUMEN: {
    screen: "RESUMEN",
    data: {},
  },
  SUCCESS: {
    screen: "SUCCESS",
    data: {},
  },
};

export const nextScreen = async (decryptedBody) => {
  const { screen, data, version, action, flow_token } = decryptedBody;
  // handle health check request
  if (action === "ping") {
    return {
      data: {
        status: "active",
      },
    };
  }

  // handle error notification
  if (data?.error) {
    console.warn("Received client error:", data);
    return {
      data: {
        acknowledged: true,
      },
    };
  }

  if (action === "data_exchange") {
    switch (screen) {
      case "RESERVA":
        const details = `Nombre:    ${data.nombre}\n
Fecha de reserva:   ${data.fecha}\n
Hora de reserva:  ${data.hora}\n
Cuantas personas:   ${data.cuantos}\n
De donde nos visitas:   ${data.donde}`;
        return {
          ...SCREEN_RESPONSES.RESUMEN,
          data: {
            details,
            ...data,
          },
        };
      case "RESUMEN":
        messageHandler.completeAppointment({...data});
        return {
          ...SCREEN_RESPONSES.SUCCESS,
          data: {
            extension_message_response: {
              params: {
                flow_token,
              },
            },
          },
        };

      default:
        break;
    }
  }

  console.error("Unhandled request body:", decryptedBody);
  throw new Error(
    "Unhandled endpoint request. Make sure you handle the request action & screen logged above."
  );
};
