import messageHandler from './messageHandler.js';

const SCREEN_RESPONSES = {
  RATE: {
    screen: "RATE",
    data: {},
  },
  SUCCESS: {
    screen: "SUCCESS",
    data: {},
  },
};

export const nextEncuesta = async (decryptedBody) => {
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
      case "RECOMMEND":
        const details = `Experiencia del clinte:    ${data.experiencia_cliente}\n
Servicio al cliente:   ${data.servicio_cliente}\n
Calidad de la comida:  ${data.calidad_comida}\n
Nos recomendaría:   ${data.recomendacion}\n
Que le gustaría que mejoraramos:   ${data.comentarios}`;

        return {
          ...SCREEN_RESPONSES.RATE,
          data: {
            details,
            ...data,
          },
        };
      case "RATE":
        // messageHandler.completeAppointment({...data});
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
