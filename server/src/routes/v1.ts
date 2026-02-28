import { Router } from "express";

import { requireAuth } from "../middleware/require-auth.js";

const v1Router = Router();

v1Router.get("/auth/me", requireAuth, (req, res) => {
  res.json({
    user: req.user,
  });
});

export { v1Router };
