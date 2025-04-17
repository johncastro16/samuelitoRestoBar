import axios from 'axios';

const WOMPI_BASE_URL = process.env.URL_BASE_WOMPI;
const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY;
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY;

export const createWompiPaymentLink = async (amountInCents, currency, description) => {
  try {
    const response = await axios.post(
      `${WOMPI_BASE_URL}/payment_links`,
      {
        name  : "Samuelito Restobar",
        description : description,
        single_use : true,
        collect_shipping: false,
        currency: currency,
        amount_in_cents: amountInCents
        },
      {
        headers: {
          Authorization: `Bearer ${WOMPI_PRIVATE_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.data.id; // Devuelve el id de pago
  } catch (error) {
    console.error("Error al crear el enlace de pago WOMPi:", error.response?.data || error.message);
    throw new Error("No se pudo generar el enlace de pago.");
  }
};