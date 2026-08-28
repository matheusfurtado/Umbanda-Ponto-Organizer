import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { toNodeHandler } from "better-auth/node";
import { auth } from "@workspace/auth";
import router from "./routes";
import { webhookMercadoPago } from "./routes/webhooks";
import { logger } from "./lib/logger";

const app: Express = express();

// Atrás de proxy (Fly/Vercel): confia nos headers X-Forwarded-* (IP real, HTTPS).
app.set("trust proxy", true);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// CORS com credenciais (cookie de sessão httpOnly). Com credentials, a origem não pode ser "*";
// origin:true reflete a origem da requisição.
app.use(cors({ origin: true, credentials: true }));

// Handler do Better-Auth ANTES do express.json() (Express 5: wildcard nomeado "*splat").
// O Better-Auth lê o corpo cru da requisição; se o express.json() vier antes, o login trava.
app.all("/api/auth/*splat", toNodeHandler(auth));

// Webhook de pagamento ANTES do express.json() — precisa do corpo CRU p/ verificar a assinatura.
app.post("/api/webhooks/mercadopago", express.raw({ type: "*/*" }), webhookMercadoPago);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", router);

export default app;
