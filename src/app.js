import express from 'express';
import config from './config/env.js';
import webhookRoutes from './routes/webhookRoutes.js';

const app = express();
app.use(express.json({
  // store the raw request body to use it for signature verification
  verify: (req, res, buf, encoding) => {
    req.rawBody = buf?.toString(encoding || "utf8");
  },
}));

app.use('/', webhookRoutes);

app.get('/', (req, res) => {
  res.send(`<pre>Nothing to see here.
Checkout README.md to start.</pre>`);
});

app.listen(config.PORT, () => {
  console.log(`Server is listening on port:  ${config.PORT}`);
});