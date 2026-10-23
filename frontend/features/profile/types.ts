import type { CurrentUser } from "../shared/types";
export type ProfileForm = Pick<CurrentUser, "name" | "email">;
