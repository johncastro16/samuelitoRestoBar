import config from '../config/env.js';
import { decryptRequest, encryptResponse, FlowEndpointException } from "../services/encryption.js";
import { getNextScreen } from "../services/flow.js";
import { nextScreen } from "../services/flowReserva.js";
import { nextEncuesta } from "../services/flowEncuesta.js";
import { nextMenu } from "../services/flowMenu.js";
import messageHandler from '../services/messageHandler.js';
import crypto from "crypto";
import fs from 'fs';

const privateKey = fs.readFileSync('./private_key_pkcs8.pem', 'utf8');
function isRequestSignatureValid(req) {
  if(!config.APP_SECRET) {
    console.warn("App Secret is not set up. Please Add your app secret in /.env file to check for request validation");
    return true;
  }
  
  const signatureHeader = req.get("x-hub-signature-256");
  const signatureHeaderSha = signatureHeader.replace("sha256=", "");
  const signatureBuffer = Buffer.from(signatureHeaderSha, "utf-8");
  
  const hmac = crypto.createHmac("sha256", config.APP_SECRET);
  const digestString = hmac.update(req.rawBody).digest('hex');
  const digestBuffer = Buffer.from(digestString, "utf-8");

  if ( !crypto.timingSafeEqual(digestBuffer, signatureBuffer)) {
    return false;
  }
  return true;
}

let ventana;
let pedido = {};
let productos;
let pedidoStr;
class WebhookController {
  async handleIncoming(req, res) {
    const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
    const senderInfo = req.body.entry?.[0]?.changes[0]?.value?.contacts?.[0];
    if (message) {
      if (message?.type === 'interactive' && message?.interactive.type === 'nfm_reply') {
        await messageHandler.handleIncomingMessage(message, senderInfo, ventana);
      }
      else if (message?.type === 'order') {
        productos = message?.order.product_items;
        for (let i = 0; i < productos.length; i++) {
          pedido[productos[i].product_retailer_id] = productos[i].quantity;
        }
        pedidoStr = Object.entries(pedido).map(([key, value]) => `${key}: ${value}`).join(',\n');
        pedido = {};
        await messageHandler.handleHiringFlow(message.from, pedidoStr);
      }
      else {
        await messageHandler.handleIncomingMessage(message, senderInfo);
      }
    }
    res.sendStatus(200);
  }

  async handleFlow(req, res) {
    if (!privateKey) {
      throw new Error(
        'Private key is empty. Please check your env variable "PRIVATE_KEY".'
      );
    }

    if(!isRequestSignatureValid(req)) {
      return res.status(432).send();
    }

    let decryptedRequest = null;
    try {
      decryptedRequest = decryptRequest(req.body, privateKey, config.PASSPHRASE);
    } catch (err) {
      console.error(err);
      if (err instanceof FlowEndpointException) {
        return res.status(err.statusCode).send();
      }
      return res.status(500).send();
    }

    
    const { aesKeyBuffer, initialVectorBuffer, decryptedBody } = decryptedRequest;
    // handle health check request
    let screenResponse;
    if (decryptedBody.screen === 'DETAILS' || decryptedBody.screen === "SUMMARY") {
      screenResponse = await getNextScreen(decryptedBody, pedidoStr);
    } else if (decryptedBody.screen === 'RESERVA' || decryptedBody.screen === "RESUMEN") {
      screenResponse = await nextScreen(decryptedBody);
    } else if (decryptedBody.screen === 'RECOMMEND' || decryptedBody.screen === "RATE") {
      screenResponse = await nextEncuesta(decryptedBody);
    }
    if (decryptedBody.action === "ping") {
      screenResponse = await getNextScreen(decryptedBody);
    }
    ventana = decryptedBody.screen

    res.send(encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer));
    
  };


  verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === config.WEBHOOK_VERIFY_TOKEN) {
      res.status(200).send(challenge);
      console.log('Webhook verified successfully!');
    } else {
      res.sendStatus(403);
    }
  }
}

export default new WebhookController();