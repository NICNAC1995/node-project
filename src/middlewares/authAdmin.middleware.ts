import { MiddlewareFn } from "type-graphql";
import { verify } from "jsonwebtoken";
import { Response, Request } from "express";
import { environment } from "../config/environment";

export interface IContextAdmin {
  req: Request;
  res: Response;
  payload: { adminId: string };
}

export const adminIsAuth: MiddlewareFn<IContextAdmin> = ({ context }, next) => {
  try {
    const bearerAdminToken = context.req.headers["authorization"];

    if (!bearerAdminToken) {
      throw new Error("Unauthorized");
    }

    const jwt = bearerAdminToken.split(" ")[1];
    const payload = verify(jwt, environment.JWTADMIN_SECRET);
    context.payload = payload as any;
  } catch (e) {
    throw new Error(e);
  }

  return next();
};
