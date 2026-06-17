import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "ADMIN" | "TUTOR";
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "TUTOR";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "TUTOR";
  }
}
